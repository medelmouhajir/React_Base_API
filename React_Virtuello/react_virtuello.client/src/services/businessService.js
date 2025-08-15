// =============================================================================
// BUSINESS SERVICE
// =============================================================================
import apiClient from './apiClient';

export const businessService = {
    // Get all businesses with pagination
    async getAll(page = 1, pageSize = 20) {
        try {
            const response = await apiClient.get(`/businesses?page=${page}&pageSize=${pageSize}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get business by ID
    async getById(id) {
        try {
            const response = await apiClient.get(`/businesses/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get businesses by owner
    async getByOwner(ownerId) {
        try {
            const response = await apiClient.get(`/businesses/owner/${ownerId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Search businesses
    async search(query) {
        try {
            const response = await apiClient.get(`/businesses/search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Create new business
    async create(businessData) {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', businessData.name);
            if (businessData.description) formData.append('description', businessData.description);
            formData.append('status', businessData.status || 0);
            if (businessData.phone) formData.append('phone', businessData.phone);
            if (businessData.email) formData.append('email', businessData.email);
            if (businessData.whatsApp) formData.append('whatsApp', businessData.whatsApp);
            if (businessData.instagram) formData.append('instagram', businessData.instagram);
            if (businessData.facebook) formData.append('facebook', businessData.facebook);
            if (businessData.website) formData.append('website', businessData.website);
            formData.append('ownerId', businessData.ownerId);
            formData.append('latitude', businessData.latitude || 0);
            formData.append('longitude', businessData.longitude || 0);
            if (businessData.address) formData.append('address', businessData.address);

            // Add files
            if (businessData.imageFile) formData.append('imageFile', businessData.imageFile);
            if (businessData.logoFile) formData.append('logoFile', businessData.logoFile);

            const response = await apiClient.post('/businesses', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Update business
    async update(id, businessData) {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', businessData.name);
            if (businessData.description) formData.append('description', businessData.description);
            formData.append('status', businessData.status || 0);
            if (businessData.phone) formData.append('phone', businessData.phone);
            if (businessData.email) formData.append('email', businessData.email);
            if (businessData.whatsApp) formData.append('whatsApp', businessData.whatsApp);
            if (businessData.instagram) formData.append('instagram', businessData.instagram);
            if (businessData.facebook) formData.append('facebook', businessData.facebook);
            if (businessData.website) formData.append('website', businessData.website);
            formData.append('ownerId', businessData.ownerId);
            formData.append('latitude', businessData.latitude || 0);
            formData.append('longitude', businessData.longitude || 0);
            if (businessData.address) formData.append('address', businessData.address);

            // Add files and keep existing flags
            if (businessData.imageFile) formData.append('imageFile', businessData.imageFile);
            if (businessData.logoFile) formData.append('logoFile', businessData.logoFile);
            formData.append('keepExistingImage', businessData.keepExistingImage !== false);
            formData.append('keepExistingLogo', businessData.keepExistingLogo !== false);

            const response = await apiClient.put(`/businesses/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Delete business
    async delete(id) {
        try {
            const response = await apiClient.delete(`/businesses/${id}`);
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

export default businessService;