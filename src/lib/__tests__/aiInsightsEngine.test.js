import { describe, it, expect } from "vitest";
import { buildGeminiPrompt, generateLocalFallbackInsights } from "../aiInsightsEngine";

describe("aiInsightsEngine", () => {
  const mockTotals = { transport: 12.5, energy: 4.2, food: 2.1, waste: 0.8 };
  const mockTarget = 5.5;

  describe("buildGeminiPrompt", () => {
    it("constructs a rich prompt containing user parameters", () => {
      const prompt = buildGeminiPrompt(mockTotals, "transport", mockTarget, 4);

      expect(prompt).toContain("transport: 12.50 kg CO2e");
      expect(prompt).toContain("energy: 4.20 kg CO2e");
      expect(prompt).toContain("Highest impact category: transport");
      expect(prompt).toContain("target budget: 5.5 kg CO2e");
      expect(prompt).toContain("streak under target: 4 days");
    });

    it("handles null highest impact category gracefully", () => {
      const prompt = buildGeminiPrompt(mockTotals, null, mockTarget, 0);
      expect(prompt).toContain("Highest impact category: None logged yet");
    });
  });

  describe("generateLocalFallbackInsights", () => {
    it("returns a descriptive welcome message when no entries are logged", () => {
      const insights = generateLocalFallbackInsights(
        { transport: 0, energy: 0, food: 0, waste: 0 },
        null,
        mockTarget,
        0
      );

      expect(insights).toContain("Welcome to CarbonLens!");
      expect(insights).toContain("Start logging your transport");
    });

    it("generates targeted recommendation tips for the highest emitting category", () => {
      const insights = generateLocalFallbackInsights(mockTotals, "transport", mockTarget, 0);

      expect(insights).toContain("Your highest emissions today come from **TRANSPORT**");
      expect(insights).toContain("Swap one car trip a day for the train");
      expect(insights).toContain("Bike for trips under 5km");
    });

    it("includes streak announcements when current streak is active", () => {
      const insights = generateLocalFallbackInsights(mockTotals, "transport", mockTarget, 3);
      expect(insights).toContain("🔥 **Streak Alert**: You are on a **3-day streak**");
    });
  });
});
