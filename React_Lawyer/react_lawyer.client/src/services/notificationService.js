// src/services/notificationsService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling notification-related API calls
 */
class NotificationsService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get all notifications
     * @returns {Promise<Array>} Promise resolving to array of notifications
     */
    async getAllNotifications() {
        try {
            const response = await fetch(`${API_URL}/api/notifications`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getAllNotifications:', error);
            throw error;
        }
    }

    /**
     * Get notification by ID
     * @param {number} id - The notification ID
     * @returns {Promise<Object>} Promise resolving to notification object
     */
    async getNotificationById(id) {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notification details');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getNotificationById(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get notifications for a specific user
     * @param {number} userId - The user ID
     * @returns {Promise<Array>} Promise resolving to array of notifications
     */
    async getUserNotifications(userId) {
        try {
            const response = await fetch(`${API_URL}/api/notifications/user/${userId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user notifications');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getUserNotifications(${userId}):`, error);
            throw error;
        }
    }

    /**
     * Get unread notifications for a specific user
     * @param {number} userId - The user ID
     * @returns {Promise<Array>} Promise resolving to array of unread notifications
     */
    async getUserUnreadNotifications(userId) {
        try {
            const response = await fetch(`${API_URL}/api/notifications/user/${userId}/unread`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch unread notifications');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getUserUnreadNotifications(${userId}):`, error);
            throw error;
        }
    }

    /**
     * Create a new notification
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Promise resolving to created notification
     */
    async createNotification(notificationData) {
        try {
            const response = await fetch(`${API_URL}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(notificationData)
            });

            if (!response.ok) {
                throw new Error('Failed to create notification');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in createNotification:', error);
            throw error;
        }
    }

    /**
     * Mark a notification as read
     * @param {number} id - The notification ID
     * @returns {Promise<boolean>} Promise resolving to true if update succeeded
     */
    async markAsRead(id) {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${id}/markAsRead`, {
                method: 'PUT',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }

            return true;
        } catch (error) {
            console.error(`Error in markAsRead(${id}):`, error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {number} userId - The user ID
     * @returns {Promise<boolean>} Promise resolving to true if update succeeded
     */
    async markAllAsRead(userId) {
        try {
            const response = await fetch(`${API_URL}/api/notifications/markAllAsRead/${userId}`, {
                method: 'PUT',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read');
            }

            return true;
        } catch (error) {
            console.error(`Error in markAllAsRead(${userId}):`, error);
            throw error;
        }
    }

    /**
     * Delete a notification
     * @param {number} id - The notification ID
     * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded
     */
    async deleteNotification(id) {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to delete notification');
            }

            return true;
        } catch (error) {
            console.error(`Error in deleteNotification(${id}):`, error);
            throw error;
        }
    }

    /**
     * Delete all notifications for a user
     * @param {number} userId - The user ID
     * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded
     */
    async deleteAllNotifications(userId) {
        try {
            const response = await fetch(`${API_URL}/api/notifications/deleteAll/${userId}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to delete all notifications');
            }

            return true;
        } catch (error) {
            console.error(`Error in deleteAllNotifications(${userId}):`, error);
            throw error;
        }
    }

    /**
     * Get notification summary for a user
     * @param {number} userId - The user ID
     * @returns {Promise<Object>} Promise resolving to notification summary
     */
    async getNotificationSummary(userId) {
        try {
            const response = await fetch(`${API_URL}/api/notifications/summary/${userId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notification summary');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getNotificationSummary(${userId}):`, error);
            throw error;
        }
    }

    /**
     * Get notification type icon
     * @param {string} type - Notification type
     * @returns {string} Material icon name
     */
    getNotificationTypeIcon(type) {
        switch (type) {
            case 'AppointmentReminder':
                return 'Event';
            case 'CaseUpdate':
                return 'Gavel';
            case 'InvoiceCreated':
            case 'PaymentReceived':
                return 'AttachMoney';
            case 'DocumentShared':
                return 'Description';
            case 'SystemNotification':
                return 'Notifications';
            case 'TaskAssigned':
                return 'Assignment';
            case 'MessageReceived':
                return 'Email';
            default:
                return 'Notifications';
        }
    }
}

export default new NotificationsService();