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
import {
  
  generateLocalFallbackInsights,
} from "../lib/aiInsightsEngine";

const STORAGE_KEY = "carbonlens_state_v1";

function loadInitialState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        entries: [],
        completedActionIds: [],
        userTargetKg: DAILY_TARGET_KG,
        darkMode: false,
        geminiApiKey: "",
        aiAdvice: "",
        aiSource: "rules_fallback",
      };
    }
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
      geminiApiKey: typeof parsed.geminiApiKey === "string" ? parsed.geminiApiKey : "",
      aiAdvice: typeof parsed.aiAdvice === "string" ? parsed.aiAdvice : "",
      aiSource: typeof parsed.aiSource === "string" ? parsed.aiSource : "rules_fallback",
    };
  } catch {
    return {
      entries: [],
      completedActionIds: [],
      userTargetKg: DAILY_TARGET_KG,
      darkMode: false,
      geminiApiKey: "",
      aiAdvice: "",
      aiSource: "rules_fallback",
    };
  }
}

let entryIdCounter = 0;
function nextEntryId() {
  entryIdCounter += 1;
  return `entry_${Date.now()}_${entryIdCounter}`;
}

export function useCarbonLedger() {
  const [state, setState] = useState(loadInitialState);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be full or unavailable (e.g. private browsing)
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

  const setGeminiApiKey = useCallback((key) => {
    setState((prev) => ({ ...prev, geminiApiKey: key }));
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      entries: [],
      completedActionIds: [],
    }));
  }, []);

  /**
   * Export all entries as a CSV string and trigger a browser download.
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

  // Derived values are memoized
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

  // Device identity generator
  const getOrCreateDeviceId = useCallback(() => {
    let id = window.localStorage.getItem("carbonlens_device_id");
    if (!id) {
      id = `device_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      window.localStorage.setItem("carbonlens_device_id", id);
    }
    return id;
  }, []);

  // Sync ledger entries database snapshots to backend
  const syncLedgerWithBackend = useCallback(async (entriesToSync) => {
    const deviceId = getOrCreateDeviceId();
    try {
      await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
          entries: entriesToSync,
        }),
      });
    } catch (err) {
      console.warn("Backend database sync failed, using localStorage only:", err);
    }
  }, [getOrCreateDeviceId]);

  // Push updates to backend database snapshot
  useEffect(() => {
    syncLedgerWithBackend(state.entries);
  }, [state.entries, syncLedgerWithBackend]);

  // Load history snapshot from backend database on mount
  useEffect(() => {
    const loadHistory = async () => {
      const deviceId = getOrCreateDeviceId();
      try {
        const response = await fetch(`/api/entries/${deviceId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.entries && data.entries.length > 0 && state.entries.length === 0) {
            setState((prev) => ({
              ...prev,
              entries: data.entries,
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to load historical data from backend:", err);
      }
    };
    loadHistory();
  }, [getOrCreateDeviceId]);

  // Generate / trigger dynamic Gemini AI insights from backend API
  const generateAIInsights = useCallback(async (customApiKey = null) => {
    const keyToUse = customApiKey !== null ? customApiKey : state.geminiApiKey;

    setIsGeneratingInsights(true);
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totals,
          highestImpactCategory,
          userTargetKg: state.userTargetKg,
          streak,
          apiKey: keyToUse
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();
      if (data.advice) {
        setState((prev) => ({
          ...prev,
          aiAdvice: data.advice,
          aiSource: data.source || "rules_fallback",
        }));
      } else {
        throw new Error("Empty advice returned from server");
      }
    } catch (err) {
      console.warn("Server-side AI insights request failed, degrading to local client fallback:", err);
      const fallbackInsights = generateLocalFallbackInsights(
        totals,
        highestImpactCategory,
        state.userTargetKg,
        streak
      );
      setState((prev) => ({
        ...prev,
        aiAdvice: fallbackInsights,
        aiSource: "rules_fallback",
      }));
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [state.geminiApiKey, state.userTargetKg, totals, highestImpactCategory, streak]);

  // Keep local fallback reactive when entries change (if using rules)
  useEffect(() => {
    if (state.aiSource === "rules_fallback" || !state.geminiApiKey) {
      const fallbackInsights = generateLocalFallbackInsights(
        totals,
        highestImpactCategory,
        state.userTargetKg,
        streak
      );
      setState((prev) => {
        if (prev.aiAdvice === fallbackInsights) return prev;
        return {
          ...prev,
          aiAdvice: fallbackInsights,
          aiSource: "rules_fallback",
        };
      });
    }
  }, [totals, highestImpactCategory, state.userTargetKg, streak, state.aiSource, state.geminiApiKey]);

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
    geminiApiKey: state.geminiApiKey,
    aiAdvice: state.aiAdvice,
    aiSource: state.aiSource,
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
  };
}

