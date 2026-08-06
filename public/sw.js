const CACHE_NAME = 'farmaccountant-v2';

// Install event - skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with Cache Fallback Fetch Strategy
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  // Only cache assets from our own origin
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // If network response is valid, cache it and return
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline mode)
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If neither is available
          return new Response("Offline content not cached.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});
