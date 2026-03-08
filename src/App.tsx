import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar }             from "./components/Sidebar";
import { SearchBar }           from "./components/SearchBar";
import { NotificationBell }    from "./components/NotificationBell";
import { useBreakpoint }       from "./hooks/useBreakpoint";

import { LoginScreen, MustSetPasswordScreen } from "./pages/AuthScreens";
import { DashboardPage }  from "./pages/DashboardPage";
import { GanttPage }      from "./pages/GanttPage";
import { TasksPage }      from "./pages/TasksPage";
import { ProjectsPage }   from "./pages/ProjectsPage";
import { SuppliersPage }  from "./pages/SuppliersPage";
import { BomPage }        from "./pages/BomPage";
import { TeamPage }       from "./pages/TeamPage";
import { Noticeboard }    from "./pages/Noticeboard";

import { TaskModal }      from "./modals/TaskModal";
import { ProjectModal }   from "./modals/ProjectModal";
import { SupplierModal, PartModal, OrderModal } from "./modals/SupplierModals";
import { BomModal }       from "./modals/BomModal";
import { MemberModal }    from "./modals/MemberModal";
import { GuidePanel, APP_VERSION } from "./modals/GuidePanel";
import { WeeklySummaryModal } from "./modals/WeeklySummaryModal";
import { ConfirmModal }   from "./components/ui";
import { bg, clr, font, radius, space } from "./constants/theme";

type TabId = "dashboard" | "gantt" | "tasks" | "projects" | "suppliers" | "bom" | "team" | "noticeboard";
const TAB_ICONS:  Record<TabId, string> = { dashboard:"🏠", gantt:"📅", tasks:"✅", projects:"🗂️", suppliers:"📦", bom:"🔩", team:"👥", noticeboard:"📋" };
const TAB_LABELS: Record<TabId, string> = { dashboard:"Dashboard", gantt:"Timeline", tasks:"Tasks", projects:"Projects", suppliers:"Suppliers", bom:"BOM", team:"Team", noticeboard:"Noticeboard" };

