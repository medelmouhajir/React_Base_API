// =============================================================================
// TOURS SERVICE
// =============================================================================
import apiClient from './apiClient';

export const tourService = {
    // Get all tours with pagination
    async getAll(page = 1, pageSize = 20) {
        try {
            const response = await apiClient.get(`/tours?page=${page}&pageSize=${pageSize}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get tour by ID
    async getById(id) {
        try {
            const response = await apiClient.get(`/tours/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get tours by owner
    async getByOwner(ownerId) {
        try {
            const response = await apiClient.get(`/tours/owner/${ownerId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Search tours
    async search(query) {
        try {
            const response = await apiClient.get(`/tours/search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Create new tour
    async create(tourData) {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', tourData.name);
            if (tourData.description) formData.append('description', tourData.description);
            formData.append('ownerId', tourData.ownerId);

            // Add file
            if (tourData.imageFile) formData.append('imageFile', tourData.imageFile);

            const response = await apiClient.post('/tours', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Update tour
    async update(id, tourData) {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', tourData.name);
            if (tourData.description) formData.append('description', tourData.description);
            formData.append('ownerId', tourData.ownerId);

            // Add file and keep existing flag
            if (tourData.imageFile) formData.append('imageFile', tourData.imageFile);
            formData.append('keepExistingImage', tourData.keepExistingImage !== false);

            const response = await apiClient.put(`/tours/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Delete tour
    async delete(id) {
        try {
            const response = await apiClient.delete(`/tours/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Helper method to handle errors
    handleError(error) {
        if (error.response) {
            const message = error.response.data?.message || 
                           error.response.data?.title || 
                           `Server error: ${error.response.status}`;
            
            if (error.response.data?.errors) {
                const validationErrors = Object.values(error.response.data.errors)
                    .flat()
                    .join(', ');
                return new Error(validationErrors);
            }
            return new Error(message);
        } else if (error.request) {
            return new Error('Network error. Please check your connection.');
        } else {
            return new Error(error.message || 'An unexpected error occurred.');
        }
    }
};

export default tourService;