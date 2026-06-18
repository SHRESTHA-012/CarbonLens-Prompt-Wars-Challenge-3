import "./BalanceSummary.css";

const STATUS_COPY = {
  within_target: { label: "Within your target", tone: "good" },
  below_average:  { label: "Below national average", tone: "ok" },
  above_target:   { label: "Above your target", tone: "warn" },
  unknown:        { label: "Log entries to begin", tone: "neutral" },
};

/**
 * SVG circular progress ring — no external dependencies.
 * `progress` is 0–1; drawn as a dashed stroke dash offset.
 */
function ProgressRing({ progress, tone }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(progress, 1);
  // When over 100%, fill ring fully and use warning colour
  const offset = circ - capped * circ;

  const colorMap = {
    good:    "var(--color-good)",
    ok:      "var(--color-ok)",
    warn:    "var(--color-warning)",
    neutral: "rgba(255,255,255,0.2)",
  };

  return (
    <svg
      className="balance__ring"
      viewBox="0 0 88 88"
      aria-hidden="true"
      focusable="false"
      width="88"
      height="88"
    >
      {/* Track */}
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="7"
      />
      {/* Progress */}
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke={colorMap[tone]}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

export function BalanceSummary({
  grandTotal,
  totalSavings,
  netBalance,
  benchmarkComparison,
  userTargetKg,
  streak,
  onSetTarget,
}) {
  const status = STATUS_COPY[benchmarkComparison.status] ?? STATUS_COPY.unknown;
  // progress = how much of the target has been consumed (net balance vs target)
  const progress = userTargetKg > 0 ? netBalance / userTargetKg : 0;

  return (
    <section className="balance" aria-label="Today's carbon balance">
      <div className="balance__top">
        <div className="balance__main">
          <div className="balance__eyebrow">Today's balance</div>
          <div className="balance__figure">
            <span className="balance__number">{netBalance.toFixed(2)}</span>
            <span className="balance__unit">kg CO₂e</span>
          </div>
          <div className={`balance__status balance__status--${status.tone}`}>
            <span className="balance__status-dot" aria-hidden="true" />
            {status.label}
          </div>
        </div>

        <div className="balance__ring-wrap" aria-label={`Progress: ${Math.round(progress * 100)}% of daily target used`}>
          <ProgressRing progress={progress} tone={status.tone} />
          <span className="balance__ring-label" aria-hidden="true">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      <dl className="balance__breakdown">
        <div className="balance__breakdown-item">
          <dt>Logged today</dt>
          <dd>{grandTotal.toFixed(2)} kg</dd>
        </div>
        <div className="balance__breakdown-item">
          <dt>Saved via actions</dt>
          <dd>−{totalSavings.toFixed(2)} kg</dd>
        </div>
        <div className="balance__breakdown-item">
          <dt>Daily target</dt>
          <dd>
            <button
              type="button"
              className="balance__target-btn"
              onClick={onSetTarget}
              aria-label={`Daily target is ${userTargetKg} kg. Click to change.`}
            >
              {userTargetKg} kg ✎
            </button>
          </dd>
        </div>
        {streak > 0 && (
          <div className="balance__breakdown-item">
            <dt>🔥 Streak</dt>
            <dd>{streak} day{streak !== 1 ? "s" : ""} under target</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
