/**
 * IDB database helper functions.
 */
class IdbHelper {

  /**
  * @description create or open local idb store
  */
  static openDatabase() {
    return idb.open('restaurants-db', 1, upgradeDb => {
      var restaurantsDb = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      restaurantsDb.createIndex('needs-sync', 'needs_sync', {unique: false});
    });
  }
}