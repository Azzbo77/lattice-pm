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
import { useToast } from "./ToastContext";
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
  const { showToast } = useToast();

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
      showToast("Failed to load data — check your connection", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (currentUser) loadAll();
    else {
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
    try {
      const saved = await dbSaveTask({ ...t, updatedBy: currentUser?.name ?? "" });
      setTasks(prev => prev.find(x => x.id === saved.id)
        ? prev.map(x => x.id === saved.id ? saved : x)
        : [...prev, saved]);
      setTaskModal(null);
      showToast(t.id ? "Task updated" : "Task created", "success");
    } catch (err: any) {
      console.error("saveTask:", err);
      showToast("Failed to save task — please try again", "error");
    }
  }, [currentUser, setTaskModal, showToast]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await dbDeleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      showToast("Task deleted", "success");
    } catch (err: any) {
      console.error("deleteTask:", err);
      showToast("Failed to delete task", "error");
    }
  }, [showToast]);

  const updateTaskStatus = useCallback(async (id: string, status: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const saved = await dbSaveTask({ ...task, status: status as Task["status"], updatedBy: currentUser?.name ?? "" });
      setTasks(prev => prev.map(t => t.id === id ? saved : t));
    } catch (err: any) {
      console.error("updateTaskStatus:", err);
      showToast("Failed to update task status", "error");
    }
  }, [tasks, currentUser, showToast]);

  // ── Project CRUD ──────────────────────────────────────────────────────
  const saveProject = useCallback(async (proj: Project) => {
    try {
      const saved = await dbSaveProject({ ...proj, updatedBy: currentUser?.name ?? "" });
      setProjects(prev => prev.find(x => x.id === saved.id)
        ? prev.map(x => x.id === saved.id ? saved : x)
        : [...prev, saved]);
      setProjectModal(null);
      showToast(proj.id ? "Project updated" : "Project created", "success");
    } catch (err: any) {
      console.error("saveProject:", err);
      showToast("Failed to save project — please try again", "error");
    }
  }, [currentUser, setProjectModal, showToast]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const childTasks = tasks.filter(t => t.projectId === id);
      await Promise.all(childTasks.map(t => dbDeleteTask(t.id)));
      await dbDeleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      setConfirmDeleteProject(null);
      showToast("Project deleted", "success");
    } catch (err: any) {
      console.error("deleteProject:", err);
      showToast("Failed to delete project", "error");
    }
  }, [tasks, setConfirmDeleteProject, showToast]);

  // ── Supplier CRUD ─────────────────────────────────────────────────────
  const saveSupplier = useCallback(async (s: Supplier) => {
    try {
      const saved = await dbSaveSupplier({ ...s, updatedBy: currentUser?.name ?? "" });
      setSuppliers(prev => prev.find(x => x.id === saved.id)
        ? prev.map(x => x.id === saved.id ? { ...saved, parts: s.parts ?? [], orders: s.orders ?? [] } : x)
        : [...prev, { ...saved, parts: [], orders: [] }]);
      setSupplierModal(null);
      showToast(s.id ? "Supplier updated" : "Supplier added", "success");
    } catch (err: any) {
      console.error("saveSupplier:", err);
      showToast("Failed to save supplier — please try again", "error");
    }
  }, [currentUser, setSupplierModal, showToast]);

  const deleteSupplier = useCallback(async (id: string) => {
    try {
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
      showToast("Supplier deleted", "success");
    } catch (err: any) {
      console.error("deleteSupplier:", err);
      showToast("Failed to delete supplier", "error");
    }
  }, [suppliers, bom, showToast]);

  const toggleArchiveSupplier = useCallback(async (id: string) => {
    const s = suppliers.find(x => x.id === id);
    if (!s) return;
    try {
      const saved = await dbSaveSupplier({ ...s, archived: !s.archived, updatedBy: currentUser?.name ?? "" });
      setSuppliers(prev => prev.map(x => x.id === id ? { ...x, archived: saved.archived } : x));
      showToast(saved.archived ? "Supplier archived" : "Supplier unarchived", "info");
    } catch (err: any) {
      console.error("toggleArchiveSupplier:", err);
      showToast("Failed to update supplier", "error");
    }
  }, [suppliers, currentUser, showToast]);

  // ── Part CRUD ─────────────────────────────────────────────────────────
  const savePart = useCallback(async (supplierId: string, part: Part) => {
    try {
      const saved = await dbSavePart({ ...part, supplierId, updatedBy: currentUser?.name ?? "" });
      setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
        ...s,
        parts: s.parts?.find(p => p.id === saved.id)
          ? s.parts.map(p => p.id === saved.id ? saved : p)
          : [...(s.parts ?? []), saved],
      }));
      setPartModal(null);
      showToast(part.id ? "Part updated" : "Part added", "success");
    } catch (err: any) {
      console.error("savePart:", err);
      showToast("Failed to save part — please try again", "error");
    }
  }, [currentUser, setPartModal, showToast]);

  const deletePart = useCallback(async (supplierId: string, partId: string) => {
    try {
      await dbDeletePart(partId);
      setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
        ...s, parts: s.parts?.filter(p => p.id !== partId) ?? [],
      }));
      setBom(prev => prev.filter(b => b.partId !== partId));
      showToast("Part deleted", "success");
    } catch (err: any) {
      console.error("deletePart:", err);
      showToast("Failed to delete part", "error");
    }
  }, [showToast]);

  // ── Order CRUD ────────────────────────────────────────────────────────
  const addOrder = useCallback(async (supplierId: string, order: Order) => {
    try {
      const saved = await dbSaveOrder({ ...order, supplierId, updatedBy: currentUser?.name ?? "" });
      setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
        ...s, orders: [...(s.orders ?? []), saved],
      }));
      setOrderModal(null);
      showToast("Order added", "success");
    } catch (err: any) {
      console.error("addOrder:", err);
      showToast("Failed to add order — please try again", "error");
    }
  }, [currentUser, setOrderModal, showToast]);

  const toggleArrived = useCallback(async (supplierId: string, orderId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const order    = supplier?.orders?.find(o => o.id === orderId);
    if (!order) return;
    try {
      const saved = await dbSaveOrder({
        ...order, supplierId,
        arrived:     !order.arrived,
        arrivedDate: !order.arrived ? todayStr() : null,
        updatedBy:   currentUser?.name ?? "",
      });
      setSuppliers(prev => prev.map(s => s.id !== supplierId ? s : {
        ...s, orders: s.orders?.map(o => o.id === orderId ? saved : o) ?? [],
      }));
      showToast(saved.arrived ? "Marked as arrived" : "Marked as pending", "info");
    } catch (err: any) {
      console.error("toggleArrived:", err);
      showToast("Failed to update order", "error");
    }
  }, [suppliers, currentUser, showToast]);

  // ── BOM CRUD ──────────────────────────────────────────────────────────
  const saveBomEntry = useCallback(async (entry: BomEntry) => {
    try {
      const saved = await dbSaveBomEntry({ ...entry, updatedBy: currentUser?.name ?? "" });
      setBom(prev => prev.find(x => x.id === saved.id)
        ? prev.map(x => x.id === saved.id ? saved : x)
        : [...prev, saved]);
      setBomModal(null);
      showToast(entry.id ? "BOM entry updated" : "BOM entry added", "success");
    } catch (err: any) {
      console.error("saveBomEntry:", err);
      showToast("Failed to save BOM entry — please try again", "error");
    }
  }, [currentUser, setBomModal, showToast]);

  const deleteBomEntry = useCallback(async (id: string) => {
    try {
      await dbDeleteBomEntry(id);
      setBom(prev => prev.filter(b => b.id !== id));
      showToast("BOM entry deleted", "success");
    } catch (err: any) {
      console.error("deleteBomEntry:", err);
      showToast("Failed to delete BOM entry", "error");
    }
  }, [showToast]);

  // ── Announcement CRUD ─────────────────────────────────────────────────
  const saveAnnouncement = useCallback(async (a: Partial<Announcement>) => {
    try {
      const saved = await dbSaveAnnouncement({ ...a, updatedBy: currentUser?.name ?? "" });
      setAnnouncements(prev => prev.find(x => x.id === saved.id)
        ? prev.map(x => x.id === saved.id ? saved : x)
        : [saved, ...prev]);
      showToast(a.id ? "Post updated" : "Post published", "success");
    } catch (err: any) {
      console.error("saveAnnouncement:", err);
      showToast("Failed to save post — please try again", "error");
    }
  }, [currentUser, showToast]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      await dbDeleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      showToast("Post deleted", "success");
    } catch (err: any) {
      console.error("deleteAnnouncement:", err);
      showToast("Failed to delete post", "error");
    }
  }, [showToast]);

  // ── Member CRUD ───────────────────────────────────────────────────────
  const saveMember = useCallback(async (m: User) => {
    try {
      const saved = await dbSaveUser({ ...m, updatedBy: currentUser?.name ?? "" });
      setUsers(prev => prev.find(x => x.id === saved.id)
        ? prev.map(x => x.id === saved.id ? saved : x)
        : [...prev, saved]);
      setMemberModal(null);
      showToast(m.id ? "Member updated" : "Member added", "success");
    } catch (err: any) {
      console.error("saveMember:", err);
      showToast("Failed to save member — please try again", "error");
    }
  }, [currentUser, setMemberModal, showToast]);

  const removeMember = useCallback(async (id: string) => {
    try {
      await dbDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast("Member removed", "success");
    } catch (e: any) {
      console.error("removeMember:", e);
      if (e?.status === 403) {
        showToast('Permission denied — set Delete rule to @request.auth.role = "admin" in PocketBase', "error");
      } else if (e?.status === 404) {
        // Already deleted — clean up local state silently
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        showToast("Failed to remove member: " + (e?.message ?? "Unknown error"), "error");
      }
    }
    setConfirmRemove(null);
  }, [setConfirmRemove, showToast]);

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
