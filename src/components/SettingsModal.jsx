import { useState, useEffect, useRef } from "react";
import "./SettingsModal.css";

/**
 * Accessible settings modal dialog.
 * Allows managing daily carbon target, configuring Gemini API Key, and resetting history.
 * Traps focus within the modal while open and restores focus on close.
 */
export function SettingsModal({
  currentTarget,
  onSaveTarget,
  geminiApiKey,
  onSaveApiKey,
  onClearHistory,
  onClose,
}) {
  const [targetVal, setTargetVal] = useState(String(currentTarget));
  const [targetError, setTargetError] = useState("");
  const [apiKeyVal, setApiKeyVal] = useState(geminiApiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const firstInputRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus trap lifecycle
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    firstInputRef.current?.focus();
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = e.currentTarget.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function handleSave(e) {
    e.preventDefault();
    const num = Number(targetVal);
    if (!targetVal.trim() || Number.isNaN(num)) {
      setTargetError("Enter a valid target number.");
      return;
    }
    if (num <= 0) {
      setTargetError("Target must be greater than zero.");
      return;
    }
    if (num > 200) {
      setTargetError("Try a value under 200 kg CO2e.");
      return;
    }

    onSaveTarget(num);
    onSaveApiKey(apiKeyVal.trim());
    onClose();
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onClearHistory();
    setConfirmReset(false);
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="settings-modal"
        onKeyDown={handleKeyDown}
      >
        <div className="settings-modal__header">
          <h2 id="settings-modal-title" className="settings-modal__title">
            Settings & Goals ⚙️
          </h2>
          <button type="button" className="settings-modal__close-btn" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <form onSubmit={handleSave} noValidate className="settings-modal__form">
          {/* Target setting */}
          <div className="settings-modal__section">
            <h3 className="settings-modal__sec-title">Daily Emissions Target</h3>
            <p className="settings-modal__sec-desc">
              The climate-aligned target is <strong>5.5 kg CO₂e/day</strong>. Adjust this budget to configure your target lines.
            </p>
            <div className="settings-modal__input-group">
              <label htmlFor="target-input" className="settings-modal__label">
                Daily Budget (kg CO₂e)
              </label>
              <div className="settings-modal__input-row">
                <input
                  id="target-input"
                  ref={firstInputRef}
                  className="settings-modal__input"
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  max="200"
                  step="0.1"
                  value={targetVal}
                  onChange={(e) => {
                    setTargetVal(e.target.value);
                    setTargetError("");
                  }}
                  aria-invalid={Boolean(targetError)}
                  aria-describedby={targetError ? "target-error" : undefined}
                />
                <span className="settings-modal__unit">kg CO₂e</span>
              </div>
              {targetError && (
                <p id="target-error" className="settings-modal__error" role="alert">
                  {targetError}
                </p>
              )}
            </div>
          </div>

          {/* Gemini API Key config */}
          <div className="settings-modal__section">
            <h3 className="settings-modal__sec-title">Google Gemini Integration ✨</h3>
            <p className="settings-modal__sec-desc">
              Input a Gemini API Key to enable dynamic, context-aware advice. Leave blank to use the local Rule Engine fallback.
            </p>
            <div className="settings-modal__input-group">
              <label htmlFor="api-key-input" className="settings-modal__label">
                Gemini API Key
              </label>
              <div className="settings-modal__input-row">
                <input
                  id="api-key-input"
                  className="settings-modal__input settings-modal__input--key"
                  type={showKey ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={apiKeyVal}
                  onChange={(e) => setApiKeyVal(e.target.value)}
                />
                <button
                  type="button"
                  className="settings-modal__toggle-key"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                >
                  {showKey ? "👁️" : "🔒"}
                </button>
              </div>
            </div>
          </div>

          {/* Dangerous Zone */}
          <div className="settings-modal__section settings-modal__section--danger">
            <h3 className="settings-modal__sec-title danger-text">Danger Zone ⚠️</h3>
            <p className="settings-modal__sec-desc">
              Clears all logged transport, energy, food, and waste entries from your local browser ledger. This cannot be undone.
            </p>
            <button
              type="button"
              className={`settings-modal__reset-btn ${confirmReset ? "settings-modal__reset-btn--confirm" : ""}`}
              onClick={handleReset}
            >
              {confirmReset ? "Are you sure? Click again to reset" : "Reset Ledger Data"}
            </button>
            {confirmReset && (
              <button
                type="button"
                className="settings-modal__cancel-reset"
                onClick={() => setConfirmReset(false)}
              >
                Cancel Reset
              </button>
            )}
          </div>

          <div className="settings-modal__actions">
            <button type="button" className="settings-modal__btn settings-modal__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="settings-modal__btn settings-modal__btn--save">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
