import { useState } from "react";
import type { Role, User, Notification } from "../types";
import { useApp } from "../context/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { Avatar } from "./ui";
import { roleColor } from "../constants/seeds";

const TABS = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "gantt",     icon: "📅", label: "Timeline"  },
  { id: "tasks",     icon: "✅", label: "Tasks"      },
  { id: "projects",  icon: "🗂️", label: "Projects"  },
  { id: "suppliers", icon: "📦", label: "Suppliers"  },
  { id: "bom",       icon: "🔩", label: "BOM"        },
  { id: "team",      icon: "👥", label: "Team"       },
];

// ── Mobile bottom tab bar ─────────────────────────────────────────────────────
const MobileTabBar = ({ tab, setTab, notifications }: { tab: string; setTab: (t: string) => void; notifications: Notification[] }) => {
  // Show 5 most important tabs; rest go in "More" sheet
  const primary   = TABS.slice(0, 5);
  const secondary = TABS.slice(5);
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More sheet */}
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", bottom: "64px", left: 0, right: 0, background: "#0f0f1e", borderTop: "1px solid #252540", padding: "0.75rem" }}
          >
            {secondary.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setShowMore(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: tab === t.id ? "#1a1a35" : "transparent", border: tab === t.id ? "1px solid #252550" : "1px solid transparent", borderRadius: "8px", color: tab === t.id ? "#00d4ff" : "#888", fontSize: "0.9rem", marginBottom: "2px" }}
              >
                <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "60px", background: "#0d0d20", borderTop: "1px solid #1a1a30", display: "flex", alignItems: "stretch", zIndex: 100 }}>
        {primary.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setShowMore(false); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", background: "transparent", border: "none", color: tab === t.id ? "#00d4ff" : "#555", fontSize: "0.58rem", fontWeight: tab === t.id ? 600 : 400, borderTop: `2px solid ${tab === t.id ? "#00d4ff" : "transparent"}`, cursor: "pointer" }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        {/* More button */}
        <button
          onClick={() => setShowMore((s) => !s)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", background: "transparent", border: "none", color: showMore ? "#00d4ff" : "#555", fontSize: "0.58rem", borderTop: `2px solid ${showMore ? "#00d4ff" : "transparent"}`, cursor: "pointer" }}
        >
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>⋯</span>
          <span>More</span>
        </button>
      </div>
    </>
  );
};

// ── Desktop sidebar ───────────────────────────────────────────────────────────
const DesktopSidebar = ({ tab, setTab, currentUser, isAdmin, logout, setShowBackup, setShowSummary }: { tab: string; setTab: (t: string) => void; currentUser: User; isAdmin: boolean; logout: () => void; setShowBackup: (v: boolean) => void; setShowSummary: (v: boolean) => void }) => (
  <div style={{ width: "180px", flexShrink: 0, background: "#0d0d20", borderRight: "1px solid #1a1a30", display: "flex", flexDirection: "column", padding: "1rem 0.75rem", minHeight: "100vh", position: "sticky", top: 0 }}>
    {/* Logo */}
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", paddingLeft: "0.25rem" }}>
      <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg,#00d4ff,#ff6b35)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>◈</div>
      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0" }}>Lattice</span>
    </div>

    {/* Nav */}
    <nav style={{ flex: 1 }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.75rem", marginBottom: "2px", background: tab === t.id ? "#1a1a35" : "transparent", border: tab === t.id ? "1px solid #252550" : "1px solid transparent", borderRadius: "8px", color: tab === t.id ? "#00d4ff" : "#666", fontSize: "0.85rem", textAlign: "left", cursor: "pointer" }}
        >
          <span>{t.icon}</span><span>{t.label}</span>
        </button>
      ))}
    </nav>

    {/* User + actions */}
    <div style={{ borderTop: "1px solid #1a1a30", paddingTop: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <Avatar name={currentUser.name} role={currentUser.role} size={28} />
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: "0.75rem", color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
          <div style={{ fontSize: "0.65rem", color: roleColor[currentUser.role as Role], textTransform: "capitalize" }}>{currentUser.role}</div>
        </div>
      </div>
      <button onClick={() => setShowSummary(true)} style={{ width: "100%", padding: "0.4rem", marginBottom: "5px", background: "transparent", border: "1px solid #00d4ff60", borderRadius: "6px", color: "#00d4ff", fontSize: "0.75rem", cursor: "pointer" }}>
        📊 Weekly Summary
      </button>
      {isAdmin && (
        <button onClick={() => setShowBackup(true)} style={{ width: "100%", padding: "0.4rem", marginBottom: "5px", background: "transparent", border: "1px solid #48bb7860", borderRadius: "6px", color: "#48bb78", fontSize: "0.75rem", cursor: "pointer" }}>
          💾 Backup
        </button>
      )}
      <button onClick={logout} style={{ width: "100%", padding: "0.4rem", background: "transparent", border: "1px solid #252540", borderRadius: "6px", color: "#555", fontSize: "0.75rem", cursor: "pointer" }}>
        Sign Out
      </button>
    </div>
  </div>
);

// ── Exported component ────────────────────────────────────────────────────────
export const Sidebar = () => {
  const { currentUser, tab, setTab, isAdmin, logout, setShowBackup, setShowSummary, notifications } = useApp();
  const { isMobile } = useBreakpoint();

  if (isMobile) {
    return <MobileTabBar tab={tab} setTab={setTab} notifications={notifications} />;
  }

  if (!currentUser) return null;

  return (
    <DesktopSidebar
      tab={tab} setTab={setTab}
      currentUser={currentUser}
      isAdmin={isAdmin}
      logout={logout}
      setShowBackup={setShowBackup}
      setShowSummary={setShowSummary}
    />
  );
};
