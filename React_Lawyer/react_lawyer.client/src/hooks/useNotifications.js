// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import notificationService from '../services/notificationService';
import useOnlineStatus from './useOnlineStatus';

/**
 * Custom hook for managing notifications state and actions
 * @returns {Object} Notifications state and methods
 */
const useNotifications = () => {
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();

    // State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    // Fetch notifications
    const fetchNotifications = useCallback(async (reset = false) => {
        if (!isOnline) return;

        const currentPage = reset ? 1 : page;

        try {
            setLoading(true);
            setError(null);

            const response = await notificationService.getNotifications(currentPage, pageSize);

            // Update state based on response
            if (reset) {
                setNotifications(response.items || []);
            } else {
                setNotifications(prev => [...prev, ...(response.items || [])]);
            }

            setHasMore(response.hasMore || false);

            // If reset, update page to 2 (for next load)
            if (reset) {
                setPage(2);
            } else {
                setPage(prev => prev + 1);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(t('notifications.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [isOnline, page, pageSize, t]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!isOnline) return;

        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    }, [isOnline]);

    // Mark a notification as read
    const markAsRead = useCallback(async (id) => {
        if (!isOnline) return false;

        try {
            const success = await notificationService.markAsRead(id);

            if (success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notification =>
                        notification.id === id
                            ? { ...notification, read: true }
                            : notification
                    )
                );

                // Decrement unread count if this notification was unread
                const wasUnread = notifications.find(n => n.id === id)?.read === false;
                if (wasUnread) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }

            return success;
        } catch (err) {
            console.error(`Error marking notification ${id} as read:`, err);
            return false;
        }
    }, [isOnline, notifications]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!isOnline) return false;

        try {
            const success = await notificationService.markAllAsRead();

            if (success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notification => ({ ...notification, read: true }))
                );

                // Reset unread count
                setUnreadCount(0);
            }

            return success;
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            return false;
        }
    }, [isOnline]);

    // Delete a notification
    const deleteNotification = useCallback(async (id) => {
        if (!isOnline) return false;

        try {
            const success = await notificationService.deleteNotification(id);

            if (success) {
                // Remove from local state
                const notification = notifications.find(n => n.id === id);
                setNotifications(prev => prev.filter(n => n.id !== id));

                // Update unread count if needed
                if (notification && !notification.read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }

            return success;
        } catch (err) {
            console.error(`Error deleting notification ${id}:`, err);
            return false;
        }
    }, [isOnline, notifications]);

    // Clear all read notifications
    const clearAllRead = useCallback(async () => {
        if (!isOnline) return false;

        try {
            const success = await notificationService.clearAllRead();

            if (success) {
                // Keep only unread notifications
                setNotifications(prev => prev.filter(n => !n.read));
            }

            return success;
        } catch (err) {
            console.error('Error clearing read notifications:', err);
            return false;
        }
    }, [isOnline]);

    // Format time elapsed since notification was created
    const formatTimeElapsed = useCallback((createdAt) => {
        return notificationService.formatTimeElapsed(createdAt, t);
    }, [t]);

    // Initial data load
    useEffect(() => {
        if (isOnline) {
            fetchNotifications(true);
            fetchUnreadCount();
        }
    }, [isOnline, fetchNotifications, fetchUnreadCount]);

    // Refresh data at regular intervals
    useEffect(() => {
        if (!isOnline) return;

        // Set up polling for unread count (every minute)
        const unreadCountInterval = setInterval(() => {
            fetchUnreadCount();
        }, 60000);

        return () => {
            clearInterval(unreadCountInterval);
        };
    }, [isOnline, fetchUnreadCount]);

    // Refresh on language change
    useEffect(() => {
        // Re-format notification times when language changes
        if (notifications.length > 0) {
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    formattedTime: formatTimeElapsed(notification.createdAt)
                }))
            );
        }
    }, [t, formatTimeElapsed, notifications.length]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        hasMore,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllRead,
        formatTimeElapsed,
        getNotificationIcon: notificationService.getNotificationIcon
    };
};

export default useNotifications;