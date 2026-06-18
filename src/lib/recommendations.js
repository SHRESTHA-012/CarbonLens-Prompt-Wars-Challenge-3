// Each action declares which category it targets and an estimated daily
// kg CO2e saving, so recommendations can be ranked by real impact rather
// than shown in a fixed, generic order.

export const ACTION_CATALOG = [
  {
    id: "swap_car_to_train",
    category: "transport",
    title: "Swap one car trip a day for the train",
    estimatedDailySavingKg: 3.0,
    description:
      "Replacing a 20km petrol car commute with a train ride cuts most of that trip's emissions.",
  },
  {
    id: "swap_car_to_bike",
    category: "transport",
    title: "Bike for trips under 5km",
    estimatedDailySavingKg: 1.9,
    description:
      "Short car trips are inefficient — biking removes them entirely on the days you do it.",
  },
  {
    id: "carpool",
    category: "transport",
    title: "Carpool twice a week",
    estimatedDailySavingKg: 1.1,
    description: "Splitting a commute between two people roughly halves its footprint per person.",
  },
  {
    id: "switch_renewable_energy",
    category: "energy",
    title: "Switch to a renewable electricity plan",
    estimatedDailySavingKg: 4.2,
    description:
      "Grid electricity from renewable sources can cut your home energy footprint dramatically.",
  },
  {
    id: "lower_thermostat",
    category: "energy",
    title: "Lower heating by 2°C in winter",
    estimatedDailySavingKg: 1.3,
    description: "Small temperature adjustments compound significantly over a season.",
  },
  {
    id: "unplug_standby",
    category: "energy",
    title: "Unplug devices on standby overnight",
    estimatedDailySavingKg: 0.4,
    description: "Standby power draw is small per device but adds up across a household.",
  },
  {
    id: "meatless_days",
    category: "food",
    title: "Go meat-free 2 days a week",
    estimatedDailySavingKg: 1.6,
    description:
      "Red meat has one of the highest footprints per meal of any common food category.",
  },
  {
    id: "reduce_dairy",
    category: "food",
    title: "Swap one dairy serving a day for a plant alternative",
    estimatedDailySavingKg: 0.7,
    description: "Dairy production is emissions-intensive relative to plant-based alternatives.",
  },
  {
    id: "buy_local_produce",
    category: "food",
    title: "Choose local, in-season produce when possible",
    estimatedDailySavingKg: 0.3,
    description: "Cuts transport and cold-storage emissions baked into out-of-season produce.",
  },
  {
    id: "recycle_properly",
    category: "waste",
    title: "Sort recyclables instead of binning them",
    estimatedDailySavingKg: 0.5,
    description: "Recycling has a meaningfully lower footprint than sending waste to landfill.",
  },
  {
    id: "compost_food_waste",
    category: "waste",
    title: "Compost food scraps",
    estimatedDailySavingKg: 0.3,
    description: "Composting avoids the methane that food waste generates in landfill.",
  },
];

/**
 * Generates a ranked list of recommended actions personalized to the
 * user's logged category totals. Prioritizes actions in the user's
 * highest-impact category, then sorts by estimated savings within that.
 *
 * @param {string|null} highestImpactCategory - output of findHighestImpactCategory
 * @param {string[]} completedActionIds - actions already marked done, excluded from list
 * @param {number} limit - max number of recommendations to return
 */
export function getPersonalizedRecommendations(
  highestImpactCategory,
  completedActionIds = [],
  limit = 4
) {
  const available = ACTION_CATALOG.filter(
    (a) => !completedActionIds.includes(a.id)
  );

  const sorted = [...available].sort((a, b) => {
    const aMatches = a.category === highestImpactCategory;
    const bMatches = b.category === highestImpactCategory;
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return b.estimatedDailySavingKg - a.estimatedDailySavingKg;
  });

  return sorted.slice(0, limit);
}

/**
 * Sums the estimated daily savings of a set of completed action ids.
 * Used to drive the "credits" side of the ledger.
 */
export function calculateTotalSavings(completedActionIds = []) {
  return ACTION_CATALOG.filter((a) => completedActionIds.includes(a.id)).reduce(
    (sum, a) => sum + a.estimatedDailySavingKg,
    0
  );
}
