import { useState, useEffect, useCallback } from "react";

const ROLES = { ADMIN: "admin", MANAGER: "manager", WORKER: "worker" };

const SEED_USERS = [
  { id: "u1", name: "Alex Morgan", email: "alex@company.com", role: ROLES.ADMIN, password: "admin123", avatar: "AM" },
  { id: "u2", name: "Jamie Chen", email: "jamie@company.com", role: ROLES.MANAGER, password: "manager123", avatar: "JC" },
  { id: "u3", name: "Sam Rivera", email: "sam@company.com", role: ROLES.WORKER, password: "worker123", avatar: "SR" },
  { id: "u4", name: "Taylor Brooks", email: "taylor@company.com", role: ROLES.WORKER, password: "worker456", avatar: "TB" },
];

const DEMO_PROJECTS = [
  { id: "p1", name: "Website Redesign", color: "#00d4ff" },
  { id: "p2", name: "Mobile App Launch", color: "#ff6b35" },
];

const DEMO_TASKS = [
  { id: "t1", projectId: "p1", title: "Design Mockups", assigneeId: "u3", startDate: "2026-03-01", endDate: "2026-03-10", status: "in-progress", priority: "high", description: "" },
  { id: "t2", projectId: "p1", title: "Frontend Development", assigneeId: "u4", startDate: "2026-03-08", endDate: "2026-03-25", status: "todo", priority: "high", description: "" },
  { id: "t3", projectId: "p1", title: "Backend API", assigneeId: "u2", startDate: "2026-03-05", endDate: "2026-03-20", status: "in-progress", priority: "medium", description: "" },
  { id: "t4", projectId: "p2", title: "App Architecture", assigneeId: "u3", startDate: "2026-03-12", endDate: "2026-03-18", status: "todo", priority: "high", description: "" },
  { id: "t5", projectId: "p2", title: "QA Testing", assigneeId: "u4", startDate: "2026-03-22", endDate: "2026-03-31", status: "todo", priority: "medium", description: "" },
];

// Suppliers now have a parts catalogue separate from orders
const DEMO_SUPPLIERS = [
  {
    id: "s1", name: "TechParts Co.", contact: "orders@techparts.com", phone: "+1-555-0100",
    // Parts catalogue: each part has qty per unit (e.g. box of 10)
    parts: [
      { id: "pt1", partNumber: "TP-SRV-001", description: "Rack Server Unit", unitQty: 1, unit: "ea" },
      { id: "pt2", partNumber: "TP-NSW-010", description: "24-Port Network Switch", unitQty: 1, unit: "ea" },
      { id: "pt3", partNumber: "TP-CAB-100", description: "Cat6 Patch Cable 1m", unitQty: 10, unit: "box" },
    ],
    orders: [
      { id: "o1", description: "Server Hardware", orderedDate: "2026-02-15", leadTimeDays: 21, arrived: false, arrivedDate: null, partIds: ["pt1"] },
      { id: "o2", description: "Network Switches", orderedDate: "2026-02-20", leadTimeDays: 14, arrived: true, arrivedDate: "2026-03-05", partIds: ["pt2", "pt3"] },
    ]
  },
  {
    id: "s2", name: "Creative Assets Ltd.", contact: "supply@creativeassets.com", phone: "+1-555-0200",
    parts: [
      { id: "pt4", partNumber: "CA-PHO-LIC", description: "Stock Photography License (Annual)", unitQty: 1, unit: "licence" },
      { id: "pt5", partNumber: "CA-VID-PKG", description: "Video Asset Pack - 50 clips", unitQty: 50, unit: "clips" },
    ],
    orders: [
      { id: "o3", description: "Stock Photography License", orderedDate: "2026-02-28", leadTimeDays: 3, arrived: false, arrivedDate: null, partIds: ["pt4"] },
    ]
  },
];

// BOM entries: one per part, linked to supplier
// status: "pending" | "used" | "not-used" | "under-review"
const DEMO_BOM = [
  { id: "b1", supplierId: "s1", partId: "pt1", qtyOrdered: 2, status: "used", notes: "", project: "" },
  { id: "b2", supplierId: "s1", partId: "pt2", qtyOrdered: 3, status: "used", notes: "Consider TP-NSW-020 for higher port density next revision", project: "" },
  { id: "b3", supplierId: "s1", partId: "pt3", qtyOrdered: 5, status: "used", notes: "", project: "" },
  { id: "b4", supplierId: "s2", partId: "pt4", qtyOrdered: 1, status: "pending", notes: "", project: "" },
  { id: "b5", supplierId: "s2", partId: "pt5", qtyOrdered: 0, status: "not-used", notes: "Not required for this phase — revisit for v2 marketing", project: "" },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; };
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
const todayStr = () => new Date().toISOString().split("T")[0];
const initials = (name) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

// Storage abstraction: uses window.storage (Claude artifact env) or localStorage (standard browser)
const useStorage = (key, fallback) => {
  const [val, setVal] = useState(fallback);
  useEffect(() => {
    (async () => {
      try {
        if (window.storage) {
          const r = await window.storage.get(key);
          if (r) setVal(JSON.parse(r.value));
        } else {
          const r = localStorage.getItem(key);
          if (r) setVal(JSON.parse(r));
        }
      } catch {}
    })();
  }, [key]);
  const save = useCallback(async (v) => {
    const next = typeof v === "function" ? v(val) : v;
    setVal(next);
    try {
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(next));
      } else {
        localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {}
  }, [key, val]);
  return [val, save];
};

