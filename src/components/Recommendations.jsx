import "./Recommendations.css";

const CATEGORY_LABELS = {
  transport: "Transport",
  energy: "Energy",
  food: "Food",
  waste: "Waste",
};

export function Recommendations({
  recommendations,
  highestImpactCategory,
  onComplete,
}) {
  if (recommendations.length === 0) {
    return (
      <section className="recs recs--empty" aria-label="Personalized recommendations">
        <h2 className="recs__title">Recommended actions</h2>
        <p className="recs__empty-body">
          You've completed every available action — log a few more entries to surface new
          ones.
        </p>
      </section>
    );
  }

  return (
    <section className="recs" aria-label="Personalized recommendations">
      <h2 className="recs__title">Recommended for you</h2>
      {highestImpactCategory && (
        <p className="recs__context">
          Your highest-impact category right now is{" "}
          <strong>{CATEGORY_LABELS[highestImpactCategory]}</strong> — these actions target
          it first.
        </p>
      )}
      <ul className="recs__list">
        {recommendations.map((action) => (
          <li key={action.id} className="recs__item">
            <div className="recs__item-main">
              <p className="recs__item-title">{action.title}</p>
              <p className="recs__item-desc">{action.description}</p>
            </div>
            <div className="recs__item-side">
              <span className="recs__saving">
                −{action.estimatedDailySavingKg.toFixed(1)} kg/day
              </span>
              <button
                type="button"
                className="recs__complete-btn"
                onClick={() => onComplete(action.id)}
              >
                Mark done
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
