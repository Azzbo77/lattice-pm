import React, { ReactNode } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import type { Role } from "../../types";
import { bg, clr, font, space, radius, shadow, inputStyle } from "../../constants/theme";

// ── Shared style objects ──────────────────────────────────────────────────────
export const inp: React.CSSProperties = inputStyle;

export const selStyle: React.CSSProperties = {
  padding:      `${space[2]} ${space[4]}`,
  background:   bg.raised,
  border:       `1px solid ${bg.muted}`,
  borderRadius: radius.md,
  color:        clr.textPrimary,
  fontSize:     font.base,
  cursor:       "pointer",
  outline:      "none",
  colorScheme:  "dark",
};

export const miniSel = (accentColor: string): React.CSSProperties => ({
  background:   `${accentColor}18`,
  border:       `1px solid ${accentColor}50`,
  color:        accentColor,
  borderRadius: radius.sm,
  padding:      `2px ${space[3]}`,
  fontSize:     font.xs,
  cursor:       "pointer",
  outline:      "none",
  colorScheme:  "dark",
});

// ── Layout primitives ─────────────────────────────────────────────────────────
export const Overlay = ({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) => {
  const { isMobile } = useBreakpoint();
  
  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? "0" : space[6] }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ background: bg.card, border: `1px solid ${bg.muted}`, borderRadius: isMobile ? `${radius.xxl} ${radius.xxl} 0 0` : radius.xxl, padding: space[7], width: "100%", maxWidth: wide ? "580px" : "480px", maxHeight: isMobile ? "90vh" : "85vh", overflowY: "auto", boxShadow: shadow.modal }}
      >
        {children}
      </div>
    </div>
  );
};

// ── Typography ────────────────────────────────────────────────────────────────
export const Lbl = ({ c }: { c: string }) => (
  <div style={{ fontSize: font.xs, color: clr.textGhost, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: space[1] }}>{c}</div>
);

// ── Buttons ───────────────────────────────────────────────────────────────────
export const Btn = ({ children, color, small, ...p }: { children: ReactNode; color: string; small?: boolean; [key: string]: any }) => (
  <button
    {...p}
    style={{
      padding:      small ? `3px ${space[3]}` : `${space[2]} ${space[5]}`,
      borderRadius: radius.md,
      border:       color === "ghost" ? `1px solid ${bg.muted}` : `1px solid ${color}70`,
      background:   color === "ghost" ? "transparent" : `${color}20`,
      color:        color === "ghost" ? clr.textMuted : color,
      fontSize:     small ? font.xs : font.base,
      cursor:       "pointer",
      fontWeight:   500,
      whiteSpace:   "nowrap" as const,
      ...p.style,
    }}
  >
    {children}
  </button>
);

