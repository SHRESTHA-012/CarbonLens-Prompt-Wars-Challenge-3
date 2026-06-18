import { useState, useCallback, useMemo, useEffect } from "react";
import {
  calculateTransportEmissions,
  calculateEnergyEmissions,
  calculateFoodEmissions,
  calculateWasteEmissions,
  summarizeEntries,
  findHighestImpactCategory,
  compareToBenchmark,
  buildDailyHistory,
  calculateStreak,
} from "../lib/calculations";
import { DAILY_BENCHMARK_KG, DAILY_TARGET_KG } from "../lib/emissionFactors";
import {
  getPersonalizedRecommendations,
  calculateTotalSavings,
} from "../lib/recommendations";

const STORAGE_KEY = "carbonlens_state_v1";

function loadInitialState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], completedActionIds: [], userTargetKg: DAILY_TARGET_KG, darkMode: false };
    const parsed = JSON.parse(raw);
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      completedActionIds: Array.isArray(parsed.completedActionIds)
        ? parsed.completedActionIds
        : [],
      userTargetKg:
        typeof parsed.userTargetKg === "number" && parsed.userTargetKg > 0
          ? parsed.userTargetKg
          : DAILY_TARGET_KG,
      darkMode: typeof parsed.darkMode === "boolean" ? parsed.darkMode : false,
    };
  } catch {
    return { entries: [], completedActionIds: [], userTargetKg: DAILY_TARGET_KG, darkMode: false };
  }
}

let entryIdCounter = 0;
function nextEntryId() {
  entryIdCounter += 1;
  return `entry_${Date.now()}_${entryIdCounter}`;
}

export function useCarbonLedger() {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be full or unavailable (e.g. private browsing) —
      // fail silently rather than breaking the app's runtime behavior.
    }
  }, [state]);

  const addTransportEntry = useCallback((mode, distanceKm) => {
    const kgCO2e = calculateTransportEmissions(mode, distanceKm);
    setState((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: nextEntryId(),
          category: "transport",
          label: mode,
          quantity: distanceKm,
          unit: "km",
          kgCO2e,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const addEnergyEntry = useCallback((source, kwh) => {
    const kgCO2e = calculateEnergyEmissions(source, kwh);
    setState((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: nextEntryId(),
          category: "energy",
          label: source,
          quantity: kwh,
          unit: "kWh",
          kgCO2e,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const addFoodEntry = useCallback((mealType, servings) => {
    const kgCO2e = calculateFoodEmissions(mealType, servings);
    setState((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: nextEntryId(),
          category: "food",
          label: mealType,
          quantity: servings,
          unit: "serving(s)",
          kgCO2e,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const addWasteEntry = useCallback((method, kg) => {
    const kgCO2e = calculateWasteEmissions(method, kg);
    setState((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: nextEntryId(),
          category: "waste",
          label: method,
          quantity: kg,
          unit: "kg",
          kgCO2e,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const removeEntry = useCallback((entryId) => {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== entryId),
    }));
  }, []);

  const toggleActionCompleted = useCallback((actionId) => {
    setState((prev) => {
      const isCompleted = prev.completedActionIds.includes(actionId);
      return {
        ...prev,
        completedActionIds: isCompleted
          ? prev.completedActionIds.filter((id) => id !== actionId)
          : [...prev.completedActionIds, actionId],
      };
    });
  }, []);

  const setUserTarget = useCallback((kg) => {
    const parsed = Number(kg);
    if (typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0) {
      setState((prev) => ({ ...prev, userTargetKg: Math.round(parsed * 10) / 10 }));
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  /**
   * Export all entries as a CSV string and trigger a browser download.
   * No external dependencies — uses a data URI.
   */
  const exportCSV = useCallback(() => {
    const header = "id,category,label,quantity,unit,kgCO2e,timestamp";
    const rows = state.entries.map((e) =>
      [e.id, e.category, `"${e.label}"`, e.quantity, e.unit, e.kgCO2e, e.timestamp].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carbonlens-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.entries]);

  // Derived values are memoized off the raw entries/completedActionIds so
  // expensive recalculation only happens when the underlying data changes,
  // not on every render.
  const { totals, grandTotal } = useMemo(
    () => summarizeEntries(state.entries),
    [state.entries]
  );

  const highestImpactCategory = useMemo(
    () => findHighestImpactCategory(totals),
    [totals]
  );

  const benchmarkComparison = useMemo(
    () => compareToBenchmark(grandTotal, DAILY_BENCHMARK_KG, state.userTargetKg),
    [grandTotal, state.userTargetKg]
  );

  const recommendations = useMemo(
    () =>
      getPersonalizedRecommendations(
        highestImpactCategory,
        state.completedActionIds,
        4
      ),
    [highestImpactCategory, state.completedActionIds]
  );

  const totalSavings = useMemo(
    () => calculateTotalSavings(state.completedActionIds),
    [state.completedActionIds]
  );

  const netBalance = useMemo(
    () => Math.round((grandTotal - totalSavings) * 100) / 100,
    [grandTotal, totalSavings]
  );

  const dailyHistory = useMemo(
    () => buildDailyHistory(state.entries, 7),
    [state.entries]
  );

  const streak = useMemo(
    () => calculateStreak(dailyHistory, state.userTargetKg),
    [dailyHistory, state.userTargetKg]
  );

  return {
    entries: state.entries,
    completedActionIds: state.completedActionIds,
    totals,
    grandTotal,
    highestImpactCategory,
    benchmarkComparison,
    recommendations,
    totalSavings,
    netBalance,
    dailyHistory,
    streak,
    userTargetKg: state.userTargetKg,
    darkMode: state.darkMode,
    addTransportEntry,
    addEnergyEntry,
    addFoodEntry,
    addWasteEntry,
    removeEntry,
    toggleActionCompleted,
    setUserTarget,
    toggleDarkMode,
    exportCSV,
  };
}
