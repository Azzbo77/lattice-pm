// ── Lattice PM — Full Setup Script ────────────────────────────────────────────
// Run with: node scripts/seed.mjs --url http://localhost:8090 --email <email> --password <password>

import PocketBase from "pocketbase";

const args     = process.argv.slice(2);
const get      = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const PB_URL   = get("--url")      ?? "http://127.0.0.1:8090";
const EMAIL    = get("--email")    ?? "";
const PASSWORD = get("--password") ?? "";

if (!EMAIL || !PASSWORD) {
  console.error("Usage: node scripts/seed.mjs --url <url> --email <email> --password <password>");
  process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function collectionExists(name) {
  try { await pb.collections.getOne(name); return true; } catch { return false; }
}

async function upsertCollection(data) {
  if (await collectionExists(data.name)) {
    console.log(`  ↩ ${data.name} — already exists, skipping`);
    return;
  }
  await pb.collections.create(data);
  console.log(`  ✓ ${data.name}`);
}

async function setupUsersCollection() {
  console.log("\n→ Configuring _pb_users_auth_ collection...");
  const col = await pb.collections.getOne("_pb_users_auth_");
  const existingFields = (col.schema ?? col.fields ?? []).map(f => f.name);
  const newFields = [];

  if (!existingFields.includes("role")) {
    newFields.push({ name: "role", type: "select", required: true, options: { maxSelect: 1, values: ["admin", "manager", "office", "shopfloor"] } });
  }
  if (!existingFields.includes("mustChangePassword")) {
    newFields.push({ name: "mustChangePassword", type: "bool", required: false, options: {} });
  }

  if (newFields.length === 0) { console.log("  ↩ Fields already present, skipping"); return; }

  const currentFields = col.schema ?? col.fields ?? [];
  await pb.collections.update("_pb_users_auth_", { schema: [...currentFields, ...newFields] });
  console.log(`  ✓ Added: ${newFields.map(f => f.name).join(", ")}`);
}

async function createCollections() {
  console.log("\n→ Creating collections...");

  await upsertCollection({
    id: "lattice_projects", name: "projects", type: "base",
    schema: [
      { name: "name",        type: "text",   required: true,  options: { min: 1, max: 200 } },
      { name: "color",       type: "text",   required: true,  options: { min: 4, max: 9 } },
      { name: "description", type: "text",   required: false, options: { max: 2000 } },
      { name: "updatedBy",   type: "text",   required: false, options: {} },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager' || @request.auth.role = 'office'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager' || @request.auth.role = 'office'",
    deleteRule: "@request.auth.role = 'admin'",
  });

  await upsertCollection({
    id: "lattice_tasks", name: "tasks", type: "base",
    schema: [
      { name: "title",       type: "text",     required: true,  options: { min: 1, max: 500 } },
      { name: "projectId",   type: "relation", required: true,  options: { collectionId: "lattice_projects",  cascadeDelete: true,  maxSelect: 1 } },
      { name: "assigneeId",  type: "relation", required: false, options: { collectionId: "_pb_users_auth_",   cascadeDelete: false, maxSelect: 1 } },
      { name: "status",      type: "select",   required: true,  options: { maxSelect: 1, values: ["todo", "in-progress", "done", "blocked"] } },
      { name: "priority",    type: "select",   required: true,  options: { maxSelect: 1, values: ["low", "medium", "high"] } },
      { name: "startDate",   type: "text",     required: false, options: {} },
      { name: "endDate",     type: "text",     required: false, options: {} },
      { name: "description", type: "text",     required: false, options: { max: 2000 } },
      { name: "dependsOn",   type: "relation", required: false, options: { collectionId: "lattice_tasks",     cascadeDelete: false, maxSelect: 999 } },
      { name: "updatedBy",   type: "text",     required: false, options: {} },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager' || @request.auth.role = 'office'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager' || @request.auth.role = 'office' || @request.auth.id = assigneeId",
    deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager' || @request.auth.role = 'office'",
  });

  await upsertCollection({
    id: "lattice_suppliers", name: "suppliers", type: "base",
    schema: [
      { name: "name",      type: "text",  required: true,  options: { min: 1, max: 200 } },
      { name: "contact",   type: "text",  required: false, options: { max: 200 } },
      { name: "phone",     type: "text",  required: false, options: { max: 50 } },
      { name: "email",     type: "email", required: false, options: {} },
      { name: "archived",  type: "bool",  required: false, options: {} },
      { name: "updatedBy", type: "text",  required: false, options: {} },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
    deleteRule: "@request.auth.role = 'admin'",
  });

  await upsertCollection({
    id: "lattice_parts", name: "parts", type: "base",
    schema: [
      { name: "supplierId",  type: "relation", required: true,  options: { collectionId: "lattice_suppliers", cascadeDelete: true,  maxSelect: 1 } },
      { name: "partNumber",  type: "text",     required: true,  options: { min: 1, max: 100 } },
      { name: "description", type: "text",     required: false, options: { max: 1000 } },
      { name: "unit",        type: "text",     required: false, options: { max: 50 } },
      { name: "unitQty",     type: "number",   required: false, options: { min: 0 } },
      { name: "updatedBy",   type: "text",     required: false, options: {} },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
    deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
  });

  await upsertCollection({
    id: "lattice_orders", name: "orders", type: "base",
    schema: [
      { name: "supplierId",   type: "relation", required: true,  options: { collectionId: "lattice_suppliers", cascadeDelete: true,  maxSelect: 1 } },
      { name: "description",  type: "text",     required: false, options: { max: 1000 } },
      { name: "partIds",      type: "relation", required: false, options: { collectionId: "lattice_parts",     cascadeDelete: false, maxSelect: 999 } },
      { name: "orderedDate",  type: "text",     required: false, options: {} },
      { name: "leadTimeDays", type: "number",   required: false, options: { min: 0 } },
      { name: "arrived",      type: "bool",     required: false, options: {} },
      { name: "arrivedDate",  type: "text",     required: false, options: {} },
      { name: "updatedBy",    type: "text",     required: false, options: {} },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
    deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
  });

  await upsertCollection({
    id: "lattice_bom", name: "bom", type: "base",
    schema: [
      { name: "supplierId", type: "relation", required: true,  options: { collectionId: "lattice_suppliers", cascadeDelete: true,  maxSelect: 1 } },
      { name: "partId",     type: "relation", required: true,  options: { collectionId: "lattice_parts",     cascadeDelete: true,  maxSelect: 1 } },
      { name: "projectId",  type: "relation", required: false, options: { collectionId: "lattice_projects",  cascadeDelete: false, maxSelect: 1 } },
      { name: "taskId",     type: "relation", required: false, options: { collectionId: "lattice_tasks",     cascadeDelete: false, maxSelect: 1 } },
      { name: "qtyOrdered", type: "number",   required: false, options: { min: 0 } },
      { name: "status",     type: "select",   required: true,  options: { maxSelect: 1, values: ["pending", "used", "not-used", "under-review"] } },
      { name: "notes",      type: "text",     required: false, options: { max: 2000 } },
      { name: "updatedBy",  type: "text",     required: false, options: {} },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
    updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
    deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'manager'",
  });
}

async function createAdminUser() {
  console.log("\n→ Creating admin@lattice.dev user...");
  try {
    await pb.collection("_pb_users_auth_").create({
      name:               "Admin",
      email:              "admin@lattice.dev",
      role:               "admin",
      password:           "changeme123",
      passwordConfirm:    "changeme123",
      mustChangePassword: false,
      emailVisibility:    true,
    });
    console.log("  ✓ Created");
  } catch (e) {
    if (e?.status === 400) { console.log("  ↩ Already exists, skipping"); }
    else throw e;
  }
}

async function seed() {
  console.log(`\n◈ Lattice PM — Full Setup`);
  console.log(`  Target: ${PB_URL}\n`);
  console.log("→ Authenticating as PocketBase superadmin...");
  await pb.collection("_superusers_").authWithPassword(EMAIL, PASSWORD);
  console.log("  ✓ Authenticated");
  await setupUsersCollection();
  await createCollections();
  await createAdminUser();
  console.log("\n✓ Setup complete!\n");
  console.log("  Log in to Lattice with:");
  console.log("  Email:    admin@lattice.dev");
  console.log("  Password: changeme123\n");
  console.log("  Add your team from the Team tab once logged in.\n");
}

seed().catch(err => {
  console.error("\n✗ Setup failed:", err?.message ?? err);
  if (err?.data) console.error("  Details:", JSON.stringify(err.data, null, 2));
  process.exit(1);
});
