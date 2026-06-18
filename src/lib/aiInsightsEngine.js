/**
 * Utility functions for generating dynamic, personalized carbon insights.
 * Features a Gemini API prompt builder and a high-quality local rule-based fallback engine.
 */

import { ACTION_CATALOG } from "./recommendations";

/**
 * Builds a prompt for the Gemini AI Model.
 * Provides rich user context to elicit personalized, action-oriented responses.
 */
export function buildGeminiPrompt(totals, highestImpactCategory, targetKg, streak) {
  const categoriesList = Object.entries(totals)
    .map(([cat, val]) => `- ${cat}: ${val.toFixed(2)} kg CO2e`)
    .join("\n");

  return `You are CarbonLens Coach, a friendly, direct, and actionable climate-impact advisor.
Analyze the user's daily carbon ledger totals:
${categoriesList}

Context:
- Highest impact category: ${highestImpactCategory || "None logged yet"}
- User's daily target budget: ${targetKg} kg CO2e
- Current streak under target: ${streak} days

Provide exactly 3 concise, bulleted, highly personalized tips to help them reduce their emissions.
Format each tip as:
- **Title**: A short, action-focused recommendation. Under it, provide a 1-2 sentence description explaining *why* it helps and its practical implementation.
Prioritize their highest impact category first. Keep your tone encouraging, direct, and realistic. Keep the entire response under 150 words. Do not use generic introductions or conclusions.`;
}

/**
 * Deterministic local rule engine that targets the user's highest emission categories.
 * Ensures the user receives context-aware guidance even when offline or without an API key.
 */
export function generateLocalFallbackInsights(totals, highestImpactCategory, targetKg, streak) {
  if (!highestImpactCategory) {
    return `### Welcome to CarbonLens! 🌿
Start logging your transport, energy, food, or waste entries above to see your breakdown.

**Tip**: Setting a daily target (the default is 5.5 kg CO2e) will help you establish a streak. Log entries to build momentum!`;
  }

  const netEmissions = Object.values(totals).reduce((a, b) => a + b, 0);
  const relevantActions = ACTION_CATALOG.filter(
    (action) => action.category === highestImpactCategory
  );

  let advice = `### Carbon Coach Insights (Rule Engine) ⚡

Your highest emissions today come from **${highestImpactCategory.toUpperCase()}** (${totals[highestImpactCategory].toFixed(2)} kg CO2e).
Your total emissions are **${netEmissions.toFixed(2)} kg CO2e** compared to your daily budget of **${targetKg} kg CO2e**.

`;

  if (streak > 0) {
    advice += `🔥 **Streak Alert**: You are on a **${streak}-day streak** of keeping your emissions under target! Keep it up!\n\n`;
  }

  advice += `Here are personalized actions to target your **${highestImpactCategory}** emissions:\n\n`;

  if (relevantActions.length > 0) {
    relevantActions.forEach((action) => {
      advice += `- **${action.title}**: ${action.description} *(Potential saving: −${action.estimatedDailySavingKg} kg/day)*\n`;
    });
  } else {
    advice += `- **Focus on small daily adjustments**: Small shifts in your ${highestImpactCategory} routine compound significantly over the year.\n`;
  }

  // Add a cross-cutting general recommendation
  const alternativeCategory = Object.keys(totals).find(
    (cat) => cat !== highestImpactCategory && totals[cat] > 0
  );
  if (alternativeCategory) {
    const backupAction = ACTION_CATALOG.find((action) => action.category === alternativeCategory);
    if (backupAction) {
      advice += `\n**Secondary Tip (for ${alternativeCategory})**:\n- **${backupAction.title}**: ${backupAction.description} *(Potential saving: −${backupAction.estimatedDailySavingKg} kg/day)*\n`;
    }
  }

  return advice;
}
