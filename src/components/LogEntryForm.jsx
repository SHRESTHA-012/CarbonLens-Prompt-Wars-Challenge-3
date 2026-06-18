import { useState } from "react";
import {
  TRANSPORT_FACTORS,
  TRANSPORT_LABELS,
  ENERGY_FACTORS,
  FOOD_FACTORS,
  FOOD_LABELS,
  WASTE_FACTORS,
} from "../lib/emissionFactors";
import "./LogEntryForm.css";

const CATEGORY_CONFIG = {
  transport: {
    label: "Transport",
    unitLabel: "Distance (km)",
    options: Object.keys(TRANSPORT_FACTORS),
    getOptionLabel: (key) => TRANSPORT_LABELS[key],
  },
  energy: {
    label: "Energy",
    unitLabel: "Energy used (kWh)",
    options: Object.keys(ENERGY_FACTORS),
    getOptionLabel: (key) =>
      ({
        electricity_grid: "Grid electricity",
        electricity_renewable: "Renewable electricity",
        natural_gas: "Natural gas",
      }[key]),
  },
  food: {
    label: "Food",
    unitLabel: "Servings",
    options: Object.keys(FOOD_FACTORS),
    getOptionLabel: (key) => FOOD_LABELS[key],
  },
  waste: {
    label: "Waste",
    unitLabel: "Weight (kg)",
    options: Object.keys(WASTE_FACTORS),
    getOptionLabel: (key) =>
      ({ landfill: "Landfill", recycled: "Recycled", composted: "Composted" }[key]),
  },
};

export function LogEntryForm({ onAddTransport, onAddEnergy, onAddFood, onAddWaste }) {
  const [category, setCategory] = useState("transport");
  const [option, setOption] = useState(CATEGORY_CONFIG.transport.options[0]);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  const config = CATEGORY_CONFIG[category];

  function handleCategoryChange(newCategory) {
    setCategory(newCategory);
    setOption(CATEGORY_CONFIG[newCategory].options[0]);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const numericQuantity = Number(quantity);

    if (quantity.trim() === "" || Number.isNaN(numericQuantity)) {
      setError("Enter a number.");
      return;
    }
    if (numericQuantity < 0) {
      setError("Value can't be negative.");
      return;
    }
    if (numericQuantity > 100000) {
      setError("That number looks too large — check it and try again.");
      return;
    }

    if (category === "transport") onAddTransport(option, numericQuantity);
    if (category === "energy") onAddEnergy(option, numericQuantity);
    if (category === "food") onAddFood(option, numericQuantity);
    if (category === "waste") onAddWaste(option, numericQuantity);

    setQuantity("");
    setError("");
  }

  return (
    <form className="log-form" onSubmit={handleSubmit} aria-label="Log a new entry">
      <div className="log-form__row">
        <fieldset className="log-form__field">
          <legend className="log-form__label">Category</legend>
          <div className="log-form__pills" role="radiogroup" aria-label="Category">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={category === key}
                className={`log-form__pill ${category === key ? "is-active" : ""}`}
                onClick={() => handleCategoryChange(key)}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="log-form__row log-form__row--inputs">
        <label className="log-form__field">
          <span className="log-form__label">Type</span>
          <select
            className="log-form__select"
            value={option}
            onChange={(e) => setOption(e.target.value)}
          >
            {config.options.map((key) => (
              <option key={key} value={key}>
                {config.getOptionLabel(key)}
              </option>
            ))}
          </select>
        </label>

        <label className="log-form__field">
          <span className="log-form__label">{config.unitLabel}</span>
          <input
            className="log-form__input"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "log-form-error" : undefined}
          />
        </label>

        <button type="submit" className="log-form__submit">
          Add entry
        </button>
      </div>

      {error && (
        <p className="log-form__error" id="log-form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