const getNotifications = (tasks, suppliers, userId, role) => {
  const notes = [];
  const now = todayStr();
  const soon = addDays(now, 3);
  tasks.forEach(t => {
    if (role === ROLES.WORKER && t.assigneeId !== userId) return;
    if (t.status === "done") return;
    if (t.endDate < now) notes.push({ id: `od-${t.id}`, type: "overdue", text: `"${t.title}" is overdue` });
    else if (t.endDate <= soon) notes.push({ id: `ds-${t.id}`, type: "soon", text: `"${t.title}" due ${fmt(t.endDate)}` });
  });
  suppliers.forEach(s => (s.orders || []).forEach(order => {
    if (order.arrived) return;
    const due = addDays(order.orderedDate, order.leadTimeDays);
    if (due < now) notes.push({ id: `sol-${order.id}`, type: "overdue", text: `${s.name}: "${order.description}" overdue` });
    else if (due <= soon) notes.push({ id: `sos-${order.id}`, type: "soon", text: `${s.name}: "${order.description}" arriving ${fmt(due)}` });
  }));
  return notes;
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const inp = { width: "100%", padding: "0.5rem 0.75rem", background: "#15152a", border: "1px solid #252540", borderRadius: "6px", color: "#e0e0e0", fontSize: "0.875rem", boxSizing: "border-box", outline: "none" };
const roleColor = { admin: "#ff6b35", manager: "#00d4ff", worker: "#48bb78" };
const prioColor = { low: "#4a5568", medium: "#f6c90e", high: "#fc8181" };
const statusColor = { todo: "#4a5568", "in-progress": "#00d4ff", done: "#48bb78", blocked: "#fc8181" };
const bomStatusMeta = {
  pending:      { color: "#888",    bg: "#88888818",  label: "Pending",      icon: "⏳" },
  used:         { color: "#48bb78", bg: "#48bb7818",  label: "Used",         icon: "✅" },
  "not-used":   { color: "#fc8181", bg: "#fc818118",  label: "Not Used",     icon: "❌" },
  "under-review":{ color: "#f6c90e",bg: "#f6c90e18",  label: "Under Review", icon: "🔍" },
};

// ── SHARED UI ─────────────────────────────────────────────────────────────────
const Overlay = ({ children, onClose, wide }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#0f0f1e", border: "1px solid #252540", borderRadius: "12px", padding: "1.5rem", width: "100%", maxWidth: wide ? "720px" : "500px", maxHeight: "92vh", overflowY: "auto" }}>
      {children}
    </div>
  </div>
);
const Lbl = ({ c }) => <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c}</div>;
const Btn = ({ children, color, small, ...p }) => (
  <button style={{ padding: small ? "0.3rem 0.65rem" : "0.45rem 1rem", borderRadius: "6px", border: color === "ghost" ? "1px solid #252540" : "none", background: color === "ghost" ? "transparent" : color || "#252540", color: color === "ghost" ? "#666" : "#fff", fontSize: small ? "0.72rem" : "0.83rem", fontWeight: 600, cursor: "pointer" }} {...p}>{children}</button>
);
const Avatar = ({ name, role, size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `${roleColor[role]}18`, border: `2px solid ${roleColor[role]}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: roleColor[role], fontSize: size * 0.27 }}>{initials(name)}</div>
);
const TH = ({ children }) => <div style={{ fontSize: "0.62rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0.4rem 0.5rem" }}>{children}</div>;
const TD = ({ children, style }) => <div style={{ padding: "0.65rem 0.5rem", fontSize: "0.82rem", color: "#ccc", borderTop: "1px solid #141428", ...style }}>{children}</div>;

// ── PART MODAL (add/edit a part in supplier catalogue) ────────────────────────
const PartModal = ({ part, onSave, onClose }) => {
  const [f, setF] = useState({ partNumber: part.partNumber||"", description: part.description||"", unitQty: part.unitQty||1, unit: part.unit||"ea" });
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const [err, setErr] = useState("");
  const save = () => {
    if (!f.partNumber.trim()) return setErr("Part number is required.");
    if (!f.description.trim()) return setErr("Description is required.");
    onSave({ ...f, id: part.id || `pt${Date.now()}`, unitQty: parseInt(f.unitQty) || 1 });
  };
  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>{part.id ? "Edit Part" : "Add Part to Catalogue"}</h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div><Lbl c="Part Number" /><input style={inp} value={f.partNumber} onChange={u("partNumber")} placeholder="e.g. TP-SRV-001" /></div>
          <div><Lbl c="Unit Qty per Order" /><input type="number" style={inp} value={f.unitQty} onChange={u("unitQty")} min="1" /></div>
        </div>
        <div><Lbl c="Description" /><input style={inp} value={f.description} onChange={u("description")} placeholder="e.g. Rack Server Unit" /></div>
        <div><Lbl c="Unit Type" />
          <select style={inp} value={f.unit} onChange={u("unit")}>
            {["ea","box","pack","roll","set","kit","metre","litre","kg","licence","clips","other"].map(u2 => <option key={u2} value={u2}>{u2}</option>)}
          </select>
        </div>
        <div style={{ fontSize: "0.78rem", color: "#555", padding: "0.5rem 0.75rem", background: "#15152a", borderRadius: "6px" }}>
          e.g. if you order 1 box but it contains 10 cables, set <strong style={{ color: "#888" }}>Unit Qty = 10</strong> and <strong style={{ color: "#888" }}>Unit = box</strong>
        </div>
      </div>
      {err && <div style={{ marginTop: "0.75rem", color: "#fc8181", fontSize: "0.8rem" }}>{err}</div>}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={onClose}>Cancel</Btn>
        <Btn color="#00d4ff" onClick={save}>{part.id ? "Save Part" : "Add Part"}</Btn>
      </div>
    </Overlay>
  );
};

// ── ORDER MODAL ───────────────────────────────────────────────────────────────
const OrderModal = ({ supplier, onSave, onClose }) => {
  const [f, setF] = useState({ description: "", orderedDate: todayStr(), leadTimeDays: 14, partIds: [] });
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const togglePart = (id) => setF(p => ({ ...p, partIds: p.partIds.includes(id) ? p.partIds.filter(x => x !== id) : [...p.partIds, id] }));
  const arrival = addDays(f.orderedDate, parseInt(f.leadTimeDays) || 0);
  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>New Order — {supplier.name}</h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div><Lbl c="Order Description" /><input style={inp} value={f.description} onChange={u("description")} placeholder="e.g. Q1 hardware batch" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div><Lbl c="Order Date" /><input type="date" style={inp} value={f.orderedDate} onChange={u("orderedDate")} /></div>
          <div><Lbl c="Lead Time (days)" /><input type="number" style={inp} value={f.leadTimeDays} onChange={u("leadTimeDays")} min="1" /></div>
        </div>
        <div style={{ fontSize: "0.8rem", color: "#666" }}>Est. arrival: <span style={{ color: "#48bb78" }}>{fmt(arrival)}</span></div>
        {supplier.parts?.length > 0 && (
          <div>
            <Lbl c="Parts Included in this Order" />
            <div style={{ display: "grid", gap: "4px" }}>
              {supplier.parts.map(pt => (
                <label key={pt.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: f.partIds.includes(pt.id) ? "#15152a" : "#0d0d1e", border: `1px solid ${f.partIds.includes(pt.id) ? "#252550" : "#1a1a2e"}`, borderRadius: "6px", cursor: "pointer" }}>
                  <input type="checkbox" checked={f.partIds.includes(pt.id)} onChange={() => togglePart(pt.id)} style={{ accentColor: "#00d4ff", width: "14px", height: "14px" }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.78rem", color: "#00d4ff", fontFamily: "monospace" }}>{pt.partNumber}</span>
                    <span style={{ fontSize: "0.78rem", color: "#aaa", marginLeft: "0.5rem" }}>{pt.description}</span>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#555" }}>×{pt.unitQty} {pt.unit}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={onClose}>Cancel</Btn>
        <Btn color="#48bb78" onClick={() => onSave({ ...f, id: `o${Date.now()}`, leadTimeDays: parseInt(f.leadTimeDays)||14, arrived: false, arrivedDate: null })}>Add Order</Btn>
      </div>
    </Overlay>
  );
};

// ── SUPPLIER MODAL ────────────────────────────────────────────────────────────
const SupplierModal = ({ supplier, onSave, onClose }) => {
  const [f, setF] = useState({ name: supplier.name||"", contact: supplier.contact||"", phone: supplier.phone||"" });
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>{supplier.id ? "Edit Supplier" : "Add Supplier"}</h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div><Lbl c="Company Name" /><input style={inp} value={f.name} onChange={u("name")} /></div>
        <div><Lbl c="Email" /><input style={inp} value={f.contact} onChange={u("contact")} /></div>
        <div><Lbl c="Phone" /><input style={inp} value={f.phone} onChange={u("phone")} /></div>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={onClose}>Cancel</Btn>
        <Btn color="#ff6b35" onClick={() => onSave({ ...f, id: supplier.id || `s${Date.now()}`, parts: supplier.parts || [], orders: supplier.orders || [] })}>Save</Btn>
      </div>
    </Overlay>
  );
};

// ── BOM ENTRY MODAL ───────────────────────────────────────────────────────────
const BomModal = ({ entry, part, supplier, onSave, onClose }) => {
  const [f, setF] = useState({ qtyOrdered: entry.qtyOrdered || 1, status: entry.status || "pending", notes: entry.notes || "", project: entry.project || "" });
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const meta = bomStatusMeta[f.status];
  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "0.25rem" }}>BOM Entry</h3>
      <div style={{ marginBottom: "1.25rem", fontSize: "0.78rem", color: "#555" }}>{supplier?.name} — <span style={{ color: "#00d4ff", fontFamily: "monospace" }}>{part?.partNumber}</span></div>
      <div style={{ padding: "0.75rem", background: "#15152a", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #252540" }}>
        <div style={{ fontSize: "0.72rem", color: "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Part</div>
        <div style={{ color: "#e0e0e0", fontSize: "0.88rem", fontWeight: 600 }}>{part?.description}</div>
        <div style={{ fontSize: "0.72rem", color: "#666", marginTop: "4px" }}>Unit: {part?.unitQty} × {part?.unit} per order</div>
      </div>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <Lbl c="Qty Ordered" />
            <input type="number" style={inp} value={f.qtyOrdered} onChange={u("qtyOrdered")} min="0" />
            {part && <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "4px" }}>= {(parseInt(f.qtyOrdered)||0) * (part.unitQty||1)} {part.unit}(s) total</div>}
          </div>
          <div>
            <Lbl c="Usage Status" />
            <select style={{ ...inp, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}55` }} value={f.status} onChange={u("status")}>
              {Object.entries(bomStatusMeta).map(([k, v]) => <option key={k} value={k} style={{ background: "#15152a", color: "#e0e0e0" }}>{v.icon} {v.label}</option>)}
            </select>
          </div>
        </div>
        <div><Lbl c="Project / Assembly" /><input style={inp} value={f.project} onChange={u("project")} placeholder="e.g. Server Room Build, Phase 1" /></div>
        <div>
          <Lbl c="Engineering Notes / CI Suggestions" />
          <textarea style={{ ...inp, minHeight: "90px", resize: "vertical" }} value={f.notes} onChange={u("notes")} placeholder="e.g. Part worked well but consider higher-spec alternative for next revision..." />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={onClose}>Cancel</Btn>
        <Btn color="#00d4ff" onClick={() => onSave({ ...entry, ...f, qtyOrdered: parseInt(f.qtyOrdered)||0 })}>Save</Btn>
      </div>
    </Overlay>
  );
};

