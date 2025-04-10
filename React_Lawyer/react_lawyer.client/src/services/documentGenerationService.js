// src/services/documentGenerationService.js
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling document generation-related API calls
 */
class DocumentGenerationService {
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
     * Get all available document templates
     * @param {string} category - Optional category filter
     * @returns {Promise<Array>} - Promise resolving to array of templates
     */
    async getTemplates(category = null) {
        try {
            const url = category
                ? `${API_URL}/api/document-generation/templates?category=${encodeURIComponent(category)}`
                : `${API_URL}/api/document-generation/templates`;

            const response = await this.fetchWithAuth(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch document templates');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching document templates:', error);
            throw error;
        }
    }

    /**
     * Generate a document using a template and data
     * @param {Object} documentRequest - Document generation request
     * @returns {Promise<Object>} - Promise resolving to generation response
     */
    async generateDocument(documentRequest) {
        console.log(documentRequest);
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/document-generation/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(documentRequest)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate document');
            }

            return await response.json();
        } catch (error) {
            console.error('Error generating document:', error);
            throw error;
        }
    }

    /**
     * Download a generated document
     * @param {string} documentId - ID of the document to download
     * @returns {Promise<Blob>} - Promise resolving to document blob
     */
    async downloadDocument(documentId) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/document-generation/documents/${documentId}/download`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/octet-stream',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to download document: ${response.status}`);
            }

            return await response.blob();
        } catch (error) {
            console.error(`Error downloading document ${documentId}:`, error);
            throw error;
        }
    }

    /**
     * Get case data for document generation
     * @param {number} caseId - ID of the case
     * @returns {Promise<Object>} - Promise resolving to case data
     */
    async getCaseDocumentData(caseId) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/document-generation/data/case/${caseId}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to get case data for document generation`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting case data for document generation (case ${caseId}):`, error);
            throw error;
        }
    }

    /**
     * Get client data for document generation
     * @param {number} clientId - ID of the client
     * @returns {Promise<Object>} - Promise resolving to client data
     */
    async getClientDocumentData(clientId) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/document-generation/data/client/${clientId}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to get client data for document generation`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting client data for document generation (client ${clientId}):`, error);
            throw error;
        }
    }

    /**
     * Generate and download a document in one step
     * @param {Object} documentRequest - Document generation request
     * @returns {Promise<{blob: Blob, filename: string}>} - Promise resolving to document blob and filename
     */
    async generateAndDownloadDocument(documentRequest) {
        try {
            // First generate the document
            const generationResponse = await this.generateDocument(documentRequest);

            // Then download it
            const blob = await this.downloadDocument(generationResponse.documentId);

            // Build an appropriate filename
            const extension = this.getFileExtension(documentRequest.format || 'PDF');
            const filename = `${documentRequest.documentTitle || 'document'}.${extension}`;

            return { blob, filename, documentId: generationResponse.documentId };
        } catch (error) {
            console.error('Error generating and downloading document:', error);
            throw error;
        }
    }

    /**
     * Helper method to get file extension from format
     * @param {string} format - Document format
     * @returns {string} - File extension
     */
    getFileExtension(format) {
        const formatMap = {
            'PDF': 'pdf',
            'DOCX': 'docx',
            'HTML': 'html',
            'Markdown': 'md',
            'TXT': 'txt'
        };

        return formatMap[format.toUpperCase()] || 'pdf';
    }

    /**
     * Trigger the browser to download a blob as a file
     * @param {Blob} blob - The file data
     * @param {string} filename - Name to save the file as
     */
    downloadBlob(blob, filename) {
        // Create a temporary URL to the blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);

        // Append the link to the document, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Release the object URL
        window.URL.revokeObjectURL(url);
    }
}

export default new DocumentGenerationService();