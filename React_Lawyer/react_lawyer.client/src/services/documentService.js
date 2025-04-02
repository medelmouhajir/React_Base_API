// src/services/documentService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling document-related API calls
 */
class DocumentService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get all documents (both regular documents and templates)
     * @returns {Promise<Array>} Promise resolving to array of documents
     */
    async getAllDocuments() {
        try {
            const response = await fetch(`${API_URL}/api/documents`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch documents');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getAllDocuments:', error);
            throw error;
        }
    }

    /**
     * Get only regular documents (not templates)
     * @returns {Promise<Array>} Promise resolving to array of documents
     */
    async getDocuments() {
        try {
            const response = await fetch(`${API_URL}/api/documents/regular`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch regular documents');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getDocuments:', error);
            throw error;
        }
    }

    /**
     * Get only template documents
     * @returns {Promise<Array>} Promise resolving to array of template documents
     */
    async getTemplates() {
        try {
            const response = await fetch(`${API_URL}/api/documents/templates`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getTemplates:', error);
            throw error;
        }
    }

    /**
     * Get documents by case ID
     * @param {number} caseId - The case ID
     * @returns {Promise<Array>} Promise resolving to array of documents
     */
    async getDocumentsByCase(caseId) {
        try {
            const response = await fetch(`${API_URL}/api/documents/bycase/${caseId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch case documents');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getDocumentsByCase(${caseId}):`, error);
            throw error;
        }
    }

    /**
     * Get document by ID
     * @param {number} id - The document ID
     * @returns {Promise<Object>} Promise resolving to document object
     */
    async getDocumentById(id) {
        try {
            const response = await fetch(`${API_URL}/api/documents/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch document details');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getDocumentById(${id}):`, error);
            throw error;
        }
    }

    /**
     * Upload a new document
     * @param {FormData} formData - Form data with file and document metadata
     * @returns {Promise<Object>} Promise resolving to created document
     */
    async uploadDocument(formData) {
        try {
            const response = await fetch(`${API_URL}/api/documents/upload`, {
                method: 'POST',
                headers: this.getAuthHeader(), // Don't set Content-Type, let browser set it with boundary
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload document');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in uploadDocument:', error);
            throw error;
        }
    }

    /**
     * Update document metadata
     * @param {number} id - The document ID
     * @param {Object} documentData - Updated document metadata
     * @returns {Promise<Object>} Promise resolving to updated document
     */
    async updateDocument(id, documentData) {
        try {
            const response = await fetch(`${API_URL}/api/documents/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(documentData)
            });

            if (!response.ok) {
                throw new Error('Failed to update document');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in updateDocument(${id}):`, error);
            throw error;
        }
    }

    /**
     * Delete document
     * @param {number} id - The document ID
     * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded
     */
    async deleteDocument(id) {
        try {
            const response = await fetch(`${API_URL}/api/documents/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            return true;
        } catch (error) {
            console.error(`Error in deleteDocument(${id}):`, error);
            throw error;
        }
    }

    /**
     * Download document
     * @param {number} id - The document ID
     * @param {string} filename - Suggested filename for download
     * @returns {Promise<void>}
     */
    async downloadDocument(id, filename) {
        try {
            const response = await fetch(`${API_URL}/api/documents/${id}/download`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to download document');
            }

            // Get file extension from Content-Type or Content-Disposition
            let fileExtension = '';
            const contentType = response.headers.get('Content-Type');
            const contentDisposition = response.headers.get('Content-Disposition');

            if (contentDisposition) {
                const match = contentDisposition.match(/filename=[\s\S]*\.([^\s]+)/i);
                if (match) {
                    fileExtension = match[1];
                }
            } else if (contentType) {
                // Map content type to extension
                const mimeTypes = {
                    'application/pdf': '.pdf',
                    'application/msword': '.doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                    'application/vnd.ms-excel': '.xls',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                    'application/vnd.ms-powerpoint': '.ppt',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
                    'text/plain': '.txt',
                    'text/html': '.html',
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/gif': '.gif'
                };
                fileExtension = mimeTypes[contentType] || '';
            }

            // Create blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileExtension && !filename.endsWith(fileExtension)
                ? `${filename}${fileExtension}`
                : filename;

            // Append to body, click, then remove
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(`Error in downloadDocument(${id}):`, error);
            throw error;
        }
    }

    /**
     * Create a new document from template
     * @param {number} templateId - The template document ID
     * @param {Object} documentData - New document metadata
     * @returns {Promise<Object>} Promise resolving to created document
     */
    async createFromTemplate(templateId, documentData) {
        try {
            const response = await fetch(`${API_URL}/api/documents/template/${templateId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(documentData)
            });

            if (!response.ok) {
                throw new Error('Failed to create document from template');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in createFromTemplate(${templateId}):`, error);
            throw error;
        }
    }

    /**
     * Update document version by uploading a new file
     * @param {number} id - The document ID
     * @param {FormData} formData - Form data with file
     * @returns {Promise<Object>} Promise resolving to updated document
     */
    async updateDocumentVersion(id, formData) {
        try {
            const response = await fetch(`${API_URL}/api/documents/${id}/version`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update document version');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in updateDocumentVersion(${id}):`, error);
            throw error;
        }
    }

    /**
     * Share document with client
     * @param {number} id - The document ID
     * @param {boolean} shared - Whether to share or unshare
     * @returns {Promise<boolean>} Promise resolving to true if operation succeeded
     */
    async shareDocument(id, shared) {
        try {
            const response = await fetch(`${API_URL}/api/documents/${id}/share`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({ isSharedWithClient: shared })
            });

            if (!response.ok) {
                throw new Error('Failed to update document sharing');
            }

            return true;
        } catch (error) {
            console.error(`Error in shareDocument(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get document versions
     * @param {number} id - The document ID
     * @returns {Promise<Array>} Promise resolving to array of document versions
     */
    async getDocumentVersions(id) {
        try {
            const response = await fetch(`${API_URL}/api/documents/${id}/versions`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch document versions');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getDocumentVersions(${id}):`, error);
            throw error;
        }
    }

    /**
     * Utility method to get available cases for dropdown
     * @returns {Promise<Array>} Promise resolving to array of cases
     */
    async getCases() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const url = user?.lawFirmId
                ? `${API_URL}/api/cases/byfirm/${user.lawFirmId}`
                : `${API_URL}/api/cases`;

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cases');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getCases:', error);
            throw error;
        }
    }
}

export default new DocumentService();