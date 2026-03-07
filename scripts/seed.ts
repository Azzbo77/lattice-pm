// ── Lattice PM — Seed script ──────────────────────────────────────────────────
// Creates the initial admin account. Run once against a fresh PocketBase instance.
//
// Usage:
//   npx ts-node --project scripts/tsconfig.json scripts/seed.ts \
//     --url http://127.0.0.1:8090 \
//     --email <pb-admin-email> \
//     --password <pb-admin-password>

import PocketBase from "pocketbase";

const args     = process.argv.slice(2);
const get      = (flag: string) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const PB_URL   = get("--url")      ?? "http://127.0.0.1:8090";
const EMAIL    = get("--email")    ?? "";
const PASSWORD = get("--password") ?? "";

if (!EMAIL || !PASSWORD) {
  console.error("Usage: npx ts-node --project scripts/tsconfig.json scripts/seed.ts --url <url> --email <email> --password <password>");
  process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function seed() {
  console.log(`\n◈ Lattice PM — Initial Setup`);
  console.log(`  Target: ${PB_URL}\n`);

  console.log("→ Authenticating as PocketBase admin...");
  await pb.admins.authWithPassword(EMAIL, PASSWORD);
  console.log("  ✓ Authenticated\n");

  console.log("→ Creating admin account...");
  try {
    await pb.collection("users").create({
      name:               "Admin",
      email:              "admin@lattice.dev",
      role:               "admin",
      password:           "changeme123",
      passwordConfirm:    "changeme123",
      mustChangePassword: false,
      emailVisibility:    true,
    });
    console.log("  ✓ Admin account created");
  } catch (e: any) {
    if (e?.status === 400) {
      console.log("  ⚠ Account already exists — skipping");
    } else {
      throw e;
    }
  }

  console.log("\n✓ Done! Log in at the app with:");
  console.log("  Email:    admin@lattice.dev");
  console.log("  Password: changeme123\n");
  console.log("  Add your team from the Team tab once logged in.\n");
}

seed().catch(err => {
  console.error("\n✗ Seed failed:", err?.message ?? err);
  if (err?.data) console.error("  Details:", JSON.stringify(err.data, null, 2));
  process.exit(1);
});
