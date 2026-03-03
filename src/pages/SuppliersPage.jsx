import { useApp } from "../context/AppContext";
import { Btn, TH, TD, UpdatedBadge } from "../components/ui";
import { addDays, fmt, todayStr } from "../utils/dateHelpers";

export const SuppliersPage = () => {
  const { suppliers, canManage, setSupplierModal, setPartModal, setOrderModal, deletePart, toggleArrived } = useApp();
  const now = todayStr();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ color: "#555", fontSize: "0.8rem" }}>Supplier catalogue, parts, and orders</p>
        {canManage && <Btn color="#ff6b35" onClick={() => setSupplierModal({})}>+ Add Supplier</Btn>}
      </div>

      {suppliers.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No suppliers yet.</div>}

      {suppliers.map((supplier) => (
        <div key={supplier.id} style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "12px", marginBottom: "1.25rem", overflow: "hidden" }}>
          {/* Supplier header */}
          <div style={{ padding: "0.85rem 1.25rem", background: "#0d0d20", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontWeight: 600, color: "#e0e0e0", fontSize: "0.95rem" }}>{supplier.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "3px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", color: "#555" }}>{supplier.contact} · {supplier.phone}</span>
                <UpdatedBadge iso={supplier.updatedAt} byName={supplier.updatedBy} compact />
              </div>
            </div>
            {canManage && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn color="#ff6b35" small onClick={() => setSupplierModal(supplier)}>Edit</Btn>
                <Btn color="#48bb78" small onClick={() => setPartModal({ supplierId: supplier.id, part: {} })}>+ Part</Btn>
                <Btn color="#00d4ff" small onClick={() => setOrderModal(supplier.id)}>+ Order</Btn>
              </div>
            )}
          </div>

          {/* Parts catalogue */}
          {(supplier.parts || []).length > 0 && (
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #141428" }}>
              <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Parts Catalogue</div>
              <div style={{ background: "#0a0a18", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.6fr 0.6fr auto", background: "#0d0d20" }}>
                  {["Part No.", "Description", "Unit Qty", "Unit", ""].map((h, i) => <TH key={i}>{h}</TH>)}
                </div>
                {supplier.parts.map((pt) => (
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
              </div>
            </div>
          )}

          {/* Orders */}
          {(supplier.orders || []).length > 0 && (
            <div style={{ padding: "0.75rem 1.25rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Orders</div>
              <div style={{ background: "#0a0a18", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 1fr 1fr 0.8fr auto", background: "#0d0d20" }}>
                  {["Description", "Ordered", "Lead", "Est. Arrival", "Status", "Updated", ""].map((h, i) => <TH key={i}>{h}</TH>)}
                </div>
                {supplier.orders.map((order) => {
                  const arrival = addDays(order.orderedDate, order.leadTimeDays);
                  const late    = !order.arrived && arrival < now;
                  return (
                    <div key={order.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 1fr 1fr 0.8fr auto", alignItems: "center", padding: "0 0.5rem" }}>
                      <TD>
                        <div style={{ fontSize: "0.82rem", color: "#e0e0e0" }}>{order.description}</div>
                        {order.partIds?.length > 0 && (
                          <div style={{ fontSize: "0.62rem", color: "#555", marginTop: "2px" }}>
                            {order.partIds.map((pid) => {
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
                      <TD>
                        <UpdatedBadge iso={order.updatedAt} byName={order.updatedBy} compact />
                      </TD>
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
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
