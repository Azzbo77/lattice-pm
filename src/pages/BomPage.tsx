import { useMemo, useCallback } from "react";
import React from "react";
import { useApp } from "../context/AppContext";
import { bomStatusMeta } from "../constants/seeds";
import { todayStr, addDays } from "../utils/dateHelpers";
import { TH, TD, UpdatedBadge, selStyle, Pager } from "../components/ui";
import { exportCSV } from "../utils/csvExport";
import { bg, clr, font, radius, space } from "../constants/theme";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { usePagination } from "../hooks/usePagination";
import type { BomRow as BomRowType, Project, Task } from "../types";

// ── BomRow component ──────────────────────────────────────────────────────────
interface BomRowProps {
  row: BomRowType;
  linkedTask: Task | undefined;
  linkedProj: Project | undefined;
  alerts: string[];
  canEdit:   boolean;
  canDelete: boolean;
  onEdit:   (entry: BomRowType) => void;
  onDelete: (id: string) => void;
}

const BomRow = React.memo(({ row, linkedTask, linkedProj, alerts, canEdit, canDelete, onEdit, onDelete }: BomRowProps) => {
  const meta = bomStatusMeta[row.status];
  const total = (row.qtyOrdered || 0) * (row.part?.unitQty || 1);
  const hasAlert = alerts.length > 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 0.8fr 0.6fr 0.6fr 0.9fr 1fr 1.6fr 0.8fr auto", alignItems: "center", padding: "0 0.5rem", borderLeft: hasAlert ? "3px solid #fc818180" : "3px solid transparent" }}>
      <TD><span style={{ fontFamily: "monospace", fontSize: font.md, color: clr.cyan }}>{row.part?.partNumber}</span></TD>
      <TD style={{ fontSize: font.md }}>{row.part?.description}</TD>
      <TD style={{ fontSize: space["5"], color: clr.textMuted }}>{row.supplier?.name}</TD>
      <TD center style={{ fontSize: font.md }}>{row.qtyOrdered} {row.part?.unit}</TD>
      <TD center style={{ fontSize: font.md }}>{total}</TD>
      <TD center>
        <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: radius.sm, background: meta?.bg, color: meta?.color, border: `1px solid ${meta?.color}40`, whiteSpace: "nowrap" }}>
          {meta?.icon} {meta?.label}
        </span>
      </TD>
      <TD>
        {linkedTask ? (
          <div>
            <div style={{ fontSize: font.base, color: linkedTask.status === "done" ? clr.green : linkedTask.status === "blocked" ? clr.red : clr.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {linkedTask.status === "done" ? "✓ " : linkedTask.status === "blocked" ? "⛔ " : ""}{linkedTask.title}
            </div>
            {linkedProj && <div style={{ fontSize: font.xs, color: linkedProj.color, marginTop: "1px" }}>{linkedProj.name}</div>}
          </div>
        ) : (
          <span style={{ fontSize: "0.68rem", color: clr.textDeep, fontStyle: "italic" }}>—</span>
        )}
      </TD>
      <TD style={{ fontSize: font.base, color: clr.textDim, fontStyle: row.notes ? "normal" : "italic" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {hasAlert && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: radius.xs }}>
              {alerts.map((a) => (
                <span key={a} style={{ fontSize: font.xxs, color: clr.red, background: "#fc818115", border: "1px solid #fc818140", borderRadius: radius.xs, padding: "1px 4px", whiteSpace: "nowrap" }}>⚠ {a}</span>
              ))}
            </div>
          )}
          {row.notes || <span style={{ color: clr.textDeep }}>No notes</span>}
        </div>
      </TD>
      <TD center>
        <UpdatedBadge iso={row.updatedAt} byName={row.updatedBy} compact />
      </TD>
      <TD center>
        {(canEdit || canDelete) && (
          <div style={{ display: "flex", gap: "4px" }}>
            {canEdit && <button onClick={() => onEdit(row)} style={{ padding: "3px 7px", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.sm, color: clr.textMuted, fontSize: "0.7rem", cursor: "pointer" }} aria-label={`Edit BOM entry for ${row.part?.partNumber || 'part'}`}>Edit</button>}
            {canDelete && <button onClick={() => onDelete(row.id)} style={{ padding: "3px 7px", background: "#fc818115", border: "1px solid #fc818140", borderRadius: radius.sm, color: "#fc8181", fontSize: "0.7rem", cursor: "pointer" }} aria-label="Delete BOM entry">✕</button>}
          </div>
        )}
      </TD>
    </div>
  );
});
BomRow.displayName = "BomRow";

