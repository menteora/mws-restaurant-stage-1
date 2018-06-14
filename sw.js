importScripts('js/idb.js');
importScripts('js/dbhelper.js');

var currentCacheName = 'mws-restaurant-dynamic-v40';
var apiUrl = 'http://localhost:1337/restaurants';

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('mws-restaurant-') &&
            cacheName != currentCacheName;
        }).map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
self.addEventListener('fetch', function (event) {
  // check if page is a restaurants data
  if (event.request.url.indexOf(apiUrl) !== -1) {
    event.respondWith(
      // open db
      idb.open('restaurants', 1, upgradeDb => {
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      }).then(function (db) {
        var tx = db.transaction('restaurants')
        var store = tx.objectStore('restaurants');
        // get all restaurants inside local db
        return store.getAll().then(function (restaurantsOffline) {
          return fetch(event.request).then(function (response) {
            return response.json();
          }).then(function (restaurantsOnline) {
            // fetch online
            console.log("fetch restaurants online");
            var tx = db.transaction('restaurants', 'readwrite')
            var store = tx.objectStore('restaurants');
            // update restaurants
            restaurantsOnline.forEach(function (restaurant) {
              store.put(restaurant);
            });
            return new Response(JSON.stringify(restaurantsOnline), { "status": 200, headers: { 'Content-Type': 'application/json' } });
          }).catch(function (error) {
            // fetch offline
            console.log("fetch restaurants offline");
            return new Response(JSON.stringify(restaurantsOffline), { "status": 200, headers: { 'Content-Type': 'application/json' } })
          });
        })
      })
    );
    // prevent two fetches
    return;
  }
  //console.log("THIRD URL:" + event.request.url);
  event.respondWith(
    caches.open(currentCacheName).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function (response) {
          cache.put(event.request, response.clone());
          return response;
        })
      })
    })
  )
});

self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
    console.log('SW skip waiting')
  }
});