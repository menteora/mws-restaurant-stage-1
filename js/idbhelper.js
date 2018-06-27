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

  static openRestaurantsDatabase() {
    return IdbHelper.openDatabase().then(db => {
      if (!db) return;
      var tx = db.transaction('restaurants')
      return tx.objectStore('restaurants');
    }).catch(function (error) {
      console.log(`openRestaurantsDatabase error: ${error}`)
    });
  }

}