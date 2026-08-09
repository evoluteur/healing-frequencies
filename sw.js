const CACHE = "hf-v2";
const ASSETS = [
  "./",
  "index.html",
  "healing-frequencies-scale.html",
  "hf.css",
  "favicon.png",
  "spirals.png",
  "icon-192.png",
  "icon-512.png",
  "manifest.json",
];

self.addEventListener("install", (e) => {
  // "reload" bypasses the HTTP cache, so an update never caches stale files
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const cacheable =
    url.origin === location.origin ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";
  if (e.request.method !== "GET" || !cacheable) return;
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          })
          .catch(() =>
            e.request.mode === "navigate" ? caches.match("index.html") : undefined,
          ),
    ),
  );
});
