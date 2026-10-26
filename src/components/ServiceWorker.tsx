"use client";

import { useEffect } from "react";

// Registers public/sw.js once the page has loaded (production only, so the
// dev server's hot reload isn't affected by caching).
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
