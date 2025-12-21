/* eslint-disable no-undef */

// Offline + Asset Caching + Auto Update Service Worker

importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js");

const CACHE_VERSION = "v1.4";

/* Cache Names */
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

/* ===============================
   Workbox Setup
================================ */
workbox.setConfig({ debug: false });

// These make the SW take control immediately
workbox.core.clientsClaim();
workbox.core.skipWaiting();

/* ===============================
   Skip Waiting Support
================================ */
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    self.clients.claim();
  }

  if (event.data?.type === "GET_VERSION") {
    event.ports[0]?.postMessage({
      version: CACHE_VERSION,
    });
  }
});

/* ===============================
   Activate - Cache Cleanup Only
   (Workbox handles clients.claim via clientsClaim() above)
================================ */
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => !key.includes(CACHE_VERSION)).map(key => caches.delete(key)));
      console.log("Old caches cleaned up");
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
   Navigation Caching - Network First with Cache Fallback
================================ */
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Try network first with preload
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;

          return await fetch(event.request);
        } catch (err) {
          // If offline, serve cached version of the page
          const cache = await caches.open(workbox.core.cacheNames.precache);
          const cachedResponse = await cache.match("/index.html");
          if (cachedResponse) return cachedResponse;

          // Ultimate fallback
          return new Response("Game is offline. Please check your connection.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/html",
            }),
          });
        }
      })()
    );
  }
});
