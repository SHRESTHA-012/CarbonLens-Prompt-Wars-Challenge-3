import { CATEGORY_META } from "../lib/emissionFactors";
import "./Ledger.css";

function formatKg(value) {
  return `${value >= 0 ? "" : "−"}${Math.abs(value).toFixed(2)} kg`;
}

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function Ledger({ entries, completedActions, onRemoveEntry }) {
  const ledgerLines = [
    ...entries.map((e) => ({ type: "debit", ...e })),
    ...completedActions.map((a) => ({
      type: "credit",
      id: a.id,
      label: a.title,
      kgCO2e: a.estimatedDailySavingKg,
      category: a.category,
    })),
  ].sort((a, b) => {
    // Debits and credits interleave; without timestamps on credits,
    // keep credits grouped at the end so the "actions taken" feel
    // like a deliberate closing entry on the statement.
    if (a.type === b.type) return 0;
    return a.type === "debit" ? -1 : 1;
  });

  if (ledgerLines.length === 0) {
    return (
      <div className="ledger ledger--empty">
        <p className="ledger__empty-title">Your ledger is empty.</p>
        <p className="ledger__empty-body">
          Log a trip, a meal, or your energy use below — each entry posts here as a line in
          your carbon account.
        </p>
      </div>
    );
  }

  return (
    <div className="ledger" role="region" aria-label="Carbon ledger entries">
      <table className="ledger__table">
        <caption className="sr-only">
          List of carbon ledger entries, showing debits (emissions logged) and credits
          (reduction actions completed)
        </caption>
        <thead>
          <tr>
            <th scope="col">Entry</th>
            <th scope="col">Category</th>
            <th scope="col" className="ledger__col-amount">
              Amount
            </th>
            <th scope="col" className="sr-only">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {ledgerLines.map((line) => {
            const meta = CATEGORY_META[line.category] ?? { label: line.category, emoji: "?" };
            const isCredit = line.type === "credit";
            return (
              <tr key={line.id} className={isCredit ? "ledger__row--credit" : ""}>
                <td>
                  <span className="ledger__entry-label">
                    {isCredit ? line.label : prettifyLabel(line.label)}
                  </span>
                  {!isCredit && (
                    <span className="ledger__entry-meta">
                      {line.quantity} {line.unit} · {formatTime(line.timestamp)}
                    </span>
                  )}
                  {isCredit && <span className="ledger__entry-meta">Action completed</span>}
                </td>
                <td>
                  <span
                    className="ledger__category-glyph"
                    aria-hidden="true"
                    title={meta.label}
                  >
                    {meta.emoji ?? meta.label?.[0] ?? "?"}
                  </span>
                  <span className="sr-only">{meta.label}</span>
                </td>
                <td className={`ledger__col-amount ${isCredit ? "ledger__amount--credit" : ""}`}>
                  {isCredit ? `−${line.kgCO2e.toFixed(2)} kg` : formatKg(line.kgCO2e)}
                </td>
                <td>
                  {!isCredit && (
                    <button
                      type="button"
                      className="ledger__remove"
                      onClick={() => onRemoveEntry(line.id)}
                      aria-label={`Remove entry: ${prettifyLabel(line.label)}`}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function prettifyLabel(key) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
