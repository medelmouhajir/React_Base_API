// Service Worker for Web Push Notifications
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly, StaleWhileRevalidate , NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

const CACHE_VERSION = '1.1';

const CACHE_NAME = 'rentify-v' + CACHE_VERSION;

// CRITICAL: This placeholder is required for manifest injection
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Skip waiting and claim clients
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

// Runtime caching strategies
registerRoute(
    ({ url }) => url.pathname.includes('/api/notifications'),
    new NetworkOnly(), // Never cache notifications
    'GET'
);

registerRoute(
    ({ url }) => url.pathname.includes('/api/'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    }),
    'GET'
);

registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            }),
        ],
    })
);

registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new StaleWhileRevalidate({
        cacheName: 'static-resources',
    })
);

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);

    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    let notificationData;
    try {
        notificationData = event.data.json();
    } catch (error) {
        console.error('Failed to parse notification data:', error);
        return;
    }

    const { notification } = notificationData;

    const options = {
        body: notification.body,
        icon: notification.icon || '/icons/notification-icon.png',
        badge: notification.badge || '/icons/badge.png',
        tag: notification.tag || 'default-notification',
        requireInteraction: notification.data?.severity === 'Critical',
        data: notification.data,
        actions: [
            {
                action: 'view',
                title: 'View'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        vibrate: notification.data?.severity === 'Critical' ? [200, 100, 200] : [100],
        silent: false
    };

    event.waitUntil(
        self.registration.showNotification(notification.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Handle notification click
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        // Handle offline data sync here
    }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});