export const BomPage = () => {
  const { isMobile } = useBreakpoint();
  const {
    bomRows, filteredBom, bomFilter, setBomFilter,
    taskFilter, setTaskFilter,
    setBomModal, projects, tasks, suppliers, canCreateBom, canDeleteBom, setConfirmDeleteBom,
  } = useApp();
  const now = todayStr();
  const { page, totalPages, pageItems: pagedBom, next, prev, goTo } = usePagination(filteredBom, 20);

  // Helper — is this BOM row alertable?
  const getAlerts = useCallback((row: typeof bomRows[0]): string[] => {
    const alerts: string[] = [];
    const linkedTask = tasks.find((t) => t.id === row.taskId);
    if (linkedTask && linkedTask.status !== "done" && linkedTask.endDate < now)
      alerts.push("Linked task overdue");
    if (linkedTask && linkedTask.status === "blocked")
      alerts.push("Linked task blocked");
    const supplier = suppliers.find((s) => s.id === row.supplierId);
    const delayedOrders = (supplier?.orders || []).filter((o) =>
      !o.arrived && addDays(o.orderedDate, o.leadTimeDays) < now &&
      (o.partIds || []).includes(row.partId)
    );
    if (delayedOrders.length > 0) alerts.push("Part delivery delayed");
    if (row.status === "not-used" && row.taskId) alerts.push("Linked part unused");
    return alerts;
  }, [tasks, suppliers, now]);

  // Memoize BomRow data to prevent unnecessary re-renders
  const bomRowsData = useMemo(() =>
    pagedBom.map((row) => ({
      row,
      linkedTask: tasks.find((t) => t.id === row.taskId),
      linkedProj: projects.find((p) => p.id === row.projectId),
      alerts: getAlerts(row),
    })),
    [pagedBom, tasks, projects, getAlerts]
  );

  const handleDeleteBom = (id: string) => {
    setConfirmDeleteBom(id);
  };

  const handleEditBom = (row: BomRowType) => {
    setBomModal({ entry: row, partId: row.partId, supplierId: row.supplierId });
  };

  const handleExport = () => {
    const rows = filteredBom.map((r) => {
      const linkedTask = tasks.find((t) => t.id === r.taskId);
      const proj       = projects.find((p) => p.id === r.projectId);
      return [
        r.part?.partNumber || "", r.part?.description || "", r.supplier?.name || "",
        r.part?.unit || "", r.part?.unitQty || "", r.qtyOrdered,
        (r.qtyOrdered || 0) * (r.part?.unitQty || 1),
        bomStatusMeta[r.status]?.label || r.status,
        proj?.name || r.project || "",
        linkedTask?.title || "",
        r.notes || "", r.updatedAt || "", r.updatedBy || "",
      ];
    });
    exportCSV(
      `BOM-export-${todayStr()}.csv`,
      ["Part Number","Description","Supplier","Unit","Unit Qty","Qty Ordered","Total Units","Status","Project","Linked Task","Engineering Notes","Last Updated","Updated By"],
      rows
    );
  };

  // Build task filter options — grouped by project
  const taskFilterOptions = [
    { value: "all",      label: "All parts" },
    { value: "unlinked", label: "Unlinked parts" },
    ...projects.flatMap((p) => {
      const pts = tasks.filter((t) => t.projectId === p.id);
      if (pts.length === 0) return [{ value: `p:${p.id}`, label: `▸ ${p.name} (all)` }];
      return [
        { value: `p:${p.id}`, label: `▸ ${p.name} (all)` },
        ...pts.map((t) => ({ value: t.id, label: `  · ${t.title}` })),
      ];
    }),
  ];

  const alertCount = bomRows.filter((r) => getAlerts(r).length > 0).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["6"], flexWrap: "wrap", gap: space["5"] }}>
        <p style={{ color: clr.textFaint, fontSize: "0.8rem" }}>
          {bomRows.length} parts across {[...new Set(bomRows.map((r) => r.supplierId))].length} suppliers
          {alertCount > 0 && <span style={{ marginLeft: space["5"], color: clr.red, background: "#fc818115", border: "1px solid #fc818140", borderRadius: radius.sm, padding: "1px 7px", fontSize: font.base }}>⚠ {alertCount} alert{alertCount !== 1 ? "s" : ""}</span>}
        </p>
        <div style={{ display: "flex", gap: space["3"], alignItems: "center", flexWrap: "wrap" }}>
          {/* Status filter pills */}
          {[["all",clr.textMuted,"All"],["used",clr.green,"Used"],["not-used",clr.red,"Not Used"],["under-review",clr.yellow,"Under Review"],["pending",clr.textMuted,"Pending"]].map(([k, c, l]) => (
            <button key={k} onClick={() => setBomFilter(k)} style={{ padding: "0.3rem 0.75rem", borderRadius: radius.pill, border: `1px solid ${bomFilter === k ? c : bg.muted}`, background: bomFilter === k ? `${c}22` : "transparent", color: bomFilter === k ? c : clr.textFaint, fontSize: space["5"], cursor: "pointer" }}>{l}</button>
          ))}
          {/* Task/project filter dropdown */}
          <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} style={{ ...selStyle, maxWidth: "200px" }}>
            {taskFilterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: space["2"], padding: "0.3rem 0.85rem", borderRadius: radius.pill, border: "1px solid #48bb7870", background: "#48bb7818", color: clr.green, fontSize: space["5"], cursor: "pointer", whiteSpace: "nowrap" }}>⬇ Export CSV</button>
          {canCreateBom && (
            <button onClick={() => setBomModal({ entry: null, partId: "", supplierId: "" })} style={{ padding: "0.3rem 0.85rem", borderRadius: radius.pill, border: "1px solid #00d4ff70", background: "#00d4ff18", color: clr.cyan, fontSize: space["5"], cursor: "pointer", whiteSpace: "nowrap" }}>+ Add Entry</button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: space["5"], marginBottom: space["7"] }}>
        {Object.entries(bomStatusMeta).map(([k, v]) => {
          const count = bomRows.filter((r) => r.status === k).length;
          return (
            <div key={k} onClick={() => setBomFilter(k)} style={{ background: bg.card, border: `1px solid ${bomFilter === k ? v.color : bg.border}`, borderRadius: radius.lg, padding: space["5"], cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem" }}>{v.icon}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: v.color, lineHeight: 1.1 }}>{count}</div>
              <div style={{ fontSize: font.sm, color: clr.textFaint, marginTop: "2px" }}>{v.label}</div>
            </div>
          );
        })}
      </div>

      {/* Table — desktop */}
      {!isMobile && (
        <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "960px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 0.8fr 0.6fr 0.6fr 0.9fr 1fr 1.6fr 0.8fr auto", background: bg.subtle, padding: "0 0.5rem" }}>
            {["Part No.","Description","Supplier","Qty","Total","Status","Task","Notes / CI","Updated",""].map((h, i) => (
              <TH key={i} center={i === 3 || i === 4 || i === 5 || i === 8 || i === 9}>{h}</TH>
            ))}
          </div>
          {filteredBom.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint }}>No BOM entries match this filter.</div>}
          {bomRowsData.map(({ row, linkedTask, linkedProj, alerts }) => (
            <BomRow key={row.id} row={row} linkedTask={linkedTask} linkedProj={linkedProj} alerts={alerts} canEdit={canCreateBom} canDelete={canDeleteBom} onEdit={handleEditBom} onDelete={handleDeleteBom} />
          ))}
          </div>
        </div>
        <Pager page={page} totalPages={totalPages} total={filteredBom.length} pageSize={20} onPrev={prev} onNext={next} onGoTo={goTo} />
      </div>
      )}

      {/* Cards — mobile */}
      {isMobile && (
        <div>
          {filteredBom.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: clr.textFaint, background: bg.card, borderRadius: radius.xl, border: "1px solid #1e1e35" }}>
              No BOM entries match this filter.
            </div>
          )}
          {bomRowsData.map(({ row, linkedTask, linkedProj, alerts }) => {
            const meta  = bomStatusMeta[row.status];
            const total = (row.qtyOrdered || 0) * (row.part?.unitQty || 1);
            const hasAlert = alerts.length > 0;
            return (
              <div key={row.id} style={{
                background: bg.card, border: `1px solid ${hasAlert ? "#fc818140" : "#1e1e35"}`,
                borderLeft: `3px solid ${hasAlert ? "#fc8181" : "#1e1e35"}`,
                borderRadius: radius.xl, padding: space["5"], marginBottom: space["4"],
              }}>
                {/* Part + status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space["3"] }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: font.md, color: clr.cyan, marginBottom: "2px" }}>{row.part?.partNumber}</div>
                    <div style={{ fontSize: font.md, color: clr.textPrimary }}>{row.part?.description}</div>
                  </div>
                  <span style={{ fontSize: font.xs, padding: "2px 8px", borderRadius: radius.pill, background: meta?.bg ?? "#252540", color: meta?.color ?? clr.textMuted, border: `1px solid ${meta?.color ?? clr.textMuted}30`, whiteSpace: "nowrap", marginLeft: space["3"] }}>
                    {meta?.label ?? row.status}
                  </span>
                </div>
                {/* Meta row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: space["3"], marginBottom: space["3"] }}>
                  <span style={{ fontSize: font.sm, color: clr.textFaint }}>{row.supplier?.name}</span>
                  <span style={{ fontSize: font.sm, color: clr.textGhost }}>·</span>
                  <span style={{ fontSize: font.sm, color: clr.textMuted }}>Qty: {row.qtyOrdered} · Total: {total}</span>
                  {linkedProj && <span style={{ fontSize: font.sm, color: clr.textMuted }}>{linkedProj.name}</span>}
                  {linkedTask && <span style={{ fontSize: font.sm, color: linkedTask.status === "done" ? clr.green : linkedTask.status === "blocked" ? clr.red : clr.textMuted }}>{linkedTask.title}</span>}
                </div>
                {/* Notes */}
                {row.notes && <div style={{ fontSize: font.sm, color: clr.textDim, marginBottom: space["3"] }}>{row.notes}</div>}
                {/* Alerts */}
                {hasAlert && <div style={{ fontSize: font.sm, color: clr.red, marginBottom: space["3"] }}>⚠ {alerts.join(" · ")}</div>}
                {/* Actions */}
                {(canCreateBom || canDeleteBom) && (
                  <div style={{ display: "flex", gap: space["3"], borderTop: "1px solid #1e1e35", paddingTop: space["3"] }}>
                    {canCreateBom && <button onClick={() => handleEditBom(row)} style={{ flex: 1, padding: `${space["2"]} 0`, background: "#00d4ff15", border: "1px solid #00d4ff30", borderRadius: radius.md, color: clr.cyan, fontSize: font.sm, cursor: "pointer" }}>Edit</button>}
                    {canDeleteBom && <button onClick={() => handleDeleteBom(row.id)} style={{ flex: 1, padding: `${space["2"]} 0`, background: "transparent", border: "1px solid #252540", borderRadius: radius.md, color: clr.textFaint, fontSize: font.sm, cursor: "pointer" }}>Delete</button>}
                  </div>
                )}
              </div>
            );
          })}
          <Pager page={page} totalPages={totalPages} total={filteredBom.length} pageSize={20} onPrev={prev} onNext={next} onGoTo={goTo} />
        </div>
      )}
    </div>
  );
};
