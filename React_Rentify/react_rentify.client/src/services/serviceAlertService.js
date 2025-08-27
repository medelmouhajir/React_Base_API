// src/services/serviceAlertService.js
import apiClient from './apiClient';

/**
 * Service for managing service alerts
 */
const serviceAlertService = {
    /**
     * Get all service alerts for the current user's agency
     * @returns {Promise<Array>} - Array of service alert objects
     */
    getAll: async () => {
        try {
            const response = await apiClient.get('/service-alerts');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching service alerts:', error);
            throw error;
        }
    },

    /**
     * Get a specific service alert by ID
     * @param {string} id - The ID of the service alert
     * @returns {Promise<Object>} - Service alert object
     */
    getById: async (id) => {
        try {
            const response = await apiClient.get(`/service-alerts/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching service alert:', error);
            throw error;
        }
    },

    /**
     * Get all service alerts for a specific car
     * @param {string} carId - The ID of the car
     * @returns {Promise<Array>} - Array of service alert objects
     */
    getByCarId: async (carId) => {
        try {
            const response = await apiClient.get(`/service-alerts/car/${carId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching service alerts for car:', error);
            throw error;
        }
    },

    /**
     * Create a new service alert
     * @param {Object} alertData - The service alert data
     * @returns {Promise<Object>} - The created service alert object
     */
    create: async (alertData) => {
        try {
            const response = await apiClient.post('/service-alerts', alertData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating service alert:', error);
            throw error;
        }
    },

    /**
     * Update an existing service alert
     * @param {string} id - The ID of the service alert
     * @param {Object} alertData - The updated service alert data
     * @returns {Promise<Object>} - The updated service alert object
     */
    update: async (id, alertData) => {
        try {
            const response = await apiClient.put(`/service-alerts/${id}`, alertData);
            return response.data;
        } catch (error) {
            console.error('❌ Error updating service alert:', error);
            throw error;
        }
    },

    /**
     * Mark a service alert as resolved
     * @param {string} id - The ID of the service alert
     * @param {Object} resolveData - Optional notes for resolution
     * @returns {Promise<void>}
     */
    resolve: async (id, resolveData = {}) => {
        try {
            await apiClient.post(`/service-alerts/${id}/resolve`, resolveData);
        } catch (error) {
            console.error('❌ Error resolving service alert:', error);
            throw error;
        }
    },

    /**
     * Delete a service alert
     * @param {string} id - The ID of the service alert
     * @returns {Promise<void>}
     */
    delete: async (id) => {
        try {
            await apiClient.delete(`/service-alerts/${id}`);
        } catch (error) {
            console.error('❌ Error deleting service alert:', error);
            throw error;
        }
    },

    /**
     * Generate periodic service alerts for all cars in the agency
     * @returns {Promise<Object>} - Result with count of alerts created
     */
    generatePeriodicAlerts: async () => {
        try {
            const response = await apiClient.post('/service-alerts/generate-periodic');
            return response.data;
        } catch (error) {
            console.error('❌ Error generating periodic alerts:', error);
            throw error;
        }
    },

    /**
     * Get formatted alert type options for forms
     * @returns {Array} - Array of alert type options
     */
    getAlertTypeOptions: () => {
        return [
            { value: 1, label: 'Oil Change', description: 'Engine oil and filter replacement' },
            { value: 2, label: 'Brake Inspection', description: 'Brake system inspection and service' },
            { value: 3, label: 'Tire Rotation', description: 'Tire rotation and pressure check' },
            { value: 4, label: 'Fluid Check', description: 'Fluid levels check and top-up' },
            { value: 5, label: 'Drain Service', description: 'Coolant system drain and refill' },
            { value: 10, label: 'Other', description: 'Other maintenance service' }
        ];
    },

    /**
     * Get alert type name by value
     * @param {number} alertType - The alert type enum value
     * @returns {string} - Human-readable alert type name
     */
    getAlertTypeName: (alertType) => {
        const options = serviceAlertService.getAlertTypeOptions();
        const option = options.find(opt => opt.value === alertType);
        return option ? option.label : 'Unknown';
    },

    /**
     * Get alert priority level for styling/sorting
     * @param {Object} alert - The service alert object
     * @returns {string} - Priority level: 'critical', 'high', 'medium', 'low'
     */
    getAlertPriority: (alert) => {
        if (alert.isOverdue) {
            return 'critical';
        }
        
        if (alert.daysUntilDue <= 3) {
            return 'high';
        }
        
        if (alert.daysUntilDue <= 7) {
            return 'medium';
        }
        
        return 'low';
    },

    /**
     * Get alert status information for display
     * @param {Object} alert - The service alert object
     * @returns {Object} - Status info with text, class, and color
     */
    getAlertStatus: (alert) => {
        if (alert.isResolved) {
            return {
                text: 'Resolved',
                class: 'status-resolved',
                color: 'success'
            };
        }

        if (alert.isOverdue) {
            return {
                text: 'Overdue',
                class: 'status-overdue',
                color: 'danger'
            };
        }

        if (alert.daysUntilDue <= 7) {
            return {
                text: 'Due Soon',
                class: 'status-due-soon',
                color: 'warning'
            };
        }

        return {
            text: 'Scheduled',
            class: 'status-scheduled',
            color: 'info'
        };
    },

    /**
     * Format due date for display
     * @param {string} dueDate - ISO date string
     * @returns {string} - Formatted date string
     */
    formatDueDate: (dueDate) => {
        try {
            const date = new Date(dueDate);
            const now = new Date();
            const diffTime = date - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
            }

            if (diffDays === 0) {
                return 'Due today';
            }

            if (diffDays === 1) {
                return 'Due tomorrow';
            }

            if (diffDays <= 7) {
                return `Due in ${diffDays} days`;
            }

            return date.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting due date:', error);
            return dueDate;
        }
    },

    /**
     * Filter alerts by status
     * @param {Array} alerts - Array of service alerts
     * @param {string} status - Status to filter by: 'all', 'active', 'overdue', 'due-soon', 'resolved'
     * @returns {Array} - Filtered array of alerts
     */
    filterByStatus: (alerts, status) => {
        if (!Array.isArray(alerts)) return [];

        switch (status) {
            case 'active':
                return alerts.filter(alert => !alert.isResolved);
            case 'overdue':
                return alerts.filter(alert => !alert.isResolved && alert.isOverdue);
            case 'due-soon':
                return alerts.filter(alert => !alert.isResolved && !alert.isOverdue && alert.daysUntilDue <= 7);
            case 'resolved':
                return alerts.filter(alert => alert.isResolved);
            case 'all':
            default:
                return alerts;
        }
    },

    /**
     * Sort alerts by priority and due date
     * @param {Array} alerts - Array of service alerts
     * @returns {Array} - Sorted array of alerts
     */
    sortByPriority: (alerts) => {
        if (!Array.isArray(alerts)) return [];

        return [...alerts].sort((a, b) => {
            // Resolved alerts go to the bottom
            if (a.isResolved !== b.isResolved) {
                return a.isResolved ? 1 : -1;
            }

            // Among active alerts, sort by overdue status first
            if (!a.isResolved && !b.isResolved) {
                if (a.isOverdue !== b.isOverdue) {
                    return a.isOverdue ? -1 : 1;
                }

                // Then by due date (earliest first)
                return new Date(a.dueDate) - new Date(b.dueDate);
            }

            // Among resolved alerts, sort by resolved date (most recent first)
            if (a.isResolved && b.isResolved) {
                return new Date(b.resolvedDate || 0) - new Date(a.resolvedDate || 0);
            }

            return 0;
        });
    }
};

export default serviceAlertService;