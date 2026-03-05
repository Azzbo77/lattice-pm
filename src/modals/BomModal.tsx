import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp } from "../components/ui";
import { bomStatusMeta } from "../constants/seeds";
import { todayStr, addDays } from "../utils/dateHelpers";

export const BomModal = () => {
  const { bomModal, setBomModal, saveBomEntry, suppliers, projects, tasks } = useApp();

  const [f, setF] = useState({
    qtyOrdered: 1,
    status:     "pending",
    notes:      "",
    project:    "",   // legacy label kept for compatibility
    projectId:  "",
    taskId:     "",
  });

  useEffect(() => {
    if (!bomModal) return;
    const { entry } = bomModal;
    setF({
      qtyOrdered: entry.qtyOrdered ?? 1,
      status:     entry.status    || "pending",
      notes:      entry.notes     || "",
      project:    entry.project   || "",
      projectId:  entry.projectId || "",
      taskId:     entry.taskId    || "",
    });
  }, [bomModal]);

  if (!bomModal) return null;
  const { entry, partId, supplierId } = bomModal;
  const supplier = suppliers.find((s) => s.id === supplierId);
  const part     = (supplier?.parts || []).find((p) => p.id === partId);

  const u = (k: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({
      ...p,
      [k]: e.target.value,
      // Clear taskId when project changes
      ...(k === "projectId" ? { taskId: "" } : {}),
    }));

  const meta = bomStatusMeta[f.status as keyof typeof bomStatusMeta];

  // Tasks in the selected project
  const projectTasks = f.projectId
    ? tasks.filter((t) => t.projectId === f.projectId)
    : [];

  // Linked task for alert display
  const linkedTask   = tasks.find((t) => t.id === f.taskId);
  const now          = todayStr();
  const taskOverdue  = linkedTask && linkedTask.status !== "done" && linkedTask.endDate < now;

  // Check if part has any delayed orders
  const delayedOrders = (supplier?.orders || []).filter((o) =>
    !o.arrived && addDays(o.orderedDate, o.leadTimeDays) < now &&
    (o.partIds || []).includes(partId)
  );

  return (
    <Overlay onClose={() => setBomModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "0.25rem" }}>BOM Entry</h3>
      <div style={{ marginBottom: "1.25rem", fontSize: "0.78rem", color: "#555" }}>
        {supplier?.name} — <span style={{ color: "#00d4ff", fontFamily: "monospace" }}>{part?.partNumber}</span>
      </div>

      {/* Part info */}
      <div style={{ padding: "0.75rem", background: "#15152a", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #252540" }}>
        <div style={{ fontSize: "0.72rem", color: "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Part</div>
        <div style={{ color: "#e0e0e0", fontSize: "0.88rem", fontWeight: 600 }}>{part?.description}</div>
        <div style={{ fontSize: "0.72rem", color: "#666", marginTop: "4px" }}>Unit: {part?.unitQty} × {part?.unit} per order</div>
      </div>

      {/* Alerts */}
      {taskOverdue && (
        <div style={{ padding: "0.6rem 0.75rem", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "6px", marginBottom: "0.75rem", fontSize: "0.75rem", color: "#fc8181" }}>
          ⚠ Linked task <strong>"{linkedTask.title}"</strong> is overdue — check if this part is still needed on schedule.
        </div>
      )}
      {delayedOrders.length > 0 && (
        <div style={{ padding: "0.6rem 0.75rem", background: "#f6c90e15", border: "1px solid #f6c90e50", borderRadius: "6px", marginBottom: "0.75rem", fontSize: "0.75rem", color: "#f6c90e" }}>
          ⚠ {delayedOrders.length} overdue order{delayedOrders.length !== 1 ? "s" : ""} for this part — delivery may be delayed.
        </div>
      )}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <Lbl c="Qty Ordered" />
            <input type="number" style={inp} value={f.qtyOrdered} onChange={u("qtyOrdered")} min="0" />
            {part && <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "4px" }}>= {(parseInt(f.qtyOrdered as unknown as string) || 0) * (part.unitQty || 1)} {part.unit}(s) total</div>}
          </div>
          <div>
            <Lbl c="Usage Status" />
            <select
              style={{ ...inp, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}55` }}
              value={f.status}
              onChange={u("status")}
            >
              {Object.entries(bomStatusMeta).map(([k, v]) => (
                <option key={k} value={k} style={{ background: "#0a0a18", color: "#e0e0e0" }}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Project + Task linking */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <Lbl c="Linked Project" />
            <select style={inp} value={f.projectId} onChange={u("projectId")}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Lbl c="Linked Task" />
            <select style={inp} value={f.taskId} onChange={u("taskId")} disabled={!f.projectId}>
              <option value="">— None —</option>
              {projectTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.status === "done" ? "✓ " : t.status === "blocked" ? "⛔ " : ""}{t.title}
                </option>
              ))}
            </select>
            {!f.projectId && <div style={{ fontSize: "0.65rem", color: "#444", marginTop: "3px" }}>Select a project first</div>}
          </div>
        </div>

        {/* Linked task status indicator */}
        {linkedTask && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "#15152a", borderRadius: "6px", fontSize: "0.75rem" }}>
            <span style={{ color: "#555" }}>Task status:</span>
            <span style={{
              padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem",
              background: linkedTask.status === "done" ? "#48bb7820" : linkedTask.status === "blocked" ? "#fc818120" : "#f6c90e20",
              color:      linkedTask.status === "done" ? "#48bb78"   : linkedTask.status === "blocked" ? "#fc8181"   : "#f6c90e",
              border:     `1px solid ${linkedTask.status === "done" ? "#48bb7850" : linkedTask.status === "blocked" ? "#fc818150" : "#f6c90e50"}`,
            }}>
              {linkedTask.status}
            </span>
            <span style={{ color: "#555" }}>due {linkedTask.endDate}</span>
          </div>
        )}

        <div><Lbl c="Engineering Notes / CI Suggestions" />
          <textarea style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={f.notes} onChange={u("notes")} placeholder="e.g. Part worked well but consider higher-spec alternative for next revision…" />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={() => setBomModal(null)}>Cancel</Btn>
        <Btn color="#00d4ff" onClick={() => saveBomEntry({
          ...entry, ...f,
          qtyOrdered: parseInt(f.qtyOrdered as unknown as string) || 0,
          status: f.status as any,
          // Keep legacy project label in sync with selected project name
          project: f.projectId ? (projects.find((p) => p.id === f.projectId)?.name || f.project) : f.project,
        })}>Save</Btn>
      </div>
    </Overlay>
  );
};
