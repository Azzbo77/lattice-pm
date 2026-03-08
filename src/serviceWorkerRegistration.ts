// ── Service Worker Registration ───────────────────────────────────────────────
// Registers sw.js from the public folder.
// Fires onUpdate callback when a new version is available so the app can
// prompt the user to refresh (used by App.tsx to show an update banner).

type Config = {
  onSuccess?: () => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export const register = (config?: Config): void => {
  if (import.meta.env.MODE !== "production") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const swUrl = `/sw.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.onstatechange = () => {
            if (installing.state !== "installed") return;

            if (navigator.serviceWorker.controller) {
              // New content available — notify the app
              console.log("[SW] New version available.");
              config?.onUpdate?.(registration);
            } else {
              // First-time install
              console.log("[SW] App ready for offline use.");
              config?.onSuccess?.();
            }
          };
        };
      })
      .catch((err) => {
        console.error("[SW] Registration failed:", err);
      });
  });
};

export const unregister = (): void => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((err) => console.error(err));
  }
};
