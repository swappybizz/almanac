// public/sw.js

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        // Add other static assets like CSS or icons if needed
        '/favicon.ico',
        '/logo.png',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        '/index.html',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
