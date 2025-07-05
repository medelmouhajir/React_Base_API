// src/services/carAttachmentService.js
import apiClient from './apiClient';


/**
 * Service for managing car attachments
 */
const carAttachmentService = {
    /**
     * Get all attachments for a specific car
     * @param {string} carId - The ID of the car
     * @returns {Promise<Array>} - Array of attachment objects
     */
    getByCarId: async (carId) => {
        try {
            const response = await apiClient.get(`/cars/${carId}/attachments`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching car attachments:', error);
            throw error;
        }
    },

    /**
     * Add a new attachment to a car
     * @param {string} carId - The ID of the car
     * @param {Object} attachmentData - The attachment data (fileName, filePath)
     * @returns {Promise<Object>} - The created attachment object
     */
    addAttachment: async (carId, attachmentData) => {
        try {
            const response = await apiClient.post(
                `/cars/${carId}/attachments`,
                attachmentData
            );
            return response.data;
        } catch (error) {
            console.error('❌ Error adding car attachment:', error);
            throw error;
        }
    },

    /**
     * Delete an attachment from a car
     * @param {string} carId - The ID of the car
     * @param {string} attachmentId - The ID of the attachment to delete
     * @returns {Promise<void>}
     */
    deleteAttachment: async (carId, attachmentId) => {
        try {
            await apiClient.delete(
                `/cars/${carId}/attachments/${attachmentId}`
            );
        } catch (error) {
            console.error('❌ Error deleting car attachment:', error);
            throw error;
        }
    },

    /**
     * Upload a file to the server and create an attachment
     * @param {string} carId - The ID of the car
     * @param {File} file - The file to upload
     * @returns {Promise<Object>} - The created attachment object
     */
    uploadFile: async (carId, file) => {
        try {
            // Create form data for file upload
            const formData = new FormData();
            formData.append('file', file);

            // Upload the file
            const response = await apiClient.post(
                `/cars/${carId}/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Error uploading file:', error);
            throw error;
        }
    }
};

export default carAttachmentService;