/* eslint-disable no-undef */

// Offline + Asset Caching + Auto Update Service Worker

importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js");

const CACHE_VERSION = "v1";

/* Cache Names */
const OFFLINE_CACHE = `offline-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

const OFFLINE_FALLBACK_PAGE = "/offline.html";

/* ===============================
   Workbox Setup
================================ */
workbox.setConfig({ debug: false });

/* ===============================
   Skip Waiting Support
================================ */
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ===============================
   Install
================================ */
self.addEventListener("install", event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.add(OFFLINE_FALLBACK_PAGE)));
});

/* ===============================
   Activate
================================ */
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => !key.includes(CACHE_VERSION)).map(key => caches.delete(key)));

      // Take control immediately
      await self.clients.claim();
    })()
  );
});

/* ===============================
   Navigation Preload
================================ */
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

/* ===============================
   App Shell Precaching
   (minimal on purpose for Vite)
================================ */
workbox.precaching.precacheAndRoute([
  { url: "/", revision: null },
  { url: "/index.html", revision: null },
  { url: "/manifest.webmanifest", revision: null },
]);

/* ===============================
   Runtime Caching
================================ */

/* JS, CSS, WASM */
workbox.routing.registerRoute(
  ({ request }) => request.destination === "script" || request.destination === "style" || request.destination === "wasm",
  new workbox.strategies.CacheFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

/* Images (sprites, UI, tiles) */
workbox.routing.registerRoute(
  ({ request }) => request.destination === "image",
  new workbox.strategies.CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
      }),
    ],
  })
);

/* Audio */
workbox.routing.registerRoute(
  ({ request }) => request.destination === "audio",
  new workbox.strategies.CacheFirst({
    cacheName: AUDIO_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  })
);

/* ===============================
   Navigation Offline Fallback
================================ */
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;

          return await fetch(event.request);
        } catch (err) {
          const cache = await caches.open(OFFLINE_CACHE);
          return await cache.match(OFFLINE_FALLBACK_PAGE);
        }
      })()
    );
  }
});
