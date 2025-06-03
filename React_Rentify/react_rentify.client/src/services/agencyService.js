import apiClient from './apiClient';

export const agencyService = {
    async getAll() {
        try {
            const response = await apiClient.get('/agencies');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching agencies:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/agencies/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching agency with ID ${id}:`, error);
            throw error;
        }
    },

    async create(agencyData) {
        try {
            const response = await apiClient.post('/agencies', agencyData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating agency:', error);
            throw error;
        }
    },

    async update(id, agencyData) {
        try {
            if (id !== agencyData.id) {
                throw new Error("The ID in the URL does not match the agencyData.id");
            }

            const response = await apiClient.put(`/agencies/${id}`, agencyData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating agency with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/agencies/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting agency with ID ${id}:`, error);
            throw error;
        }
    }
};

export default agencyService;
