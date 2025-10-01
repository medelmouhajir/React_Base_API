import apiClient from './apiClient';

export const carFiltersService = {
    // ====================
    // Manufacturers
    // ====================
    async getManufacturers() {
        try {
            const response = await apiClient.get('/carfilters/manufacturers');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching manufacturers:', error);
            throw error;
        }
    },

    async addManufacturer(manufacturerData) {
        try {
            const response = await apiClient.post('/carfilters/manufacturers', manufacturerData);
            return response.data;
        } catch (error) {
            console.error('❌ Error adding manufacturer:', error);
            throw error;
        }
    },

    async removeManufacturer(id) {
        try {
            const response = await apiClient.delete(`/carfilters/manufacturers/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error removing manufacturer with ID ${id}:`, error);
            throw error;
        }
    },

    // ====================
    // Car Models
    // ====================
    async getCarModels() {
        try {
            const response = await apiClient.get('/carfilters/models');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching car models:', error);
            throw error;
        }
    },

    async addCarModel(modelData) {
        try {
            const response = await apiClient.post('/carfilters/models', modelData);
            return response.data;
        } catch (error) {
            console.error('❌ Error adding car model:', error);
            throw error;
        }
    },

    async removeCarModel(id) {
        try {
            const response = await apiClient.delete(`/carfilters/models/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error removing car model with ID ${id}:`, error);
            throw error;
        }
    },

    // ====================
    // Car Years
    // ====================
    async getCarYears() {
        try {
            const response = await apiClient.get('/carfilters/years');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching car years:', error);
            throw error;
        }
    },

    async addCarYear(yearData) {
        try {
            const response = await apiClient.post('/carfilters/years', yearData);
            return response.data;
        } catch (error) {
            console.error('❌ Error adding car year:', error);
            throw error;
        }
    },

    async removeCarYear(id) {
        try {
            const response = await apiClient.delete(`/carfilters/years/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error removing car year with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Upload filters from JSON file
     * @param {Array} filtersData - Array of manufacturers with models
     * @returns {Promise<Object>} - Upload result with statistics
     */
    async uploadFilters(filtersData) {
        try {
            const response = await apiClient.post('/carfilters/upload', filtersData);
            return response.data;
        } catch (error) {
            console.error('❌ Error uploading filters:', error);
            throw error;
        }
    }
};

export default carFiltersService;
