import { useApp } from "../context/AppContext";
import { bomStatusMeta } from "../constants/seeds";
import { todayStr } from "../utils/dateHelpers";
import { TH, TD, UpdatedBadge } from "../components/ui";
import { exportCSV } from "../utils/csvExport";

export const BomPage = () => {
  const { bomRows, filteredBom, bomFilter, setBomFilter, setBomModal } = useApp();

  const handleExport = () => {
    const rows = bomRows.map((r) => [
      r.part?.partNumber || "", r.part?.description || "", r.supplier?.name || "",
      r.part?.unit || "", r.part?.unitQty || "", r.qtyOrdered,
      (r.qtyOrdered || 0) * (r.part?.unitQty || 1),
      bomStatusMeta[r.status]?.label || r.status, r.project || "", r.notes || "",
      r.updatedAt || "", r.updatedBy || "",
    ]);
    exportCSV(
      `BOM-export-${todayStr()}.csv`,
      ["Part Number","Description","Supplier","Unit","Unit Qty","Qty Ordered","Total Units","Status","Project / Assembly","Engineering Notes","Last Updated","Updated By"],
      rows
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <p style={{ color: "#555", fontSize: "0.8rem" }}>{bomRows.length} parts across {[...new Set(bomRows.map((r) => r.supplierId))].length} suppliers</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {[["all","#888","All"],["used","#48bb78","Used"],["not-used","#fc8181","Not Used"],["under-review","#f6c90e","Under Review"],["pending","#888","Pending"]].map(([k, c, l]) => (
            <button key={k} onClick={() => setBomFilter(k)} style={{ padding: "0.3rem 0.75rem", borderRadius: "20px", border: `1px solid ${bomFilter === k ? c : "#252540"}`, background: bomFilter === k ? `${c}22` : "transparent", color: bomFilter === k ? c : "#555", fontSize: "0.75rem", cursor: "pointer" }}>{l}</button>
          ))}
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.85rem", borderRadius: "20px", border: "1px solid #48bb7870", background: "#48bb7818", color: "#48bb78", fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {Object.entries(bomStatusMeta).map(([k, v]) => {
          const count = bomRows.filter((r) => r.status === k).length;
          return (
            <div key={k} onClick={() => setBomFilter(k)} style={{ background: "#0f0f1e", border: `1px solid ${bomFilter === k ? v.color : "#1e1e35"}`, borderRadius: "8px", padding: "0.75rem", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem" }}>{v.icon}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: v.color, lineHeight: 1.1 }}>{count}</div>
              <div style={{ fontSize: "0.65rem", color: "#555", marginTop: "2px" }}>{v.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "860px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.8fr 0.8fr 0.7fr 0.7fr 1fr 2fr 0.8fr auto", background: "#0d0d20" }}>
          {["Part No.","Description","Supplier","Qty Ord.","Total","Status","Notes / CI","Updated",""].map((h, i) => <TH key={i}>{h}</TH>)}
        </div>

        {filteredBom.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#555" }}>No BOM entries match this filter.</div>}

        {filteredBom.map((row) => {
          const meta  = bomStatusMeta[row.status];
          const total = (row.qtyOrdered || 0) * (row.part?.unitQty || 1);
          return (
            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.8fr 0.8fr 0.7fr 0.7fr 1fr 2fr 0.8fr auto", alignItems: "center", padding: "0 0.5rem" }}>
              <TD><span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#00d4ff" }}>{row.part?.partNumber}</span></TD>
              <TD style={{ fontSize: "0.78rem" }}>{row.part?.description}</TD>
              <TD style={{ fontSize: "0.75rem", color: "#888" }}>{row.supplier?.name}</TD>
              <TD style={{ fontSize: "0.78rem" }}>{row.qtyOrdered} {row.part?.unit}</TD>
              <TD style={{ fontSize: "0.78rem" }}>{total}</TD>
              <TD>
                <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: "4px", background: meta?.bg, color: meta?.color, border: `1px solid ${meta?.color}40`, whiteSpace: "nowrap" }}>
                  {meta?.icon} {meta?.label}
                </span>
              </TD>
              <TD style={{ fontSize: "0.72rem", color: "#666", fontStyle: row.notes ? "normal" : "italic" }}>
                {row.notes || <span style={{ color: "#333" }}>No notes</span>}
              </TD>
              <TD>
                <UpdatedBadge iso={row.updatedAt} byName={row.updatedBy} compact />
              </TD>
              <TD>
                <button onClick={() => setBomModal({ entry: row, partId: row.partId, supplierId: row.supplierId })} style={{ padding: "3px 7px", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "4px", color: "#888", fontSize: "0.7rem", cursor: "pointer" }}>Edit</button>
              </TD>
            </div>
          );
        })}
      </div></div></div>
    </div>
  );
};
