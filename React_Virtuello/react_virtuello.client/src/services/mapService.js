// =============================================================================
// MAP SERVICE - Location-based API calls for businesses and events
// =============================================================================
import apiClient from './apiClient';

export const mapService = {
    // =============================================================================
    // BUSINESSES IN BOUNDS
    // =============================================================================

    /**
     * Get businesses within specified geographic bounds
     * @param {Object} bounds - Geographic bounds
     * @param {number} bounds.north - North latitude
     * @param {number} bounds.south - South latitude  
     * @param {number} bounds.east - East longitude
     * @param {number} bounds.west - West longitude
     * @param {Object} filters - Optional filters
     * @param {Array} filters.tags - Tag IDs to filter by
     * @param {string} filters.searchQuery - Search query
     * @param {number} filters.status - Business status filter
     * @param {AbortSignal} signal - Abort signal for cancellation
     */
    async getBusinessesInBounds({
        bounds,
        filters = {},
        signal = null
    }) {
        try {
            const params = new URLSearchParams();

            // Add bounds parameters
            if (bounds) {
                params.append('north', bounds.north.toString());
                params.append('south', bounds.south.toString());
                params.append('east', bounds.east.toString());
                params.append('west', bounds.west.toString());
            }

            // Add filter parameters
            if (filters.tags && filters.tags.length > 0) {
                filters.tags.forEach(tagId => params.append('tags', tagId));
            }
            if (filters.searchQuery) {
                params.append('search', filters.searchQuery);
            }
            if (filters.status !== undefined) {
                params.append('status', filters.status);
            }

            const response = await apiClient.get(`/map/businesses/bounds?${params.toString()}`, { signal });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // =============================================================================
    // EVENTS IN BOUNDS
    // =============================================================================

    /**
     * Get events within specified geographic bounds
     * @param {Object} bounds - Geographic bounds
     * @param {number} bounds.north - North latitude
     * @param {number} bounds.south - South latitude
     * @param {number} bounds.east - East longitude
     * @param {number} bounds.west - West longitude
     * @param {Object} filters - Optional filters
     * @param {Array} filters.categories - Category IDs to filter by
     * @param {string} filters.searchQuery - Search query
     * @param {number} filters.status - Event status filter
     * @param {number} filters.type - Event type filter
     * @param {Date} filters.startDate - Start date filter
     * @param {Date} filters.endDate - End date filter
     * @param {AbortSignal} signal - Abort signal for cancellation
     */
    async getEventsInBounds({
        bounds,
        filters = {},
        signal = null
    }) {
        try {
            const params = new URLSearchParams();

            // Add bounds parameters
            if (bounds) {
                params.append('north', bounds.north.toString());
                params.append('south', bounds.south.toString());
                params.append('east', bounds.east.toString());
                params.append('west', bounds.west.toString());
            }

            // Add filter parameters
            if (filters.categories && filters.categories.length > 0) {
                filters.categories.forEach(categoryId => params.append('categories', categoryId));
            }
            if (filters.searchQuery) {
                params.append('search', filters.searchQuery);
            }
            if (filters.status !== undefined) {
                params.append('status', filters.status);
            }
            if (filters.type !== undefined) {
                params.append('type', filters.type);
            }
            if (filters.startDate) {
                params.append('startDate', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate.toISOString());
            }

            const response = await apiClient.get(`/map/events/bounds?${params.toString()}`, { signal });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // =============================================================================
    // BUSINESSES NEAR LOCATION
    // =============================================================================

    /**
     * Get businesses near a specific location
     * @param {Object} location - Center location
     * @param {number} location.latitude - Center latitude
     * @param {number} location.longitude - Center longitude
     * @param {number} radiusKm - Search radius in kilometers (default: 10)
     * @param {Object} filters - Optional filters
     * @param {Array} filters.tags - Tag IDs to filter by
     * @param {string} filters.searchQuery - Search query
     * @param {number} filters.status - Business status filter
     * @param {number} limit - Maximum number of results (default: 50)
     * @param {AbortSignal} signal - Abort signal for cancellation
     */
    async getBusinessesNearLocation({
        location,
        radiusKm = 10,
        filters = {},
        limit = 50,
        signal = null
    }) {
        try {
            const params = new URLSearchParams();

            // Add location parameters
            if (location) {
                params.append('latitude', location.latitude.toString());
                params.append('longitude', location.longitude.toString());
                params.append('radiusKm', radiusKm.toString());
            }

            // Add limit
            params.append('limit', limit.toString());

            // Add filter parameters
            if (filters.tags && filters.tags.length > 0) {
                filters.tags.forEach(tagId => params.append('tags', tagId));
            }
            if (filters.searchQuery) {
                params.append('search', filters.searchQuery);
            }
            if (filters.status !== undefined) {
                params.append('status', filters.status);
            }

            const response = await apiClient.get(`/map/businesses/near?${params.toString()}`, { signal });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // =============================================================================
    // EVENTS NEAR LOCATION
    // =============================================================================

    /**
     * Get events near a specific location
     * @param {Object} location - Center location
     * @param {number} location.latitude - Center latitude
     * @param {number} location.longitude - Center longitude
     * @param {number} radiusKm - Search radius in kilometers (default: 10)
     * @param {Object} filters - Optional filters
     * @param {Array} filters.categories - Category IDs to filter by
     * @param {string} filters.searchQuery - Search query
     * @param {number} filters.status - Event status filter
     * @param {number} filters.type - Event type filter
     * @param {Date} filters.startDate - Start date filter
     * @param {Date} filters.endDate - End date filter
     * @param {number} limit - Maximum number of results (default: 50)
     * @param {AbortSignal} signal - Abort signal for cancellation
     */
    async getEventsNearLocation({
        location,
        radiusKm = 10,
        filters = {},
        limit = 50,
        signal = null
    }) {
        try {
            const params = new URLSearchParams();

            // Add location parameters
            if (location) {
                params.append('latitude', location.latitude.toString());
                params.append('longitude', location.longitude.toString());
                params.append('radiusKm', radiusKm.toString());
            }

            // Add limit
            params.append('limit', limit.toString());

            // Add filter parameters
            if (filters.categories && filters.categories.length > 0) {
                filters.categories.forEach(categoryId => params.append('categories', categoryId));
            }
            if (filters.searchQuery) {
                params.append('search', filters.searchQuery);
            }
            if (filters.status !== undefined) {
                params.append('status', filters.status);
            }
            if (filters.type !== undefined) {
                params.append('type', filters.type);
            }
            if (filters.startDate) {
                params.append('startDate', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate.toISOString());
            }

            const response = await apiClient.get(`/map/events/near?${params.toString()}`, { signal });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    /**
     * Get both businesses and events in bounds (combined call)
     * @param {Object} bounds - Geographic bounds
     * @param {Object} filters - Optional filters
     * @param {AbortSignal} signal - Abort signal for cancellation
     */
    async getMapDataInBounds({
        bounds,
        filters = {},
        signal = null
    }) {
        try {
            const {
                showBusinesses = true,
                showEvents = true,
                ...otherFilters
            } = filters;

            const requests = [];

            if (showBusinesses) {
                requests.push(
                    this.getBusinessesInBounds({ bounds, filters: otherFilters, signal })
                        .then(data => ({ type: 'businesses', ...data }))
                        .catch(error => ({ type: 'businesses', success: false, error: error.message, data: [] }))
                );
            }

            if (showEvents) {
                requests.push(
                    this.getEventsInBounds({ bounds, filters: otherFilters, signal })
                        .then(data => ({ type: 'events', ...data }))
                        .catch(error => ({ type: 'events', success: false, error: error.message, data: [] }))
                );
            }

            const results = await Promise.all(requests);

            // Combine results
            const combinedData = {
                businesses: [],
                events: [],
                success: true,
                errors: []
            };

            results.forEach(result => {
                if (result.success) {
                    combinedData[result.type] = result.data || [];
                } else {
                    combinedData.errors.push(`${result.type}: ${result.error}`);
                }
            });

            return combinedData;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Get both businesses and events near location (combined call)
     * @param {Object} location - Center location
     * @param {number} radiusKm - Search radius in kilometers
     * @param {Object} filters - Optional filters
     * @param {number} limit - Maximum number of results per type
     * @param {AbortSignal} signal - Abort signal for cancellation
     */
    async getMapDataNearLocation({
        location,
        radiusKm = 10,
        filters = {},
        limit = 50,
        signal = null
    }) {
        try {
            const {
                showBusinesses = true,
                showEvents = true,
                ...otherFilters
            } = filters;

            const requests = [];

            if (showBusinesses) {
                requests.push(
                    this.getBusinessesNearLocation({ location, radiusKm, filters: otherFilters, limit, signal })
                        .then(data => ({ type: 'businesses', ...data }))
                        .catch(error => ({ type: 'businesses', success: false, error: error.message, data: [] }))
                );
            }

            if (showEvents) {
                requests.push(
                    this.getEventsNearLocation({ location, radiusKm, filters: otherFilters, limit, signal })
                        .then(data => ({ type: 'events', ...data }))
                        .catch(error => ({ type: 'events', success: false, error: error.message, data: [] }))
                );
            }

            const results = await Promise.all(requests);

            // Combine results
            const combinedData = {
                businesses: [],
                events: [],
                success: true,
                errors: []
            };

            results.forEach(result => {
                if (result.success) {
                    combinedData[result.type] = result.data || [];
                } else {
                    combinedData.errors.push(`${result.type}: ${result.error}`);
                }
            });

            return combinedData;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {number} lat1 - First point latitude
     * @param {number} lon1 - First point longitude  
     * @param {number} lat2 - Second point latitude
     * @param {number} lon2 - Second point longitude
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees to convert
     * @returns {number} Radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Create bounds from center point and radius
     * @param {Object} center - Center coordinates
     * @param {number} center.latitude - Center latitude
     * @param {number} center.longitude - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @returns {Object} Bounds object
     */
    createBoundsFromRadius(center, radiusKm) {
        const latDelta = radiusKm / 111; // Approximate: 1 degree latitude ≈ 111 km
        const lonDelta = radiusKm / (111 * Math.cos(this.toRadians(center.latitude)));

        return {
            north: center.latitude + latDelta,
            south: center.latitude - latDelta,
            east: center.longitude + lonDelta,
            west: center.longitude - lonDelta
        };
    },

    // =============================================================================
    // ERROR HANDLING
    // =============================================================================

    handleError(error) {
        const defaultMessage = 'An error occurred while fetching map data';

        if (error.name === 'AbortError') {
            return new Error('Request was cancelled');
        }

        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const message = error.response.data?.message ||
                error.response.data?.errors?.[0] ||
                defaultMessage;

            if (status === 401) {
                return new Error('Authentication required');
            } else if (status === 403) {
                return new Error('Access denied');
            } else if (status === 404) {
                return new Error('Map data not found');
            } else if (status >= 500) {
                return new Error('Server error. Please try again later.');
            }

            return new Error(message);
        } else if (error.request) {
            // Request was made but no response received
            return new Error('Network error. Please check your connection.');
        } else {
            // Something else happened
            return new Error(error.message || defaultMessage);
        }
    }
};