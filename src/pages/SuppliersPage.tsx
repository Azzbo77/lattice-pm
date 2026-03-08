import { useState } from "react";
import React from "react";
import { useApp } from "../context/AppContext";
import { Btn, TH, TD, UpdatedBadge, ConfirmModal, selStyle } from "../components/ui";
import { addDays, fmt, todayStr } from "../utils/dateHelpers";
import type { Supplier, Part, Order } from "../types";
import { useBreakpoint } from "../hooks/useBreakpoint";
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
const SupplierSummary = React.memo(({ supplier, now }: { supplier: Supplier; now: string }) => {
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
});
SupplierSummary.displayName = "SupplierSummary";

// ── Part row component ────────────────────────────────────────────────────────
interface PartRowProps {
  part: Part;
  supplierId: string;
  canSuppliers: boolean;
  onEdit: (supplierId: string, part: Part) => void;
  onDelete: (supplierId: string, partId: string) => void;
}

const PartRow = React.memo(({ part, supplierId, canSuppliers, onEdit, onDelete }: PartRowProps) => (
  <div style={{ display: "grid", gridTemplateColumns: "minmax(80px, 1fr) minmax(160px, 2fr) minmax(50px, 0.6fr) minmax(60px, 0.6fr) minmax(90px, auto)", alignItems: "center", padding: "0 0.5rem", justifyItems: "center" }}>
    <TD style={{ justifyContent: "flex-start" }}><span style={{ fontFamily: "monospace", fontSize: font.md, color: clr.cyan }}>{part.partNumber}</span></TD>
    <TD style={{ justifyContent: "flex-start" }}>{part.description}</TD>
    <TD center>{part.unitQty}</TD>
    <TD center>{part.unit}</TD>
    <TD center style={{ gap: radius.sm }}>
      {canSuppliers && (
        <>
          <button onClick={() => onEdit(supplierId, { ...part, _existing: true })} style={{ padding: "3px 7px", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.sm, color: clr.textMuted, fontSize: "0.7rem", cursor: "pointer" }} aria-label={`Edit part ${part.partNumber}`}>Edit</button>
          <button onClick={() => onDelete(supplierId, part.id)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.sm, color: clr.red, fontSize: "0.7rem", cursor: "pointer" }} aria-label={`Delete part ${part.partNumber}`}>✕</button>
        </>
      )}
    </TD>
  </div>
));
PartRow.displayName = "PartRow";

// ── Order row component ───────────────────────────────────────────────────────
interface OrderRowProps {
  order: Order;
  supplierParts: Part[];
  now: string;
  canSuppliers: boolean;
  onToggleArrived: (orderId: string) => void;
}

const OrderRow = React.memo(({ order, supplierParts, now, canSuppliers, onToggleArrived }: OrderRowProps) => {
  const arrival = addDays(order.orderedDate, order.leadTimeDays);
  const late = !order.arrived && arrival < now;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 2fr) minmax(90px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(100px, 0.8fr) minmax(100px, auto)", alignItems: "center", padding: "0 0.5rem", justifyItems: "center" }}>
      <TD style={{ justifyContent: "flex-start" }}>
        <div style={{ fontSize: font.lg, color: clr.textPrimary }}>{order.description}</div>
        {(order.partIds || []).length > 0 && (
          <div style={{ fontSize: font.xs, color: clr.textFaint, marginTop: "2px" }}>
            {(order.partIds || []).map((pid) => {
              const pt = supplierParts.find((p) => p.id === pid);
              return pt ? <span key={pid} style={{ marginRight: radius.sm, color: clr.cyan }}>{pt.partNumber}</span> : null;
            })}
          </div>
        )}
      </TD>
      <TD center style={{ fontSize: font.base, color: clr.textDim }}>{fmt(order.orderedDate)}</TD>
      <TD center style={{ fontSize: font.base, color: clr.textDim }}>{order.leadTimeDays}d</TD>
      <TD center style={{ fontSize: font.base, color: late ? clr.red : clr.textDim }}>{fmt(arrival)}</TD>
      <TD center>
        {order.arrived
          ? <span style={{ fontSize: font.base, color: clr.green, background: "#48bb7818", padding: "2px 8px", borderRadius: radius.sm }}>✓ Arrived {order.arrivedDate ? fmt(order.arrivedDate) : ""}</span>
          : <span style={{ fontSize: font.base, color: late ? clr.red : clr.yellow, background: late ? "#fc818118" : "#f6c90e18", padding: "2px 8px", borderRadius: radius.sm }}>{late ? "Overdue" : "Pending"}</span>
        }
      </TD>
      <TD center><UpdatedBadge iso={order.updatedAt} byName={order.updatedBy} compact /></TD>
      <TD center>
        {canSuppliers && (
          <button onClick={() => onToggleArrived(order.id)} style={{ padding: "3px 7px", background: order.arrived ? "#fc818115" : "#48bb7815", border: `1px solid ${order.arrived ? "#fc818150" : "#48bb7850"}`, borderRadius: radius.sm, color: order.arrived ? clr.red : clr.green, fontSize: "0.7rem", cursor: "pointer" }} aria-label={order.arrived ? `Mark order ${order.description} as not arrived` : `Mark order ${order.description} as arrived`}>
            {order.arrived ? "Unmark" : "Mark Arrived"}
          </button>
        )}
      </TD>
    </div>
  );
});
OrderRow.displayName = "OrderRow";

