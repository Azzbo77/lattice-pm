import { useApp } from "../context/AppContext";
import { statusColor, prioColor } from "../constants/seeds";
import { todayStr, fmt } from "../utils/dateHelpers";
import { Btn, TH, TD, UpdatedBadge, selStyle, miniSel } from "../components/ui";
import { exportCSV } from "../utils/csvExport";
import { bg, clr, font, radius, space } from "../constants/theme";

export const TasksPage = () => {
  const { filteredTasks, tasks, projects, users, currentUser, canManage, pf, setPf, setTaskModal, deleteTask, updateTaskStatus } = useApp();
  const now = todayStr();

  // Returns true if any dependency is not done (blocking this task)
  const isBlocked = (task: import("../types").Task): boolean =>
    (task.dependsOn || []).some((depId) => {
      const dep = tasks.find((t) => t.id === depId);
      return dep && dep.status !== "done";
    });

  // Returns list of incomplete dep titles for tooltip
  const blockedBy = (task: import("../types").Task): string =>
    (task.dependsOn || [])
      .map((depId) => tasks.find((t) => t.id === depId))
      .filter((dep): dep is import("../types").Task => !!dep && dep.status !== "done")
      .map((dep) => dep.title)
      .join(", ");


  const handleExport = () => {
    const rows = filteredTasks.map((t) => {
      const proj     = projects.find((p) => p.id === t.projectId);
      const assignee = users.find((u) => u.id === t.assigneeId);
      return [t.title, proj?.name || "", assignee?.name || "", t.startDate, t.endDate, t.status, t.priority, t.description || "", t.updatedAt || "", t.updatedBy || ""];
    });
    exportCSV(
      `Tasks-export-${todayStr()}.csv`,
      ["Title","Project","Assignee","Start Date","End Date","Status","Priority","Description","Last Updated","Updated By"],
      rows
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["6"], flexWrap: "wrap", gap: space["3"] }}>
        <p style={{ color: clr.textFaint, fontSize: "0.8rem" }}>{currentUser?.role === "worker" ? "Your assigned work" : `${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""}`}</p>
        <div style={{ display: "flex", gap: font.xxs, alignItems: "center", flexWrap: "wrap" }}>
          <select value={pf} onChange={(e) => setPf(e.target.value)} style={selStyle}>
            <option value="all">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: space["2"], padding: "0.3rem 0.85rem", borderRadius: radius.md, border: "1px solid #48bb7870", background: "#48bb7818", color: clr.green, fontSize: space["5"], cursor: "pointer" }}>⬇ Export CSV</button>
          {canManage && <Btn color={clr.cyan} onClick={() => setTaskModal({})}>+ Task</Btn>}
        </div>
      </div>

      <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "680px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr 0.8fr 1fr auto", background: bg.subtle, padding: "0 0.5rem" }}>
          {["Task","Assignee","Due","Status","Priority","Updated",""].map((h, i) => (
            <TH key={i} center={i >= 2}>{h}</TH>
          ))}
        </div>
        {filteredTasks.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No tasks found.</div>}
        {filteredTasks.map((task) => {
          const proj     = projects.find((p) => p.id === task.projectId);
          const assignee = users.find((u) => u.id === task.assigneeId);
          const overdue  = task.endDate < now && task.status !== "done";
          return (
            <div key={task.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr 0.8fr 1fr auto", alignItems: "center", padding: "0 0.5rem" }}>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                  <span style={{ color: clr.textPrimary, fontSize: "0.83rem" }}>{task.title}</span>
                  {isBlocked(task) && (
                    <span title={`Blocked by: ${blockedBy(task)}`} style={{ fontSize: font.xxs, color: clr.red, background: "#fc818118", border: "1px solid #fc818150", borderRadius: radius.xs, padding: "1px 5px", cursor: "help", flexShrink: 0 }}>
                      ⛔ blocked
                    </span>
                  )}
                  {(task.dependsOn || []).length > 0 && !isBlocked(task) && (
                    <span title="All dependencies complete" style={{ fontSize: font.xxs, color: clr.green, background: "#48bb7818", border: "1px solid #48bb7850", borderRadius: radius.xs, padding: "1px 5px", flexShrink: 0 }}>
                      ✓ deps done
                    </span>
                  )}
                </div>
                <span style={{ fontSize: font.xs, color: proj?.color, background: `${proj?.color}15`, padding: "1px 5px", borderRadius: radius.xs }}>{proj?.name}</span>
              </TD>
              <TD>{assignee?.name}</TD>
              <TD center style={{ color: overdue ? clr.red : clr.textDim, fontSize: font.base }}>{fmt(task.endDate)}</TD>
              <TD center>
                <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} style={miniSel(statusColor[task.status])}>
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
                <button onClick={() => setTaskModal(task)} style={{ padding: "3px 7px", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.sm, color: clr.textMuted, fontSize: "0.7rem", cursor: "pointer" }}>Edit</button>
                {canManage && <button onClick={() => deleteTask(task.id)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.sm, color: clr.red, fontSize: "0.7rem", cursor: "pointer" }}>✕</button>}
              </TD>
            </div>
          );
        })}
      </div></div></div>
    </div>
  );
};
