import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

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
