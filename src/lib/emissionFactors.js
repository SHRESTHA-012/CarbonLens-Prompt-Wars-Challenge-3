// Emission factors: kg CO2e per unit.
// Sources are approximate, rounded averages drawn from publicly published
// transport, energy, and food lifecycle-emissions studies (EPA, DEFRA, IPCC
// summaries). Treat these as directionally correct estimates, not audited
// figures — clearly labeled as such in the UI.

export const TRANSPORT_FACTORS = {
  // kg CO2e per passenger-km
  car_petrol: 0.192,
  car_diesel: 0.171,
  car_electric: 0.053,
  bus: 0.105,
  train: 0.041,
  motorbike: 0.103,
  bicycle: 0,
  walking: 0,
  flight_domestic: 0.246,
  flight_international: 0.195,
};

export const TRANSPORT_LABELS = {
  car_petrol: "Petrol car",
  car_diesel: "Diesel car",
  car_electric: "Electric car",
  bus: "Bus",
  train: "Train",
  motorbike: "Motorbike",
  bicycle: "Bicycle",
  walking: "Walking",
  flight_domestic: "Domestic flight",
  flight_international: "International flight",
};

export const ENERGY_FACTORS = {
  // kg CO2e per kWh, grid average
  electricity_grid: 0.475,
  electricity_renewable: 0.02,
  natural_gas: 0.202, // per kWh thermal equivalent
};

export const FOOD_FACTORS = {
  // kg CO2e per serving (approx, per meal-equivalent serving)
  red_meat_meal: 6.61,
  poultry_meal: 1.57,
  fish_meal: 1.34,
  vegetarian_meal: 0.84,
  vegan_meal: 0.52,
  dairy_serving: 1.12,
};

export const FOOD_LABELS = {
  red_meat_meal: "Red meat meal",
  poultry_meal: "Poultry meal",
  fish_meal: "Fish meal",
  vegetarian_meal: "Vegetarian meal",
  vegan_meal: "Vegan meal",
  dairy_serving: "Dairy serving",
};

export const WASTE_FACTORS = {
  // kg CO2e per kg of waste, by disposal method
  landfill: 0.58,
  recycled: 0.21,
  composted: 0.1,
};

// National daily average (kg CO2e/day) used as a comparison benchmark.
// This is an illustrative global-average figure for context, not a
// precise per-country statistic.
export const DAILY_BENCHMARK_KG = 11.5;

// A commonly cited individual target consistent with global climate goals,
// expressed as a daily budget (2 tonnes/year).
export const DAILY_TARGET_KG = 5.5;
