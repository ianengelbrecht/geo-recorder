
import { self } from '$app/service-worker';
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { asset, resolve } from '$app/paths';

const CACHE_PREFIX = 'geo-recorder-';
const CACHE_NAME = `${CACHE_PREFIX}${version}`;

// All generated JS/CSS and files in static/
const FILES = [
  ...immutable.map(
    (file) => new URL(file.path, self.registration.scope).pathname
  ),
  ...assets.map((file) => asset(file.path))
];

// Homepage for offline navigation fallback
const HOME = resolve('/');

// Install the new version, but don't activate it yet.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll([...new Set([...FILES, HOME])]);
    })()
  );
});

// Activate only after the old version releases control
// or the user explicitly requests an update.
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

// Activate when the user presses Update.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept requests to other origins.
  if (url.origin !== self.location.origin) return;

  // Only handle requests within this PWA's scope.
  if (!url.href.startsWith(self.registration.scope)) return;

  // Navigation: network first, cache if offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch {
          const cached = await cache.match(request);

          if (cached) return cached;

          const homepage = await cache.match(HOME);

          if (homepage) return homepage;

          return Response.error();
        }
      })()
    );

    return;
  }

  // Versioned build files and static resources.
  if (FILES.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        const cached = await cache.match(request);

        return cached ?? fetch(request);
      })()
    );
  }
});
