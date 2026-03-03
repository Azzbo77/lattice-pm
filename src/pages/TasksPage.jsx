import { useApp } from "../context/AppContext";
import { statusColor, prioColor } from "../constants/seeds";
import { todayStr, fmt } from "../utils/dateHelpers";
import { Btn, TH, TD, UpdatedBadge } from "../components/ui";
import { exportCSV } from "../utils/csvExport";

export const TasksPage = () => {
  const { filteredTasks, projects, users, currentUser, canManage, pf, setPf, setTaskModal, deleteTask, updateTaskStatus } = useApp();
  const now = todayStr();

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ color: "#555", fontSize: "0.8rem" }}>{currentUser.role === "worker" ? "Your assigned work" : `${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""}`}</p>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <select value={pf} onChange={(e) => setPf(e.target.value)} style={{ padding: "0.3rem 0.6rem", background: "#15152a", border: "1px solid #252540", borderRadius: "6px", color: "#e0e0e0", fontSize: "0.8rem" }}>
            <option value="all">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.85rem", borderRadius: "6px", border: "1px solid #48bb7870", background: "#48bb7818", color: "#48bb78", fontSize: "0.75rem", cursor: "pointer" }}>⬇ Export CSV</button>
          {canManage && <Btn color="#00d4ff" onClick={() => setTaskModal({})}>+ Task</Btn>}
        </div>
      </div>

      <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr 0.8fr 1fr auto", background: "#0d0d20" }}>
          {["Task","Assignee","Due","Status","Priority","Updated",""].map((h, i) => <TH key={i}>{h}</TH>)}
        </div>
        {filteredTasks.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No tasks found.</div>}
        {filteredTasks.map((task) => {
          const proj     = projects.find((p) => p.id === task.projectId);
          const assignee = users.find((u) => u.id === task.assigneeId);
          const overdue  = task.endDate < now && task.status !== "done";
          return (
            <div key={task.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr 0.8fr 1fr auto", alignItems: "center", padding: "0 0.5rem" }}>
              <TD>
                <div style={{ color: "#e0e0e0", marginBottom: "2px", fontSize: "0.83rem" }}>{task.title}</div>
                <span style={{ fontSize: "0.62rem", color: proj?.color, background: `${proj?.color}15`, padding: "1px 5px", borderRadius: "3px" }}>{proj?.name}</span>
              </TD>
              <TD>{assignee?.name}</TD>
              <TD style={{ color: overdue ? "#fc8181" : "#777", fontSize: "0.76rem" }}>{fmt(task.endDate)}</TD>
              <TD>
                <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)} style={{ padding: "2px 5px", background: `${statusColor[task.status]}18`, border: `1px solid ${statusColor[task.status]}55`, borderRadius: "4px", color: statusColor[task.status], fontSize: "0.7rem", cursor: "pointer" }}>
                  <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option><option value="blocked">Blocked</option>
                </select>
              </TD>
              <TD>
                <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: "4px", background: `${prioColor[task.priority]}18`, color: prioColor[task.priority], border: `1px solid ${prioColor[task.priority]}40` }}>{task.priority}</span>
              </TD>
              <TD>
                <UpdatedBadge iso={task.updatedAt} byName={task.updatedBy} compact />
              </TD>
              <TD style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => setTaskModal(task)} style={{ padding: "3px 7px", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", color: "#888", fontSize: "0.7rem", cursor: "pointer" }}>Edit</button>
                {canManage && <button onClick={() => deleteTask(task.id)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "4px", color: "#fc8181", fontSize: "0.7rem", cursor: "pointer" }}>✕</button>}
              </TD>
            </div>
          );
        })}
      </div>
    </div>
  );
};
