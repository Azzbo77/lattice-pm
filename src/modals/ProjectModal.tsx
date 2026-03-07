import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp } from "../components/ui";
import { PRESET_COLORS } from "../constants/seeds";
import { bg, clr, font, radius, space } from "../constants/theme";

export const ProjectModal = () => {
  const { projectModal, setProjectModal, saveProject } = useApp();

  const [f, setF] = useState<{ name: string; description: string; color: string }>({ name: "", description: "", color: clr.cyan });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!projectModal) return;
    const modalProject = projectModal as Record<string, any>;
    setF({
      name: modalProject.name || "",
      description: modalProject.description || "",
      color: modalProject.color || clr.cyan,
    });
    setErr("");
  }, [projectModal]);

  if (!projectModal) return null;
  const project = projectModal as Record<string, any>;
  const isNew = !project.id;

  const u = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!f.name.trim()) return setErr("Project name is required.");
    saveProject({ ...f, id: project.id || `p${Date.now()}`, name: f.name.trim() });
  };

  return (
    <Overlay onClose={() => setProjectModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: font.h2, color: clr.textPrimary, marginBottom: space["7"] }}>
        {isNew ? "New Project" : "Edit Project"}
      </h3>
      <div style={{ display: "grid", gap: space["5"] }}>
        <div><Lbl c="Project Name" /><input style={inp} value={f.name as string} onChange={u("name")} placeholder="e.g. Factory Fit-Out Phase 2" /></div>
        <div><Lbl c="Description (optional)" /><input style={inp} value={f.description as string} onChange={u("description")} placeholder="Short description…" /></div>
        <div>
          <Lbl c="Colour" />
          <div style={{ display: "flex", gap: radius.lg, flexWrap: "wrap", marginBottom: space["3"] }}>
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setF((p) => ({ ...p, color: c }))} style={{ width: "28px", height: "28px", borderRadius: radius.md, background: c, border: f.color === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: space["5"] }}>
            <input type="color" value={f.color as string} onChange={u("color")} style={{ width: "36px", height: "28px", border: "none", background: "none", cursor: "pointer", padding: 0 }} />
            <span style={{ fontSize: space["5"], color: clr.textFaint }}>or pick a custom colour</span>
          </div>
        </div>
        <div style={{ padding: space["5"], background: bg.raised, borderRadius: radius.lg, border: "1px solid #252540", display: "flex", alignItems: "center", gap: space["5"] }}>
          <div style={{ width: radius.xxl, height: radius.xxl, borderRadius: radius.xs, background: f.color as string }} />
          <span style={{ color: f.color as string, fontSize: font.xl, fontWeight: 600 }}>{(f.name as string) || "Project Name"}</span>
        </div>
      </div>
      {err && <div style={{ marginTop: space["5"], color: clr.red, fontSize: "0.8rem" }}>{err}</div>}
      <div style={{ display: "flex", gap: font.xxs, justifyContent: "flex-end", marginTop: space["7"] }}>
        <Btn color="ghost" onClick={() => setProjectModal(null)}>Cancel</Btn>
        <Btn color={f.color as string} onClick={save}>{isNew ? "Create Project" : "Save Changes"}</Btn>
      </div>
    </Overlay>
  );
};
