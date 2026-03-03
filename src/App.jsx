import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar }          from "./components/Sidebar";
import { SearchBar }        from "./components/SearchBar";
import { NotificationBell } from "./components/NotificationBell";

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
import { ConfirmModal }   from "./components/ui";

// ── Inner app (has access to context) ────────────────────────────────────────
const AppShell = () => {
  const {
    currentUser, mustSetPassword, tab,
    taskModal, projectModal, supplierModal, orderModal, partModal,
    bomModal, memberModal, showBackup,
    confirmRemove,        setConfirmRemove,        removeMember,
    confirmDeleteProject, setConfirmDeleteProject, deleteProject,
  } = useApp();

  // ── Auth gates ─────────────────────────────────────────────────────────────
  if (!currentUser)             return <LoginScreen />;
  if (mustSetPassword)          return <MustSetPasswordScreen />;

  const PAGE_MAP = {
    dashboard: <DashboardPage />,
    gantt:     <GanttPage />,
    tasks:     <TasksPage />,
    projects:  <ProjectsPage />,
    suppliers: <SuppliersPage />,
    bom:       <BomPage />,
    team:      <TeamPage />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a18", color: "#e0e0e0", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a18; }
        ::-webkit-scrollbar-thumb { background: #252540; border-radius: 3px; }
        button { cursor: pointer; }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ padding: "0.6rem 1.25rem", background: "#0d0d20", borderBottom: "1px solid #1a1a30", display: "flex", alignItems: "center", gap: "1rem", position: "sticky", top: 0, zIndex: 50 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", flexShrink: 0 }}>
            {{ dashboard:"🏠", gantt:"📅", tasks:"✅", projects:"🗂️", suppliers:"📦", bom:"🔩", team:"👥" }[tab]} {{ dashboard:"Dashboard", gantt:"Timeline", tasks:"Tasks", projects:"Projects", suppliers:"Suppliers", bom:"BOM", team:"Team" }[tab]}
          </h2>
          <SearchBar />
          <NotificationBell />
        </div>

        {/* Page content */}
        <div style={{ padding: "1.25rem", flex: 1 }}>
          {PAGE_MAP[tab] || <DashboardPage />}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {taskModal      && <TaskModal />}
      {projectModal   && <ProjectModal />}
      {supplierModal  && <SupplierModal />}
      {orderModal     && <OrderModal />}
      {partModal      && <PartModal />}
      {bomModal       && <BomModal />}
      {memberModal    && <MemberModal />}
      {showBackup     && <BackupModal />}
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

// ── Root export ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