// ── PROJECT MODAL ─────────────────────────────────────────────────────────────
const PRESET_COLORS = ["#00d4ff","#ff6b35","#48bb78","#f6c90e","#a78bfa","#f472b6","#fb923c","#34d399","#60a5fa","#e879f9","#f87171","#94a3b8"];

const ProjectModal = ({ project, onSave, onClose }) => {
  const isNew = !project.id;
  const [f, setF] = useState({ name: project.name || "", description: project.description || "", color: project.color || "#00d4ff" });
  const [err, setErr] = useState("");
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const save = () => {
    if (!f.name.trim()) return setErr("Project name is required.");
    onSave({ ...f, id: project.id || `p${Date.now()}`, name: f.name.trim() });
  };
  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>{isNew ? "New Project" : "Edit Project"}</h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div><Lbl c="Project Name" /><input style={inp} value={f.name} onChange={u("name")} placeholder="e.g. Factory Fit-Out Phase 2" /></div>
        <div><Lbl c="Description (optional)" /><input style={inp} value={f.description} onChange={u("description")} placeholder="Short description..." /></div>
        <div>
          <Lbl c="Colour" />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setF(p => ({ ...p, color: c }))} style={{ width: "28px", height: "28px", borderRadius: "6px", background: c, border: f.color === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", flexShrink: 0 }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input type="color" value={f.color} onChange={u("color")} style={{ width: "36px", height: "28px", border: "none", background: "none", cursor: "pointer", padding: 0 }} />
            <span style={{ fontSize: "0.75rem", color: "#555" }}>or pick a custom colour</span>
          </div>
        </div>
        {/* Preview */}
        <div style={{ padding: "0.75rem", background: "#15152a", borderRadius: "8px", border: "1px solid #252540", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: f.color, flexShrink: 0 }} />
          <span style={{ color: f.color, fontSize: "0.88rem", fontWeight: 600 }}>{f.name || "Project Name"}</span>
        </div>
      </div>
      {err && <div style={{ marginTop: "0.75rem", color: "#fc8181", fontSize: "0.8rem" }}>{err}</div>}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={onClose}>Cancel</Btn>
        <Btn color={f.color} onClick={save}>{isNew ? "Create Project" : "Save Changes"}</Btn>
      </div>
    </Overlay>
  );
};

// ── TASK MODAL ────────────────────────────────────────────────────────────────
const TaskModal = ({ task, projects, users, onSave, onClose, canEdit }) => {
  const [f, setF] = useState({ title: task.title||"", projectId: task.projectId||projects[0]?.id||"", assigneeId: task.assigneeId||users[0]?.id||"", startDate: task.startDate||todayStr(), endDate: task.endDate||addDays(todayStr(),7), status: task.status||"todo", priority: task.priority||"medium", description: task.description||"" });
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>{task.id ? "Edit Task" : "New Task"}</h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div><Lbl c="Title" /><input style={inp} value={f.title} onChange={u("title")} disabled={!canEdit} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div><Lbl c="Project" /><select style={inp} value={f.projectId} onChange={u("projectId")} disabled={!canEdit}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><Lbl c="Assignee" /><select style={inp} value={f.assigneeId} onChange={u("assigneeId")} disabled={!canEdit}>{users.map(u2 => <option key={u2.id} value={u2.id}>{u2.name}</option>)}</select></div>
          <div><Lbl c="Start Date" /><input type="date" style={inp} value={f.startDate} onChange={u("startDate")} disabled={!canEdit} /></div>
          <div><Lbl c="End Date" /><input type="date" style={inp} value={f.endDate} onChange={u("endDate")} disabled={!canEdit} /></div>
          <div><Lbl c="Status" /><select style={inp} value={f.status} onChange={u("status")}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option><option value="blocked">Blocked</option></select></div>
          <div><Lbl c="Priority" /><select style={inp} value={f.priority} onChange={u("priority")} disabled={!canEdit}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        </div>
        <div><Lbl c="Description" /><textarea style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={f.description} onChange={u("description")} /></div>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={onClose}>Cancel</Btn>
        <Btn color="#00d4ff" onClick={() => onSave({ ...f, id: task.id || `t${Date.now()}` })}>Save Task</Btn>
      </div>
    </Overlay>
  );
};

// ── MEMBER MODAL ──────────────────────────────────────────────────────────────
const pwStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "#333" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: "", color: "#333" },
    { score: 1, label: "Very weak", color: "#fc8181" },
    { score: 2, label: "Weak", color: "#fb923c" },
    { score: 3, label: "Fair", color: "#f6c90e" },
    { score: 4, label: "Good", color: "#34d399" },
    { score: 5, label: "Strong", color: "#48bb78" },
  ];
  return levels[Math.min(score, 5)];
};

const PasswordField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Lbl c={label} />
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          style={{ ...inp, paddingRight: "2.5rem" }}
          value={value}
          onChange={onChange}
          placeholder={placeholder || ""}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.85rem", padding: "0.2rem" }}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
};

