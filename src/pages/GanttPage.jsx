import { useApp } from "../context/AppContext";
import { statusColor } from "../constants/seeds";
import { todayStr, daysBetween } from "../utils/dateHelpers";

const GanttChart = ({ tasks, users, projects, currentUser }) => {
  const visible = currentUser.role === "worker"
    ? tasks.filter((t) => t.assigneeId === currentUser.id)
    : tasks;

  if (!visible.length)
    return <div style={{ padding: "2rem", color: "#555", textAlign: "center" }}>No tasks to display.</div>;

  const dates   = visible.flatMap((t) => [t.startDate, t.endDate]);
  const minD    = dates.reduce((a, b) => (a < b ? a : b));
  const maxD    = dates.reduce((a, b) => (a > b ? a : b));
  const span    = Math.max(daysBetween(minD, maxD) + 1, 30);
  const now     = todayStr();
  const todayPct= Math.max(0, Math.min(100, (daysBetween(minD, now) / span) * 100));
  const pct     = (d) => `${(daysBetween(minD, d) / span) * 100}%`;
  const wPct    = (s, e) => `${(Math.max(daysBetween(s, e) + 1, 1) / span) * 100}%`;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "520px" }}>
        {visible.map((task) => {
          const proj    = projects.find((p) => p.id === task.projectId);
          const assignee= users.find((u) => u.id === task.assigneeId);
          const overdue = task.endDate < now && task.status !== "done";
          const bc      = overdue ? "#fc8181" : (statusColor[task.status] || proj?.color || "#00d4ff");
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
          {[["#4a5568","To Do"],["#00d4ff","In Progress"],["#48bb78","Done"],["#fc8181","Overdue"]].map(([c, l]) => (
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

export const GanttPage = () => {
  const { tasks, projects, users, currentUser, pf, setPf } = useApp();

  const filtered = pf === "all" ? tasks : tasks.filter((t) => t.projectId === pf);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ color: "#555", fontSize: "0.8rem" }}>
          {currentUser.role === "worker" ? "Your assigned tasks" : "All projects timeline"}
        </p>
        <select
          value={pf}
          onChange={(e) => setPf(e.target.value)}
          style={{ padding: "0.4rem 0.75rem", background: "#15152a", border: "1px solid #252540", borderRadius: "6px", color: "#e0e0e0", fontSize: "0.8rem" }}
        >
          <option value="all">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <GanttChart tasks={filtered} users={users} projects={projects} currentUser={currentUser} />
    </div>
  );
};
