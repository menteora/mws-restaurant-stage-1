importScripts('js/idb.js');
importScripts('js/dbhelper.js');

var currentCacheName = 'mws-restaurant-dynamic-v15';
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

  event.respondWith(async function() {
    debugger;
    if (event.request.url.indexOf(apiUrl) !== -1) {

    idb.open('restaurants', 1, upgradeDb => {
      upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    }).then(function (db) {
      var tx = db.transaction('restaurants')
      var store = tx.objectStore('restaurants');
      return store.getAll().then(function (restaurants) {
        return new Response(JSON.stringify(restaurants), { "status": 200, "statusText": "MyCustomResponse!" }) || fetch(event.request).then(function (restaurants) {
          var tx = db.transaction('restaurants', 'readwrite')
          var store = tx.objectStore('restaurants');
          restaurants.clone().forEach(function (restaurant) {
            store.put(restaurant);
          });
          //cache.put(event.request, response.clone());
          return new Response(JSON.stringify(restaurants), { "status": 200, "statusText": "MyCustomResponse!" });
        });
      });
    });



  } else {


    caches.open(currentCacheName).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function (response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    });
  }


  });

});
self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
    console.log('SW skip waiting')
  }
});