import { roleColor } from "../../constants/seeds";
import { initials } from "../../utils/dateHelpers";

export const inp = {
  width: "100%", padding: "0.5rem 0.75rem",
  background: "#15152a", border: "1px solid #252540",
  borderRadius: "6px", color: "#e0e0e0",
  fontSize: "0.875rem", boxSizing: "border-box", outline: "none",
  colorScheme: "dark",
};

// Shared style for filter/page-level selects (smaller than modal inp)
export const selStyle = {
  padding: "0.3rem 0.6rem",
  background: "#15152a",
  border: "1px solid #252540",
  borderRadius: "6px",
  color: "#e0e0e0",
  fontSize: "0.8rem",
  cursor: "pointer",
  outline: "none",
  colorScheme: "dark",
};

// Shared style for inline status/priority mini-selects inside table rows
export const miniSel = (accentColor) => ({
  padding: "2px 5px",
  background: `${accentColor}25`,
  border: `1px solid ${accentColor}70`,
  borderRadius: "4px",
  color: accentColor,
  fontSize: "0.7rem",
  cursor: "pointer",
  outline: "none",
  fontWeight: 600,
  colorScheme: "dark",
});

export const Overlay = ({ children, onClose, wide }) => {
  const isMobile = window.innerWidth < 640;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? "0" : "1rem" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#0f0f1e", border: "1px solid #252540", borderRadius: isMobile ? "16px 16px 0 0" : "12px", padding: "1.5rem", width: "100%", maxWidth: isMobile ? "100%" : (wide ? "720px" : "500px"), maxHeight: isMobile ? "90vh" : "92vh", overflowY: "auto" }}
      >
        {children}
      </div>
    </div>
  );
};

export const Lbl = ({ c }) => (
  <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c}</div>
);

export const Btn = ({ children, color, small, ...p }) => (
  <button
    style={{
      padding: small ? "0.3rem 0.65rem" : "0.45rem 1rem",
      borderRadius: "6px",
      border: color === "ghost" ? "1px solid #252540" : "none",
      background: color === "ghost" ? "transparent" : color || "#252540",
      color: color === "ghost" ? "#666" : "#fff",
      fontSize: small ? "0.72rem" : "0.83rem",
      fontWeight: 600, cursor: "pointer",
    }}
    {...p}
  >
    {children}
  </button>
);

export const Avatar = ({ name, role, size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: `${roleColor[role]}18`, border: `2px solid ${roleColor[role]}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, color: roleColor[role], fontSize: size * 0.27,
  }}>
    {initials(name)}
  </div>
);

export const TH = ({ children }) => (
  <div style={{ fontSize: "0.62rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0.4rem 0.5rem" }}>
    {children}
  </div>
);

export const TD = ({ children, style }) => (
  <div style={{ padding: "0.65rem 0.5rem", fontSize: "0.82rem", color: "#ccc", borderTop: "1px solid #141428", ...style }}>
    {children}
  </div>
);

export const ConfirmModal = ({ message, onConfirm, onClose }) => (
  <Overlay onClose={onClose}>
    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "0.75rem" }}>Are you sure?</h3>
    <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "1.25rem" }}>{message}</p>
    <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
      <Btn color="ghost" onClick={onClose}>Cancel</Btn>
      <Btn color="#fc8181" onClick={onConfirm}>Remove</Btn>
    </div>
  </Overlay>
);

// ── Timestamp badge ───────────────────────────────────────────────────────────
import { timeAgo, isRecent } from "../../utils/dateHelpers";

export const UpdatedBadge = ({ iso, byName, compact = false }) => {
  if (!iso) return null;
  const recent = isRecent(iso);
  const ago    = timeAgo(iso);

  if (compact) {
    return (
      <span
        title={byName ? `Updated ${ago} by ${byName}` : `Updated ${ago}`}
        style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "0.62rem", color: recent ? "#00d4ff" : "#444", whiteSpace: "nowrap" }}
      >
        {recent && (
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00d4ff", display: "inline-block", flexShrink: 0 }} />
        )}
        {ago}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: recent ? "#00d4ff88" : "#333" }}>
      {recent && (
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d4ff", flexShrink: 0 }} />
      )}
      <span>
        {byName ? `Updated ${ago} by ${byName}` : `Updated ${ago}`}
      </span>
    </div>
  );
};
