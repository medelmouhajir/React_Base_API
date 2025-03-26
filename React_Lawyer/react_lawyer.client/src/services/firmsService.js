// src/services/firmsService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling law firm-related API calls
 */
class FirmsService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get all active law firms
     * @returns {Promise<Array>} Promise resolving to an array of law firms
     */
    async getLawFirms() {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch law firms');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getLawFirms:', error);
            throw error;
        }
    }

    /**
     * Get law firm by ID
     * @param {number} id - The law firm ID
     * @returns {Promise<Object>} Promise resolving to the law firm object
     */
    async getLawFirmById(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch law firm details');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getLawFirmById(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get detailed information about a law firm
     * @param {number} id - The law firm ID
     * @returns {Promise<Object>} Promise resolving to the detailed law firm object
     */
    async getLawFirmDetails(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}/details`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch law firm detailed information');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getLawFirmDetails(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get statistics for a law firm
     * @param {number} id - The law firm ID
     * @returns {Promise<Object>} Promise resolving to the law firm statistics
     */
    async getLawFirmStatistics(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}/statistics`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch law firm statistics');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getLawFirmStatistics(${id}):`, error);
            throw error;
        }
    }

    /**
     * Create a new law firm
     * @param {Object} firmData - Data for the new law firm
     * @returns {Promise<Object>} Promise resolving to the created law firm
     */
    async createLawFirm(firmData) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(firmData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create law firm');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in createLawFirm:', error);
            throw error;
        }
    }

    /**
     * Update an existing law firm
     * @param {number} id - The law firm ID
     * @param {Object} firmData - Updated data for the law firm
     * @returns {Promise<boolean>} Promise resolving to true if update succeeded
     */
    async updateLawFirm(id, firmData) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({ ...firmData, lawFirmId: id })
            });

            if (!response.ok) {
                throw new Error('Failed to update law firm');
            }

            return true;
        } catch (error) {
            console.error(`Error in updateLawFirm(${id}):`, error);
            throw error;
        }
    }

    /**
     * Delete (deactivate) a law firm
     * @param {number} id - The law firm ID
     * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded
     */
    async deleteLawFirm(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to delete law firm');
            }

            return true;
        } catch (error) {
            console.error(`Error in deleteLawFirm(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get lawyers by firm ID
     * @param {number} id - The law firm ID
     * @returns {Promise<Array>} Promise resolving to an array of lawyers
     */
    async getFirmLawyers(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}/lawyers`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch firm lawyers');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getFirmLawyers(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get secretaries by firm ID
     * @param {number} id - The law firm ID
     * @returns {Promise<Array>} Promise resolving to an array of secretaries
     */
    async getFirmSecretaries(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}/secretaries`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch firm secretaries');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getFirmSecretaries(${id}):`, error);
            throw error;
        }
    }

    /**
     * Add a lawyer to a firm
     * @param {number} firmId - The law firm ID
     * @param {Object} lawyerData - Data for the new lawyer
     * @returns {Promise<Object>} Promise resolving to the created lawyer
     */
    async addLawyer(firmId, lawyerData) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${firmId}/lawyers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(lawyerData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add lawyer to firm');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in addLawyer(${firmId}):`, error);
            throw error;
        }
    }

    /**
     * Add a secretary to a firm
     * @param {number} firmId - The law firm ID
     * @param {Object} secretaryData - Data for the new secretary
     * @returns {Promise<Object>} Promise resolving to the created secretary
     */
    async addSecretary(firmId, secretaryData) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${firmId}/secretaries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(secretaryData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add secretary to firm');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in addSecretary(${firmId}):`, error);
            throw error;
        }
    }

    /**
     * Get clients by firm ID
     * @param {number} id - The law firm ID
     * @returns {Promise<Array>} Promise resolving to an array of clients
     */
    async getFirmClients(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}/clients`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch firm clients');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getFirmClients(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get cases by firm ID
     * @param {number} id - The law firm ID
     * @returns {Promise<Array>} Promise resolving to an array of cases
     */
    async getFirmCases(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawfirms/${id}/cases`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch firm cases');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getFirmCases(${id}):`, error);
            throw error;
        }
    }
}

export default new FirmsService();