const MemberModal = ({ member, onSave, onClose, currentUserId }) => {
  const isNew = !member.id;
  const isSelf = member.id === currentUserId;
  const [f, setF] = useState({
    name: member.name || "",
    email: member.email || "",
    role: member.role || ROLES.WORKER,
    password: "",
    confirmPassword: "",
    mustChangePassword: isNew ? true : (member.mustChangePassword || false),
  });
  const [err, setErr] = useState("");
  const u = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const strength = pwStrength(f.password);

  // Generate a random temp password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const pw = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setF(p => ({ ...p, password: pw, confirmPassword: pw }));
  };

  const save = () => {
    if (!f.name.trim()) return setErr("Name is required.");
    if (!f.email.trim()) return setErr("Email is required.");
    if (isNew && !f.password) return setErr("A temporary password is required for new members.");
    if (f.password && f.password !== f.confirmPassword) return setErr("Passwords do not match.");
    onSave({
      id: member.id || `u${Date.now()}`,
      name: f.name.trim(),
      email: f.email.trim(),
      role: f.role,
      password: f.password || member.password,
      mustChangePassword: f.mustChangePassword,
      avatar: initials(f.name.trim()),
    });
  };

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>
        {isNew ? "Add Team Member" : "Edit Member"}
      </h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {/* Name & Email */}
        <div><Lbl c="Full Name" /><input style={inp} value={f.name} onChange={u("name")} placeholder="e.g. Jordan Smith" /></div>
        <div><Lbl c="Email Address" /><input type="email" style={inp} value={f.email} onChange={u("email")} placeholder="jordan@company.com" /></div>
        <div>
          <Lbl c="Role" />
          <select style={inp} value={f.role} onChange={u("role")} disabled={isSelf}>
            <option value={ROLES.WORKER}>Worker — view & update own tasks</option>
            <option value={ROLES.MANAGER}>Manager — manage tasks & suppliers</option>
            <option value={ROLES.ADMIN}>Admin — full access</option>
          </select>
          {isSelf && <div style={{ fontSize: "0.68rem", color: "#555", marginTop: "4px" }}>You cannot change your own role.</div>}
        </div>

        {/* Password section */}
        <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600 }}>
              {isNew ? "Temporary Password" : "Change Password"}
            </span>
            <button
              onClick={generatePassword}
              style={{ fontSize: "0.72rem", color: "#00d4ff", background: "#00d4ff18", border: "1px solid #00d4ff40", borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}
            >
              🎲 Generate
            </button>
          </div>

          {!isNew && (
            <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.6rem" }}>
              Leave blank to keep the current password.
            </div>
          )}

          <PasswordField
            label={isNew ? "Password" : "New Password"}
            value={f.password}
            onChange={u("password")}
            placeholder={isNew ? "Set a temporary password" : "Leave blank to keep current"}
          />

          {/* Strength meter */}
          {f.password && (
            <div style={{ marginTop: "6px" }}>
              <div style={{ display: "flex", gap: "3px", marginBottom: "3px" }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength.score ? strength.color : "#1a1a2e", transition: "background 0.2s" }} />
                ))}
              </div>
              <div style={{ fontSize: "0.68rem", color: strength.color }}>{strength.label}</div>
            </div>
          )}
        </div>

        {/* Confirm password — only show if a password has been entered */}
        {(isNew || f.password) && (
          <PasswordField
            label="Confirm Password"
            value={f.confirmPassword}
            onChange={u("confirmPassword")}
            placeholder="Repeat password"
          />
        )}

        {/* Match indicator */}
        {f.password && f.confirmPassword && (
          <div style={{ fontSize: "0.72rem", color: f.password === f.confirmPassword ? "#48bb78" : "#fc8181", marginTop: "-0.4rem" }}>
            {f.password === f.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
          </div>
        )}

        {/* Must-change-password toggle */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem", background: f.mustChangePassword ? "#00d4ff0e" : "#15152a", border: `1px solid ${f.mustChangePassword ? "#00d4ff40" : "#252540"}`, borderRadius: "8px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={f.mustChangePassword}
            onChange={e => setF(p => ({ ...p, mustChangePassword: e.target.checked }))}
            style={{ accentColor: "#00d4ff", width: "14px", height: "14px", marginTop: "2px", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: "0.82rem", color: "#ccc", fontWeight: 600 }}>Prompt to set own password on first login</div>
            <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "2px" }}>The user will see a prompt to choose their own password when they next sign in.</div>
          </div>
        </label>
      </div>

      {err && (
        <div style={{ marginTop: "0.75rem", color: "#fc8181", fontSize: "0.8rem", padding: "0.5rem 0.75rem", background: "#fc818115", borderRadius: "6px", border: "1px solid #fc818140" }}>
          {err}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={onClose}>Cancel</Btn>
        <Btn color="#00d4ff" onClick={save}>{isNew ? "Add Member" : "Save Changes"}</Btn>
      </div>
    </Overlay>
  );
};

const ConfirmModal = ({ message, onConfirm, onClose }) => (
  <Overlay onClose={onClose}>
    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "0.75rem" }}>Are you sure?</h3>
    <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "1.25rem" }}>{message}</p>
    <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
      <Btn color="ghost" onClick={onClose}>Cancel</Btn>
      <Btn color="#fc8181" onClick={onConfirm}>Remove</Btn>
    </div>
  </Overlay>
);

