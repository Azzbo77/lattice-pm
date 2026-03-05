import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Btn, TH, TD, UpdatedBadge, ConfirmModal, selStyle } from "../components/ui";
import { addDays, fmt, todayStr } from "../utils/dateHelpers";
import type { Supplier } from "../types";
import { bg, clr, font, radius, space } from "../constants/theme";

// ── Filter helpers ────────────────────────────────────────────────────────────
type Filter = "active" | "archived" | "overdue";

const isOverdue = (s: Supplier, now: string): boolean =>
  (s.orders || []).some((o) => !o.arrived && addDays(o.orderedDate, o.leadTimeDays) < now);

const applyFilter = (suppliers: Supplier[], filter: Filter, now: string): Supplier[] => {
  switch (filter) {
    case "active":   return suppliers.filter((s) => !s.archived);
    case "archived": return suppliers.filter((s) =>  s.archived);
    case "overdue":  return suppliers.filter((s) => !s.archived && isOverdue(s, now));
  }
};

// ── Collapsed summary bar ─────────────────────────────────────────────────────
const SupplierSummary = ({ supplier, now }: { supplier: Supplier; now: string }) => {
  const parts   = (supplier.parts  || []).length;
  const orders  = (supplier.orders || []).length;
  const pending = (supplier.orders || []).filter((o) => !o.arrived).length;
  const overdue = (supplier.orders || []).filter((o) => !o.arrived && addDays(o.orderedDate, o.leadTimeDays) < now).length;

  return (
    <div style={{ display: "flex", gap: space["5"], flexWrap: "wrap", alignItems: "center" }}>
      {[
        { label: "parts",          val: parts,   color: clr.cyan },
        { label: "orders",         val: orders,  color: clr.textMuted    },
        { label: "pending",        val: pending, color: clr.yellow },
        { label: "overdue",        val: overdue, color: clr.red, hide: overdue === 0 },
      ].filter((s) => !s.hide).map(({ label, val, color }) => (
        <span key={label} style={{ fontSize: "0.68rem", color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: radius.sm, padding: "1px 7px" }}>
          {val} {label}
        </span>
      ))}
    </div>
  );
};

