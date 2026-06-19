import { describe, it, expect } from "vitest";
import {
  isValidQuantity,
  calculateTransportEmissions,
  calculateEnergyEmissions,
  calculateFoodEmissions,
  calculateWasteEmissions,
  summarizeEntries,
  findHighestImpactCategory,
  compareToBenchmark,
  buildDailyHistory,
  calculateStreak,
} from "../calculations";

describe("isValidQuantity", () => {
  it("accepts positive finite numbers", () => {
    expect(isValidQuantity(5)).toBe(true);
    expect(isValidQuantity(0)).toBe(true);
  });

  it("rejects negative numbers", () => {
    expect(isValidQuantity(-1)).toBe(false);
  });

  it("rejects NaN and Infinity", () => {
    expect(isValidQuantity(NaN)).toBe(false);
    expect(isValidQuantity(Infinity)).toBe(false);
  });

  it("rejects non-number types, including strings that look numeric", () => {
    expect(isValidQuantity("5")).toBe(false);
    expect(isValidQuantity(null)).toBe(false);
    expect(isValidQuantity(undefined)).toBe(false);
  });
});

describe("calculateTransportEmissions", () => {
  it("calculates correct emissions for a known mode", () => {
    expect(calculateTransportEmissions("car_petrol", 10)).toBeCloseTo(1.92, 3);
  });

  it("returns 0 for zero-emission modes like cycling", () => {
    expect(calculateTransportEmissions("bicycle", 50)).toBe(0);
  });

  it("returns 0 for an unrecognized mode", () => {
    expect(calculateTransportEmissions("hovercraft", 10)).toBe(0);
  });

  it("returns 0 for invalid distance input rather than throwing", () => {
    expect(calculateTransportEmissions("car_petrol", -5)).toBe(0);
    expect(calculateTransportEmissions("car_petrol", NaN)).toBe(0);
    expect(calculateTransportEmissions("car_petrol", "10")).toBe(0);
  });
});

describe("calculateEnergyEmissions", () => {
  it("calculates correct emissions for grid electricity", () => {
    expect(calculateEnergyEmissions("electricity_grid", 10)).toBeCloseTo(4.75, 3);
  });

  it("renewable electricity has a much lower factor than grid", () => {
    const renewable = calculateEnergyEmissions("electricity_renewable", 10);
    const grid = calculateEnergyEmissions("electricity_grid", 10);
    expect(renewable).toBeLessThan(grid);
  });
});

describe("calculateFoodEmissions", () => {
  it("defaults to 1 serving when not specified", () => {
    expect(calculateFoodEmissions("vegan_meal")).toBeCloseTo(0.52, 3);
  });

  it("scales linearly with servings", () => {
    expect(calculateFoodEmissions("vegan_meal", 2)).toBeCloseTo(1.04, 3);
  });

  it("red meat has a higher footprint than vegan per serving", () => {
    const meat = calculateFoodEmissions("red_meat_meal", 1);
    const vegan = calculateFoodEmissions("vegan_meal", 1);
    expect(meat).toBeGreaterThan(vegan);
  });
});

describe("calculateWasteEmissions", () => {
  it("composting has a lower factor than landfill", () => {
    const composted = calculateWasteEmissions("composted", 5);
    const landfill = calculateWasteEmissions("landfill", 5);
    expect(composted).toBeLessThan(landfill);
  });
});

