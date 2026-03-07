import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// Polyfill crypto.randomUUID for browsers/contexts that don't support it
// (required by PocketBase SDK internally)
if (typeof crypto !== "undefined" && !crypto.randomUUID) {
  (crypto as any).randomUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  };
}

// Suppress harmless PocketBase realtime cleanup errors (403/404 on unsubscribe).
// These occur when the SSE connection drops before cleanup runs — not a real error.
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e?.reason?.message ?? "") + (e?.reason?.data?.message ?? "");
  if (msg.includes("ClientResponseError") || msg.includes("authorization") || msg.includes("client id")) {
    e.preventDefault();
  }
});

const rootEl = document.getElementById("root") as HTMLElement;
const root   = ReactDOM.createRoot(rootEl);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register();
