import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from './AuthContext';
import apiClient from '../services/apiClient';
import { toast } from 'react-toastify';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

// Notification sound
const playNotificationSound = (severity) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (severity === 'Critical') {
        // Urgent sound - two beeps
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        const oscillator2 = audioContext.createOscillator();
        oscillator2.connect(gainNode);
        oscillator2.frequency.value = 1000;
        oscillator2.start(audioContext.currentTime + 0.15);
        oscillator2.stop(audioContext.currentTime + 0.25);
    } else if (severity === 'Warning') {
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    } else {
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { isConnected, on, invoke } = useSignalR();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch initial notifications and preferences
    useEffect(() => {
        if (!user) return;

        const fetchInitialData = async () => {
            try {
                setLoading(true);

                // Fetch notifications
                const notifResponse = await apiClient.get('/notifications?page=1&pageSize=20');
                setNotifications(notifResponse.data.items || []);

                // Fetch unread count
                const countResponse = await apiClient.get('/notifications/unread-count');
                setUnreadCount(countResponse.data.count || 0);

                // Fetch preferences
                const prefResponse = await apiClient.get('/notifications/preferences');
                setPreferences(prefResponse.data);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user]);

    // Listen for SignalR notifications
    useEffect(() => {
        if (!isConnected) return;

        const cleanup = on('ReceiveNotification', (notification) => {
            console.log('📬 New notification received:', notification);

            // Add to state
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Check preferences before showing
            if (shouldShowNotification(notification)) {
                // Show toast
                showToastNotification(notification);

                // Play sound
                playNotificationSound(notification.severity);

                // Show browser notification if permitted
                showBrowserNotification(notification);
            }
        });

        return cleanup;
    }, [isConnected, on, preferences]);

    // Check if notification should be shown based on preferences
    const shouldShowNotification = (notification) => {
        if (!preferences) return true;

        // Critical alerts always show
        if (notification.severity === 'Critical') return true;

        // Check category preferences
        const categoryMap = {
            'Reservation': preferences.reservationNotifications,
            'GPS': preferences.gpsAlerts,
            'Maintenance': preferences.maintenanceAlerts,
            'System': preferences.systemNotifications,
            'Security': preferences.securityAlerts
        };

        if (!categoryMap[notification.type]) return false;

        // Check quiet hours
        if (preferences.quietHoursStart && preferences.quietHoursEnd) {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const quietStart = preferences.quietHoursStart.hours * 60 + preferences.quietHoursStart.minutes;
            const quietEnd = preferences.quietHoursEnd.hours * 60 + preferences.quietHoursEnd.minutes;

            if (currentTime >= quietStart && currentTime <= quietEnd) {
                return notification.severity === 'Critical'; // Only critical during quiet hours
            }
        }

        return true;
    };

    // Show toast notification
    const showToastNotification = (notification) => {
        const severityConfig = {
            'Info': { type: 'info', autoClose: 5000 },
            'Warning': { type: 'warning', autoClose: 8000 },
            'Critical': { type: 'error', autoClose: false }
        };

        const config = severityConfig[notification.severity] || severityConfig.Info;

        toast[config.type](
            <div onClick={() => handleNotificationClick(notification)}>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
            </div>,
            {
                autoClose: config.autoClose,
                closeOnClick: true
            }
        );
    };

    // Show browser notification (Web Push)
    const showBrowserNotification = async (notification) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        try {
            const browserNotif = new Notification(notification.title, {
                body: notification.message,
                icon: '/icons/notification-icon.png',
                badge: '/icons/badge.png',
                tag: `notification-${notification.id}`,
                requireInteraction: notification.severity === 'Critical',
                data: notification
            });

            browserNotif.onclick = () => {
                window.focus();
                handleNotificationClick(notification);
                browserNotif.close();
            };
        } catch (error) {
            console.error('Failed to show browser notification:', error);
        }
    };

    // Handle notification click
    const handleNotificationClick = async (notification) => {
        // Mark as read
        await markAsRead(notification.id);

        // Navigate based on notification type
        //const data = notification.actionUrl ? JSON.parse(notification.data) : {};

        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }

        setIsDrawerOpen(false);
    };

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await invoke('MarkAsRead', notificationId);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, [invoke]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await invoke('MarkAllAsRead');

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }, [invoke]);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            await apiClient.delete(`/notifications/${notificationId}`);

            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setUnreadCount(prev => {
                const notification = notifications.find(n => n.id === notificationId);
                return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
            });
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    }, [notifications]);

    // Load more notifications
    const loadMore = useCallback(async () => {
        try {
            const page = Math.floor(notifications.length / 20) + 1;
            const response = await apiClient.get(`/notifications?page=${page}&pageSize=20`);
            setNotifications(prev => [...prev, ...(response.data.items || [])]);
        } catch (error) {
            console.error('Failed to load more notifications:', error);
        }
    }, [notifications.length]);

    // Update preferences
    const updatePreferences = useCallback(async (newPreferences) => {
        try {
            await apiClient.put('/notifications/preferences', newPreferences);
            setPreferences(newPreferences);
            toast.success('Notification preferences updated');
        } catch (error) {
            console.error('Failed to update preferences:', error);
            toast.error('Failed to update preferences');
        }
    }, []);

    const value = {
        notifications,
        unreadCount,
        isDrawerOpen,
        setIsDrawerOpen,
        preferences,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loadMore,
        updatePreferences,
        handleNotificationClick
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};