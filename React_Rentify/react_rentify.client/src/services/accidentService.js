// src/services/accidentService.js
import apiClient from './apiClient';

/**
 * Service for managing accidents and related data
 */
const accidentService = {
    // ========================
    // === Accident CRUD
    // ========================

    /**
     * Get all accidents (Admin only)
     * @returns {Promise<Array>} - Array of accident objects
     */
    getAll: async () => {
        try {
            const response = await apiClient.get('/accidents');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all accidents:', error);
            throw error;
        }
    },

    /**
     * Get accident by ID
     * @param {string} id - The accident ID
     * @returns {Promise<Object>} - Accident object
     */
    getById: async (id) => {
        try {
            const response = await apiClient.get(`/accidents/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching accident ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get all accidents for a specific agency
     * @param {string} agencyId - The agency ID
     * @returns {Promise<Array>} - Array of accident objects
     */
    getByAgencyId: async (agencyId) => {
        try {
            const response = await apiClient.get(`/accidents/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching accidents for agency ${agencyId}:`, error);
            throw error;
        }
    },

    /**
     * Get all accidents for a specific car
     * @param {string} carId - The car ID
     * @returns {Promise<Array>} - Array of accident objects
     */
    getByCarId: async (carId) => {
        try {
            const response = await apiClient.get(`/accidents/car/${carId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching accidents for car ${carId}:`, error);
            throw error;
        }
    },

    /**
     * Create a new accident
     * @param {Object} accidentData - The accident data
     * @returns {Promise<Object>} - Created accident object
     */
    create: async (accidentData) => {
        try {
            const response = await apiClient.post('/accidents', accidentData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating accident:', error);
            throw error;
        }
    },

    /**
     * Update an existing accident
     * @param {string} id - The accident ID
     * @param {Object} accidentData - Updated accident data
     * @returns {Promise<Object>} - Updated accident object
     */
    update: async (id, accidentData) => {
        try {
            const response = await apiClient.put(`/accidents/${id}`, accidentData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating accident ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete an accident (Owner role required)
     * @param {string} id - The accident ID
     * @returns {Promise<void>}
     */
    delete: async (id) => {
        try {
            await apiClient.delete(`/accidents/${id}`);
        } catch (error) {
            console.error(`❌ Error deleting accident ${id}:`, error);
            throw error;
        }
    },

    // ========================
    // === Expense Management
    // ========================

    /**
     * Get all expenses for an accident
     * @param {string} accidentId - The accident ID
     * @returns {Promise<Array>} - Array of expense objects
     */
    getExpenses: async (accidentId) => {
        try {
            const response = await apiClient.get(`/accidents/${accidentId}/expenses`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching expenses for accident ${accidentId}:`, error);
            throw error;
        }
    },

    /**
     * Add an expense to an accident
     * @param {string} accidentId - The accident ID
     * @param {string} name - Expense name
     * @param {number} amount - Expense amount
     * @param {File} file - Optional file attachment
     * @returns {Promise<Object>} - Created expense object
     */
    addExpense: async (accidentId, name, amount, file = null) => {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('amount', amount);

            if (file) {
                formData.append('file', file);
            }

            const response = await apiClient.post(
                `/accidents/${accidentId}/expenses`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error(`❌ Error adding expense to accident ${accidentId}:`, error);
            throw error;
        }
    },

    /**
     * Delete an expense from an accident
     * @param {string} accidentId - The accident ID
     * @param {string} expenseId - The expense ID
     * @returns {Promise<void>}
     */
    deleteExpense: async (accidentId, expenseId) => {
        try {
            await apiClient.delete(`/accidents/${accidentId}/expenses/${expenseId}`);
        } catch (error) {
            console.error(`❌ Error deleting expense ${expenseId}:`, error);
            throw error;
        }
    },

    // ========================
    // === Refund Management
    // ========================

    /**
     * Get all refunds for an accident
     * @param {string} accidentId - The accident ID
     * @returns {Promise<Array>} - Array of refund objects
     */
    getRefunds: async (accidentId) => {
        try {
            const response = await apiClient.get(`/accidents/${accidentId}/refunds`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching refunds for accident ${accidentId}:`, error);
            throw error;
        }
    },

    /**
     * Add a refund to an accident
     * @param {string} accidentId - The accident ID
     * @param {string} name - Refund name
     * @param {number} amount - Refund amount
     * @param {File} file - Optional file attachment
     * @returns {Promise<Object>} - Created refund object
     */
    addRefund: async (accidentId, name, amount, file = null) => {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('amount', amount);

            if (file) {
                formData.append('file', file);
            }

            const response = await apiClient.post(
                `/accidents/${accidentId}/refunds`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error(`❌ Error adding refund to accident ${accidentId}:`, error);
            throw error;
        }
    },

    /**
     * Delete a refund from an accident
     * @param {string} accidentId - The accident ID
     * @param {string} refundId - The refund ID
     * @returns {Promise<void>}
     */
    deleteRefund: async (accidentId, refundId) => {
        try {
            await apiClient.delete(`/accidents/${accidentId}/refunds/${refundId}`);
        } catch (error) {
            console.error(`❌ Error deleting refund ${refundId}:`, error);
            throw error;
        }
    },

    // ========================
    // === Utility Methods
    // ========================

    /**
     * Calculate total cost for an accident (expenses - refunds)
     * @param {Object} accident - Accident object with expenses and refunds
     * @returns {number} - Net cost
     */
    calculateNetCost: (accident) => {
        const totalExpenses = accident.totalExpenses || 0;
        const totalRefunds = accident.totalRefunds || 0;
        return totalExpenses - totalRefunds;
    },

    /**
     * Format accident status for display
     * @param {number} status - Accident status enum value
     * @returns {string} - Formatted status string
     */
    formatStatus: (status) => {
        const statusMap = {
            0: 'Created',
            1: 'Maintenance',
            2: 'Completed'
        };
        return statusMap[status] || 'Unknown';
    },

    /**
     * Get status badge color
     * @param {number} status - Accident status enum value
     * @returns {string} - Color class for badge
     */
    getStatusColor: (status) => {
        const colorMap = {
            0: 'bg-blue-500',      // Created
            1: 'bg-yellow-500',    // Maintenance
            2: 'bg-green-500'      // Completed
        };
        return colorMap[status] || 'bg-gray-500';
    }
};

export default accidentService;