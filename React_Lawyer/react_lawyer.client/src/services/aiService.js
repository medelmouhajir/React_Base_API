// src/services/aiService.js
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling AI assistant related API calls
 */
class AIService {
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
     * Check document for spelling and syntax errors
     * @param {string} content - Document content to check
     * @param {string} language - Language of the document (default: 'en')
     * @returns {Promise<Array>} - Promise resolving to array of suggestions
     */
    async checkSpellingAndSyntax(content, language = 'en') {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/ai-assistant/check-spelling`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, language })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to check spelling and syntax');
            }

            return await response.json();
        } catch (error) {
            console.error('Error checking spelling and syntax:', error);
            throw error;
        }
    }

    /**
     * Get suggestions for more elegant phrasing
     * @param {string} content - Document content to enhance
     * @param {string} language - Language of the document (default: 'en')
     * @returns {Promise<Array>} - Promise resolving to array of suggestions
     */
    async getElegantPhrasing(content, language = 'en') {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/ai-assistant/elegant-phrasing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, language })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get elegant phrasing suggestions');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting elegant phrasing suggestions:', error);
            throw error;
        }
    }

    /**
     * Translate document content to a different language
     * @param {string} content - Document content to translate
     * @param {string} targetLanguage - Target language code (e.g., 'fr')
     * @returns {Promise<Object>} - Promise resolving to translation response
     */
    async translateDocument(content, targetLanguage) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/ai-assistant/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, targetLanguage })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to translate document');
            }

            return await response.json();
        } catch (error) {
            console.error('Error translating document:', error);
            throw error;
        }
    }

    /**
     * Summarize document content
     * @param {string} content - Document content to summarize
     * @param {number} maxLength - Maximum length of summary in words (optional)
     * @returns {Promise<Object>} - Promise resolving to summary response
     */
    async summarizeDocument(content, maxLength = 300) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/ai-assistant/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, maxLength })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to summarize document');
            }

            return await response.json();
        } catch (error) {
            console.error('Error summarizing document:', error);
            throw error;
        }
    }

    /**
     * Get client data for AI assistant
     * @param {number} clientId - Client ID
     * @returns {Promise<Object>} - Promise resolving to client data
     */
    async getClientData(clientId) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/ai-assistant/client-data/${clientId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get client data');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting client data for ID ${clientId}:`, error);
            throw error;
        }
    }

    /**
     * Get case data for AI assistant
     * @param {number} caseId - Case ID
     * @returns {Promise<Object>} - Promise resolving to case data
     */
    async getCaseData(caseId) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/ai-assistant/case-data/${caseId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get case data');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting case data for ID ${caseId}:`, error);
            throw error;
        }
    }

    /**
     * Get suggestions for integrating client/case information
     * @param {string} content - Document content
     * @param {number} clientId - Client ID (optional)
     * @param {number} caseId - Case ID (optional)
     * @returns {Promise<Array>} - Promise resolving to array of suggestions
     */
    async suggestInfoIntegration(content, clientId = null, caseId = null) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/ai-assistant/suggest-info-integration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, clientId, caseId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get info integration suggestions');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting info integration suggestions:', error);
            throw error;
        }
    }

    /**
     * Generate AI completion based on prompt
     * @param {string} prompt - User prompt
     * @returns {Promise<Object>} - Promise resolving to completion response
     */
    async generateCompletion(prompt) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/ai-assistant/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate AI completion');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error generating AI completion:', error);
            throw error;
        }
    }
}

export default new AIService();