import "./BalanceSummary.css";

const STATUS_COPY = {
  within_target: {
    label: "Within climate target",
    tone: "good",
  },
  below_average: {
    label: "Below national average",
    tone: "ok",
  },
  above_target: {
    label: "Above national average",
    tone: "warn",
  },
  unknown: {
    label: "Not enough data yet",
    tone: "neutral",
  },
};

export function BalanceSummary({ grandTotal, totalSavings, netBalance, benchmarkComparison }) {
  const status = STATUS_COPY[benchmarkComparison.status] ?? STATUS_COPY.unknown;

  return (
    <section className="balance" aria-label="Today's carbon balance">
      <div className="balance__eyebrow">Today's balance</div>
      <div className="balance__figure">
        <span className="balance__number">{netBalance.toFixed(2)}</span>
        <span className="balance__unit">kg CO₂e</span>
      </div>
      <div className={`balance__status balance__status--${status.tone}`}>
        <span className="balance__status-dot" aria-hidden="true" />
        {status.label}
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
      </dl>
    </section>
  );
}
