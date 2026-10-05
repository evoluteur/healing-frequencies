const CACHE = "hf-v7";
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
  "img/solfeggio-forks.webp",
];

// Themes are linked from omg-themes (same origin on GitHub Pages). Cached
// best-effort at install so the first offline visit is themed too.
const THEMES = "https://evoluteur.github.io/omg-themes/";
const THEME_ASSETS = [
  "css/core.css",
  "js/omg.js",
  "css/themes/dark/dark.css",
  "css/themes/dark/bg0.png",
  "css/themes/light/light.css",
  "css/themes/light/bg0.png",
  "css/themes/evol-blue/evol-blue.css",
  "css/themes/evol-blue/spirals.png",
].map((u) => THEMES + u);

self.addEventListener("install", (e) => {
  // "reload" bypasses the HTTP cache, so an update never caches stale files
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        c
          .addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))
          .then(() =>
            Promise.allSettled(
              THEME_ASSETS.map((u) => c.add(new Request(u, { cache: "reload" }))),
            ),
          ),
      ),
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
  if (url.href.startsWith(THEMES)) {
    // shared themes: serve the cached copy but refresh it in the background
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(e.request).then((cached) => {
          const net = fetch(e.request)
            .then((res) => {
              if (res.ok) c.put(e.request, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || net;
        }),
      ),
    );
    return;
  }
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
