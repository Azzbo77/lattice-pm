// ── ErrorBoundary ─────────────────────────────────────────────────────────────
// Catches render errors in the component tree below it.
// A crash inside a page or modal will show the fallback UI instead of
// taking down the entire app.

import { Component, ReactNode, ErrorInfo } from "react";
import { bg, clr, font, radius, space } from "../constants/theme";

interface Props {
  children:  ReactNode;
  /** Optional label shown in the error UI, e.g. "Tasks page" */
  label?:    string;
  /** If true, renders a compact inline error rather than a full panel */
  inline?:   boolean;
}

interface State {
  hasError: boolean;
  message:  string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", this.props.label ?? "component", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = "This section", inline = false } = this.props;

    if (inline) {
      return (
        <div style={{
          display: "flex", alignItems: "center", gap: space["3"],
          padding: `${space["3"]} ${space["4"]}`,
          background: "#fc818110", border: `1px solid ${clr.red}40`,
          borderRadius: radius.lg, fontSize: font.base, color: clr.red,
        }}>
          <span>⚠</span>
          <span style={{ flex: 1 }}>{label} failed to render.</span>
          <button
            onClick={this.reset}
            style={{ fontSize: font.xs, color: clr.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "200px", padding: "2rem",
      }}>
        <div style={{
          background: bg.card,
          border: `1px solid ${clr.red}40`,
          borderLeft: `3px solid ${clr.red}`,
          borderRadius: radius.xl,
          padding: "1.5rem",
          maxWidth: "480px", width: "100%",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "1.75rem", marginBottom: space["4"] }}>⚠</div>
          <div style={{ fontSize: font.h3, color: clr.textPrimary, fontWeight: 600, marginBottom: space["3"] }}>
            {label} encountered an error
          </div>
          <div style={{
            fontSize: font.base, color: clr.textFaint,
            background: bg.raised, borderRadius: radius.md,
            padding: `${space["3"]} ${space["4"]}`,
            marginBottom: space["6"],
            fontFamily: "monospace", wordBreak: "break-word", textAlign: "left",
          }}>
            {this.state.message}
          </div>
          <button
            onClick={this.reset}
            style={{
              padding: `${space["3"]} ${space["6"]}`,
              background: `${clr.cyan}18`, border: `1px solid ${clr.cyan}50`,
              borderRadius: radius.md, color: clr.cyan,
              fontSize: font.base, cursor: "pointer",
            }}
          >
            Try again
          </button>
          <div style={{ marginTop: space["3"], fontSize: font.xs, color: clr.textGhost }}>
            If this keeps happening, try refreshing the page.
          </div>
        </div>
      </div>
    );
  }
}
