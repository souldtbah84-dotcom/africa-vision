// Service Worker - Africa Vision Multiservices
// v2: network-first, never cache HTML (avoids stale data issues)
var CACHE_NAME = 'africa-vision-v2';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) { return caches.delete(name); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Always fetch from network, never serve cached HTML/JS
self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request).catch(function() {
    return new Response('Hors ligne', {status: 503});
  }));
});
