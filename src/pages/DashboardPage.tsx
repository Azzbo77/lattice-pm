import { useApp } from "../context/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { statusColor } from "../constants/seeds";
import { todayStr, addDays, fmt, daysBetween, timeAgo, isRecent } from "../utils/dateHelpers";
import { Avatar, UpdatedBadge, miniSel } from "../components/ui";
import { bg, clr, font, radius, space } from "../constants/theme";

const StatCard = ({ icon, value, label, color, onClick, urgent = false }: { icon: string; value: number; label: string; color: string; onClick?: () => void; urgent?: boolean }) => (
  <div onClick={onClick} style={{ background: bg.card, border: `1px solid ${urgent && value > 0 ? color + "55" : bg.border}`, borderRadius: radius.xl, padding: "1rem 1.25rem", cursor: onClick ? "pointer" : "default", display: "flex", alignItems: "center", gap: space["6"] }}>
    <div style={{ width: "40px", height: "40px", borderRadius: radius.xl, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color: urgent && value > 0 ? color : clr.textPrimary, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: font.base, color: clr.textFaint, marginTop: radius.xs }}>{label}</div>
    </div>
  </div>
);

const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["5"] }}>
    <h3 style={{ fontSize: "0.85rem", color: clr.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{title}</h3>
    {action && <button onClick={onAction} style={{ fontSize: font.base, color: clr.cyan, background: "none", border: "none", cursor: "pointer" }}>{action}</button>}
  </div>
);

const TaskRow = ({ task }: { task: any }) => {
  const { tasks, projects, users, currentUser, updateTaskStatus } = useApp();
  const now      = todayStr();
  const proj     = projects.find((p) => p.id === task.projectId);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const overdue  = task.endDate < now;
  const recent   = isRecent(task.updatedAt);
  const blockedDeps = (task.dependsOn || [])
    .map((id: string) => tasks.find((t: any) => t.id === id))
    .filter((d: any): d is any => !!d && d.status !== "done");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: space["5"], padding: "0.6rem 0.75rem", background: bg.card, borderRadius: radius.lg, marginBottom: radius.sm, border: `1px solid ${recent ? "#00d4ff20" : bg.overlay}` }}>
      <div style={{ width: radius.lg, height: radius.lg, borderRadius: "50%", background: overdue ? clr.red : clr.yellow, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: radius.sm }}>
          <span style={{ fontSize: font.lg, color: clr.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
          {blockedDeps.length > 0 && (
            <span title={`Blocked by: ${blockedDeps.map((d: any) => d.title).join(", ")}`} style={{ fontSize: "0.58rem", color: clr.red, background: "#fc818118", border: "1px solid #fc818140", borderRadius: radius.xs, padding: "1px 4px", cursor: "help", flexShrink: 0 }}>⛔</span>
          )}
        </div>
        <div style={{ fontSize: "0.68rem", color: clr.textFaint, marginTop: "1px", display: "flex", alignItems: "center", gap: space["3"] }}>
          {proj && <span style={{ color: proj.color }}>{proj.name}</span>}
          {assignee && currentUser?.role !== "worker" && <span>· {assignee.name}</span>}
          {task.updatedAt && <UpdatedBadge iso={task.updatedAt} compact />}
        </div>
      </div>
      <div style={{ fontSize: font.base, color: overdue ? clr.red : clr.yellow, whiteSpace: "nowrap", flexShrink: 0 }}>
        {overdue ? `${daysBetween(task.endDate, todayStr())}d overdue` : `Due ${fmt(task.endDate)}`}
      </div>
      <select
        value={task.status}
        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
        style={{ ...miniSel(statusColor[task.status]), flexShrink: 0 }}
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
  const { tasks, projects, suppliers, bom, setTab } = useApp();

  const items: any[] = [];

  tasks.forEach((t) => {
    if (!t.updatedAt || !isRecent(t.updatedAt, 48)) return;
    const proj = projects.find((p) => p.id === t.projectId);
    items.push({ iso: t.updatedAt, by: t.updatedBy, icon: "✅", label: t.title, sub: proj?.name || "", color: proj?.color || clr.cyan, action: () => setTab("tasks") });
  });

  projects.forEach((p) => {
    if (!p.updatedAt || !isRecent(p.updatedAt, 48)) return;
    items.push({ iso: p.updatedAt, by: p.updatedBy, icon: "🗂️", label: p.name, sub: "Project", color: p.color, action: () => setTab("projects") });
  });

  suppliers.forEach((s) => {
    if (s.updatedAt && isRecent(s.updatedAt, 48))
      items.push({ iso: s.updatedAt, by: s.updatedBy, icon: "📦", label: s.name, sub: "Supplier", color: clr.orange, action: () => setTab("suppliers") });
    (s.orders || []).forEach((o) => {
      if (!o.updatedAt || !isRecent(o.updatedAt, 48)) return;
      items.push({ iso: o.updatedAt, by: o.updatedBy, icon: "📋", label: o.description, sub: s.name, color: clr.yellow, action: () => setTab("suppliers") });
    });
  });

  bom.forEach((entry) => {
    if (!entry.updatedAt || !isRecent(entry.updatedAt, 48)) return;
    const sup = suppliers.find((s) => s.id === entry.supplierId);
    const pt  = (sup?.parts || []).find((p) => p.id === entry.partId);
    if (!pt) return;
    items.push({ iso: entry.updatedAt, by: entry.updatedBy, icon: "🔩", label: pt.partNumber, sub: pt.description, color: clr.purple, action: () => setTab("bom") });
  });

  if (items.length === 0) return null;

  // Sort newest first
  items.sort((a: any, b: any) => new Date(b.iso).getTime() - new Date(a.iso).getTime());

  return (
    <div>
      <SectionHeader title="🕐 Recent Activity (48h)" />
      <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, overflow: "hidden" }}>
        {items.slice(0, 8).map((item, i) => (
          <div
            key={`${item.iso}-${i}`}
            onClick={item.action}
            style={{ display: "flex", alignItems: "center", gap: space["5"], padding: "0.6rem 1rem", borderTop: i > 0 ? "1px solid #141428" : "none", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = bg.raised}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: "28px", height: "28px", borderRadius: radius.md, background: `${item.color}18`, border: `1px solid ${item.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: font.lg, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.8rem", color: clr.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
              <div style={{ fontSize: font.sm, color: clr.textFaint }}>{item.sub}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "0.68rem", color: clr.cyan }}>{timeAgo(item.iso)}</div>
              {item.by && <div style={{ fontSize: font.xs, color: clr.textGhost }}>{item.by}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardPage = () => {
  const { tasks, projects, suppliers, users, currentUser, canManage, setTab } = useApp();
  const { isMobile } = useBreakpoint();
  
  if (!currentUser) return null;
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
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: clr.textPrimary }}>
          {greeting()}, {currentUser.name.split(" ")[0]} 👋
        </h2>
        <p style={{ color: clr.textFaint, fontSize: font.lg, marginTop: radius.sm }}>
          {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: space["5"], marginBottom: "1.75rem" }}>
        <StatCard icon="🔴" value={overdueTasks.length}  label="Overdue tasks"    color={clr.red} urgent onClick={() => setTab("tasks")} />
        <StatCard icon="🟡" value={dueSoonTasks.length}  label="Due this week"    color={clr.yellow} urgent onClick={() => setTab("tasks")} />
        <StatCard icon="⚡" value={inProgressTasks.length} label="In progress"    color={clr.cyan} onClick={() => setTab("tasks")} />
        <StatCard icon="📦" value={overdueOrders.length + dueSoonOrders.length} label="Delivery alerts" color={clr.orange} urgent onClick={() => setTab("suppliers")} />
        {canManage && <StatCard icon="🗂️" value={projects.length} label="Active projects" color={clr.green} onClick={() => setTab("projects")} />}
        {canManage && <StatCard icon="👥" value={users.length}    label="Team members"    color={clr.purple} onClick={() => setTab("team")} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: space["7"] }}>
        {/* Left column */}
        <div style={{ display: "grid", gap: space["7"], alignContent: "start" }}>
          {overdueTasks.length > 0 && (
            <div>
              <SectionHeader title="⚠ Overdue" action="View all →" onAction={() => setTab("tasks")} />
              {overdueTasks.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} />)}
              {overdueTasks.length > 5 && <div style={{ fontSize: font.base, color: clr.textFaint, textAlign: "center", padding: space["2"] }}>+{overdueTasks.length - 5} more</div>}
            </div>
          )}
          {dueSoonTasks.length > 0 && (
            <div>
              <SectionHeader title="📅 Due This Week" action="View all →" onAction={() => setTab("tasks")} />
              {dueSoonTasks.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} />)}
              {dueSoonTasks.length > 5 && <div style={{ fontSize: font.base, color: clr.textFaint, textAlign: "center", padding: space["2"] }}>+{dueSoonTasks.length - 5} more</div>}
            </div>
          )}
          {overdueTasks.length === 0 && dueSoonTasks.length === 0 && (
            <div style={{ background: bg.card, border: "1px solid #48bb7840", borderRadius: radius.xl, padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: space["3"] }}>✅</div>
              <div style={{ color: clr.green, fontWeight: 600, fontSize: "0.9rem" }}>No overdue or urgent tasks</div>
              <div style={{ color: clr.textFaint, fontSize: space["5"], marginTop: radius.sm }}>You're on top of everything</div>
            </div>
          )}
          {(overdueOrders.length > 0 || dueSoonOrders.length > 0) && (
            <div>
              <SectionHeader title="📦 Delivery Alerts" action="View suppliers →" onAction={() => setTab("suppliers")} />
              {[...overdueOrders, ...dueSoonOrders].slice(0, 5).map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: space["5"], padding: "0.6rem 0.75rem", background: bg.card, borderRadius: radius.lg, marginBottom: radius.sm, border: "1px solid #1a1a2e" }}>
                  <div style={{ width: radius.lg, height: radius.lg, borderRadius: "50%", background: (o as any).isLate ? clr.red : clr.yellow, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: font.lg, color: clr.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.description}</div>
                    <div style={{ fontSize: "0.68rem", color: clr.textFaint }}>{o.supplierName}</div>
                  </div>
                  <div style={{ fontSize: font.base, color: (o as any).isLate ? clr.red : clr.yellow, whiteSpace: "nowrap" }}>
                    {(o as any).isLate ? "Overdue" : `Due ${fmt((o as any).dueDate)}`}
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
        <div style={{ display: "grid", gap: space["7"], alignContent: "start" }}>
          {/* Recent Activity — appears at top of right column */}
          <RecentActivity />

          {canManage && projects.length > 0 && (
            <div>
              <SectionHeader title="🗂️ Project Progress" action="View all →" onAction={() => setTab("projects")} />
              <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, overflow: "hidden" }}>
                {projects.map((proj, i) => {
                  const pt   = tasks.filter((t) => t.projectId === proj.id);
                  const done = pt.filter((t) => t.status === "done").length;
                  const late = pt.filter((t) => t.endDate < now && t.status !== "done").length;
                  const pct  = pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
                  return (
                    <div key={proj.id} style={{ padding: "0.75rem 1rem", borderTop: i > 0 ? "1px solid #141428" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: radius.md }}>
                        <div style={{ display: "flex", alignItems: "center", gap: space["3"] }}>
                          <div style={{ width: radius.lg, height: radius.lg, borderRadius: "2px", background: proj.color }} />
                          <span style={{ fontSize: font.lg, color: clr.textPrimary }}>{proj.name}</span>
                          {late > 0 && <span style={{ fontSize: font.xs, color: clr.red, background: "#fc818118", padding: "1px 5px", borderRadius: radius.xs }}>{late} late</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: space["3"] }}>
                          {proj.updatedAt && <UpdatedBadge iso={proj.updatedAt} compact />}
                          <span style={{ fontSize: font.base, color: clr.textFaint }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: "5px", background: bg.overlay, borderRadius: radius.xs, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: proj.color, borderRadius: radius.xs }} />
                      </div>
                      <div style={{ fontSize: "0.68rem", color: clr.textGhost, marginTop: radius.sm }}>{done}/{pt.length} tasks complete</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {canManage && (
            <div>
              <SectionHeader title="👥 Team Workload" action="View team →" onAction={() => setTab("team")} />
              <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, overflow: "hidden" }}>
                {users.map((u, i) => {
                  const ut   = tasks.filter((t) => t.assigneeId === u.id && t.status !== "done");
                  const late = ut.filter((t) => t.endDate < now).length;
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: space["5"], padding: "0.6rem 1rem", borderTop: i > 0 ? "1px solid #141428" : "none" }}>
                      <Avatar name={u.name} role={u.role} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", color: clr.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                        <div style={{ fontSize: font.sm, color: clr.textGhost }}>{ut.length} open task{ut.length !== 1 ? "s" : ""}</div>
                      </div>
                      {late > 0 && <span style={{ fontSize: "0.68rem", color: clr.red, background: "#fc818118", padding: "1px 6px", borderRadius: radius.xs }}>{late} late</span>}
                      {ut.length === 0 && <span style={{ fontSize: "0.68rem", color: clr.green }}>✓ Clear</span>}
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
