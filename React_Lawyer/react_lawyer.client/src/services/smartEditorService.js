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
     * Get templates by category
     * @param {string} category - Category to filter by
     * @returns {Promise<Array>} - Promise resolving to array of templates
     */
    async getTemplatesByCategory(category) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/templates/category/${encodeURIComponent(category)}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch templates by category');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching templates for category ${category}:`, error);
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
     * Save a document draft
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
     * @param {Object} documentData - Document data to analyze
     * @returns {Promise<Array>} - Promise resolving to array of suggestions
     */
    async getAISuggestions(documentData) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/ai/suggestions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(documentData)
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
     * Get specialized legal document generation using AI
     * @param {Object} generationData - Document generation data
     * @returns {Promise<Object>} - Promise resolving to generated document
     */
    async generateDocumentWithAI(generationData) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/ai/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(generationData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate document with AI');
            }

            return await response.json();
        } catch (error) {
            console.error('Error generating document with AI:', error);
            throw error;
        }
    }

    /**
     * Save document version
     * @param {string} documentId - Document ID
     * @param {Object} versionData - Version data
     * @returns {Promise<Object>} - Promise resolving to saved version
     */
    async saveDocumentVersion(documentId, versionData) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${documentId}/versions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(versionData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save document version');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error saving version for document ${documentId}:`, error);
            throw error;
        }
    }

    /**
     * Get document versions
     * @param {string} documentId - Document ID
     * @returns {Promise<Array>} - Promise resolving to array of versions
     */
    async getDocumentVersions(documentId) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${documentId}/versions`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch document versions');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching versions for document ${documentId}:`, error);
            throw error;
        }
    }
}

export default new SmartEditorService();