// ── Table primitives ──────────────────────────────────────────────────────────
export const TH = ({ children, center }: { children: ReactNode; center?: boolean }) => (
  <div style={{ fontSize: font.xs, color: clr.textGhost, textTransform: "uppercase", letterSpacing: "0.05em", padding: `${space[2]} ${space[3]}`, display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start" }}>
    {children}
  </div>
);

export const TD = ({ children, style, center }: { children: ReactNode; style?: React.CSSProperties; center?: boolean }) => (
  <div style={{ padding: `${space[2]} ${space[3]}`, fontSize: font.lg, color: clr.textSecondary, borderTop: `1px solid ${bg.line}`, display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", ...style }}>
    {children}
  </div>
);

// ── Avatar ────────────────────────────────────────────────────────────────────
const roleColor: Record<string, string> = {
  admin:     clr.orange,
  manager:   clr.cyan,
  office:    "#f6c90e",
  shopfloor: clr.green,
};

export const Avatar = ({ name, role, size = 32 }: { name: string; role: Role; size?: number }) => {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const color    = roleColor[role] || clr.textMuted;
  return (
    <div style={{ width: size, height: size, borderRadius: radius.full, background: `${color}25`, border: `1.5px solid ${color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size < 28 ? font.xxs : font.xs, color, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

// ── Badges ────────────────────────────────────────────────────────────────────
const isRecent = (iso?: string) => {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 12 * 60 * 60 * 1000;
};

export const UpdatedBadge = ({ iso, byName, compact }: { iso?: string; byName?: string; compact?: boolean }) => {
  if (!iso) return null;
  const recent = isRecent(iso);
  const date   = new Date(iso);
  const diff   = Date.now() - date.getTime();
  const mins   = Math.floor(diff / 60000);
  const hrs    = Math.floor(diff / 3600000);
  const days   = Math.floor(diff / 86400000);
  const rel    = mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : hrs < 24 ? `${hrs}h ago` : `${days}d ago`;
  const full   = date.toLocaleString();

  if (compact) return (
    <div title={`${byName ? `by ${byName} — ` : ""}${full}`} style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: font.xs, color: recent ? clr.cyan : clr.textGhost, whiteSpace: "nowrap" }}>
      {recent && <span style={{ width: "5px", height: "5px", borderRadius: radius.full, background: clr.cyan, display: "inline-block" }} />}
      {rel}
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: space[2], fontSize: font.xs, color: recent ? `${clr.cyan}88` : clr.textDeep }}>
      {recent && <span style={{ width: "5px", height: "5px", borderRadius: radius.full, background: clr.cyan, display: "inline-block" }} />}
      <span>{byName}</span>
      <span>{rel}</span>
    </div>
  );
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
export const ConfirmModal = ({ message, onConfirm, onClose }: { message: string; onConfirm: () => void; onClose: () => void }) => (
  <Overlay onClose={onClose}>
    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: font.h2, color: clr.textPrimary, marginBottom: space[5] }}>Are you sure?</h3>
    <p style={{ color: clr.textMuted, fontSize: font.md, marginBottom: space[7], lineHeight: 1.6 }}>{message}</p>
    <div style={{ display: "flex", gap: space[4], justifyContent: "flex-end" }}>
      <Btn color="ghost" onClick={onClose}>Cancel</Btn>
      <Btn color={clr.red} onClick={onConfirm}>Delete</Btn>
    </div>
  </Overlay>
);

// ── Pager ─────────────────────────────────────────────────────────────────────
export const Pager = ({
  page, totalPages, total, pageSize, onPrev, onNext, onGoTo,
}: {
  page:       number;
  totalPages: number;
  total:      number;
  pageSize:   number;
  onPrev:     () => void;
  onNext:     () => void;
  onGoTo:     (n: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  // Build page number buttons — always show first, last, current ±1
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const btnBase: React.CSSProperties = {
    padding: "3px 9px", borderRadius: "6px", fontSize: "0.72rem",
    cursor: "pointer", border: "1px solid #1e1e35", background: "transparent",
    color: "#8888aa",
  };
  const activeBtn: React.CSSProperties = {
    ...btnBase, background: "#14143a", color: "#c8c8e8", borderColor: "#3a3a5c",
  };
  const disabledBtn: React.CSSProperties = {
    ...btnBase, opacity: 0.3, cursor: "default",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1rem", borderTop: "1px solid #1e1e35", flexWrap: "wrap", gap: "0.5rem" }}>
      <span style={{ fontSize: "0.72rem", color: "#8888aa" }}>
        {start}–{end} of {total}
      </span>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <button onClick={onPrev} disabled={page === 1} style={page === 1 ? disabledBtn : btnBase}>‹ Prev</button>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={`ellipsis-${i}`} style={{ color: "#8888aa", fontSize: "0.72rem", padding: "0 2px" }}>…</span>
            : <button key={p} onClick={() => onGoTo(p as number)} style={p === page ? activeBtn : btnBase}>{p}</button>
        )}
        <button onClick={onNext} disabled={page === totalPages} style={page === totalPages ? disabledBtn : btnBase}>Next ›</button>
      </div>
    </div>
  );
};
