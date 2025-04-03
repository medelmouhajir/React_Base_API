// src/services/invoiceService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling invoice-related API calls
 */
class InvoiceService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get all invoices
     * @returns {Promise<Array>} Promise resolving to array of invoices
     */
    async getAllInvoices() {
        try {
            const response = await fetch(`${API_URL}/api/invoices`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch invoices');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getAllInvoices:', error);
            throw error;
        }
    }

    /**
     * Get invoice by ID
     * @param {number} id - The invoice ID
     * @returns {Promise<Object>} Promise resolving to invoice object
     */
    async getInvoiceById(id) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch invoice details');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getInvoiceById(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get invoices by firm ID
     * @param {number} firmId - The law firm ID
     * @returns {Promise<Array>} Promise resolving to array of invoices
     */
    async getInvoicesByFirm(firmId) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/byfirm/${firmId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch firm invoices');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getInvoicesByFirm(${firmId}):`, error);
            throw error;
        }
    }

    /**
     * Get invoices by client ID
     * @param {number} clientId - The client ID
     * @returns {Promise<Array>} Promise resolving to array of invoices
     */
    async getInvoicesByClient(clientId) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/byclient/${clientId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch client invoices');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getInvoicesByClient(${clientId}):`, error);
            throw error;
        }
    }

    /**
     * Get invoices by case ID
     * @param {number} caseId - The case ID
     * @returns {Promise<Array>} Promise resolving to array of invoices
     */
    async getInvoicesByCase(caseId) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/bycase/${caseId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch case invoices');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getInvoicesByCase(${caseId}):`, error);
            throw error;
        }
    }

    /**
     * Get outstanding invoices
     * @returns {Promise<Array>} Promise resolving to array of outstanding invoices
     */
    async getOutstandingInvoices() {
        try {
            const response = await fetch(`${API_URL}/api/invoices/outstanding`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch outstanding invoices');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getOutstandingInvoices:', error);
            throw error;
        }
    }

    /**
     * Get overdue invoices
     * @returns {Promise<Array>} Promise resolving to array of overdue invoices
     */
    async getOverdueInvoices() {
        try {
            const response = await fetch(`${API_URL}/api/invoices/overdue`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch overdue invoices');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in getOverdueInvoices:', error);
            throw error;
        }
    }

    /**
     * Create a new invoice
     * @param {Object} invoiceData - Data for the new invoice
     * @returns {Promise<Object>} Promise resolving to created invoice
     */
    async createInvoice(invoiceData) {
        try {
            console.log(invoiceData);
            const response = await fetch(`${API_URL}/api/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(invoiceData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create invoice');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in createInvoice:', error);
            throw error;
        }
    }

    stringToInvoiceItemType(str) {
        switch (str) {
            case "Service": return 0;  // Service
            case "Expense": return 1;  // Expense
            case "Fee": return 2;  // Fee
            case "Discount": return 3;  // Discount
            case "Tax": return 5;  // Tax
            case "Other": return 10; // Other
            default: return null; // Invalid value
        }
    }



    /**
     * Update an existing invoice
     * @param {number} id - The invoice ID
     * @param {Object} invoiceData - Updated data for the invoice
     * @returns {Promise<boolean>} Promise resolving to true if update succeeded
     */
    async updateInvoice(id, invoiceData) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({ ...invoiceData, invoiceId: id })
            });

            if (!response.ok) {
                throw new Error('Failed to update invoice');
            }

            return true;
        } catch (error) {
            console.error(`Error in updateInvoice(${id}):`, error);
            throw error;
        }
    }

    /**
     * Update invoice status
     * @param {number} id - The invoice ID
     * @param {string} newStatus - New status for the invoice
     * @param {Object} [additionalData] - Additional data for status update (e.g., payment info)
     * @returns {Promise<boolean>} Promise resolving to true if update succeeded
     */
    async updateInvoiceStatus(id, newStatus, additionalData = {}) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({
                    newStatus,
                    userId: JSON.parse(localStorage.getItem('user'))?.id,
                    ...additionalData
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update invoice status');
            }

            return true;
        } catch (error) {
            console.error(`Error in updateInvoiceStatus(${id}):`, error);
            throw error;
        }
    }

    /**
     * Delete (or cancel) an invoice
     * @param {number} id - The invoice ID
     * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded
     */
    async deleteInvoice(id) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to delete invoice');
            }

            return true;
        } catch (error) {
            console.error(`Error in deleteInvoice(${id}):`, error);
            throw error;
        }
    }

    /**
     * Add an item to an invoice
     * @param {number} invoiceId - The invoice ID
     * @param {Object} itemData - Data for the new invoice item
     * @returns {Promise<Object>} Promise resolving to created invoice item
     */
    async addInvoiceItem(invoiceId, itemData) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({
                    ...itemData,
                    invoiceId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add invoice item');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in addInvoiceItem(${invoiceId}):`, error);
            throw error;
        }
    }

    /**
     * Delete an item from an invoice
     * @param {number} invoiceId - The invoice ID
     * @param {number} itemId - The invoice item ID
     * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded
     */
    async deleteInvoiceItem(invoiceId, itemId) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/items/${itemId}`, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to delete invoice item');
            }

            return true;
        } catch (error) {
            console.error(`Error in deleteInvoiceItem(${invoiceId}, ${itemId}):`, error);
            throw error;
        }
    }

    /**
     * Add a payment to an invoice
     * @param {number} invoiceId - The invoice ID
     * @param {Object} paymentData - Data for the new payment
     * @returns {Promise<Object>} Promise resolving to created payment
     */
    async addPayment(invoiceId, paymentData) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({
                    ...paymentData,
                    invoiceId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add payment');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in addPayment(${invoiceId}):`, error);
            throw error;
        }
    }

    /**
     * Get unbilled time entries for a client
     * @param {number} clientId - The client ID
     * @returns {Promise<Array>} Promise resolving to array of unbilled time entries
     */
    async getUnbilledTimeEntries(clientId) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/unbilledtimeentries/${clientId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch unbilled time entries');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getUnbilledTimeEntries(${clientId}):`, error);
            throw error;
        }
    }

    /**
     * Get unbilled time entries for a case
     * @param {number} caseId - The case ID
     * @returns {Promise<Array>} Promise resolving to array of unbilled time entries
     */
    async getUnbilledTimeEntriesByCase(caseId) {
        try {
            const response = await fetch(`${API_URL}/api/invoices/unbilledtimeentriesbycase/${caseId}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch unbilled time entries for case');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getUnbilledTimeEntriesByCase(${caseId}):`, error);
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

export default new InvoiceService();