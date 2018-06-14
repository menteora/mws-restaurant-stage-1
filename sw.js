importScripts('js/idb.js');
importScripts('js/dbhelper.js');

var currentCacheName = 'mws-restaurant-dynamic-v38';
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
  // external api url bypass service worker cache
  //if (event.request.url.indexOf(apiUrl) !== -1) {
  /*
  idb.open('restaurants', 1, upgradeDb => {
    upgradeDb.createObjectStore('restaurants', {
      keyPath: 'id'
    });
  }).then(function (db) {
    var tx = db.transaction('restaurants')
    var store = tx.objectStore('restaurants');
    store.getAll().then(restaurants => {
      return new Response(JSON.stringify(restaurants), { "status": 200, "statusText": "MyCustomResponse!" });
    });
  });
  */
  //}
  //console.log("FIST URL:" + event.request.url);
  if (event.request.url.indexOf(apiUrl) !== -1) {
    console.log("SECOND URL:" + event.request.url);
    event.respondWith(
      idb.open('restaurants', 1, upgradeDb => {
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      }).then(function (db) {
        var tx = db.transaction('restaurants')
        var store = tx.objectStore('restaurants');
        return store.getAll().then(function (restaurants) {
          console.log("FORTH URL:" + JSON.stringify(restaurants));
          console.log("FORTH LENGHT:" + JSON.stringify(restaurants.length));
          return (restaurants.length != 0) ?  new Response(JSON.stringify(restaurants),  { "status": 200, headers: { 'Content-Type': 'application/json' }}) : fetch(event.request).then(function (response) {
            return response.json();
          }).then(function (restaurants) {
            // fetch online
            console.log("fetch restaurants online")
            var tx = db.transaction('restaurants', 'readwrite')
            var store = tx.objectStore('restaurants');
            restaurants.forEach(function (restaurant) {
              store.put(restaurant);
            });
            //cache.put(event.request, response.clone());
            return new Response(JSON.stringify(restaurants), { "status": 200, headers: { 'Content-Type': 'application/json' }});
          })
        })
      })
    );
    // Prevent two fetches
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