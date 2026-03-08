// ── Core domain types ─────────────────────────────────────────────────────────

export type Role = "admin" | "manager" | "office" | "shopfloor";
export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high";
export type BomStatus = "used" | "not-used" | "under-review" | "pending";

export interface Stamp {
  createdAt?: string;   // ISO 8601
  updatedAt?: string;   // ISO 8601
  updatedBy?: string;   // user display name
}

export interface User extends Stamp {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  mustChangePassword?: boolean;
  avatar?: string;
}

export interface Project extends Stamp {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Task extends Stamp {
  id: string;
  title: string;
  projectId: string;
  assigneeId: string;
  startDate: string;    // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
  status: TaskStatus;
  priority: TaskPriority;
  description?: string;
  dependsOn?: string[];  // task IDs this task depends on
}

export interface Part extends Stamp {
  id: string;
  partNumber: string;
  description: string;
  unitQty: number;
  unit: string;
  _existing?: boolean;  // internal flag — not persisted
}

export interface Order extends Stamp {
  id: string;
  description: string;
  orderedDate: string;
  leadTimeDays: number;
  partIds?: string[];
  arrived?: boolean;
  arrivedDate?: string | null;
}

export interface Supplier extends Stamp {
  id: string;
  name: string;
  contact: string;
  phone: string;
  archived?: boolean;
  parts?: Part[];
  orders?: Order[];
}

export interface BomEntry extends Stamp {
  id: string;
  supplierId: string;
  partId: string;
  qtyOrdered: number;
  status: BomStatus;
  notes: string;
  project:   string;     // legacy free-text label
  projectId?: string;    // linked Project entity
  taskId?:   string;     // linked Task entity
}

// Derived — BomEntry enriched with resolved supplier + part
export interface BomRow extends BomEntry {
  supplier: Supplier;
  part: Part;
}

export interface Notification {
  id: string;
  text: string;
  type: "overdue" | "soon";
  taskId?: string;
}

export interface SearchResult {
  type: string;
  icon: string;
  label: string;
  sub: string;
  color: string;
  action: () => void;
}


export type AnnouncementCategory = "general";

export interface Announcement extends Stamp {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  authorId: string;
  authorName: string;
  expires: string | null;      // ISO date or null = no expiry
  createdAt: string;            // Required — database always provides this
}
