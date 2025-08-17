// =============================================================================
// MAP DATA SERVICE - Viewport-based API calls for businesses and events
// =============================================================================
import apiClient from './../../../../services/apiClient';
import { businessService } from './../../../../services/businessService';
import { eventService } from './../../../../services/eventService';
import { mapService } from './../../../../services/mapService';
import { tagService } from './../../../../services/tagService';
import { eventCategoriesService } from './../../../../services/eventCategoriesService';

const validateBounds = (bounds) => {
    if (!bounds) {
        return { isValid: false, error: 'Bounds is null or undefined' };
    }

    const requiredProps = ['north', 'south', 'east', 'west'];
    const missingProps = requiredProps.filter(prop =>
        bounds[prop] === undefined || bounds[prop] === null || isNaN(bounds[prop])
    );

    if (missingProps.length > 0) {
        return {
            isValid: false,
            error: `Missing or invalid bounds properties: ${missingProps.join(', ')}`
        };
    }

    // Basic geographic validation
    if (bounds.north <= bounds.south) {
        return { isValid: false, error: 'North must be greater than south' };
    }

    if (bounds.east <= bounds.west) {
        return { isValid: false, error: 'East must be greater than west' };
    }

    return { isValid: true };
};

export const mapDataService = {
    // Get map data based on viewport bounds and filters
    async getMapData({
        bounds = null,
        location = null,
        radius = 10,
        filters = {},
        signal = null
    } = {}) {
        try {
            const {
                selectedTags = [],
                selectedCategories = [],
                searchQuery = '',
                showBusinesses = true,
                showEvents = true,
                quickFilters = {}
            } = filters;

            // Prepare API parameters
            const params = new URLSearchParams();

            // Add bounds if available
            if (bounds) {
                params.append('north', bounds.north.toString());
                params.append('south', bounds.south.toString());
                params.append('east', bounds.east.toString());
                params.append('west', bounds.west.toString());
            }

            // Add location and radius if available
            if (location) {
                params.append('lat', location.lat.toString());
                params.append('lng', location.lng.toString());
                params.append('radius', radius.toString());
            }

            // Add search query
            if (searchQuery.trim()) {
                params.append('q', searchQuery.trim());
            }

            // Add tag filters
            if (selectedTags.length > 0) {
                params.append('tags', selectedTags.join(','));
            }

            // Add category filters
            if (selectedCategories.length > 0) {
                params.append('categories', selectedCategories.join(','));
            }

            // Add quick filters
            Object.entries(quickFilters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, 'true');
                }
            });

            // Create promises for concurrent requests
            const requests = [];

            // Fetch businesses if enabled
            if (showBusinesses) {
                requests.push(
                    apiClient.get(`/businesses/map?${params.toString()}`, { signal })
                        .then(response => ({ type: 'businesses', data: response.data }))
                        .catch(error => ({ type: 'businesses', error: error.message, data: [] }))
                );
            }

            // Fetch events if enabled
            if (showEvents) {
                requests.push(
                    apiClient.get(`/events/map?${params.toString()}`, { signal })
                        .then(response => ({ type: 'events', data: response.data }))
                        .catch(error => ({ type: 'events', error: error.message, data: [] }))
                );
            }

            // Fetch tags and categories if not filtered
            if (selectedTags.length === 0) {
                requests.push(
                    tagService.getAll()
                        .then(response => ({ type: 'tags', data: response.data || response }))
                        .catch(error => ({ type: 'tags', error: error.message, data: [] }))
                );
            }

            if (selectedCategories.length === 0) {
                requests.push(
                    eventCategoriesService.getAll()
                        .then(response => ({ type: 'categories', data: response.data || response }))
                        .catch(error => ({ type: 'categories', error: error.message, data: [] }))
                );
            }

            // Execute all requests concurrently
            const results = await Promise.all(requests);

            // Process results
            const data = {
                businesses: [],
                events: [],
                tags: [],
                categories: []
            };

            const errors = [];

            results.forEach(result => {
                if (result.error) {
                    errors.push(`${result.type}: ${result.error}`);
                } else {
                    data[result.type] = Array.isArray(result.data) ? result.data :
                        result.data?.data || result.data || [];
                }
            });

            // Log any errors but don't fail the entire request
            if (errors.length > 0) {
                console.warn('Some map data requests failed:', errors);
            }

            return {
                success: true,
                data,
                errors: errors.length > 0 ? errors : null,
                bounds,
                location,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('Map data service error:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch map data',
                data: {
                    businesses: [],
                    events: [],
                    tags: [],
                    categories: []
                }
            };
        }
    },

    async getBusinessesInBounds(bounds, filters = {}) {
        try {
            // Validate bounds before processing
            if (!bounds || typeof bounds.north === 'undefined' || typeof bounds.south === 'undefined' ||
                typeof bounds.east === 'undefined' || typeof bounds.west === 'undefined') {
                console.warn('Invalid bounds provided to getBusinessesInBounds:', bounds);
                return {
                    success: true,
                    data: []
                };
            }

            const params = new URLSearchParams();

            // Add bounds parameters - now safe to access
            params.append('north', bounds.north.toString());
            params.append('south', bounds.south.toString());
            params.append('east', bounds.east.toString());
            params.append('west', bounds.west.toString());

            // Add filter parameters
            if (filters.tags && Array.isArray(filters.tags)) {
                filters.tags.forEach(tagId => params.append('tags', tagId));
            }
            if (filters.search) {
                params.append('search', filters.search);
            }
            if (filters.status !== undefined) {
                params.append('status', filters.status);
            }

            const response = await apiClient.get(`/map/businesses/bounds?${params.toString()}`);
            return {
                success: true,
                data: response.data?.data || response.data || []
            };
        } catch (error) {
            console.error('Error fetching businesses in bounds:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },

    // UPDATE: getEventsInBounds method (around line 202)
    async getEventsInBounds(bounds, filters = {}) {
        try {
            // CRITICAL: Validate bounds before proceeding
            // Validate bounds before processing
            if (!bounds || typeof bounds.north === 'undefined' || typeof bounds.south === 'undefined' ||
                typeof bounds.east === 'undefined' || typeof bounds.west === 'undefined') {
                console.warn('Invalid bounds provided to getEventsInBounds:', bounds);
                return {
                    success: true,
                    data: []
                };
            }

            const params = new URLSearchParams();

            // Add bounds parameters - now safe to access
            params.append('north', bounds.north.toString());
            params.append('south', bounds.south.toString());
            params.append('east', bounds.east.toString());
            params.append('west', bounds.west.toString());

            // Add filter parameters
            if (filters.categories && Array.isArray(filters.categories)) {
                filters.categories.forEach(categoryId => params.append('categories', categoryId));
            }
            if (filters.search) {
                params.append('search', filters.search);
            }
            if (filters.status !== undefined) {
                params.append('status', filters.status);
            }
            if (filters.type !== undefined) {
                params.append('type', filters.type);
            }
            if (filters.startDate) {
                params.append('startDate', filters.startDate instanceof Date ?
                    filters.startDate.toISOString() : filters.startDate);
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate instanceof Date ?
                    filters.endDate.toISOString() : filters.endDate);
            }

            const response = await apiClient.get(`/map/events/bounds?${params.toString()}`);
            return {
                success: true,
                data: response.data?.data || response.data || []
            };
        } catch (error) {
            console.error('Error fetching events in bounds:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },

    // Get businesses near location
    async getBusinessesNearLocation(lat, lng, radius = 10, filters = {}) {
        try {
            const params = new URLSearchParams();

            // Add location parameters (matching our controller parameter names)
            params.append('latitude', lat.toString());
            params.append('longitude', lng.toString());
            params.append('radiusKm', radius.toString());

            // Add limit parameter
            params.append('limit', filters.limit || '50');

            // Add filter parameters
            if (filters.tags && Array.isArray(filters.tags)) {
                filters.tags.forEach(tagId => params.append('tags', tagId));
            }
            if (filters.search) {
                params.append('search', filters.search);
            }
            if (filters.status !== undefined) {
                params.append('status', filters.status);
            }

            const response = await apiClient.get(`/map/businesses/near?${params.toString()}`);
            return {
                success: true,
                data: response.data?.data || response.data || []
            };
        } catch (error) {
            console.error('Error fetching businesses near location:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },

    // Get events near location
    async getEventsNearLocation(lat, lng, radius = 10, filters = {}) {
        try {
            const params = new URLSearchParams();

            // Add location parameters (matching our controller parameter names)
            params.append('latitude', lat.toString());
            params.append('longitude', lng.toString());
            params.append('radiusKm', radius.toString());

            // Add limit parameter
            params.append('limit', filters.limit || '50');

            // Add filter parameters
            if (filters.categories && Array.isArray(filters.categories)) {
                filters.categories.forEach(categoryId => params.append('categories', categoryId));
            }
            if (filters.search) {
                params.append('search', filters.search);
            }
            if (filters.status !== undefined) {
                params.append('status', filters.status);
            }
            if (filters.type !== undefined) {
                params.append('type', filters.type);
            }
            if (filters.startDate) {
                params.append('startDate', filters.startDate instanceof Date ?
                    filters.startDate.toISOString() : filters.startDate);
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate instanceof Date ?
                    filters.endDate.toISOString() : filters.endDate);
            }

            const response = await apiClient.get(`/map/events/near?${params.toString()}`);
            return {
                success: true,
                data: response.data?.data || response.data || []
            };
        } catch (error) {
            console.error('Error fetching events near location:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },

    // Search businesses and events
    async searchMapItems(query, bounds = null, location = null, radius = 10) {
        try {
            const params = new URLSearchParams({
                q: query
            });

            // Add location constraints if available
            if (bounds) {
                params.append('north', bounds.north.toString());
                params.append('south', bounds.south.toString());
                params.append('east', bounds.east.toString());
                params.append('west', bounds.west.toString());
            } else if (location) {
                params.append('lat', location.lat.toString());
                params.append('lng', location.lng.toString());
                params.append('radius', radius.toString());
            }

            // Search both businesses and events concurrently
            const [businessResults, eventResults] = await Promise.allSettled([
                apiClient.get(`/businesses/search?${params.toString()}`),
                apiClient.get(`/events/search?${params.toString()}`)
            ]);

            const businesses = businessResults.status === 'fulfilled' ?
                businessResults.value.data : [];
            const events = eventResults.status === 'fulfilled' ?
                eventResults.value.data : [];

            return {
                success: true,
                data: {
                    businesses,
                    events,
                    total: businesses.length + events.length
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: {
                    businesses: [],
                    events: [],
                    total: 0
                }
            };
        }
    },

    // Get autocomplete suggestions for search
    async getSearchSuggestions(query, bounds = null, limit = 10) {
        try {
            const params = new URLSearchParams({
                q: query,
                limit: limit.toString()
            });

            if (bounds) {
                params.append('north', bounds.north.toString());
                params.append('south', bounds.south.toString());
                params.append('east', bounds.east.toString());
                params.append('west', bounds.west.toString());
            }

            const response = await apiClient.get(`/search/suggestions?${params.toString()}`);
            return {
                success: true,
                suggestions: response.data || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestions: []
            };
        }
    },

    // Get popular items in area
    async getPopularItems(bounds = null, location = null, radius = 10, limit = 20) {
        try {
            const params = new URLSearchParams({
                limit: limit.toString()
            });

            if (bounds) {
                params.append('north', bounds.north.toString());
                params.append('south', bounds.south.toString());
                params.append('east', bounds.east.toString());
                params.append('west', bounds.west.toString());
            } else if (location) {
                params.append('lat', location.lat.toString());
                params.append('lng', location.lng.toString());
                params.append('radius', radius.toString());
            }

            const [businessResults, eventResults] = await Promise.allSettled([
                apiClient.get(`/businesses/popular?${params.toString()}`),
                apiClient.get(`/events/popular?${params.toString()}`)
            ]);

            const businesses = businessResults.status === 'fulfilled' ?
                businessResults.value.data : [];
            const events = eventResults.status === 'fulfilled' ?
                eventResults.value.data : [];

            return {
                success: true,
                data: {
                    businesses,
                    events
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: {
                    businesses: [],
                    events: []
                }
            };
        }
    },

    // Get recently added items
    async getRecentItems(bounds = null, location = null, radius = 10, days = 30, limit = 20) {
        try {
            const params = new URLSearchParams({
                days: days.toString(),
                limit: limit.toString()
            });

            if (bounds) {
                params.append('north', bounds.north.toString());
                params.append('south', bounds.south.toString());
                params.append('east', bounds.east.toString());
                params.append('west', bounds.west.toString());
            } else if (location) {
                params.append('lat', location.lat.toString());
                params.append('lng', location.lng.toString());
                params.append('radius', radius.toString());
            }

            const [businessResults, eventResults] = await Promise.allSettled([
                apiClient.get(`/businesses/recent?${params.toString()}`),
                apiClient.get(`/events/recent?${params.toString()}`)
            ]);

            const businesses = businessResults.status === 'fulfilled' ?
                businessResults.value.data : [];
            const events = eventResults.status === 'fulfilled' ?
                eventResults.value.data : [];

            return {
                success: true,
                data: {
                    businesses,
                    events
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: {
                    businesses: [],
                    events: []
                }
            };
        }
    },

    // Get map statistics for current view
    async getMapStatistics(bounds = null, location = null, radius = 10) {
        try {
            const params = new URLSearchParams();

            if (bounds) {
                params.append('north', bounds.north.toString());
                params.append('south', bounds.south.toString());
                params.append('east', bounds.east.toString());
                params.append('west', bounds.west.toString());
            } else if (location) {
                params.append('lat', location.lat.toString());
                params.append('lng', location.lng.toString());
                params.append('radius', radius.toString());
            }

            const response = await apiClient.get(`/map/statistics?${params.toString()}`);
            return {
                success: true,
                statistics: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                statistics: {
                    businessCount: 0,
                    eventCount: 0,
                    categoryBreakdown: {},
                    tagBreakdown: {}
                }
            };
        }
    },

    // Prefetch data for expanded bounds (for smoother user experience)
    async prefetchExpandedData(bounds, expansionFactor = 0.3) {
        try {
            const { north, south, east, west } = bounds;
            const latExpansion = (north - south) * expansionFactor;
            const lngExpansion = (east - west) * expansionFactor;

            const expandedBounds = {
                north: north + latExpansion,
                south: south - latExpansion,
                east: east + lngExpansion,
                west: west - lngExpansion
            };

            // Get data for expanded area but don't wait for it
            this.getMapData({ bounds: expandedBounds })
                .then(result => {
                    // Data is now cached for when user pans/zooms
                    console.debug('Prefetched data for expanded bounds');
                })
                .catch(error => {
                    console.debug('Prefetch failed:', error.message);
                });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};