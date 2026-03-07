import { useState } from "react";
import { bg, clr, font, radius, space } from "../constants/theme";

export const APP_VERSION = "v3.6";

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW — linear first-time setup path
// Each step has a "why this order matters" context line
// ─────────────────────────────────────────────────────────────────────────────
const WORKFLOW: WorkflowStep[] = [
  {
    seq: 1,
    icon: "👥",
    tab: "Team",
    title: "Add your team first",
    why: "Tasks need people to assign to. Set up the team before anything else.",
    steps: [
      "Go to the Team tab and click Add Member.",
      "Enter their name, email, role and a temporary password.",
      "Roles matter: Admin has full access including team management. Manager has full operations access. Office can manage tasks and view all data. Shopfloor can only see and update their own assigned tasks.",
      "Add yourself as Admin first, then add everyone else.",
      "They'll be prompted to set their own password on first login.",
    ],
    tip: "Even if you're working solo, create at least one Worker account to test role-based views.",
    next: "Now you have people — next you need something to work on.",
  },
  {
    seq: 2,
    icon: "🗂️",
    tab: "Projects",
    title: "Create your first project",
    why: "Projects are the container everything else lives in — tasks, BOM entries, and Gantt bars all belong to a project.",
    steps: [
      "Go to Projects and click New Project.",
      "Give it a name and pick a colour — this colour identifies it throughout the whole app.",
      "Add a description if useful, then save.",
      "The progress bar fills automatically as tasks are marked done.",
    ],
    tip: "Create one real project now. You can always add more later.",
    next: "Project exists. Now set up where your parts and materials come from.",
  },
  {
    seq: 3,
    icon: "📦",
    tab: "Suppliers",
    title: "Add a supplier and their parts",
    why: "Parts must live under a supplier before they can appear in the BOM. Set this up before building your materials list.",
    steps: [
      "Go to Suppliers and click Add Supplier. Enter the company name, contact name, email and phone.",
      "Expand the supplier card and click Add Part. Give it a part number, description, the unit type (e.g. metres, units, kg) and how many units come per order.",
      "Add all the parts you expect to order from this supplier.",
      "Once a part is ordered, click Add Order on the supplier card — set the date ordered and lead time in days. The app will calculate estimated arrival and flag it if overdue.",
      "When stock arrives, click Confirm Arrival on the order row.",
    ],
    tip: "Part numbers are shown in monospace throughout the app — keep them consistent with your actual purchasing system.",
    next: "Parts exist. Now link them to your project in the Bill of Materials.",
  },
  {
    seq: 4,
    icon: "🔩",
    tab: "BOM",
    title: "Build the Bill of Materials",
    why: "The BOM connects your parts to your project, tracking what's been ordered, what's in use, and what's delayed.",
    steps: [
      "On the Suppliers page, click Edit on any part row — this opens the BOM entry modal.",
      "Set the quantity ordered, the usage status (start with Pending), and link it to your project.",
      "You can also link it to a specific task — useful for seeing which parts are blocking which work.",
      "Back on the BOM tab, use the status filter pills to see Pending / Used / Not Used / Under Review.",
      "Use the task/project dropdown to filter the BOM to a specific project or task.",
      "Alert indicators appear automatically when a linked task is overdue or a delivery is late.",
    ],
    tip: "Link BOM entries to tasks now — it pays off when you're checking what's blocking progress.",
    next: "Materials are tracked. Now create the actual work items.",
  },
  {
    seq: 5,
    icon: "✅",
    tab: "Tasks",
    title: "Create and assign tasks",
    why: "Tasks are the core unit of work. With team members and a project already set up, everything links together cleanly.",
    steps: [
      "Go to Tasks and click New Task.",
      "Set the title, project, assignee, start date, end date, status (start with To Do) and priority.",
      "Use Depends On to set prerequisites — a task won't show as ready until its dependencies are done. ⛔ blocked badges appear automatically.",
      "Workers only see their own assigned tasks. Managers and Admins see everything.",
      "Filter the task list by project, status, assignee, or priority using the filter bar.",
      "Export the current filtered view to CSV using the export button.",
    ],
    tip: "Set real dates — overdue tasks surface on the Dashboard and trigger notifications for the whole team.",
    next: "Tasks are created. Now see them on the timeline.",
  },
  {
    seq: 6,
    icon: "📅",
    tab: "Timeline",
    title: "Review the timeline",
    why: "The Gantt view gives you and the team a visual picture of what's happening and when — dependencies show as arrows between bars.",
    steps: [
      "Go to Timeline and select your project from the pill selector.",
      "Each task appears as a bar spanning its start and end dates.",
      "Dependency arrows connect bars — green solid = dependency complete, red dashed = still pending.",
      "Toggle Show All to dim other projects behind your focused one.",
      "Click any bar to open and edit that task directly.",
      "Tasks without dates won't appear — go back to Tasks and add dates if bars are missing.",
    ],
    tip: "Share your screen on the Timeline view for stand-ups — it's the clearest way to show project status at a glance.",
    next: "Timeline looks good. Check the daily briefing on the Dashboard.",
  },
  {
    seq: 7,
    icon: "🏠",
    tab: "Dashboard",
    title: "Read the daily briefing",
    why: "The Dashboard surfaces everything that needs attention right now — overdue work, upcoming deadlines, delivery alerts.",
    steps: [
      "The stat cards at the top show counts for overdue tasks, tasks due this week, deliveries due, and active projects. Click any card to jump to the relevant filtered view.",
      "Active Tasks lists your most urgent work. ⛔ badges show blocked tasks.",
      "Delivery Alerts shows orders whose estimated arrival has passed — chase these first.",
      "Project Progress shows completion percentages at a glance.",
      "Recent Activity shows the last 10 changes made by anyone on the team.",
    ],
    tip: "Start every day here. Everything that needs action is surfaced automatically.",
    next: "You're up and running. Two more things worth setting up now.",
  },
  {
    seq: 8,
    icon: "📊",
    tab: "Topbar → 📊",
    title: "Generate a weekly summary",
    why: "The Weekly Summary saves you writing status updates manually — it produces a role-filtered report in one click.",
    steps: [
      "Click the 📊 button in the top bar to open the summary.",
      "Worker view shows your personal task list. Manager view adds project snapshots and upcoming deliveries. Admin view adds full team workload and supplier chase list.",
      "Use Copy Text to paste into an email or message, or Export HTML to save a standalone file.",
      "The summary automatically filters to what's relevant for the logged-in user's role.",
    ],
    tip: "Run this every Friday. It takes 10 seconds and keeps everyone aligned without a meeting.",
    next: "Last step — protect your data.",
  },
  {
    seq: 9,
    icon: "💾",
    tab: "Topbar → 💾",
    title: "Back up your data",
    why: "Lattice PM stores everything in your browser. If you clear browser data, it's gone — so back up regularly.",
    steps: [
      "Click the 💾 button in the top bar (Admin only) to open Backup & Restore.",
      "Click Export Backup to download a full JSON snapshot — all users, projects, tasks, suppliers, parts, orders and BOM.",
      "To restore, drag and drop a backup file onto the restore area, or click to browse. A preview shows exactly what will be imported before you confirm.",
      "The storage meter shows how much of your browser's localStorage quota is in use.",
    ],
    tip: "Export a backup before making large changes. It's your only safety net until the backend migration to PocketBase.",
    next: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE — browse by topic (same content, non-linear)
// ─────────────────────────────────────────────────────────────────────────────
const REFERENCE = WORKFLOW.map(w => ({ ...w })); // same data, different presentation

interface WorkflowStep {
  seq: number;
  icon: string;
  tab: string;
  title: string;
  why: string;
  steps: string[];
  tip: string;
  next: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TabBadge({ tab }: { tab: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "0.35rem",
      padding: "2px 10px", borderRadius: radius.pill,
      border: `1px solid ${clr.cyan}30`, background: `${clr.cyan}0c`,
      fontSize: font.xs, color: clr.cyan, marginBottom: space["5"],
    }}>
      <span style={{ opacity: 0.6 }}>Go to:</span>
      <strong>{tab}</strong>
    </div>
  );
}

function WhyBox({ text }: { text: string }) {
  return (
    <div style={{
      padding: `${space["3"]} ${space["5"]}`,
      background: `${clr.purple}0d`,
      border: `1px solid ${clr.purple}25`,
      borderRadius: radius.md,
      fontSize: font.md,
      color: "#c4b5fd",
      lineHeight: 1.65,
      marginBottom: space["5"],
    }}>
      <span style={{ opacity: 0.7, marginRight: "0.4rem" }}>Why now →</span>{text}
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: space["4"], marginBottom: space["6"] }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: space["4"], alignItems: "flex-start" }}>
          <div style={{
            width: "20px", height: "20px", borderRadius: radius.full, flexShrink: 0,
            background: `${clr.cyan}1a`, border: `1px solid ${clr.cyan}35`,
            color: clr.cyan, fontSize: font.xs, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1px",
          }}>{i + 1}</div>
          <p style={{ fontSize: font.md, color: clr.textSecondary, lineHeight: 1.65, margin: 0 }}>{s}</p>
        </div>
      ))}
    </div>
  );
}

