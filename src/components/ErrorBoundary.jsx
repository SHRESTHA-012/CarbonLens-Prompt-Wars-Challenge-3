import { Component } from "react";

/**
 * Catches unexpected render errors and shows a graceful recovery UI
 * rather than a blank screen. Surfaces enough info for debugging without
 * leaking internal stack traces to end users in production.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message ?? "An unexpected error occurred.",
    };
  }

  componentDidCatch(error, info) {
    // In a production app, pipe this to an error monitoring service.
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            maxWidth: 520,
            margin: "60px auto",
            padding: "32px 24px",
            fontFamily: "var(--font-body, sans-serif)",
            color: "var(--color-text, #1A2E22)",
          }}
        >
          <h1 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "var(--color-text-muted, #5C6B5F)", marginBottom: 20 }}>
            CarbonLens hit an unexpected error. Your saved data is unaffected.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              background: "var(--color-primary, #3D7858)",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "10px 20px",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
