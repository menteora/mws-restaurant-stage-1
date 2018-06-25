importScripts('js/idb.js');

var currentCacheName = 'mws-restaurant-dynamic-v61';
var restaurantGetUrl = 'http://localhost:1337/restaurants';
var favoriteBasePutUrl = 'http://localhost:1337/restaurants';
var favoritePutUrl = '/?is_favorite=';


function syncFavorite() {
  return new Promise(function (resolve, reject) {
    idb.open('restaurants').then((db) => {
      if (!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      const storeIndex = store.index('needs-sync');
      console.log('passo da qui');

      storeIndex.getAll(1).then(function (restaurants) {
        restaurants.forEach(function (restaurant) {
          fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`, {
            method: "PUT"
          }).then(function (response) {
            return response.json();
          }).then(function (data) {
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            data.needs_sync = 0;
            store.put(data);
            resolve('synced');
          }).catch(function (error) {
            reject(error);
          });
        });
      });
    });
  });
}

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
        var restaurantsDb = upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
        restaurantsDb.createIndex('needs-sync', 'needs_sync', {unique: false});
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
            var promises = restaurantsOnline.map(function(restaurantOnline){
              return store.get(parseInt(restaurantOnline.id)).then(restaurantOffline => {
                if (restaurantOffline.needs_sync == 0) {
                  store.put(restaurantOnline);
                  return restaurantOnline;
                } else {
                  return restaurantOffline;
                }
              }).catch((error) => {
                store.put(restaurantOnline);
                return restaurantOnline;
              });
            })
            return Promise.all(promises).then(function(results) {
                console.log(results)
                return new Response(JSON.stringify(results), { "status": 200, headers: { 'Content-Type': 'application/json' } });
              })

          }).catch(function (error) {
            // fetch offline
            console.log("fetch restaurants offline");
            return new Response(JSON.stringify(restaurantsOffline), { "status": 200, headers: { 'Content-Type': 'application/json' } })
          });
        })
      })
    );
    // prevent two fetchesself
    return;
  }
  // check if page is a faselfvorite data
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
          var tx = db.transaction('restaurants', 'readwrite')
          var store = tx.objectStore('restaurants');
          store.put(restaurantOnline);
          return new Response(JSON.stringify(restaurantOnline), { "status": 200, headers: { 'Content-Type': 'application/json' } });
        }).catch(function (error) {
          // fetch offline
          console.log("put favorite offline");
          const currentUrl = new URL(event.request.url);
          const isFavorite = currentUrl.searchParams.get('is_favorite');
          //const mainPathUrl = currentUrl.pathname.split('/')[1];
          const restaurantsId = currentUrl.pathname.split('/')[2];

          var tx = db.transaction('restaurants', 'readwrite')
          var store = tx.objectStore('restaurants');

          return store.get(parseInt(restaurantsId)).then((restaurantOffline) => {
            restaurantOffline.needs_sync = 1;
            restaurantOffline.is_favorite = isFavorite;
            store.put(restaurantOffline);

            return self.registration.sync.register('sync-favorite').then(() => {
              console.log('Registered sync favorite');
              return new Response(JSON.stringify(restaurantOffline), { "status": 200, headers: { 'Content-Type': 'application/json' } })
            });
          });
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

self.addEventListener('sync', function (event) {
  console.log('lanciato il listener');
  console.log(event);
  if (event.tag === 'sync-favorite') {
    console.log('passatodaqui1');
    event.waitUntil(syncFavorite());
  }
});