const STATIC_CACHE = 'etos-portal-static-v2';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/icons/icon-96x96.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
];

// 1. Install Event - Precache resiliently so one asset hiccup never breaks SW installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((assetUrl) =>
            fetch(assetUrl, { cache: 'reload' }).then((res) => {
              if (res && res.ok) {
                return cache.put(assetUrl, res);
              }
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event - Clean old cache versions & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== STATIC_CACHE) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Message Event - Handle explicit cache clear on logout or skipWaiting
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CLEAR_AUTH_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name !== STATIC_CACHE) {
          caches.delete(name);
        }
      });
    });
  }
});

// 4. Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin HTTP(S) GET requests
  if (
    request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Never intercept API calls or Next.js RSC flight requests
  if (
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC') === '1'
  ) {
    return;
  }

  // Static immutable/public assets: Cache-First with background Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/screenshots/') ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/favicon.png' ||
    url.pathname === '/favicon-32x32.png' ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.svg');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // Full HTML Document Navigation: Network-first, fallback to dedicated /offline UI
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlineFallback = await caches.match(OFFLINE_URL);
        if (offlineFallback) return offlineFallback;
        return new Response('Koneksi terputus. Silakan periksa internet Anda.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
  }
});
