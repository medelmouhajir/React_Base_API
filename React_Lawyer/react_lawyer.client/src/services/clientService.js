// src/services/clientService.js

const API_URL = 'http://localhost:5267';

class ClientService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get all clients or clients by firm
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
     * Get client by ID
     */
    async getClientById(id) {
        const response = await fetch(`${API_URL}/api/clients/${id}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client details');
        }

        return await response.json();
    }

    /**
     * Search clients
     */
    async searchClients(term) {
        const response = await fetch(`${API_URL}/api/clients/search?term=${encodeURIComponent(term)}`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to search clients');
        }

        return await response.json();
    }

    /**
     * Create a new client
     */
    async createClient(clientData) {
        const response = await fetch(`${API_URL}/api/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify(clientData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create client');
        }

        return await response.json();
    }

    /**
     * Update client
     */
    async updateClient(id, clientData) {
        const response = await fetch(`${API_URL}/api/clients/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify({ ...clientData, clientId: id })
        });

        if (!response.ok) {
            throw new Error('Failed to update client');
        }

        return true;
    }

    /**
     * Delete client
     */
    async deleteClient(id) {
        const response = await fetch(`${API_URL}/api/clients/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to delete client');
        }

        return true;
    }

    /**
     * Get client cases
     */
    async getClientCases(id) {
        const response = await fetch(`${API_URL}/api/clients/${id}/cases`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client cases');
        }

        return await response.json();
    }

    /**
     * Get client appointments
     */
    async getClientAppointments(id) {
        const response = await fetch(`${API_URL}/api/clients/${id}/appointments`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client appointments');
        }

        return await response.json();
    }

    /**
     * Get client invoices
     */
    async getClientInvoices(id) {
        const response = await fetch(`${API_URL}/api/clients/${id}/invoices`, {
            headers: this.getAuthHeader()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client invoices');
        }

        return await response.json();
    }
}

export default new ClientService();