import { useState } from "react";
import { useApp } from "../context/AppContext";

export const NotificationBell = () => {
  const { notifications, dismissNotification, dismissAllNotifications } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ position: "relative", width: "36px", height: "36px", background: "#15152a", border: "1px solid #252540", borderRadius: "8px", color: "#888", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        🔔
        {notifications.length > 0 && (
          <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#fc8181", borderRadius: "50%", width: "16px", height: "16px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#0f0f1e", border: "1px solid #252540", borderRadius: "10px", width: "280px", zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
          <div style={{ padding: "0.6rem 0.9rem", borderBottom: "1px solid #1a1a2e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Notifications</span>
            {notifications.length > 0 && (
              <button onClick={dismissAllNotifications} style={{ fontSize: "0.7rem", color: "#555", background: "none", border: "none", cursor: "pointer" }}>Dismiss all</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#555", fontSize: "0.8rem" }}>All clear ✓</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{ padding: "0.6rem 0.9rem", borderBottom: "1px solid #1a1a2e", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                <span>{n.type === "overdue" ? "🔴" : "🟡"}</span>
                <span style={{ flex: 1, fontSize: "0.78rem", color: "#ccc" }}>{n.text}</span>
                <button onClick={() => dismissNotification(n.id)} style={{ color: "#444", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
