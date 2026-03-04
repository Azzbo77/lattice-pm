import { useState } from "react";
import { useApp } from "../context/AppContext";
import { inp } from "../components/ui";
import { SEED_USERS } from "../constants/seeds";

const pwStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "#333" };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { score: 0, label: "", color: "#333" },
    { score: 1, label: "Very weak",  color: "#fc8181" },
    { score: 2, label: "Weak",       color: "#fb923c" },
    { score: 3, label: "Fair",       color: "#f6c90e" },
    { score: 4, label: "Good",       color: "#34d399" },
    { score: 5, label: "Strong",     color: "#48bb78" },
  ];
  return levels[Math.min(score, 5)];
};

const PasswordField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} style={{ ...inp, paddingRight: "2.5rem" }} value={value} onChange={onChange} placeholder={placeholder || ""} />
        <button type="button" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.85rem" }}>
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
};

export const LoginScreen = () => {
  const { login, users } = useApp();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");

  const attempt = () => {
    const error = login(email, password);
    if (error) setErr(error);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", padding: "1rem" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "370px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "44px", height: "44px", background: "linear-gradient(135deg,#00d4ff,#ff6b35)", borderRadius: "10px", margin: "0 auto 0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>◈</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: "#e0e0e0" }}>Lattice</h1>
          <p style={{ color: "#555", fontSize: "0.8rem", marginTop: "4px" }}>Project Management</p>
        </div>
        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
          <input style={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && attempt()} />
          <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        </div>
        {err && <div style={{ color: "#fc8181", fontSize: "0.8rem", marginBottom: "0.75rem", textAlign: "center" }}>{err}</div>}
        <button onClick={attempt} style={{ width: "100%", padding: "0.75rem", background: "linear-gradient(135deg,#00d4ff,#0088aa)", border: "none", borderRadius: "8px", color: "#0a0a18", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
          Sign In
        </button>
        {/* Demo account quick-fill */}
        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #1a1a2e", paddingTop: "1rem" }}>
          <div style={{ fontSize: "0.65rem", color: "#333", textAlign: "center", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Demo Accounts</div>
          {users.filter((u) => SEED_USERS.find((s) => s.id === u.id)).map((u) => (
            <button key={u.id} onClick={() => { setEmail(u.email); setPassword(u.password); }} style={{ width: "100%", marginBottom: "5px", padding: "0.5rem 0.75rem", background: "#15152a", border: "1px solid #252540", borderRadius: "6px", color: "#888", fontSize: "0.78rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{u.name}</span>
              <span style={{ color: { admin: "#ff6b35", manager: "#00d4ff", worker: "#48bb78" }[u.role], textTransform: "capitalize", fontSize: "0.7rem" }}>{u.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MustSetPasswordScreen = () => {
  const { currentUser, completePasswordReset, logout } = useApp();
  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [err,     setErr]     = useState("");
  const strength = pwStrength(pw);

  const save = () => {
    if (!pw)           return setErr("Please enter a new password.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    if (pw !== confirm) return setErr("Passwords do not match.");
    completePasswordReset(pw);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", padding: "1rem" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@300;400;600&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔐</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: "#e0e0e0", marginBottom: "0.4rem" }}>Set Your Password</h2>
          <p style={{ color: "#555", fontSize: "0.82rem" }}>Welcome, {currentUser?.name}. Please choose a personal password before continuing.</p>
        </div>
        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
          <PasswordField label="New Password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Choose a secure password" />
          {pw && (
            <div>
              <div style={{ display: "flex", gap: "3px", marginBottom: "3px" }}>
                {[1,2,3,4,5].map((i) => <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= strength.score ? strength.color : "#1a1a2e" }} />)}
              </div>
              <div style={{ fontSize: "0.7rem", color: strength.color }}>{strength.label}</div>
            </div>
          )}
          <PasswordField label="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" />
          {pw && confirm && (
            <div style={{ fontSize: "0.72rem", color: pw === confirm ? "#48bb78" : "#fc8181" }}>
              {pw === confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
            </div>
          )}
        </div>
        {err && <div style={{ color: "#fc8181", fontSize: "0.8rem", marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: "#fc818115", borderRadius: "6px" }}>{err}</div>}
        <button onClick={save} style={{ width: "100%", padding: "0.75rem", background: "linear-gradient(135deg,#00d4ff,#0088aa)", border: "none", borderRadius: "8px", color: "#0a0a18", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", marginBottom: "0.5rem" }}>
          Set Password &amp; Continue
        </button>
        <button onClick={logout} style={{ width: "100%", padding: "0.5rem", background: "transparent", border: "none", color: "#444", fontSize: "0.75rem", cursor: "pointer" }}>
          Skip for now (you'll be prompted again next login)
        </button>
      </div>
    </div>
  );
};
