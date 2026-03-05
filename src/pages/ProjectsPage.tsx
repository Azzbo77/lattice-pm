import { useApp } from "../context/AppContext";
import { todayStr } from "../utils/dateHelpers";
import { Btn, UpdatedBadge } from "../components/ui";
import { bg, clr, font, radius, space } from "../constants/theme";

export const ProjectsPage = () => {
  const { projects, tasks, canManage, setTab, setPf, setProjectModal, setConfirmDeleteProject } = useApp();
  const now = todayStr();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["7"], flexWrap: "wrap", gap: space["3"] }}>
        <p style={{ color: clr.textFaint, fontSize: "0.8rem" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        {canManage && <Btn color={clr.cyan} onClick={() => setProjectModal({})}>+ New Project</Btn>}
      </div>

      {projects.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No projects yet — click + New Project to get started.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: space["6"] }}>
        {projects.map((proj) => {
          const projTasks  = tasks.filter((t) => t.projectId === proj.id);
          const done       = projTasks.filter((t) => t.status === "done").length;
          const overdue    = projTasks.filter((t) => t.endDate < now && t.status !== "done").length;
          const inProgress = projTasks.filter((t) => t.status === "in-progress").length;
          const pct        = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
          return (
            <div key={proj.id} style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, overflow: "hidden" }}>
              <div style={{ height: radius.sm, background: proj.color }} />
              <div style={{ padding: space["6"] }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space["3"] }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: space["3"] }}>
                    <div style={{ color: clr.textPrimary, fontWeight: 600, fontSize: font.h3 }}>{proj.name}</div>
                    {proj.description && <div style={{ color: clr.textFaint, fontSize: space["5"], marginTop: "2px" }}>{proj.description}</div>}
                  </div>
                  {canManage && (
                    <div style={{ display: "flex", gap: radius.sm, flexShrink: 0 }}>
                      <button onClick={() => setProjectModal(proj)} style={{ padding: "3px 7px", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.sm, color: clr.textMuted, fontSize: "0.7rem", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => setConfirmDeleteProject(proj)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.sm, color: clr.red, fontSize: "0.7rem", cursor: "pointer" }}>✕</button>
                    </div>
                  )}
                </div>

                {/* Updated badge */}
                <div style={{ marginBottom: space["5"] }}>
                  <UpdatedBadge iso={proj.updatedAt} byName={proj.updatedBy} compact />
                </div>

                <div style={{ marginBottom: space["5"] }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: clr.textFaint, marginBottom: radius.sm }}>
                    <span>{pct}% complete</span><span>{done}/{projTasks.length} tasks</span>
                  </div>
                  <div style={{ height: "5px", background: bg.overlay, borderRadius: radius.xs, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: proj.color, borderRadius: radius.xs }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(55px, 1fr))", gap: space["2"] }}>
                  {[["Total", projTasks.length,clr.textMuted],["Active",inProgress,clr.cyan],["Done",done,clr.green],["Late",overdue,clr.red]].map(([l,v,c]) => (
                    <div key={l} style={{ background: bg.raised, borderRadius: "5px", padding: "0.35rem 0.25rem", textAlign: "center" }}>
                      <div style={{ fontSize: font.h3, color: c as any, fontWeight: 700 }}>{v}</div>
                      <div style={{ fontSize: "0.58rem", color: clr.textGhost }}>{l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setPf(proj.id); setTab("tasks"); }} style={{ width: "100%", marginTop: space["5"], padding: space["2"], background: "transparent", border: `1px solid ${proj.color}40`, borderRadius: radius.md, color: proj.color, fontSize: space["5"], cursor: "pointer" }}>View Tasks →</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
