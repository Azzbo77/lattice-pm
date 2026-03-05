import { useState, useMemo } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { Task, Project, User } from "../types";
import { useApp } from "../context/AppContext";
import { statusColor } from "../constants/seeds";
import { todayStr, daysBetween, addDays, fmt } from "../utils/dateHelpers";

// ── Date axis ─────────────────────────────────────────────────────────────────
const DateAxis = ({ minD, span }: { minD: string; span: number }) => {
  const labels = [];
  const step = span <= 30 ? 7 : span <= 90 ? 14 : 30;
  for (let i = 0; i <= span; i += step) {
    labels.push({ pct: (i / span) * 100, label: fmt(addDays(minD, i)) });
  }
  return (
    <div style={{ position: "relative", height: "20px", marginBottom: "6px", marginLeft: "160px" }}>
      {labels.map(({ pct, label }) => (
        <div key={label} style={{ position: "absolute", left: `${pct}%`, transform: "translateX(-50%)", fontSize: "0.6rem", color: "#444", whiteSpace: "nowrap" }}>
          {label}
        </div>
      ))}
    </div>
  );
};

// ── Task bar row ──────────────────────────────────────────────────────────────
interface TaskBarProps {
  task: Task;
  proj?: Project;
  assignee?: User;
  minD: string;
  span: number;
  todayPct: number;
  dimmed: boolean;
  onEdit?: (t: Task) => void;
}
const TaskBar = ({ task, proj, assignee, minD, span, todayPct, dimmed, onEdit }: TaskBarProps) => {
  const { isMobile } = useBreakpoint();
  const now    = todayStr();
  const overdue = task.endDate < now && task.status !== "done";
  const bc     = overdue ? "#fc8181" : (proj?.color || statusColor[task.status] || "#00d4ff");
  const left   = `${Math.max(0, (daysBetween(minD, task.startDate) / span) * 100)}%`;
  const width  = `${(Math.max(daysBetween(task.startDate, task.endDate) + 1, 1) / span) * 100}%`;

  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "6px", gap: "8px", opacity: dimmed ? 0.2 : 1, transition: "opacity 0.2s" }}>
      <div style={{ width: isMobile ? "100px" : "152px", flexShrink: 0, paddingRight: "8px" }}>
        <div
          title={task.title}
          onClick={() => onEdit && onEdit(task)}
          style={{ fontSize: "0.78rem", color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: onEdit ? "pointer" : "default" }}
        >
          {task.title}
        </div>
        <div style={{ fontSize: "0.6rem", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{assignee?.name}</div>
      </div>
      <div style={{ flex: 1, position: "relative", height: "28px" }}>
        <div style={{ position: "absolute", left: `${todayPct}%`, top: 0, bottom: 0, width: "2px", background: "#ff6b35", zIndex: 5, pointerEvents: "none" }} />
        <div
          title={`${task.title} · ${task.startDate} → ${task.endDate} · ${task.status}`}
          onClick={() => onEdit && onEdit(task)}
          style={{ position: "absolute", left, width, top: "4px", height: "20px", background: `${bc}22`, border: `1.5px solid ${bc}`, borderRadius: "4px", display: "flex", alignItems: "center", paddingLeft: "6px", overflow: "hidden", cursor: onEdit ? "pointer" : "default" }}
        >
          <span style={{ fontSize: "0.6rem", color: bc, whiteSpace: "nowrap" }}>{task.title}</span>
        </div>
      </div>
    </div>
  );
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({ on, onChange, label }: { on: boolean; onChange: () => void; label?: string }) => (
  <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer" }}>
    <div onClick={onChange} style={{ width: "32px", height: "18px", borderRadius: "9px", background: on ? "#00d4ff" : "#252540", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: "3px", left: on ? "17px" : "3px", width: "12px", height: "12px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </div>
    <span style={{ fontSize: "0.75rem", color: on ? "#00d4ff" : "#555" }}>{label}</span>
  </label>
);

// ── Main page ─────────────────────────────────────────────────────────────────

// ── Dependency arrows ─────────────────────────────────────────────────────────
// Renders SVG arrows between task bars. Uses data-taskid attributes to locate bars.
const DependencyArrows = ({ tasks, minD, span }: { tasks: import("../types").Task[]; minD: string; span: number }) => {
  const arrows: { x1: number; y1: number; x2: number; y2: number; blocked: boolean }[] = [];

  tasks.forEach((task, toIdx) => {
    (task.dependsOn || []).forEach((depId) => {
      const fromIdx = tasks.findIndex((t) => t.id === depId);
      if (fromIdx === -1) return;
      const fromTask = tasks[fromIdx];

      // X positions: end of from-task bar, start of to-task bar
      const fromPct = Math.max(0, Math.min(100, ((daysBetween(minD, fromTask.endDate) + 1) / span) * 100));
      const toPct   = Math.max(0, Math.min(100, (daysBetween(minD, task.startDate) / span) * 100));

      // Y positions: row height ~40px, centered
      const rowH = 40;
      const y1 = fromIdx * rowH + rowH / 2;
      const y2 = toIdx   * rowH + rowH / 2;

      const blocked = fromTask.status !== "done";
      arrows.push({ x1: fromPct, y1, x2: toPct, y2, blocked });
    });
  });

  if (arrows.length === 0) return null;

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
      preserveAspectRatio="none"
    >
      <defs>
        <marker id="arrowDone"    markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#48bb78" /></marker>
        <marker id="arrowBlocked" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#fc8181" /></marker>
      </defs>
      {arrows.map((a, i) => {
        const color = a.blocked ? "#fc8181" : "#48bb78";
        const mid   = (a.x1 + a.x2) / 2;
        return (
          <path
            key={i}
            d={`M ${a.x1}% ${a.y1} C ${mid}% ${a.y1}, ${mid}% ${a.y2}, ${a.x2}% ${a.y2}`}
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray={a.blocked ? "4 3" : "none"}
            fill="none"
            opacity="0.6"
            markerEnd={a.blocked ? "url(#arrowBlocked)" : "url(#arrowDone)"}
          />
        );
      })}
    </svg>
  );
};

export const GanttPage = () => {
  const { tasks, projects, users, currentUser, setTaskModal, setTab, setPf } = useApp();

  const [activeId, setActiveId] = useState(projects.length > 0 ? projects[0].id : "all");
  const [showAll,  setShowAll]  = useState(false);

  const now = todayStr();

  const myTasks = currentUser?.role === "worker"
    ? tasks.filter((t) => t.assigneeId === currentUser.id)
    : tasks;

  // Date range across ALL tasks so axis never shifts when toggling overlay
  const allDates  = myTasks.flatMap((t) => [t.startDate, t.endDate]);
  const minD      = allDates.length ? allDates.reduce((a, b) => (a < b ? a : b)) : now;
  const maxD      = allDates.length ? allDates.reduce((a, b) => (a > b ? a : b)) : addDays(now, 30);
  const span      = Math.max(daysBetween(minD, maxD) + 1, 30);
  const todayPct  = Math.max(0, Math.min(100, (daysBetween(minD, now) / span) * 100));

  const activeTasks = useMemo(
    () => activeId === "all" ? myTasks : myTasks.filter((t) => t.projectId === activeId),
    [myTasks, activeId]
  );
  const otherTasks  = useMemo(
    () => activeId === "all" ? [] : myTasks.filter((t) => t.projectId !== activeId),
    [myTasks, activeId]
  );

  const activeProject = projects.find((p) => p.id === activeId);

  const grouped = useMemo(() => {
    if (activeId !== "all") return [{ proj: activeProject, tasks: activeTasks }];
    return projects
      .map((proj) => ({ proj, tasks: activeTasks.filter((t) => t.projectId === proj.id) }))
      .filter((g) => g.tasks.length > 0);
  }, [activeTasks, activeId, activeProject, projects]);

  if (!currentUser) return null;

  const onEdit = currentUser.role !== "worker" ? (task: any) => setTaskModal(task) : undefined;

  // ── Empty state ──
  if (myTasks.length === 0)
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📅</div>
        <div style={{ marginBottom: "1rem" }}>No tasks yet.</div>
        {currentUser.role !== "worker" && (
          <button onClick={() => setTab("tasks")} style={{ padding: "0.5rem 1.25rem", background: "#00d4ff18", border: "1px solid #00d4ff50", borderRadius: "6px", color: "#00d4ff", fontSize: "0.82rem", cursor: "pointer" }}>
            Go to Tasks →
          </button>
        )}
      </div>
    );

  return (
    <div>
      {/* ── Controls ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.1rem", flexWrap: "wrap" }}>

        {/* Project pills */}
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              style={{ padding: "0.28rem 0.8rem", borderRadius: "20px", border: `1.5px solid ${activeId === p.id ? p.color : "#252540"}`, background: activeId === p.id ? `${p.color}22` : "transparent", color: activeId === p.id ? p.color : "#555", fontSize: "0.78rem", cursor: "pointer", fontWeight: activeId === p.id ? 600 : 400, transition: "all 0.15s" }}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setActiveId("all")}
            style={{ padding: "0.28rem 0.8rem", borderRadius: "20px", border: `1.5px solid ${activeId === "all" ? "#888" : "#252540"}`, background: activeId === "all" ? "#88888822" : "transparent", color: activeId === "all" ? "#ccc" : "#555", fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s" }}
          >
            All
          </button>
        </div>

        {/* Overlay toggle — only when a single project is active and others exist */}
        {activeId !== "all" && otherTasks.length > 0 && (
          <Toggle on={showAll} onChange={() => setShowAll((s) => !s)} label="Show overlapping projects" />
        )}

        {/* Jump to task list */}
        {activeId !== "all" && (
          <button
            onClick={() => { setPf(activeId); setTab("tasks"); }}
            style={{ padding: "0.28rem 0.7rem", background: "transparent", border: "1px solid #252540", borderRadius: "6px", color: "#555", fontSize: "0.72rem", cursor: "pointer", marginLeft: "auto" }}
          >
            Task list →
          </button>
        )}
      </div>

      {/* ── Active project stats bar ── */}
      {activeId !== "all" && activeProject && (
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.1rem", flexWrap: "wrap", alignItems: "center" }}>
          {[
            ["Total",       activeTasks.length,                                                              "#888"],
            ["In Progress", activeTasks.filter((t) => t.status === "in-progress").length,                   "#00d4ff"],
            ["Done",        activeTasks.filter((t) => t.status === "done").length,                          "#48bb78"],
            ["Overdue",     activeTasks.filter((t) => t.endDate < now && t.status !== "done").length,       "#fc8181"],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "8px", padding: "0.45rem 0.85rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: color as any }}>{val}</span>
              <span style={{ fontSize: "0.7rem", color: "#555" }}>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", background: "#0f0f1e", border: `1px solid ${activeProject.color}40`, borderRadius: "8px", padding: "0.45rem 0.85rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <div style={{ width: "9px", height: "9px", borderRadius: "3px", background: activeProject.color }} />
            <span style={{ fontSize: "0.78rem", color: activeProject.color, fontWeight: 600 }}>{activeProject.name}</span>
          </div>
        </div>
      )}

      {/* ── Chart panel ── */}
      <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", padding: "1rem 1.25rem", overflowX: "auto" }}>
        <div style={{ minWidth: "560px" }}>
          <DateAxis minD={minD} span={span} />
          <div style={{ position: "relative" }}>

          {/* Dimmed overlay — other projects */}
          {showAll && activeId !== "all" && otherTasks.map((task) => (
            <TaskBar
              key={`dim-${task.id}`}
              task={task}
              proj={projects.find((p) => p.id === task.projectId)}
              assignee={users.find((u) => u.id === task.assigneeId)}
              minD={minD} span={span} todayPct={todayPct}
              dimmed={true}
            />
          ))}

          {/* Active tasks — grouped with project headers when showing All */}
          {grouped.map(({ proj, tasks: grpTasks }) => (
            <div key={proj?.id || "ungrouped"}>
              {activeId === "all" && proj && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.85rem 0 0.45rem", paddingBottom: "4px", borderBottom: `1px solid ${proj.color}30` }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: proj.color }} />
                  <span style={{ fontSize: "0.72rem", color: proj.color, fontWeight: 600 }}>{proj.name}</span>
                  <span style={{ fontSize: "0.65rem", color: "#444" }}>— {grpTasks.length} task{grpTasks.length !== 1 ? "s" : ""}</span>
                </div>
              )}
              {grpTasks.map((task) => (
                <TaskBar
                  key={task.id}
                  task={task}
                  proj={proj}
                  assignee={users.find((u) => u.id === task.assigneeId)}
                  minD={minD} span={span} todayPct={todayPct}
                  dimmed={false}
                  onEdit={onEdit}
                />
              ))}
            </div>
          ))}

          <DependencyArrows tasks={activeTasks} minD={minD} span={span} />
          </div>

          {activeTasks.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "#555", fontSize: "0.82rem" }}>
              No tasks for this project yet.
              {currentUser.role !== "worker" && (
                <button onClick={() => { setPf(activeId); setTab("tasks"); }} style={{ display: "block", margin: "0.75rem auto 0", padding: "0.4rem 1rem", background: "transparent", border: "1px solid #252540", borderRadius: "6px", color: "#888", fontSize: "0.78rem", cursor: "pointer" }}>Add tasks →</button>
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #141428", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            {[["#4a5568","To Do"],["#00d4ff","In Progress"],["#48bb78","Done"],["#fc8181","Overdue"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: "#555" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c }} />{l}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: "#555" }}>
              <div style={{ width: "2px", height: "10px", background: "#ff6b35" }} />Today
            </div>
            {onEdit && <span style={{ fontSize: "0.65rem", color: "#333", marginLeft: "auto" }}>Click bar to edit</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
