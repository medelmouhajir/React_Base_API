// Service Worker for React Lawyer PWA
// This file will be processed by the vite-plugin-pwa

import { precacheAndRoute } from 'workbox-precaching';

// Use with injectManifest
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache and return requests
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('/index.html');
                })
        );
    } else if (event.request.url.includes('/api/')) {
        // Handle API requests
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    } else {
        // For all other requests, try the cache first, fall back to the network
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request)
                        .then(response => {
                            // Check if we received a valid response
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            // Clone the response
                            const responseToCache = response.clone();
                            caches.open('lawyer-app-v1')
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        });
                })
        );
    }
});

// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
    const cacheWhitelist = ['lawyer-app-v1'];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});