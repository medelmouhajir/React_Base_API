// src/services/lawyerService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

class LawyerService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get all lawyers
     */
    async getLawyers() {
        const response = await fetch(`${API_URL}/api/users/lawyers`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch lawyers');
        }

        return await response.json();
    }

    /**
     * Get lawyers by firm ID
     */
    async getLawyersByFirm(firmId) {
        const response = await fetch(`${API_URL}/api/lawfirms/${firmId}/lawyers`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch firm lawyers');
        }

        return await response.json();
    }

    /**
     * Get lawyer by ID
     */
    async getLawyerById(id) {
        const response = await fetch(`${API_URL}/api/lawyers/${id}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch lawyer details');
        }

        return await response.json();
    }

    /**
     * Create a new lawyer
     */
    async createLawyer(firmId, lawyerData) {
        const response = await fetch(`${API_URL}/api/lawfirms/${firmId}/lawyers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify(lawyerData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create lawyer');
        }

        return await response.json();
    }

    /**
     * Update lawyer
     */
    async updateLawyer(id, lawyerData) {
        const response = await fetch(`${API_URL}/api/lawyers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify(lawyerData)
        });

        if (!response.ok) {
            throw new Error('Failed to update lawyer');
        }

        return true;
    }

    /**
     * Delete lawyer (set inactive)
     */
    async deleteLawyer(id) {
        const response = await fetch(`${API_URL}/api/lawyers/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to delete lawyer');
        }

        return true;
    }

    /**
     * Get lawyer cases
     */
    async getLawyerCases(id) {
        const response = await fetch(`${API_URL}/api/cases/bylawyer/${id}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch lawyer cases');
        }

        return await response.json();
    }

    /**
     * Get lawyer appointments
     */
    async getLawyerAppointments(id) {
        const response = await fetch(`${API_URL}/api/appointments/bylawyer/${id}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch lawyer appointments');
        }

        return await response.json();
    }
}

export default new LawyerService();