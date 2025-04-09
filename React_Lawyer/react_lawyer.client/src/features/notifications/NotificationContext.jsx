// src/features/notifications/NotificationContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import notificationsService from '../../services/notificationService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Create context
const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Provider component
export const NotificationProvider = ({ children }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    // State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    // Fetch notification summary (recent notifications + unread count)
    const fetchNotificationSummary = useCallback(async () => {
        if (!user || !isOnline) return;

        setLoading(true);
        setError('');

        try {
            const summary = await notificationsService.getNotificationSummary(user.id);
            setNotifications(summary.recentNotifications || []);
            setUnreadCount(summary.unreadCount || 0);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(t('notifications.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [user, isOnline, t]);

    // Fetch all notifications for a user
    const fetchAllNotifications = useCallback(async () => {
        if (!user || !isOnline) return [];

        setLoading(true);
        setError('');

        try {
            const data = await notificationsService.getUserNotifications(user.id);
            setLastUpdated(new Date());
            return data || [];
        } catch (err) {
            console.error('Error fetching all notifications:', err);
            setError(t('notifications.fetchError'));
            return [];
        } finally {
            setLoading(false);
        }
    }, [user, isOnline, t]);

    // Fetch unread notifications for a user
    const fetchUnreadNotifications = useCallback(async () => {
        if (!user || !isOnline) return [];

        setLoading(true);
        setError('');

        try {
            const data = await notificationsService.getUserUnreadNotifications(user.id);
            setLastUpdated(new Date());
            return data || [];
        } catch (err) {
            console.error('Error fetching unread notifications:', err);
            setError(t('notifications.fetchError'));
            return [];
        } finally {
            setLoading(false);
        }
    }, [user, isOnline, t]);

    // Mark a notification as read
    const markAsRead = useCallback(async (notificationId) => {
        if (!isOnline) return false;

        try {
            await notificationsService.markAsRead(notificationId);

            // Update local state
            setNotifications(prev =>
                prev.map(notification =>
                    notification.notificationId === notificationId
                        ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                        : notification
                )
            );

            // Decrement unread count
            setUnreadCount(prev => Math.max(0, prev - 1));

            return true;
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError(t('notifications.markAsReadError'));
            return false;
        }
    }, [isOnline, t]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!user || !isOnline) return false;

        try {
            await notificationsService.markAllAsRead(user.id);

            // Update local state
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    isRead: true,
                    readAt: new Date().toISOString()
                }))
            );

            // Set unread count to zero
            setUnreadCount(0);

            return true;
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            setError(t('notifications.markAllAsReadError'));
            return false;
        }
    }, [user, isOnline, t]);

    // Delete a notification
    const deleteNotification = useCallback(async (notificationId) => {
        if (!isOnline) return false;

        try {
            await notificationsService.deleteNotification(notificationId);

            // Update local state
            setNotifications(prev =>
                prev.filter(notification => notification.notificationId !== notificationId)
            );

            return true;
        } catch (err) {
            console.error('Error deleting notification:', err);
            setError(t('notifications.deleteError'));
            return false;
        }
    }, [isOnline, t]);

    // Delete all notifications
    const deleteAllNotifications = useCallback(async () => {
        if (!user || !isOnline) return false;

        try {
            await notificationsService.deleteAllNotifications(user.id);

            // Update local state
            setNotifications([]);
            setUnreadCount(0);

            return true;
        } catch (err) {
            console.error('Error deleting all notifications:', err);
            setError(t('notifications.deleteAllError'));
            return false;
        }
    }, [user, isOnline, t]);

    // Create a notification
    const createNotification = useCallback(async (notificationData) => {
        if (!isOnline) return null;

        try {
            const newNotification = await notificationsService.createNotification(notificationData);

            // Update local state if this notification is for the current user
            if (notificationData.userId === user?.id) {
                setNotifications(prev => [newNotification, ...prev].slice(0, 5));
                setUnreadCount(prev => prev + 1);
            }

            return newNotification;
        } catch (err) {
            console.error('Error creating notification:', err);
            return null;
        }
    }, [isOnline, user]);

    // Fetch notifications when user changes or when online status changes
    useEffect(() => {
        if (user && isOnline) {
            fetchNotificationSummary();

            // Set up polling for new notifications (every 2 minutes)
            const interval = setInterval(() => {
                fetchNotificationSummary();
            }, 2 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [user, isOnline, fetchNotificationSummary]);

    // Get notification type icon
    const getNotificationTypeIcon = (type) => {
        return notificationsService.getNotificationTypeIcon(type);
    };

    // Format notification time
    const formatNotificationTime = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMin < 1) {
            return t('notifications.justNow');
        } else if (diffMin < 60) {
            return t('notifications.minutesAgo', { count: diffMin });
        } else if (diffHours < 24) {
            return t('notifications.hoursAgo', { count: diffHours });
        } else if (diffDays < 7) {
            return t('notifications.daysAgo', { count: diffDays });
        } else {
            return date.toLocaleDateString();
        }
    };

    // Context value
    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        lastUpdated,
        fetchNotificationSummary,
        fetchAllNotifications,
        fetchUnreadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        createNotification,
        getNotificationTypeIcon,
        formatNotificationTime
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;