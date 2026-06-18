import { useState, useEffect, useRef } from "react";
import "./GoalModal.css";

/**
 * Accessible modal dialog for setting a custom daily CO2e target.
 * Traps focus within the modal while open and returns focus on close.
 */
export function GoalModal({ currentTarget, onSave, onClose }) {
  const [value, setValue] = useState(String(currentTarget));
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Save element that had focus before opening; restore on close
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    inputRef.current?.focus();
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  // Trap focus within modal
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = e.currentTarget.querySelectorAll(
      'button, input, [tabindex]:not([tabindex="-1"])'
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

  function handleSubmit(e) {
    e.preventDefault();
    const num = Number(value);
    if (!value.trim() || Number.isNaN(num)) {
      setError("Enter a number.");
      return;
    }
    if (num <= 0) {
      setError("Target must be greater than zero.");
      return;
    }
    if (num > 200) {
      setError("That seems too high. Try a value under 200 kg.");
      return;
    }
    onSave(num);
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-modal-title"
        className="modal"
        onKeyDown={handleKeyDown}
      >
        <h2 id="goal-modal-title" className="modal__title">Set your daily target</h2>
        <p className="modal__body">
          The global climate goal is about <strong>5.5 kg CO₂e/day</strong>. Set a personal
          target that works for you — it appears in your balance ring and weekly chart.
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <label className="modal__label" htmlFor="goal-input">
            Daily target (kg CO₂e)
          </label>
          <div className="modal__input-row">
            <input
              id="goal-input"
              ref={inputRef}
              className="modal__input"
              type="number"
              inputMode="decimal"
              min="0.1"
              max="200"
              step="0.1"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "goal-error" : undefined}
            />
            <span className="modal__unit">kg / day</span>
          </div>
          {error && (
            <p id="goal-error" className="modal__error" role="alert">{error}</p>
          )}
          <div className="modal__actions">
            <button type="button" className="modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal__save">
              Save target
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
