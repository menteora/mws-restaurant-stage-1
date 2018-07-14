/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    fetch(ConfigHelper.RESTAURANTS_URL).then(res => {
      return res.json();
    })
      .then(restaurants => {
        callback(null, restaurants);
      })
      .catch(error => {
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant and reviews by its ID.
   */
  static fetchRestaurantById(id, callback) {
    DBHelper.fetchReviewsByRestaurantId(id).then((reviews) => {
      // fetch all restaurants with proper error handling.
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          const restaurant = restaurants.find(r => r.id == id);
          if (restaurant) { // Got the restaurant
            restaurant.reviews = reviews;
            callback(null, restaurant);
          } else { // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        }
      });
    });
  }

  /**
   * Fetch all reviews by restaurant id
   * @param {string} id - Id of the restaurant
   */
  static fetchReviewsByRestaurantId(id) {
    return fetch(`${ConfigHelper.REVIEWS_URL}/?restaurant_id=${id}`).then((response) => {
      return response.json();
    }).then((data) => {
      return data;
    })
  }

  /**
   * Toogle favorite restaurant
   * @param {string} id - Id of the restaurant
   * @param {boolean} starred - Current state of favorite restaurant id
   */
  static toggleStar(id, starred) {
    //const favorite = (starred == "true");
    return fetch(`${ConfigHelper.RESTAURANTS_URL}/${id}/?is_favorite=${!JSON.parse(starred)}`, {
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

  /**
   * Restaurant add review.
   * @param {string} id - Id of the restaurant
   * @param {object} form - Current representation of submitted form
   */
  static addRestaurantReview(id, form) {

    const review = {
      'id': '',
      'restaurant_id': id,
      'comments': form.comment.value,
      'createdAt': Date.now(),
      'updatedAt': Date.now(),
      'name': form.name.value,
      'rating': form.rating.value
    };

    console.log('Form Data: ' + JSON.stringify(review));
    return fetch(`${ConfigHelper.REVIEWS_URL}/`, {
      method: "POST",
      body: JSON.stringify(review)
    }).then((response) => {
      return response.json();
    }).then((data) => {
      return data;
    });
  }
}
