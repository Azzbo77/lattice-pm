import { createContext, useState, useContext } from "react";
import { useStorage } from "../hooks/useStorage";
import { todayStr, addDays, initials, nowISO } from "../utils/dateHelpers";
import {
  SEED_USERS, DEMO_PROJECTS, DEMO_TASKS,
  DEMO_SUPPLIERS, DEMO_BOM, ROLES,
} from "../constants/seeds";

export const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // ── Persisted state ──────────────────────────────────────────────────────
  const [users,     setUsers]     = useStorage("pm5:users",     SEED_USERS);
  const [projects,  setProjects]  = useStorage("pm5:projects",  DEMO_PROJECTS);
  const [tasks,     setTasks]     = useStorage("pm5:tasks",     DEMO_TASKS);
  const [suppliers, setSuppliers] = useStorage("pm5:suppliers", DEMO_SUPPLIERS);
  const [bom,       setBom]       = useStorage("pm5:bom",       DEMO_BOM);

  // ── Session state ────────────────────────────────────────────────────────
  const [currentUser,      setCurrentUser]      = useState(null);
  const [mustSetPassword,  setMustSetPassword]  = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [tab,                  setTab]                  = useState("dashboard");
  const [pf,                   setPf]                   = useState("all");
  const [bomFilter,            setBomFilter]            = useState("all");
  const [dismissed,            setDismissed]            = useState([]);

  // Modal visibility
  const [taskModal,            setTaskModal]            = useState(null);
  const [projectModal,         setProjectModal]         = useState(null);
  const [supplierModal,        setSupplierModal]        = useState(null);
  const [orderModal,           setOrderModal]           = useState(null);
  const [partModal,            setPartModal]            = useState(null);
  const [bomModal,             setBomModal]             = useState(null);
  const [memberModal,          setMemberModal]          = useState(null);
  const [showBackup,           setShowBackup]           = useState(false);
  const [showSummary,          setShowSummary]          = useState(false);
  const [confirmRemove,        setConfirmRemove]        = useState(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  const isAdmin    = currentUser?.role === ROLES.ADMIN;
  const canManage  = currentUser?.role !== ROLES.WORKER;

  const filteredTasks = tasks.filter((t) => {
    if (currentUser?.role === ROLES.WORKER && t.assigneeId !== currentUser.id) return false;
    if (pf !== "all" && t.projectId !== pf) return false;
    return true;
  });

  const bomRows = bom.map((entry) => {
    const supplier = suppliers.find((s) => s.id === entry.supplierId);
    const part     = (supplier?.parts || []).find((p) => p.id === entry.partId);
    return { ...entry, supplier, part };
  }).filter((r) => r.supplier && r.part);

  const filteredBom = bomFilter === "all"
    ? bomRows
    : bomRows.filter((r) => r.status === bomFilter);

  const notifications = (() => {
    if (!currentUser) return [];
    const notes = [];
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
  const login = (email, password) => {
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

  const completePasswordReset = (newPassword) => {
    const updated = { ...currentUser, password: newPassword, mustChangePassword: false };
    setUsers((p) => p.map((u) => (u.id === currentUser.id ? updated : u)));
    setCurrentUser(updated);
    setMustSetPassword(false);
  };

  // ── Task handlers ────────────────────────────────────────────────────────
  const saveTask = (t) => {
    const stamped = { ...t, updatedAt: nowISO(), updatedBy: currentUser.name };
    setTasks((p) => p.find((x) => x.id === stamped.id) ? p.map((x) => x.id === stamped.id ? stamped : x) : [...p, stamped]);
    setTaskModal(null);
  };

  const deleteTask = (id) => setTasks((p) => p.filter((t) => t.id !== id));

  const updateTaskStatus = (id, status) =>
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status, updatedAt: nowISO(), updatedBy: currentUser.name } : t));

  // ── Project handlers ─────────────────────────────────────────────────────
  const saveProject = (proj) => {
    const stamped = { ...proj, updatedAt: nowISO(), updatedBy: currentUser.name };
    setProjects((p) => p.find((x) => x.id === stamped.id) ? p.map((x) => x.id === stamped.id ? stamped : x) : [...p, stamped]);
    setProjectModal(null);
  };

  const deleteProject = (id) => {
    setProjects((p) => p.filter((x) => x.id !== id));
    setTasks((p) => p.filter((t) => t.projectId !== id));
    setConfirmDeleteProject(null);
  };

  // ── Supplier handlers ────────────────────────────────────────────────────
  const saveSupplier = (s) => {
    const stamped = { ...s, updatedAt: nowISO(), updatedBy: currentUser.name };
    setSuppliers((p) => p.find((x) => x.id === stamped.id) ? p.map((x) => x.id === stamped.id ? stamped : x) : [...p, stamped]);
    setSupplierModal(null);
  };

  const savePart = (supplierId, part) => {
    setSuppliers((p) =>
      p.map((s) => {
        if (s.id !== supplierId) return s;
        const exists = (s.parts || []).find((x) => x.id === part.id);
        const newParts = exists
          ? s.parts.map((x) => (x.id === part.id ? part : x))
          : [...(s.parts || []), part];
        return { ...s, parts: newParts, updatedAt: nowISO(), updatedBy: currentUser.name };
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

  const deletePart = (supplierId, partId) => {
    setSuppliers((p) =>
      p.map((s) =>
        s.id === supplierId ? { ...s, parts: (s.parts || []).filter((pt) => pt.id !== partId) } : s
      )
    );
    setBom((p) => p.filter((b) => !(b.supplierId === supplierId && b.partId === partId)));
  };

  const addOrder = (supplierId, order) => {
    setSuppliers((p) =>
      p.map((s) => s.id === supplierId ? { ...s, orders: [...(s.orders || []), { ...order, updatedAt: nowISO(), updatedBy: currentUser.name }], updatedAt: nowISO(), updatedBy: currentUser.name } : s)
    );
    setOrderModal(null);
  };

  const toggleArrived = (supplierId, orderId) =>
    setSuppliers((p) =>
      p.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              orders: (s.orders || []).map((o) =>
                o.id === orderId
                  ? { ...o, arrived: !o.arrived, arrivedDate: !o.arrived ? todayStr() : null, updatedAt: nowISO(), updatedBy: currentUser.name }
                  : o
              ),
            }
          : s
      )
    );

  // ── BOM handlers ─────────────────────────────────────────────────────────
  const saveBomEntry = (entry) => {
    const stamped = { ...entry, updatedAt: nowISO(), updatedBy: currentUser.name };
    setBom((p) =>
      p.find((x) => x.id === stamped.id) ? p.map((x) => x.id === stamped.id ? stamped : x) : [...p, stamped]
    );
    setBomModal(null);
  };

  // ── Member handlers ──────────────────────────────────────────────────────
  const saveMember = (m) => {
    setUsers((p) => p.find((x) => x.id === m.id) ? p.map((x) => x.id === m.id ? m : x) : [...p, m]);
    if (currentUser?.id === m.id) setCurrentUser(m);
    setMemberModal(null);
  };

  const removeMember = (id) => {
    setUsers((p) => p.filter((u) => u.id !== id));
    setConfirmRemove(null);
  };

  // ── Backup/restore ───────────────────────────────────────────────────────
  const exportBackup = () => {
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

  const importBackup = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
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
    reader.readAsText(file);
  };

  // ── Dismiss notification ─────────────────────────────────────────────────
  const dismissNotification = (id) => setDismissed((p) => [...p, id]);
  const dismissAllNotifications = () =>
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
      saveSupplier, savePart, deletePart, addOrder, toggleArrived,
      // BOM
      saveBomEntry,
      // Member
      saveMember, removeMember,
      // Backup
      exportBackup, importBackup,
      // Notifications
      dismissNotification, dismissAllNotifications,
      // UI state
      tab, setTab,
      pf, setPf,
      bomFilter, setBomFilter,
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
