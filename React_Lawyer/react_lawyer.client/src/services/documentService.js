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
     * Get all documents or documents by firm
     */
    async getDocuments() {
        const user = JSON.parse(localStorage.getItem('user'));
        const url = user?.lawFirmId ?
            `${API_URL}/api/documents/byfirm/${user.lawFirmId}` :
            `${API_URL}/api/documents`;

        const response = await fetch(url, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        return await response.json();
    }

    /**
     * Get documents by case ID
     */
    async getDocumentsByCase(caseId) {
        const response = await fetch(`${API_URL}/api/documents/bycase/${caseId}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch case documents');
        }

        return await response.json();
    }

    /**
     * Get documents by client ID
     */
    async getDocumentsByClient(clientId) {
        const response = await fetch(`${API_URL}/api/documents/byclient/${clientId}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client documents');
        }

        return await response.json();
    }

    /**
     * Get document by ID
     */
    async getDocumentById(id) {
        const response = await fetch(`${API_URL}/api/documents/${id}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch document details');
        }

        return await response.json();
    }

    /**
     * Create a new document
     */
    async createDocument(documentData) {
        const response = await fetch(`${API_URL}/api/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify(documentData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create document');
        }

        return await response.json();
    }

    /**
     * Update document
     */
    async updateDocument(id, documentData) {
        const response = await fetch(`${API_URL}/api/documents/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify({ ...documentData, documentId: id })
        });

        if (!response.ok) {
            throw new Error('Failed to update document');
        }

        return await response.json();
    }

    /**
     * Delete document
     */
    async deleteDocument(id) {
        const response = await fetch(`${API_URL}/api/documents/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }

        return true;
    }

    /**
     * Export document to PDF
     */
    async exportToPdf(id, htmlContent, title) {
        const response = await fetch(`${API_URL}/api/documents/${id}/export/pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify({
                htmlContent,
                title
            })
        });

        if (!response.ok) {
            throw new Error('Failed to export document to PDF');
        }

        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        return true;
    }

    /**
     * Export document to DOCX
     */
    async exportToDocx(id, htmlContent, title) {
        const response = await fetch(`${API_URL}/api/documents/${id}/export/docx`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify({
                htmlContent,
                title
            })
        });

        if (!response.ok) {
            throw new Error('Failed to export document to DOCX');
        }

        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${title}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        return true;
    }

    /**
     * Utility method to get available clients for dropdown
     */
    async getClients() {
        const user = JSON.parse(localStorage.getItem('user'));
        const url = user?.lawFirmId ?
            `${API_URL}/api/clients/byfirm/${user.lawFirmId}` :
            `${API_URL}/api/clients`;

        const response = await fetch(url, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch clients');
        }

        return await response.json();
    }

    /**
     * Utility method to get available cases for dropdown
     */
    async getCases() {
        const user = JSON.parse(localStorage.getItem('user'));
        const url = user?.lawFirmId ?
            `${API_URL}/api/cases/byfirm/${user.lawFirmId}` :
            `${API_URL}/api/cases`;

        const response = await fetch(url, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch cases');
        }

        return await response.json();
    }
}

export default new DocumentService();