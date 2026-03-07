// ── PocketBase client singleton ───────────────────────────────────────────────
// All PocketBase access goes through this one instance.
// Swap boundary: if migrating to Supabase, replace this file and db.ts only.

import PocketBase from "pocketbase";

const url = process.env.REACT_APP_PB_URL ?? "http://127.0.0.1:8090";

export const pb = new PocketBase(url);

// Keep auth token fresh — PocketBase refreshes it automatically
pb.autoCancellation(false);