function TipBox({ text }: { text: string }) {
  return (
    <div style={{
      padding: `${space["3"]} ${space["5"]}`,
      background: `${clr.yellow}0d`,
      border: `1px solid ${clr.yellow}30`,
      borderRadius: radius.md,
      fontSize: font.md, color: clr.yellow, lineHeight: 1.6,
      marginBottom: space["5"],
    }}>
      <span style={{ fontWeight: 700 }}>💡 </span>{text}
    </div>
  );
}

function NextBox({ text }: { text: string }) {
  return (
    <div style={{
      padding: `${space["3"]} ${space["5"]}`,
      background: `${clr.green}0d`,
      border: `1px solid ${clr.green}25`,
      borderRadius: radius.md,
      fontSize: font.md, color: clr.green, lineHeight: 1.6,
    }}>
      <span style={{ opacity: 0.7 }}>Next → </span>{text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────
interface GuidePanelProps { onClose: () => void; }

export const GuidePanel = ({ onClose }: GuidePanelProps) => {
  const [mode, setMode]           = useState<"workflow" | "reference">("workflow");
  const [workflowStep, setWorkflowStep] = useState(0);
  const [refStep, setRefStep]     = useState(0);

  const isWorkflow = mode === "workflow";
  const step: WorkflowStep = isWorkflow ? WORKFLOW[workflowStep] : REFERENCE[refStep];
  const total = isWorkflow ? WORKFLOW.length : REFERENCE.length;
  const current = isWorkflow ? workflowStep : refStep;
  const setCurrent = isWorkflow ? setWorkflowStep : setRefStep;
  const isLast = current === total - 1;
  const isFirst = current === 0;
  const pct = Math.round((current / (total - 1)) * 100);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400 }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(500px, 100vw)",
        background: bg.card,
        borderLeft: `1px solid ${bg.muted}`,
        zIndex: 401,
        display: "flex", flexDirection: "column",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.7)",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: `${space["5"]} ${space["6"]}`,
          borderBottom: `1px solid ${bg.border}`,
          background: bg.subtle, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: font.h2, color: clr.textPrimary }}>
              {isWorkflow ? "Getting Started" : "Feature Reference"}
            </div>
            <div style={{ fontSize: font.xs, color: clr.textFaint, marginTop: "2px" }}>
              {isWorkflow
                ? "Follow the steps in order to set up Lattice PM from scratch"
                : "Browse any feature independently"}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close guide"
            style={{ background: "none", border: "none", color: clr.textMuted, fontSize: "1.1rem", cursor: "pointer", padding: space["2"] }}>✕</button>
        </div>

        {/* ── Mode toggle ── */}
        <div style={{
          display: "flex", padding: `${space["3"]} ${space["6"]}`,
          borderBottom: `1px solid ${bg.border}`,
          gap: space["3"], flexShrink: 0, background: bg.card,
        }}>
          {(["workflow", "reference"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: `${space["2"]} 0`,
              borderRadius: radius.md,
              border: `1px solid ${mode === m ? clr.cyan + "50" : bg.muted}`,
              background: mode === m ? `${clr.cyan}15` : "transparent",
              color: mode === m ? clr.cyan : clr.textGhost,
              fontSize: font.base, cursor: "pointer", fontWeight: mode === m ? 600 : 400,
              transition: "all 0.15s",
            }}>
              {m === "workflow" ? "⟶ Guided Setup" : "⊞ Reference"}
            </button>
          ))}
        </div>

        {/* ── Workflow progress bar ── */}
        {isWorkflow && (
          <div style={{ padding: `${space["3"]} ${space["6"]} 0`, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: font.xxs, color: clr.textGhost, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Step {current + 1} of {total}
              </span>
              <span style={{ fontSize: font.xxs, color: clr.textGhost }}>{pct}% complete</span>
            </div>
            <div style={{ height: "3px", background: bg.border, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${clr.cyan}, ${clr.green})`,
                transition: "width 0.35s ease",
              }} />
            </div>
          </div>
        )}

        {/* ── Reference step pills ── */}
        {!isWorkflow && (
          <div style={{
            display: "flex", gap: "0.35rem", flexWrap: "wrap",
            padding: `${space["3"]} ${space["6"]}`,
            borderBottom: `1px solid ${bg.border}`, flexShrink: 0,
          }}>
            {REFERENCE.map((s, i) => (
              <button key={i} onClick={() => setRefStep(i)} style={{
                padding: "2px 9px", borderRadius: radius.pill,
                border: `1px solid ${refStep === i ? clr.cyan + "60" : bg.muted}`,
                background: refStep === i ? `${clr.cyan}18` : "transparent",
                color: refStep === i ? clr.cyan : clr.textGhost,
                fontSize: font.xxs, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                {s.icon} {s.title.split(" ").slice(0, 3).join(" ")}
              </button>
            ))}
          </div>
        )}

        {/* ── Step content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: space["6"] }}>
          {/* Seq badge (workflow only) */}
          {isWorkflow && (
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "28px", height: "28px", borderRadius: radius.full,
              border: `1px solid ${clr.cyan}40`, background: `${clr.cyan}15`,
              color: clr.cyan, fontSize: font.base, fontWeight: 700,
              marginBottom: space["4"],
            }}>{step.seq}</div>
          )}

          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: space["4"], marginBottom: space["4"] }}>
            <span style={{ fontSize: "1.5rem" }}>{step.icon}</span>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: font.h2, color: clr.textPrimary, lineHeight: 1.2, margin: 0,
            }}>{step.title}</h3>
          </div>

          <TabBadge tab={step.tab} />
          <WhyBox text={step.why} />
          <StepList steps={step.steps} />
          <TipBox text={step.tip} />
          {step.next && <NextBox text={step.next} />}
        </div>

        {/* ── Footer navigation ── */}
        <div style={{
          padding: `${space["4"]} ${space["6"]}`,
          borderTop: `1px solid ${bg.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, background: bg.subtle,
        }}>
          <button
            onClick={() => setCurrent(i => Math.max(0, i - 1))}
            disabled={isFirst}
            style={{
              padding: `${space["2"]} ${space["5"]}`,
              borderRadius: radius.md,
              border: `1px solid ${bg.muted}`,
              background: "transparent",
              color: isFirst ? bg.muted : clr.textMuted,
              fontSize: font.base, cursor: isFirst ? "default" : "pointer",
            }}
          >← Back</button>

          {/* Workflow: dot indicators */}
          {isWorkflow && (
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              {WORKFLOW.map((_, i) => (
                <div key={i} onClick={() => setCurrent(i)} style={{
                  width: i === current ? "18px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i < current ? clr.green : i === current ? clr.cyan : bg.muted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }} />
              ))}
            </div>
          )}

          {/* Reference: step count */}
          {!isWorkflow && (
            <span style={{ fontSize: font.xs, color: clr.textGhost }}>
              {current + 1} / {total}
            </span>
          )}

          {!isLast ? (
            <button
              onClick={() => setCurrent(i => Math.min(total - 1, i + 1))}
              style={{
                padding: `${space["2"]} ${space["5"]}`,
                borderRadius: radius.md,
                border: `1px solid ${clr.cyan}50`,
                background: `${clr.cyan}15`,
                color: clr.cyan, fontSize: font.base, cursor: "pointer",
              }}
            >Next →</button>
          ) : (
            <button onClick={onClose} style={{
              padding: `${space["2"]} ${space["5"]}`,
              borderRadius: radius.md,
              border: `1px solid ${clr.green}50`,
              background: `${clr.green}15`,
              color: clr.green, fontSize: font.base, cursor: "pointer",
            }}>Done ✓</button>
          )}
        </div>
      </div>
    </>
  );
};
