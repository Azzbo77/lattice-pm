import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Btn } from "../components/ui";
import { todayStr } from "../utils/dateHelpers";

export const BackupModal = () => {
  const { setShowBackup, exportBackup, importBackup } = useApp();
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".json")) { alert("Please select a .json backup file."); return; }
    importBackup(file);
  };

  const storageUsed = (() => {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key))
          total += localStorage[key].length * 2;
      }
      return (total / 1024).toFixed(1);
    } catch { return "?"; }
  })();

  const usagePct   = Math.min(100, Math.round((parseFloat(storageUsed) / 5120) * 100));
  const usageColor = usagePct > 80 ? "#fc8181" : usagePct > 50 ? "#f6c90e" : "#48bb78";

  return (
    <Overlay onClose={() => setShowBackup(false)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", color: "#e0e0e0", marginBottom: "0.35rem" }}>💾 Backup &amp; Restore</h3>
      <p style={{ color: "#555", fontSize: "0.78rem", marginBottom: "1.5rem" }}>Export your data as JSON to back up or move to another device.</p>

      {/* Storage meter */}
      <div style={{ background: "#15152a", border: "1px solid #252540", borderRadius: "8px", padding: "0.85rem 1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.75rem", color: "#888" }}>Browser storage used</span>
          <span style={{ fontSize: "0.75rem", color: usageColor, fontWeight: 600 }}>{storageUsed} KB / ~5 MB</span>
        </div>
        <div style={{ height: "5px", background: "#1a1a2e", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${usagePct}%`, background: usageColor, borderRadius: "3px" }} />
        </div>
        {usagePct > 70 && <div style={{ fontSize: "0.7rem", color: "#f6c90e", marginTop: "6px" }}>⚠ Storage getting full — export a backup soon.</div>}
        <div style={{ fontSize: "0.68rem", color: "#444", marginTop: "6px" }}>localStorage is browser-specific. Clearing browser data will erase all app data.</div>
      </div>

      {/* Export */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Export</div>
        <button onClick={exportBackup} style={{ width: "100%", padding: "0.85rem", background: "linear-gradient(135deg,#48bb78,#2d8a52)", border: "none", borderRadius: "8px", color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
          ⬇ Download Backup JSON
        </button>
        <div style={{ fontSize: "0.7rem", color: "#444", marginTop: "6px", textAlign: "center" }}>
          Saves as <code style={{ color: "#666" }}>lattice-backup-{todayStr()}.json</code>
        </div>
      </div>

      {/* Import */}
      <div>
        <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Restore from Backup</div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? "#00d4ff" : "#252540"}`, borderRadius: "10px", padding: "1.5rem", textAlign: "center", cursor: "pointer", background: dragging ? "#00d4ff08" : "transparent", transition: "all 0.2s" }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📂</div>
          <div style={{ fontSize: "0.82rem", color: dragging ? "#00d4ff" : "#666" }}>{dragging ? "Drop to restore…" : "Click to select or drag & drop"}</div>
          <div style={{ fontSize: "0.7rem", color: "#444", marginTop: "4px" }}>.json files only</div>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        </div>
        <div style={{ fontSize: "0.7rem", color: "#fc8181", marginTop: "8px", padding: "0.5rem 0.75rem", background: "#fc818110", borderRadius: "6px", border: "1px solid #fc818130" }}>
          ⚠ Restoring overwrites all current data and cannot be undone.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={() => setShowBackup(false)}>Close</Btn>
      </div>
    </Overlay>
  );
};
