import apiClient from './apiClient';

export const maintenanceService = {
    async getAll() {
        try {
            const response = await apiClient.get('/maintenance');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all maintenance records:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/maintenance/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching maintenance record with ID ${id}:`, error);
            throw error;
        }
    },

    async getByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/maintenance/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching maintenance records for agency ID ${agencyId}:`, error);
            throw error;
        }
    },

    async getByCarId(carId) {
        try {
            const response = await apiClient.get(`/maintenance/car/${carId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching maintenance records for car ID ${carId}:`, error);
            throw error;
        }
    },

    async create(recordData) {
        try {
            const response = await apiClient.post('/maintenance', recordData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating maintenance record:', error);
            throw error;
        }
    },

    async update(id, recordData) {
        try {
            if (id !== recordData.id) {
                throw new Error("The ID in the URL does not match recordData.id");
            }
            const response = await apiClient.put(`/maintenance/${id}`, recordData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating maintenance record with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/maintenance/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting maintenance record with ID ${id}:`, error);
            throw error;
        }
    }
};

export default maintenanceService;
