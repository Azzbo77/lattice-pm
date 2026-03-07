import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp, miniSel } from "../components/ui";
import { statusColor, prioColor } from "../constants/seeds";
import { todayStr, addDays } from "../utils/dateHelpers";
import { bg, clr, font, radius, space } from "../constants/theme";


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
          padding: "0.4rem 0.75rem", background: bg.raised,
          border: `1px solid ${open ? "#00d4ff60" : bg.muted}`,
          borderRadius: open ? "6px 6px 0 0" : radius.md,
          cursor: disabled ? "default" : "pointer",
          minHeight: "36px", gap: space["3"],
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: radius.sm, flex: 1 }}>
          {selectedTasks.length === 0 ? (
            <span style={{ fontSize: font.md, color: clr.textGhost }}>
              {candidates.length === 0 ? "No other tasks in this project" : "None — click to add prerequisites"}
            </span>
          ) : (
            selectedTasks.map((t) => (
              <span key={t.id} style={{
                fontSize: "0.68rem", padding: "2px 7px", borderRadius: radius.pill,
                background: `${statusColor[t.status] || clr.textMuted}20`,
                border: `1px solid ${statusColor[t.status] || clr.textMuted}50`,
                color: statusColor[t.status] || clr.textMuted,
                display: "flex", alignItems: "center", gap: radius.xs,
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
          <span style={{ fontSize: "0.7rem", color: clr.textGhost, flexShrink: 0 }}>
            {open ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Dropdown list */}
      {open && candidates.length > 0 && (
        <div style={{
          background: bg.card, border: "1px solid #00d4ff60", borderTop: "none",
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
                style={{ ...inp, fontSize: space["5"], padding: "0.25rem 0.5rem" }}
              />
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ padding: space["5"], fontSize: space["5"], color: clr.textGhost, textAlign: "center" }}>No tasks match</div>
          )}

          {filtered.map((t) => {
            const sel = selected.includes(t.id);
            return (
              <div
                key={t.id}
                onClick={() => toggle(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: font.xxs,
                  padding: "0.5rem 0.75rem",
                  background: sel ? `${statusColor[t.status] || clr.textMuted}12` : "transparent",
                  borderBottom: "1px solid #141428",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = bg.raised; }}
                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Checkbox */}
                <div style={{
                  width: "14px", height: "14px", borderRadius: radius.xs, flexShrink: 0,
                  border: `1.5px solid ${sel ? statusColor[t.status] || clr.textMuted : clr.textDeep}`,
                  background: sel ? `${statusColor[t.status] || clr.textMuted}30` : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: font.xxs, color: statusColor[t.status] || clr.textMuted,
                }}>
                  {sel ? "✓" : ""}
                </div>
                {/* Status icon */}
                <span style={{ fontSize: font.base, width: "14px", textAlign: "center" }}>
                  {statusIcon[t.status]}
                </span>
                {/* Title */}
                <span style={{ fontSize: font.md, color: sel ? clr.textPrimary : "#aaa", flex: 1 }}>
                  {t.title}
                </span>
                {/* Status badge */}
                <span style={{
                  fontSize: font.xs, padding: "1px 6px", borderRadius: radius.xs,
                  background: `${statusColor[t.status] || clr.textMuted}18`,
                  color: statusColor[t.status] || clr.textMuted,
                }}>
                  {t.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div style={{ marginTop: radius.sm, fontSize: font.sm, color: clr.textGhost }}>
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
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: font.h2, color: clr.textPrimary, marginBottom: space["7"] }}>
        {task.id ? "Edit Task" : "New Task"}
      </h3>
      <div style={{ display: "grid", gap: space["5"] }}>
        <div><Lbl c="Title" /><input style={inp} value={f.title} onChange={u("title")} disabled={!canManage} /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space["5"] }}>
          <div><Lbl c="Project" /><select style={inp} value={f.projectId} onChange={u("projectId")} disabled={!canManage}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><Lbl c="Assignee" /><select style={inp} value={f.assigneeId} onChange={u("assigneeId")} disabled={!canManage}>{users.map((u2) => <option key={u2.id} value={u2.id}>{u2.name}</option>)}</select></div>
          <div><Lbl c="Start Date" /><input type="date" style={inp} value={f.startDate} onChange={u("startDate")} disabled={!canManage} /></div>
          <div><Lbl c="End Date" /><input type="date" style={inp} value={f.endDate} onChange={u("endDate")} disabled={!canManage} /></div>
          <div>
            <Lbl c="Status" />
            <select style={{ ...inp, ...miniSel(statusColor[f.status] || clr.textMuted) }} value={f.status} onChange={u("status")}>
              <option value="todo"        style={{ background:bg.card, color:clr.textPrimary }}>To Do</option>
              <option value="in-progress" style={{ background:bg.card, color:clr.cyan }}>In Progress</option>
              <option value="done"        style={{ background:bg.card, color:clr.green }}>Done</option>
              <option value="blocked"     style={{ background:bg.card, color:clr.red }}>Blocked</option>
            </select>
          </div>
          <div>
            <Lbl c="Priority" />
            <select style={{ ...inp, ...miniSel(prioColor[f.priority] || clr.textMuted) }} value={f.priority} onChange={u("priority")} disabled={!canManage}>
              <option value="low"    style={{ background:bg.card, color:clr.textPrimary }}>Low</option>
              <option value="medium" style={{ background:bg.card, color:clr.yellow }}>Medium</option>
              <option value="high"   style={{ background:bg.card, color:clr.red }}>High</option>
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

      <div style={{ display: "flex", gap: font.xxs, justifyContent: "flex-end", marginTop: space["7"] }}>
        <Btn color="ghost" onClick={() => setTaskModal(null)}>Cancel</Btn>
        {canManage && (
          <Btn color={clr.cyan} onClick={async () => saveTask({
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
