// Service Worker for Web Push Notifications

const CACHE_NAME = 'rentify-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

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
        vibrate: notification.data?.severity === 'Critical' ? [200, 100, 200] : [100]
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

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync:', event.tag);

    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

async function syncNotifications() {
    // Sync notification read status when back online
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();

        // Process pending notification updates
        for (const request of requests) {
            if (request.url.includes('/notifications/')) {
                await fetch(request);
                await cache.delete(request);
            }
        }
    } catch (error) {
        console.error('Failed to sync notifications:', error);
    }
}