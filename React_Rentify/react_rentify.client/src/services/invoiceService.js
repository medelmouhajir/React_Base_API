import apiClient from './apiClient';

export const invoiceService = {
    async getAll() {
        try {
            const response = await apiClient.get('/invoices');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all invoices:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/invoices/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoice with ID ${id}:`, error);
            throw error;
        }
    },

    async getByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/invoices/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoice for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async getByReservationId(reservationId) {
        try {
            const response = await apiClient.get(`/invoices/reservation/${reservationId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoice for reservation ${reservationId}:`, error);
            throw error;
        }
    },

    async create(invoiceData) {
        try {
            const response = await apiClient.post('/invoices', invoiceData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating invoice:', error);
            throw error;
        }
    },

    async update(id, invoiceData) {
        try {
            if (id !== invoiceData.id) {
                throw new Error("The ID in the URL does not match invoiceData.id");
            }
            const response = await apiClient.put(`/invoices/${id}`, invoiceData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating invoice with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/invoices/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting invoice with ID ${id}:`, error);
            throw error;
        }
    },

    async addPayment(invoiceId, paymentData) {
        try {
            console.log(paymentData);
            const response = await apiClient.post(`/invoices/${invoiceId}/payments`, paymentData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error adding payment to invoice ID ${invoiceId}:`, error);
            throw error;
        }
    },

    async removePayment(invoiceId, paymentId) {
        try {
            const response = await apiClient.delete(`/invoices/${invoiceId}/payments/${paymentId}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error removing payment ${paymentId} from invoice ID ${invoiceId}:`, error);
            throw error;
        }
    }
};

export default invoiceService;
