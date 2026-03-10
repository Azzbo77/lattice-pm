import { useState } from "react";
import { useApp } from "../context/AppContext";
import { inp } from "../components/ui";
import { bg, clr, font, radius, space } from "../constants/theme";

const pwStrength = (pw: string) => {
  if (!pw) return { score: 0, label: "", color: clr.textDeep };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: "", color: clr.textDeep },
    { score: 1, label: "Very weak",  color: clr.red },
    { score: 2, label: "Weak",       color: clr.orange },
    { score: 3, label: "Fair",       color: clr.yellow },
    { score: 4, label: "Good",       color: clr.green },
    { score: 5, label: "Strong",     color: clr.green },
  ];
  return levels[Math.min(score, 5)];
};

const PasswordField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && <div style={{ fontSize: "0.7rem", color: clr.textFaint, marginBottom: radius.sm, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} style={{ ...inp, paddingRight: "2.5rem" }} value={value} onChange={onChange} placeholder={placeholder || ""} />
        <button type="button" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: space["3"], top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: clr.textFaint, cursor: "pointer", fontSize: "0.85rem" }} aria-label={show ? "Hide password" : "Show password"}>
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
};

export const LoginScreen = () => {
  const { login } = useApp();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");

  const [submitting, setSubmitting] = useState(false);

  const attempt = async () => {
    setSubmitting(true);
    setErr("");
    const error = await login(email, password);
    if (error) setErr(error);
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: bg.deep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", padding: space["6"] }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "370px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "44px", height: "44px", background: "linear-gradient(135deg,#00d4ff,#ff6b35)", borderRadius: radius.xl, margin: "0 auto 0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>◈</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: clr.textPrimary }}>Lattice</h1>
          <p style={{ color: clr.textFaint, fontSize: "0.8rem", marginTop: radius.sm }}>Project Management</p>
        </div>
        <div style={{ display: "grid", gap: space["5"], marginBottom: space["6"] }}>
          <input style={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && attempt()} />
          <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        </div>
        {err && <div style={{ color: clr.red, fontSize: "0.8rem", marginBottom: space["5"], textAlign: "center" }}>{err}</div>}
        <button onClick={attempt} style={{ width: "100%", padding: space["5"], background: "linear-gradient(135deg,#00d4ff,#0088aa)", border: "none", borderRadius: radius.lg, color: bg.deep, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
          {submitting ? "Signing in…" : "Sign In"}
        </button>

      </div>
    </div>
  );
};

export const MustSetPasswordScreen = () => {
  const { currentUser, completePasswordReset, logout } = useApp();
  const [current, setCurrent] = useState("");
  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [err,     setErr]     = useState("");
  const [saving,  setSaving]  = useState(false);
  const strength = pwStrength(pw);

  const save = async () => {
    if (!current)          return setErr("Please enter your current (temporary) password.");
    if (!pw)               return setErr("Please enter a new password.");
    if (pw.length < 6)     return setErr("Password must be at least 6 characters.");
    if (pw !== confirm)    return setErr("Passwords do not match.");
    if (pw === current)    return setErr("New password must be different from your current password.");
    setSaving(true);
    setErr("");
    try {
      await completePasswordReset(pw, current);
    } catch (e: any) {
      setErr(e?.message?.includes("oldPassword") || e?.status === 400
        ? "Current password is incorrect — please try again."
        : "Failed to update password. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: bg.deep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", padding: space["6"] }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: space["3"] }}>🔐</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: clr.textPrimary, marginBottom: space["2"] }}>Set Your Password</h2>
          <p style={{ color: clr.textFaint, fontSize: font.lg }}>Welcome, {currentUser?.name}. Please choose a personal password before continuing.</p>
        </div>
        <div style={{ display: "grid", gap: space["5"], marginBottom: space["6"] }}>
          <PasswordField label="Current Password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Your temporary password" />
          <PasswordField label="New Password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Choose a secure password" />
          {pw && (
            <div>
              <div style={{ display: "flex", gap: radius.xs, marginBottom: radius.xs }}>
                {[1,2,3,4,5].map((i) => <div key={i} style={{ flex: 1, height: radius.sm, borderRadius: "2px", background: i <= strength.score ? strength.color : bg.overlay }} />)}
              </div>
              <div style={{ fontSize: "0.7rem", color: strength.color }}>{strength.label}</div>
            </div>
          )}
          <PasswordField label="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" />
          {pw && confirm && (
            <div style={{ fontSize: font.base, color: pw === confirm ? clr.green : clr.red }}>
              {pw === confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
            </div>
          )}
        </div>
        {err && <div style={{ color: clr.red, fontSize: "0.8rem", marginBottom: space["5"], padding: "0.5rem 0.75rem", background: "#fc818115", borderRadius: radius.md }}>{err}</div>}
        <button onClick={save} disabled={saving} style={{ width: "100%", padding: space["5"], background: "linear-gradient(135deg,#00d4ff,#0088aa)", border: "none", borderRadius: radius.lg, color: bg.deep, fontWeight: 700, fontSize: "0.9rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, marginBottom: space["3"] }}>
          {saving ? "Saving…" : "Set Password & Continue"}
        </button>
        <button onClick={logout} style={{ width: "100%", padding: space["3"], background: "transparent", border: "none", color: clr.textGhost, fontSize: space["5"], cursor: "pointer" }}>
          Skip for now (you'll be prompted again next login)
        </button>
      </div>
    </div>
  );
};
