import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { ROLES, statusColor, roleColor } from "../constants/seeds";

export const useSearch = (query, setTab, setSearchQuery, setShowSearch) => {
  const { tasks, projects, suppliers, bom, users, currentUser } = useContext(AppContext);

  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const results = [];

  const go = (tabId) => {
    setTab(tabId);
    setSearchQuery("");
    setShowSearch(false);
  };

  // Tasks
  tasks.forEach((t) => {
    if (currentUser.role === ROLES.WORKER && t.assigneeId !== currentUser.id) return;
    const proj = projects.find((p) => p.id === t.projectId);
    const assignee = users.find((u) => u.id === t.assigneeId);
    const hay = [t.title, t.description, proj?.name, assignee?.name, t.status, t.priority]
      .join(" ").toLowerCase();
    if (hay.includes(q))
      results.push({
        type: "task", icon: "✅", id: t.id, label: t.title,
        sub: `${proj?.name || ""}  ·  ${assignee?.name || ""}  ·  ${t.status}`,
        color: statusColor[t.status] || "#888",
        action: () => go("tasks"),
      });
  });

  // Projects
  projects.forEach((p) => {
    const hay = [p.name, p.description].join(" ").toLowerCase();
    if (hay.includes(q))
      results.push({
        type: "project", icon: "🗂️", id: p.id, label: p.name,
        sub: `${tasks.filter((t) => t.projectId === p.id).length} tasks`,
        color: p.color,
        action: () => go("projects"),
      });
  });

  // Suppliers + parts + orders
  suppliers.forEach((s) => {
    if ([s.name, s.contact, s.phone].join(" ").toLowerCase().includes(q))
      results.push({
        type: "supplier", icon: "📦", id: s.id, label: s.name,
        sub: s.contact, color: "#ff6b35",
        action: () => go("suppliers"),
      });

    (s.parts || []).forEach((pt) => {
      if ([pt.partNumber, pt.description, s.name].join(" ").toLowerCase().includes(q))
        results.push({
          type: "part", icon: "🔩", id: pt.id, label: pt.partNumber,
          sub: `${pt.description}  ·  ${s.name}`, color: "#00d4ff",
          action: () => go("bom"),
        });
    });

    (s.orders || []).forEach((o) => {
      if ([o.description, s.name].join(" ").toLowerCase().includes(q))
        results.push({
          type: "order", icon: "📋", id: o.id, label: o.description,
          sub: `${s.name}  ·  ${o.arrived ? "Arrived" : "Pending"}`,
          color: o.arrived ? "#48bb78" : "#f6c90e",
          action: () => go("suppliers"),
        });
    });
  });

  // BOM notes
  bom.forEach((entry) => {
    if (!entry.notes) return;
    const sup = suppliers.find((s) => s.id === entry.supplierId);
    const pt = (sup?.parts || []).find((p) => p.id === entry.partId);
    if (!pt) return;
    if ([entry.notes, pt.partNumber, pt.description].join(" ").toLowerCase().includes(q))
      results.push({
        type: "bom-note", icon: "📝", id: entry.id, label: `Note: ${pt.partNumber}`,
        sub: entry.notes.length > 60 ? entry.notes.slice(0, 60) + "…" : entry.notes,
        color: "#a78bfa",
        action: () => go("bom"),
      });
  });

  // Team (not worker)
  if (currentUser.role !== ROLES.WORKER) {
    users.forEach((u) => {
      if ([u.name, u.email, u.role].join(" ").toLowerCase().includes(q))
        results.push({
          type: "user", icon: "👤", id: u.id, label: u.name,
          sub: `${u.role}  ·  ${u.email}`, color: roleColor[u.role],
          action: () => go("team"),
        });
    });
  }

  return results.slice(0, 12);
};
