import apiClient from './apiClient';

// =============================================================================
// EVENT CATEGORIES SERVICE
// =============================================================================
export const eventCategoriesService = {
    // Get all event categories
    async getAll() {
        try {
            const response = await apiClient.get('/eventcategories');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get event category by ID
    async getById(id) {
        try {
            const response = await apiClient.get(`/eventcategories/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get events by category with pagination
    async getEventsByCategory(categoryId, page = 1, pageSize = 20) {
        try {
            const response = await apiClient.get(`/eventcategories/${categoryId}/events?page=${page}&pageSize=${pageSize}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Get all categories with event counts
    async getAllWithEventCounts() {
        try {
            const response = await apiClient.get('/eventcategories/with-event-counts');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Create new event category
    async create(categoryData) {
        try {
            const response = await apiClient.post('/eventcategories', {
                name: categoryData.name
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Update event category
    async update(id, categoryData) {
        try {
            const response = await apiClient.put(`/eventcategories/${id}`, {
                name: categoryData.name
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Delete event category
    async delete(id) {
        try {
            const response = await apiClient.delete(`/eventcategories/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Validation helper - check if category name is available
    async checkNameAvailability(name, excludeId = null) {
        try {
            const categories = await this.getAll();
            if (!categories.success || !categories.data) {
                return false;
            }

            const existingCategory = categories.data.find(category =>
                category.name.toLowerCase() === name.toLowerCase() &&
                (!excludeId || category.id !== excludeId)
            );

            return !existingCategory;
        } catch (error) {
            console.warn('Could not check name availability:', error);
            return true; // Assume available if check fails
        }
    },

    // Get category statistics
    async getCategoryStats(categoryId) {
        try {
            const eventsResponse = await this.getEventsByCategory(categoryId, 1, 1);
            const categoryResponse = await this.getById(categoryId);

            if (!eventsResponse.success || !categoryResponse.success) {
                throw new Error('Failed to fetch category statistics');
            }

            return {
                category: categoryResponse.data,
                totalEvents: eventsResponse.totalCount || 0,
                hasEvents: (eventsResponse.totalCount || 0) > 0
            };
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Bulk operations
    async createMultiple(categoriesData) {
        try {
            const promises = categoriesData.map(categoryData => this.create(categoryData));
            const results = await Promise.allSettled(promises);

            const successful = results.filter(result => result.status === 'fulfilled');
            const failed = results.filter(result => result.status === 'rejected');

            return {
                success: successful.length > 0,
                successful: successful.map(result => result.value),
                failed: failed.map(result => result.reason),
                totalCreated: successful.length,
                totalFailed: failed.length
            };
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Search/filter categories
    async searchCategories(searchTerm) {
        try {
            const response = await this.getAll();
            if (!response.success || !response.data) {
                return { success: false, data: [] };
            }

            const filteredCategories = response.data.filter(category =>
                category.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return {
                success: true,
                data: filteredCategories
            };
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

// =============================================================================
// CONSTANTS & UTILITIES
// =============================================================================

// Default categories that might be useful for initialization
export const DEFAULT_EVENT_CATEGORIES = [
    { name: 'Conference' },
    { name: 'Workshop' },
    { name: 'Exhibition' },
    { name: 'Concert' },
    { name: 'Sports' },
    { name: 'Festival' },
    { name: 'Networking' },
    { name: 'Cultural' },
    { name: 'Business' },
    { name: 'Educational' },
    { name: 'Entertainment' },
    { name: 'Community' }
];

// Validation rules
export const CATEGORY_VALIDATION = {
    name: {
        minLength: 1,
        maxLength: 100,
        required: true,
        pattern: /^[a-zA-Z0-9\s\-&.()]+$/ // Allow letters, numbers, spaces, and common punctuation
    }
};

// Utility function to validate category data
export const validateCategoryData = (categoryData) => {
    const errors = [];

    if (!categoryData.name) {
        errors.push('Category name is required');
    } else {
        if (categoryData.name.length < CATEGORY_VALIDATION.name.minLength) {
            errors.push(`Category name must be at least ${CATEGORY_VALIDATION.name.minLength} character long`);
        }
        if (categoryData.name.length > CATEGORY_VALIDATION.name.maxLength) {
            errors.push(`Category name must be no more than ${CATEGORY_VALIDATION.name.maxLength} characters long`);
        }
        if (!CATEGORY_VALIDATION.name.pattern.test(categoryData.name)) {
            errors.push('Category name contains invalid characters');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Utility function to format category data for display
export const formatCategoryForDisplay = (category) => {
    return {
        ...category,
        displayName: category.name,
        slug: category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
    };
};

export default eventCategoriesService;