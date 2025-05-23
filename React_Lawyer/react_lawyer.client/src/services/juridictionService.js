// src/services/juridictionService.js
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling jurisdiction-related API calls
 */
class JuridictionService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        return authService.authHeader();
    }

    /**
     * Helper method for making authenticated API requests
     * @param {string} url - API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise} - Promise with response
     */
    async fetchWithAuth(url, options = {}) {
        return authService.fetchWithAuth(url, {
            ...options,
            headers: {
                ...options.headers,
                ...this.getAuthHeader()
            }
        });
    }

    /**
     * Helper method to handle API responses
     * @param {Response} response - Fetch response object
     * @param {string} url - API URL for logging
     * @returns {Promise} - Promise with JSON data
     */
    async handleResponse(response, url) {
        console.log(`API Response [${response.status}]:`, url);

        if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `Server error: ${response.status}`;

            try {
                const contentType = response.headers.get('content-type');

                // Check if response is JSON
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    console.error('Error response:', errorData);

                    // Extract error message from different possible formats
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.errors) {
                        // Handle validation errors
                        const validationErrors = Object.values(errorData.errors).flat();
                        errorMessage = validationErrors.join(', ');
                    } else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    }
                } else {
                    // If not JSON, try to get text content
                    const text = await response.text();
                    if (text) {
                        console.error('Non-JSON error response:', text.substring(0, 500));

                        // Try to extract error from HTML response
                        const titleMatch = text.match(/<title>(.*?)<\/title>/);
                        if (titleMatch && titleMatch[1]) {
                            errorMessage = titleMatch[1];
                        }
                    }
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    }

    /**
     * Get all jurisdictions
     * @returns {Promise<Array>} - Promise resolving to array of jurisdictions
     */
    async getJuridictions() {
        try {
            const url = `${API_URL}/api/juridictions`;
            console.log('Fetching all jurisdictions');

            const response = await this.fetchWithAuth(url);
            return this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in getJuridictions:', error);
            throw error;
        }
    }

    /**
     * Get jurisdiction by ID
     * @param {number} id - Jurisdiction ID
     * @returns {Promise<Object>} - Promise resolving to jurisdiction object
     */
    async getJuridictionById(id) {
        try {
            const url = `${API_URL}/api/juridictions/${id}`;
            console.log(`Fetching jurisdiction with ID ${id}`);

            const response = await this.fetchWithAuth(url);
            return this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getJuridictionById(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get jurisdiction by code
     * @param {string} code - Jurisdiction code
     * @returns {Promise<Object>} - Promise resolving to jurisdiction object
     */
    async getJuridictionByCode(code) {
        try {
            const url = `${API_URL}/api/juridictions/bycode/${encodeURIComponent(code)}`;
            console.log(`Fetching jurisdiction with code ${code}`);

            const response = await this.fetchWithAuth(url);
            return this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getJuridictionByCode("${code}"):`, error);
            throw error;
        }
    }

    /**
     * Search jurisdictions
     * @param {string} term - Search term
     * @returns {Promise<Array>} - Promise resolving to array of matching jurisdictions
     */
    async searchJuridictions(term) {
        try {
            const url = `${API_URL}/api/juridictions/search?term=${encodeURIComponent(term)}`;
            console.log(`Searching jurisdictions with term "${term}"`);

            const response = await this.fetchWithAuth(url);
            return this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in searchJuridictions("${term}"):`, error);
            throw error;
        }
    }

    /**
     * Create a new jurisdiction
     * @param {Object} juridictionData - Jurisdiction data
     * @returns {Promise<Object>} - Promise resolving to created jurisdiction
     */
    async createJuridiction(juridictionData) {
        try {
            const url = `${API_URL}/api/juridictions`;
            console.log('Creating new jurisdiction with data:', juridictionData);

            const response = await this.fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(juridictionData)
            });

            return this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in createJuridiction:', error);
            throw error;
        }
    }

    /**
     * Update an existing jurisdiction
     * @param {number} id - Jurisdiction ID
     * @param {Object} juridictionData - Updated jurisdiction data
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    async updateJuridiction(id, juridictionData) {
        try {
            const url = `${API_URL}/api/juridictions/${id}`;
            console.log(`Updating jurisdiction with ID ${id} with data:`, juridictionData);

            const response = await this.fetchWithAuth(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...juridictionData, id })
            });

            if (!response.ok) {
                await this.handleResponse(response, url);
                return false;
            }

            return true;
        } catch (error) {
            console.error(`Error in updateJuridiction(${id}):`, error);
            throw error;
        }
    }

    /**
     * Delete a jurisdiction
     * @param {number} id - Jurisdiction ID
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    async deleteJuridiction(id) {
        try {
            const url = `${API_URL}/api/juridictions/${id}`;
            console.log(`Deleting jurisdiction with ID ${id}`);

            const response = await this.fetchWithAuth(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                await this.handleResponse(response, url);
                return false;
            }

            return true;
        } catch (error) {
            console.error(`Error in deleteJuridiction(${id}):`, error);
            throw error;
        }
    }
}

export default new JuridictionService();