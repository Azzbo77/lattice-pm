import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp } from "../components/ui";
import { PRESET_COLORS } from "../constants/seeds";

export const ProjectModal = () => {
  const { projectModal, setProjectModal, saveProject } = useApp();
  const project = projectModal;
  const isNew = !project.id;
  const [f, setF] = useState({ name: project.name || "", description: project.description || "", color: project.color || "#00d4ff" });
  const [err, setErr] = useState("");
  const u = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = () => {
    if (!f.name.trim()) return setErr("Project name is required.");
    saveProject({ ...f, id: project.id || `p${Date.now()}`, name: f.name.trim() });
  };

  return (
    <Overlay onClose={() => setProjectModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>
        {isNew ? "New Project" : "Edit Project"}
      </h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div><Lbl c="Project Name" /><input style={inp} value={f.name} onChange={u("name")} placeholder="e.g. Factory Fit-Out Phase 2" /></div>
        <div><Lbl c="Description (optional)" /><input style={inp} value={f.description} onChange={u("description")} placeholder="Short description…" /></div>
        <div>
          <Lbl c="Colour" />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setF((p) => ({ ...p, color: c }))} style={{ width: "28px", height: "28px", borderRadius: "6px", background: c, border: f.color === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input type="color" value={f.color} onChange={u("color")} style={{ width: "36px", height: "28px", border: "none", background: "none", cursor: "pointer", padding: 0 }} />
            <span style={{ fontSize: "0.75rem", color: "#555" }}>or pick a custom colour</span>
          </div>
        </div>
        <div style={{ padding: "0.75rem", background: "#15152a", borderRadius: "8px", border: "1px solid #252540", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: f.color }} />
          <span style={{ color: f.color, fontSize: "0.88rem", fontWeight: 600 }}>{f.name || "Project Name"}</span>
        </div>
      </div>
      {err && <div style={{ marginTop: "0.75rem", color: "#fc8181", fontSize: "0.8rem" }}>{err}</div>}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={() => setProjectModal(null)}>Cancel</Btn>
        <Btn color={f.color} onClick={save}>{isNew ? "Create Project" : "Save Changes"}</Btn>
      </div>
    </Overlay>
  );
};
