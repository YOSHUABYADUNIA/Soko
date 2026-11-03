/* SOKO.bi Service Worker - offline + installable PWA */
var CACHE = "sokobi-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS).catch(function () { return null; });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Strategy: cache-first, fallback to network; cache successful GETs for offline */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(function (cached) {
      var fetchPromise = fetch(req).then(function (res) {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      }).catch(function () {
        /* Offline: for navigation requests, serve app shell */
        if (req.mode === "navigate") return caches.match("./index.html");
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
