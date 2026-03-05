import { useMemo } from "react";
import type { Role, User, Task } from "../types";
import { useApp } from "../context/AppContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { roleColor } from "../constants/seeds";
import { todayStr } from "../utils/dateHelpers";
import { Avatar, Btn } from "../components/ui";
import { bg, clr, font, radius, space } from "../constants/theme";
import React from "react";

interface TeamMemberCardProps {
  user: User;
  userTasks: Task[];
  isSelf: boolean;
  isAdmin: boolean;
  isMobile: boolean;
  onEdit: (user: User) => void;
  onResetPw: (user: User) => void;
  onRemove: (user: User) => void;
}

const TeamMemberCard = React.memo(({ 
  user, userTasks, isSelf, isAdmin, isMobile, onEdit, onResetPw, onRemove 
}: TeamMemberCardProps) => {
  const now = todayStr();
  const done = userTasks.filter((t) => t.status === "done").length;
  const overdue = userTasks.filter((t) => t.endDate < now && t.status !== "done").length;
  const inProg = userTasks.filter((t) => t.status === "in-progress").length;

  return (
    <div style={{ background: bg.card, border: "1px solid #1e1e35", borderRadius: radius.xl, padding: "1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: space["6"], flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
        <Avatar name={user.name} role={user.role} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: space["3"], flexWrap: "wrap", marginBottom: radius.sm }}>
            <span style={{ fontWeight: 600, color: clr.textPrimary, fontSize: font.h3 }}>{user.name}</span>
            <span style={{ fontSize: "0.7rem", color: roleColor[user.role as Role], background: `${roleColor[user.role as Role]}18`, padding: "1px 8px", borderRadius: radius.sm, textTransform: "capitalize" }}>{user.role}</span>
            {isSelf && <span style={{ fontSize: font.xs, color: clr.textFaint, background: bg.muted, padding: "1px 6px", borderRadius: radius.sm }}>you</span>}
            {user.mustChangePassword && <span style={{ fontSize: font.xs, color: clr.yellow, background: "#f6c90e18", border: "1px solid #f6c90e40", padding: "1px 6px", borderRadius: radius.sm }}>⚠ pw reset</span>}
          </div>
          <div style={{ fontSize: space["5"], color: clr.textFaint, marginBottom: space["5"] }}>{user.email}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(55px, auto))", gap: space["3"], justifyContent: "start" }}>
            {[["Total", userTasks.length, clr.textMuted], ["In Progress", inProg, clr.cyan], ["Done", done, clr.green], ["Overdue", overdue, clr.red]].map(([l, v, c]) => (
              <div key={l} style={{ background: bg.raised, borderRadius: radius.md, padding: "0.35rem 0.65rem", textAlign: "center", minWidth: "55px" }}>
                <div style={{ fontSize: space["6"], color: c as any, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: font.xxs, color: clr.textGhost }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: space["2"], flexWrap: "wrap", flexShrink: 0 }}>
            <button onClick={() => onEdit(user)} style={{ padding: "0.35rem 0.75rem", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.md, color: clr.textMuted, fontSize: font.md, cursor: "pointer" }} aria-label={`Edit user ${user.name}`}>Edit</button>
            {!isSelf && (
              <button
                onClick={() => onResetPw(user)}
                title="Force password reset on next login"
                style={{ padding: "0.35rem 0.75rem", background: "#f6c90e18", border: "1px solid #f6c90e50", borderRadius: radius.md, color: clr.yellow, fontSize: font.md, cursor: "pointer" }}
                aria-label={`Reset password for ${user.name}`}
              >
                Reset PW
              </button>
            )}
            {!isSelf && (
              <button onClick={() => onRemove(user)} style={{ padding: "0.35rem 0.6rem", background: "#fc818115", border: "1px solid #fc818150", borderRadius: radius.md, color: clr.red, fontSize: font.md, cursor: "pointer" }} aria-label={`Remove user ${user.name}`}>Remove</button>
            )}
          </div>
        )}
        {!isAdmin && isSelf && (
          <button onClick={() => onEdit(user)} style={{ padding: "0.35rem 0.75rem", background: bg.overlay, border: "1px solid #252540", borderRadius: radius.md, color: clr.textMuted, fontSize: font.md, cursor: "pointer" }} aria-label="Edit your profile">Edit Profile</button>
        )}
      </div>
    </div>
  );
});
TeamMemberCard.displayName = "TeamMemberCard";

export const TeamPage = () => {
  const { users, tasks, isAdmin, currentUser, setMemberModal, setUsers, setConfirmRemove } = useApp();
  const { isMobile } = useBreakpoint();

  // Memoize user task data to prevent unnecessary re-renders
  const usersWithTasks = useMemo(() =>
    users.map((u) => ({
      user: u,
      tasks: tasks.filter((t) => t.assigneeId === u.id),
    })),
    [users, tasks]
  );

  const handleResetPw = (user: User) => {
    setUsers((p: User[]) => p.map((x) => x.id === user.id ? { ...x, mustChangePassword: true } : x));
  };

  const handleRemove = (user: User) => {
    setConfirmRemove({ userId: user.id, name: user.name });
  };
  
  if (!currentUser) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space["6"], flexWrap: "wrap", gap: space["3"] }}>
        <p style={{ color: clr.textFaint, fontSize: "0.8rem" }}>{users.length} team member{users.length !== 1 ? "s" : ""}</p>
        {isAdmin && <Btn color={clr.cyan} onClick={() => setMemberModal({})}>+ Add Member</Btn>}
      </div>

      <div style={{ display: "grid", gap: space["5"] }}>
        {usersWithTasks.map(({ user: u, tasks: userTasks }) => (
          <TeamMemberCard
            key={u.id}
            user={u}
            userTasks={userTasks}
            isSelf={u.id === currentUser.id}
            isAdmin={isAdmin}
            isMobile={isMobile}
            onEdit={setMemberModal}
            onResetPw={handleResetPw}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
};
