import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp, miniSel } from "../components/ui";
import { statusColor, prioColor } from "../constants/seeds";
import { todayStr, addDays } from "../utils/dateHelpers";

export const TaskModal = () => {
  const { taskModal, setTaskModal, saveTask, projects, users, canManage } = useApp();

  const [f, setF] = useState({
    title:      "",
    projectId:  projects[0]?.id || "",
    assigneeId: users[0]?.id    || "",
    startDate:  todayStr(),
    endDate:    addDays(todayStr(), 7),
    status:     "todo",
    priority:   "medium",
    description:"",
  });

  useEffect(() => {
    if (!taskModal) return;
    const modalTask = taskModal as Record<string, any>;
    setF({
      title:      modalTask.title      || "",
      projectId:  modalTask.projectId  || projects[0]?.id || "",
      assigneeId: modalTask.assigneeId || users[0]?.id    || "",
      startDate:  modalTask.startDate  || todayStr(),
      endDate:    modalTask.endDate    || addDays(todayStr(), 7),
      status:     modalTask.status     || "todo",
      priority:   modalTask.priority   || "medium",
      description:modalTask.description|| "",
    });
  }, [taskModal, projects, users]);

  if (!taskModal) return null;
  const task = taskModal as Record<string, any>;

  const u = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Overlay onClose={() => setTaskModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>
        {task.id ? "Edit Task" : "New Task"}
      </h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div><Lbl c="Title" /><input style={inp} value={f.title as string} onChange={u("title")} disabled={!canManage} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div><Lbl c="Project" /><select style={inp} value={f.projectId as string} onChange={u("projectId")} disabled={!canManage}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><Lbl c="Assignee" /><select style={inp} value={f.assigneeId as string} onChange={u("assigneeId")} disabled={!canManage}>{users.map((u2) => <option key={u2.id} value={u2.id}>{u2.name}</option>)}</select></div>
          <div><Lbl c="Start Date" /><input type="date" style={inp} value={f.startDate as string} onChange={u("startDate")} disabled={!canManage} /></div>
          <div><Lbl c="End Date" /><input type="date" style={inp} value={f.endDate as string} onChange={u("endDate")} disabled={!canManage} /></div>
          <div><Lbl c="Status" /><select style={{ ...inp, ...miniSel(statusColor[f.status as string] || "#888") }} value={f.status as string} onChange={u("status")}><option value="todo" style={{ background:"#0f0f1e",color:"#e0e0e0" }}>To Do</option><option value="in-progress" style={{ background:"#0f0f1e",color:"#00d4ff" }}>In Progress</option><option value="done" style={{ background:"#0f0f1e",color:"#48bb78" }}>Done</option><option value="blocked" style={{ background:"#0f0f1e",color:"#fc8181" }}>Blocked</option></select></div>
          <div><Lbl c="Priority" /><select style={{ ...inp, ...miniSel(prioColor[f.priority as string] || "#888") }} value={f.priority as string} onChange={u("priority")} disabled={!canManage}><option value="low" style={{ background:"#0f0f1e",color:"#e0e0e0" }}>Low</option><option value="medium" style={{ background:"#0f0f1e",color:"#f6c90e" }}>Medium</option><option value="high" style={{ background:"#0f0f1e",color:"#fc8181" }}>High</option></select></div>
        </div>
        <div><Lbl c="Description" /><textarea style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={f.description as string} onChange={u("description")} /></div>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={() => setTaskModal(null)}>Cancel</Btn>
        <Btn color="#00d4ff" onClick={() => saveTask({ ...f, id: (task.id as string) || `t${Date.now()}`, status: f.status as any, priority: f.priority as any })}>Save Task</Btn>
      </div>
    </Overlay>
  );
};
