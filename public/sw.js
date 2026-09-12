// ============================================================
//  Base2 TV — Service Worker
//  Enables PWA install prompt on Chrome/Android
// ============================================================

const CACHE_NAME = "base2tv-v3";

// Assets to cache for offline use
const PRECACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/icon-96.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-180.png",
  "/logo.png",
  "/site.webmanifest",
];

// ── Install: cache core assets ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────
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

// ── Fetch: network first, cache fallback ──────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls or stream — always go to network
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname === "stream.base2tv.ug" ||
    url.hostname === "ui-avatars.com" ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (
          response.ok &&
          (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|gif|css|js|woff2?)$/) ||
           url.pathname === "/" ||
           url.pathname === "/index.html")
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve cached version
        return caches.match(event.request).then(
          (cached) => cached || caches.match("/index.html")
        );
      })
  );
});