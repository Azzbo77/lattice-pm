import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Btn } from "../components/ui";
import { todayStr } from "../utils/dateHelpers";
import { bg, clr, font, radius, space } from "../constants/theme";

export const BackupModal = () => {
  const { setShowBackup, exportBackup, importBackup } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | Blob | null): Promise<void> => {
    if (!file) return;
    if (!(file instanceof File) || !file.name.endsWith(".json")) { alert("Please select a .json backup file."); return; }

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importBackup(payload);
      alert("Backup restored successfully.");
      setShowBackup(false);
    } catch {
      alert("Could not read backup file. Make sure it is valid JSON.");
    }
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
  const usageColor = usagePct > 80 ? clr.red : usagePct > 50 ? clr.yellow : clr.green;

  return (
    <Overlay onClose={() => setShowBackup(false)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", color: clr.textPrimary, marginBottom: "0.35rem" }}>💾 Backup &amp; Restore</h3>
      <p style={{ color: clr.textFaint, fontSize: font.md, marginBottom: "1.5rem" }}>Export your data as JSON to back up or move to another device.</p>

      {/* Storage meter */}
      <div style={{ background: bg.raised, border: "1px solid #252540", borderRadius: radius.lg, padding: "0.85rem 1rem", marginBottom: space["7"] }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: radius.md }}>
          <span style={{ fontSize: space["5"], color: clr.textMuted }}>Browser storage used</span>
          <span style={{ fontSize: space["5"], color: usageColor, fontWeight: 600 }}>{storageUsed} KB / ~5 MB</span>
        </div>
        <div style={{ height: "5px", background: bg.overlay, borderRadius: radius.xs, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${usagePct}%`, background: usageColor, borderRadius: radius.xs }} />
        </div>
        {usagePct > 70 && <div style={{ fontSize: "0.7rem", color: clr.yellow, marginTop: radius.md }}>⚠ Storage getting full — export a backup soon.</div>}
        <div style={{ fontSize: "0.68rem", color: clr.textGhost, marginTop: radius.md }}>localStorage is browser-specific. Clearing browser data will erase all app data.</div>
      </div>

      {/* Export */}
      <div style={{ marginBottom: space["7"] }}>
        <div style={{ fontSize: space["5"], color: clr.textMuted, fontWeight: 600, marginBottom: space["3"], textTransform: "uppercase", letterSpacing: "0.05em" }}>Export</div>
        <button onClick={exportBackup} style={{ width: "100%", padding: "0.85rem", background: "linear-gradient(135deg,#48bb78,#2d8a52)", border: "none", borderRadius: radius.lg, color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
          ⬇ Download Backup JSON
        </button>
        <div style={{ fontSize: "0.7rem", color: clr.textGhost, marginTop: radius.md, textAlign: "center" }}>
          Saves as <code style={{ color: clr.textDim }}>lattice-backup-{todayStr()}.json</code>
        </div>
      </div>

      {/* Import */}
      <div>
        <div style={{ fontSize: space["5"], color: clr.textMuted, fontWeight: 600, marginBottom: space["3"], textTransform: "uppercase", letterSpacing: "0.05em" }}>Restore from Backup</div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? clr.cyan : bg.muted}`, borderRadius: radius.xl, padding: "1.5rem", textAlign: "center", cursor: "pointer", background: dragging ? "#00d4ff08" : "transparent", transition: "all 0.2s" }}
        >
          <div style={{ fontSize: "2rem", marginBottom: space["3"] }}>📂</div>
          <div style={{ fontSize: font.lg, color: dragging ? clr.cyan : clr.textDim }}>{dragging ? "Drop to restore…" : "Click to select or drag & drop"}</div>
          <div style={{ fontSize: "0.7rem", color: clr.textGhost, marginTop: radius.sm }}>.json files only</div>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </div>
        <div style={{ fontSize: "0.7rem", color: clr.red, marginTop: radius.lg, padding: "0.5rem 0.75rem", background: "#fc818110", borderRadius: radius.md, border: "1px solid #fc818130" }}>
          ⚠ Restoring overwrites all current data and cannot be undone.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: space["7"] }}>
        <Btn color="ghost" onClick={() => setShowBackup(false)}>Close</Btn>
      </div>
    </Overlay>
  );
};
