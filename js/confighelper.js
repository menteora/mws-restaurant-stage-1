/**
 * Common configuration helper functions.
 */
class ConfigHelper {

  /**
   * Database URL API.
   */
  static get DATABASE_URL() {
    return `http://localhost:1337/restaurants`;
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
    return `mws-restaurant-dynamic-v75`;
  }
}