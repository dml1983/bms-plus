// Service worker with full pre-cache for offline use
const CACHE_VERSION = 'v11';   // bump this each deploy
const CACHE_NAME = `bms-cache-${CACHE_VERSION}`;

// ✅ List assets to pre-cache (adjust paths if needed)
const ASSETS = [
  '/',                // root
  '/index.html',
  '/404.html',

  // Vite will fingerprint these, but caching index.html ensures they’re referenced
  '/assets/index.css',
  '/assets/index.js',

  // Badges
  '/assets/6th.png',
  '/assets/7th.png',
  '/assets/8th.png',
];

// Install: pre-cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first, fall back to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
