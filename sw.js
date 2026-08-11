// Service Worker — Africa Vision Multiservices v4
//
// Correctif du 11/08/2026 : la version v3 reservait la page en cache dès que
// le réseau faiblissait. Sur une connexion instable, la plateforme pouvait
// tourner pendant des jours sur une version périmée sans que rien ne l'indique.
//
// v4 ne met plus JAMAIS la page HTML en cache pour l'usage courant.
// Le cache ne sert qu'en cas de coupure franche, et la page prévient alors.

var CACHE_NAME = 'africa-vision-v4';

var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () {});
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (noms) {
        return Promise.all(
          noms.filter(function (n) { return n !== CACHE_NAME; })
              .map(function (n) { return caches.delete(n); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Permet à la page de forcer la mise à jour depuis un bouton
self.addEventListener('message', function (e) {
  if (e.data === 'MAJ_MAINTENANT') {
    caches.keys().then(function (noms) {
      return Promise.all(noms.map(function (n) { return caches.delete(n); }));
    }).then(function () { self.skipWaiting(); });
  }
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;   // Firebase, polices : on ne touche pas

  var estPage = req.mode === 'navigate'
             || (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (estPage) {
    // La page : toujours le réseau, en court-circuitant le cache HTTP.
    // Le cache n'intervient qu'en cas d'échec réseau complet.
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(function (rep) {
          if (rep && rep.ok) {
            var clone = rep.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(req, clone); });
          }
          return rep;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Le reste (icônes, manifest) : réseau d'abord, cache en secours
  e.respondWith(
    fetch(req)
      .then(function (rep) {
        if (rep && rep.ok) {
          var clone = rep.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, clone); });
        }
        return rep;
      })
      .catch(function () { return caches.match(req); })
  );
});
