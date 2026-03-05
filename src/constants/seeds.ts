import type { User, Project, Task, Supplier, BomEntry, BomStatus, Role } from "../types";

export { bg, clr, font, space, radius, shadow } from "./theme";

// ── Role constants ────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:   "admin"   as Role,
  MANAGER: "manager" as Role,
  WORKER:  "worker"  as Role,
} as const;

// ── Colour maps ───────────────────────────────────────────────────────────────
export const roleColor: Record<Role, string> = {
  admin:   "#ff6b35",
  manager: "#00d4ff",
  worker:  "#48bb78",
};

export const statusColor: Record<string, string> = {
  todo:         "#4a5568",
  "in-progress":"#00d4ff",
  done:         "#48bb78",
  blocked:      "#fc8181",
};

export const prioColor: Record<string, string> = {
  high:   "#fc8181",
  medium: "#f6c90e",
  low:    "#4a5568",
};

export const PRESET_COLORS: string[] = [
  "#ff6b35","#00d4ff","#48bb78","#f6c90e",
  "#a78bfa","#fc8181","#34d399","#60a5fa",
  "#f472b6","#fb923c","#a3e635","#e879f9",
];

// ── BOM status metadata ───────────────────────────────────────────────────────
interface BomMeta {
  label: string;
  icon:  string;
  color: string;
  bg:    string;
}

export const bomStatusMeta: Record<BomStatus, BomMeta> = {
  "used":         { label: "Used",         icon: "✅", color: "#48bb78", bg: "#48bb7820" },
  "not-used":     { label: "Not Used",     icon: "❌", color: "#fc8181", bg: "#fc818120" },
  "under-review": { label: "Under Review", icon: "🔍", color: "#f6c90e", bg: "#f6c90e20" },
  "pending":      { label: "Pending",      icon: "⏳", color: "#888",    bg: "#88888820" },
};

// ── Seed data ─────────────────────────────────────────────────────────────────
export const SEED_USERS: User[] = [
  { id: "u1", name: "Alex Morgan",    email: "alex@company.com",   role: "admin",   password: "admin123",   mustChangePassword: false },
  { id: "u2", name: "Jamie Chen",     email: "jamie@company.com",  role: "manager", password: "manager123", mustChangePassword: false },
  { id: "u3", name: "Sam Rivera",     email: "sam@company.com",    role: "worker",  password: "worker123",  mustChangePassword: false },
  { id: "u4", name: "Taylor Brooks",  email: "taylor@company.com", role: "worker",  password: "worker456",  mustChangePassword: false },
];

export const DEMO_PROJECTS: Project[] = [
  { id: "p1", name: "Server Room Build",  color: "#00d4ff", description: "Phase 1 infrastructure" },
  { id: "p2", name: "Network Upgrade",    color: "#ff6b35", description: "Core switching & routing" },
  { id: "p3", name: "Security Audit",     color: "#a78bfa", description: "Annual compliance review" },
];

