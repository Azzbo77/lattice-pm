import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Btn, TH, TD, UpdatedBadge, ConfirmModal, selStyle } from "../components/ui";
import { addDays, fmt, todayStr } from "../utils/dateHelpers";
import type { Supplier } from "../types";

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
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
      {[
        { label: "parts",          val: parts,   color: "#00d4ff" },
        { label: "orders",         val: orders,  color: "#888"    },
        { label: "pending",        val: pending, color: "#f6c90e" },
        { label: "overdue",        val: overdue, color: "#fc8181", hide: overdue === 0 },
      ].filter((s) => !s.hide).map(({ label, val, color }) => (
        <span key={label} style={{ fontSize: "0.68rem", color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: "4px", padding: "1px 7px" }}>
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
        background: "#0f0f1e",
        border: `1px solid ${supplier.archived ? "#252530" : "#1e1e35"}`,
        borderRadius: "12px",
        marginBottom: "1rem",
        overflow: "hidden",
        opacity: supplier.archived ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}>
        {/* ── Header (always visible) ── */}
        <div
          onClick={() => setOpen((o) => !o)}
          style={{ padding: "0.85rem 1.25rem", background: "#0d0d20", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.65rem", color: open ? "#00d4ff" : "#444", transition: "color 0.15s" }}>
                {open ? "▾" : "▸"}
              </span>
              <span style={{ fontWeight: 600, color: supplier.archived ? "#555" : "#e0e0e0", fontSize: "0.95rem" }}>
                {supplier.name}
              </span>
              {supplier.archived && (
                <span style={{ fontSize: "0.6rem", color: "#555", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", padding: "1px 6px" }}>archived</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", color: "#555" }}>{supplier.contact} · {supplier.phone}</span>
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
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {!supplier.archived && (
                <>
                  <Btn color="#ff6b35" small onClick={() => setSupplierModal(supplier)}>Edit</Btn>
                  <Btn color="#48bb78" small onClick={() => setPartModal({ supplierId: supplier.id, part: {} })}>+ Part</Btn>
                  <Btn color="#00d4ff" small onClick={() => setOrderModal(supplier.id)}>+ Order</Btn>
                </>
              )}
              <Btn
                color={supplier.archived ? "#48bb78" : "#888"}
                small
                onClick={() => toggleArchiveSupplier(supplier.id)}
              >
                {supplier.archived ? "Restore" : "Archive"}
              </Btn>
              <Btn color="#fc8181" small onClick={() => setConfirmDelete(true)}>Delete</Btn>
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
                  style={{ padding: "0.75rem 1.25rem", background: "#0d0d20", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ fontSize: "0.65rem", color: openParts ? "#00d4ff" : "#444", transition: "color 0.15s" }}>
                    {openParts ? "▾" : "▸"}
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    Parts Catalogue
                  </div>
                  <span style={{ fontSize: "0.68rem", color: "#555", marginLeft: "0.5rem" }}>({supplier.parts?.length || 0})</span>
                </div>
                {openParts && (
                  <div style={{ padding: "0.75rem 1.25rem" }}>
                    <div style={{ background: "#0a0a18", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}><div style={{ minWidth: "480px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.6fr 0.6fr auto", background: "#0d0d20" }}>
                          {["Part No.", "Description", "Qty", "Unit", ""].map((h, i) => <TH key={i}>{h}</TH>)}
                        </div>
                        {supplier.parts?.map((pt) => (
                          <div key={pt.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.6fr 0.6fr auto", alignItems: "center", padding: "0 0.5rem" }}>
                            <TD><span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#00d4ff" }}>{pt.partNumber}</span></TD>
                            <TD>{pt.description}</TD>
                            <TD>{pt.unitQty}</TD>
                            <TD>{pt.unit}</TD>
                            <TD style={{ display: "flex", gap: "4px" }}>
                              {canManage && (
                                <>
                                  <button onClick={() => setPartModal({ supplierId: supplier.id, part: { ...pt, _existing: true } })} style={{ padding: "3px 7px", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", color: "#888", fontSize: "0.7rem", cursor: "pointer" }}>Edit</button>
                                  <button onClick={() => deletePart(supplier.id, pt.id)} style={{ padding: "3px 6px", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "4px", color: "#fc8181", fontSize: "0.7rem", cursor: "pointer" }}>✕</button>
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
              <div style={{ padding: "0.6rem 1.25rem", borderBottom: "1px solid #141428", fontSize: "0.78rem", color: "#444" }}>
                No parts catalogued yet.
                {canManage && <button onClick={() => setPartModal({ supplierId: supplier.id, part: {} })} style={{ marginLeft: "0.5rem", background: "none", border: "none", color: "#48bb78", fontSize: "0.78rem", cursor: "pointer" }}>+ Add one</button>}
              </div>
            )}

            {/* Orders */}
            {(supplier.orders || []).length > 0 && (
              <div>
                <div
                  onClick={() => setOpenOrders((o) => !o)}
                  style={{ padding: "0.75rem 1.25rem", background: "#0d0d20", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ fontSize: "0.65rem", color: openOrders ? "#00d4ff" : "#444", transition: "color 0.15s" }}>
                    {openOrders ? "▾" : "▸"}
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    Orders
                  </div>
                  <span style={{ fontSize: "0.68rem", color: "#555", marginLeft: "0.5rem" }}>({supplier.orders?.length || 0})</span>
                </div>
                {openOrders && (
                  <div style={{ padding: "0.75rem 1.25rem" }}>
                    <div style={{ background: "#0a0a18", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}><div style={{ minWidth: "640px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 1fr 1fr 0.8fr auto", background: "#0d0d20" }}>
                          {["Description", "Ordered", "Lead", "Est. Arrival", "Status", "Updated", ""].map((h, i) => <TH key={i}>{h}</TH>)}
                        </div>
                        {supplier.orders?.map((order) => {
                          const arrival = addDays(order.orderedDate, order.leadTimeDays);
                          const late    = !order.arrived && arrival < now;
                          return (
                            <div key={order.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 1fr 1fr 0.8fr auto", alignItems: "center", padding: "0 0.5rem" }}>
                              <TD>
                                <div style={{ fontSize: "0.82rem", color: "#e0e0e0" }}>{order.description}</div>
                                {(order.partIds || []).length > 0 && (
                                  <div style={{ fontSize: "0.62rem", color: "#555", marginTop: "2px" }}>
                                    {(order.partIds || []).map((pid) => {
                                      const pt = supplier.parts?.find((p) => p.id === pid);
                                      return pt ? <span key={pid} style={{ marginRight: "4px", color: "#00d4ff" }}>{pt.partNumber}</span> : null;
                                    })}
                                  </div>
                                )}
                              </TD>
                              <TD style={{ fontSize: "0.76rem", color: "#777" }}>{fmt(order.orderedDate)}</TD>
                              <TD style={{ fontSize: "0.76rem", color: "#777" }}>{order.leadTimeDays}d</TD>
                              <TD style={{ fontSize: "0.76rem", color: late ? "#fc8181" : "#777" }}>{fmt(arrival)}</TD>
                              <TD>
                                {order.arrived
                                  ? <span style={{ fontSize: "0.72rem", color: "#48bb78", background: "#48bb7818", padding: "2px 8px", borderRadius: "4px" }}>✓ Arrived {order.arrivedDate ? fmt(order.arrivedDate) : ""}</span>
                                  : <span style={{ fontSize: "0.72rem", color: late ? "#fc8181" : "#f6c90e", background: late ? "#fc818118" : "#f6c90e18", padding: "2px 8px", borderRadius: "4px" }}>{late ? "Overdue" : "Pending"}</span>
                                }
                              </TD>
                              <TD><UpdatedBadge iso={order.updatedAt} byName={order.updatedBy} compact /></TD>
                              <TD>
                                {canManage && (
                                  <button onClick={() => toggleArrived(supplier.id, order.id)} style={{ padding: "3px 7px", background: order.arrived ? "#fc818115" : "#48bb7815", border: `1px solid ${order.arrived ? "#fc818150" : "#48bb7850"}`, borderRadius: "4px", color: order.arrived ? "#fc8181" : "#48bb78", fontSize: "0.7rem", cursor: "pointer" }}>
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
              <div style={{ padding: "0.6rem 1.25rem", fontSize: "0.78rem", color: "#444" }}>
                No orders yet.
                {canManage && <button onClick={() => setOrderModal(supplier.id)} style={{ marginLeft: "0.5rem", background: "none", border: "none", color: "#00d4ff", fontSize: "0.78rem", cursor: "pointer" }}>+ Place one</button>}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <p style={{ color: "#555", fontSize: "0.8rem" }}>Supplier catalogue, parts, and orders</p>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} style={selStyle}>
            <option value="active">Active ({counts.active})</option>
            <option value="archived">Archived ({counts.archived})</option>
            <option value="overdue">Overdue orders ({counts.overdue})</option>
          </select>
        </div>
        {canManage && <Btn color="#ff6b35" onClick={() => setSupplierModal({})}>+ Add Supplier</Btn>}
      </div>

      {/* Empty states */}
      {filtered.length === 0 && filter === "active"   && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No active suppliers. {canManage && "Add one above."}</div>}
      {filtered.length === 0 && filter === "archived"  && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No archived suppliers.</div>}
      {filtered.length === 0 && filter === "overdue"   && <div style={{ padding: "2rem", textAlign: "center", color: "#48bb78" }}>✓ No overdue orders.</div>}

      {/* Cards */}
      {filtered.map((supplier) => (
        <SupplierCard key={supplier.id} supplier={supplier} />
      ))}
    </div>
  );
};
