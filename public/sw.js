const CACHE_NAME = "logerbien-v4";
const STATIC_ASSETS = ["/", "/annonces", "/offline.html", "/logo.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  // Never cache Next.js build assets in the service worker. Next/Vercel already
  // versions these files, and stale JS chunks can cause hydration mismatches.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for listing pages — cache for offline fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) => cached ?? caches.match("/offline.html")
        )
      )
  );
});
