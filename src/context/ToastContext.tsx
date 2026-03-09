// ── ToastContext ──────────────────────────────────────────────────────────────
// Lightweight toast notification system for API operation feedback.
// Usage: const { showToast } = useToast();
//        showToast("Task saved", "success");

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { bg, clr, font, radius, space } from "../constants/theme";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id:      string;
  message: string;
  type:    ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};

const TOAST_DURATION = 4000;

const TOAST_STYLES: Record<ToastType, { border: string; icon: string; color: string }> = {
  success: { border: clr.green,  icon: "✓", color: clr.green  },
  error:   { border: clr.red,    icon: "✕", color: clr.red    },
  warning: { border: clr.yellow, icon: "⚠", color: clr.yellow },
  info:    { border: clr.cyan,   icon: "ℹ", color: clr.cyan   },
};

// ── ToastStack — renders in the bottom-right corner ───────────────────────────
const ToastStack = ({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) => {
  if (toasts.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position: "fixed", bottom: "1.25rem", right: "1.25rem",
        zIndex: 1000, display: "flex", flexDirection: "column", gap: space["3"],
        maxWidth: "320px", width: "calc(100vw - 2.5rem)",
      }}
    >
      {toasts.map(toast => {
        const s = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            style={{
              display: "flex", alignItems: "center", gap: space["4"],
              background: bg.card,
              border: `1px solid ${s.border}40`,
              borderLeft: `3px solid ${s.border}`,
              borderRadius: radius.lg,
              padding: `${space["3"]} ${space["4"]}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              animation: "toastIn 0.2s ease-out",
            }}
          >
            {/* Icon */}
            <div style={{
              width: "22px", height: "22px", borderRadius: "50%",
              background: `${s.border}18`, border: `1px solid ${s.border}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", color: s.color, flexShrink: 0, fontWeight: 700,
            }}>
              {s.icon}
            </div>
            {/* Message */}
            <span style={{ flex: 1, fontSize: font.base, color: clr.textSecondary, lineHeight: 1.4 }}>
              {toast.message}
            </span>
            {/* Dismiss */}
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: "none", border: "none", color: clr.textGhost,
                cursor: "pointer", fontSize: "0.75rem", flexShrink: 0,
                padding: "2px", lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), TOAST_DURATION);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};
