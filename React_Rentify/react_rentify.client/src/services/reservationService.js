import apiClient from './apiClient';

export const reservationService = {
    async getAll() {
        try {
            const response = await apiClient.get('/reservations');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all reservations:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/reservations/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching reservation with ID ${id}:`, error);
            throw error;
        }
    },

    async getByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/reservations/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching reservations for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async getByCustomerId(customerId) {
        try {
            const response = await apiClient.get(`/reservations/customer/${customerId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching reservations for customer ${customerId}:`, error);
            throw error;
        }
    },

    async create(reservationData) {
        try {
            const response = await apiClient.post('/reservations', reservationData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating reservation:', error);
            throw error;
        }
    },

    async update(id, reservationData) {
        try {
            if (id !== reservationData.id) {
                throw new Error('The ID in the URL does not match the reservationData.id');
            }

            const response = await apiClient.put(`/reservations/${id}`, reservationData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating reservation with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/reservations/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting reservation with ID ${id}:`, error);
            throw error;
        }
    },
};

export default reservationService;