// ── Inner app ─────────────────────────────────────────────────────────────────
const AppShell = () => {
  const {
    currentUser, sessionReady, mustSetPassword, loading, tab,
    taskModal, projectModal, supplierModal, orderModal, partModal,
    bomModal, memberModal, showSummary,
    confirmRemove,        setConfirmRemove,        removeMember,
    confirmDeleteProject, setConfirmDeleteProject, deleteProject,
    confirmDeleteBom,     setConfirmDeleteBom,     deleteBomEntry,
    setShowSummary, isAdmin, logout,
  } = useApp();

  const { isMobile } = useBreakpoint();
  const [showGuide, setShowGuide] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  // Wait for session rehydration before rendering — prevents login screen flash on refresh
  if (!sessionReady)   return <div style={{ minHeight: "100vh", background: "#06060f" }} />;
  if (!currentUser)    return <LoginScreen />;
  if (mustSetPassword) return <MustSetPasswordScreen />;
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#06060f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#555" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>◈</div>
        <div style={{ fontSize: "0.75rem" }}>Loading…</div>
      </div>
    </div>
  );

  const PAGE_MAP: Record<TabId, JSX.Element> = {
    dashboard: <DashboardPage />,
    gantt:     <GanttPage />,
    tasks:     <TasksPage />,
    projects:  <ProjectsPage />,
    suppliers: <SuppliersPage />,
    bom:       <BomPage />,
    team:        <TeamPage />,
    noticeboard: <Noticeboard />,
  };

  return (
    <div style={{ minHeight: "100vh", background: bg.deep, color: clr.textPrimary, fontFamily: "'IBM Plex Sans',system-ui,sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a18; }
        ::-webkit-scrollbar-thumb { background: #252540; border-radius: 3px; }
        button { cursor: pointer; }
        select, input, textarea { font-family: inherit; }
        /* Force dark colour scheme on all form controls — prevents white
           option dropdowns on Windows Chrome/Edge */
        select { color-scheme: dark; }
        option { background: #0f0f1e !important; color: #e0e0e0; }
        select:focus { outline: 1px solid #00d4ff80; border-color: #00d4ff80; }
        input:focus, textarea:focus { outline: 1px solid #00d4ff80; border-color: #00d4ff80 !important; }
      `}</style>

      {/* Update available banner */}
      {updateReady && (
        <div style={{
          position: "fixed", bottom: "1rem", left: "50%", transform: "translateX(-50%)",
          background: bg.card, border: `1px solid ${clr.cyan}50`,
          borderRadius: radius.lg, padding: `${space["3"]} ${space["5"]}`,
          display: "flex", alignItems: "center", gap: space["4"],
          zIndex: 500, boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
          fontSize: font.base, color: clr.textSecondary,
        }}>
          <span>🔄 A new version is available</span>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: `${space["1"]} ${space["4"]}`, borderRadius: radius.md, border: `1px solid ${clr.cyan}50`, background: `${clr.cyan}15`, color: clr.cyan, fontSize: font.base, cursor: "pointer" }}
          >Refresh</button>
          <button
            onClick={() => setUpdateReady(false)}
            style={{ background: "none", border: "none", color: clr.textGhost, cursor: "pointer", fontSize: "0.9rem" }}
          >✕</button>
        </div>
      )}
      {/* Sidebar / mobile tab bar */}
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ padding: isMobile ? "0.5rem 0.75rem" : "0.6rem 1.25rem", background: "#0d0d20", borderBottom: "1px solid #1a1a30", display: "flex", alignItems: "center", gap: "0.75rem", position: "sticky", top: 0, zIndex: 50 }}>
          {/* Page title — hidden on mobile to save space */}
          {!isMobile && (
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: clr.textPrimary, flexShrink: 0 }}>
              {TAB_ICONS[tab as TabId]} {TAB_LABELS[tab as TabId]}
            </h2>
          )}
          {/* Logo on mobile */}
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
              <div style={{ width: "22px", height: "22px", background: "linear-gradient(135deg,#00d4ff,#ff6b35)", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>◈</div>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.95rem", color: clr.textPrimary }}>Lattice</span>
              <span style={{ fontSize: font.xxs, color: clr.textGhost, background: bg.muted, padding: "1px 5px", borderRadius: radius.xs }}>{APP_VERSION}</span>
            </div>
          )}
          <SearchBar />
          <NotificationBell />
          {/* Guide button */}
          {!isMobile && (
            <button onClick={() => setShowGuide(true)} title="Getting started guide" style={{ padding: `${space["2"]} ${space["3"]}`, background: "transparent", border: `1px solid ${bg.muted}`, borderRadius: radius.md, color: clr.textGhost, fontSize: font.base, cursor: "pointer", flexShrink: 0 }} aria-label="Open getting started guide">?</button>
          )}
          {/* Mobile action buttons */}
          {isMobile && (
            <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
              <button onClick={() => setShowGuide(true)} style={{ padding: space["2"]+" "+space["3"], background: "transparent", border: `1px solid ${bg.muted}`, borderRadius: radius.md, color: clr.textGhost, fontSize: font.base, cursor: "pointer" }} aria-label="Open guide">?</button>
              <button onClick={() => setShowSummary(true)} style={{ padding: space["2"]+" "+space["3"], background: `${clr.cyan}18`, border: "1px solid #00d4ff50", borderRadius: radius.md, color: clr.cyan, fontSize: font.base, cursor: "pointer" }}>📊</button>
              <button onClick={logout} style={{ padding: space["2"]+" "+space["3"], background: "transparent", border: "1px solid #252540", borderRadius: radius.md, color: "#555", fontSize: font.base, cursor: "pointer" }}>⎋</button>
            </div>
          )}
        </div>

        {/* Page content — extra bottom padding on mobile for tab bar */}
        <div style={{ padding: isMobile ? "0.875rem 0.75rem" : "1.25rem", flex: 1, paddingBottom: isMobile ? "72px" : undefined }}>
          {PAGE_MAP[tab as TabId] || <DashboardPage />}
        </div>
      </div>

      {/* ── Modals ── */}
      {taskModal      && <TaskModal />}
      {projectModal   && <ProjectModal />}
      {supplierModal  && <SupplierModal />}
      {orderModal     && <OrderModal />}
      {partModal      && <PartModal />}
      {bomModal       && <BomModal />}
      {memberModal    && <MemberModal />}
      {showGuide      && <GuidePanel onClose={() => setShowGuide(false)} />}
      {showSummary    && <WeeklySummaryModal />}
      {confirmRemove  && (
        <ConfirmModal
          message={`Remove ${confirmRemove.name} from the team?`}
          onConfirm={async () => removeMember(confirmRemove.userId)}
          onClose={() => setConfirmRemove(null)}
        />
      )}
      {confirmDeleteBom && (
        <ConfirmModal
          message="Delete this BOM entry?"
          onConfirm={async () => { await deleteBomEntry(confirmDeleteBom); setConfirmDeleteBom(null); }}
          onClose={() => setConfirmDeleteBom(null)}
        />
      )}
      {confirmDeleteProject && (
        <ConfirmModal
          message={`Delete "${confirmDeleteProject.name}"? All tasks in this project will also be deleted.`}
          onConfirm={async () => deleteProject(confirmDeleteProject.id)}
          onClose={() => setConfirmDeleteProject(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
