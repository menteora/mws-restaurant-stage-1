var currentCacheName = 'mws-restaurant-dynamic-v01';
var apiUrl = 'http://localhost:1337/restaurants';

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-restaurant-') &&
                 cacheName != currentCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
self.addEventListener('fetch', function (event) {
  //if (event.request.url.indexOf(apiUrl) !== -1) { return; }

  event.respondWith(
    caches.open(currentCacheName).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function (response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );

});
self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
    console.log('SW skip waiting')
  }
});