// ── GANTT ─────────────────────────────────────────────────────────────────────
const Gantt = ({ tasks, users, projects, currentUser }) => {
  const visible = currentUser.role === ROLES.WORKER ? tasks.filter(t => t.assigneeId === currentUser.id) : tasks;
  if (!visible.length) return <div style={{ padding: "2rem", color: "#555", textAlign: "center" }}>No tasks to display.</div>;
  const dates = visible.flatMap(t => [t.startDate, t.endDate]);
  const minD = dates.reduce((a, b) => a < b ? a : b);
  const maxD = dates.reduce((a, b) => a > b ? a : b);
  const span = Math.max(daysBetween(minD, maxD) + 1, 30);
  const now = todayStr();
  const todayPct = Math.max(0, Math.min(100, (daysBetween(minD, now) / span) * 100));
  const pct = d => `${(daysBetween(minD, d) / span) * 100}%`;
  const wPct = (s, e) => `${(Math.max(daysBetween(s, e) + 1, 1) / span) * 100}%`;
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "520px" }}>
        {visible.map(task => {
          const proj = projects.find(p => p.id === task.projectId);
          const assignee = users.find(u => u.id === task.assigneeId);
          const overdue = task.endDate < now && task.status !== "done";
          const bc = overdue ? "#fc8181" : (statusColor[task.status] || proj?.color || "#00d4ff");
          return (
            <div key={task.id} style={{ display: "flex", alignItems: "center", marginBottom: "8px", gap: "8px" }}>
              <div style={{ width: "150px", flexShrink: 0 }}>
                <div style={{ fontSize: "0.78rem", color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
                <div style={{ fontSize: "0.62rem", color: "#555" }}>{assignee?.name}</div>
              </div>
              <div style={{ flex: 1, position: "relative", height: "26px" }}>
                <div style={{ position: "absolute", left: `${todayPct}%`, top: 0, bottom: 0, width: "2px", background: "#ff6b35", zIndex: 5 }} />
                <div style={{ position: "absolute", left: pct(task.startDate), width: wPct(task.startDate, task.endDate), top: "3px", height: "20px", background: `${bc}20`, border: `1.5px solid ${bc}`, borderRadius: "4px", display: "flex", alignItems: "center", paddingLeft: "6px", overflow: "hidden" }}>
                  <span style={{ fontSize: "0.62rem", color: bc, whiteSpace: "nowrap" }}>{task.title}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: "12px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[["#4a5568","To Do"],["#00d4ff","In Progress"],["#48bb78","Done"],["#fc8181","Overdue"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: "#555" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c }} />{l}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: "#555" }}>
            <div style={{ width: "2px", height: "10px", background: "#ff6b35" }} />Today
          </div>
        </div>
      </div>
    </div>
  );
};

// ── MUST SET PASSWORD SCREEN ─────────────────────────────────────────────────
const MustSetPasswordScreen = ({ user, onSave, onSkip }) => {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const strength = pwStrength(pw);

  const save = () => {
    if (!pw) return setErr("Please enter a new password.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    if (pw !== confirm) return setErr("Passwords do not match.");
    onSave(pw);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", padding: "1rem" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔐</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: "#e0e0e0", marginBottom: "0.4rem" }}>Set Your Password</h2>
          <p style={{ color: "#555", fontSize: "0.82rem" }}>Welcome, {user.name}. Please choose a personal password before continuing.</p>
        </div>

        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
          <PasswordField label="New Password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Choose a secure password" />
          {pw && (
            <div>
              <div style={{ display: "flex", gap: "3px", marginBottom: "3px" }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= strength.score ? strength.color : "#1a1a2e" }} />
                ))}
              </div>
              <div style={{ fontSize: "0.7rem", color: strength.color }}>{strength.label}</div>
            </div>
          )}
          <PasswordField label="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" />
          {pw && confirm && (
            <div style={{ fontSize: "0.72rem", color: pw === confirm ? "#48bb78" : "#fc8181" }}>
              {pw === confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
            </div>
          )}
        </div>

        {err && <div style={{ color: "#fc8181", fontSize: "0.8rem", marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: "#fc818115", borderRadius: "6px" }}>{err}</div>}

        <button onClick={save} style={{ width: "100%", padding: "0.75rem", background: "linear-gradient(135deg,#00d4ff,#0088aa)", border: "none", borderRadius: "8px", color: "#0a0a18", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", marginBottom: "0.5rem" }}>
          Set Password & Continue
        </button>
        <button onClick={onSkip} style={{ width: "100%", padding: "0.5rem", background: "transparent", border: "none", color: "#444", fontSize: "0.75rem", cursor: "pointer" }}>
          Skip for now (you will be prompted again next login)
        </button>
      </div>
    </div>
  );
};

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useStorage("pm5:users", SEED_USERS);
  const [projects, setProjects] = useStorage("pm5:projects", DEMO_PROJECTS);
  const [tasks, setTasks] = useStorage("pm5:tasks", DEMO_TASKS);
  const [suppliers, setSuppliers] = useStorage("pm5:suppliers", DEMO_SUPPLIERS);
  const [bom, setBom] = useStorage("pm5:bom", DEMO_BOM);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("gantt");
  const [lf, setLf] = useState({ email: "", password: "" });
  const [le, setLe] = useState("");
  const [projectModal, setProjectModal] = useState(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [supplierModal, setSupplierModal] = useState(null);
  const [orderModal, setOrderModal] = useState(null);
  const [partModal, setPartModal] = useState(null); // { supplierId, part }
  const [bomModal, setBomModal] = useState(null);   // { entry, partId, supplierId }
  const [memberModal, setMemberModal] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [pf, setPf] = useState("all");
  const [bomFilter, setBomFilter] = useState("all");
  const [mustSetPassword, setMustSetPassword] = useState(false);

  const notifs = currentUser ? getNotifications(tasks, suppliers, currentUser.id, currentUser.role).filter(n => !dismissed.includes(n.id)) : [];
  const canManage = currentUser?.role !== ROLES.WORKER;
  const isAdmin = currentUser?.role === ROLES.ADMIN;

  const login = () => {
    const u = users.find(u => u.email === lf.email && u.password === lf.password);
    if (!u) return setLe("Invalid email or password.");
    setCurrentUser(u);
    setLe("");
    if (u.mustChangePassword) setMustSetPassword(true);
  };

  const completePasswordReset = (newPassword) => {
    const updated = { ...currentUser, password: newPassword, mustChangePassword: false };
    setUsers(p => p.map(u => u.id === currentUser.id ? updated : u));
    setCurrentUser(updated);
    setMustSetPassword(false);
  };

  const saveTask = t => { setTasks(p => p.find(x => x.id === t.id) ? p.map(x => x.id === t.id ? t : x) : [...p, t]); setTaskModal(null); };
  const delTask = id => setTasks(p => p.filter(t => t.id !== id));

  const saveProject = p => { setProjects(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]); setProjectModal(null); };
  const deleteProject = id => { setProjects(p => p.filter(x => x.id !== id)); setTasks(p => p.filter(t => t.projectId !== id)); setConfirmDeleteProject(null); };

  const saveSupplier = s => { setSuppliers(p => p.find(x => x.id === s.id) ? p.map(x => x.id === s.id ? s : x) : [...p, s]); setSupplierModal(null); };

  const savePart = (supplierId, part) => {
    setSuppliers(p => p.map(s => {
      if (s.id !== supplierId) return s;
      const exists = (s.parts || []).find(x => x.id === part.id);
      const newParts = exists ? s.parts.map(x => x.id === part.id ? part : x) : [...(s.parts || []), part];
      return { ...s, parts: newParts };
    }));
    // Auto-add to BOM if new part
    if (!part._existing) {
      setBom(prev => [...prev, { id: `b${Date.now()}`, supplierId, partId: part.id, qtyOrdered: 0, status: "pending", notes: "", project: "" }]);
    }
    setPartModal(null);
  };

  const deletePart = (supplierId, partId) => {
    setSuppliers(p => p.map(s => s.id === supplierId ? { ...s, parts: (s.parts || []).filter(pt => pt.id !== partId) } : s));
    setBom(p => p.filter(b => !(b.supplierId === supplierId && b.partId === partId)));
  };

  const addOrder = (supplierId, order) => {
    setSuppliers(p => p.map(s => s.id === supplierId ? { ...s, orders: [...(s.orders || []), order] } : s));
    setOrderModal(null);
  };

  const toggleArrived = (supplierId, orderId) => setSuppliers(p => p.map(s => s.id === supplierId ? { ...s, orders: (s.orders||[]).map(o => o.id === orderId ? { ...o, arrived: !o.arrived, arrivedDate: !o.arrived ? todayStr() : null } : o) } : s));

  const saveBomEntry = (entry) => {
    setBom(p => p.find(x => x.id === entry.id) ? p.map(x => x.id === entry.id ? entry : x) : [...p, entry]);
    setBomModal(null);
  };

  const saveMember = m => { setUsers(p => p.find(x => x.id === m.id) ? p.map(x => x.id === m.id ? m : x) : [...p, m]); if (currentUser?.id === m.id) setCurrentUser(m); setMemberModal(null); };
  const removeMember = id => { setUsers(p => p.filter(u => u.id !== id)); setConfirmRemove(null); };

  const ft = tasks.filter(t => {
    if (currentUser?.role === ROLES.WORKER && t.assigneeId !== currentUser.id) return false;
    if (pf !== "all" && t.projectId !== pf) return false;
    return true;
  });

  // Flattened BOM with resolved part + supplier info
  const bomRows = bom.map(entry => {
    const supplier = suppliers.find(s => s.id === entry.supplierId);
    const part = (supplier?.parts || []).find(p => p.id === entry.partId);
    return { ...entry, supplier, part };
  }).filter(r => r.supplier && r.part);

  const filteredBom = bomFilter === "all" ? bomRows : bomRows.filter(r => r.status === bomFilter);

  const tabs = [
    { id: "gantt",     icon: "📅", label: "Timeline" },
    { id: "tasks",     icon: "✅", label: "Tasks" },
    { id: "projects",  icon: "🗂️", label: "Projects" },
    { id: "suppliers", icon: "📦", label: "Suppliers" },
    { id: "bom",       icon: "🔩", label: "BOM" },
    { id: "team",      icon: "👥", label: "Team" },
  ];

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (!currentUser) return (
    <div style={{ minHeight: "100vh", background: "#0a0a18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", padding: "1rem" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "370px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "44px", height: "44px", background: "linear-gradient(135deg,#00d4ff,#ff6b35)", borderRadius: "10px", margin: "0 auto 0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>◈</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: "#e0e0e0" }}>Lattice</h1>
          <p style={{ color: "#555", fontSize: "0.8rem", marginTop: "4px" }}>Project Management</p>
        </div>
        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
          <input style={inp} type="email" placeholder="Email" value={lf.email} onChange={e => setLf(p => ({ ...p, email: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} />
          <input style={inp} type="password" placeholder="Password" value={lf.password} onChange={e => setLf(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} />
        </div>
        {le && <div style={{ color: "#fc8181", fontSize: "0.8rem", marginBottom: "0.75rem", textAlign: "center" }}>{le}</div>}
        <button onClick={login} style={{ width: "100%", padding: "0.75rem", background: "linear-gradient(135deg,#00d4ff,#0088aa)", border: "none", borderRadius: "8px", color: "#0a0a18", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Sign In</button>
        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #1a1a2e", paddingTop: "1.25rem" }}>
          <p style={{ color: "#444", fontSize: "0.7rem", textAlign: "center", marginBottom: "0.75rem" }}>DEMO ACCOUNTS</p>
          {users.slice(0, 5).map(u => (
            <button key={u.id} onClick={() => setLf({ email: u.email, password: u.password })} style={{ width: "100%", marginBottom: "5px", padding: "0.5rem 0.75rem", background: "#15152a", border: "1px solid #252540", borderRadius: "6px", color: "#888", fontSize: "0.78rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{u.name}</span>
              <span style={{ color: roleColor[u.role], textTransform: "capitalize", fontSize: "0.7rem" }}>{u.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── MUST SET PASSWORD SCREEN ───────────────────────────────────────────────
  if (currentUser && mustSetPassword) return (
    <MustSetPasswordScreen
      user={currentUser}
      onSave={completePasswordReset}
      onSkip={() => setMustSetPassword(false)}
    />
  );

  // ── APP SHELL ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a18", color: "#e0e0e0", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", display: "flex" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:#0a0a18} ::-webkit-scrollbar-thumb{background:#252540;border-radius:3px} button{cursor:pointer}`}</style>

      {/* SIDEBAR */}
      <div style={{ width: "180px", flexShrink: 0, background: "#0d0d20", borderRight: "1px solid #1a1a30", display: "flex", flexDirection: "column", padding: "1rem 0.75rem", minHeight: "100vh", position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", paddingLeft: "0.25rem" }}>
          <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg,#00d4ff,#ff6b35)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>◈</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0" }}>Lattice</span>
        </div>
        <nav style={{ flex: 1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.75rem", marginBottom: "2px", background: tab === t.id ? "#1a1a35" : "transparent", border: tab === t.id ? "1px solid #252550" : "1px solid transparent", borderRadius: "8px", color: tab === t.id ? "#00d4ff" : "#666", fontSize: "0.85rem", textAlign: "left" }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ borderTop: "1px solid #1a1a30", paddingTop: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Avatar name={currentUser.name} role={currentUser.role} size={28} />
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.75rem", color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
              <div style={{ fontSize: "0.65rem", color: roleColor[currentUser.role], textTransform: "capitalize" }}>{currentUser.role}</div>
            </div>
          </div>
          <button onClick={() => setCurrentUser(null)} style={{ width: "100%", padding: "0.4rem", background: "transparent", border: "1px solid #252540", borderRadius: "6px", color: "#555", fontSize: "0.75rem" }}>Sign Out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ padding: "0.75rem 1.25rem", background: "#0d0d20", borderBottom: "1px solid #1a1a30", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", color: "#e0e0e0" }}>{tabs.find(t => t.id === tab)?.icon} {tabs.find(t => t.id === tab)?.label}</h2>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotifs(!showNotifs)} style={{ position: "relative", width: "36px", height: "36px", background: "#15152a", border: "1px solid #252540", borderRadius: "8px", color: "#888", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              🔔{notifs.length > 0 && <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#fc8181", borderRadius: "50%", width: "16px", height: "16px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{notifs.length}</span>}
            </button>
            {showNotifs && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#0f0f1e", border: "1px solid #252540", borderRadius: "10px", width: "280px", zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                <div style={{ padding: "0.6rem 0.9rem", borderBottom: "1px solid #1a1a2e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Notifications</span>
                  {notifs.length > 0 && <button onClick={() => setDismissed(p => [...p, ...notifs.map(n => n.id)])} style={{ fontSize: "0.7rem", color: "#555", background: "none", border: "none" }}>Dismiss all</button>}
                </div>
                {notifs.length === 0 ? <div style={{ padding: "1.5rem", textAlign: "center", color: "#555", fontSize: "0.8rem" }}>All clear ✓</div>
                  : notifs.map(n => (
                    <div key={n.id} style={{ padding: "0.6rem 0.9rem", borderBottom: "1px solid #1a1a2e", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                      <span>{n.type === "overdue" ? "🔴" : "🟡"}</span>
                      <span style={{ flex: 1, fontSize: "0.78rem", color: "#ccc" }}>{n.text}</span>
                      <button onClick={() => setDismissed(p => [...p, n.id])} style={{ color: "#444", background: "none", border: "none", fontSize: "0.8rem" }}>✕</button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "1.25rem", flex: 1 }}>

          {/* ── GANTT */}
          {tab === "gantt" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <p style={{ color: "#555", fontSize: "0.8rem" }}>{currentUser.role === ROLES.WORKER ? "Your assigned tasks" : "All projects timeline"}</p>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <select value={pf} onChange={e => setPf(e.target.value)} style={{ ...inp, width: "auto", fontSize: "0.8rem" }}>
                    <option value="all">All Projects</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {canManage && <Btn color="#00d4ff" onClick={() => setTaskModal({})}>+ Task</Btn>}
                </div>
              </div>
              <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", padding: "1.25rem" }}>
                <Gantt tasks={ft} users={users} projects={projects} currentUser={currentUser} />
              </div>
            </div>
          )}

          {/* ── TASKS */}
          {tab === "tasks" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <p style={{ color: "#555", fontSize: "0.8rem" }}>{currentUser.role === ROLES.WORKER ? "Your assigned work" : "All tasks"}</p>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <select value={pf} onChange={e => setPf(e.target.value)} style={{ ...inp, width: "auto", fontSize: "0.8rem" }}>
                    <option value="all">All Projects</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {canManage && <Btn color="#00d4ff" onClick={() => setTaskModal({})}>+ Task</Btn>}
                </div>
              </div>
              <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr 0.8fr auto", background: "#0d0d20" }}>
                  {["Task","Assignee","Due","Status","Priority",""].map((h,i) => <TH key={i}>{h}</TH>)}
                </div>
                {ft.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No tasks found.</div>}
                {ft.map(task => {
                  const proj = projects.find(p => p.id === task.projectId);
                  const assignee = users.find(u => u.id === task.assigneeId);
                  const overdue = task.endDate < todayStr() && task.status !== "done";
                  return (
                    <div key={task.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr 0.8fr auto", alignItems: "center", padding: "0 0.5rem" }}>
                      <TD><div style={{ color: "#e0e0e0", marginBottom: "2px", fontSize: "0.83rem" }}>{task.title}</div><span style={{ fontSize: "0.62rem", color: proj?.color, background: `${proj?.color}15`, padding: "1px 5px", borderRadius: "3px" }}>{proj?.name}</span></TD>
                      <TD>{assignee?.name}</TD>
                      <TD style={{ color: overdue ? "#fc8181" : "#777", fontSize: "0.76rem" }}>{fmt(task.endDate)}</TD>
                      <TD><select value={task.status} onChange={e => saveTask({ ...task, status: e.target.value })} style={{ padding: "2px 5px", background: `${statusColor[task.status]}18`, border: `1px solid ${statusColor[task.status]}55`, borderRadius: "4px", color: statusColor[task.status], fontSize: "0.7rem", cursor: "pointer" }}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option><option value="blocked">Blocked</option></select></TD>
                      <TD><span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: "4px", background: `${prioColor[task.priority]}18`, color: prioColor[task.priority], border: `1px solid ${prioColor[task.priority]}40` }}>{task.priority}</span></TD>
                      <TD style={{ display: "flex", gap: "4px" }}><button onClick={() => setTaskModal(task)} style={{ padding: "3px 7px", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", color: "#888", fontSize: "0.7rem" }}>Edit</button>{canManage && <button onClick={() => delTask(task.id)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "4px", color: "#fc8181", fontSize: "0.7rem" }}>✕</button>}</TD>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PROJECTS */}
          {tab === "projects" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <p style={{ color: "#555", fontSize: "0.8rem" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
                {canManage && <Btn color="#00d4ff" onClick={() => setProjectModal({})}>+ New Project</Btn>}
              </div>
              {projects.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No projects yet — click + New Project to get started.</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {projects.map(proj => {
                  const projTasks = tasks.filter(t => t.projectId === proj.id);
                  const done = projTasks.filter(t => t.status === "done").length;
                  const overdue = projTasks.filter(t => t.endDate < todayStr() && t.status !== "done").length;
                  const inProgress = projTasks.filter(t => t.status === "in-progress").length;
                  const pct = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
                  return (
                    <div key={proj.id} style={{ background: "#0f0f1e", border: `1px solid #1e1e35`, borderRadius: "10px", overflow: "hidden" }}>
                      {/* Colour bar */}
                      <div style={{ height: "4px", background: proj.color }} />
                      <div style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <div style={{ color: "#e0e0e0", fontWeight: 600, fontSize: "0.95rem" }}>{proj.name}</div>
                            {proj.description && <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "3px" }}>{proj.description}</div>}
                          </div>
                          {canManage && (
                            <div style={{ display: "flex", gap: "4px", flexShrink: 0, marginLeft: "0.5rem" }}>
                              <button onClick={() => setProjectModal(proj)} style={{ padding: "3px 7px", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", color: "#888", fontSize: "0.7rem" }}>Edit</button>
                              <button onClick={() => setConfirmDeleteProject(proj)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "4px", color: "#fc8181", fontSize: "0.7rem" }}>✕</button>
                            </div>
                          )}
                        </div>
                        {/* Progress bar */}
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#555", marginBottom: "4px" }}>
                            <span>{pct}% complete</span>
                            <span>{done}/{projTasks.length} tasks</span>
                          </div>
                          <div style={{ height: "5px", background: "#1a1a2e", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: proj.color, borderRadius: "3px", transition: "width 0.3s" }} />
                          </div>
                        </div>
                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.4rem" }}>
                          {[["Total", projTasks.length, "#888"], ["Active", inProgress, "#00d4ff"], ["Done", done, "#48bb78"], ["Late", overdue, "#fc8181"]].map(([l, v, c]) => (
                            <div key={l} style={{ background: "#15152a", borderRadius: "5px", padding: "0.35rem 0.25rem", textAlign: "center" }}>
                              <div style={{ fontSize: "0.95rem", color: c, fontWeight: 700 }}>{v}</div>
                              <div style={{ fontSize: "0.58rem", color: "#444" }}>{l}</div>
                            </div>
                          ))}
                        </div>
                        {/* Quick link */}
                        <button onClick={() => { setPf(proj.id); setTab("tasks"); }} style={{ width: "100%", marginTop: "0.75rem", padding: "0.4rem", background: "transparent", border: `1px solid ${proj.color}40`, borderRadius: "6px", color: proj.color, fontSize: "0.75rem", cursor: "pointer" }}>View Tasks →</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SUPPLIERS */}
          {tab === "suppliers" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <p style={{ color: "#555", fontSize: "0.8rem" }}>Supplier catalogue, parts, and orders</p>
                {canManage && <Btn color="#ff6b35" onClick={() => setSupplierModal({})}>+ Add Supplier</Btn>}
              </div>
              {suppliers.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No suppliers yet.</div>}
              {suppliers.map(sup => (
                <div key={sup.id} style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden", marginBottom: "1rem" }}>
                  {/* Supplier header */}
                  <div style={{ padding: "0.85rem 1rem", background: "#0d0d20", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#e0e0e0" }}>{sup.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#555", marginTop: "2px" }}>{sup.contact} · {sup.phone}</div>
                    </div>
                    {canManage && (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button onClick={() => setPartModal({ supplierId: sup.id, part: {} })} style={{ padding: "0.35rem 0.75rem", background: "#00d4ff18", border: "1px solid #00d4ff50", borderRadius: "6px", color: "#00d4ff", fontSize: "0.78rem" }}>+ Part</button>
                        <button onClick={() => setOrderModal(sup.id)} style={{ padding: "0.35rem 0.75rem", background: "#48bb7818", border: "1px solid #48bb7850", borderRadius: "6px", color: "#48bb78", fontSize: "0.78rem" }}>+ Order</button>
                        <button onClick={() => setSupplierModal(sup)} style={{ padding: "0.35rem 0.75rem", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "6px", color: "#888", fontSize: "0.78rem" }}>Edit</button>
                      </div>
                    )}
                  </div>

                  {/* Parts catalogue */}
                  {(sup.parts || []).length > 0 && (
                    <div style={{ borderBottom: "1px solid #1a1a2e" }}>
                      <div style={{ padding: "0.4rem 1rem", background: "#0a0a16", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.65rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>🔩 Parts Catalogue</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 0.7fr 0.7fr auto", background: "#0a0a18" }}>
                        {["Part No.","Description","Unit Qty","Unit",""].map((h,i) => <TH key={i}>{h}</TH>)}
                      </div>
                      {sup.parts.map(pt => (
                        <div key={pt.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 0.7fr 0.7fr auto", alignItems: "center", padding: "0 0.5rem" }}>
                          <TD><span style={{ color: "#00d4ff", fontFamily: "monospace", fontSize: "0.78rem" }}>{pt.partNumber}</span></TD>
                          <TD>{pt.description}</TD>
                          <TD style={{ color: "#888" }}>{pt.unitQty}</TD>
                          <TD style={{ color: "#888" }}>{pt.unit}</TD>
                          <TD style={{ display: "flex", gap: "4px" }}>
                            {canManage && <>
                              <button onClick={() => setPartModal({ supplierId: sup.id, part: { ...pt, _existing: true } })} style={{ padding: "2px 7px", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", color: "#888", fontSize: "0.7rem" }}>Edit</button>
                              <button onClick={() => deletePart(sup.id, pt.id)} style={{ padding: "2px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "4px", color: "#fc8181", fontSize: "0.7rem" }}>✕</button>
                            </>}
                          </TD>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Orders */}
                  <div>
                    <div style={{ padding: "0.4rem 1rem", background: "#0a0a16" }}>
                      <span style={{ fontSize: "0.65rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>📋 Orders</span>
                    </div>
                    {(sup.orders || []).length === 0
                      ? <div style={{ padding: "1rem", textAlign: "center", color: "#444", fontSize: "0.8rem" }}>No orders yet.</div>
                      : <>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.7fr 1fr 1.3fr", background: "#0a0a18" }}>
                          {["Order","Ordered","Lead","Est. Arrival","Status"].map((h,i) => <TH key={i}>{h}</TH>)}
                        </div>
                        {(sup.orders || []).map(order => {
                          const due = addDays(order.orderedDate, order.leadTimeDays);
                          const late = !order.arrived && due < todayStr();
                          const soon2 = !order.arrived && due <= addDays(todayStr(), 3) && due >= todayStr();
                          return (
                            <div key={order.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.7fr 1fr 1.3fr", alignItems: "center", padding: "0 0.5rem" }}>
                              <TD>
                                <div style={{ color: "#ccc", fontSize: "0.82rem" }}>{order.description}</div>
                                {(order.partIds || []).length > 0 && <div style={{ fontSize: "0.66rem", color: "#555", marginTop: "2px" }}>{(order.partIds || []).map(pid => (sup.parts||[]).find(p => p.id === pid)?.partNumber).filter(Boolean).join(", ")}</div>}
                              </TD>
                              <TD style={{ fontSize: "0.74rem", color: "#666" }}>{fmt(order.orderedDate)}</TD>
                              <TD style={{ fontSize: "0.74rem", color: "#555" }}>{order.leadTimeDays}d</TD>
                              <TD style={{ fontSize: "0.74rem", color: late ? "#fc8181" : soon2 ? "#f6c90e" : "#666" }}>{fmt(due)}</TD>
                              <TD>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                  <input type="checkbox" checked={order.arrived} onChange={() => toggleArrived(sup.id, order.id)} style={{ accentColor: "#48bb78", width: "14px", height: "14px" }} />
                                  <span style={{ fontSize: "0.73rem", color: order.arrived ? "#48bb78" : late ? "#fc8181" : soon2 ? "#f6c90e" : "#555" }}>
                                    {order.arrived ? `Arrived ${fmt(order.arrivedDate)}` : late ? "Overdue" : soon2 ? "Due soon" : "Pending"}
                                  </span>
                                </label>
                              </TD>
                            </div>
                          );
                        })}
                      </>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BOM TAB */}
          {tab === "bom" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <p style={{ color: "#555", fontSize: "0.8rem" }}>{bomRows.length} parts across {[...new Set(bomRows.map(r => r.supplierId))].length} suppliers</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  {/* Status filter pills */}
                  {[["all","#888","All"],["used","#48bb78","Used"],["not-used","#fc8181","Not Used"],["under-review","#f6c90e","Under Review"],["pending","#888","Pending"]].map(([k,c,l]) => (
                    <button key={k} onClick={() => setBomFilter(k)} style={{ padding: "0.3rem 0.75rem", borderRadius: "20px", border: `1px solid ${bomFilter === k ? c : "#252540"}`, background: bomFilter === k ? `${c}22` : "transparent", color: bomFilter === k ? c : "#555", fontSize: "0.75rem", cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Summary stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
                {Object.entries(bomStatusMeta).map(([k, v]) => {
                  const count = bomRows.filter(r => r.status === k).length;
                  return (
                    <div key={k} onClick={() => setBomFilter(k)} style={{ background: "#0f0f1e", border: `1px solid ${bomFilter === k ? v.color : "#1e1e35"}`, borderRadius: "8px", padding: "0.75rem", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: "1.3rem" }}>{v.icon}</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: v.color, lineHeight: 1.1 }}>{count}</div>
                      <div style={{ fontSize: "0.65rem", color: "#555", marginTop: "2px" }}>{v.label}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.8fr 0.8fr 0.7fr 0.7fr 1fr 2fr auto", background: "#0d0d20" }}>
                  {["Part No.","Description","Supplier","Qty Ord.","Total","Status","Notes / CI",""].map((h,i) => <TH key={i}>{h}</TH>)}
                </div>

                {filteredBom.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No BOM entries match this filter.</div>}

                {filteredBom.map(row => {
                  const meta = bomStatusMeta[row.status];
                  const totalUnits = (row.qtyOrdered || 0) * (row.part?.unitQty || 1);
                  return (
                    <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.8fr 0.8fr 0.7fr 0.7fr 1fr 2fr auto", alignItems: "center", padding: "0 0.5rem", borderTop: "1px solid #141428" }}>
                      <TD><span style={{ color: "#00d4ff", fontFamily: "monospace", fontSize: "0.76rem" }}>{row.part?.partNumber}</span></TD>
                      <TD style={{ fontSize: "0.8rem" }}>
                        <div style={{ color: "#ccc" }}>{row.part?.description}</div>
                        {row.project && <div style={{ fontSize: "0.65rem", color: "#555", marginTop: "2px" }}>{row.project}</div>}
                      </TD>
                      <TD style={{ fontSize: "0.75rem", color: "#888" }}>{row.supplier?.name}</TD>
                      <TD style={{ color: "#888", fontSize: "0.8rem", textAlign: "center" }}>{row.qtyOrdered}</TD>
                      <TD style={{ color: "#666", fontSize: "0.75rem" }}>{totalUnits} {row.part?.unit}</TD>
                      <TD>
                        <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "12px", background: meta.bg, color: meta.color, border: `1px solid ${meta.color}55`, whiteSpace: "nowrap" }}>
                          {meta.icon} {meta.label}
                        </span>
                      </TD>
                      <TD style={{ fontSize: "0.75rem", color: row.notes ? "#aaa" : "#333", fontStyle: row.notes ? "normal" : "italic" }}>
                        {row.notes || "—"}
                      </TD>
                      <TD>
                        {canManage && (
                          <button onClick={() => setBomModal({ entry: row, partId: row.partId, supplierId: row.supplierId })} style={{ padding: "3px 7px", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", color: "#888", fontSize: "0.7rem", whiteSpace: "nowrap" }}>Edit</button>
                        )}
                      </TD>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "#444" }}>
                💡 Parts are added to the BOM automatically when you add them to a supplier's catalogue. Edit each entry to set quantities, usage status, and engineering notes.
              </div>
            </div>
          )}

          {/* ── TEAM */}
          {tab === "team" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <p style={{ color: "#555", fontSize: "0.8rem" }}>{users.length} member{users.length !== 1 ? "s" : ""}</p>
                {isAdmin && <Btn color="#00d4ff" onClick={() => setMemberModal({})}>+ Add Member</Btn>}
              </div>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {users.map(u => {
                  const ut = tasks.filter(t => t.assigneeId === u.id);
                  const done = ut.filter(t => t.status === "done").length;
                  const over = ut.filter(t => t.endDate < todayStr() && t.status !== "done").length;
                  const isSelf = u.id === currentUser.id;
                  return (
                    <div key={u.id} style={{ background: "#0f0f1e", border: `1px solid ${isSelf ? "#252550" : "#1e1e35"}`, borderRadius: "10px", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <Avatar name={u.name} role={u.role} size={42} />
                      <div style={{ flex: 1, minWidth: "130px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ color: "#e0e0e0", fontWeight: 600 }}>{u.name}</span>
                          {isSelf && <span style={{ fontSize: "0.62rem", color: "#555", background: "#252540", padding: "1px 6px", borderRadius: "4px" }}>you</span>}
                            {u.mustChangePassword && <span style={{ fontSize: "0.62rem", color: "#f6c90e", background: "#f6c90e18", border: "1px solid #f6c90e40", padding: "1px 6px", borderRadius: "4px" }} title="Must set password on next login">⚠ pw reset</span>}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: roleColor[u.role], textTransform: "capitalize" }}>{u.role}</div>
                        <div style={{ fontSize: "0.7rem", color: "#444" }}>{u.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {[["Tasks",ut.length,"#888"],["Done",done,"#48bb78"],["Late",over,"#fc8181"]].map(([l,v,c]) => (
                          <div key={l} style={{ background: "#15152a", borderRadius: "6px", padding: "0.35rem 0.6rem", textAlign: "center", minWidth: "44px" }}>
                            <div style={{ fontSize: "1rem", color: c, fontWeight: 700 }}>{v}</div>
                            <div style={{ fontSize: "0.58rem", color: "#444" }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      {isAdmin && (
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          <button onClick={() => setMemberModal(u)} style={{ padding: "0.35rem 0.75rem", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "6px", color: "#888", fontSize: "0.78rem" }}>Edit</button>
                          {!isSelf && (
                            <button
                              onClick={() => { setUsers(p => p.map(x => x.id === u.id ? { ...x, mustChangePassword: true } : x)); }}
                              title="Forces this user to set a new password on next login"
                              style={{ padding: "0.35rem 0.75rem", background: "#f6c90e18", border: "1px solid #f6c90e50", borderRadius: "6px", color: "#f6c90e", fontSize: "0.78rem" }}
                            >
                              Reset PW
                            </button>
                          )}
                          {!isSelf && <button onClick={() => setConfirmRemove({ userId: u.id, name: u.name })} style={{ padding: "0.35rem 0.6rem", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "6px", color: "#fc8181", fontSize: "0.78rem" }}>Remove</button>}
                        </div>
                      )}
                      {!isAdmin && isSelf && <button onClick={() => setMemberModal(u)} style={{ padding: "0.35rem 0.75rem", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "6px", color: "#888", fontSize: "0.78rem" }}>Edit Profile</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS */}
      {projectModal && <ProjectModal project={projectModal} onSave={saveProject} onClose={() => setProjectModal(null)} />}
      {confirmDeleteProject && <ConfirmModal message={`Delete "${confirmDeleteProject.name}"? All tasks in this project will also be deleted.`} onConfirm={() => deleteProject(confirmDeleteProject.id)} onClose={() => setConfirmDeleteProject(null)} />}
      {taskModal && <TaskModal task={taskModal} projects={projects} users={users} onSave={saveTask} onClose={() => setTaskModal(null)} canEdit={canManage} />}
      {supplierModal && <SupplierModal supplier={supplierModal} onSave={saveSupplier} onClose={() => setSupplierModal(null)} />}
      {orderModal && <OrderModal supplier={suppliers.find(s => s.id === orderModal) || {}} onSave={item => addOrder(orderModal, item)} onClose={() => setOrderModal(null)} />}
      {partModal && <PartModal part={partModal.part} onSave={pt => savePart(partModal.supplierId, pt)} onClose={() => setPartModal(null)} />}
      {bomModal && <BomModal entry={bomModal.entry} part={suppliers.find(s => s.id === bomModal.supplierId)?.parts?.find(p => p.id === bomModal.partId)} supplier={suppliers.find(s => s.id === bomModal.supplierId)} onSave={saveBomEntry} onClose={() => setBomModal(null)} />}
      {memberModal && <MemberModal member={memberModal} onSave={saveMember} onClose={() => setMemberModal(null)} currentUserId={currentUser.id} />}
      {confirmRemove && <ConfirmModal message={`Remove ${confirmRemove.name} from the team?`} onConfirm={() => removeMember(confirmRemove.userId)} onClose={() => setConfirmRemove(null)} />}
    </div>
  );
}
