import apiClient from './apiClient';

export const customerService = {
    async getAll() {
        try {
            const response = await apiClient.get('/customers');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching customers:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/customers/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching customer with ID ${id}:`, error);
            throw error;
        }
    },

    async getByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/customers/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching customers for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async create(customerData) {
        try {
            const response = await apiClient.post('/customers', customerData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating customer:', error);
            throw error;
        }
    },

    async update(id, customerData) {
        try {
            if (id !== customerData.id) {
                throw new Error("The ID in the URL does not match the customerData.id");
            }

            const response = await apiClient.put(`/customers/${id}`, customerData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating customer with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/customers/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting customer with ID ${id}:`, error);
            throw error;
        }
    },

    async addAttachment(customerId, attachmentData) {
        try {
            const response = await apiClient.post(`/customers/${customerId}/attachments`, attachmentData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error adding attachment to customer ${customerId}:`, error);
            throw error;
        }
    }
};

export default customerService;
