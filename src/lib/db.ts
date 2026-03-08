// ── Lattice PM — Data layer ───────────────────────────────────────────────────
// All database operations live here. AppContext calls these functions only —
// never PocketBase directly. This is the swap boundary for future migrations.

import { pb } from "./pb";
import type {
  User, Project, Task, Supplier, Part, Order, BomEntry, Role,
} from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map a PocketBase auth record to our User type */
const toUser = (r: any): User => ({
  id:                  r.id,
  name:                r.name       ?? r.username ?? "",
  email:               r.email      ?? "",
  role:                (r.role ?? "shopfloor") as Role,
  password:            "",          // never returned by PocketBase
  mustChangePassword:  r.mustChangePassword ?? false,
  updatedAt:           r.updated    ?? "",
  updatedBy:           r.updatedBy  ?? "",
});

const toProject = (r: any): Project => ({
  id:          r.id,
  name:        r.name,
  color:       r.color,
  description: r.description ?? "",
  updatedAt:   r.updated,
  updatedBy:   r.updatedBy ?? "",
});

const toTask = (r: any): Task => ({
  id:          r.id,
  title:       r.title,
  projectId:   r.projectId,
  assigneeId:  r.assigneeId,
  status:      r.status,
  priority:    r.priority,
  startDate:   r.startDate ?? "",
  endDate:     r.endDate ?? "",
  description: r.description ?? "",
  dependsOn:   Array.isArray(r.dependsOn) ? r.dependsOn : [],
  updatedAt:   r.updated,
  updatedBy:   r.updatedBy ?? "",
});

const toSupplier = (r: any): Supplier => ({
  id:       r.id,
  name:     r.name,
  contact:  r.contact ?? "",
  phone:    r.phone ?? "",
  archived: r.archived ?? false,
  updatedAt: r.updated,
  updatedBy: r.updatedBy ?? "",
  parts:    [],   // loaded separately
  orders:   [],  // loaded separately
});

const toPart = (r: any): Part => ({
  id:          r.id,
  partNumber:  r.partNumber,
  description: r.description ?? "",
  unit:        r.unit ?? "",
  unitQty:     r.unitQty ?? 1,
  updatedAt:   r.updated,
  updatedBy:   r.updatedBy ?? "",
});

const toOrder = (r: any): Order => ({
  id:           r.id,
  description:  r.description ?? "",
  orderedDate:  r.orderedDate ?? "",
  leadTimeDays: r.leadTimeDays ?? 0,
  partIds:      Array.isArray(r.partIds) ? r.partIds : [],
  arrived:      r.arrived ?? false,
  arrivedDate:  r.arrivedDate ?? null,
  updatedAt:    r.updated,
  updatedBy:    r.updatedBy ?? "",
});

