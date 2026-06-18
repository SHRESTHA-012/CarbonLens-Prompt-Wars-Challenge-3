import { useCarbonLedger } from "./hooks/useCarbonLedger";
import { BalanceSummary } from "./components/BalanceSummary";
import { LogEntryForm } from "./components/LogEntryForm";
import { Ledger } from "./components/Ledger";
import { Recommendations } from "./components/Recommendations";
import { ACTION_CATALOG } from "./lib/recommendations";
import "./App.css";

function App() {
  const {
    entries,
    completedActionIds,
    grandTotal,
    highestImpactCategory,
    benchmarkComparison,
    recommendations,
    totalSavings,
    netBalance,
    addTransportEntry,
    addEnergyEntry,
    addFoodEntry,
    addWasteEntry,
    removeEntry,
    toggleActionCompleted,
  } = useCarbonLedger();

  const completedActions = ACTION_CATALOG.filter((a) =>
    completedActionIds.includes(a.id)
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__logo">CarbonLens</h1>
        <p className="app__tagline">Your carbon footprint, kept like a ledger.</p>
      </header>

      <main className="app__main">
        <BalanceSummary
          grandTotal={grandTotal}
          totalSavings={totalSavings}
          netBalance={netBalance}
          benchmarkComparison={benchmarkComparison}
        />

        <section aria-label="Log a new entry" className="app__section">
          <h2 className="app__section-title">Add an entry</h2>
          <LogEntryForm
            onAddTransport={addTransportEntry}
            onAddEnergy={addEnergyEntry}
            onAddFood={addFoodEntry}
            onAddWaste={addWasteEntry}
          />
        </section>

        <section aria-label="Ledger" className="app__section">
          <h2 className="app__section-title">Ledger</h2>
          <Ledger
            entries={entries}
            completedActions={completedActions}
            onRemoveEntry={removeEntry}
          />
        </section>

        <Recommendations
          recommendations={recommendations}
          highestImpactCategory={highestImpactCategory}
          onComplete={toggleActionCompleted}
        />
      </main>

      <footer className="app__footer">
        <p>
          Estimates are based on published average emission factors and are meant to guide
          intuition, not serve as audited measurements.
        </p>
      </footer>
    </div>
  );
}

export default App;
