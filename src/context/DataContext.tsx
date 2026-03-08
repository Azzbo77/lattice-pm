// ── DataContext ───────────────────────────────────────────────────────────────
// Owns: all data state, CRUD handlers, realtime subscriptions, derived rows

import {
  createContext, useState, useContext, useEffect,
  useCallback, useMemo, ReactNode,
} from "react";
import {
  dbGetUsers, dbSaveUser, dbDeleteUser,
  dbGetProjects, dbSaveProject, dbDeleteProject,
  dbGetTasks, dbSaveTask, dbDeleteTask,
  dbGetSuppliers, dbSaveSupplier, dbDeleteSupplier,
  dbSavePart, dbDeletePart, dbSaveOrder, dbDeleteOrder,
  dbGetBom, dbSaveBomEntry, dbDeleteBomEntry,
  dbGetAnnouncements, dbSaveAnnouncement, dbDeleteAnnouncement,
  subscribeToCollection,
} from "../lib/db";
import { todayStr } from "../utils/dateHelpers";
import type {
  User, Project, Task, Supplier, Part, Order,
  BomEntry, BomRow, Announcement,
} from "../types";

export interface DataContextType {
  // Raw data
  users:         User[];
  projects:      Project[];
  tasks:         Task[];
  suppliers:     Supplier[];
  bom:           BomEntry[];
  announcements: Announcement[];
  loading:       boolean;
  // Derived
  bomRows:     BomRow[];
  filteredBom: BomRow[];
  // Setters needed externally (e.g. logout clears data)
  setUsers:     React.Dispatch<React.SetStateAction<User[]>>;
  setProjects:  React.Dispatch<React.SetStateAction<Project[]>>;
  setTasks:     React.Dispatch<React.SetStateAction<Task[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setBom:       React.Dispatch<React.SetStateAction<BomEntry[]>>;
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  setLoading:   React.Dispatch<React.SetStateAction<boolean>>;
  // CRUD
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
}

export const DataContext = createContext<DataContextType | null>(null);

export const useData = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
};

