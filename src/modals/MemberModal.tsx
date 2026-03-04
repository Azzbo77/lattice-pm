import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Overlay, Lbl, Btn, inp } from "../components/ui";
import { ROLES } from "../constants/seeds";
import { initials } from "../utils/dateHelpers";

const pwStrength = (pw: string) => {
  if (!pw) return { score: 0, label: "", color: "#333" };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: "",            color: "#333" },
    { score: 1, label: "Very weak",   color: "#fc8181" },
    { score: 2, label: "Weak",        color: "#fb923c" },
    { score: 3, label: "Fair",        color: "#f6c90e" },
    { score: 4, label: "Good",        color: "#34d399" },
    { score: 5, label: "Strong",      color: "#48bb78" },
  ];
  return levels[Math.min(score, 5)];
};

const PasswordField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Lbl c={label} />
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          style={{ ...inp, paddingRight: "2.5rem" }}
          value={value}
          onChange={onChange}
          placeholder={placeholder || ""}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.85rem" }}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
};

export const MemberModal = () => {
  const { memberModal, setMemberModal, saveMember, currentUser } = useApp();
  
  const [f, setF] = useState({
    name:                "",
    email:               "",
    role:                ROLES.WORKER,
    password:            "",
    confirmPassword:     "",
    mustChangePassword:  false,
  });
  const [err, setErr] = useState("");
  
  if (!memberModal) return null;
  const member = memberModal as Record<string, any>;
  const isNew  = !member.id;
  const isSelf = member.id === currentUser?.id;

  // Initialize form when modal payload changes.
  useEffect(() => {
    if (!memberModal) return;
    const modalMember = memberModal as Record<string, any>;
    const modalIsNew = !modalMember.id;
    setF({
      name:                modalMember.name    || "",
      email:               modalMember.email   || "",
      role:                modalMember.role    || ROLES.WORKER,
      password:            "",
      confirmPassword:     "",
      mustChangePassword:  modalIsNew ? true : (modalMember.mustChangePassword || false),
    });
    setErr("");
  }, [memberModal]);
  
  const u = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const strength = pwStrength(f.password);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const pw = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setF((p) => ({ ...p, password: pw, confirmPassword: pw }));
  };

  const save = () => {
    if (!f.name.trim())              return setErr("Name is required.");
    if (!f.email.trim())             return setErr("Email is required.");
    if (isNew && !f.password)        return setErr("A temporary password is required for new members.");
    if (f.password && f.password !== f.confirmPassword) return setErr("Passwords do not match.");
    saveMember({
      id:                  member.id || `u${Date.now()}`,
      name:                f.name.trim(),
      email:               f.email.trim(),
      role:                f.role,
      password:            f.password || member.password,
      mustChangePassword:  f.mustChangePassword,
      avatar:              initials(f.name.trim()),
    });
  };

  return (
    <Overlay onClose={() => setMemberModal(null)}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#e0e0e0", marginBottom: "1.25rem" }}>
        {isNew ? "Add Team Member" : "Edit Member"}
      </h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div><Lbl c="Full Name" /><input style={inp} value={f.name as string} onChange={u("name")} placeholder="e.g. Jordan Smith" /></div>
        <div><Lbl c="Email Address" /><input type="email" style={inp} value={f.email as string} onChange={u("email")} placeholder="jordan@company.com" /></div>
        <div>
          <Lbl c="Role" />
          <select style={inp} value={f.role as string} onChange={u("role")} disabled={isSelf}>
            <option value={ROLES.WORKER} style={{ background:"#0f0f1e",color:"#48bb78" }}>Worker — view &amp; update own tasks</option>
            <option value={ROLES.MANAGER} style={{ background:"#0f0f1e",color:"#00d4ff" }}>Manager — manage tasks &amp; suppliers</option>
            <option value={ROLES.ADMIN} style={{ background:"#0f0f1e",color:"#ff6b35" }}>Admin — full access</option>
          </select>
          {isSelf && <div style={{ fontSize: "0.68rem", color: "#555", marginTop: "4px" }}>You cannot change your own role.</div>}
        </div>

        <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600 }}>{isNew ? "Temporary Password" : "Change Password"}</span>
            <button onClick={generatePassword} style={{ fontSize: "0.72rem", color: "#00d4ff", background: "#00d4ff18", border: "1px solid #00d4ff40", borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}>🎲 Generate</button>
          </div>
          {!isNew && <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.6rem" }}>Leave blank to keep the current password.</div>}
          <PasswordField label={isNew ? "Password" : "New Password"} value={f.password} onChange={u("password")} placeholder={isNew ? "Set a temporary password" : "Leave blank to keep current"} />
          {f.password && (
            <div style={{ marginTop: "6px" }}>
              <div style={{ display: "flex", gap: "3px", marginBottom: "3px" }}>
                {[1,2,3,4,5].map((i) => <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength.score ? strength.color : "#1a1a2e" }} />)}
              </div>
              <div style={{ fontSize: "0.68rem", color: strength.color }}>{strength.label}</div>
            </div>
          )}
        </div>

        {(isNew || f.password) && (
          <PasswordField label="Confirm Password" value={f.confirmPassword} onChange={u("confirmPassword")} placeholder="Repeat password" />
        )}
        {f.password && f.confirmPassword && (
          <div style={{ fontSize: "0.72rem", color: f.password === f.confirmPassword ? "#48bb78" : "#fc8181", marginTop: "-0.4rem" }}>
            {f.password === f.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
          </div>
        )}

        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem", background: f.mustChangePassword ? "#00d4ff0e" : "#15152a", border: `1px solid ${f.mustChangePassword ? "#00d4ff40" : "#252540"}`, borderRadius: "8px", cursor: "pointer" }}>
          <input type="checkbox" checked={f.mustChangePassword as boolean} onChange={(e) => setF((p) => ({ ...p, mustChangePassword: e.target.checked }))} style={{ accentColor: "#00d4ff", width: "14px", height: "14px", marginTop: "2px", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.82rem", color: "#ccc", fontWeight: 600 }}>Prompt to set own password on first login</div>
            <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "2px" }}>User will be prompted to choose their own password when they next sign in.</div>
          </div>
        </label>
      </div>

      {err && <div style={{ marginTop: "0.75rem", color: "#fc8181", fontSize: "0.8rem", padding: "0.5rem 0.75rem", background: "#fc818115", borderRadius: "6px", border: "1px solid #fc818140" }}>{err}</div>}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Btn color="ghost" onClick={() => setMemberModal(null)}>Cancel</Btn>
        <Btn color="#00d4ff" onClick={save}>{isNew ? "Add Member" : "Save Changes"}</Btn>
      </div>
    </Overlay>
  );
};
