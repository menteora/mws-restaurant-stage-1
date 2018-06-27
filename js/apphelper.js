class AppHelper {

  /**
  * @description Change image suffix name based on string #1
  * @param {string} filename - Name of file to change
  * @param {string} string - Suffix to append
  */
  static setSuffixToFile(filename, string) {
    var dotIndex = filename.lastIndexOf(".");
    if (dotIndex == -1) return filename + string;
    else return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
  }

  /**
  * @description Change image suffix name based on string and append jpg extension
  * @param {string} filename - Name of file to change
  * @param {string} string - Suffix to append
  */
 static setSuffixToFileAndWebpExtension(filename, string) {
  return (string) ? filename + string + '.webp' : filename + '.webp';
}

  /**
  * @description Service worker init and workflow
  */
  static startServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        if (!navigator.serviceWorker.controller) {
          return;
        }
        if (reg.waiting) {
          console.log('SW waiting')
          AppHelper.skipWaiting(reg.waiting);
          return;
        }
        if (reg.installing) {
          console.log('SW installing')
          AppHelper.trackInstalling(reg.installing);
          return;
        }
        reg.addEventListener('updatefound', () => {
          console.log('SW update found')
          AppHelper.trackInstalling(reg.installing);
        });
      });

      let refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        console.log('SW controllerchange')
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    }
  }

  /**
   * @description Skip waiting service worker updates
   */
  static skipWaiting(worker) {
    worker.postMessage({ action: 'skipWaiting' });
  };

  /**
   * @description Track service worker installing status
   */
  static trackInstalling(worker) {
    worker.addEventListener('statechange', function () {
      if (worker.state == 'installed') {
        console.log('SW installed');
        AppHelper.skipWaiting(worker);
      }
    });
  };
}