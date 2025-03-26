// src/services/secretaryService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

class SecretaryService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get all secretaries
     */
    async getSecretaries() {
        const response = await fetch(`${API_URL}/api/users/secretaries`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch secretaries');
        }

        return await response.json();
    }

    /**
     * Get secretaries by firm ID
     */
    async getSecretariesByFirm(firmId) {
        const response = await fetch(`${API_URL}/api/lawfirms/${firmId}/secretaries`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch firm secretaries');
        }

        return await response.json();
    }

    /**
     * Get secretary by ID
     */
    async getSecretaryById(id) {
        const response = await fetch(`${API_URL}/api/secretaries/${id}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch secretary details');
        }

        return await response.json();
    }

    /**
     * Create a new secretary
     */
    async createSecretary(firmId, secretaryData) {
        const response = await fetch(`${API_URL}/api/lawfirms/${firmId}/secretaries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify(secretaryData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create secretary');
        }

        return await response.json();
    }

    /**
     * Update secretary
     */
    async updateSecretary(id, secretaryData) {
        const response = await fetch(`${API_URL}/api/secretaries/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify(secretaryData)
        });

        if (!response.ok) {
            throw new Error('Failed to update secretary');
        }

        return true;
    }

    /**
     * Delete secretary (set inactive)
     */
    async deleteSecretary(id) {
        const response = await fetch(`${API_URL}/api/secretaries/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to delete secretary');
        }

        return true;
    }

    /**
     * Get lawyers assigned to secretary
     */
    async getAssignedLawyers(id) {
        const response = await fetch(`${API_URL}/api/secretaries/${id}/lawyers`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch assigned lawyers');
        }

        return await response.json();
    }

    /**
     * Assign lawyer to secretary
     */
    async assignLawyer(secretaryId, lawyerId) {
        const response = await fetch(`${API_URL}/api/secretaries/${secretaryId}/lawyers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify({ lawyerId })
        });

        if (!response.ok) {
            throw new Error('Failed to assign lawyer');
        }

        return true;
    }

    /**
     * Remove lawyer assignment from secretary
     */
    async removeAssignedLawyer(secretaryId, lawyerId) {
        const response = await fetch(`${API_URL}/api/secretaries/${secretaryId}/lawyers/${lawyerId}`, {
            method: 'DELETE',
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to remove lawyer assignment');
        }

        return true;
    }
}

export default new SecretaryService();