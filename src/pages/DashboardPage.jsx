import { useApp } from "../context/AppContext";
import { statusColor } from "../constants/seeds";
import { todayStr, addDays, fmt, daysBetween, timeAgo, isRecent } from "../utils/dateHelpers";
import { Avatar, UpdatedBadge } from "../components/ui";

const StatCard = ({ icon, value, label, color, onClick, urgent }) => (
  <div onClick={onClick} style={{ background: "#0f0f1e", border: `1px solid ${urgent && value > 0 ? color + "55" : "#1e1e35"}`, borderRadius: "10px", padding: "1rem 1.25rem", cursor: onClick ? "pointer" : "default", display: "flex", alignItems: "center", gap: "1rem" }}>
    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color: urgent && value > 0 ? color : "#e0e0e0", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "#555", marginTop: "3px" }}>{label}</div>
    </div>
  </div>
);

const SectionHeader = ({ title, action, onAction }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
    <h3 style={{ fontSize: "0.85rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{title}</h3>
    {action && <button onClick={onAction} style={{ fontSize: "0.72rem", color: "#00d4ff", background: "none", border: "none", cursor: "pointer" }}>{action}</button>}
  </div>
);

const TaskRow = ({ task }) => {
  const { projects, users, currentUser, updateTaskStatus } = useApp();
  const now      = todayStr();
  const proj     = projects.find((p) => p.id === task.projectId);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const overdue  = task.endDate < now;
  const recent   = isRecent(task.updatedAt);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "#0f0f1e", borderRadius: "8px", marginBottom: "4px", border: `1px solid ${recent ? "#00d4ff20" : "#1a1a2e"}` }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: overdue ? "#fc8181" : "#f6c90e", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.82rem", color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
        <div style={{ fontSize: "0.68rem", color: "#555", marginTop: "1px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {proj && <span style={{ color: proj.color }}>{proj.name}</span>}
          {assignee && currentUser.role !== "worker" && <span>· {assignee.name}</span>}
          {task.updatedAt && <UpdatedBadge iso={task.updatedAt} compact />}
        </div>
      </div>
      <div style={{ fontSize: "0.72rem", color: overdue ? "#fc8181" : "#f6c90e", whiteSpace: "nowrap", flexShrink: 0 }}>
        {overdue ? `${daysBetween(task.endDate, todayStr())}d overdue` : `Due ${fmt(task.endDate)}`}
      </div>
      <select
        value={task.status}
        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
        style={{ padding: "2px 4px", background: `${statusColor[task.status]}18`, border: `1px solid ${statusColor[task.status]}55`, borderRadius: "4px", color: statusColor[task.status], fontSize: "0.68rem", cursor: "pointer", flexShrink: 0 }}
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
        <option value="blocked">Blocked</option>
      </select>
    </div>
  );
};

// Recent activity feed — collects all recently-updated entities
const RecentActivity = () => {
  const { tasks, projects, suppliers, bom, users, setTab, setPf } = useApp();

  const items = [];

  tasks.forEach((t) => {
    if (!t.updatedAt || !isRecent(t.updatedAt, 48)) return;
    const proj = projects.find((p) => p.id === t.projectId);
    items.push({ iso: t.updatedAt, by: t.updatedBy, icon: "✅", label: t.title, sub: proj?.name || "", color: proj?.color || "#00d4ff", action: () => setTab("tasks") });
  });

  projects.forEach((p) => {
    if (!p.updatedAt || !isRecent(p.updatedAt, 48)) return;
    items.push({ iso: p.updatedAt, by: p.updatedBy, icon: "🗂️", label: p.name, sub: "Project", color: p.color, action: () => setTab("projects") });
  });

  suppliers.forEach((s) => {
    if (s.updatedAt && isRecent(s.updatedAt, 48))
      items.push({ iso: s.updatedAt, by: s.updatedBy, icon: "📦", label: s.name, sub: "Supplier", color: "#ff6b35", action: () => setTab("suppliers") });
    (s.orders || []).forEach((o) => {
      if (!o.updatedAt || !isRecent(o.updatedAt, 48)) return;
      items.push({ iso: o.updatedAt, by: o.updatedBy, icon: "📋", label: o.description, sub: s.name, color: "#f6c90e", action: () => setTab("suppliers") });
    });
  });

  bom.forEach((entry) => {
    if (!entry.updatedAt || !isRecent(entry.updatedAt, 48)) return;
    const sup = suppliers.find((s) => s.id === entry.supplierId);
    const pt  = (sup?.parts || []).find((p) => p.id === entry.partId);
    if (!pt) return;
    items.push({ iso: entry.updatedAt, by: entry.updatedBy, icon: "🔩", label: pt.partNumber, sub: pt.description, color: "#a78bfa", action: () => setTab("bom") });
  });

  if (items.length === 0) return null;

  // Sort newest first
  items.sort((a, b) => new Date(b.iso) - new Date(a.iso));

  return (
    <div>
      <SectionHeader title="🕐 Recent Activity (48h)" />
      <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden" }}>
        {items.slice(0, 8).map((item, i) => (
          <div
            key={`${item.iso}-${i}`}
            onClick={item.action}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 1rem", borderTop: i > 0 ? "1px solid #141428" : "none", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#15152a"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: `${item.color}18`, border: `1px solid ${item.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.8rem", color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
              <div style={{ fontSize: "0.65rem", color: "#555" }}>{item.sub}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "0.68rem", color: "#00d4ff" }}>{timeAgo(item.iso)}</div>
              {item.by && <div style={{ fontSize: "0.62rem", color: "#444" }}>{item.by}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardPage = () => {
  const { tasks, projects, suppliers, users, currentUser, canManage, setTab } = useApp();
  const now  = todayStr();
  const in7  = addDays(now, 7);

  const myTasks        = currentUser.role === "worker" ? tasks.filter((t) => t.assigneeId === currentUser.id) : tasks;
  const overdueTasks   = myTasks.filter((t) => t.endDate < now && t.status !== "done");
  const dueSoonTasks   = myTasks.filter((t) => t.endDate >= now && t.endDate <= in7 && t.status !== "done");
  const inProgressTasks= myTasks.filter((t) => t.status === "in-progress");

  const overdueOrders  = suppliers.flatMap((s) =>
    (s.orders || []).filter((o) => !o.arrived && addDays(o.orderedDate, o.leadTimeDays) < now)
      .map((o) => ({ ...o, supplierName: s.name, isLate: true }))
  );
  const dueSoonOrders  = suppliers.flatMap((s) =>
    (s.orders || []).filter((o) => { const due = addDays(o.orderedDate, o.leadTimeDays); return !o.arrived && due >= now && due <= in7; })
      .map((o) => ({ ...o, supplierName: s.name, dueDate: addDays(o.orderedDate, o.leadTimeDays) }))
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: "#e0e0e0" }}>
          {greeting()}, {currentUser.name.split(" ")[0]} 👋
        </h2>
        <p style={{ color: "#555", fontSize: "0.82rem", marginTop: "4px" }}>
          {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <StatCard icon="🔴" value={overdueTasks.length}  label="Overdue tasks"    color="#fc8181" urgent onClick={() => setTab("tasks")} />
        <StatCard icon="🟡" value={dueSoonTasks.length}  label="Due this week"    color="#f6c90e" urgent onClick={() => setTab("tasks")} />
        <StatCard icon="⚡" value={inProgressTasks.length} label="In progress"    color="#00d4ff" onClick={() => setTab("tasks")} />
        <StatCard icon="📦" value={overdueOrders.length + dueSoonOrders.length} label="Delivery alerts" color="#ff6b35" urgent onClick={() => setTab("suppliers")} />
        {canManage && <StatCard icon="🗂️" value={projects.length} label="Active projects" color="#48bb78" onClick={() => setTab("projects")} />}
        {canManage && <StatCard icon="👥" value={users.length}    label="Team members"    color="#a78bfa" onClick={() => setTab("team")} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Left column */}
        <div style={{ display: "grid", gap: "1.25rem", alignContent: "start" }}>
          {overdueTasks.length > 0 && (
            <div>
              <SectionHeader title="⚠ Overdue" action="View all →" onAction={() => setTab("tasks")} />
              {overdueTasks.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} />)}
              {overdueTasks.length > 5 && <div style={{ fontSize: "0.72rem", color: "#555", textAlign: "center", padding: "0.4rem" }}>+{overdueTasks.length - 5} more</div>}
            </div>
          )}
          {dueSoonTasks.length > 0 && (
            <div>
              <SectionHeader title="📅 Due This Week" action="View all →" onAction={() => setTab("tasks")} />
              {dueSoonTasks.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} />)}
              {dueSoonTasks.length > 5 && <div style={{ fontSize: "0.72rem", color: "#555", textAlign: "center", padding: "0.4rem" }}>+{dueSoonTasks.length - 5} more</div>}
            </div>
          )}
          {overdueTasks.length === 0 && dueSoonTasks.length === 0 && (
            <div style={{ background: "#0f0f1e", border: "1px solid #48bb7840", borderRadius: "10px", padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
              <div style={{ color: "#48bb78", fontWeight: 600, fontSize: "0.9rem" }}>No overdue or urgent tasks</div>
              <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "4px" }}>You're on top of everything</div>
            </div>
          )}
          {(overdueOrders.length > 0 || dueSoonOrders.length > 0) && (
            <div>
              <SectionHeader title="📦 Delivery Alerts" action="View suppliers →" onAction={() => setTab("suppliers")} />
              {[...overdueOrders, ...dueSoonOrders].slice(0, 5).map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "#0f0f1e", borderRadius: "8px", marginBottom: "4px", border: "1px solid #1a1a2e" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: o.isLate ? "#fc8181" : "#f6c90e", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.description}</div>
                    <div style={{ fontSize: "0.68rem", color: "#555" }}>{o.supplierName}</div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: o.isLate ? "#fc8181" : "#f6c90e", whiteSpace: "nowrap" }}>
                    {o.isLate ? "Overdue" : `Due ${fmt(o.dueDate)}`}
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUser.role === "worker" && inProgressTasks.length > 0 && (
            <div>
              <SectionHeader title="⚡ In Progress" action="View all →" onAction={() => setTab("tasks")} />
              {inProgressTasks.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "grid", gap: "1.25rem", alignContent: "start" }}>
          {/* Recent Activity — appears at top of right column */}
          <RecentActivity />

          {canManage && projects.length > 0 && (
            <div>
              <SectionHeader title="🗂️ Project Progress" action="View all →" onAction={() => setTab("projects")} />
              <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden" }}>
                {projects.map((proj, i) => {
                  const pt   = tasks.filter((t) => t.projectId === proj.id);
                  const done = pt.filter((t) => t.status === "done").length;
                  const late = pt.filter((t) => t.endDate < now && t.status !== "done").length;
                  const pct  = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
                  return (
                    <div key={proj.id} style={{ padding: "0.75rem 1rem", borderTop: i > 0 ? "1px solid #141428" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: proj.color }} />
                          <span style={{ fontSize: "0.82rem", color: "#e0e0e0" }}>{proj.name}</span>
                          {late > 0 && <span style={{ fontSize: "0.62rem", color: "#fc8181", background: "#fc818118", padding: "1px 5px", borderRadius: "3px" }}>{late} late</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {proj.updatedAt && <UpdatedBadge iso={proj.updatedAt} compact />}
                          <span style={{ fontSize: "0.72rem", color: "#555" }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: "5px", background: "#1a1a2e", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: proj.color, borderRadius: "3px" }} />
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#444", marginTop: "4px" }}>{done}/{pt.length} tasks complete</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {canManage && (
            <div>
              <SectionHeader title="👥 Team Workload" action="View team →" onAction={() => setTab("team")} />
              <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden" }}>
                {users.map((u, i) => {
                  const ut   = tasks.filter((t) => t.assigneeId === u.id && t.status !== "done");
                  const late = ut.filter((t) => t.endDate < now).length;
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 1rem", borderTop: i > 0 ? "1px solid #141428" : "none" }}>
                      <Avatar name={u.name} role={u.role} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "#444" }}>{ut.length} open task{ut.length !== 1 ? "s" : ""}</div>
                      </div>
                      {late > 0 && <span style={{ fontSize: "0.68rem", color: "#fc8181", background: "#fc818118", padding: "1px 6px", borderRadius: "3px" }}>{late} late</span>}
                      {ut.length === 0 && <span style={{ fontSize: "0.68rem", color: "#48bb78" }}>✓ Clear</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
