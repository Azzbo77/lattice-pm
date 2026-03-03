import { useApp } from "../context/AppContext";
import { roleColor } from "../constants/seeds";
import { todayStr } from "../utils/dateHelpers";
import { Avatar, Btn } from "../components/ui";

export const TeamPage = () => {
  const { users, tasks, isAdmin, canManage, currentUser, setMemberModal, setConfirmRemove, setUsers } = useApp();
  const now = todayStr();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <p style={{ color: "#555", fontSize: "0.8rem" }}>{users.length} team member{users.length !== 1 ? "s" : ""}</p>
        {isAdmin && <Btn color="#00d4ff" onClick={() => setMemberModal({})}>+ Add Member</Btn>}
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {users.map((u) => {
          const isSelf    = u.id === currentUser.id;
          const userTasks = tasks.filter((t) => t.assigneeId === u.id);
          const done      = userTasks.filter((t) => t.status === "done").length;
          const overdue   = userTasks.filter((t) => t.endDate < now && t.status !== "done").length;
          const inProg    = userTasks.filter((t) => t.status === "in-progress").length;

          return (
            <div key={u.id} style={{ background: "#0f0f1e", border: "1px solid #1e1e35", borderRadius: "10px", padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <Avatar name={u.name} role={u.role} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "#e0e0e0", fontSize: "0.95rem" }}>{u.name}</span>
                    <span style={{ fontSize: "0.7rem", color: roleColor[u.role], background: `${roleColor[u.role]}18`, padding: "1px 8px", borderRadius: "4px", textTransform: "capitalize" }}>{u.role}</span>
                    {isSelf && <span style={{ fontSize: "0.62rem", color: "#555", background: "#252540", padding: "1px 6px", borderRadius: "4px" }}>you</span>}
                    {u.mustChangePassword && <span style={{ fontSize: "0.62rem", color: "#f6c90e", background: "#f6c90e18", border: "1px solid #f6c90e40", padding: "1px 6px", borderRadius: "4px" }}>⚠ pw reset</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.75rem" }}>{u.email}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: "0.5rem", justifyContent: "start" }}>
                    {[["Total", userTasks.length, "#888"],["In Progress", inProg, "#00d4ff"],["Done", done, "#48bb78"],["Overdue", overdue, "#fc8181"]].map(([l, v, c]) => (
                      <div key={l} style={{ background: "#15152a", borderRadius: "6px", padding: "0.35rem 0.65rem", textAlign: "center", minWidth: "55px" }}>
                        <div style={{ fontSize: "1rem", color: c, fontWeight: 700 }}>{v}</div>
                        <div style={{ fontSize: "0.6rem", color: "#444" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", flexShrink: 0 }}>
                    <button onClick={() => setMemberModal(u)} style={{ padding: "0.35rem 0.75rem", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "6px", color: "#888", fontSize: "0.78rem", cursor: "pointer" }}>Edit</button>
                    {!isSelf && (
                      <button
                        onClick={() => setUsers((p) => p.map((x) => x.id === u.id ? { ...x, mustChangePassword: true } : x))}
                        title="Force password reset on next login"
                        style={{ padding: "0.35rem 0.75rem", background: "#f6c90e18", border: "1px solid #f6c90e50", borderRadius: "6px", color: "#f6c90e", fontSize: "0.78rem", cursor: "pointer" }}
                      >
                        Reset PW
                      </button>
                    )}
                    {!isSelf && (
                      <button onClick={() => setConfirmRemove({ userId: u.id, name: u.name })} style={{ padding: "0.35rem 0.6rem", background: "#fc818115", border: "1px solid #fc818150", borderRadius: "6px", color: "#fc8181", fontSize: "0.78rem", cursor: "pointer" }}>Remove</button>
                    )}
                  </div>
                )}
                {!isAdmin && isSelf && (
                  <button onClick={() => setMemberModal(u)} style={{ padding: "0.35rem 0.75rem", background: "#1a1a2e", border: "1px solid #252540", borderRadius: "6px", color: "#888", fontSize: "0.78rem", cursor: "pointer" }}>Edit Profile</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
