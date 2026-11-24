const CACHE = 'haidat-calc-v6-core-ops';
const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './scientific-calc.js',
  './manifest.webmanifest',
  './engine/core.js',
  './engine/functions-standard.js',
  './engine/shortcuts.js',
  './engine/sheet-ops.js',
  './engine/cell-format.js',
  './engine/fill-series.js',
  './engine/history.js',
  './engine/workbook-sheets.js'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('haidat-calc-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => {
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      return new Response('', { status: 504, statusText: 'Offline' });
    }))
  );
});