import { useMemo } from "react";
import type { Project, Task } from "../types";
import { useApp } from "../context/AppContext";
import { todayStr } from "../utils/dateHelpers";
import { Btn, UpdatedBadge } from "../components/ui";
import { bg, clr, font, radius, space } from "../constants/theme";
import React from "react";

interface ProjectCardProps {
  project: Project;
  projTasks: Task[];
  canManage: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onViewTasks: (projectId: string) => void;
}

const ProjectCard = React.memo(({ project, projTasks, canManage, onEdit, onDelete, onViewTasks }: ProjectCardProps) => {
  const done = projTasks.filter((t) => t.status === "done").length;
  const overdue = projTasks.filter((t) => t.endDate < todayStr() && t.status !== "done").length;
  const inProgress = projTasks.filter((t) => t.status === "in-progress").length;
  const pct = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;

  return (
    <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, overflow: "hidden" }}>
      <div style={{ height: radius.sm, background: project.color }} />
      <div style={{ padding: space["6"] }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space["3"] }}>
          <div style={{ flex: 1, minWidth: 0, marginRight: space["3"] }}>
            <div style={{ color: clr.textPrimary, fontWeight: 600, fontSize: font.h3 }}>{project.name}</div>
            {project.description && <div style={{ color: clr.textFaint, fontSize: space["5"], marginTop: "2px" }}>{project.description}</div>}
          </div>
          {canManage && (
            <div style={{ display: "flex", gap: radius.sm, flexShrink: 0 }}>
              <button onClick={() => onEdit(project)} style={{ padding: "3px 7px", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.sm, color: clr.textMuted, fontSize: "0.7rem", cursor: "pointer" }} aria-label={`Edit project ${project.name}`}>Edit</button>
              <button onClick={() => onDelete(project)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.sm, color: clr.red, fontSize: "0.7rem", cursor: "pointer" }} aria-label={`Delete project ${project.name}`}>✕</button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: space["5"] }}>
          <UpdatedBadge iso={project.updatedAt} byName={project.updatedBy} compact />
        </div>

        <div style={{ marginBottom: space["5"] }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: clr.textFaint, marginBottom: radius.sm }}>
            <span>{pct}% complete</span><span>{done}/{projTasks.length} tasks</span>
          </div>
          <div style={{ height: "5px", background: bg.overlay, borderRadius: radius.xs, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: project.color, borderRadius: radius.xs }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(55px, 1fr))", gap: space["2"] }}>
          {[["Total", projTasks.length, clr.textMuted], ["Active", inProgress, clr.cyan], ["Done", done, clr.green], ["Late", overdue, clr.red]].map(([l, v, c]) => (
            <div key={l} style={{ background: bg.raised, borderRadius: "5px", padding: "0.35rem 0.25rem", textAlign: "center" }}>
              <div style={{ fontSize: font.h3, color: c as any, fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: "0.58rem", color: clr.textGhost }}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => onViewTasks(project.id)} style={{ width: "100%", marginTop: space["5"], padding: space["2"], background: "transparent", border: `1px solid ${project.color}40`, borderRadius: radius.md, color: project.color, fontSize: space["5"], cursor: "pointer" }} aria-label={`View tasks for project ${project.name}`}>View Tasks →</button>
      </div>
    </div>
  );
});
ProjectCard.displayName = "ProjectCard";

export const ProjectsPage = () => {
  const { projects, tasks, canManage, setTab, setPf, setProjectModal, setConfirmDeleteProject } = useApp();

  // Memoize project task data to prevent unnecessary re-renders
  const projectsWithTasks = useMemo(() =>
    projects.map((proj) => ({
      project: proj,
      tasks: tasks.filter((t) => t.projectId === proj.id),
    })),
    [projects, tasks]
  );

  const handleViewTasks = (projectId: string) => {
    setPf(projectId);
    setTab("tasks");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["7"], flexWrap: "wrap", gap: space["3"] }}>
        <p style={{ color: clr.textFaint, fontSize: "0.8rem" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        {canManage && <Btn color={clr.cyan} onClick={() => setProjectModal({})}>+ New Project</Btn>}
      </div>

      {projects.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No projects yet — click + New Project to get started.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: space["6"] }}>
        {projectsWithTasks.map(({ project, tasks: projTasks }) => (
          <ProjectCard
            key={project.id}
            project={project}
            projTasks={projTasks}
            canManage={canManage}
            onEdit={setProjectModal}
            onDelete={setConfirmDeleteProject}
            onViewTasks={handleViewTasks}
          />
        ))}
      </div>
    </div>
  );
};
