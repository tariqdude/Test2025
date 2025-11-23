const CACHE_NAME = 'elite-project-v1';

const resolveBasePath = () => {
  try {
    const scopeUrl = new URL(self.registration?.scope ?? self.location.href);
    const pathname = scopeUrl.pathname.replace(/\/$/, '');
    return pathname === '/' ? '' : pathname;
  } catch (error) {
    console.error('[Service Worker] Failed to derive base path:', error);
    return '';
  }
};

const BASE_PATH = resolveBasePath();

const withBase = path => {
  if (!path) {
    return BASE_PATH ? `${BASE_PATH}/` : '/';
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!BASE_PATH) {
    return normalizedPath;
  }

  return `${BASE_PATH}${normalizedPath}`;
};

// Assets to cache on install
const STATIC_ASSETS = [
  withBase('/'),
  withBase('/about/'),
  withBase('/blog/'),
  withBase('/services/'),
  withBase('/pricing/'),
  withBase('/demo/'),
  withBase('/components/'),
  withBase('/offline/'),
  withBase('/manifest.json'),
  withBase('/favicon.svg'),
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.error('[Service Worker] Failed to cache assets:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return (
              caches.match(withBase('/offline/')) ||
              caches.match(withBase('/offline.html')) ||
              new Response('<h1>Offline</h1>', {
                headers: { 'Content-Type': 'text/html' },
              })
            );
          }

          // Return generic offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// Message event - handle commands from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});
