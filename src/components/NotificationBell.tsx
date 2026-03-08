import { useState } from "react";
import { useApp } from "../context/AppContext";
import { bg, clr, font, radius, space } from "../constants/theme";

export const NotificationBell = () => {
  const { notifications, dismissNotification, dismissAllNotifications, setTab } = useApp();
  const [open, setOpen] = useState(false);

  const taskNotifs    = notifications.filter(n => n.type !== "mention");
  const mentionNotifs = notifications.filter(n => n.type === "mention");
  const total         = notifications.length;

  const handleMentionClick = (announcementId?: string) => {
    setTab("noticeboard");
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ position: "relative", width: "36px", height: "36px", background: bg.raised, border: "1px solid #252540", borderRadius: radius.lg, color: clr.textMuted, fontSize: space["6"], display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        🔔
        {total > 0 && (
          <span style={{ position: "absolute", top: "-4px", right: "-4px", background: clr.red, borderRadius: "50%", width: "16px", height: "16px", fontSize: font.xxs, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
            {total}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: bg.card, border: "1px solid #252540", borderRadius: radius.xl, width: "300px", zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
          {/* Header */}
          <div style={{ padding: "0.6rem 0.9rem", borderBottom: "1px solid #1a1a2e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: font.lg, fontWeight: 600 }}>Notifications</span>
            {total > 0 && (
              <button onClick={dismissAllNotifications} style={{ fontSize: "0.7rem", color: clr.textFaint, background: "none", border: "none", cursor: "pointer" }}>
                Dismiss all
              </button>
            )}
          </div>

          {total === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: clr.textFaint, fontSize: "0.8rem" }}>All clear ✓</div>
          ) : (
            <>
              {/* Mentions section */}
              {mentionNotifs.length > 0 && (
                <>
                  <div style={{ padding: "0.35rem 0.9rem 0.2rem", fontSize: font.xs, color: clr.textGhost, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                    Mentions
                  </div>
                  {mentionNotifs.map((n) => (
                    <div
                      key={n.id}
                      style={{ padding: "0.55rem 0.9rem", borderBottom: "1px solid #1a1a2e", display: "flex", gap: font.xxs, alignItems: "flex-start" }}
                    >
                      <span>📣</span>
                      <button
                        onClick={() => handleMentionClick(n.announcementId)}
                        style={{ flex: 1, fontSize: font.md, color: clr.cyan, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, textDecoration: "underline" }}
                      >
                        {n.text}
                      </button>
                      <button onClick={() => dismissNotification(n.id)} style={{ color: clr.textGhost, background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
                    </div>
                  ))}
                </>
              )}

              {/* Task alerts section */}
              {taskNotifs.length > 0 && (
                <>
                  {mentionNotifs.length > 0 && (
                    <div style={{ padding: "0.35rem 0.9rem 0.2rem", fontSize: font.xs, color: clr.textGhost, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                      Task alerts
                    </div>
                  )}
                  {taskNotifs.map((n) => (
                    <div key={n.id} style={{ padding: "0.55rem 0.9rem", borderBottom: "1px solid #1a1a2e", display: "flex", gap: font.xxs, alignItems: "flex-start" }}>
                      <span>{n.type === "overdue" ? "🔴" : "🟡"}</span>
                      <span style={{ flex: 1, fontSize: font.md, color: clr.textSecondary }}>{n.text}</span>
                      <button onClick={() => dismissNotification(n.id)} style={{ color: clr.textGhost, background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
