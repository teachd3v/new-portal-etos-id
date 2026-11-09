const STATIC_CACHE = 'etos-portal-static-v3';
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

// 5. Push Notification Event (VAPID Web Push)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Portal Etos ID',
    body: 'Ada informasi terbaru di Portal Etos ID.',
    url: '/',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    category: 'PENGUMUMAN',
    timestamp: Date.now(),
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    tag: payload.tag || `etos-push-${payload.timestamp || Date.now()}`,
    renotify: true,
    data: {
      url: payload.url || '/',
      category: payload.category || 'PENGUMUMAN',
      timestamp: payload.timestamp || Date.now(),
    },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || 'Portal Etos ID', notificationOptions),
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_NOTIFICATION_RECEIVED',
              payload,
            });
          });
        })
        .catch(() => {}),
    ])
  );
});

// 6. Notification Click Event (Deep Linking)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = (event.notification.data && event.notification.data.url) || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            if ('navigate' in client) {
              return client.navigate(targetUrl).then((c) => (c ? c.focus() : null));
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

