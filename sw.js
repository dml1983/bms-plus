// public/sw.js
const CACHE_VERSION = 'v7';                 // bump when you want to invalidate everything
const APP_CACHE    = `bms-app-${CACHE_VERSION}`;
const ASSET_CACHE  = `bms-assets-${CACHE_VERSION}`;

// Compute the correct base path (e.g. "/bms-plus/")
const BASE = new URL(self.registration.scope).pathname.replace(/\/+$/, '/') || '/';

// Files we want available offline immediately
const PRECACHE = [
  BASE,                          // "/bms-plus/"
  BASE + 'index.html',           // app shell
  BASE + 'badges/6th.png',
  BASE + 'badges/7th.png',
  BASE + 'badges/8th.png',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
];

// Install: pre-cache the shell + key images/icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting(); // activate immediately
});

// Activate: clean up old versions and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((n) => (n === APP_CACHE || n === ASSET_CACHE) ? null : caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// Helper: put response clone into named cache
async function putInCache(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch (_) { /* ignore quota errors */ }
}

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isNavigate = req.mode === 'navigate';

  // 1) HTML navigations: NETWORK-FIRST (so new deploys show immediately)
  if (isNavigate) {
    event.respondWith((async () => {
      try {
        // Always go to the network for index.html and avoid HTTP cache
        const fresh = await fetch(req, { cache: 'no-store' });
        // Update cached index.html for offline fallback
        await putInCache(APP_CACHE, new Request(BASE + 'index.html'), fresh.clone());
        return fresh;
      } catch {
        // Offline fallback to our cached shell
        const cachedShell = await caches.match(BASE + 'index.html');
        if (cachedShell) return cachedShell;
        // Last resort: whatever the cache has for this request
        const any = await caches.match(req);
        if (any) return any;
        // Give up
        return new Response('Offline and no cached content available.', {
          status: 503, headers: { 'Content-Type': 'text/plain' }
        });
      }
    })());
    return;
  }

  // 2) Static assets (JS/CSS/images/fonts): STALE-WHILE-REVALIDATE
  //    - Serve cached if present (fast)
  //    - Kick off a background fetch to refresh the cache
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const fetchAndUpdate = fetch(req).then((resp) => {
      putInCache(ASSET_CACHE, req, resp);
      return resp.clone();
    }).catch(() => undefined);

    // If we have a cached response, return it immediately and update in background
    if (cached) {
      // Do update in the background but don’t block the response
      event.waitUntil(fetchAndUpdate);
      return cached;
    }

    // Otherwise, go to network and cache it for next time
    const networkResp = await fetchAndUpdate;
    if (networkResp) return networkResp;

    // Last resort: try any cache match (e.g., previously precached shell)
    const fallback = await caches.match(req);
    if (fallback) return fallback;

    return new Response('Resource unavailable offline.', {
      status: 503, headers: { 'Content-Type': 'text/plain' }
    });
  })());
});

// Optional: allow the page to request skipWaiting() for instant activation
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