export const DataProvider = ({
  children,
  currentUser,
  bomFilter,
  taskFilter,
  pf,
  setTaskModal,
  setProjectModal,
  setSupplierModal,
  setPartModal,
  setOrderModal,
  setBomModal,
  setMemberModal,
  setConfirmRemove,
  setConfirmDeleteProject,
}: {
  children:               ReactNode;
  currentUser:            import("../types").User | null;
  bomFilter:              string;
  taskFilter:             string;
  pf:                     string;
  setTaskModal:           (m: any) => void;
  setProjectModal:        (m: any) => void;
  setSupplierModal:       (m: any) => void;
  setPartModal:           (m: any) => void;
  setOrderModal:          (m: any) => void;
  setBomModal:            (m: any) => void;
  setMemberModal:         (m: any) => void;
  setConfirmRemove:       (m: any) => void;
  setConfirmDeleteProject:(m: any) => void;
}) => {
  const [users,         setUsers]         = useState<User[]>([]);
  const [projects,      setProjects]      = useState<Project[]>([]);
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [suppliers,     setSuppliers]     = useState<Supplier[]>([]);
  const [bom,           setBom]           = useState<BomEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading,       setLoading]       = useState(true);

  // ── Initial load ────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [u, p, t, s, b, a] = await Promise.all([
        dbGetUsers(), dbGetProjects(), dbGetTasks(),
        dbGetSuppliers(), dbGetBom(), dbGetAnnouncements(),
      ]);
      setUsers(u); setProjects(p); setTasks(t);
      setSuppliers(s); setBom(b); setAnnouncements(a);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) loadAll();
    else {
      // Clear all data on logout to prevent showing previous user's data
      setUsers([]); setProjects([]); setTasks([]); setSuppliers([]); setBom([]); setAnnouncements([]);
      setLoading(true);
    }
  }, [currentUser, loadAll]);

  // ── Realtime subscriptions ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const unsubs = [
      subscribeToCollection("projects",      () => dbGetProjects().then(setProjects)),
      subscribeToCollection("tasks",         () => dbGetTasks().then(setTasks)),
      subscribeToCollection("suppliers",     () => dbGetSuppliers().then(setSuppliers)),
      subscribeToCollection("parts",         () => dbGetSuppliers().then(setSuppliers)),
      subscribeToCollection("orders",        () => dbGetSuppliers().then(setSuppliers)),
      subscribeToCollection("bom",           () => dbGetBom().then(setBom)),
      subscribeToCollection("announcements", () => dbGetAnnouncements().then(setAnnouncements)),
      subscribeToCollection("users",         () => dbGetUsers().then(setUsers)),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [currentUser]);

  // ── Derived ───────────────────────────────────────────────────────────
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

  // ── Task CRUD ─────────────────────────────────────────────────────────
  const saveTask = useCallback(async (t: Task) => {
    const saved = await dbSaveTask({ ...t, updatedBy: currentUser?.name ?? "" });
    setTasks(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [...prev, saved]);
    setTaskModal(null);
  }, [currentUser, setTaskModal]);

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

  // ── Project CRUD ──────────────────────────────────────────────────────
  const saveProject = useCallback(async (proj: Project) => {
    const saved = await dbSaveProject({ ...proj, updatedBy: currentUser?.name ?? "" });
    setProjects(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [...prev, saved]);
    setProjectModal(null);
  }, [currentUser, setProjectModal]);

  const deleteProject = useCallback(async (id: string) => {
    const childTasks = tasks.filter(t => t.projectId === id);
    await Promise.all(childTasks.map(t => dbDeleteTask(t.id)));
    await dbDeleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setConfirmDeleteProject(null);
  }, [tasks, setConfirmDeleteProject]);

  // ── Supplier CRUD ─────────────────────────────────────────────────────
  const saveSupplier = useCallback(async (s: Supplier) => {
    const saved = await dbSaveSupplier({ ...s, updatedBy: currentUser?.name ?? "" });
    setSuppliers(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? { ...saved, parts: s.parts ?? [], orders: s.orders ?? [] } : x)
      : [...prev, { ...saved, parts: [], orders: [] }]);
    setSupplierModal(null);
  }, [currentUser, setSupplierModal]);

  const deleteSupplier = useCallback(async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      const relatedBom = bom.filter(b => b.supplierId === id);
      await Promise.all(relatedBom.map(b => dbDeleteBomEntry(b.id)));
      await Promise.all((supplier.orders ?? []).map(o => dbDeleteOrder(o.id)));
      await Promise.all((supplier.parts  ?? []).map(p => dbDeletePart(p.id)));
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

  // ── Part CRUD ─────────────────────────────────────────────────────────
  const savePart = useCallback(async (supplierId: string, part: Part) => {
    const saved = await dbSavePart({ ...part, supplierId, updatedBy: currentUser?.name ?? "" });
    setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
      ...s,
      parts: s.parts?.find(p => p.id === saved.id)
        ? s.parts.map(p => p.id === saved.id ? saved : p)
        : [...(s.parts ?? []), saved],
    }));
    setPartModal(null);
  }, [currentUser, setPartModal]);

  const deletePart = useCallback(async (supplierId: string, partId: string) => {
    await dbDeletePart(partId);
    setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
      ...s, parts: s.parts?.filter(p => p.id !== partId) ?? [],
    }));
    setBom(prev => prev.filter(b => b.partId !== partId));
  }, []);

  // ── Order CRUD ────────────────────────────────────────────────────────
  const addOrder = useCallback(async (supplierId: string, order: Order) => {
    const saved = await dbSaveOrder({ ...order, supplierId, updatedBy: currentUser?.name ?? "" });
    setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
      ...s, orders: [...(s.orders ?? []), saved],
    }));
    setOrderModal(null);
  }, [currentUser, setOrderModal]);

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

  // ── BOM CRUD ──────────────────────────────────────────────────────────
  const saveBomEntry = useCallback(async (entry: BomEntry) => {
    const saved = await dbSaveBomEntry({ ...entry, updatedBy: currentUser?.name ?? "" });
    setBom(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [...prev, saved]);
    setBomModal(null);
  }, [currentUser, setBomModal]);

  const deleteBomEntry = useCallback(async (id: string) => {
    await dbDeleteBomEntry(id);
    setBom(prev => prev.filter(b => b.id !== id));
  }, []);

  // ── Announcement CRUD ─────────────────────────────────────────────────
  const saveAnnouncement = useCallback(async (a: Partial<Announcement>) => {
    const saved = await dbSaveAnnouncement({ ...a, updatedBy: currentUser?.name ?? "" });
    setAnnouncements(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [saved, ...prev]);
  }, [currentUser]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    await dbDeleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  // ── Member CRUD ───────────────────────────────────────────────────────
  const saveMember = useCallback(async (m: User) => {
    const saved = await dbSaveUser({ ...m, updatedBy: currentUser?.name ?? "" });
    setUsers(prev => prev.find(x => x.id === saved.id)
      ? prev.map(x => x.id === saved.id ? saved : x)
      : [...prev, saved]);
    setMemberModal(null);
  }, [currentUser, setMemberModal]);

  const removeMember = useCallback(async (id: string) => {
    try {
      await dbDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      if (e?.status === 403) {
        alert('Permission denied. Set the Delete rule on _pb_users_auth_ in PocketBase admin UI to:\n@request.auth.role = "admin"');
      } else if (e?.status === 404) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        alert("Failed to delete user: " + (e?.message ?? "Unknown error"));
      }
    }
    setConfirmRemove(null);
  }, [setConfirmRemove]);

  return (
    <DataContext.Provider value={{
      users, projects, tasks, suppliers, bom, announcements, loading,
      bomRows, filteredBom,
      setUsers, setProjects, setTasks, setSuppliers, setBom, setAnnouncements, setLoading,
      saveTask, deleteTask, updateTaskStatus,
      saveProject, deleteProject,
      saveSupplier, deleteSupplier, toggleArchiveSupplier,
      savePart, deletePart,
      addOrder, toggleArrived,
      saveBomEntry, deleteBomEntry,
      saveAnnouncement, deleteAnnouncement,
      saveMember, removeMember,
    }}>
      {children}
    </DataContext.Provider>
  );
};
