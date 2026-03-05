import { createContext, useState, useContext, ReactNode } from "react";
import { useStorage } from "../hooks/useStorage";
import { todayStr, addDays, nowISO } from "../utils/dateHelpers";
import {
  SEED_USERS, DEMO_PROJECTS, DEMO_TASKS,
  DEMO_SUPPLIERS, DEMO_BOM, ROLES,
} from "../constants/seeds";
import type { User, Project, Task, Supplier, Part, Order, BomEntry, BomRow, Notification } from "../types";

export interface AppContextType {
  // Data
  users:     User[];
  projects:  Project[];
  tasks:     Task[];
  suppliers: Supplier[];
  bom:       BomEntry[];
  // Session
  currentUser:     User | null;
  mustSetPassword: boolean;
  // UI
  tab:       string;
  pf:        string;
  bomFilter: string;
  taskFilter: string;
  // Modal state
  taskModal:            Task | null | Record<string, unknown>;
  projectModal:         Project | null | Record<string, unknown>;
  supplierModal:        Supplier | null | Record<string, unknown>;
  orderModal:           string | null;
  partModal:            { supplierId: string; part: Partial<Part> } | null;
  bomModal:             { entry: BomRow; partId: string; supplierId: string } | null;
  memberModal:          User | null | Record<string, unknown>;
  showBackup:           boolean;
  showSummary:          boolean;
  confirmRemove:        { userId: string; name: string } | null;
  confirmDeleteProject: Project | null;
  // Derived
  isAdmin:   boolean;
  canManage: boolean;
  filteredTasks: Task[];
  bomRows:       BomRow[];
  filteredBom:   BomRow[];
  notifications: Notification[];
  dismissNotification:     (id: string) => void;
  dismissAllNotifications: () => void;
  // Handlers
  login:                (email: string, password: string) => string | null;
  logout:               () => void;
  completePasswordReset:(newPassword: string) => void;
  saveTask:             (t: Task) => void;
  deleteTask:           (id: string) => void;
  updateTaskStatus:     (id: string, status: string) => void;
  saveProject:          (proj: Project) => void;
  deleteProject:        (id: string) => void;
  saveSupplier:         (s: Supplier) => void;
  deleteSupplier:       (id: string) => void;
  toggleArchiveSupplier:(id: string) => void;
  savePart:             (supplierId: string, part: Part) => void;
  deletePart:           (supplierId: string, partId: string) => void;
  addOrder:             (supplierId: string, order: Order) => void;
  toggleArrived:        (supplierId: string, orderId: string) => void;
  saveBomEntry:         (entry: BomEntry) => void;
  saveMember:           (m: User) => void;
  removeMember:         (id: string) => void;
  setUsers:             (updater: (users: User[]) => User[]) => void;
  exportBackup:         () => void;
  importBackup:         (data: unknown) => void;
  // Setters
  setTab:                   (tab: string) => void;
  setPf:                    (pf: string) => void;
  setBomFilter:             (f: string) => void;
  setTaskFilter:            (f: string) => void;
  setTaskModal:             (m: Task | null | Record<string, unknown>) => void;
  setProjectModal:          (m: Project | null | Record<string, unknown>) => void;
  setSupplierModal:         (m: Supplier | null | Record<string, unknown>) => void;
  setOrderModal:            (m: string | null) => void;
  setPartModal:             (m: { supplierId: string; part: Partial<Part> } | null) => void;
  setBomModal:              (m: { entry: BomRow; partId: string; supplierId: string } | null) => void;
  setMemberModal:           (m: User | null | Record<string, unknown>) => void;
  setShowBackup:            (v: boolean) => void;
  setShowSummary:           (v: boolean) => void;
  setConfirmRemove:         (m: { userId: string; name: string } | null) => void;
  setConfirmDeleteProject:  (m: Project | null) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // ── Persisted state ──────────────────────────────────────────────────────
  const [users,     setUsers]     = useStorage("pm5:users",     SEED_USERS);
  const [projects,  setProjects]  = useStorage("pm5:projects",  DEMO_PROJECTS);
  const [tasks,     setTasks]     = useStorage("pm5:tasks",     DEMO_TASKS);
  const [suppliers, setSuppliers] = useStorage("pm5:suppliers", DEMO_SUPPLIERS);
  const [bom,       setBom]       = useStorage("pm5:bom",       DEMO_BOM);

