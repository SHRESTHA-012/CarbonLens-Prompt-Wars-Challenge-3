import { describe, it, expect } from "vitest";
import {
  getPersonalizedRecommendations,
  calculateTotalSavings,
  ACTION_CATALOG,
} from "../recommendations";

describe("getPersonalizedRecommendations", () => {
  it("prioritizes actions matching the highest-impact category first", () => {
    const recs = getPersonalizedRecommendations("transport", [], 10);
    const firstNonTransportIndex = recs.findIndex((r) => r.category !== "transport");
    const lastTransportIndex = recs
      .map((r) => r.category)
      .lastIndexOf("transport");
    if (firstNonTransportIndex !== -1) {
      expect(lastTransportIndex).toBeLessThan(firstNonTransportIndex);
    }
  });

  it("excludes already-completed actions", () => {
    const recs = getPersonalizedRecommendations("transport", ["swap_car_to_train"], 10);
    expect(recs.find((r) => r.id === "swap_car_to_train")).toBeUndefined();
  });

  it("respects the limit parameter", () => {
    const recs = getPersonalizedRecommendations("energy", [], 2);
    expect(recs.length).toBe(2);
  });

  it("falls back to savings-sorted order when no category is given", () => {
    const recs = getPersonalizedRecommendations(null, [], 3);
    expect(recs.length).toBe(3);
    expect(recs[0].estimatedDailySavingKg).toBeGreaterThanOrEqual(
      recs[1].estimatedDailySavingKg
    );
  });
});

describe("calculateTotalSavings", () => {
  it("sums savings for completed actions only", () => {
    const total = calculateTotalSavings(["swap_car_to_train", "compost_food_waste"]);
    const expected =
      ACTION_CATALOG.find((a) => a.id === "swap_car_to_train").estimatedDailySavingKg +
      ACTION_CATALOG.find((a) => a.id === "compost_food_waste").estimatedDailySavingKg;
    expect(total).toBeCloseTo(expected, 5);
  });

  it("returns 0 for an empty list", () => {
    expect(calculateTotalSavings([])).toBe(0);
  });

  it("ignores unrecognized action ids", () => {
    expect(calculateTotalSavings(["not_a_real_action"])).toBe(0);
  });
});
