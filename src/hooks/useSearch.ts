import type { Task, Project, User, Supplier, BomEntry, SearchResult } from "../types";
import { statusColor, bomStatusMeta } from "../constants/seeds";
import { clr } from "../constants/theme";

interface SearchDeps {
  tasks:     Task[];
  projects:  Project[];
  users:     User[];
  suppliers: Supplier[];
  bom:       BomEntry[];
  currentUser: User;
  setTab:    (tab: string) => void;
  setTaskModal: (task: Task) => void;
  setPf:     (pf: string) => void;
}

export const useSearch = (query: string, deps: SearchDeps | null): SearchResult[] => {
  if (!query || query.trim().length < 2 || !deps) return [];
  const q = query.trim().toLowerCase();

  const { tasks, projects, users, suppliers, bom, currentUser, setTab, setTaskModal, setPf } = deps;
  const results: SearchResult[] = [];

  // Tasks
  const myTasks = currentUser.role === "shopfloor"
    ? tasks.filter((t) => t.assigneeId === currentUser.id)
    : tasks;

  myTasks.forEach((t) => {
    if (!t.title.toLowerCase().includes(q) && !(t.description || "").toLowerCase().includes(q)) return;
    const proj = projects.find((p) => p.id === t.projectId);
    results.push({
      type:   "task",
      icon:   "✅",
      label:  t.title,
      sub:    proj?.name || "",
      color:  statusColor[t.status] || clr.textMuted,
      action: () => { setTaskModal(t); setTab("tasks"); },
    });
  });

  // Projects (managers/admins only)
  if (currentUser.role !== "shopfloor") {
    projects.forEach((p) => {
      if (!p.name.toLowerCase().includes(q) && !(p.description || "").toLowerCase().includes(q)) return;
      results.push({
        type:   "project",
        icon:   "🗂️",
        label:  p.name,
        sub:    p.description || "",
        color:  p.color,
        action: () => { setPf(p.id); setTab("projects"); },
      });
    });

    // Suppliers
    suppliers.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q)) {
        results.push({ type: "supplier", icon: "📦", label: s.name, sub: s.email || s.contact, color: clr.orange, action: () => setTab("suppliers") });
      }
      // Parts
      (s.parts || []).forEach((pt) => {
        if (!pt.partNumber.toLowerCase().includes(q) && !pt.description.toLowerCase().includes(q)) return;
        results.push({ type: "part", icon: "🔧", label: pt.partNumber, sub: pt.description, color: clr.cyan, action: () => setTab("suppliers") });
      });
      // Orders
      (s.orders || []).forEach((o) => {
        if (!o.description.toLowerCase().includes(q)) return;
        results.push({ type: "order", icon: "📋", label: o.description, sub: s.name, color: clr.yellow, action: () => setTab("suppliers") });
      });
    });

    // BOM notes
    bom.forEach((entry) => {
      if (!entry.notes.toLowerCase().includes(q)) return;
      const sup = suppliers.find((s) => s.id === entry.supplierId);
      const pt  = (sup?.parts || []).find((p) => p.id === entry.partId);
      if (!pt) return;
      const meta = bomStatusMeta[entry.status];
      results.push({ type: "bom", icon: "🔩", label: pt.partNumber, sub: entry.notes.slice(0, 60), color: meta?.color || clr.textMuted, action: () => setTab("bom") });
    });

    // Team members
    users.forEach((u) => {
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return;
      results.push({ type: "member", icon: "👤", label: u.name, sub: u.email, color: clr.purple, action: () => setTab("team") });
    });
  }

  return results.slice(0, 12);
};
