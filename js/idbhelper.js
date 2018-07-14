/**
 * IDB database helper functions.
 */
class IdbHelper {

  /**
  * @description create or open local idb store
  */
  static openDatabase() {
    return idb.open('restaurants-database', 1, upgradeDb => {
      var restaurantsDb = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });

      var reviewDb = upgradeDb.createObjectStore('reviews', {
        keyPath: 'local_id',
        autoIncrement: true
      });

      restaurantsDb.createIndex('needs-sync', 'needs_sync', { unique: false });
      reviewDb.createIndex('by-restaurant-id', 'restaurant_id', {unique: false});
      reviewDb.createIndex('by-server-id', 'id');
    });
  }

  static openRestaurantsTable(db) {
    if (!db) return;
    var tx = db.transaction('restaurants', 'readwrite');
    return tx.objectStore('restaurants');
  }

  static openReviewsTable(db) {
    if (!db) return;
    var tx = db.transaction('reviews', 'readwrite');
    return tx.objectStore('reviews');
  }

}