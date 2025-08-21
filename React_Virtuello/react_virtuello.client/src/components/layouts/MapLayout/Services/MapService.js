/**
 * Enhanced Map Service for Virtuello Project
 * Handles all API calls related to map data, location services, and filtering
 * 
 * @author WAN SOLUTIONS
 * @version 2.0.0
 */

import apiClient from '../../services/apiClient';
import { ModelFactories, ValidationHelpers } from '../Models/MapModels';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // API endpoints
    endpoints: {
        businesses: '/map/businesses',
        events: '/map/events',
        geocode: '/map/geocode',
        reverseGeocode: '/map/reverse-geocode'
    },

    // Request defaults
    defaults: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        cacheTimeout: 300000, // 5 minutes
        maxConcurrentRequests: 5
    },

    // Data limits
    limits: {
        maxBusinessesPerRequest: 1000,
        maxEventsPerRequest: 1000,
        maxDistance: 100, // km
        maxBoundsArea: 10000 // square km
    }
};

// =============================================================================
// REQUEST QUEUE MANAGEMENT
// =============================================================================

class RequestQueue {
    constructor(maxConcurrent = 5) {
        this.queue = [];
        this.active = new Set();
        this.maxConcurrent = maxConcurrent;
    }

    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.active.size >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        const { requestFn, resolve, reject } = this.queue.shift();
        const requestId = Symbol('request');

        this.active.add(requestId);

        try {
            const result = await requestFn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.active.delete(requestId);
            this.process(); // Process next request
        }
    }
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

class MapCache {
    constructor(defaultTtl = 300000) { // 5 minutes
        this.cache = new Map();
        this.defaultTtl = defaultTtl;
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Clean every minute
    }

    set(key, value, ttl = this.defaultTtl) {
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl,
            hits: 0
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }

        item.hits++;
        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }

    getStats() {
        const items = Array.from(this.cache.values());
        return {
            size: this.cache.size,
            totalHits: items.reduce((sum, item) => sum + item.hits, 0),
            avgHits: items.length > 0 ? items.reduce((sum, item) => sum + item.hits, 0) / items.length : 0
        };
    }

    destroy() {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}

// =============================================================================
// MAIN MAP SERVICE CLASS
// =============================================================================

class MapService {
    constructor() {
        this.requestQueue = new RequestQueue(CONFIG.defaults.maxConcurrentRequests);
        this.cache = new MapCache(CONFIG.defaults.cacheTimeout);
        this.abortControllers = new Map();
        this.retryDelays = new Map();
    }

    // =========================================================================
    // BUSINESS DATA METHODS
    // =========================================================================

    /**
     * Get businesses within specified geographic bounds
     */
    async getBusinessesInBounds(bounds, filters = {}, options = {}) {
        const {
            useCache = true,
            signal = null,
            transform = true
        } = options;

        // Validate bounds
        if (!ValidationHelpers.isValidBounds(bounds)) {
            throw new Error('Invalid bounds provided');
        }

        // Check bounds area limit
        const area = this._calculateBoundsArea(bounds);
        if (area > CONFIG.limits.maxBoundsArea) {
            throw new Error(`Bounds area too large: ${area}km² (max: ${CONFIG.limits.maxBoundsArea}km²)`);
        }

        // Create cache key
        const cacheKey = this._createCacheKey('businesses-bounds', { bounds, filters });

        // Check cache
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Build request parameters
        const params = new URLSearchParams();
        params.append('north', bounds.north.toString());
        params.append('south', bounds.south.toString());
        params.append('east', bounds.east.toString());
        params.append('west', bounds.west.toString());

        // Add filters
        this._addFiltersToParams(params, filters, 'business');

        // Create request function
        const requestFn = async () => {
            const response = await apiClient.get(
                `${CONFIG.endpoints.businesses}/bounds?${params.toString()}`,
                {
                    signal,
                    timeout: CONFIG.defaults.timeout
                }
            );

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch businesses');
            }

            let businesses = response.data.data || [];

            // Transform data if requested
            if (transform) {
                businesses = businesses.map(business => {
                    const transformed = ModelFactories.createBusinessFromApi(business);
                    // Calculate distance if user location available
                    if (filters.userLocation) {
                        transformed.distance = this._calculateDistance(
                            filters.userLocation.lat,
                            filters.userLocation.lng,
                            business.latitude,
                            business.longitude
                        );
                        transformed.bearing = this._calculateBearing(
                            filters.userLocation.lat,
                            filters.userLocation.lng,
                            business.latitude,
                            business.longitude
                        );
                    }
                    return transformed;
                });
            }

            const result = {
                success: true,
                data: businesses,
                count: businesses.length,
                bounds,
                filters,
                timestamp: new Date().toISOString()
            };

            // Cache successful results
            if (useCache) {
                this.cache.set(cacheKey, result);
            }

            return result;
        };

