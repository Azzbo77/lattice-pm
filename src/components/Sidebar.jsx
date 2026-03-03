import { useApp } from "../context/AppContext";
import { Avatar } from "./ui";
import { roleColor } from "../constants/seeds";

const TABS = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "gantt",     icon: "📅", label: "Timeline" },
  { id: "tasks",     icon: "✅", label: "Tasks" },
  { id: "projects",  icon: "🗂️", label: "Projects" },
  { id: "suppliers", icon: "📦", label: "Suppliers" },
  { id: "bom",       icon: "🔩", label: "BOM" },
  { id: "team",      icon: "👥", label: "Team" },
];

export const Sidebar = () => {
  const { currentUser, tab, setTab, isAdmin, logout, setShowBackup, setShowSummary } = useApp();

  return (
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
            <div style={{ fontSize: "0.65rem", color: roleColor[currentUser.role], textTransform: "capitalize" }}>{currentUser.role}</div>
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
};
