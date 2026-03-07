import { useEffect, useState } from "react";
import type { Supplier } from "../types";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp } from "../components/ui";
import { todayStr, addDays, fmt } from "../utils/dateHelpers";
import { bg, clr, font, radius, space } from "../constants/theme";

// ── Supplier ──────────────────────────────────────────────────────────────────
export const SupplierModal = () => {
  const { supplierModal, setSupplierModal, saveSupplier } = useApp();

  const [f, setF] = useState({ name: "", contact: "", phone: "" });

  useEffect(() => {
    if (!supplierModal) return;
    const modalSupplier = supplierModal as Record<string, any>;
    setF({
      name: modalSupplier.name || "",
      contact: modalSupplier.contact || "",
      phone: modalSupplier.phone || "",
    });
  }, [supplierModal]);

  if (!supplierModal) return null;
  const supplier = supplierModal as Record<string, any>;

  const u = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <Overlay onClose={() => setSupplierModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: font.h2, color: clr.textPrimary, marginBottom: space["7"] }}>
        {supplier.id ? "Edit Supplier" : "Add Supplier"}
      </h3>
      <div style={{ display: "grid", gap: space["5"] }}>
        <div><Lbl c="Company Name" /><input style={inp} value={f.name as string} onChange={u("name")} /></div>
        <div><Lbl c="Email" /><input style={inp} value={f.contact as string} onChange={u("contact")} /></div>
        <div><Lbl c="Phone" /><input style={inp} value={f.phone as string} onChange={u("phone")} /></div>
      </div>
      <div style={{ display: "flex", gap: font.xxs, justifyContent: "flex-end", marginTop: space["7"] }}>
        <Btn color="ghost" onClick={() => setSupplierModal(null)}>Cancel</Btn>
        <Btn color={clr.orange} onClick={async () => saveSupplier({ ...f, id: supplier.id || "", parts: (supplier.parts as any) || [], orders: (supplier.orders as any) || [] })}>Save</Btn>
      </div>
    </Overlay>
  );
};

// ── Part ──────────────────────────────────────────────────────────────────────
export const PartModal = () => {
  const { partModal, setPartModal, savePart } = useApp();

  const [f, setF] = useState({ partNumber: "", description: "", unitQty: "1", unit: "ea" });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!partModal) return;
    const { part } = partModal;
    setF({
      partNumber: part.partNumber || "",
      description: part.description || "",
      unitQty: String(part.unitQty || 1),
      unit: part.unit || "ea",
    });
    setErr("");
  }, [partModal]);

  if (!partModal) return null;
  const { supplierId, part } = partModal;

  const u = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!f.partNumber.trim()) return setErr("Part number is required.");
    if (!f.description.trim()) return setErr("Description is required.");
    savePart(supplierId, { ...f, id: part.id || "", unitQty: parseInt(f.unitQty) || 1 });
  };

  return (
    <Overlay onClose={() => setPartModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: font.h2, color: clr.textPrimary, marginBottom: space["7"] }}>
        {part.id ? "Edit Part" : "Add Part to Catalogue"}
      </h3>
      <div style={{ display: "grid", gap: space["5"] }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space["5"] }}>
          <div><Lbl c="Part Number" /><input style={inp} value={f.partNumber} onChange={u("partNumber")} placeholder="e.g. TP-SRV-001" /></div>
          <div><Lbl c="Unit Qty per Order" /><input type="number" style={inp} value={f.unitQty} onChange={u("unitQty")} min="1" /></div>
        </div>
        <div><Lbl c="Description" /><input style={inp} value={f.description} onChange={u("description")} /></div>
        <div>
          <Lbl c="Unit Type" />
          <select style={inp} value={f.unit} onChange={u("unit")}>
            {["ea","box","pack","roll","set","kit","metre","litre","kg","licence","clips","other"].map((u2) => (
              <option key={u2} value={u2} style={{ background:bg.card,color:clr.textPrimary }}>{u2}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: font.md, color: clr.textFaint, padding: "0.5rem 0.75rem", background: bg.raised, borderRadius: radius.md }}>
          e.g. order 1 box containing 10 cables → <strong style={{ color: clr.textMuted }}>Unit Qty = 10</strong>, <strong style={{ color: clr.textMuted }}>Unit = box</strong>
        </div>
      </div>
      {err && <div style={{ marginTop: space["5"], color: clr.red, fontSize: "0.8rem" }}>{err}</div>}
      <div style={{ display: "flex", gap: font.xxs, justifyContent: "flex-end", marginTop: space["7"] }}>
        <Btn color="ghost" onClick={() => setPartModal(null)}>Cancel</Btn>
        <Btn color={clr.cyan} onClick={save}>{part.id ? "Save Part" : "Add Part"}</Btn>
      </div>
    </Overlay>
  );
};

