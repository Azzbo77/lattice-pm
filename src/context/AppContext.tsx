import {
  createContext, useState, useContext, useEffect,
  useCallback, useMemo, ReactNode,
} from "react";
import {
  dbLogin, dbLogout, dbCurrentUser, dbUpdatePassword,
  dbGetUsers, dbSaveUser, dbDeleteUser,
  dbGetProjects, dbSaveProject, dbDeleteProject,
  dbGetTasks, dbSaveTask, dbDeleteTask,
  dbGetSuppliers, dbSaveSupplier, dbDeleteSupplier, dbSavePart, dbDeletePart, dbSaveOrder, dbDeleteOrder,
  dbGetBom, dbSaveBomEntry, dbDeleteBomEntry,
  subscribeToCollection,
} from "../lib/db";
import { todayStr, addDays } from "../utils/dateHelpers";
import { ROLES } from "../constants/seeds";
import type {
  User, Project, Task, Supplier, Part, Order, BomEntry, BomRow, Notification,
} from "../types";

// ── Context type ──────────────────────────────────────────────────────────────
export interface AppContextType {
  // Data
  users:     User[];
  projects:  Project[];
  tasks:     Task[];
  suppliers: Supplier[];
  bom:       BomEntry[];
  loading:   boolean;
  // Session
  currentUser:     User | null;
  sessionReady:    boolean;
  mustSetPassword: boolean;
  // UI
  tab:        string;
  pf:         string;
  bomFilter:  string;
  taskFilter: string;
  // Modal state
  taskModal:            Task | null | Record<string, unknown>;
  projectModal:         Project | null | Record<string, unknown>;
  supplierModal:        Supplier | null | Record<string, unknown>;
  orderModal:           string | null;
  partModal:            { supplierId: string; part: Partial<Part> } | null;
  bomModal:             { entry: BomRow | null; partId: string; supplierId: string } | null;
  memberModal:          User | null | Record<string, unknown>;
  showSummary:          boolean;
  confirmRemove:        { userId: string; name: string } | null;
  confirmDeleteBom:     string | null;
  confirmDeleteProject: Project | null;
  // Derived
  isAdmin:      boolean;
  canManage:    boolean;
  canSuppliers: boolean;
  filteredTasks: Task[];
  bomRows:       BomRow[];
  filteredBom:   BomRow[];
  notifications: Notification[];
  dismissNotification:     (id: string) => void;
  dismissAllNotifications: () => void;
  // Handlers
  login:                (email: string, password: string) => Promise<string | null>;
  logout:               () => void;
  completePasswordReset:(newPassword: string) => Promise<void>;
  saveTask:             (t: Task) => Promise<void>;
  deleteTask:           (id: string) => Promise<void>;
  updateTaskStatus:     (id: string, status: string) => Promise<void>;
  saveProject:          (proj: Project) => Promise<void>;
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
  saveMember:           (m: User) => Promise<void>;
  removeMember:         (id: string) => Promise<void>;
  setUsers:             React.Dispatch<React.SetStateAction<User[]>>;
  // Setters
  setTab:                  (tab: string) => void;
  setPf:                   (pf: string) => void;
  setBomFilter:            (f: string) => void;
  setTaskFilter:           (f: string) => void;
  setTaskModal:            (m: Task | null | Record<string, unknown>) => void;
  setProjectModal:         (m: Project | null | Record<string, unknown>) => void;
  setSupplierModal:        (m: Supplier | null | Record<string, unknown>) => void;
  setOrderModal:           (m: string | null) => void;
  setPartModal:            (m: { supplierId: string; part: Partial<Part> } | null) => void;
  setBomModal:             (m: { entry: BomRow | null; partId: string; supplierId: string } | null) => void;
  setMemberModal:          (m: User | null | Record<string, unknown>) => void;
  setShowSummary:          (v: boolean) => void;
  setConfirmRemove:        (m: { userId: string; name: string } | null) => void;
  setConfirmDeleteBom:     (id: string | null) => void;
  setConfirmDeleteProject: (m: Project | null) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const AppProvider = ({ children }: { children: ReactNode }) => {

  // ── Data state ───────────────────────────────────────────────────────────
  const [users,     setUsers]     = useState<User[]>([]);
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bom,       setBom]       = useState<BomEntry[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Session state ────────────────────────────────────────────────────────
  const [currentUser,     setCurrentUser]     = useState<User | null>(null);
  const [sessionReady,    setSessionReady]    = useState(false);
  const [mustSetPassword, setMustSetPassword] = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [tab,        setTab]        = useState("dashboard");
  const [pf,         setPf]         = useState("all");
  const [bomFilter,  setBomFilter]  = useState("all");
  const [taskFilter, setTaskFilter] = useState("all");

  // ── Modal state ──────────────────────────────────────────────────────────
  const [taskModal,            setTaskModal]            = useState<Task | null | Record<string, unknown>>(null);
  const [projectModal,         setProjectModal]         = useState<Project | null | Record<string, unknown>>(null);
  const [supplierModal,        setSupplierModal]        = useState<Supplier | null | Record<string, unknown>>(null);
  const [orderModal,           setOrderModal]           = useState<string | null>(null);
  const [partModal,            setPartModal]            = useState<{ supplierId: string; part: Partial<Part> } | null>(null);
  const [bomModal,             setBomModal]             = useState<{ entry: BomRow | null; partId: string; supplierId: string } | null>(null);
  const [memberModal,          setMemberModal]          = useState<User | null | Record<string, unknown>>(null);
  const [showSummary,          setShowSummary]          = useState(false);
  const [confirmRemove,        setConfirmRemove]        = useState<{ userId: string; name: string } | null>(null);
  const [confirmDeleteBom,     setConfirmDeleteBom]     = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<Project | null>(null);

  // ── Dismissed notifications ──────────────────────────────────────────────
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // ── Initial data load ────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [u, p, t, s, b] = await Promise.all([
        dbGetUsers(),
        dbGetProjects(),
        dbGetTasks(),
        dbGetSuppliers(),
        dbGetBom(),
      ]);
      setUsers(u);
      setProjects(p);
      setTasks(t);
      setSuppliers(s);
      setBom(b);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Session rehydration ───────────────────────────────────────────────────
  useEffect(() => {
    const user = dbCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.mustChangePassword) setMustSetPassword(true);
    }
    setSessionReady(true);
  }, []);

  // ── Load data once session is ready and user is logged in ────────────────
  useEffect(() => {
    if (sessionReady && currentUser) loadAll();
  }, [sessionReady, currentUser, loadAll]);

  // ── Realtime subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const unsubs = [
      subscribeToCollection("projects",  () => dbGetProjects().then(setProjects)),
      subscribeToCollection("tasks",     () => dbGetTasks().then(setTasks)),
      subscribeToCollection("suppliers", () => dbGetSuppliers().then(setSuppliers)),
      subscribeToCollection("parts",     () => dbGetSuppliers().then(setSuppliers)),
      subscribeToCollection("orders",    () => dbGetSuppliers().then(setSuppliers)),
      subscribeToCollection("bom",       () => dbGetBom().then(setBom)),
      subscribeToCollection("users",     () => dbGetUsers().then(setUsers)),
    ];

    return () => unsubs.forEach(fn => fn());
  }, [currentUser]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isAdmin   = currentUser?.role === ROLES.ADMIN;
  const canManage    = currentUser?.role !== ROLES.SHOPFLOOR;
  const canSuppliers = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.MANAGER;

  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(t => {
      if (currentUser.role === ROLES.SHOPFLOOR && t.assigneeId !== currentUser.id) return false;
      if (pf !== "all" && t.projectId !== pf) return false;
      if (taskFilter === "mine") return t.assigneeId === currentUser.id;
      if (taskFilter !== "all") return t.status === taskFilter;
      return true;
    });
  }, [tasks, currentUser, pf, taskFilter]);

  const bomRows = useMemo<BomRow[]>(() => {
    return bom.map(entry => {
      const supplier = suppliers.find(s => s.id === entry.supplierId)!;
      const part     = supplier?.parts?.find(p => p.id === entry.partId)!;
      return { ...entry, supplier, part };
    }).filter(r => r.supplier && r.part);
  }, [bom, suppliers]);

  const filteredBom = useMemo(() => {
    return bomRows.filter(r => {
      if (bomFilter === "all") return true;
      if (bomFilter === "unlinked") return !r.projectId;
      return r.status === bomFilter;
    });
  }, [bomRows, bomFilter]);

  // ── Derived — notifications ───────────────────────────────────────────────
  const notifications = useMemo<Notification[]>(() => {
    const today = todayStr();
    const soon  = addDays(today, 3);
    const myTasks = currentUser?.role === ROLES.SHOPFLOOR
      ? tasks.filter(t => t.assigneeId === currentUser!.id)
      : tasks;

    return myTasks.reduce<Notification[]>((acc, t) => {
      if (t.status === "done" || !t.endDate) return acc;

      if (t.endDate < today) {
        acc.push({ id: `od-${t.id}`, text: `"${t.title}" is overdue`, type: "overdue", taskId: t.id });
      } else if (t.endDate <= soon) {
        acc.push({ id: `sn-${t.id}`, text: `"${t.title}" is due soon`, type: "soon", taskId: t.id });
      }

      return acc;
    }, []).filter((n) => !dismissedIds.includes(n.id));
  }, [tasks, currentUser, dismissedIds]);

  const dismissNotification     = useCallback((id: string) => setDismissedIds(p => [...p, id]), []);
  const dismissAllNotifications = useCallback(() => setDismissedIds(notifications.map(n => n.id)), [notifications]);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const user = await dbLogin(email, password);
      setCurrentUser(user);
      if (user.mustChangePassword) setMustSetPassword(true);
      return null;
    } catch {
      return "Invalid email or password";
    }
  }, []);

  const logout = useCallback(() => {
    dbLogout();
    setCurrentUser(null);
    setMustSetPassword(false);
    setUsers([]);
    setProjects([]);
    setTasks([]);
    setSuppliers([]);
    setBom([]);
  }, []);

  const completePasswordReset = useCallback(async (newPassword: string) => {
    if (!currentUser) return;
    await dbUpdatePassword(currentUser.id, newPassword);
    const updated = { ...currentUser, mustChangePassword: false };
    setCurrentUser(updated);
    setMustSetPassword(false);
  }, [currentUser]);

  // ── Task handlers ─────────────────────────────────────────────────────────
  const saveTask = useCallback(async (t: Task) => {
    const saved = await dbSaveTask({ ...t, updatedBy: currentUser?.name ?? "" });
    setTasks(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [...prev, saved]);
    setTaskModal(null);
  }, [currentUser]);

  const deleteTask = useCallback(async (id: string) => {
    await dbDeleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTaskStatus = useCallback(async (id: string, status: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const saved = await dbSaveTask({ ...task, status: status as Task["status"], updatedBy: currentUser?.name ?? "" });
    setTasks(prev => prev.map(t => t.id === id ? saved : t));
  }, [tasks, currentUser]);

  // ── Project handlers ──────────────────────────────────────────────────────
  const saveProject = useCallback(async (proj: Project) => {
    const saved = await dbSaveProject({ ...proj, updatedBy: currentUser?.name ?? "" });
    setProjects(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [...prev, saved]);
    setProjectModal(null);
  }, [currentUser]);

  const deleteProject = useCallback(async (id: string) => {
    // Delete child tasks first to avoid PocketBase referential integrity errors
    const childTasks = tasks.filter(t => t.projectId === id);
    await Promise.all(childTasks.map(t => dbDeleteTask(t.id)));
    await dbDeleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setConfirmDeleteProject(null);
  }, [tasks]);

  // ── Supplier handlers ─────────────────────────────────────────────────────
  const saveSupplier = useCallback(async (s: Supplier) => {
    const saved = await dbSaveSupplier({ ...s, updatedBy: currentUser?.name ?? "" });
    setSuppliers(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? { ...saved, parts: s.parts ?? [], orders: s.orders ?? [] } : x)
      : [...prev, { ...saved, parts: [], orders: [] }]);
    setSupplierModal(null);
  }, [currentUser]);

  const deleteSupplier = useCallback(async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      // Delete child bom, orders and parts first to avoid referential integrity errors
      const relatedBom = bom.filter(b => b.supplierId === id);
      await Promise.all(relatedBom.map(b => dbDeleteBomEntry(b.id)));
      await Promise.all((supplier.orders ?? []).map(o => dbDeleteOrder(o.id)));
      await Promise.all((supplier.parts ?? []).map(p => dbDeletePart(p.id)));
    }
    await dbDeleteSupplier(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    setBom(prev => prev.filter(b => b.supplierId !== id));
  }, [suppliers, bom]);

  const toggleArchiveSupplier = useCallback(async (id: string) => {
    const s = suppliers.find(x => x.id === id);
    if (!s) return;
    const saved = await dbSaveSupplier({ ...s, archived: !s.archived, updatedBy: currentUser?.name ?? "" });
    setSuppliers(prev => prev.map(x => x.id === id ? { ...x, archived: saved.archived } : x));
  }, [suppliers, currentUser]);

  // ── Part handlers ─────────────────────────────────────────────────────────
  const savePart = useCallback(async (supplierId: string, part: Part) => {
    const saved = await dbSavePart({ ...part, supplierId, updatedBy: currentUser?.name ?? "" });
    setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
      ...s,
      parts: s.parts?.find(p => p.id === saved.id)
        ? s.parts.map(p => p.id === saved.id ? saved : p)
        : [...(s.parts ?? []), saved],
    }));
    setPartModal(null);
  }, [currentUser]);

  const deletePart = useCallback(async (supplierId: string, partId: string) => {
    await dbDeletePart(partId);
    setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
      ...s, parts: s.parts?.filter(p => p.id !== partId) ?? [],
    }));
    setBom(prev => prev.filter(b => b.partId !== partId));
  }, []);

  // ── Order handlers ────────────────────────────────────────────────────────
  const addOrder = useCallback(async (supplierId: string, order: Order) => {
    const saved = await dbSaveOrder({ ...order, supplierId, updatedBy: currentUser?.name ?? "" });
    setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
      ...s, orders: [...(s.orders ?? []), saved],
    }));
    setOrderModal(null);
  }, [currentUser]);

  const toggleArrived = useCallback(async (supplierId: string, orderId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const order    = supplier?.orders?.find(o => o.id === orderId);
    if (!order) return;
    const saved = await dbSaveOrder({
      ...order, supplierId,
      arrived:     !order.arrived,
      arrivedDate: !order.arrived ? todayStr() : null,
      updatedBy:   currentUser?.name ?? "",
    });
    setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
      ...s, orders: s.orders?.map(o => o.id === orderId ? saved : o) ?? [],
    }));
  }, [suppliers, currentUser]);

  // ── BOM handlers ──────────────────────────────────────────────────────────
  const deleteBomEntry = useCallback(async (id: string) => {
    await dbDeleteBomEntry(id);
    setBom(prev => prev.filter(b => b.id !== id));
  }, []);

  const saveBomEntry = useCallback(async (entry: BomEntry) => {
    const saved = await dbSaveBomEntry({ ...entry, updatedBy: currentUser?.name ?? "" });
    setBom(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [...prev, saved]);
    setBomModal(null);
  }, [currentUser]);

  // ── Member handlers ───────────────────────────────────────────────────────
  const saveMember = useCallback(async (m: User) => {
    const saved = await dbSaveUser({ ...m, updatedBy: currentUser?.name ?? "" });
    setUsers(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [...prev, saved]);
    if (currentUser?.id === saved.id) setCurrentUser(saved);
    setMemberModal(null);
  }, [currentUser]);

  const removeMember = useCallback(async (id: string) => {
    try {
      await dbDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      if (e?.status === 403) {
        alert('Permission denied. Set the Delete rule on _pb_users_auth_ in PocketBase admin UI to:\n@request.auth.role = \"admin\"');
      } else if (e?.status === 404) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        alert("Failed to delete user: " + (e?.message ?? "Unknown error"));
      }
    }
    setConfirmRemove(null);
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────
  const value: AppContextType = {
    users, projects, tasks, suppliers, bom, loading,
    currentUser, sessionReady, mustSetPassword,
    tab, pf, bomFilter, taskFilter,
    taskModal, projectModal, supplierModal, orderModal, partModal,
    bomModal, memberModal, showSummary,
    confirmRemove, confirmDeleteProject, confirmDeleteBom,
    isAdmin, canManage, canSuppliers,
    filteredTasks, bomRows, filteredBom, notifications,
    dismissNotification, dismissAllNotifications,
    login, logout, completePasswordReset,
    saveTask, deleteTask, updateTaskStatus,
    saveProject, deleteProject,
    saveSupplier, deleteSupplier, toggleArchiveSupplier,
    savePart, deletePart,
    addOrder, toggleArrived,
    saveBomEntry, deleteBomEntry,
    saveMember, removeMember, setUsers,
    setTab, setPf, setBomFilter, setTaskFilter,
    setTaskModal, setProjectModal, setSupplierModal,
    setOrderModal, setPartModal, setBomModal, setMemberModal, setShowSummary,
    setConfirmRemove, setConfirmDeleteProject, setConfirmDeleteBom,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
