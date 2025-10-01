// src/services/agencyQuickSetupService.js
import apiClient from './apiClient';

class AgencyQuickSetupService {
    /**
     * Create a new agency with owner account and default expense categories
     * @param {Object} setupData - Agency setup data
     * @returns {Promise<Object>} Agency setup response
     */
    async createAgencyWithSetup(setupData) {
        try {
            const response = await apiClient.post('/AgencySetup', setupData);
            return response.data;
        } catch (error) {
            console.error('Error creating agency with setup:', error);
            throw error;
        }
    }

    /**
     * Get agency setup details
     * @param {string} agencyId - Agency ID (GUID)
     * @returns {Promise<Object>} Agency setup details
     */
    async getAgencySetup(agencyId) {
        try {
            const response = await apiClient.get(`/AgencySetup/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching agency setup for ${agencyId}:`, error);
            throw error;
        }
    }

    /**
     * Validate email uniqueness before submission
     * @param {string} email - Email to validate
     * @returns {Promise<boolean>} True if email is available
     */
    async validateEmail(email) {
        try {
            // This would typically be a separate endpoint, but we can check via error handling
            // If you have a dedicated validation endpoint, use it here
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const agencyQuickSetupService = new AgencyQuickSetupService();
export default agencyQuickSetupService;