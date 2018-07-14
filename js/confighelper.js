/**
 * Common configuration helper functions.
 */
class ConfigHelper {

  /**
   * Database URL API for Restaurants.
   */
  static get RESTAURANTS_URL() {
    return `http://localhost:1337/restaurants`;
  }

  /**
   * Database URL API for Reviews.
   */
  static get REVIEWS_URL() {
    return `http://localhost:1337/reviews`;
  }

  /**
   * Favorite URL API.
   */
  static get FAVORITE_INTERCEPT_PUT_URL() {
    return `/?is_favorite=`;
  }

  /**
   * Cache Name.
   */
  static get CURRENT_CACHE_NAME() {
    return `mws-restaurant-dynamic-v82`;
  }

  /**
   * Get url for review.
   */
  static get REVIEW_INTERCEPT_GET_URL() {
    return `/?restaurant_id=`;
  }

}