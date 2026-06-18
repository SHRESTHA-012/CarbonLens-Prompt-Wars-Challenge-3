import { useMemo } from "react";
import "./AICoach.css";

/**
 * A simple markdown parser that converts bullet points and headers into HTML elements.
 * Keeps bundle size tiny and avoids external dependencies.
 */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="coach__space" />;

    // Headers (### Header)
    if (trimmed.startsWith("###")) {
      return (
        <h4 key={index} className="coach__heading">
          {trimmed.replace(/^###\s*/, "")}
        </h4>
      );
    }

    // Bold tags (e.g. **Text**)
    const formatBold = (str) => {
      const parts = str.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
    };

    // Bullets (- or *)
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      const cleaned = trimmed.replace(/^[-*]\s*/, "");
      return (
        <ul key={index} className="coach__bullet-list">
          <li className="coach__bullet-item">{formatBold(cleaned)}</li>
        </ul>
      );
    }

    // Paragraph
    return (
      <p key={index} className="coach__paragraph">
        {formatBold(trimmed)}
      </p>
    );
  });
}

export function AICoach({
  aiAdvice,
  aiSource,
  isGeneratingInsights,
  onGenerateInsights,
  geminiApiKey,
  onOpenSettings,
}) {
  const isGemini = aiSource === "gemini";

  const statusBadge = useMemo(() => {
    if (isGeneratingInsights) {
      return (
        <span className="coach__badge coach__badge--loading">
          <span className="coach__pulse" /> Analyzing...
        </span>
      );
    }
    if (isGemini) {
      return <span className="coach__badge coach__badge--gemini">✨ Gemini AI Enabled</span>;
    }
    return <span className="coach__badge coach__badge--fallback">⚡ Rule Engine Active</span>;
  }, [isGeneratingInsights, isGemini]);

  return (
    <section className="coach" aria-label="AI Carbon Coach Advice">
      <div className="coach__header">
        <h2 className="coach__title">AI Carbon Coach</h2>
        {statusBadge}
      </div>

      <div className="coach__body">
        {isGeneratingInsights ? (
          <div className="coach__loader" aria-live="polite" aria-busy="true">
            <div className="coach__spinner" />
            <p className="coach__loader-text">AI Coach is reviewing your carbon ledger...</p>
          </div>
        ) : (
          <div className="coach__content">{renderMarkdown(aiAdvice)}</div>
        )}
      </div>

      <div className="coach__footer">
        {geminiApiKey ? (
          <button
            type="button"
            className="coach__btn coach__btn--primary"
            onClick={() => onGenerateInsights()}
            disabled={isGeneratingInsights}
          >
            {isGeneratingInsights ? "Syncing..." : "Re-evaluate with AI"}
          </button>
        ) : (
          <div className="coach__no-key">
            <p>Enable hyper-personalized advice by adding a Gemini API Key.</p>
            <button type="button" className="coach__btn coach__btn--secondary" onClick={onOpenSettings}>
              ⚙️ Add Gemini Key
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
