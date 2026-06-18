import { useState, useEffect } from "react";
import { useCarbonLedger } from "./hooks/useCarbonLedger";
import { BalanceSummary } from "./components/BalanceSummary";
import { LogEntryForm } from "./components/LogEntryForm";
import { Ledger } from "./components/Ledger";
import { Recommendations } from "./components/Recommendations";
import { WeeklyChart } from "./components/WeeklyChart";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { GoalModal } from "./components/GoalModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ACTION_CATALOG } from "./lib/recommendations";
import "./App.css";

function App() {
  const {
    entries,
    completedActionIds,
    totals,
    grandTotal,
    highestImpactCategory,
    benchmarkComparison,
    recommendations,
    totalSavings,
    netBalance,
    dailyHistory,
    streak,
    userTargetKg,
    darkMode,
    addTransportEntry,
    addEnergyEntry,
    addFoodEntry,
    addWasteEntry,
    removeEntry,
    toggleActionCompleted,
    setUserTarget,
    toggleDarkMode,
    exportCSV,
  } = useCarbonLedger();

  const [showGoalModal, setShowGoalModal] = useState(false);

  // Apply dark mode class on <html> so CSS vars cascade properly
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const completedActions = ACTION_CATALOG.filter((a) =>
    completedActionIds.includes(a.id)
  );

  return (
    <ErrorBoundary>
      {/* Skip-to-content for keyboard / screen reader users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="app">
        <header className="app__header">
          <div className="app__header-top">
            <div>
              <h1 className="app__logo">CarbonLens</h1>
              <p className="app__tagline">Your carbon footprint, kept like a ledger.</p>
            </div>
            <div className="app__header-actions">
              <button
                type="button"
                className="app__icon-btn"
                onClick={exportCSV}
                aria-label="Export entries as CSV"
                title="Export CSV"
                disabled={entries.length === 0}
              >
                ↓ Export
              </button>
              <button
                type="button"
                className="app__icon-btn"
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Light mode" : "Dark mode"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="app__main">
          <BalanceSummary
            grandTotal={grandTotal}
            totalSavings={totalSavings}
            netBalance={netBalance}
            benchmarkComparison={benchmarkComparison}
            userTargetKg={userTargetKg}
            streak={streak}
            onSetTarget={() => setShowGoalModal(true)}
          />

          <CategoryBreakdown totals={totals} grandTotal={grandTotal} />

          <WeeklyChart dailyHistory={dailyHistory} userTargetKg={userTargetKg} />

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
            Estimates use published average emission factors (EPA, DEFRA, IPCC) and are
            intended to guide intuition, not serve as audited measurements.
          </p>
        </footer>
      </div>

      {showGoalModal && (
        <GoalModal
          currentTarget={userTargetKg}
          onSave={setUserTarget}
          onClose={() => setShowGoalModal(false)}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;
