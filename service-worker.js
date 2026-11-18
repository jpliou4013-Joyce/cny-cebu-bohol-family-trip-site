const CACHE_NAME = 'family-trip-app-v1';
const APP_ROOT = self.registration.scope;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/app-192.png',
  './icons/app-512.png',
  './icons/app-maskable-512.png'
].map(path => new URL(path, APP_ROOT).href);
const HOME_URL = new URL('./', APP_ROOT).href;
const INDEX_URL = new URL('./index.html', APP_ROOT).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names
        .filter(name => name.startsWith('family-trip-app-') && name !== CACHE_NAME)
        .map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(APP_ROOT)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return await caches.match(request) || await caches.match(HOME_URL) || await caches.match(INDEX_URL);
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
