// src/services/customerAttachmentService.js
import apiClient from './apiClient';

/**
 * Service for managing customer attachments
 */
const customerAttachmentService = {
    /**
     * Get all attachments for a specific customer
     * @param {string} customerId - The ID of the customer
     * @returns {Promise<Array>} - Array of attachment objects
     */
    getByCustomerId: async (customerId) => {
        try {
            const response = await apiClient.get(`/customers/${customerId}/attachments`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching customer attachments:', error);
            throw error;
        }
    },

    /**
     * Add a new attachment to a customer
     * @param {string} customerId - The ID of the customer
     * @param {Object} attachmentData - The attachment data
     * @returns {Promise<Object>} - The created attachment object
     */
    addAttachment: async (customerId, attachmentData) => {
        try {
            const response = await apiClient.post(
                `/customers/${customerId}/attachments`,
                attachmentData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('❌ Error adding customer attachment:', error);
            throw error;
        }
    },

    /**
     * Delete an attachment from a customer
     * @param {string} customerId - The ID of the customer
     * @param {string} attachmentId - The ID of the attachment to delete
     * @returns {Promise<void>}
     */
    deleteAttachment: async (customerId, attachmentId) => {
        try {
            await apiClient.delete(
                `/customers/${customerId}/attachments/${attachmentId}`
            );
        } catch (error) {
            console.error('❌ Error deleting customer attachment:', error);
            throw error;
        }
    },

    /**
     * Upload a file to the server and create an attachment
     * @param {string} customerId - The ID of the customer
     * @param {File} file - The file to upload
     * @param {string} fileName - Optional custom file name
     * @returns {Promise<Object>} - The created attachment object
     */
    uploadFile: async (customerId, file, fileName = null) => {
        try {
            // Create form data for file upload
            const formData = new FormData();
            formData.append('file', file);
            if (fileName) {
                formData.append('fileName', fileName);
            }

            // Upload the file
            const response = await apiClient.post(
                `/customers/${customerId}/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Error uploading customer file:', error);
            throw error;
        }
    },

    /**
     * Get a specific attachment by ID
     * @param {string} customerId - The ID of the customer
     * @param {string} attachmentId - The ID of the attachment
     * @returns {Promise<Object>} - The attachment object
     */
    getAttachmentById: async (customerId, attachmentId) => {
        try {
            const response = await apiClient.get(
                `/customers/${customerId}/attachments/${attachmentId}`
            );
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching customer attachment:', error);
            throw error;
        }
    },

    /**
     * Update attachment information
     * @param {string} customerId - The ID of the customer
     * @param {string} attachmentId - The ID of the attachment
     * @param {Object} updateData - The data to update
     * @returns {Promise<Object>} - The updated attachment object
     */
    updateAttachment: async (customerId, attachmentId, updateData) => {
        try {
            const response = await apiClient.put(
                `/customers/${customerId}/attachments/${attachmentId}`,
                updateData
            );
            return response.data;
        } catch (error) {
            console.error('❌ Error updating customer attachment:', error);
            throw error;
        }
    }
};

export default customerAttachmentService;