// src/services/caseService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling case-related API calls
 */
class CaseService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Helper method to handle API responses and provide detailed error information
     */
    async handleResponse(response, url) {
        console.log(`API Response [${response.status}]:`, url);

        if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `Server error: ${response.status}`;

            try {
                const contentType = response.headers.get('content-type');

                // Check if response is JSON
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    console.error('Error response:', errorData);

                    // Extract error message from different possible formats
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.errors) {
                        // Handle validation errors
                        const validationErrors = Object.values(errorData.errors).flat();
                        errorMessage = validationErrors.join(', ');
                    } else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    }
                } else {
                    // If not JSON, try to get text content
                    const text = await response.text();
                    if (text) {
                        console.error('Non-JSON error response:', text.substring(0, 500));

                        // Try to extract error from HTML response
                        const titleMatch = text.match(/<title>(.*?)<\/title>/);
                        if (titleMatch && titleMatch[1]) {
                            errorMessage = titleMatch[1];
                        }
                    }
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    }

    /**
     * Get all cases or cases by firm
     */
    async getCases() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const url = user?.lawFirmId ?
                `${API_URL}/api/cases/byfirm/${user.lawFirmId}` :
                `${API_URL}/api/cases`;

            console.log('Fetching cases from URL:', url);
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in getCases:', error);
            throw error;
        }
    }

    /**
     * Get active cases
     */
    async getActiveCases() {
        try {
            const url = `${API_URL}/api/cases/active`;
            console.log('Fetching active cases from URL:', url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in getActiveCases:', error);
            throw error;
        }
    }

    /**
     * Get case by ID
     */
    async getCaseById(id) {
        try {
            const url = `${API_URL}/api/cases/${id}`;
            console.log(`Fetching case details for ID ${id} from URL:`, url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getCaseById(${id}):`, error);
            throw error;
        }
    }

    /**
     * Search cases
     */
    async searchCases(term) {
        try {
            const url = `${API_URL}/api/cases/search?term=${encodeURIComponent(term)}`;
            console.log(`Searching cases with term "${term}" from URL:`, url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in searchCases("${term}"):`, error);
            throw error;
        }
    }

    /**
     * Create a new case
     */

    async createCase(caseData) {
        try {
            const url = `${API_URL}/api/cases`;
            console.log('Creating new case with data:', caseData);

            // Map string type to numeric enum value
            const caseTypeMap = {
                'Civil': 0,
                'Criminal': 1,
                'Family': 2,
                'Immigration': 3,
                'Corporate': 4,
                'RealEstate': 5,
                'Bankruptcy': 6,
                'IntellectualProperty': 7,
                'Tax': 8,
                'Other': 9
            };

            // Directly send sanitized data without the "model" wrapper
            const sanitizedData = {
                ...caseData,
                // Ensure clientIds is in the correct format (array)
                clientIds: Array.isArray(caseData.clientIds) ? caseData.clientIds : [],
                // Convert string type to numeric enum
                type: caseTypeMap[caseData.type] !== undefined ? caseTypeMap[caseData.type] : 0,
                // Ensure other required fields have sensible defaults
                lawFirmId: caseData.lawFirmId || 0,
                createdById: caseData.createdById || 0,
                title: caseData.title || '',
                description: caseData.description || ''
            };

            console.log('Submitting direct data to API:', sanitizedData);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(sanitizedData)
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in createCase:', error);
            throw error;
        }
    }
    /**
     * Update case
     */
    async updateCase(id, caseData) {
        try {
            const url = `${API_URL}/api/cases/${id}`;
            console.log(`Updating case with ID ${id} with data:`, caseData);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(caseData)
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in updateCase(${id}):`, error);
            throw error;
        }
    }

    /**
     * Update case status
     */
    async updateCaseStatus(id, newStatus, userId, notes = '') {
        try {
            const url = `${API_URL}/api/cases/${id}/status`;
            console.log(`Updating status for case ID ${id} to "${newStatus}"`);

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({
                    newStatus,
                    userId,
                    notes
                })
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in updateCaseStatus(${id}, "${newStatus}"):`, error);
            throw error;
        }
    }

    /**
     * Delete case
     */
    async deleteCase(id) {
        try {
            const url = `${API_URL}/api/cases/${id}`;
            console.log(`Deleting case with ID ${id}`);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in deleteCase(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get case documents
     */
    async getCaseDocuments(id) {
        try {
            const url = `${API_URL}/api/cases/${id}/documents`;
            console.log(`Fetching documents for case ID ${id}`);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getCaseDocuments(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get case events
     */
    async getCaseEvents(id) {
        try {
            const url = `${API_URL}/api/cases/${id}/events`;
            console.log(`Fetching events for case ID ${id}`);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getCaseEvents(${id}):`, error);
            throw error;
        }
    }

    /**
     * Add case event
     */
    async addCaseEvent(id, eventData) {
        try {
            const url = `${API_URL}/api/cases/${id}/events`;
            console.log(`Adding event to case ID ${id}:`, eventData);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(eventData)
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in addCaseEvent(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get case clients
     */
    async getCaseClients(id) {
        try {
            const url = `${API_URL}/api/cases/${id}/clients`;
            console.log(`Fetching clients for case ID ${id}`);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getCaseClients(${id}):`, error);
            throw error;
        }
    }

    /**
     * Add client to case
     */
    async addClientToCase(caseId, clientId) {
        try {
            const url = `${API_URL}/api/cases/${caseId}/clients`;
            console.log(`Adding client ID ${clientId} to case ID ${caseId}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(clientId)
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in addClientToCase(${caseId}, ${clientId}):`, error);
            throw error;
        }
    }

    /**
     * Remove client from case
     */
    async removeClientFromCase(caseId, clientId) {
        try {
            const url = `${API_URL}/api/cases/${caseId}/clients/${clientId}`;
            console.log(`Removing client ID ${clientId} from case ID ${caseId}`);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in removeClientFromCase(${caseId}, ${clientId}):`, error);
            throw error;
        }
    }
}

export default new CaseService();