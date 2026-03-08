// ── Lattice PM Service Worker ─────────────────────────────────────────────────
// Strategy:
//   - App shell (HTML, JS, CSS, fonts) → Cache First (fast loads, offline capable)
//   - API calls (/pb/, supabase, etc.)  → Network Only (never serve stale data)
//   - Images/icons                      → Stale While Revalidate

const CACHE_NAME = "lattice-pm-v1";

// Resources to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/index.html",
];

// Never cache these — always go to network
  // Also, be careful not to intercept streaming requests (realtime, SSE)
const NETWORK_ONLY_PATTERNS = [
  /\/pb\//,           // PocketBase API (future)
  /supabase\.co/,     // Supabase API (future)
  /\/api\//,          // Generic API prefix
];

// Requests that should NOT go through the service worker at all
// (they need direct network access; SW can't handle streaming/WebSocket upgrades)
const BYPASS_PATTERNS = [
  /\/pb\/api\/realtime/,  // PocketBase realtime (SSE/WebSocket)
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (fonts from Google, etc. handled separately)
  if (url.origin !== self.location.origin) return;

  // Bypass service worker for realtime/streaming endpoints
  // These need direct network access; service workers can't proxy streaming responses
  if (BYPASS_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return; // Let browser handle natively; SW doesn't intercept
  }

  // Network only for API routes
  if (NETWORK_ONLY_PATTERNS.some((pattern) => pattern.test(request.url))) {
    event.respondWith(
      fetch(request).catch((error) => {
        console.warn("Service worker: fetch failed for", request.url, error);
        // Return an offline indicator for failed API calls
        return new Response(
          JSON.stringify({ error: "Offline" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // For navigation requests (HTML) — network first, fallback to cache
  // This ensures fresh deploys are picked up promptly
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // For everything else (JS, CSS, images) — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
