
import { self } from '$app/service-worker';
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { asset, resolve } from '$app/paths';

const CACHE_PREFIX = 'geo-recorder-';
const CACHE_NAME = `${CACHE_PREFIX}${version}`;

// SvelteKit's generated JS/CSS files.
const BUILD_FILES = immutable.map(
  (file) => new URL(file.path, self.registration.scope).pathname
);

// Files from the static directory.
// we need to exlude jekyll files because these won't cache...
const STATIC_FILES = assets
  .filter((file) => file.path !== '.nojekyll')
  .map((file) => asset(file.path));

// The HTML entry point, including the GitHub Pages base path.
const HOME = resolve('/');

const APP_FILES = [
  ...new Set([
    ...BUILD_FILES,
    ...STATIC_FILES,
    HOME
  ])
];

// INSTALL
// Download the complete application before installation succeeds.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        await cache.addAll(APP_FILES);
        console.log('GeoRecorder cached for offline use');
      } catch (error) {
        console.error('Failed to cache GeoRecorder:', error);
        throw error;
      }
    })()
  );

  // Deliberately don't call skipWaiting().
  // The user controls updates through PwaUpdate.svelte.
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(CACHE_PREFIX) &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

// USER-INITIATED UPDATE
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

// FETCH
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const scope = self.registration.scope;

  if (url.origin !== self.location.origin) return;
  if (!url.href.startsWith(scope)) return;

  // Navigation: cache first, network fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // First try the exact requested page.
        const cached = await cache.match(request);
        if (cached) return cached;

        // Fall back to the precached application entry point.
        const homepage = await cache.match(HOME);
        if (homepage) return homepage;

        // Only use the network if nothing is cached.
        try {
          const response = await fetch(request);

          if (response.ok) {
            event.waitUntil(
              cache.put(request, response.clone())
            );
          }

          return response;
        } catch {
          return Response.error();
        }
      })()
    );

    return;
  }

  // Application resources: cache first.
  if (
    BUILD_FILES.includes(url.pathname) ||
    STATIC_FILES.includes(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) return cached;

        const response = await fetch(request);

        if (response.ok) {
          event.waitUntil(
            cache.put(request, response.clone())
          );
        }

        return response;
      })()
    );
  }
});
