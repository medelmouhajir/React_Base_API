// src/services/timeEntryService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling time entry-related API calls
 */
class TimeEntryService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get all time entries
     * @returns {Promise<Array>} Promise resolving to array of time entries
     */
    async getTimeEntries() {
        try {
            const response = await fetch(`${API_URL}/api/timeentries`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch time entries');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getTimeEntries:', error);
            throw error;
        }
    }

    /**
     * Get time entries by lawyer ID
     * @param {number} lawyerId - The lawyer ID
     * @returns {Promise<Array>} Promise resolving to array of time entries
     */
    async getTimeEntriesByLawyer(lawyerId) {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/bylawyer/${lawyerId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch lawyer time entries');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getTimeEntriesByLawyer(${lawyerId}):`, error);
            throw error;
        }
    }

    /**
     * Get time entries by client ID
     * @param {number} clientId - The client ID
     * @returns {Promise<Array>} Promise resolving to array of time entries
     */
    async getTimeEntriesByClient(clientId) {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/byclient/${clientId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch client time entries');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getTimeEntriesByClient(${clientId}):`, error);
            throw error;
        }
    }

    /**
     * Get time entries by case ID
     * @param {number} caseId - The case ID
     * @returns {Promise<Array>} Promise resolving to array of time entries
     */
    async getTimeEntriesByCase(caseId) {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/bycase/${caseId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch case time entries');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getTimeEntriesByCase(${caseId}):`, error);
            throw error;
        }
    }

    /**
     * Get time entries by date range
     * @param {string} startDate - Start date in ISO format
     * @param {string} endDate - End date in ISO format
     * @returns {Promise<Array>} Promise resolving to array of time entries
     */
    async getTimeEntriesByDateRange(startDate, endDate) {
        try {
            const response = await fetch(
                `${API_URL}/api/timeentries/bydate?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
                {
                    headers: this.getAuthHeader()
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch time entries for date range');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getTimeEntriesByDateRange(${startDate}, ${endDate}):`, error);
            throw error;
        }
    }

    /**
     * Get time entries by firm ID
     * @param {number} firmId - The law firm ID
     * @returns {Promise<Array>} Promise resolving to array of time entries
     */
    async getTimeEntriesByFirm(firmId) {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/byfirm/${firmId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch firm time entries');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getTimeEntriesByFirm(${firmId}):`, error);
            throw error;
        }
    }

    /**
     * Get time entry by ID
     * @param {number} id - The time entry ID
     * @returns {Promise<Object>} Promise resolving to time entry object
     */
    async getTimeEntryById(id) {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch time entry details');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getTimeEntryById(${id}):`, error);
            throw error;
        }
    }

    /**
     * Create a new time entry
     * @param {Object} timeEntryData - Data for the new time entry
     * @returns {Promise<Object>} Promise resolving to created time entry
     */
    async createTimeEntry(timeEntryData) {
        try {
            console.log(timeEntryData);
            const response = await fetch(`${API_URL}/api/timeentries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(timeEntryData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create time entry');
            }

            return true;
        } catch (error) {
            console.error('Error in createTimeEntry:', error);
            throw error;
        }
    }

    /**
     * Update an existing time entry
     * @param {number} id - The time entry ID
     * @param {Object} timeEntryData - Updated data for the time entry
     * @returns {Promise<boolean>} Promise resolving to true if update succeeded
     */
    async updateTimeEntry(id, timeEntryData) {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(timeEntryData)
            });

            if (!response.ok) {
                throw new Error('Failed to update time entry');
            }

            return true;
        } catch (error) {
            console.error(`Error in updateTimeEntry(${id}):`, error);
            throw error;
        }
    }

    /**
     * Delete a time entry
     * @param {number} id - The time entry ID
     * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded
     */
    async deleteTimeEntry(id) {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to delete time entry');
            }

            return true;
        } catch (error) {
            console.error(`Error in deleteTimeEntry(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get unbilled time entries
     * @returns {Promise<Array>} Promise resolving to array of unbilled time entries
     */
    async getUnbilledTimeEntries() {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/unbilled`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch unbilled time entries');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getUnbilledTimeEntries:', error);
            throw error;
        }
    }

    /**
     * Get billed time entries
     * @param {number} invoiceId - The invoice ID
     * @returns {Promise<Array>} Promise resolving to array of billed time entries
     */
    async getBilledTimeEntries(invoiceId) {
        try {
            const response = await fetch(`${API_URL}/api/timeentries/billed/${invoiceId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch billed time entries');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getBilledTimeEntries(${invoiceId}):`, error);
            throw error;
        }
    }

    /**
     * Utility method to get lawyers for dropdown
     * @returns {Promise<Array>} Promise resolving to array of lawyers
     */
    async getLawyers() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const url = user?.lawFirmId
                ? `${API_URL}/api/LawFirms/${user.lawFirmId}/Lawyers`
                : `${API_URL}/api/lawyers`;

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch lawyers');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getLawyers:', error);
            throw error;
        }
    }

    /**
     * Utility method to get clients for dropdown
     * @returns {Promise<Array>} Promise resolving to array of clients
     */
    async getClients() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const url = user?.lawFirmId
                ? `${API_URL}/api/clients/byfirm/${user.lawFirmId}`
                : `${API_URL}/api/clients`;

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch clients');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getClients:', error);
            throw error;
        }
    }

    /**
     * Utility method to get cases for dropdown
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

export default new TimeEntryService();