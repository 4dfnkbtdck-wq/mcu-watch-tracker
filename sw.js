// Bump this whenever the app shell (any cached file below, or its
// content) changes — same discipline as the ?v= query strings the HTML
// pages use. A new name here makes install() re-fetch everything fresh
// and activate() drops the old cache instead of leaving it to grow.
const CACHE_VERSION = "v3";
const CACHE_NAME = `mcu-watch-tracker-${CACHE_VERSION}`;

const APP_SHELL = [
  "index.html",
  "titles.html",
  "order.html",
  "manifest.webmanifest",
  "css/styles.css?v=3",
  "js/data.js?v=3",
  "js/watchorder.js?v=3",
  "js/shared.js?v=3",
  "js/app.js?v=3",
  "js/order.js?v=3",
  "js/master.js?v=3",
  "js/main.js?v=3",
  "img/icon-180.png?v=3",
  "img/icon-192.png?v=3",
  "img/icon-512.png?v=3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Cache-first, falling back to network — and caching whatever the
// network returns so an asset this list missed is available offline on
// the next visit too. Only same-origin GET requests are worth handling
// here; everything else just passes through to the network untouched.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
