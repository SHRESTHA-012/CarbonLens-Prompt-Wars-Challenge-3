import "./WeeklyChart.css";

/**
 * A pure-CSS bar chart showing daily CO2e totals for the last 7 days.
 * No canvas, no SVG, no external library — just flexbox bars scaled
 * against the week's maximum value.
 */
export function WeeklyChart({ dailyHistory, userTargetKg }) {
  const maxValue = Math.max(...dailyHistory.map((d) => d.total), userTargetKg, 1);

  function formatDate(isoDate) {
    try {
      const d = new Date(isoDate + "T00:00:00");
      return d.toLocaleDateString([], { weekday: "short" });
    } catch {
      return isoDate;
    }
  }

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <section className="weekly-chart" aria-label="7-day carbon history">
      <h2 className="weekly-chart__title">Last 7 days</h2>
      <div className="weekly-chart__bars" role="img" aria-label="Bar chart of daily carbon emissions">
        {/* Target line */}
        <div
          className="weekly-chart__target-line"
          style={{ bottom: `${(userTargetKg / maxValue) * 100}%` }}
          aria-hidden="true"
        />
        {dailyHistory.map((day) => {
          const pct = (day.total / maxValue) * 100;
          const isToday = day.date === todayKey;
          const overTarget = day.total > userTargetKg && day.total > 0;
          return (
            <div
              key={day.date}
              className="weekly-chart__col"
              title={`${formatDate(day.date)}: ${day.total.toFixed(2)} kg CO₂e`}
            >
              <span className="weekly-chart__bar-label" aria-hidden="true">
                {day.total > 0 ? day.total.toFixed(1) : ""}
              </span>
              <div
                className={[
                  "weekly-chart__bar",
                  isToday ? "weekly-chart__bar--today" : "",
                  overTarget ? "weekly-chart__bar--over" : "",
                  day.total === 0 ? "weekly-chart__bar--empty" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ height: `${Math.max(pct, day.total > 0 ? 4 : 0)}%` }}
                role="presentation"
              />
              <span className="weekly-chart__day-label" aria-label={isToday ? `${formatDate(day.date)} (today)` : formatDate(day.date)}>
                {formatDate(day.date)}
                {isToday && <span className="weekly-chart__today-dot" aria-hidden="true" />}
              </span>
            </div>
          );
        })}
      </div>
      <p className="weekly-chart__legend" aria-hidden="true">
        <span className="weekly-chart__legend-line" /> Daily target ({userTargetKg} kg)
      </p>
    </section>
  );
}
