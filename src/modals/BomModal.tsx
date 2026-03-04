import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp } from "../components/ui";
import { bomStatusMeta } from "../constants/seeds";

export const BomModal = () => {
  const { bomModal, setBomModal, saveBomEntry, suppliers } = useApp();
  
  const [f, setF] = useState({
    qtyOrdered: 1,
    status:     "pending",
    notes:      "",
    project:    "",
  });
  
  if (!bomModal) return null;
  const { entry, partId, supplierId } = bomModal;
  const supplier = suppliers.find((s) => s.id === supplierId);
  const part     = (supplier?.parts || []).find((p) => p.id === partId);

  // Initialize state from entry if it exists
  if (entry && (f.qtyOrdered === 1 && f.status === "pending" && !f.notes && !f.project)) {
    setF({
      qtyOrdered: entry.qtyOrdered ?? 1,
      status:     entry.status    || "pending",
      notes:      entry.notes     || "",
      project:    entry.project   || "",
    });
  }

  const u = (k: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const meta = bomStatusMeta[f.status as keyof typeof bomStatusMeta];

  return (
    <Overlay onClose={() => setBomModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "0.25rem" }}>BOM Entry</h3>
      <div style={{ marginBottom: "1.25rem", fontSize: "0.78rem", color: "#555" }}>
        {supplier?.name} — <span style={{ color: "#00d4ff", fontFamily: "monospace" }}>{part?.partNumber}</span>
      </div>

      <div style={{ padding: "0.75rem", background: "#15152a", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #252540" }}>
        <div style={{ fontSize: "0.72rem", color: "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Part</div>
        <div style={{ color: "#e0e0e0", fontSize: "0.88rem", fontWeight: 600 }}>{part?.description}</div>
        <div style={{ fontSize: "0.72rem", color: "#666", marginTop: "4px" }}>Unit: {part?.unitQty} × {part?.unit} per order</div>
      </div>

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
        <div><Lbl c="Project / Assembly" /><input style={inp} value={f.project} onChange={u("project")} placeholder="e.g. Server Room Build, Phase 1" /></div>
        <div>
          <Lbl c="Engineering Notes / CI Suggestions" />
          <textarea style={{ ...inp, minHeight: "90px", resize: "vertical" }} value={f.notes} onChange={u("notes")} placeholder="e.g. Part worked well but consider higher-spec alternative for next revision…" />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={() => setBomModal(null)}>Cancel</Btn>
        <Btn color="#00d4ff" onClick={() => saveBomEntry({ ...entry, ...f, qtyOrdered: parseInt(f.qtyOrdered as unknown as string) || 0, status: f.status as any })}>Save</Btn>
      </div>
    </Overlay>
  );
};
