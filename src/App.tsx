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

import { TaskModal }      from "./modals/TaskModal";
import { ProjectModal }   from "./modals/ProjectModal";
import { SupplierModal, PartModal, OrderModal } from "./modals/SupplierModals";
import { BomModal }       from "./modals/BomModal";
import { MemberModal }    from "./modals/MemberModal";
import { BackupModal }    from "./modals/BackupModal";
import { WeeklySummaryModal } from "./modals/WeeklySummaryModal";
import { ConfirmModal }   from "./components/ui";
import { bg, clr, font, radius, space } from "./constants/theme";

type TabId = "dashboard" | "gantt" | "tasks" | "projects" | "suppliers" | "bom" | "team";
const TAB_ICONS:  Record<TabId, string> = { dashboard:"🏠", gantt:"📅", tasks:"✅", projects:"🗂️", suppliers:"📦", bom:"🔩", team:"👥" };
const TAB_LABELS: Record<TabId, string> = { dashboard:"Dashboard", gantt:"Timeline", tasks:"Tasks", projects:"Projects", suppliers:"Suppliers", bom:"BOM", team:"Team" };

// ── Inner app ─────────────────────────────────────────────────────────────────
const AppShell = () => {
  const {
    currentUser, mustSetPassword, tab,
    taskModal, projectModal, supplierModal, orderModal, partModal,
    bomModal, memberModal, showBackup, showSummary,
    confirmRemove,        setConfirmRemove,        removeMember,
    confirmDeleteProject, setConfirmDeleteProject, deleteProject,
    setShowSummary, setShowBackup, isAdmin, logout,
  } = useApp();

  const { isMobile } = useBreakpoint();

  if (!currentUser)    return <LoginScreen />;
  if (mustSetPassword) return <MustSetPasswordScreen />;

  const PAGE_MAP: Record<TabId, JSX.Element> = {
    dashboard: <DashboardPage />,
    gantt:     <GanttPage />,
    tasks:     <TasksPage />,
    projects:  <ProjectsPage />,
    suppliers: <SuppliersPage />,
    bom:       <BomPage />,
    team:      <TeamPage />,
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
            </div>
          )}
          <SearchBar />
          <NotificationBell />
          {/* Mobile action buttons */}
          {isMobile && (
            <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
              <button onClick={() => setShowSummary(true)} style={{ padding: space["2"]+" "+space["3"], background: `${clr.cyan}18`, border: "1px solid #00d4ff50", borderRadius: radius.md, color: clr.cyan, fontSize: font.base, cursor: "pointer" }}>📊</button>
              {isAdmin && <button onClick={() => setShowBackup(true)} style={{ padding: space["2"]+" "+space["3"], background: `${clr.green}18`, border: "1px solid #48bb7850", borderRadius: radius.md, color: clr.green, fontSize: font.base, cursor: "pointer" }}>💾</button>}
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
      {showBackup     && <BackupModal />}
      {showSummary    && <WeeklySummaryModal />}
      {confirmRemove  && (
        <ConfirmModal
          message={`Remove ${confirmRemove.name} from the team?`}
          onConfirm={() => removeMember(confirmRemove.userId)}
          onClose={() => setConfirmRemove(null)}
        />
      )}
      {confirmDeleteProject && (
        <ConfirmModal
          message={`Delete "${confirmDeleteProject.name}"? All tasks in this project will also be deleted.`}
          onConfirm={() => deleteProject(confirmDeleteProject.id)}
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
