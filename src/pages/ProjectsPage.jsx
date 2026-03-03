import { useApp } from "../context/AppContext";
import { todayStr } from "../utils/dateHelpers";
import { Btn, UpdatedBadge } from "../components/ui";

export const ProjectsPage = () => {
  const { projects, tasks, canManage, setTab, setPf, setProjectModal, setConfirmDeleteProject } = useApp();
  const now = todayStr();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ color: "#555", fontSize: "0.8rem" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        {canManage && <Btn color="#00d4ff" onClick={() => setProjectModal({})}>+ New Project</Btn>}
      </div>

      {projects.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No projects yet — click + New Project to get started.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {projects.map((proj) => {
          const projTasks  = tasks.filter((t) => t.projectId === proj.id);
          const done       = projTasks.filter((t) => t.status === "done").length;
          const overdue    = projTasks.filter((t) => t.endDate < now && t.status !== "done").length;
          const inProgress = projTasks.filter((t) => t.status === "in-progress").length;
          const pct        = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
          return (
            <div key={proj.id} style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ height: "4px", background: proj.color }} />
              <div style={{ padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: "0.5rem" }}>
                    <div style={{ color: "#e0e0e0", fontWeight: 600, fontSize: "0.95rem" }}>{proj.name}</div>
                    {proj.description && <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "2px" }}>{proj.description}</div>}
                  </div>
                  {canManage && (
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button onClick={() => setProjectModal(proj)} style={{ padding: "3px 7px", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", color: "#888", fontSize: "0.7rem", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => setConfirmDeleteProject(proj)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "4px", color: "#fc8181", fontSize: "0.7rem", cursor: "pointer" }}>✕</button>
                    </div>
                  )}
                </div>

                {/* Updated badge */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <UpdatedBadge iso={proj.updatedAt} byName={proj.updatedBy} compact />
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#555", marginBottom: "4px" }}>
                    <span>{pct}% complete</span><span>{done}/{projTasks.length} tasks</span>
                  </div>
                  <div style={{ height: "5px", background: "#1a1a2e", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: proj.color, borderRadius: "3px" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.4rem" }}>
                  {[["Total", projTasks.length,"#888"],["Active",inProgress,"#00d4ff"],["Done",done,"#48bb78"],["Late",overdue,"#fc8181"]].map(([l,v,c]) => (
                    <div key={l} style={{ background: "#15152a", borderRadius: "5px", padding: "0.35rem 0.25rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.95rem", color: c, fontWeight: 700 }}>{v}</div>
                      <div style={{ fontSize: "0.58rem", color: "#444" }}>{l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setPf(proj.id); setTab("tasks"); }} style={{ width: "100%", marginTop: "0.75rem", padding: "0.4rem", background: "transparent", border: `1px solid ${proj.color}40`, borderRadius: "6px", color: proj.color, fontSize: "0.75rem", cursor: "pointer" }}>View Tasks →</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
