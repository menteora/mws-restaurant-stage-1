/**
 * Common database helper functions.
 */
class DBHelper {

  /**
  * @description create or open local idb store
  */
  static openDatabase() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      console.log('This browser doesn\'t support Service Worker');
      return Promise.resolve();
      if (!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB');
        return Promise.resolve();
      }
    }

    return idb.open('restaurants', 1, upgradeDb => {
      var restaurantsDb = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      restaurantsDb.createIndex('needs-sync', 'needs_sync', {unique: false});
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    fetch(ConfigHelper.DATABASE_URL).then(res => {
      return res.json();
    })
      .then(restaurants => {
        callback(null, restaurants);
      })
      .catch(error => {
        callback(error, null);
      });
  }

  static fetchRestaurantsBackup(callback) {

    fetch(ConfigHelper.DATABASE_URL).then(res => {
      return res.json();
    })
      .then(restaurants => {
        //If online request return data fill idb
        idb.open('restaurants', 1, upgradeDb => {
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        }).then(function (db) {
          var tx = db.transaction('restaurants', 'readwrite')
          var store = tx.objectStore('restaurants');
          restaurants.forEach(function (restaurant) {
            store.put(restaurant);
          });
          callback(null, restaurants)
        });
      })
      .catch(error => {
        //If online request fails try to catch local idb data
        idb.open('restaurants', 1, upgradeDb => {
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        }).then(function (db) {
          var tx = db.transaction('restaurants')
          var store = tx.objectStore('restaurants');
          store.getAll().then(restaurants => {
            callback(null, restaurants)
          })
            .catch(error => callback(error, null));
        })
          .catch(error => callback(error, null));
      });
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Toogle favorite restaurant
   * @param {string} id - Id of the restaurant
   * @param {boolean} starred - Current state of favorite restaurant id
   */
  static toggleStar(id, starred) {
    //const favorite = (starred == "true");
    return fetch(`${ConfigHelper.DATABASE_URL}/${id}/?is_favorite=${!JSON.parse(starred)}`, {
      method: "PUT"
    }).then((response) => {
      return response.json();
    }).then((data) => {
      return data.is_favorite;
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }
}
