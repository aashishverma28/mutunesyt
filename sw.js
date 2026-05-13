const CACHE_NAME = 'mutunes-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './views.js',
  './components.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
            // Fallback for offline viewing
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        });
      }
    )
  );
});
