// src/services/smartEditorService.js
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling smart editor related API calls
 */
class SmartEditorService {
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
     * Get all available templates for the smart editor
     * @returns {Promise<Array>} - Promise resolving to array of templates
     */
    async getTemplates() {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/smart-editor/templates`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch templates');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching smart editor templates:', error);
            throw error;
        }
    }

    /**
     * Get a specific template by ID
     * @param {string} id - Template ID
     * @returns {Promise<Object>} - Promise resolving to template object
     */
    async getTemplateById(id) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/smart-editor/templates/${id}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch template');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching template ${id}:`, error);
            throw error;
        }
    }

    /**
     * Save a document 
     * @param {Object} documentData - Document data to save
     * @returns {Promise<Object>} - Promise resolving to saved document
     */
    async saveDocument(documentData) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/smart-editor/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(documentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save document');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving document:', error);
            throw error;
        }
    }

    /**
     * Update an existing document
     * @param {string} id - Document ID
     * @param {Object} documentData - Updated document data
     * @returns {Promise<Object>} - Promise resolving to updated document
     */
    async updateDocument(id, documentData) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/smart-editor/documents/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(documentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update document');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error updating document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get a document by ID
     * @param {string} id - Document ID
     * @returns {Promise<Object>} - Promise resolving to document object
     */
    async getDocumentById(id) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/smart-editor/documents/${id}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch document');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Export a document to a specific format
     * @param {Object} exportData - Document export data
     * @returns {Promise<Blob>} - Promise resolving to document blob
     */
    async exportDocument(exportData) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/export`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(exportData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to export document');
            }

            return await response.blob();
        } catch (error) {
            console.error('Error exporting document:', error);
            throw error;
        }
    }

    /**
     * Get AI suggestions for document content
     * @param {string} content - Document content to analyze
     * @returns {Promise<Array>} - Promise resolving to array of suggestions
     */
    async getAISuggestions(content) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/ai/suggestions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get AI suggestions');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            throw error;
        }
    }

    /**
     * Generate text from prompt using AI
     * @param {string} prompt - Prompt for AI generation
     * @returns {Promise<string>} - Promise resolving to generated text
     */
    async generateCompletion(prompt) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/ai/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate AI completion');
            }

            const result = await response.json();
            return result.completion;
        } catch (error) {
            console.error('Error generating AI completion:', error);
            throw error;
        }
    }
}

export default new SmartEditorService();