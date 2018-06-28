importScripts('js/idb.js');
importScripts('js/idbhelper.js');
importScripts('js/confighelper.js');

currentCacheName = 'mws-restaurant-dynamic-v30';

function syncFavorite() {
  return new Promise(function (resolve, reject) {
    console.log('favorite start sync');
    IdbHelper.openDatabase().then((db) => {
      const store = IdbHelper.openRestaurantsDatabase(db);
      const storeIndex = store.index('needs-sync');

      storeIndex.getAll(1).then(function (restaurants) {
        restaurants.forEach(function (restaurant) {
          fetch(`${ConfigHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`, {
            method: "PUT"
          }).then(function (response) {
            return response.json();
          }).then(function (data) {
            const store = IdbHelper.openRestaurantsDatabase(db);
            data.needs_sync = 0;
            store.put(data);
            console.log(`favorite end sync restaurant ${restaurant.id}`);
            resolve('synced');
          }).catch(function (error) {
            console.log(`favorite error: ${error}`);
            reject(error);
          });
        });
      });
    });
  });
}

self.addEventListener('install', event => {
  console.log('SW installing…');
});

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
    }).then(() => {
      console.log('SW activate');
    })
  );
});

self.addEventListener('fetch', function (event) {
  // check if page is a restaurants data
  if (event.request.url.indexOf(ConfigHelper.DATABASE_URL) !== -1 && event.request.method == 'GET') {
    event.respondWith(
      // open db
      IdbHelper.openDatabase().then(function (db) {
        const store = IdbHelper.openRestaurantsDatabase(db);
        // get all restaurants inside local db
        return store.getAll().then(function (restaurantsOffline) {
          return fetch(event.request).then(function (response) {
            return response.json();
          }).then(function (restaurantsOnline) {
            // fetch online
            console.log("fetch restaurants online");
            const store = IdbHelper.openRestaurantsDatabase(db);
            // update restaurants
            var promises = restaurantsOnline.map(function (restaurantOnline) {
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
            return Promise.all(promises).then(function (results) {
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
  if (event.request.url.indexOf(ConfigHelper.DATABASE_URL) !== -1 && event.request.url.indexOf(ConfigHelper.FAVORITE_INTERCEPT_PUT_URL) !== -1 && event.request.method == 'PUT') {
    console.log(event.request.url);
    event.respondWith(
      // open db
      IdbHelper.openDatabase().then(function (db) {
        // get all restaurants inside local db
        return fetch(event.request).then(function (response) {
          return response.json();
        }).then(function (restaurantOnline) {
          // fetch online
          const store = IdbHelper.openRestaurantsDatabase(db);
          store.put(restaurantOnline);
          return new Response(JSON.stringify(restaurantOnline), { "status": 200, headers: { 'Content-Type': 'application/json' } });
        }).catch(function (error) {
          // fetch offline
          console.log("put favorite offline");
          const currentUrl = new URL(event.request.url);
          const isFavorite = currentUrl.searchParams.get('is_favorite');
          //const mainPathUrl = currentUrl.pathname.split('/')[1];
          const restaurantsId = currentUrl.pathname.split('/')[2];
          const store = IdbHelper.openRestaurantsDatabase(db);

          return store.get(parseInt(restaurantsId)).then((restaurantOffline) => {
            restaurantOffline.needs_sync = 1;
            restaurantOffline.is_favorite = isFavorite;
            store.put(restaurantOffline);

            return self.registration.sync.register('sync-favorite').then(() => {
              console.log('registered sync favorite');
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
  if (event.tag === 'sync-favorite') {
    event.waitUntil(syncFavorite());
  }
});