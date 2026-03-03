export const ROLES = { ADMIN: "admin", MANAGER: "manager", WORKER: "worker" };

export const roleColor = {
  admin: "#ff6b35",
  manager: "#00d4ff",
  worker: "#48bb78",
};

export const statusColor = {
  todo: "#4a5568",
  "in-progress": "#00d4ff",
  done: "#48bb78",
  blocked: "#fc8181",
};

export const prioColor = {
  low: "#4a5568",
  medium: "#f6c90e",
  high: "#fc8181",
};

export const bomStatusMeta = {
  pending:       { color: "#888",    bg: "#88888818", label: "Pending",      icon: "⏳" },
  used:          { color: "#48bb78", bg: "#48bb7818", label: "Used",         icon: "✅" },
  "not-used":    { color: "#fc8181", bg: "#fc818118", label: "Not Used",     icon: "❌" },
  "under-review":{ color: "#f6c90e", bg: "#f6c90e18", label: "Under Review", icon: "🔍" },
};

export const PRESET_COLORS = [
  "#00d4ff","#ff6b35","#48bb78","#f6c90e","#a78bfa",
  "#f472b6","#fb923c","#34d399","#60a5fa","#e879f9",
  "#f87171","#94a3b8",
];

export const SEED_USERS = [
  { id: "u1", name: "Alex Morgan",   email: "alex@company.com",   role: ROLES.ADMIN,   password: "admin123",   avatar: "AM" },
  { id: "u2", name: "Jamie Chen",    email: "jamie@company.com",  role: ROLES.MANAGER, password: "manager123", avatar: "JC" },
  { id: "u3", name: "Sam Rivera",    email: "sam@company.com",    role: ROLES.WORKER,  password: "worker123",  avatar: "SR" },
  { id: "u4", name: "Taylor Brooks", email: "taylor@company.com", role: ROLES.WORKER,  password: "worker456",  avatar: "TB" },
];

export const DEMO_PROJECTS = [
  { id: "p1", name: "Website Redesign",  color: "#00d4ff" },
  { id: "p2", name: "Mobile App Launch", color: "#ff6b35" },
];

export const DEMO_TASKS = [
  { id: "t1", projectId: "p1", title: "Design Mockups",      assigneeId: "u3", startDate: "2026-03-01", endDate: "2026-03-10", status: "in-progress", priority: "high",   description: "" },
  { id: "t2", projectId: "p1", title: "Frontend Development",assigneeId: "u4", startDate: "2026-03-08", endDate: "2026-03-25", status: "todo",        priority: "high",   description: "" },
  { id: "t3", projectId: "p1", title: "Backend API",         assigneeId: "u2", startDate: "2026-03-05", endDate: "2026-03-20", status: "in-progress", priority: "medium", description: "" },
  { id: "t4", projectId: "p2", title: "App Architecture",    assigneeId: "u3", startDate: "2026-03-12", endDate: "2026-03-18", status: "todo",        priority: "high",   description: "" },
  { id: "t5", projectId: "p2", title: "QA Testing",          assigneeId: "u4", startDate: "2026-03-22", endDate: "2026-03-31", status: "todo",        priority: "medium", description: "" },
];

export const DEMO_SUPPLIERS = [
  {
    id: "s1", name: "TechParts Co.", contact: "orders@techparts.com", phone: "+1-555-0100",
    parts: [
      { id: "pt1", partNumber: "TP-SRV-001", description: "Rack Server Unit",        unitQty: 1,  unit: "ea"  },
      { id: "pt2", partNumber: "TP-NSW-010", description: "24-Port Network Switch",  unitQty: 1,  unit: "ea"  },
      { id: "pt3", partNumber: "TP-CAB-100", description: "Cat6 Patch Cable 1m",     unitQty: 10, unit: "box" },
    ],
    orders: [
      { id: "o1", description: "Server Hardware",   orderedDate: "2026-02-15", leadTimeDays: 21, arrived: false, arrivedDate: null,         partIds: ["pt1"] },
      { id: "o2", description: "Network Switches",  orderedDate: "2026-02-20", leadTimeDays: 14, arrived: true,  arrivedDate: "2026-03-05", partIds: ["pt2","pt3"] },
    ],
  },
  {
    id: "s2", name: "Creative Assets Ltd.", contact: "supply@creativeassets.com", phone: "+1-555-0200",
    parts: [
      { id: "pt4", partNumber: "CA-PHO-LIC", description: "Stock Photography License (Annual)", unitQty: 1,  unit: "licence" },
      { id: "pt5", partNumber: "CA-VID-PKG", description: "Video Asset Pack - 50 clips",        unitQty: 50, unit: "clips"   },
    ],
    orders: [
      { id: "o3", description: "Stock Photography License", orderedDate: "2026-02-28", leadTimeDays: 3, arrived: false, arrivedDate: null, partIds: ["pt4"] },
    ],
  },
];

export const DEMO_BOM = [
  { id: "b1", supplierId: "s1", partId: "pt1", qtyOrdered: 2, status: "used",         notes: "", project: "" },
  { id: "b2", supplierId: "s1", partId: "pt2", qtyOrdered: 3, status: "used",         notes: "Consider TP-NSW-020 for higher port density next revision", project: "" },
  { id: "b3", supplierId: "s1", partId: "pt3", qtyOrdered: 5, status: "used",         notes: "", project: "" },
  { id: "b4", supplierId: "s2", partId: "pt4", qtyOrdered: 1, status: "pending",      notes: "", project: "" },
  { id: "b5", supplierId: "s2", partId: "pt5", qtyOrdered: 0, status: "not-used",     notes: "Not required for this phase — revisit for v2 marketing", project: "" },
];