  // ── Session state ────────────────────────────────────────────────────────
  const [currentUser,      setCurrentUser]      = useState<User | null>(null);
  const [mustSetPassword,  setMustSetPassword]  = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [tab,                  setTab]                  = useState("dashboard");
  const [pf,                   setPf]                   = useState("all");
  const [bomFilter,            setBomFilter]            = useState("all");
  const [taskFilter,           setTaskFilter]           = useState("all");
  const [dismissed,            setDismissed]            = useState<string[]>([]);

  // Modal visibility
  const [taskModal,            setTaskModal]            = useState<Task | null | Record<string, unknown>>(null);
  const [projectModal,         setProjectModal]         = useState<Project | null | Record<string, unknown>>(null);
  const [supplierModal,        setSupplierModal]        = useState<Supplier | null | Record<string, unknown>>(null);
  const [orderModal,           setOrderModal]           = useState<string | null>(null);
  const [partModal,            setPartModal]            = useState<{ supplierId: string; part: Partial<Part> } | null>(null);
  const [bomModal,             setBomModal]             = useState<{ entry: BomRow; partId: string; supplierId: string } | null>(null);
  const [memberModal,          setMemberModal]          = useState<User | null | Record<string, unknown>>(null);
  const [showBackup,           setShowBackup]           = useState(false);
  const [showSummary,          setShowSummary]          = useState(false);
  const [confirmRemove,        setConfirmRemove]        = useState<{ userId: string; name: string } | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<Project | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  const isAdmin    = currentUser?.role === ROLES.ADMIN;
  const canManage  = currentUser?.role !== ROLES.WORKER;

  const filteredTasks = tasks.filter((t) => {
    if (currentUser?.role === ROLES.WORKER && t.assigneeId !== currentUser.id) return false;
    if (pf !== "all" && t.projectId !== pf) return false;
    return true;
  });

  const bomRows = (bom.map((entry) => {
    const supplier = suppliers.find((s) => s.id === entry.supplierId);
    const part     = (supplier?.parts || []).find((p) => p.id === entry.partId);
    return { ...entry, supplier, part };
  }).filter((r) => r.supplier && r.part) as unknown) as BomRow[];

  const filteredBom = bomRows
    .filter((r) => bomFilter  === "all" || r.status    === bomFilter)
    .filter((r) => {
      if (taskFilter === "all")      return true;
      if (taskFilter === "unlinked") return !r.taskId;
      if (taskFilter.startsWith("p:")) return r.projectId === taskFilter.slice(2) || r.project === taskFilter.slice(2);
      return r.taskId === taskFilter;
    });

  const notifications = (() => {
    if (!currentUser) return [];
    const notes: Notification[] = [];
    const now  = todayStr();
    const soon = addDays(now, 3);
    tasks.forEach((t) => {
      if (currentUser.role === ROLES.WORKER && t.assigneeId !== currentUser.id) return;
      if (t.status === "done") return;
      if (t.endDate < now)
        notes.push({ id: `od-${t.id}`, type: "overdue", text: `"${t.title}" is overdue` });
      else if (t.endDate <= soon)
        notes.push({ id: `ds-${t.id}`, type: "soon",    text: `"${t.title}" due soon` });
    });
    suppliers.forEach((s) =>
      (s.orders || []).forEach((o) => {
        if (o.arrived) return;
        const due = addDays(o.orderedDate, o.leadTimeDays);
        if (due < now)
          notes.push({ id: `sol-${o.id}`, type: "overdue", text: `${s.name}: "${o.description}" overdue` });
        else if (due <= soon)
          notes.push({ id: `sos-${o.id}`, type: "soon",    text: `${s.name}: "${o.description}" arriving soon` });
      })
    );
    return notes.filter((n) => !dismissed.includes(n.id));
  })();

  // ── Auth handlers ────────────────────────────────────────────────────────
  const login = (email: string, password: string): string | null => {
    const u = users.find((u) => u.email === email && u.password === password);
    if (!u) return "Invalid email or password.";
    setCurrentUser(u);
    if (u.mustChangePassword) setMustSetPassword(true);
    return null;
  };