// ── Individual supplier card ───────────────────────────────────────────────────
const SupplierCard = React.memo(({ supplier }: { supplier: Supplier }) => {
  const { isMobile } = useBreakpoint();
  const {
    canSuppliers, setSupplierModal, setPartModal, setOrderModal,
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
          style={{ padding: "0.85rem 1.25rem", background: bg.subtle, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: space["3"], cursor: "pointer", userSelect: "none" }}
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
          {canSuppliers && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: space["2"], flexWrap: "wrap" }}>
              {!supplier.archived && (
                <>
                  <Btn color={clr.orange} small onClick={() => setSupplierModal(supplier)} aria-label={`Edit supplier ${supplier.name}`}>Edit</Btn>
                  <Btn color={clr.green} small onClick={() => setPartModal({ supplierId: supplier.id, part: {} })} aria-label={`Add part to ${supplier.name}`}>+ Part</Btn>
                  <Btn color={clr.cyan} small onClick={() => setOrderModal(supplier.id)} aria-label={`Add order to ${supplier.name}`}>+ Order</Btn>
                </>
              )}
              <Btn
                color={supplier.archived ? clr.green : clr.textMuted}
                small
                onClick={async () => toggleArchiveSupplier(supplier.id)}
                aria-label={supplier.archived ? `Restore supplier ${supplier.name}` : `Archive supplier ${supplier.name}`}
              >
                {supplier.archived ? "Restore" : "Archive"}
              </Btn>
              <Btn color={clr.red} small onClick={() => setConfirmDelete(true)} aria-label={`Delete supplier ${supplier.name}`}>Delete</Btn>
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
                      <div style={{ overflowX: "auto" }}><div style={{ minWidth: isMobile ? "340px" : "480px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(80px, 1fr) minmax(160px, 2fr) minmax(50px, 0.6fr) minmax(60px, 0.6fr) minmax(90px, auto)", background: bg.subtle, padding: "0 0.5rem", justifyItems: "center", alignItems: "center" }}>
                          {["Part No.", "Description", "Qty", "Unit", ""].map((h, i) => <TH key={i} center={i >= 2}>{h}</TH>)}
                        </div>
                        {supplier.parts?.map((pt) => (
                          <PartRow
                            key={pt.id}
                            part={pt}
                            supplierId={supplier.id}
                            canSuppliers={canSuppliers}
                            onEdit={(id, part) => setPartModal({ supplierId: id, part: { ...part, _existing: true } })}
                            onDelete={deletePart}
                          />
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
                {canSuppliers && <button onClick={() => setPartModal({ supplierId: supplier.id, part: {} })} style={{ marginLeft: space["3"], background: "none", border: "none", color: clr.green, fontSize: font.md, cursor: "pointer" }} aria-label={`Add part to ${supplier.name}`}>+ Add one</button>}
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
                      <div style={{ overflowX: "auto" }}><div style={{ minWidth: isMobile ? "420px" : "640px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 2fr) minmax(90px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(100px, 0.8fr) minmax(100px, auto)", background: bg.subtle, padding: "0 0.5rem", justifyItems: "center", alignItems: "center" }}>
                          {["Description", "Ordered", "Lead", "Est. Arrival", "Status", "Updated", ""].map((h, i) => <TH key={i} center={i >= 1}>{h}</TH>)}
                        </div>
                        {supplier.orders?.map((order) => (
                          <OrderRow
                            key={order.id}
                            order={order}
                            supplierParts={supplier.parts || []}
                            now={now}
                            canSuppliers={canSuppliers}
                            onToggleArrived={(orderId) => toggleArrived(supplier.id, orderId)}
                          />
                        ))}
                      </div></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(supplier.orders || []).length === 0 && (
              <div style={{ padding: "0.6rem 1.25rem", fontSize: font.md, color: clr.textGhost }}>
                No orders yet.
                {canSuppliers && <button onClick={() => setOrderModal(supplier.id)} style={{ marginLeft: space["3"], background: "none", border: "none", color: clr.cyan, fontSize: font.md, cursor: "pointer" }} aria-label={`Add order to ${supplier.name}`}>+ Place one</button>}
              </div>
            )}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`Permanently delete "${supplier.name}"? All parts, orders and BOM entries for this supplier will also be removed.`}
          onConfirm={async () => { deleteSupplier(supplier.id); setConfirmDelete(false); }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
});
SupplierCard.displayName = "SupplierCard";

// ── Page ──────────────────────────────────────────────────────────────────────
export const SuppliersPage = () => {
  const { suppliers, canSuppliers, setSupplierModal } = useApp();
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
        {canSuppliers && <Btn color={clr.orange} onClick={() => setSupplierModal({})}>+ Add Supplier</Btn>}
      </div>

      {/* Empty states */}
      {filtered.length === 0 && filter === "active"   && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No active suppliers. {canSuppliers && "Add one above."}</div>}
      {filtered.length === 0 && filter === "archived"  && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No archived suppliers.</div>}
      {filtered.length === 0 && filter === "overdue"   && <div style={{ padding: "2rem", textAlign: "center", color: clr.green }}>✓ No overdue orders.</div>}

      {/* Cards */}
      {filtered.map((supplier) => (
        <SupplierCard key={supplier.id} supplier={supplier} />
      ))}
    </div>
  );
};
