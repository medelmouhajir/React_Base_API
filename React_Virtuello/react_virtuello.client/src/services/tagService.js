
// =============================================================================
// TAGS SERVICE
// =============================================================================
import apiClient from './apiClient';

export const tagService = {
    // Get all tags
    async getAll() {
        try {
            const response = await apiClient.get('/tags');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get tag by ID
    async getById(id) {
        try {
            const response = await apiClient.get(`/tags/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Create new tag
    async create(tagData) {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', tagData.name);

            // Add file
            if (tagData.iconFile) formData.append('iconFile', tagData.iconFile);

            const response = await apiClient.post('/tags', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Update tag
    async update(id, tagData) {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', tagData.name);

            // Add file and keep existing flag
            if (tagData.iconFile) formData.append('iconFile', tagData.iconFile);
            formData.append('keepExistingIcon', tagData.keepExistingIcon !== false);

            const response = await apiClient.put(`/tags/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Delete tag
    async delete(id) {
        try {
            const response = await apiClient.delete(`/tags/${id}`);
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

export default tagService;