  const logout = () => {
    setCurrentUser(null);
    setMustSetPassword(false);
  };

  const completePasswordReset = (newPassword: string) => {
    if (!currentUser) return;
    const updated: User = { ...currentUser, password: newPassword, mustChangePassword: false };
    setUsers((prev) => prev.map((u) => (u.id === currentUser!.id ? updated : u)));
    setCurrentUser(updated);
    setMustSetPassword(false);
  };

  // ── Task handlers ────────────────────────────────────────────────────────
  const saveTask = (t: Task) => {
    if (!currentUser) return;
    const stamped: Task = { ...t, updatedAt: nowISO(), updatedBy: currentUser?.name ?? "" };
    setTasks((p) => p.find((x) => x.id === stamped.id) ? p.map((x) => x.id === stamped.id ? stamped : x) : [...p, stamped]);
    setTaskModal(null);
  };

  const deleteTask = (id: string) => setTasks((p) =>
    p.filter((t) => t.id !== id)
     .map((t) => t.dependsOn?.includes(id)
       ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== id) }
       : t)
  );

  const updateTaskStatus = (id: string, status: string) =>
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: status as Task["status"], updatedAt: nowISO(), updatedBy: currentUser?.name } : t));

  // ── Project handlers ─────────────────────────────────────────────────────
  const saveProject = (proj: Project) => {
    const stamped: Project = { ...proj, updatedAt: nowISO(), updatedBy: currentUser?.name };
    setProjects((p) => p.find((x) => x.id === stamped.id) ? p.map((x) => x.id === stamped.id ? stamped : x) : [...p, stamped]);
    setProjectModal(null);
  };

  const deleteProject = (id: string) => {
    setProjects((p) => p.filter((x) => x.id !== id));
    setTasks((p) => p.filter((t) => t.projectId !== id));
    setConfirmDeleteProject(null);
  };

  // ── Supplier handlers ────────────────────────────────────────────────────
  const saveSupplier = (s: Supplier) => {
    const stamped = { ...s, updatedAt: nowISO(), updatedBy: currentUser?.name ?? "" };
    setSuppliers((p) => p.find((x) => x.id === stamped.id) ? p.map((x) => x.id === stamped.id ? stamped : x) : [...p, stamped]);
    setSupplierModal(null);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((p) => p.filter((s) => s.id !== id));
    setBom((p) => p.filter((b) => b.supplierId !== id));
  };

  const toggleArchiveSupplier = (id: string) => {
    setSuppliers((p) => p.map((s) => s.id === id ? { ...s, archived: !s.archived, updatedAt: nowISO(), updatedBy: currentUser?.name ?? "" } : s));
  };

  const savePart = (supplierId: string, part: Part) => {
    setSuppliers((p) =>
      p.map((s) => {
        if (s.id !== supplierId) return s;
        const exists = (s.parts || []).find((x) => x.id === part.id);
        const newParts = exists
          ? (s.parts || []).map((x) => (x.id === part.id ? part : x))
          : [...(s.parts || []), part];
        return { ...s, parts: newParts, updatedAt: nowISO(), updatedBy: currentUser?.name ?? "" };
      })
    );
    if (!part._existing) {
      setBom((prev) => [
        ...prev,
        { id: `b${Date.now()}`, supplierId, partId: part.id, qtyOrdered: 0, status: "pending", notes: "", project: "" },
      ]);
    }
    setPartModal(null);
  };

  const deletePart = (supplierId: string, partId: string) => {
    setSuppliers((p) =>
      p.map((s) =>
        s.id === supplierId ? { ...s, parts: (s.parts || []).filter((pt) => pt.id !== partId) } : s
      )
    );
    setBom((p) => p.filter((b) => !(b.supplierId === supplierId && b.partId === partId)));
  };

  const addOrder = (supplierId: string, order: Order) => {
    setSuppliers((p) =>
      p.map((s) => s.id === supplierId ? { ...s, orders: [...(s.orders || []), { ...order, updatedAt: nowISO(), updatedBy: currentUser?.name ?? "" }], updatedAt: nowISO(), updatedBy: currentUser?.name ?? "" } : s)
    );
    setOrderModal(null);
  };

  const toggleArrived = (supplierId: string, orderId: string) =>
    setSuppliers((p) =>
      p.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              orders: (s.orders || []).map((o) =>
                o.id === orderId
                  ? { ...o, arrived: !o.arrived, arrivedDate: !o.arrived ? todayStr() : null, updatedAt: nowISO(), updatedBy: currentUser?.name ?? "" }
                  : o
              ),
            }
          : s
      )
    );

  // ── BOM handlers ─────────────────────────────────────────────────────────
  const saveBomEntry = (entry: BomEntry) => {
    const stamped = { ...entry, updatedAt: nowISO(), updatedBy: currentUser?.name ?? "" };
    setBom((p) =>
      p.find((x) => x.id === stamped.id) ? p.map((x) => x.id === stamped.id ? stamped : x) : [...p, stamped]
    );
    setBomModal(null);
  };

  // ── Member handlers ──────────────────────────────────────────────────────
  const saveMember = (m: User) => {
    setUsers((p) => p.find((x) => x.id === m.id) ? p.map((x) => x.id === m.id ? m : x) : [...p, m]);
    if (currentUser?.id === m.id) setCurrentUser(m);
    setMemberModal(null);
  };

  const removeMember = (id: string) => {
    setUsers((p) => p.filter((u) => u.id !== id));
    setConfirmRemove(null);
  };

  // ── Backup/restore ───────────────────────────────────────────────────────
  const exportBackup = () => {
    if (!currentUser) return;
    const payload = {
      _meta: { app: "Lattice PM", version: "2.0", exportedAt: new Date().toISOString(), exportedBy: currentUser.name },
      users, projects, tasks, suppliers, bom,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `lattice-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (file: unknown) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.users || !data.projects || !data.tasks) {
          alert("Invalid backup file — missing required data.");
          return;
        }
        const date = data._meta?.exportedAt ? new Date(data._meta.exportedAt).toLocaleString() : "unknown date";
        if (!window.confirm(`Replace ALL current data with backup from ${date}?\n\nThis cannot be undone.`)) return;
        if (data.users)     setUsers(data.users);
        if (data.projects)  setProjects(data.projects);
        if (data.tasks)     setTasks(data.tasks);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.bom)       setBom(data.bom);
        setShowBackup(false);
        alert("Backup restored successfully.");
      } catch {
        alert("Could not read backup file. Make sure it is a valid Lattice PM JSON backup.");
      }
    };
    reader.readAsText(file as Blob);
  };

  // ── Dismiss notification ─────────────────────────────────────────────────
  const dismissNotification = (id: string) => setDismissed((p: string[]) => [...p, id]);
  const dismissAllNotifications = (): void =>
    setDismissed((p) => [...p, ...notifications.map((n) => n.id)]);

  return (
    <AppContext.Provider value={{
      // Data
      users, projects, tasks, suppliers, bom,
      // Derived
      filteredTasks, bomRows, filteredBom, notifications,
      isAdmin, canManage,
      // Auth
      currentUser, mustSetPassword,
      login, logout, completePasswordReset,
      // Task
      saveTask, deleteTask, updateTaskStatus,
      // Project
      saveProject, deleteProject,
      // Supplier
      saveSupplier, deleteSupplier, toggleArchiveSupplier, savePart, deletePart, addOrder, toggleArrived,
      // BOM
      saveBomEntry,
      // Member
      saveMember, removeMember, setUsers,
      // Backup
      exportBackup, importBackup,
      // Notifications
      dismissNotification, dismissAllNotifications,
      // UI state
      tab, setTab,
      pf, setPf,
      bomFilter, setBomFilter, taskFilter, setTaskFilter,
      // Modals
      taskModal,            setTaskModal,
      projectModal,         setProjectModal,
      supplierModal,        setSupplierModal,
      orderModal,           setOrderModal,
      partModal,            setPartModal,
      bomModal,             setBomModal,
      memberModal,          setMemberModal,
      showBackup,           setShowBackup,
      showSummary,          setShowSummary,
      confirmRemove,        setConfirmRemove,
      confirmDeleteProject, setConfirmDeleteProject,
    }}>
      {children}
    </AppContext.Provider>
  );
};
