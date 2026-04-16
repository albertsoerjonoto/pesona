const CACHE_NAME = 'pesona-v2';
const STATIC_ASSETS = [
  '/dashboard',
  '/log',
  '/chat',
  '/friends',
  '/profile',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const OFFLINE_PAGE = '/offline';

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate for static, network-first for pages
self.addEventListener('fetch', (event) => {
  // Skip non-GET and API requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  const url = new URL(event.request.url);

  // Static assets: stale-while-revalidate
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetched = fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Pages: network-first with cache fallback + offline page
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE) || new Response(
              '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pesona — Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;background:#FFF7F3;color:#1a1a2e;text-align:center;padding:1rem}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#666;margin-bottom:1.5rem}button{background:#CE3D66;color:white;border:none;padding:0.75rem 2rem;border-radius:12px;font-size:1rem;cursor:pointer}</style></head><body><div><h1>Kamu lagi offline</h1><p>Cek koneksi internet kamu, terus coba lagi ya.</p><button onclick="location.reload()">Coba lagi</button></div></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
          return new Response('', { status: 408 });
        })
      )
  );
});
