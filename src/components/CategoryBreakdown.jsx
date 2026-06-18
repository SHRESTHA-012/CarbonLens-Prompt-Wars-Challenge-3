import { CATEGORY_META } from "../lib/emissionFactors";
import "./CategoryBreakdown.css";

/**
 * Stacked horizontal bar showing each category's share of today's total.
 * When total is zero, shows a neutral empty bar with a helpful prompt.
 */
export function CategoryBreakdown({ totals, grandTotal }) {
  const categories = Object.entries(totals);
  const hasData = grandTotal > 0;

  return (
    <section className="breakdown" aria-label="Emissions by category">
      <h2 className="breakdown__title">Today's breakdown</h2>

      {/* Stacked bar */}
      <div
        className="breakdown__bar"
        role="img"
        aria-label={
          hasData
            ? `Emissions split: ${categories
                .map(([k, v]) => `${CATEGORY_META[k]?.label} ${((v / grandTotal) * 100).toFixed(0)}%`)
                .join(", ")}`
            : "No emissions logged yet"
        }
      >
        {hasData
          ? categories
              .filter(([, v]) => v > 0)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="breakdown__segment"
                  style={{
                    width: `${(value / grandTotal) * 100}%`,
                    background: CATEGORY_META[key]?.color ?? "#ccc",
                  }}
                  aria-hidden="true"
                />
              ))
          : <div className="breakdown__segment breakdown__segment--empty" aria-hidden="true" />}
      </div>

      {/* Legend */}
      <ul className="breakdown__legend" aria-label="Category breakdown list">
        {categories.map(([key, value]) => {
          const meta = CATEGORY_META[key];
          const pct = hasData ? ((value / grandTotal) * 100).toFixed(0) : 0;
          return (
            <li key={key} className="breakdown__legend-item">
              <span
                className="breakdown__legend-dot"
                style={{ background: meta?.color ?? "#ccc" }}
                aria-hidden="true"
              />
              <span className="breakdown__legend-emoji" aria-hidden="true">
                {meta?.emoji}
              </span>
              <span className="breakdown__legend-label">{meta?.label}</span>
              <span className="breakdown__legend-value" aria-label={`${value.toFixed(2)} kg, ${pct} percent`}>
                <span className="breakdown__legend-kg">{value.toFixed(2)} kg</span>
                {hasData && (
                  <span className="breakdown__legend-pct">{pct}%</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
