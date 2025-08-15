// =============================================================================
// EVENTS SERVICE
// =============================================================================
import apiClient from './apiClient';

export const eventService = {
    // Get all events with pagination
    async getAll(page = 1, pageSize = 20) {
        try {
            const response = await apiClient.get(`/events?page=${page}&pageSize=${pageSize}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get event by ID
    async getById(id) {
        try {
            const response = await apiClient.get(`/events/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get events by organizer
    async getByOrganizer(organizerId) {
        try {
            const response = await apiClient.get(`/events/organizer/${organizerId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Search events
    async search(query) {
        try {
            const response = await apiClient.get(`/events/search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Create new event
    async create(eventData) {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', eventData.name);
            if (eventData.description) formData.append('description', eventData.description);
            formData.append('start', eventData.start);
            if (eventData.end) formData.append('end', eventData.end);
            formData.append('status', eventData.status || 0);
            formData.append('type', eventData.type || 0);
            formData.append('organizerId', eventData.organizerId);
            formData.append('eventCategoryId', eventData.eventCategoryId);
            formData.append('latitude', eventData.latitude || 0);
            formData.append('longitude', eventData.longitude || 0);
            if (eventData.address) formData.append('address', eventData.address);

            // Add file
            if (eventData.pictureFile) formData.append('pictureFile', eventData.pictureFile);

            const response = await apiClient.post('/events', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Update event
    async update(id, eventData) {
        try {
            const formData = new FormData();
            
            // Add text fields
            formData.append('name', eventData.name);
            if (eventData.description) formData.append('description', eventData.description);
            formData.append('start', eventData.start);
            if (eventData.end) formData.append('end', eventData.end);
            formData.append('status', eventData.status || 0);
            formData.append('type', eventData.type || 0);
            formData.append('organizerId', eventData.organizerId);
            formData.append('eventCategoryId', eventData.eventCategoryId);
            formData.append('latitude', eventData.latitude || 0);
            formData.append('longitude', eventData.longitude || 0);
            if (eventData.address) formData.append('address', eventData.address);

            // Add file and keep existing flag
            if (eventData.pictureFile) formData.append('pictureFile', eventData.pictureFile);
            formData.append('keepExistingPicture', eventData.keepExistingPicture !== false);

            const response = await apiClient.put(`/events/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Delete event
    async delete(id) {
        try {
            const response = await apiClient.delete(`/events/${id}`);
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

export default eventService;