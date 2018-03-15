class AppHelper {

  static setSuffixToFile(filename, string) {
    var dotIndex = filename.lastIndexOf(".");
    if (dotIndex == -1) return filename + string;
    else return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
  }

  static offineRemoveMap() {
    if ('serviceWorker' in navigator) {
      if (!navigator.onLine) {
        console.log('offline');
        document.getElementById('map-container').style.display = "none";
      }
    }
  }

  static startServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        if (!navigator.serviceWorker.controller) {
          return;
        }
        if (reg.waiting) {
          console.log('SW waiting')
          var worker = reg.waiting;
          worker.postMessage({
            action: 'skipWaiting'
          });
          return;
        }
        if (reg.installing) {
          console.log('SW installing')
          var worker = reg.installing;
          worker.addEventListener('statechange', () => {
            if (worker.state == 'installed') {
              console.log('SW installed')
              worker.postMessage({
                action: 'skipWaiting'
              });
            }
          });
          return;
        }
        reg.addEventListener('updatefound', () => {
          console.log('SW update found')
          var worker = reg.installing;
          worker.addEventListener('statechange', () => {
            if (worker.state == 'installed') {
              console.log('SW installed')
              worker.postMessage({
                action: 'skipWaiting'
              });
            }
          });
        });
      });
      var refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        console.log('SW controllerchange')
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });

      this.offineRemoveMap();
    }
  }
}