// ── Order ─────────────────────────────────────────────────────────────────────
export const OrderModal = () => {
  const { orderModal, setOrderModal, addOrder, suppliers } = useApp();
  
  const [f, setF] = useState<{ description: string; orderedDate: string; leadTimeDays: string | number; partIds: string[] }>({ description: "", orderedDate: todayStr(), leadTimeDays: "14", partIds: [] });
  
  if (!orderModal) return null;
  const supplierId = orderModal;
  const supplier = (suppliers.find((s) => s.id === supplierId) || {}) as Partial<Supplier>;
  
  const u = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const togglePart = (id: string) => setF((p) => ({ ...p, partIds: p.partIds.includes(id) ? p.partIds.filter((x: string) => x !== id) : [...p.partIds, id] }));
  const arrival = addDays(f.orderedDate, parseInt(String(f.leadTimeDays)) || 0);

  return (
    <Overlay onClose={() => setOrderModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: font.h2, color: clr.textPrimary, marginBottom: space["7"] }}>
        New Order — {supplier.name}
      </h3>
      <div style={{ display: "grid", gap: space["5"] }}>
        <div><Lbl c="Order Description" /><input style={inp} value={f.description} onChange={u("description")} placeholder="e.g. Q1 hardware batch" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space["5"] }}>
          <div><Lbl c="Order Date" /><input type="date" style={inp} value={f.orderedDate} onChange={u("orderedDate")} /></div>
          <div><Lbl c="Lead Time (days)" /><input type="number" style={inp} value={f.leadTimeDays} onChange={u("leadTimeDays")} min="1" /></div>
        </div>
        <div style={{ fontSize: "0.8rem", color: clr.textDim }}>Est. arrival: <span style={{ color: clr.green }}>{fmt(arrival)}</span></div>
        {(supplier.parts || []).length > 0 && (
          <div>
            <Lbl c="Parts Included" />
            {(supplier.parts || []).map((pt) => (
              <label key={pt.id} style={{ display: "flex", alignItems: "center", gap: font.xxs, padding: "0.5rem 0.75rem", background: f.partIds.includes(pt.id) ? bg.raised : "#0d0d1e", border: `1px solid ${f.partIds.includes(pt.id) ? "#252550" : bg.overlay}`, borderRadius: radius.md, cursor: "pointer", marginBottom: radius.sm }}>
                <input type="checkbox" checked={f.partIds.includes(pt.id)} onChange={() => togglePart(pt.id)} style={{ accentColor: clr.cyan, width: "14px", height: "14px" }} />
                <span style={{ fontSize: font.md, color: clr.cyan, fontFamily: "monospace" }}>{pt.partNumber}</span>
                <span style={{ fontSize: font.md, color: "#aaa" }}>{pt.description}</span>
                <span style={{ fontSize: "0.7rem", color: clr.textFaint, marginLeft: "auto" }}>×{pt.unitQty} {pt.unit}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: font.xxs, justifyContent: "flex-end", marginTop: space["7"] }}>
        <Btn color="ghost" onClick={() => setOrderModal(null)}>Cancel</Btn>
        <Btn color={clr.green} onClick={async () => addOrder(supplierId || "", { ...f, id: "", leadTimeDays: parseInt(f.leadTimeDays as string) || 14, arrived: false, arrivedDate: null })}>Add Order</Btn>
      </div>
    </Overlay>
  );
};
