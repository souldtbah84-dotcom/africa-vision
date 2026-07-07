// Service Worker - Africa Vision Multiservices v3
// Network-first strategy - always get fresh content
var CACHE_NAME = 'africa-vision-v3';
var ASSETS = [
  '/africa-vision/',
  '/africa-vision/index.html',
  '/africa-vision/manifest.json',
  '/africa-vision/icon-192.png',
  '/africa-vision/icon-512.png'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(){});
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // Always try network first
  e.respondWith(
    fetch(e.request).then(function(response) {
      // Cache successful responses
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Offline: serve from cache
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('/africa-vision/');
      });
    })
  );
});
