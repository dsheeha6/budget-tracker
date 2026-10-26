// Service worker: makes the app installable and keeps it from showing a
// browser error page when there's no signal.
//
// Kept deliberately small. Pages are never cached (they contain your data and
// must always be fresh); only build assets and icons are, plus an offline page.

const CACHE = "budget-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Drop caches from older versions of this file.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: always go to the network; show the offline page if it fails.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Build assets have content hashes in their names, so they never change:
  // serve from cache, fetch and store on first use.
  if (url.pathname.startsWith("/_next/static/") || /\.(png|ico|woff2)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
