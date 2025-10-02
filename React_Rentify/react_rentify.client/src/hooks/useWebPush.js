import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const useWebPush = () => {
    const { user } = useAuth();
    const [permission, setPermission] = useState(Notification.permission);
    const [subscription, setSubscription] = useState(null);
    const [isSupported, setIsSupported] = useState(false);

    // Check if Web Push is supported
    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
        }
    }, []);

    // Request permission and subscribe
    const requestPermission = async () => {
        if (!isSupported) {
            console.warn('Web Push not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission === 'granted') {
                await subscribeToPush();
                return true;
            }

            return false;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    };

    // Subscribe to push notifications
    const subscribeToPush = async () => {
        if (!user) return;

        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;

            // Get VAPID public key from server (you'll need to add this endpoint)
            const vapidResponse = await apiClient.get('/notifications/vapid-public-key');
            const vapidPublicKey = vapidResponse.data.publicKey;

            // Subscribe to push
            const pushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Send subscription to server
            await apiClient.post('/notifications/subscribe', {
                endpoint: pushSubscription.endpoint,
                p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')),
                auth: arrayBufferToBase64(pushSubscription.getKey('auth'))
            });

            setSubscription(pushSubscription);
            console.log('✅ Subscribed to push notifications');
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    };

    // Unsubscribe from push notifications
    const unsubscribeFromPush = async () => {
        if (!subscription) return;

        try {
            await subscription.unsubscribe();

            // Remove subscription from server
            await apiClient.delete('/notifications/unsubscribe', {
                data: { endpoint: subscription.endpoint }
            });

            setSubscription(null);
            console.log('✅ Unsubscribed from push notifications');
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
        }
    };

    // Helper function
    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    // Auto-subscribe if user has granted permission
    useEffect(() => {
        if (user && permission === 'granted' && !subscription) {
            subscribeToPush();
        }
    }, [user, permission]);

    return {
        isSupported,
        permission,
        subscription,
        requestPermission,
        unsubscribeFromPush
    };
};