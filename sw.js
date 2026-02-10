const CACHE_NAME = 'centro-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon.svg',

  // Styles
  '/styles/main.css',
  '/styles/base.css',
  '/styles/layout.css',
  '/styles/screen.css',
  '/styles/controls.css',
  '/styles/games/roguebox.css',
  '/styles/games/labyrinth.css',
  '/styles/games/drawit.css',

  // Scripts
  '/js/storage.js',
  '/js/audio-engine.js',
  '/js/app.js',
  '/js/games/RogueBox.js',
  '/js/games/labyrinth.js',
  '/js/games/DrawIt.js'
];

// Install Event - Pre-cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Centro SW: Cache opened, pre-caching assets');
        return cache.addAll(ASSETS);
      })
  );
  // Activate immediately, don't wait for old SW to finish
  self.skipWaiting();
});

// Fetch Event - Network-first strategy (always try fresh version first)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Got a fresh response, cache it for offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, fall back to cache (offline mode)
        return caches.match(event.request);
      })
  );
});

// Activate Event - Clean up old caches and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Centro SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});
