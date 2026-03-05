import type { Role } from "../types";
import { useApp } from "../context/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { roleColor } from "../constants/seeds";
import { todayStr } from "../utils/dateHelpers";
import { Avatar, Btn } from "../components/ui";
import { bg, clr, font, radius, space } from "../constants/theme";

export const TeamPage = () => {
  const { users, tasks, isAdmin, currentUser, setMemberModal, setUsers, setConfirmRemove } = useApp();
  const { isMobile } = useBreakpoint();
  
  if (!currentUser) return null;
  const now = todayStr();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["6"], flexWrap: "wrap", gap: space["3"] }}>
        <p style={{ color: clr.textFaint, fontSize: "0.8rem" }}>{users.length} team member{users.length !== 1 ? "s" : ""}</p>
        {isAdmin && <Btn color={clr.cyan} onClick={() => setMemberModal({})}>+ Add Member</Btn>}
      </div>

      <div style={{ display: "grid", gap: space["5"] }}>
        {users.map((u) => {
          const isSelf    = u.id === currentUser.id;
          const userTasks = tasks.filter((t) => t.assigneeId === u.id);
          const done      = userTasks.filter((t) => t.status === "done").length;
          const overdue   = userTasks.filter((t) => t.endDate < now && t.status !== "done").length;
          const inProg    = userTasks.filter((t) => t.status === "in-progress").length;

          return (
            <div key={u.id} style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: space["6"], flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
                <Avatar name={u.name} role={u.role} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: space["3"], flexWrap: "wrap", marginBottom: radius.sm }}>
                    <span style={{ fontWeight: 600, color: clr.textPrimary, fontSize: font.h3 }}>{u.name}</span>
                    <span style={{ fontSize: "0.7rem", color: roleColor[u.role as Role], background: `${roleColor[u.role as Role]}18`, padding: "1px 8px", borderRadius: radius.sm, textTransform: "capitalize" }}>{u.role}</span>
                    {isSelf && <span style={{ fontSize: font.xs, color: clr.textFaint, background: bg.muted, padding: "1px 6px", borderRadius: radius.sm }}>you</span>}
                    {u.mustChangePassword && <span style={{ fontSize: font.xs, color: clr.yellow, background: "#f6c90e18", border: "1px solid #f6c90e40", padding: "1px 6px", borderRadius: radius.sm }}>⚠ pw reset</span>}
                  </div>
                  <div style={{ fontSize: space["5"], color: clr.textFaint, marginBottom: space["5"] }}>{u.email}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(55px, auto))", gap: space["3"], justifyContent: "start" }}>
                    {[["Total", userTasks.length, clr.textMuted],["In Progress", inProg, clr.cyan],["Done", done, clr.green],["Overdue", overdue, clr.red]].map(([l, v, c]) => (
                      <div key={l} style={{ background: bg.raised, borderRadius: radius.md, padding: "0.35rem 0.65rem", textAlign: "center", minWidth: "55px" }}>
                        <div style={{ fontSize: space["6"], color: c as any, fontWeight: 700 }}>{v}</div>
                        <div style={{ fontSize: font.xxs, color: clr.textGhost }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: space["2"], flexWrap: "wrap", flexShrink: 0 }}>
                    <button onClick={() => setMemberModal(u)} style={{ padding: "0.35rem 0.75rem", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.md, color: clr.textMuted, fontSize: font.md, cursor: "pointer" }}>Edit</button>
                    {!isSelf && (
                      <button
                        onClick={() => setUsers((p: import("../types").User[]) => p.map((x) => x.id === u.id ? { ...x, mustChangePassword: true } : x))}
                        title="Force password reset on next login"
                        style={{ padding: "0.35rem 0.75rem", background: "#f6c90e18", border: "1px solid #f6c90e50", borderRadius: radius.md, color: clr.yellow, fontSize: font.md, cursor: "pointer" }}
                      >
                        Reset PW
                      </button>
                    )}
                    {!isSelf && (
                      <button onClick={() => setConfirmRemove({ userId: u.id, name: u.name })} style={{ padding: "0.35rem 0.6rem", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.md, color: clr.red, fontSize: font.md, cursor: "pointer" }}>Remove</button>
                    )}
                  </div>
                )}
                {!isAdmin && isSelf && (
                  <button onClick={() => setMemberModal(u)} style={{ padding: "0.35rem 0.75rem", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.md, color: clr.textMuted, fontSize: font.md, cursor: "pointer" }}>Edit Profile</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
