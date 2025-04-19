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
            console.log('Saving document data:', documentData); // Debugging line
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
     * Get recent documents
     * @param {number} limit - Maximum number of documents to return (default: 10)
     * @returns {Promise<Array>} - Promise resolving to array of recent documents
     */
    async getRecentDocuments(limit = 10) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/recent?limit=${limit}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch recent documents');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching recent documents:', error);
            throw error;
        }
    }

    /**
     * Get document versions
     * @param {string} id - Document ID
     * @returns {Promise<Array>} - Promise resolving to array of document versions
     */
    async getDocumentVersions(id) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${id}/versions`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch document versions');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching versions for document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get a specific document version
     * @param {string} id - Document ID
     * @param {string} versionId - Version ID
     * @returns {Promise<Object>} - Promise resolving to document version
     */
    async getDocumentVersion(id, versionId) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${id}/versions/${versionId}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch document version');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching version ${versionId} for document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Compare two document versions
     * @param {string} id - Document ID
     * @param {string} version1 - First version ID
     * @param {string} version2 - Second version ID (optional, defaults to latest)
     * @returns {Promise<Object>} - Promise resolving to comparison result
     */
    async compareDocumentVersions(id, version1, version2 = 'latest') {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${id}/compare?v1=${version1}&v2=${version2}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to compare document versions');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error comparing versions for document ${id}:`, error);
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

    /**
     * Star or unstar a document (bookmark)
     * @param {string} id - Document ID
     * @param {boolean} starred - Whether to star or unstar
     * @returns {Promise<boolean>} - Promise resolving to success boolean
     */
    async toggleDocumentStar(id, starred) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${id}/star`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ starred })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update star status');
            }

            return true;
        } catch (error) {
            console.error(`Error updating star status for document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get starred documents
     * @returns {Promise<Array>} - Promise resolving to array of starred documents
     */
    async getStarredDocuments() {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/starred`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch starred documents');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching starred documents:', error);
            throw error;
        }
    }

    /**
     * Get documents by case ID
     * @param {number} caseId - Case ID
     * @returns {Promise<Array>} - Promise resolving to array of documents
     */
    async getDocumentsByCase(caseId) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/bycase/${caseId}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch case documents');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching documents for case ${caseId}:`, error);
            throw error;
        }
    }

    /**
     * Get documents by client ID
     * @param {number} clientId - Client ID
     * @returns {Promise<Array>} - Promise resolving to array of documents
     */
    async getDocumentsByClient(clientId) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/byclient/${clientId}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch client documents');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching documents for client ${clientId}:`, error);
            throw error;
        }
    }

    /**
     * Search documents
     * @param {string} query - Search query
     * @returns {Promise<Array>} - Promise resolving to array of documents
     */
    async searchDocuments(query) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/search?q=${encodeURIComponent(query)}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to search documents');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error searching documents with query "${query}":`, error);
            throw error;
        }
    }

    /**
     * Create a copy of a document
     * @param {string} id - Document ID to copy
     * @param {string} newTitle - Title for the new document
     * @returns {Promise<Object>} - Promise resolving to the new document
     */
    async copyDocument(id, newTitle) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${id}/copy`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: newTitle })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to copy document');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error copying document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Move document to a different case
     * @param {string} id - Document ID
     * @param {number} caseId - New case ID
     * @returns {Promise<Object>} - Promise resolving to updated document
     */
    async moveDocumentToCase(id, caseId) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${id}/move`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ caseId })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to move document');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error moving document ${id} to case ${caseId}:`, error);
            throw error;
        }
    }

    /**
     * Share document with specific users
     * @param {string} id - Document ID
     * @param {Array<number>} userIds - Array of user IDs to share with
     * @returns {Promise<boolean>} - Promise resolving to success boolean
     */
    async shareDocumentWithUsers(id, userIds) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${id}/share`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userIds })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to share document');
            }

            return true;
        } catch (error) {
            console.error(`Error sharing document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get document collaborators
     * @param {string} id - Document ID
     * @returns {Promise<Array>} - Promise resolving to array of collaborators
     */
    async getDocumentCollaborators(id) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/smart-editor/documents/${id}/collaborators`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch collaborators');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching collaborators for document ${id}:`, error);
            throw error;
        }
    }

    /**
     * Generate document outline from content
     * @param {string} content - Document HTML content
     * @returns {Array} - Array of headings with level and text
     */
    generateDocumentOutline(content) {
        if (!content) return [];

        // Create a DOM parser to extract headings
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');

        // Find all heading elements
        const headings = [];
        const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

        headingElements.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));
            headings.push({
                id: `heading-${index}`,
                text: heading.textContent,
                level: level
            });
        });

        return headings;
    }
}

export default new SmartEditorService();