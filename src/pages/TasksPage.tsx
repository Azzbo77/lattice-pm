import { useMemo, useCallback } from "react";
import React from "react";
import { useApp } from "../context/AppContext";
import { statusColor, prioColor } from "../constants/seeds";
import { todayStr, fmt } from "../utils/dateHelpers";
import { Btn, TH, TD, UpdatedBadge, selStyle, miniSel, Pager } from "../components/ui";
import { exportCSV } from "../utils/csvExport";
import { bg, clr, font, radius, space } from "../constants/theme";
import { usePagination } from "../hooks/usePagination";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { Task, User, Project } from "../types";

// ── Desktop row ───────────────────────────────────────────────────────────────
interface TaskRowProps {
  task: Task;
  project: Project | undefined;
  assignee: User | undefined;
  overdue: boolean;
  isBlocked: boolean;
  blockedBy: string;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  canManage: boolean;
}

const TaskRow = React.memo(({
  task, project, assignee, overdue, isBlocked, blockedBy, onEdit, onDelete, onStatusChange, canManage,
}: TaskRowProps) => (
  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr 0.8fr 1fr auto", alignItems: "center", padding: "0 0.5rem" }}>
    <TD>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
        <span style={{ color: clr.textPrimary, fontSize: "0.83rem" }}>{task.title}</span>
        {isBlocked && (
          <span title={`Blocked by: ${blockedBy}`} style={{ fontSize: font.xxs, color: clr.red, background: "#fc818118", border: "1px solid #fc818150", borderRadius: radius.xs, padding: "1px 5px", cursor: "help", flexShrink: 0 }}>
            ⛔ blocked
          </span>
        )}
        {(task.dependsOn || []).length > 0 && !isBlocked && (
          <span title="All dependencies complete" style={{ fontSize: font.xxs, color: clr.green, background: "#48bb7818", border: "1px solid #48bb7850", borderRadius: radius.xs, padding: "1px 5px", flexShrink: 0 }}>
            ✓ deps done
          </span>
        )}
      </div>
      <span style={{ fontSize: font.xs, color: project?.color, background: `${project?.color}15`, padding: "1px 5px", borderRadius: radius.xs }}>{project?.name}</span>
    </TD>
    <TD>{assignee?.name}</TD>
    <TD center style={{ color: overdue ? clr.red : clr.textDim, fontSize: font.base }}>{fmt(task.endDate)}</TD>
    <TD center>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        style={miniSel(statusColor[task.status])}
        aria-label={`Change status for task ${task.title}`}
      >
        <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option><option value="blocked">Blocked</option>
      </select>
    </TD>
    <TD center>
      <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: radius.sm, background: `${prioColor[task.priority]}18`, color: prioColor[task.priority], border: `1px solid ${prioColor[task.priority]}40` }}>{task.priority}</span>
    </TD>
    <TD center>
      <UpdatedBadge iso={task.updatedAt} byName={task.updatedBy} compact />
    </TD>
    <TD center style={{ gap: radius.sm }}>
      <button
        onClick={() => onEdit(task)}
        style={{ padding: "3px 7px", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.sm, color: clr.textMuted, fontSize: "0.7rem", cursor: "pointer" }}
        aria-label={`Edit task ${task.title}`}
      >Edit</button>
      {canManage && (
        <button
          onClick={() => onDelete(task.id)}
          style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.sm, color: clr.red, fontSize: "0.7rem", cursor: "pointer" }}
          aria-label={`Delete task ${task.title}`}
        >✕</button>
      )}
    </TD>
  </div>
));
TaskRow.displayName = "TaskRow";