// ── Individual supplier card ───────────────────────────────────────────────────
const SupplierCard = ({ supplier }: { supplier: Supplier }) => {
  const {
    canManage, setSupplierModal, setPartModal, setOrderModal,
    deletePart, toggleArrived, deleteSupplier, toggleArchiveSupplier,
  } = useApp();
  const now = todayStr();
  const [open,          setOpen]          = useState(false);
  const [openParts,     setOpenParts]     = useState(false);
  const [openOrders,    setOpenOrders]    = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div style={{
        background: bg.card,
        border: `1px solid ${supplier.archived ? bg.muted : bg.border}`,
        borderRadius: radius.xxl,
        marginBottom: space["6"],
        overflow: "hidden",
        opacity: supplier.archived ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}>
        {/* ── Header (always visible) ── */}
        <div
          onClick={() => setOpen((o) => !o)}
          style={{ padding: "0.85rem 1.25rem", background: bg.subtle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space["3"], cursor: "pointer", userSelect: "none" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: space["3"], marginBottom: radius.sm }}>
              <span style={{ fontSize: font.sm, color: open ? clr.cyan : clr.textGhost, transition: "color 0.15s" }}>
                {open ? "▾" : "▸"}
              </span>
              <span style={{ fontWeight: 600, color: supplier.archived ? clr.textFaint : clr.textPrimary, fontSize: font.h3 }}>
                {supplier.name}
              </span>
              {supplier.archived && (
                <span style={{ fontSize: font.xxs, color: clr.textFaint, background: bg.overlay, border: "1px solid #252540", borderRadius: radius.sm, padding: "1px 6px" }}>archived</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: space["5"], flexWrap: "wrap" }}>
              <span style={{ fontSize: font.base, color: clr.textFaint }}>{supplier.contact} · {supplier.phone}</span>
              <UpdatedBadge iso={supplier.updatedAt} byName={supplier.updatedBy} compact />
            </div>
            {!open && (
              <div style={{ marginTop: "5px" }}>
                <SupplierSummary supplier={supplier} now={now} />
              </div>
            )}
          </div>

          {/* Action buttons — stop propagation so clicks don't toggle accordion */}
          {canManage && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: space["2"], flexWrap: "wrap" }}>
              {!supplier.archived && (
                <>
                  <Btn color={clr.orange} small onClick={() => setSupplierModal(supplier)}>Edit</Btn>
                  <Btn color={clr.green} small onClick={() => setPartModal({ supplierId: supplier.id, part: {} })}>+ Part</Btn>
                  <Btn color={clr.cyan} small onClick={() => setOrderModal(supplier.id)}>+ Order</Btn>
                </>
              )}
              <Btn
                color={supplier.archived ? clr.green : clr.textMuted}
                small
                onClick={() => toggleArchiveSupplier(supplier.id)}
              >
                {supplier.archived ? "Restore" : "Archive"}
              </Btn>
              <Btn color={clr.red} small onClick={() => setConfirmDelete(true)}>Delete</Btn>
            </div>
          )}
        </div>

        {/* ── Expanded body ── */}
        {open && (
          <div>
            {/* Parts catalogue */}
            {(supplier.parts || []).length > 0 && (
              <div style={{ borderBottom: "1px solid #141428" }}>
                <div
                  onClick={() => setOpenParts((o) => !o)}
                  style={{ padding: "0.75rem 1.25rem", background: bg.subtle, display: "flex", alignItems: "center", gap: space["3"], cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ fontSize: font.sm, color: openParts ? clr.cyan : clr.textGhost, transition: "color 0.15s" }}>
                    {openParts ? "▾" : "▸"}
                  </span>
                  <div style={{ fontSize: space["5"], color: clr.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    Parts Catalogue
                  </div>
                  <span style={{ fontSize: "0.68rem", color: clr.textFaint, marginLeft: space["3"] }}>({supplier.parts?.length || 0})</span>
                </div>
                {openParts && (
                  <div style={{ padding: "0.75rem 1.25rem" }}>
                    <div style={{ background: bg.deep, borderRadius: radius.lg, overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}><div style={{ minWidth: "480px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.6fr 0.6fr auto", background: bg.subtle }}>
                          {["Part No.", "Description", "Qty", "Unit", ""].map((h, i) => <TH key={i}>{h}</TH>)}
                        </div>
                        {supplier.parts?.map((pt) => (
                          <div key={pt.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.6fr 0.6fr auto", alignItems: "center", padding: "0 0.5rem" }}>
                            <TD><span style={{ fontFamily: "monospace", fontSize: font.md, color: clr.cyan }}>{pt.partNumber}</span></TD>
                            <TD>{pt.description}</TD>
                            <TD>{pt.unitQty}</TD>
                            <TD>{pt.unit}</TD>
                            <TD style={{ display: "flex", gap: radius.sm }}>
                              {canManage && (
                                <>
                                  <button onClick={() => setPartModal({ supplierId: supplier.id, part: { ...pt, _existing: true } })} style={{ padding: "3px 7px", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.sm, color: clr.textMuted, fontSize: "0.7rem", cursor: "pointer" }}>Edit</button>
                                  <button onClick={() => deletePart(supplier.id, pt.id)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.sm, color: clr.red, fontSize: "0.7rem", cursor: "pointer" }}>✕</button>
                                </>
                              )}
                            </TD>
                          </div>
                        ))}
                      </div></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(supplier.parts || []).length === 0 && (
              <div style={{ padding: "0.6rem 1.25rem", borderBottom: "1px solid #141428", fontSize: font.md, color: clr.textGhost }}>
                No parts catalogued yet.
                {canManage && <button onClick={() => setPartModal({ supplierId: supplier.id, part: {} })} style={{ marginLeft: space["3"], background: "none", border: "none", color: clr.green, fontSize: font.md, cursor: "pointer" }}>+ Add one</button>}
              </div>
            )}

            {/* Orders */}
            {(supplier.orders || []).length > 0 && (
              <div>
                <div
                  onClick={() => setOpenOrders((o) => !o)}
                  style={{ padding: "0.75rem 1.25rem", background: bg.subtle, display: "flex", alignItems: "center", gap: space["3"], cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ fontSize: font.sm, color: openOrders ? clr.cyan : clr.textGhost, transition: "color 0.15s" }}>
                    {openOrders ? "▾" : "▸"}
                  </span>
                  <div style={{ fontSize: space["5"], color: clr.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    Orders
                  </div>
                  <span style={{ fontSize: "0.68rem", color: clr.textFaint, marginLeft: space["3"] }}>({supplier.orders?.length || 0})</span>
                </div>
                {openOrders && (
                  <div style={{ padding: "0.75rem 1.25rem" }}>
                    <div style={{ background: bg.deep, borderRadius: radius.lg, overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}><div style={{ minWidth: "640px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 1fr 1fr 0.8fr auto", background: bg.subtle }}>
                          {["Description", "Ordered", "Lead", "Est. Arrival", "Status", "Updated", ""].map((h, i) => <TH key={i}>{h}</TH>)}
                        </div>
                        {supplier.orders?.map((order) => {
                          const arrival = addDays(order.orderedDate, order.leadTimeDays);
                          const late    = !order.arrived && arrival < now;
                          return (
                            <div key={order.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 1fr 1fr 0.8fr auto", alignItems: "center", padding: "0 0.5rem" }}>
                              <TD>
                                <div style={{ fontSize: font.lg, color: clr.textPrimary }}>{order.description}</div>
                                {(order.partIds || []).length > 0 && (
                                  <div style={{ fontSize: font.xs, color: clr.textFaint, marginTop: "2px" }}>
                                    {(order.partIds || []).map((pid) => {
                                      const pt = supplier.parts?.find((p) => p.id === pid);
                                      return pt ? <span key={pid} style={{ marginRight: radius.sm, color: clr.cyan }}>{pt.partNumber}</span> : null;
                                    })}
                                  </div>
                                )}
                              </TD>
                              <TD style={{ fontSize: font.base, color: clr.textDim }}>{fmt(order.orderedDate)}</TD>
                              <TD style={{ fontSize: font.base, color: clr.textDim }}>{order.leadTimeDays}d</TD>
                              <TD style={{ fontSize: font.base, color: late ? clr.red : clr.textDim }}>{fmt(arrival)}</TD>
                              <TD>
                                {order.arrived
                                  ? <span style={{ fontSize: font.base, color: clr.green, background: "#48bb7818", padding: "2px 8px", borderRadius: radius.sm }}>✓ Arrived {order.arrivedDate ? fmt(order.arrivedDate) : ""}</span>
                                  : <span style={{ fontSize: font.base, color: late ? clr.red : clr.yellow, background: late ? "#fc818118" : "#f6c90e18", padding: "2px 8px", borderRadius: radius.sm }}>{late ? "Overdue" : "Pending"}</span>
                                }
                              </TD>
                              <TD><UpdatedBadge iso={order.updatedAt} byName={order.updatedBy} compact /></TD>
                              <TD>
                                {canManage && (
                                  <button onClick={() => toggleArrived(supplier.id, order.id)} style={{ padding: "3px 7px", background: order.arrived ? "#fc818115" : "#48bb7815", border: `1px solid ${order.arrived ? "#fc818150" : "#48bb7850"}`, borderRadius: radius.sm, color: order.arrived ? clr.red : clr.green, fontSize: "0.7rem", cursor: "pointer" }}>
                                    {order.arrived ? "Unmark" : "Mark Arrived"}
                                  </button>
                                )}
                              </TD>
                            </div>
                          );
                        })}
                      </div></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(supplier.orders || []).length === 0 && (
              <div style={{ padding: "0.6rem 1.25rem", fontSize: font.md, color: clr.textGhost }}>
                No orders yet.
                {canManage && <button onClick={() => setOrderModal(supplier.id)} style={{ marginLeft: space["3"], background: "none", border: "none", color: clr.cyan, fontSize: font.md, cursor: "pointer" }}>+ Place one</button>}
              </div>
            )}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`Permanently delete "${supplier.name}"? All parts, orders and BOM entries for this supplier will also be removed.`}
          onConfirm={() => { deleteSupplier(supplier.id); setConfirmDelete(false); }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export const SuppliersPage = () => {
  const { suppliers, canManage, setSupplierModal } = useApp();
  const [filter, setFilter] = useState<Filter>("active");
  const now = todayStr();

  const filtered  = applyFilter(suppliers, filter, now);
  const counts = {
    active:   suppliers.filter((s) => !s.archived).length,
    archived: suppliers.filter((s) =>  s.archived).length,
    overdue:  suppliers.filter((s) => !s.archived && isOverdue(s, now)).length,
  };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["6"], flexWrap: "wrap", gap: space["3"] }}>
        <div style={{ display: "flex", alignItems: "center", gap: space["5"], flexWrap: "wrap" }}>
          <p style={{ color: clr.textFaint, fontSize: "0.8rem" }}>Supplier catalogue, parts, and orders</p>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} style={selStyle}>
            <option value="active">Active ({counts.active})</option>
            <option value="archived">Archived ({counts.archived})</option>
            <option value="overdue">Overdue orders ({counts.overdue})</option>
          </select>
        </div>
        {canManage && <Btn color={clr.orange} onClick={() => setSupplierModal({})}>+ Add Supplier</Btn>}
      </div>

      {/* Empty states */}
      {filtered.length === 0 && filter === "active"   && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No active suppliers. {canManage && "Add one above."}</div>}
      {filtered.length === 0 && filter === "archived"  && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No archived suppliers.</div>}
      {filtered.length === 0 && filter === "overdue"   && <div style={{ padding: "2rem", textAlign: "center", color: clr.green }}>✓ No overdue orders.</div>}

      {/* Cards */}
      {filtered.map((supplier) => (
        <SupplierCard key={supplier.id} supplier={supplier} />
      ))}
    </div>
  );
};