describe("summarizeEntries", () => {
  it("sums entries correctly by category", () => {
    const entries = [
      { category: "transport", kgCO2e: 2 },
      { category: "transport", kgCO2e: 3 },
      { category: "food", kgCO2e: 1.5 },
    ];
    const { totals, grandTotal } = summarizeEntries(entries);
    expect(totals.transport).toBe(5);
    expect(totals.food).toBe(1.5);
    expect(totals.energy).toBe(0);
    expect(grandTotal).toBe(6.5);
  });

  it("ignores malformed entries instead of throwing or corrupting totals", () => {
    const entries = [
      { category: "transport", kgCO2e: 2 },
      { category: "transport", kgCO2e: NaN },
      { category: "unknown_category", kgCO2e: 100 },
      null,
      undefined,
    ];
    const { totals, grandTotal } = summarizeEntries(entries);
    expect(totals.transport).toBe(2);
    expect(grandTotal).toBe(2);
  });

  it("returns all-zero totals for an empty list", () => {
    const { totals, grandTotal } = summarizeEntries([]);
    expect(grandTotal).toBe(0);
    expect(totals.transport).toBe(0);
  });
});

describe("findHighestImpactCategory", () => {
  it("identifies the category with the largest total", () => {
    const totals = { transport: 5, energy: 8, food: 2, waste: 1 };
    expect(findHighestImpactCategory(totals)).toBe("energy");
  });

  it("returns null when nothing has been logged", () => {
    const totals = { transport: 0, energy: 0, food: 0, waste: 0 };
    expect(findHighestImpactCategory(totals)).toBeNull();
  });
});

describe("compareToBenchmark", () => {
  it("flags totals within target as within_target", () => {
    const result = compareToBenchmark(4, 11.5, 5.5);
    expect(result.status).toBe("within_target");
  });

  it("flags totals between target and benchmark as below_average", () => {
    const result = compareToBenchmark(8, 11.5, 5.5);
    expect(result.status).toBe("below_average");
  });

  it("flags totals above benchmark as above_target", () => {
    const result = compareToBenchmark(15, 11.5, 5.5);
    expect(result.status).toBe("above_target");
  });

  it("handles invalid input gracefully", () => {
    const result = compareToBenchmark(NaN, 11.5, 5.5);
    expect(result.status).toBe("unknown");
  });
});

describe("buildDailyHistory", () => {
  it("returns an array with `days` entries", () => {
    const history = buildDailyHistory([], 7);
    expect(history.length).toBe(7);
  });

  it("buckets entries into the correct day", () => {
    const today = new Date().toISOString().slice(0, 10);
    const entries = [
      { category: "food", kgCO2e: 3, timestamp: `${today}T10:00:00.000Z` },
      { category: "transport", kgCO2e: 2, timestamp: `${today}T12:00:00.000Z` },
    ];
    const history = buildDailyHistory(entries, 7);
    const todayBucket = history.find((h) => h.date === today);
    expect(todayBucket).toBeDefined();
    expect(todayBucket.total).toBeCloseTo(5, 2);
  });

  it("days outside the window are not included", () => {
    const old = new Date();
    old.setDate(old.getDate() - 30);
    const entries = [{ category: "food", kgCO2e: 5, timestamp: old.toISOString() }];
    const history = buildDailyHistory(entries, 7);
    const total = history.reduce((s, d) => s + d.total, 0);
    expect(total).toBe(0);
  });

  it("ignores malformed entries", () => {
    const entries = [null, { category: "food", kgCO2e: NaN, timestamp: new Date().toISOString() }];
    const history = buildDailyHistory(entries, 7);
    const total = history.reduce((s, d) => s + d.total, 0);
    expect(total).toBe(0);
  });
});

describe("calculateStreak", () => {
  it("returns 0 for empty history", () => {
    expect(calculateStreak([], 5.5)).toBe(0);
  });

  it("counts consecutive days at or below target", () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), total: i === 0 ? 3 : 4 });
    }
    // All past days (excluding today) are 4, below target 5.5 → streak = 6
    expect(calculateStreak(days, 5.5)).toBe(6);
  });

  it("streak breaks on a day above target", () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // 3 days ago was over target
      days.push({ date: d.toISOString().slice(0, 10), total: i === 3 ? 12 : 4 });
    }
    expect(calculateStreak(days, 5.5)).toBe(2); // only last 2 days before today
  });
});
