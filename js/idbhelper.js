/**
 * IDB database helper functions.
 */
class IdbHelper {

  /**
  * @description create or open local idb store
  */
  static openDatabase() {
    return idb.open('restaurants', 1, upgradeDb => {
      var restaurantsDb = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      restaurantsDb.createIndex('needs-sync', 'needs_sync', { unique: false });
    });
  }

  static openRestaurantsDatabase(db) {
    if (!db) return;
    var tx = db.transaction('restaurants', 'readwrite');
    return tx.objectStore('restaurants');
  }

}