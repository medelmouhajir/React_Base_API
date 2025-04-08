// src/services/clientService.js
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling client-related API calls with token refresh support
 */
class ClientService {
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
     * Helper method to handle API responses
     * @param {Response} response - Fetch response object
     * @returns {Promise} - Promise with JSON data
     */
    async handleResponse(response) {
        if (!response.ok) {
            // If unauthorized and has refresh token, try to refresh
            if (response.status === 401) {
                const user = authService.getCurrentUser();
                if (user && user.refreshToken) {
                    try {
                        // This will be handled by fetchWithAuth automatically
                        throw new Error('Token refresh needed');
                    } catch (error) {
                        console.error('Error refreshing token:', error);
                        // If refresh fails, throw the original error
                        throw new Error('Unauthorized - Please login again');
                    }
                }
            }

            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Get all clients or clients by firm
     */
    async getClients() {
        const user = authService.getCurrentUser();
        const url = user?.lawFirmId ?
            `${API_URL}/api/clients/byfirm/${user.lawFirmId}` :
            `${API_URL}/api/clients`;

        try {
            const response = await this.fetchWithAuth(url);
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }
    }

    /**
     * Get client by ID
     */
    async getClientById(id) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/clients/${id}`);
            return this.handleResponse(response);
        } catch (error) {
            console.error(`Error fetching client ${id}:`, error);
            throw error;
        }
    }

    /**
     * Search clients
     */
    async searchClients(term) {
        try {
            const response = await this.fetchWithAuth(
                `${API_URL}/api/clients/search?term=${encodeURIComponent(term)}`
            );
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error searching clients:', error);
            throw error;
        }
    }

    /**
     * Create a new client
     */
    async createClient(clientData) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clientData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    }

    /**
     * Update client
     */
    async updateClient(id, clientData) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/clients/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...clientData, clientId: id })
            });

            if (!response.ok) {
                throw new Error('Failed to update client');
            }

            return true;
        } catch (error) {
            console.error(`Error updating client ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete client
     */
    async deleteClient(id) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/clients/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete client');
            }

            return true;
        } catch (error) {
            console.error(`Error deleting client ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get client cases
     */
    async getClientCases(id) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/clients/${id}/cases`);
            return this.handleResponse(response);
        } catch (error) {
            console.error(`Error fetching client ${id} cases:`, error);
            throw error;
        }
    }

    /**
     * Get client appointments
     */
    async getClientAppointments(id) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/clients/${id}/appointments`);
            return this.handleResponse(response);
        } catch (error) {
            console.error(`Error fetching client ${id} appointments:`, error);
            throw error;
        }
    }

    /**
     * Get client invoices
     */
    async getClientInvoices(id) {
        try {
            const response = await this.fetchWithAuth(`${API_URL}/api/clients/${id}/invoices`);
            return this.handleResponse(response);
        } catch (error) {
            console.error(`Error fetching client ${id} invoices:`, error);
            throw error;
        }
    }
}

export default new ClientService();