// ── Mobile card ───────────────────────────────────────────────────────────────
const TaskCard = React.memo(({
  task, project, assignee, overdue, isBlocked, blockedBy, onEdit, onDelete, onStatusChange, canManage,
}: TaskRowProps) => (
  <div style={{
    background: bg.card,
    border: `1px solid ${overdue ? "#fc818140" : isBlocked ? "#fc818130" : "#1e1e35"}`,
    borderLeft: `3px solid ${overdue ? clr.red : isBlocked ? clr.red : project?.color || "#1e1e35"}`,
    borderRadius: radius.xl, padding: space["5"], marginBottom: space["4"],
  }}>
    {/* Title + badges */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space["3"] }}>
      <div style={{ flex: 1, minWidth: 0, marginRight: space["3"] }}>
        <div style={{ fontSize: font.md, color: clr.textPrimary, marginBottom: "3px" }}>{task.title}</div>
        {project && (
          <span style={{ fontSize: font.xs, color: project.color, background: `${project.color}15`, padding: "1px 6px", borderRadius: radius.xs }}>{project.name}</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
        <span style={{ fontSize: font.xs, padding: "2px 7px", borderRadius: radius.sm, background: `${prioColor[task.priority]}18`, color: prioColor[task.priority], border: `1px solid ${prioColor[task.priority]}40` }}>{task.priority}</span>
        {isBlocked && <span style={{ fontSize: font.xxs, color: clr.red, background: "#fc818118", border: "1px solid #fc818150", borderRadius: radius.xs, padding: "1px 5px" }}>⛔ blocked</span>}
        {(task.dependsOn || []).length > 0 && !isBlocked && <span style={{ fontSize: font.xxs, color: clr.green, background: "#48bb7818", border: "1px solid #48bb7850", borderRadius: radius.xs, padding: "1px 5px" }}>✓ deps done</span>}
      </div>
    </div>

    {/* Meta row */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: space["3"], marginBottom: space["4"], fontSize: font.sm, color: clr.textFaint }}>
      {assignee && <span>👤 {assignee.name}</span>}
      {task.endDate && (
        <span style={{ color: overdue ? clr.red : clr.textFaint }}>
          📅 {overdue ? "Overdue · " : ""}{fmt(task.endDate)}
        </span>
      )}
      <UpdatedBadge iso={task.updatedAt} byName={task.updatedBy} compact />
    </div>

    {/* Status + actions */}
    <div style={{ display: "flex", gap: space["3"], alignItems: "center", borderTop: "1px solid #1e1e35", paddingTop: space["3"] }}>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        style={{ ...miniSel(statusColor[task.status]), flex: 1 }}
        aria-label={`Change status for task ${task.title}`}
      >
        <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option><option value="blocked">Blocked</option>
      </select>
      <button onClick={() => onEdit(task)} style={{ padding: "5px 12px", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.md, color: clr.textMuted, fontSize: font.sm, cursor: "pointer" }}>Edit</button>
      {canManage && (
        <button onClick={() => onDelete(task.id)} style={{ padding: "5px 10px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.md, color: clr.red, fontSize: font.sm, cursor: "pointer" }}>✕</button>
      )}
    </div>
  </div>
));
TaskCard.displayName = "TaskCard";

// ── Page ──────────────────────────────────────────────────────────────────────
export const TasksPage = () => {
  const { filteredTasks, tasks, projects, users, currentUser, canManage, pf, setPf, setTaskModal, deleteTask, updateTaskStatus } = useApp();
  const { isMobile } = useBreakpoint();
  const now = todayStr();

  const { page, totalPages, pageItems, next, prev, goTo } = usePagination(filteredTasks, 25);

  const isBlocked = useCallback((task: Task): boolean =>
    (task.dependsOn || []).some((depId) => {
      const dep = tasks.find((t) => t.id === depId);
      return dep && dep.status !== "done";
    }), [tasks]);

  const blockedBy = useCallback((task: Task): string =>
    (task.dependsOn || [])
      .map((depId) => tasks.find((t) => t.id === depId))
      .filter((dep): dep is Task => !!dep && dep.status !== "done")
      .map((dep) => dep.title)
      .join(", "), [tasks]);

  const taskRowsData = useMemo(() =>
    pageItems.map((task) => ({
      task,
      project:       projects.find((p) => p.id === task.projectId),
      assignee:      users.find((u) => u.id === task.assigneeId),
      overdue:       task.endDate < now && task.status !== "done",
      isBlockedFlag: isBlocked(task),
      blockedByStr:  blockedBy(task),
    })),
    [pageItems, projects, users, now, isBlocked, blockedBy]
  );

  const handleExport = () => {
    const rows = filteredTasks.map((t) => {
      const proj     = projects.find((p) => p.id === t.projectId);
      const assignee = users.find((u) => u.id === t.assigneeId);
      return [t.title, proj?.name || "", assignee?.name || "", t.startDate, t.endDate, t.status, t.priority, t.description || "", t.updatedAt || "", t.updatedBy || ""];
    });
    exportCSV(`Tasks-export-${todayStr()}.csv`, ["Title","Project","Assignee","Start Date","End Date","Status","Priority","Description","Last Updated","Updated By"], rows);
  };

  const sharedProps = (d: typeof taskRowsData[0]) => ({
    key:            d.task.id,
    task:           d.task,
    project:        d.project,
    assignee:       d.assignee,
    overdue:        d.overdue,
    isBlocked:      d.isBlockedFlag,
    blockedBy:      d.blockedByStr,
    onEdit:         setTaskModal,
    onDelete:       deleteTask,
    onStatusChange: updateTaskStatus,
    canManage,
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["6"], flexWrap: "wrap", gap: space["3"] }}>
        <p style={{ color: clr.textFaint, fontSize: "0.8rem" }}>
          {currentUser?.role === "shopfloor" ? "Your assigned work" : `${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""}`}
        </p>
        <div style={{ display: "flex", gap: font.xxs, alignItems: "center", flexWrap: "wrap" }}>
          <select value={pf} onChange={(e) => setPf(e.target.value)} style={selStyle}>
            <option value="all">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: space["2"], padding: "0.3rem 0.85rem", borderRadius: radius.md, border: "1px solid #48bb7870", background: "#48bb7818", color: clr.green, fontSize: space["5"], cursor: "pointer" }}>⬇ Export CSV</button>
          {canManage && <Btn color={clr.cyan} onClick={() => setTaskModal({})}>+ Task</Btn>}
        </div>
      </div>

      {/* Mobile cards */}
      {isMobile && (
        <div>
          {filteredTasks.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No tasks found.</div>}
          {taskRowsData.map((d) => <TaskCard {...sharedProps(d)} />)}
          <Pager page={page} totalPages={totalPages} total={filteredTasks.length} pageSize={25} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      )}

      {/* Desktop table */}
      {!isMobile && (
        <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "680px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr 0.8fr 1fr auto", background: bg.subtle, padding: "0 0.5rem" }}>
                {["Task","Assignee","Due","Status","Priority","Updated",""].map((h, i) => (
                  <TH key={i} center={i >= 2}>{h}</TH>
                ))}
              </div>
              {filteredTasks.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No tasks found.</div>}
              {taskRowsData.map((d) => <TaskRow {...sharedProps(d)} />)}
            </div>
          </div>
          <Pager page={page} totalPages={totalPages} total={filteredTasks.length} pageSize={25} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      )}
    </div>
  );
};