        // Execute with retry logic
        return this._executeWithRetry(requestFn, `businesses-bounds-${cacheKey}`);
    }

    /**
     * Get businesses near a specific location
     */
    async getBusinessesNear(location, radius = 10, filters = {}, options = {}) {
        if (!ValidationHelpers.isValidCoordinates(location.lat, location.lng)) {
            throw new Error('Invalid location coordinates');
        }

        if (radius > CONFIG.limits.maxDistance) {
            throw new Error(`Radius too large: ${radius}km (max: ${CONFIG.limits.maxDistance}km)`);
        }

        const {
            useCache = true,
            signal = null,
            transform = true
        } = options;

        const cacheKey = this._createCacheKey('businesses-near', { location, radius, filters });

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const params = new URLSearchParams();
        params.append('lat', location.lat.toString());
        params.append('lng', location.lng.toString());
        params.append('radius', radius.toString());

        this._addFiltersToParams(params, filters, 'business');

        const requestFn = async () => {
            const response = await apiClient.get(
                `${CONFIG.endpoints.businesses}/near?${params.toString()}`,
                { signal, timeout: CONFIG.defaults.timeout }
            );

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch nearby businesses');
            }

            let businesses = response.data.data || [];

            if (transform) {
                businesses = businesses.map(business => {
                    const transformed = ModelFactories.createBusinessFromApi(business);
                    transformed.distance = business.distanceKm;
                    transformed.bearing = this._calculateBearing(
                        location.lat, location.lng,
                        business.latitude, business.longitude
                    );
                    return transformed;
                });

                // Sort by distance
                businesses.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            }

            const result = {
                success: true,
                data: businesses,
                count: businesses.length,
                center: location,
                radius,
                filters,
                timestamp: new Date().toISOString()
            };

            if (useCache) {
                this.cache.set(cacheKey, result);
            }

            return result;
        };

        return this._executeWithRetry(requestFn, `businesses-near-${cacheKey}`);
    }

    // =========================================================================
    // EVENT DATA METHODS
    // =========================================================================

    /**
     * Get events within specified geographic bounds
     */
    async getEventsInBounds(bounds, filters = {}, options = {}) {
        const {
            useCache = true,
            signal = null,
            transform = true
        } = options;

        if (!ValidationHelpers.isValidBounds(bounds)) {
            throw new Error('Invalid bounds provided');
        }

        const area = this._calculateBoundsArea(bounds);
        if (area > CONFIG.limits.maxBoundsArea) {
            throw new Error(`Bounds area too large: ${area}km²`);
        }

        const cacheKey = this._createCacheKey('events-bounds', { bounds, filters });

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const params = new URLSearchParams();
        params.append('north', bounds.north.toString());
        params.append('south', bounds.south.toString());
        params.append('east', bounds.east.toString());
        params.append('west', bounds.west.toString());

        this._addFiltersToParams(params, filters, 'event');

        const requestFn = async () => {
            const response = await apiClient.get(
                `${CONFIG.endpoints.events}/bounds?${params.toString()}`,
                { signal, timeout: CONFIG.defaults.timeout }
            );

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch events');
            }

            let events = response.data.data || [];

            if (transform) {
                events = events.map(event => {
                    const transformed = ModelFactories.createEventFromApi(event);
                    if (filters.userLocation) {
                        transformed.distance = this._calculateDistance(
                            filters.userLocation.lat,
                            filters.userLocation.lng,
                            event.latitude,
                            event.longitude
                        );
                        transformed.bearing = this._calculateBearing(
                            filters.userLocation.lat,
                            filters.userLocation.lng,
                            event.latitude,
                            event.longitude
                        );
                    }
                    return transformed;
                });
            }

            const result = {
                success: true,
                data: events,
                count: events.length,
                bounds,
                filters,
                timestamp: new Date().toISOString()
            };

            if (useCache) {
                this.cache.set(cacheKey, result);
            }

            return result;
        };

        return this._executeWithRetry(requestFn, `events-bounds-${cacheKey}`);
    }

    /**
     * Get events near a specific location
     */
    async getEventsNear(location, radius = 10, filters = {}, options = {}) {
        if (!ValidationHelpers.isValidCoordinates(location.lat, location.lng)) {
            throw new Error('Invalid location coordinates');
        }

        if (radius > CONFIG.limits.maxDistance) {
            throw new Error(`Radius too large: ${radius}km`);
        }

        const {
            useCache = true,
            signal = null,
            transform = true
        } = options;

        const cacheKey = this._createCacheKey('events-near', { location, radius, filters });

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const params = new URLSearchParams();
        params.append('lat', location.lat.toString());
        params.append('lng', location.lng.toString());
        params.append('radius', radius.toString());

        this._addFiltersToParams(params, filters, 'event');

        const requestFn = async () => {
            const response = await apiClient.get(
                `${CONFIG.endpoints.events}/near?${params.toString()}`,
                { signal, timeout: CONFIG.defaults.timeout }
            );

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch nearby events');
            }

            let events = response.data.data || [];

            if (transform) {
                events = events.map(event => {
                    const transformed = ModelFactories.createEventFromApi(event);
                    transformed.distance = event.distanceKm;
                    transformed.bearing = this._calculateBearing(
                        location.lat, location.lng,
                        event.latitude, event.longitude
                    );
                    return transformed;
                });

                events.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            }

            const result = {
                success: true,
                data: events,
                count: events.length,
                center: location,
                radius,
                filters,
                timestamp: new Date().toISOString()
            };

            if (useCache) {
                this.cache.set(cacheKey, result);
            }

            return result;
        };

        return this._executeWithRetry(requestFn, `events-near-${cacheKey}`);
    }

    // =========================================================================
    // COMBINED DATA METHODS
    // =========================================================================

    /**
     * Get both businesses and events in bounds (optimized combined call)
     */
    async getMapDataInBounds(bounds, filters = {}, options = {}) {
        const {
            showBusinesses = true,
            showEvents = true,
            useCache = true,
            signal = null,
            transform = true
        } = options;

        if (!ValidationHelpers.isValidBounds(bounds)) {
            throw new Error('Invalid bounds provided');
        }

        const cacheKey = this._createCacheKey('map-data-bounds', { bounds, filters, showBusinesses, showEvents });

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const requests = [];

        // Create business request
        if (showBusinesses) {
            requests.push(
                this.getBusinessesInBounds(bounds, filters, { useCache, signal, transform })
                    .then(data => ({ type: 'businesses', ...data }))
                    .catch(error => ({
                        type: 'businesses',
                        success: false,
                        error: error.message,
                        data: []
                    }))
            );
        }

        // Create event request
        if (showEvents) {
            requests.push(
                this.getEventsInBounds(bounds, filters, { useCache, signal, transform })
                    .then(data => ({ type: 'events', ...data }))
                    .catch(error => ({
                        type: 'events',
                        success: false,
                        error: error.message,
                        data: []
                    }))
            );
        }

        const results = await Promise.all(requests);

        // Combine results
        const combinedData = {
            success: true,
            businesses: [],
            events: [],
            counts: {
                businesses: 0,
                events: 0,
                total: 0
            },
            bounds,
            filters,
            errors: [],
            timestamp: new Date().toISOString()
        };

        results.forEach(result => {
            if (result.success) {
                combinedData[result.type] = result.data || [];
                combinedData.counts[result.type] = (result.data || []).length;
            } else {
                combinedData.errors.push(`${result.type}: ${result.error}`);
            }
        });

        combinedData.counts.total = combinedData.counts.businesses + combinedData.counts.events;

        // Cache combined result
        if (useCache && combinedData.success) {
            this.cache.set(cacheKey, combinedData);
        }

        return combinedData;
    }

    /**
     * Get map data near a location (combined call)
     */
    async getMapDataNear(location, radius = 10, filters = {}, options = {}) {
        const {
            showBusinesses = true,
            showEvents = true,
            useCache = true,
            signal = null,
            transform = true
        } = options;

        if (!ValidationHelpers.isValidCoordinates(location.lat, location.lng)) {
            throw new Error('Invalid location coordinates');
        }

        const cacheKey = this._createCacheKey('map-data-near', { location, radius, filters, showBusinesses, showEvents });

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const requests = [];

        if (showBusinesses) {
            requests.push(
                this.getBusinessesNear(location, radius, filters, { useCache, signal, transform })
                    .then(data => ({ type: 'businesses', ...data }))
                    .catch(error => ({
                        type: 'businesses',
                        success: false,
                        error: error.message,
                        data: []
                    }))
            );
        }

        if (showEvents) {
            requests.push(
                this.getEventsNear(location, radius, filters, { useCache, signal, transform })
                    .then(data => ({ type: 'events', ...data }))
                    .catch(error => ({
                        type: 'events',
                        success: false,
                        error: error.message,
                        data: []
                    }))
            );
        }

        const results = await Promise.all(requests);

        const combinedData = {
            success: true,
            businesses: [],
            events: [],
            counts: {
                businesses: 0,
                events: 0,
                total: 0
            },
            center: location,
            radius,
            filters,
            errors: [],
            timestamp: new Date().toISOString()
        };

        results.forEach(result => {
            if (result.success) {
                combinedData[result.type] = result.data || [];
                combinedData.counts[result.type] = (result.data || []).length;
            } else {
                combinedData.errors.push(`${result.type}: ${result.error}`);
            }
        });

        combinedData.counts.total = combinedData.counts.businesses + combinedData.counts.events;

        if (useCache && combinedData.success) {
            this.cache.set(cacheKey, combinedData);
        }

        return combinedData;
    }

    // =========================================================================
    // GEOCODING METHODS
    // =========================================================================

    /**
     * Geocode an address to coordinates
     */
    async geocodeAddress(address, options = {}) {
        if (!address || typeof address !== 'string' || address.trim().length === 0) {
            throw new Error('Invalid address provided');
        }

        const {
            useCache = true,
            signal = null,
            bias = null // Bias results towards a region
        } = options;

        const cacheKey = this._createCacheKey('geocode', { address: address.toLowerCase().trim(), bias });

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const params = new URLSearchParams();
        params.append('address', address.trim());
        if (bias) {
            params.append('bias', JSON.stringify(bias));
        }

        const requestFn = async () => {
            const response = await apiClient.get(
                `${CONFIG.endpoints.geocode}?${params.toString()}`,
                { signal, timeout: CONFIG.defaults.timeout }
            );

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Geocoding failed');
            }

            const results = response.data.data || [];

            const result = {
                success: true,
                data: results,
                count: results.length,
                query: address,
                timestamp: new Date().toISOString()
            };

            if (useCache) {
                this.cache.set(cacheKey, result);
            }

            return result;
        };

        return this._executeWithRetry(requestFn, `geocode-${cacheKey}`);
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(location, options = {}) {
        if (!ValidationHelpers.isValidCoordinates(location.lat, location.lng)) {
            throw new Error('Invalid coordinates provided');
        }

        const {
            useCache = true,
            signal = null
        } = options;

        const cacheKey = this._createCacheKey('reverse-geocode', {
            lat: location.lat.toFixed(6),
            lng: location.lng.toFixed(6)
        });

        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const params = new URLSearchParams();
        params.append('lat', location.lat.toString());
        params.append('lng', location.lng.toString());

        const requestFn = async () => {
            const response = await apiClient.get(
                `${CONFIG.endpoints.reverseGeocode}?${params.toString()}`,
                { signal, timeout: CONFIG.defaults.timeout }
            );

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Reverse geocoding failed');
            }

            const result = {
                success: true,
                data: response.data.data,
                location,
                timestamp: new Date().toISOString()
            };

            if (useCache) {
                this.cache.set(cacheKey, result);
            }

            return result;
        };

        return this._executeWithRetry(requestFn, `reverse-geocode-${cacheKey}`);
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Cancel a specific request
     */
    cancelRequest(requestId) {
        const controller = this.abortControllers.get(requestId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(requestId);
            return true;
        }
        return false;
    }

    /**
     * Cancel all ongoing requests
     */
    cancelAllRequests() {
        for (const [id, controller] of this.abortControllers.entries()) {
            controller.abort();
        }
        this.abortControllers.clear();
    }

    /**
     * Clear cache
     */
    clearCache(pattern = null) {
        if (pattern) {
            // Clear specific pattern
            for (const key of this.cache.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get service statistics
     */
    getStats() {
        return {
            cache: this.cache.getStats(),
            activeRequests: this.abortControllers.size,
            queuedRequests: this.requestQueue.queue.length,
            retryingRequests: this.retryDelays.size
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        Object.assign(CONFIG, newConfig);
    }

    /**
     * Destroy service and cleanup
     */
    destroy() {
        this.cancelAllRequests();
        this.cache.destroy();
        this.retryDelays.clear();
    }

    // =========================================================================
    // PRIVATE HELPER METHODS
    // =========================================================================

    /**
     * Add filters to URL parameters
     * @private
     */
    _addFiltersToParams(params, filters, type) {
        // Business filters
        if (type === 'business') {
            if (filters.businessStatus && filters.businessStatus.length > 0) {
                filters.businessStatus.forEach(status => params.append('status', status));
            }
            if (filters.businessTags && filters.businessTags.length > 0) {
                filters.businessTags.forEach(tag => params.append('tags', tag));
            }
        }

        // Event filters
        if (type === 'event') {
            if (filters.eventStatus && filters.eventStatus.length > 0) {
                filters.eventStatus.forEach(status => params.append('status', status));
            }
            if (filters.eventTypes && filters.eventTypes.length > 0) {
                filters.eventTypes.forEach(type => params.append('type', type));
            }
            if (filters.eventCategories && filters.eventCategories.length > 0) {
                filters.eventCategories.forEach(cat => params.append('categories', cat));
            }
            if (filters.dateRange) {
                if (filters.dateRange.start) {
                    params.append('startDate', filters.dateRange.start.toISOString());
                }
                if (filters.dateRange.end) {
                    params.append('endDate', filters.dateRange.end.toISOString());
                }
            }
        }

        // Common filters
        if (filters.searchQuery) {
            params.append('search', filters.searchQuery);
        }
        if (filters.maxDistance) {
            params.append('maxDistance', filters.maxDistance.toString());
        }
    }

    /**
     * Create cache key from parameters
     * @private
     */
    _createCacheKey(operation, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${JSON.stringify(params[key])}`)
            .join('|');
        return `${operation}:${Buffer.from(sortedParams).toString('base64')}`;
    }

    /**
     * Calculate area of bounds in square kilometers
     * @private
     */
    _calculateBoundsArea(bounds) {
        const latDiff = bounds.north - bounds.south;
        const lngDiff = bounds.east - bounds.west;
        // Rough approximation: 1 degree ≈ 111 km
        return latDiff * lngDiff * 111 * 111;
    }

    /**
     * Calculate distance between two points using Haversine formula
     * @private
     */
    _calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this._toRadians(lat2 - lat1);
        const dLng = this._toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._toRadians(lat1)) * Math.cos(this._toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Calculate bearing between two points
     * @private
     */
    _calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = this._toRadians(lng2 - lng1);
        const lat1Rad = this._toRadians(lat1);
        const lat2Rad = this._toRadians(lat2);

        const x = Math.sin(dLng) * Math.cos(lat2Rad);
        const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

        const bearingRad = Math.atan2(x, y);
        return (this._toDegrees(bearingRad) + 360) % 360;
    }

    /**
     * Convert degrees to radians
     * @private
     */
    _toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     * @private
     */
    _toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Execute request with retry logic
     * @private
     */
    async _executeWithRetry(requestFn, requestId) {
        const controller = new AbortController();
        this.abortControllers.set(requestId, controller);

        try {
            return await this.requestQueue.add(async () => {
                let lastError;

                for (let attempt = 1; attempt <= CONFIG.defaults.retryAttempts; attempt++) {
                    try {
                        const result = await requestFn();
                        this.retryDelays.delete(requestId);
                        return result;
                    } catch (error) {
                        lastError = error;

                        // Don't retry if request was aborted
                        if (error.name === 'AbortError') {
                            throw error;
                        }

                        // Don't retry client errors (4xx)
                        if (error.response?.status >= 400 && error.response?.status < 500) {
                            throw error;
                        }

                        // Wait before retry (except on last attempt)
                        if (attempt < CONFIG.defaults.retryAttempts) {
                            const delay = CONFIG.defaults.retryDelay * Math.pow(2, attempt - 1);
                            this.retryDelays.set(requestId, delay);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                }

                throw lastError;
            });
        } finally {
            this.abortControllers.delete(requestId);
            this.retryDelays.delete(requestId);
        }
    }

    /**
     * Handle API errors with user-friendly messages
     * @private
     */
    _handleError(error, defaultMessage = 'An unexpected error occurred') {
        if (error.response?.data?.message) {
            return new Error(error.response.data.message);
        } else if (error.response?.status) {
            const status = error.response.status;
            if (status >= 500) {
                return new Error('Server error. Please try again later.');
            } else if (status === 404) {
                return new Error('Resource not found.');
            } else if (status === 403) {
                return new Error('Access denied.');
            } else if (status === 401) {
                return new Error('Authentication required.');
            } else {
                return new Error('Request failed. Please try again later.');
            }
        } else if (error.request) {
            return new Error('Network error. Please check your connection.');
        } else {
            return new Error(error.message || defaultMessage);
        }
    }
}

// =============================================================================
// CREATE AND EXPORT SINGLETON INSTANCE
// =============================================================================

const mapService = new MapService();

export default mapService;

// Named exports for convenience
export {
    mapService,
    CONFIG as MapServiceConfig
};