const toBomEntry = (r: any): BomEntry => ({
  id:         r.id,
  supplierId: r.supplierId,
  partId:     r.partId,
  projectId:  r.projectId ?? "",
  taskId:     r.taskId ?? "",
  qtyOrdered: r.qtyOrdered ?? 0,
  status:     r.status,
  notes:      r.notes ?? "",
  project:    "",   // legacy field — not used with PocketBase
  updatedAt:  r.updated,
  updatedBy:  r.updatedBy ?? "",
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const dbLogin = async (
  email: string,
  password: string
): Promise<User> => {
  const result = await pb
    .collection("_pb_users_auth_")
    .authWithPassword(email, password);
  return toUser(result.record);
};

export const dbLogout = (): void => {
  pb.authStore.clear();
};

export const dbCurrentUser = (): User | null => {
  if (!pb.authStore.isValid || !pb.authStore.model) return null;
  try {
    return toUser(pb.authStore.model);
  } catch {
    return null;
  }
};

export const dbUpdatePassword = async (
  userId: string,
  newPassword: string
): Promise<void> => {
  await pb.collection("_pb_users_auth_").update(userId, {
    password:           newPassword,
    passwordConfirm:    newPassword,
    mustChangePassword: false,
  });
  // Re-auth so the session stays valid after password change
  const model = pb.authStore.model;
  if (model?.email) {
    await pb.collection("_pb_users_auth_").authWithPassword(model.email, newPassword);
  }
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const dbGetUsers = async (): Promise<User[]> => {
  const records = await pb.collection("_pb_users_auth_").getFullList({ sort: "name" });
  return records.map(toUser);
};

export const dbSaveUser = async (
  user: Partial<User> & { password?: string }
): Promise<User> => {
  const payload: any = {
    name:               user.name,
    email:              user.email,
    role:               user.role,
    mustChangePassword: user.mustChangePassword ?? false,
    updatedBy:          user.updatedBy ?? "",
  };
  if (user.password) {
    payload.password        = user.password;
    payload.passwordConfirm = user.password;
  }
  const record = user.id
    ? await pb.collection("_pb_users_auth_").update(user.id, payload)
    : await pb.collection("_pb_users_auth_").create(payload);
  return toUser(record);
};

export const dbDeleteUser = async (id: string): Promise<void> => {
  await pb.collection("_pb_users_auth_").delete(id);
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const dbGetProjects = async (): Promise<Project[]> => {
  const records = await pb.collection("projects").getFullList({ sort: "name" });
  return records.map(toProject);
};

export const dbSaveProject = async (proj: Partial<Project>): Promise<Project> => {
  const payload = {
    name:        proj.name,
    color:       proj.color,
    description: proj.description ?? "",
    updatedBy:   proj.updatedBy ?? "",
  };
  const record = proj.id
    ? await pb.collection("projects").update(proj.id, payload)
    : await pb.collection("projects").create(payload);
  return toProject(record);
};

export const dbDeleteProject = async (id: string): Promise<void> => {
  await pb.collection("projects").delete(id);
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const dbGetTasks = async (): Promise<Task[]> => {
  const records = await pb
    .collection("tasks")
    .getFullList({ sort: "-updated" });
  return records.map(toTask);
};

export const dbSaveTask = async (task: Partial<Task>): Promise<Task> => {
  const payload = {
    title:       task.title,
    projectId:   task.projectId,
    assigneeId:  task.assigneeId || null,
    status:      task.status,
    priority:    task.priority,
    startDate:   task.startDate ?? "",
    endDate:     task.endDate ?? "",
    description: task.description ?? "",
    dependsOn:   task.dependsOn ?? [],
    updatedBy:   task.updatedBy ?? "",
  };
  const record = task.id
    ? await pb.collection("tasks").update(task.id, payload)
    : await pb.collection("tasks").create(payload);
  return toTask(record);
};

export const dbDeleteTask = async (id: string): Promise<void> => {
  await pb.collection("tasks").delete(id);
};

// ── Suppliers ─────────────────────────────────────────────────────────────────

export const dbGetSuppliers = async (): Promise<Supplier[]> => {
  const [suppliers, parts, orders] = await Promise.all([
    pb.collection("suppliers").getFullList({ sort: "name" }),
    pb.collection("parts").getFullList({ sort: "partNumber" }),
    pb.collection("orders").getFullList({ sort: "-orderedDate" }),
  ]);

  return suppliers.map(s => ({
    ...toSupplier(s),
    parts:  parts.filter(p => p.supplierId === s.id).map(toPart),
    orders: orders.filter(o => o.supplierId === s.id).map(toOrder),
  }));
};

export const dbSaveSupplier = async (s: Partial<Supplier>): Promise<Supplier> => {
  const payload = {
    name:      s.name,
    contact:   s.contact ?? "",
    phone:     s.phone ?? "",
    archived:  s.archived ?? false,
    updatedBy: s.updatedBy ?? "",
  };
  const record = s.id
    ? await pb.collection("suppliers").update(s.id, payload)
    : await pb.collection("suppliers").create(payload);
  return { ...toSupplier(record), parts: s.parts ?? [], orders: s.orders ?? [] };
};

export const dbDeleteSupplier = async (id: string): Promise<void> => {
  await pb.collection("suppliers").delete(id);
};

// ── Parts ─────────────────────────────────────────────────────────────────────

export const dbSavePart = async (
  part: Partial<Part> & { supplierId: string }
): Promise<Part> => {
  const payload = {
    supplierId:  part.supplierId,
    partNumber:  part.partNumber,
    description: part.description ?? "",
    unit:        part.unit ?? "",
    unitQty:     part.unitQty ?? 1,
    updatedBy:   part.updatedBy ?? "",
  };
  const record = part.id
    ? await pb.collection("parts").update(part.id, payload)
    : await pb.collection("parts").create(payload);
  return toPart(record);
};

export const dbDeletePart = async (id: string): Promise<void> => {
  await pb.collection("parts").delete(id);
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const dbSaveOrder = async (
  order: Partial<Order> & { supplierId: string }
): Promise<Order> => {
  const payload = {
    supplierId:   order.supplierId,
    description:  order.description ?? "",
    partIds:      order.partIds ?? [],
    orderedDate:  order.orderedDate ?? "",
    leadTimeDays: order.leadTimeDays ?? 0,
    arrived:      order.arrived ?? false,
    arrivedDate:  order.arrivedDate ?? null,
    updatedBy:    order.updatedBy ?? "",
  };
  const record = order.id
    ? await pb.collection("orders").update(order.id, payload)
    : await pb.collection("orders").create(payload);
  return toOrder(record);
};

export const dbDeleteOrder = async (id: string): Promise<void> => {
  await pb.collection("orders").delete(id);
};

// ── BOM ───────────────────────────────────────────────────────────────────────

export const dbGetBom = async (): Promise<BomEntry[]> => {
  const records = await pb.collection("bom").getFullList({ sort: "-updated" });
  return records.map(toBomEntry);
};

export const dbSaveBomEntry = async (entry: Partial<BomEntry>): Promise<BomEntry> => {
  const payload = {
    supplierId: entry.supplierId,
    partId:     entry.partId,
    projectId:  entry.projectId ?? "",
    taskId:     entry.taskId ?? "",
    qtyOrdered: entry.qtyOrdered ?? 0,
    status:     entry.status,
    notes:      entry.notes ?? "",
    updatedBy:  entry.updatedBy ?? "",
  };
  const record = entry.id
    ? await pb.collection("bom").update(entry.id, payload)
    : await pb.collection("bom").create(payload);
  return toBomEntry(record);
};

export const dbDeleteBomEntry = async (id: string): Promise<void> => {
  await pb.collection("bom").delete(id);
};

// ── Realtime subscriptions ────────────────────────────────────────────────────
// Returns an unsubscribe function — call it in useEffect cleanup.

export const subscribeToCollection = (
  collection: string,
  callback: () => void
): (() => void) => {
  let unsub: (() => void) | null = null;
  let active = true;

  pb.collection(collection)
    .subscribe("*", () => { if (active) callback(); })
    .then(fn => { unsub = fn; })
    .catch(() => {});

  return () => {
    active = false;
    try {
      const result = unsub?.() as any;
      // unsubscribe returns a Promise in some PB versions — swallow rejections
      if (result && typeof result.catch === "function") {
        result.catch(() => {});
      }
    } catch {
      // ignore
    }
  };
};
