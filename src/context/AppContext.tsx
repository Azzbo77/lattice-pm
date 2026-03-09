// ── AppContext ────────────────────────────────────────────────────────────────
// Thin composition layer — merges Auth, Data, UI and Notifications into the
// single AppContextType that every component already consumes via useApp().
// No logic lives here — each concern is owned by its dedicated context.

import {
  createContext, useContext, useCallback, useMemo, ReactNode,
} from "react";
import { AuthProvider, useAuth }                  from "./AuthContext";
import { DataProvider, useData }                  from "./DataContext";
import { UIProvider, useUI }                      from "./UIContext";
import { NotificationsProvider, useNotifications } from "./NotificationsContext";
import { ToastProvider }                           from "./ToastContext";
import type {
  User, Project, Task, Supplier, Part, Order, BomEntry, BomRow, Notification, Announcement,
} from "../types";

// ── Re-export the full merged type that components depend on ──────────────────
export interface AppContextType {
  // ── Auth ──
  currentUser:     User | null;
  sessionReady:    boolean;
  mustSetPassword: boolean;
  isAdmin:         boolean;
  canManage:       boolean;
  canSuppliers:    boolean;
  login:                (email: string, password: string) => Promise<string | null>;
  logout:               () => void;
  completePasswordReset:(newPassword: string) => Promise<void>;
  // ── Data ──
  users:         User[];
  projects:      Project[];
  tasks:         Task[];
  suppliers:     Supplier[];
  bom:           BomEntry[];
  announcements: Announcement[];
  loading:       boolean;
  bomRows:       BomRow[];
  filteredBom:   BomRow[];
  setUsers:      React.Dispatch<React.SetStateAction<User[]>>;
  saveTask:             (t: Task) => Promise<void>;
  deleteTask:           (id: string) => Promise<void>;
  updateTaskStatus:     (id: string, status: string) => Promise<void>;
  saveProject:          (p: Project) => Promise<void>;
  deleteProject:        (id: string) => Promise<void>;
  saveSupplier:         (s: Supplier) => Promise<void>;
  deleteSupplier:       (id: string) => Promise<void>;
  toggleArchiveSupplier:(id: string) => Promise<void>;
  savePart:             (supplierId: string, part: Part) => Promise<void>;
  deletePart:           (supplierId: string, partId: string) => Promise<void>;
  addOrder:             (supplierId: string, order: Order) => Promise<void>;
  toggleArrived:        (supplierId: string, orderId: string) => Promise<void>;
  saveBomEntry:         (entry: BomEntry) => Promise<void>;
  deleteBomEntry:       (id: string) => Promise<void>;
  saveAnnouncement:     (a: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement:   (id: string) => Promise<void>;
  saveMember:           (m: User) => Promise<void>;
  removeMember:         (id: string) => Promise<void>;
  // ── UI ──
  tab:        string;
  pf:         string;
  bomFilter:  string;
  taskFilter: string;
  setTab:       (tab: string) => void;
  setPf:        (pf: string) => void;
  setBomFilter: (f: string) => void;
  setTaskFilter:(f: string) => void;
  taskModal:     Task | null | Record<string, unknown>;
  projectModal:  Project | null | Record<string, unknown>;
  supplierModal: Supplier | null | Record<string, unknown>;
  orderModal:    string | null;
  partModal:     { supplierId: string; part: Partial<Part> } | null;
  bomModal:      { entry: BomRow | null; partId: string; supplierId: string } | null;
  memberModal:   User | null | Record<string, unknown>;
  showSummary:   boolean;
  setTaskModal:     (m: Task | null | Record<string, unknown>) => void;
  setProjectModal:  (m: Project | null | Record<string, unknown>) => void;
  setSupplierModal: (m: Supplier | null | Record<string, unknown>) => void;
  setOrderModal:    (m: string | null) => void;
  setPartModal:     (m: { supplierId: string; part: Partial<Part> } | null) => void;
  setBomModal:      (m: { entry: BomRow | null; partId: string; supplierId: string } | null) => void;
  setMemberModal:   (m: User | null | Record<string, unknown>) => void;
  setShowSummary:   (v: boolean) => void;
  confirmRemove:             { userId: string; name: string } | null;
  confirmDeleteBom:          string | null;
  confirmDeleteProject:      Project | null;
  confirmDeleteAnnouncement: string | null;
  setConfirmRemove:             (m: { userId: string; name: string } | null) => void;
  setConfirmDeleteBom:          (id: string | null) => void;
  setConfirmDeleteProject:      (m: Project | null) => void;
  setConfirmDeleteAnnouncement: (id: string | null) => void;
  // ── Derived UI ──
  filteredTasks: Task[];
  // ── Notifications ──
  notifications:           Notification[];
  dismissNotification:     (id: string) => void;
  dismissAllNotifications: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};

// ── Inner component — has access to all sub-contexts ─────────────────────────
const AppContextBridge = ({ children }: { children: ReactNode }) => {
  const auth  = useAuth();
  const data  = useData();
  const ui    = useUI();
  const notif = useNotifications();

  const filteredTasks = useMemo(() => {
    const { currentUser } = auth;
    if (!currentUser) return [];
    return data.tasks.filter(t => {
      if (currentUser.role === "shopfloor" && t.assigneeId !== currentUser.id) return false;
      if (ui.pf !== "all" && t.projectId !== ui.pf) return false;
      if (ui.taskFilter === "mine") return t.assigneeId === currentUser.id;
      if (ui.taskFilter !== "all") return t.status === ui.taskFilter;
      return true;
    });
  }, [data.tasks, auth.currentUser, ui.pf, ui.taskFilter]);

  const value: AppContextType = {
    // Auth
    currentUser:          auth.currentUser,
    sessionReady:         auth.sessionReady,
    mustSetPassword:      auth.mustSetPassword,
    isAdmin:              auth.isAdmin,
    canManage:            auth.canManage,
    canSuppliers:         auth.canSuppliers,
    login:                auth.login,
    logout:               auth.logout,
    completePasswordReset:auth.completePasswordReset,
    // Data
    users:         data.users,
    projects:      data.projects,
    tasks:         data.tasks,
    suppliers:     data.suppliers,
    bom:           data.bom,
    announcements: data.announcements,
    loading:       data.loading,
    bomRows:       data.bomRows,
    filteredBom:   data.filteredBom,
    setUsers:      data.setUsers,
    saveTask:             data.saveTask,
    deleteTask:           data.deleteTask,
    updateTaskStatus:     data.updateTaskStatus,
    saveProject:          data.saveProject,
    deleteProject:        data.deleteProject,
    saveSupplier:         data.saveSupplier,
    deleteSupplier:       data.deleteSupplier,
    toggleArchiveSupplier:data.toggleArchiveSupplier,
    savePart:             data.savePart,
    deletePart:           data.deletePart,
    addOrder:             data.addOrder,
    toggleArrived:        data.toggleArrived,
    saveBomEntry:         data.saveBomEntry,
    deleteBomEntry:       data.deleteBomEntry,
    saveAnnouncement:     data.saveAnnouncement,
    deleteAnnouncement:   data.deleteAnnouncement,
    saveMember:           data.saveMember,
    removeMember:         data.removeMember,
    // UI
    tab: ui.tab, pf: ui.pf, bomFilter: ui.bomFilter, taskFilter: ui.taskFilter,
    setTab: ui.setTab, setPf: ui.setPf, setBomFilter: ui.setBomFilter, setTaskFilter: ui.setTaskFilter,
    taskModal: ui.taskModal, projectModal: ui.projectModal, supplierModal: ui.supplierModal,
    orderModal: ui.orderModal, partModal: ui.partModal, bomModal: ui.bomModal,
    memberModal: ui.memberModal, showSummary: ui.showSummary,
    setTaskModal: ui.setTaskModal, setProjectModal: ui.setProjectModal,
    setSupplierModal: ui.setSupplierModal, setOrderModal: ui.setOrderModal,
    setPartModal: ui.setPartModal, setBomModal: ui.setBomModal,
    setMemberModal: ui.setMemberModal, setShowSummary: ui.setShowSummary,
    confirmRemove: ui.confirmRemove, confirmDeleteBom: ui.confirmDeleteBom,
    confirmDeleteProject: ui.confirmDeleteProject, confirmDeleteAnnouncement: ui.confirmDeleteAnnouncement,
    setConfirmRemove: ui.setConfirmRemove, setConfirmDeleteBom: ui.setConfirmDeleteBom,
    setConfirmDeleteProject: ui.setConfirmDeleteProject,
    setConfirmDeleteAnnouncement: ui.setConfirmDeleteAnnouncement,
    // Derived
    filteredTasks,
    // Notifications
    notifications:           notif.notifications,
    dismissNotification:     notif.dismissNotification,
    dismissAllNotifications: notif.dismissAllNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ── AppProvider — nest all sub-providers in dependency order ──────────────────
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // ToastProvider is outermost so DataContext (and everything else) can call showToast.
  // UIProvider wraps DataProvider so modal closers are available to data handlers.
  return (
    <ToastProvider>
      <UIProvider>
        <AppProviderInner>{children}</AppProviderInner>
      </UIProvider>
    </ToastProvider>
  );
};

// Split into inner to access UIContext before DataProvider is mounted
const AppProviderInner = ({ children }: { children: ReactNode }) => {
  const ui = useUI();

  // When auth logs out, clear all data state
  const handleLogout = useCallback(() => {
    // DataContext clears itself when currentUser becomes null (loadAll won't re-run)
    // We just need to reset UI tab to dashboard
    ui.setTab("dashboard");
  }, [ui]);

  return (
    <AuthProvider onLogout={handleLogout}>
      <AppProviderWithAuth ui={ui}>{children}</AppProviderWithAuth>
    </AuthProvider>
  );
};

const AppProviderWithAuth = ({ children, ui }: { children: ReactNode; ui: ReturnType<typeof useUI> }) => {
  const auth = useAuth();
  return (
    <DataProvider
      currentUser={auth.currentUser}
      bomFilter={ui.bomFilter}
      taskFilter={ui.taskFilter}
      pf={ui.pf}
      setTaskModal={ui.setTaskModal}
      setProjectModal={ui.setProjectModal}
      setSupplierModal={ui.setSupplierModal}
      setPartModal={ui.setPartModal}
      setOrderModal={ui.setOrderModal}
      setBomModal={ui.setBomModal}
      setMemberModal={ui.setMemberModal}
      setConfirmRemove={ui.setConfirmRemove}
      setConfirmDeleteProject={ui.setConfirmDeleteProject}
    >
      <AppProviderWithData>{children}</AppProviderWithData>
    </DataProvider>
  );
};

const AppProviderWithData = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const data = useData();
  return (
    <NotificationsProvider
      tasks={data.tasks}
      announcements={data.announcements}
      currentUser={auth.currentUser}
    >
      <AppContextBridge>{children}</AppContextBridge>
    </NotificationsProvider>
  );
};
