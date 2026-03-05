import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp, miniSel } from "../components/ui";
import { statusColor, prioColor } from "../constants/seeds";
import { todayStr, addDays } from "../utils/dateHelpers";


// ── Dep Selector — compact searchable multi-select ───────────────────────────
interface DepSelectorProps {
  candidates: import("../types").Task[];
  selected:   string[];
  onChange:   (ids: string[]) => void;
  disabled?:  boolean;
}

const statusIcon: Record<string, string> = {
  "done": "✓", "in-progress": "▶", "blocked": "⛔", "todo": "○",
};

const DepSelector = ({ candidates, selected, onChange, disabled }: DepSelectorProps) => {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((d) => d !== id) : [...selected, id]);

  const filtered = candidates.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  const selectedTasks = candidates.filter((t) => selected.includes(t.id));

  return (
    <div>
      <Lbl c="Depends on" />

      {/* Summary chip + open button */}
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.4rem 0.75rem", background: "#15152a",
          border: `1px solid ${open ? "#00d4ff60" : "#252540"}`,
          borderRadius: open ? "6px 6px 0 0" : "6px",
          cursor: disabled ? "default" : "pointer",
          minHeight: "36px", gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", flex: 1 }}>
          {selectedTasks.length === 0 ? (
            <span style={{ fontSize: "0.78rem", color: "#444" }}>
              {candidates.length === 0 ? "No other tasks in this project" : "None — click to add prerequisites"}
            </span>
          ) : (
            selectedTasks.map((t) => (
              <span key={t.id} style={{
                fontSize: "0.68rem", padding: "2px 7px", borderRadius: "20px",
                background: `${statusColor[t.status] || "#888"}20`,
                border: `1px solid ${statusColor[t.status] || "#888"}50`,
                color: statusColor[t.status] || "#888",
                display: "flex", alignItems: "center", gap: "3px",
              }}>
                {statusIcon[t.status]} {t.title}
                {!disabled && (
                  <span
                    onClick={(e) => { e.stopPropagation(); toggle(t.id); }}
                    style={{ marginLeft: "2px", cursor: "pointer", opacity: 0.6 }}
                  >✕</span>
                )}
              </span>
            ))
          )}
        </div>
        {candidates.length > 0 && (
          <span style={{ fontSize: "0.7rem", color: "#444", flexShrink: 0 }}>
            {open ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Dropdown list */}
      {open && candidates.length > 0 && (
        <div style={{
          background: "#0f0f1e", border: "1px solid #00d4ff60", borderTop: "none",
          borderRadius: "0 0 6px 6px", maxHeight: "200px", overflowY: "auto",
        }}>
          {/* Search box */}
          {candidates.length > 5 && (
            <div style={{ padding: "0.4rem 0.6rem", borderBottom: "1px solid #141428" }}>
              <input
                autoFocus
                placeholder="Search tasks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{ ...inp, fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              />
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ padding: "0.75rem", fontSize: "0.75rem", color: "#444", textAlign: "center" }}>No tasks match</div>
          )}

          {filtered.map((t) => {
            const sel = selected.includes(t.id);
            return (
              <div
                key={t.id}
                onClick={() => toggle(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.5rem 0.75rem",
                  background: sel ? `${statusColor[t.status] || "#888"}12` : "transparent",
                  borderBottom: "1px solid #141428",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "#15152a"; }}
                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Checkbox */}
                <div style={{
                  width: "14px", height: "14px", borderRadius: "3px", flexShrink: 0,
                  border: `1.5px solid ${sel ? statusColor[t.status] || "#888" : "#333"}`,
                  background: sel ? `${statusColor[t.status] || "#888"}30` : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", color: statusColor[t.status] || "#888",
                }}>
                  {sel ? "✓" : ""}
                </div>
                {/* Status icon */}
                <span style={{ fontSize: "0.72rem", width: "14px", textAlign: "center" }}>
                  {statusIcon[t.status]}
                </span>
                {/* Title */}
                <span style={{ fontSize: "0.78rem", color: sel ? "#e0e0e0" : "#aaa", flex: 1 }}>
                  {t.title}
                </span>
                {/* Status badge */}
                <span style={{
                  fontSize: "0.62rem", padding: "1px 6px", borderRadius: "3px",
                  background: `${statusColor[t.status] || "#888"}18`,
                  color: statusColor[t.status] || "#888",
                }}>
                  {t.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div style={{ marginTop: "4px", fontSize: "0.65rem", color: "#444" }}>
          {selected.length} prerequisite{selected.length !== 1 ? "s" : ""} — this task can't start until they're done
        </div>
      )}
    </div>
  );
};

export const TaskModal = () => {
  const { taskModal, setTaskModal, saveTask, tasks, projects, users, canManage } = useApp();

  const [f, setF] = useState({
    title:       "",
    projectId:   projects[0]?.id || "",
    assigneeId:  users[0]?.id    || "",
    startDate:   todayStr(),
    endDate:     addDays(todayStr(), 7),
    status:      "todo",
    priority:    "medium",
    description: "",
    dependsOn:   [] as string[],
  });

  useEffect(() => {
    if (!taskModal) return;
    const t = taskModal as Record<string, any>;
    setF({
      title:       t.title       || "",
      projectId:   t.projectId   || projects[0]?.id || "",
      assigneeId:  t.assigneeId  || users[0]?.id    || "",
      startDate:   t.startDate   || todayStr(),
      endDate:     t.endDate     || addDays(todayStr(), 7),
      status:      t.status      || "todo",
      priority:    t.priority    || "medium",
      description: t.description || "",
      dependsOn:   t.dependsOn   || [],
    });
  }, [taskModal, projects, users]);

  if (!taskModal) return null;
  const task = taskModal as Record<string, any>;

  const u = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({
      ...p,
      [k]: e.target.value,
      // Clear deps if project changes — they'd point to wrong project's tasks
      ...(k === "projectId" ? { dependsOn: [] } : {}),
    }));

  // Tasks in same project, excluding self — available as dependencies
  const depCandidates = tasks.filter(
    (t) => t.projectId === f.projectId && t.id !== task.id
  );

  return (
    <Overlay onClose={() => setTaskModal(null)} wide>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>
        {task.id ? "Edit Task" : "New Task"}
      </h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div><Lbl c="Title" /><input style={inp} value={f.title} onChange={u("title")} disabled={!canManage} /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div><Lbl c="Project" /><select style={inp} value={f.projectId} onChange={u("projectId")} disabled={!canManage}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><Lbl c="Assignee" /><select style={inp} value={f.assigneeId} onChange={u("assigneeId")} disabled={!canManage}>{users.map((u2) => <option key={u2.id} value={u2.id}>{u2.name}</option>)}</select></div>
          <div><Lbl c="Start Date" /><input type="date" style={inp} value={f.startDate} onChange={u("startDate")} disabled={!canManage} /></div>
          <div><Lbl c="End Date" /><input type="date" style={inp} value={f.endDate} onChange={u("endDate")} disabled={!canManage} /></div>
          <div>
            <Lbl c="Status" />
            <select style={{ ...inp, ...miniSel(statusColor[f.status] || "#888") }} value={f.status} onChange={u("status")}>
              <option value="todo"        style={{ background:"#0f0f1e", color:"#e0e0e0" }}>To Do</option>
              <option value="in-progress" style={{ background:"#0f0f1e", color:"#00d4ff" }}>In Progress</option>
              <option value="done"        style={{ background:"#0f0f1e", color:"#48bb78" }}>Done</option>
              <option value="blocked"     style={{ background:"#0f0f1e", color:"#fc8181" }}>Blocked</option>
            </select>
          </div>
          <div>
            <Lbl c="Priority" />
            <select style={{ ...inp, ...miniSel(prioColor[f.priority] || "#888") }} value={f.priority} onChange={u("priority")} disabled={!canManage}>
              <option value="low"    style={{ background:"#0f0f1e", color:"#e0e0e0" }}>Low</option>
              <option value="medium" style={{ background:"#0f0f1e", color:"#f6c90e" }}>Medium</option>
              <option value="high"   style={{ background:"#0f0f1e", color:"#fc8181" }}>High</option>
            </select>
          </div>
        </div>

        <div><Lbl c="Description" /><textarea style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={f.description} onChange={u("description")} /></div>

        {/* ── Depends On — searchable dropdown ── */}
        {f.projectId && (
          <DepSelector
            candidates={depCandidates}
            selected={f.dependsOn}
            onChange={(ids) => setF((p) => ({ ...p, dependsOn: ids }))}
            disabled={!canManage}
          />
        )}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={() => setTaskModal(null)}>Cancel</Btn>
        {canManage && (
          <Btn color="#00d4ff" onClick={() => saveTask({
            ...f,
            id: (task.id as string) || `t${Date.now()}`,
            status:   f.status   as any,
            priority: f.priority as any,
          })}>
            Save Task
          </Btn>
        )}
      </div>
    </Overlay>
  );
};
