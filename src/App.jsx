import { useState, useEffect, useRef } from "react";
import { useCarbonLedger } from "./hooks/useCarbonLedger";
import { BalanceSummary } from "./components/BalanceSummary";
import { LogEntryForm } from "./components/LogEntryForm";
import { Ledger } from "./components/Ledger";
import { Recommendations } from "./components/Recommendations";
import { WeeklyChart } from "./components/WeeklyChart";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { SettingsModal } from "./components/SettingsModal";
import { AICoach } from "./components/AICoach";
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
    geminiApiKey,
    aiAdvice,
    aiSource,
    isGeneratingInsights,
    addTransportEntry,
    addEnergyEntry,
    addFoodEntry,
    addWasteEntry,
    removeEntry,
    toggleActionCompleted,
    setUserTarget,
    toggleDarkMode,
    setGeminiApiKey,
    generateAIInsights,
    clearHistory,
    exportCSV,
  } = useCarbonLedger();

  const [showSettings, setShowSettings] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const prevEntriesCount = useRef(entries.length);
  const prevCompletedCount = useRef(completedActionIds.length);

  // Apply dark mode class on <html> so CSS vars cascade properly
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Handle accessibility announcements
  useEffect(() => {
    if (entries.length > prevEntriesCount.current) {
      const added = entries[entries.length - 1];
      setAnnouncement(`Added ${added.category} entry: ${added.label}, ${added.kgCO2e.toFixed(1)} kg CO2e.`);
    } else if (entries.length < prevEntriesCount.current) {
      setAnnouncement(`Removed entry from ledger.`);
    }
    prevEntriesCount.current = entries.length;
  }, [entries]);

  useEffect(() => {
    if (completedActionIds.length > prevCompletedCount.current) {
      setAnnouncement("Marked action as done. Carbon offset credited to balance.");
    } else if (completedActionIds.length < prevCompletedCount.current) {
      setAnnouncement("Removed action offset credit.");
    }
    prevCompletedCount.current = completedActionIds.length;
  }, [completedActionIds]);

  const completedActions = ACTION_CATALOG.filter((a) =>
    completedActionIds.includes(a.id)
  );

  return (
    <ErrorBoundary>
      {/* Accessibility live region */}
      <div className="a11y-announcement" role="status" aria-live="polite">
        {announcement}
      </div>

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
                onClick={() => setShowSettings(true)}
                aria-label="Open settings and goals"
                title="Settings"
              >
                ⚙️ Settings
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
          {/* Left Column: Understand & Track */}
          <div className="app__main-left">
            <BalanceSummary
              grandTotal={grandTotal}
              totalSavings={totalSavings}
              netBalance={netBalance}
              benchmarkComparison={benchmarkComparison}
              userTargetKg={userTargetKg}
              streak={streak}
              onSetTarget={() => setShowSettings(true)}
            />

            <AICoach
              aiAdvice={aiAdvice}
              aiSource={aiSource}
              isGeneratingInsights={isGeneratingInsights}
              onGenerateInsights={generateAIInsights}
              geminiApiKey={geminiApiKey}
              onOpenSettings={() => setShowSettings(true)}
            />

            <CategoryBreakdown totals={totals} grandTotal={grandTotal} />

            <WeeklyChart dailyHistory={dailyHistory} userTargetKg={userTargetKg} />
          </div>

          {/* Right Column: Track Entries & Reduce actions */}
          <div className="app__main-right">
            <section aria-label="Log a new entry" className="app__section">
              <h2 className="app__section-title">Add an entry</h2>
              <LogEntryForm
                onAddTransport={addTransportEntry}
                onAddEnergy={addEnergyEntry}
                onAddFood={addFoodEntry}
                onAddWaste={addWasteEntry}
              />
            </section>

            <section aria-label="Ledger entries" className="app__section">
              <h2 className="app__section-title">Emissions Ledger</h2>
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
          </div>
        </main>

        <footer className="app__footer">
          <p>
            Estimates use published average emission factors (EPA, DEFRA, IPCC) and are
            intended to guide intuition, not serve as audited measurements.
          </p>
        </footer>
      </div>

      {showSettings && (
        <SettingsModal
          currentTarget={userTargetKg}
          onSaveTarget={setUserTarget}
          geminiApiKey={geminiApiKey}
          onSaveApiKey={setGeminiApiKey}
          onClearHistory={clearHistory}
          onClose={() => setShowSettings(false)}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;