export const DEMO_TASKS: Task[] = [
  { id: "t1",  title: "Rack layout design",         projectId: "p1", assigneeId: "u2", startDate: "2025-01-05", endDate: "2025-01-15", status: "done",        priority: "high"   },
  { id: "t2",  title: "Order server hardware",      projectId: "p1", assigneeId: "u1", startDate: "2025-01-10", endDate: "2025-01-20", status: "done",        priority: "high"   },
  { id: "t3",  title: "Cable management plan",      projectId: "p1", assigneeId: "u3", startDate: "2025-01-15", endDate: "2025-02-01", status: "in-progress", priority: "medium" },
  { id: "t4",  title: "UPS installation",           projectId: "p1", assigneeId: "u4", startDate: "2025-01-20", endDate: "2025-02-10", status: "todo",        priority: "high"   },
  { id: "t5",  title: "Core switch configuration",  projectId: "p2", assigneeId: "u2", startDate: "2025-01-08", endDate: "2025-01-25", status: "in-progress", priority: "high"   },
  { id: "t6",  title: "VLAN segmentation",          projectId: "p2", assigneeId: "u3", startDate: "2025-01-20", endDate: "2025-02-05", status: "todo",        priority: "medium" },
  { id: "t7",  title: "Firewall rules review",      projectId: "p2", assigneeId: "u1", startDate: "2025-01-25", endDate: "2025-02-15", status: "todo",        priority: "high"   },
  { id: "t8",  title: "Access control audit",       projectId: "p3", assigneeId: "u2", startDate: "2025-01-12", endDate: "2025-01-30", status: "blocked",     priority: "high"   },
  { id: "t9",  title: "Penetration test prep",      projectId: "p3", assigneeId: "u4", startDate: "2025-01-18", endDate: "2025-02-08", status: "todo",        priority: "medium" },
  { id: "t10", title: "Compliance documentation",   projectId: "p3", assigneeId: "u3", startDate: "2025-01-22", endDate: "2025-02-20", status: "todo",        priority: "low"    },
];

export const DEMO_SUPPLIERS: Supplier[] = [
  {
    id: "s1", name: "TechCore Supplies", contact: "orders@techcore.com", phone: "03 9000 1111",
    parts: [
      { id: "pt1", partNumber: "TC-SRV-001", description: "1U Rack Server 32GB",    unitQty: 1, unit: "unit" },
      { id: "pt2", partNumber: "TC-CAB-010", description: "Cat6A Patch Cable 1m",   unitQty: 50, unit: "m"   },
      { id: "pt3", partNumber: "TC-PSU-220", description: "Redundant PSU 750W",     unitQty: 1, unit: "unit" },
    ],
    orders: [
      { id: "o1", description: "Initial server order Q1", orderedDate: "2025-01-05", leadTimeDays: 14, partIds: ["pt1","pt3"], arrived: true,  arrivedDate: "2025-01-19" },
      { id: "o2", description: "Cable bulk order",        orderedDate: "2025-01-18", leadTimeDays: 7,  partIds: ["pt2"],       arrived: false, arrivedDate: null         },
    ],
  },
  {
    id: "s2", name: "NetGear Pro",        contact: "sales@netgearpro.com", phone: "02 8000 2222",
    parts: [
      { id: "pt4", partNumber: "NG-SW-48G",  description: "48-Port Gigabit Switch",  unitQty: 1, unit: "unit" },
      { id: "pt5", partNumber: "NG-SFP-10G", description: "10G SFP+ Transceiver",   unitQty: 4, unit: "pack" },
    ],
    orders: [
      { id: "o3", description: "Core switches for network upgrade", orderedDate: "2025-01-10", leadTimeDays: 21, partIds: ["pt4","pt5"], arrived: false, arrivedDate: null },
    ],
  },
];

export const DEMO_BOM: BomEntry[] = [
  { id: "b1", supplierId: "s1", partId: "pt1", qtyOrdered: 4,  status: "used",         notes: "4× servers installed in rack A. Consider higher-spec for Phase 2.", project: "Server Room Build" },
  { id: "b2", supplierId: "s1", partId: "pt2", qtyOrdered: 10, status: "pending",       notes: "",                                                                  project: "Server Room Build" },
  { id: "b3", supplierId: "s1", partId: "pt3", qtyOrdered: 4,  status: "used",         notes: "One PSU failed on arrival — replacement on order.",                  project: "Server Room Build" },
  { id: "b4", supplierId: "s2", partId: "pt4", qtyOrdered: 2,  status: "under-review", notes: "Reviewing whether 48-port is sufficient or need 24-port alternative.", project: "Network Upgrade" },
  { id: "b5", supplierId: "s2", partId: "pt5", qtyOrdered: 2,  status: "not-used",     notes: "SFPs not yet installed — waiting on switch delivery.",                project: "Network Upgrade" },
];
