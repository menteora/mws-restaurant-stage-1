importScripts('js/idb.js');

var currentCacheName = 'mws-restaurant-dynamic-v54';
var restaurantGetUrl = 'http://localhost:1337/restaurants';
var favoriteBasePutUrl = 'http://localhost:1337/restaurants';
var favoritePutUrl = '/?is_favorite=';



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
  if (event.request.url.indexOf(restaurantGetUrl) !== -1 && event.request.method == 'GET') {
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
            restaurantsOnline.forEach(function (restaurantOnline) {
              // check if restaurants need sync and bypass it
              store.get(parseInt(restaurantOnline.id)).then((restaurantOffline) => {
                if (!restaurantOffline.needs_sync) {
                  store.put(restaurantOnline);
                }
              }).catch((error) => {
                store.put(restaurantOnline);
              });
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
  // check if page is a favorite data
  if (event.request.url.indexOf(favoriteBasePutUrl) !== -1 && event.request.url.indexOf(favoritePutUrl) !== -1 && event.request.method == 'PUT') {
    console.log(event.request.url);
    event.respondWith(
      // open db
      idb.open('restaurants', 1, upgradeDb => {
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      }).then(function (db) {
        // get all restaurants inside local db
        return fetch(event.request).then(function (response) {
          return response.json();
        }).then(function (restaurantOnline) {
          // fetch online
          console.log("put favorite online");
          var tx = db.transaction('restaurants', 'readwrite')
          var store = tx.objectStore('restaurants');
          store.put(restaurantOnline);
          return new Response(JSON.stringify(restaurantOnline), { "status": 200, headers: { 'Content-Type': 'application/json' } });
        }).catch(function (error) {
          // fetch offline
          console.log("put favorite offline");
          var tx = db.transaction('restaurants', 'readwrite')
          var store = tx.objectStore('restaurants');
          console.log(JSON.stringify(error));
          //restaurantOffline.needs_sync = true;
          //store.put(restaurantOffline);
          return new Response(JSON.stringify(restaurantOffline), { "status": 200, headers: { 'Content-Type': 'application/json' } })
        });
      })
    );
    // prevent two fetches
    return;
  }
  // return cached files
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