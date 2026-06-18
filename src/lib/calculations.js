import {
  TRANSPORT_FACTORS,
  ENERGY_FACTORS,
  FOOD_FACTORS,
  WASTE_FACTORS,
} from "./emissionFactors";

/**
 * Validates that a value is a finite, non-negative number.
 * Used to guard all calculation entry points against malformed input
 * (e.g. NaN, negative distances, injected strings) before they reach
 * arithmetic — protects against bad data corrupting totals.
 */
export function isValidQuantity(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Calculates emissions in kg CO2e for a single transport entry.
 * @param {string} mode - key from TRANSPORT_FACTORS
 * @param {number} distanceKm - distance travelled in kilometers
 * @returns {number} kg CO2e, or 0 if input is invalid/unrecognized
 */
export function calculateTransportEmissions(mode, distanceKm) {
  const factor = TRANSPORT_FACTORS[mode];
  if (factor === undefined || !isValidQuantity(distanceKm)) return 0;
  return roundTo(factor * distanceKm, 3);
}

/**
 * Calculates emissions in kg CO2e for energy use.
 * @param {string} source - key from ENERGY_FACTORS
 * @param {number} kwh - energy used in kilowatt-hours
 */
export function calculateEnergyEmissions(source, kwh) {
  const factor = ENERGY_FACTORS[source];
  if (factor === undefined || !isValidQuantity(kwh)) return 0;
  return roundTo(factor * kwh, 3);
}

/**
 * Calculates emissions in kg CO2e for a food entry.
 * @param {string} mealType - key from FOOD_FACTORS
 * @param {number} servings - number of servings (defaults to 1)
 */
export function calculateFoodEmissions(mealType, servings = 1) {
  const factor = FOOD_FACTORS[mealType];
  if (factor === undefined || !isValidQuantity(servings)) return 0;
  return roundTo(factor * servings, 3);
}

/**
 * Calculates emissions in kg CO2e for waste disposal.
 * @param {string} method - key from WASTE_FACTORS
 * @param {number} kg - mass of waste in kilograms
 */
export function calculateWasteEmissions(method, kg) {
  const factor = WASTE_FACTORS[method];
  if (factor === undefined || !isValidQuantity(kg)) return 0;
  return roundTo(factor * kg, 3);
}

/**
 * Aggregates a list of logged entries into totals per category and a
 * grand total. Entries are expected in the shape:
 * { category: 'transport'|'energy'|'food'|'waste', kgCO2e: number }
 */
export function summarizeEntries(entries) {
  const totals = { transport: 0, energy: 0, food: 0, waste: 0 };
  for (const entry of entries) {
    if (!entry || !isValidQuantity(entry.kgCO2e)) continue;
    if (totals[entry.category] === undefined) continue;
    totals[entry.category] += entry.kgCO2e;
  }
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
  return { totals: mapRound(totals, 2), grandTotal: roundTo(grandTotal, 2) };
}

/**
 * Groups entries by ISO date (YYYY-MM-DD) and returns daily totals
 * for the last `days` days including today. Days with no entries get 0.
 * @param {Array} entries - all logged entries with a `timestamp` field
 * @param {number} days - how many days to include (default 7)
 * @returns {Array<{date: string, total: number}>}
 */
export function buildDailyHistory(entries, days = 7) {
  // Build date keys for the last N days
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, total: 0 });
  }

  const dateMap = Object.fromEntries(result.map((r) => [r.date, r]));

  for (const entry of entries) {
    if (!entry || !isValidQuantity(entry.kgCO2e)) continue;
    const key = entry.timestamp ? entry.timestamp.slice(0, 10) : null;
    if (key && dateMap[key]) {
      dateMap[key].total = roundTo(dateMap[key].total + entry.kgCO2e, 2);
    }
  }

  return result;
}

/**
 * Calculates the current streak of consecutive days at or below a target.
 * Counts backwards from yesterday (today is in progress so excluded).
 * @param {Array<{date: string, total: number}>} dailyHistory
 * @param {number} targetKg
 * @returns {number}
 */
export function calculateStreak(dailyHistory, targetKg) {
  if (!dailyHistory || dailyHistory.length === 0) return 0;
  // Exclude today (last element) — day still in progress
  const past = dailyHistory.slice(0, -1);
  let streak = 0;
  for (let i = past.length - 1; i >= 0; i--) {
    if (past[i].total > 0 && past[i].total <= targetKg) {
      streak++;
    } else if (past[i].total > 0) {
      break; // streak broken
    }
    // days with 0 entries are skipped (don't break or count)
  }
  return streak;
}

/**
 * Identifies the highest-emitting category from a totals object.
 * Returns null if all totals are zero (nothing logged yet).
 */
export function findHighestImpactCategory(totals) {
  const entries = Object.entries(totals);
  const nonZero = entries.filter(([, v]) => v > 0);
  if (nonZero.length === 0) return null;
  return nonZero.reduce((max, curr) => (curr[1] > max[1] ? curr : max))[0];
}

/**
 * Compares a daily total against a benchmark and target, returning a
 * structured comparison rather than a vague label.
 */
export function compareToBenchmark(dailyTotalKg, benchmarkKg, targetKg) {
  if (!isValidQuantity(dailyTotalKg)) {
    return { status: "unknown", percentVsBenchmark: 0, percentVsTarget: 0 };
  }
  const percentVsBenchmark = benchmarkKg
    ? roundTo(((dailyTotalKg - benchmarkKg) / benchmarkKg) * 100, 1)
    : 0;
  const percentVsTarget = targetKg
    ? roundTo(((dailyTotalKg - targetKg) / targetKg) * 100, 1)
    : 0;
  let status = "above_target";
  if (dailyTotalKg <= targetKg) status = "within_target";
  else if (dailyTotalKg <= benchmarkKg) status = "below_average";
  return { status, percentVsBenchmark, percentVsTarget };
}

function roundTo(num, decimals) {
  const factor = 10 ** decimals;
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

function mapRound(obj, decimals) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = roundTo(v, decimals);
  return out;
}
