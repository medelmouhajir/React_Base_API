/**
 * Enhanced Geolocation Service for Virtuello Project
 * Handles user location, geolocation operations, and location-based features
 * 
 * @author WAN SOLUTIONS
 * @version 2.0.0
 */

import { LocationModel, GeocodingResultModel } from '../Models/MapModels';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // Geolocation options
    geolocation: {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 300000, // 5 minutes
        retryAttempts: 3,
        retryDelay: 1000,
        distanceThreshold: 10 // meters
    },

    // Default locations for fallback
    defaultLocations: {
        fes: {
            lat: 34.0622,
            lng: -6.7636,
            name: 'Fes, Morocco',
            city: 'Fes',
            country: 'Morocco'
        },
        morocco: {
            lat: 31.7917,
            lng: -7.0926,
            name: 'Morocco',
            country: 'Morocco'
        }
    },

    // Cache settings
    cache: {
        maxSize: 100,
        defaultTtl: 3600000, // 1 hour
        locationTtl: 300000,  // 5 minutes for location data
        geocodeTtl: 86400000  // 24 hours for geocoding
    },

    // Performance settings
    performance: {
        maxQueueSize: 10,
        batchDelay: 100,
        debounceDelay: 300
    }
};

// =============================================================================
// GEOLOCATION SERVICE CLASS
// =============================================================================

class GeolocationService {
    constructor() {
        // Core state
        this.currentPosition = null;
        this.watchId = null;
        this.isWatching = false;
        this.lastKnownPosition = null;

        // Event handling
        this.eventHandlers = new Map();
        this.eventQueue = [];

        // Caching
        this.geocodeCache = new Map();
        this.locationCache = new Map();

        // Request management
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.pendingRequests = new Map();

        // Performance optimization
        this.debounceTimers = new Map();
        this.lastLocationUpdate = null;

        // Service state
        this.isInitialized = false;
        this.permissionStatus = 'unknown';
        this.capabilities = this._detectCapabilities();

        // Initialize service
        this._initialize();
    }

    // =========================================================================
    // INITIALIZATION AND SETUP
    // =========================================================================

    /**
     * Initialize the geolocation service
     * @private
     */
    async _initialize() {
        try {
            // Check initial permission status
            this.permissionStatus = await this.checkPermission();

            // Set up cleanup on page unload
            if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', () => this.destroy());
                window.addEventListener('online', () => this._handleOnline());
                window.addEventListener('offline', () => this._handleOffline());
            }

            // Load cached position if available
            this._loadCachedPosition();

            this.isInitialized = true;
            this._emit('service:initialized', {
                permissionStatus: this.permissionStatus,
                capabilities: this.capabilities
            });

            console.log('[GeolocationService] Service initialized successfully');
        } catch (error) {
            console.error('[GeolocationService] Initialization failed:', error);
            this._emit('service:error', { error, phase: 'initialization' });
        }
    }

    /**
     * Detect browser capabilities
     * @private
     */
    _detectCapabilities() {
        return {
            geolocation: 'geolocation' in navigator,
            permissions: 'permissions' in navigator,
            online: navigator.onLine,
            https: location.protocol === 'https:',
            serviceWorker: 'serviceWorker' in navigator,
            webWorker: typeof Worker !== 'undefined'
        };
    }

    // =========================================================================
    // PERMISSION MANAGEMENT
    // =========================================================================

    /**
     * Check if geolocation is supported
     */
    isSupported() {
        return this.capabilities.geolocation;
    }

    /**
     * Check current permission status
     */
    async checkPermission() {
        if (!this.isSupported()) {
            return 'not-supported';
        }

        try {
            if (this.capabilities.permissions) {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                this.permissionStatus = permission.state;

                // Listen for permission changes
                permission.onchange = () => {
                    this.permissionStatus = permission.state;
                    this._emit('permission:changed', permission.state);
                };

                return permission.state;
            }
            return 'unknown';
        } catch (error) {
            console.warn('[GeolocationService] Permission check failed:', error);
            return 'unknown';
        }
    }

    /**
     * Request geolocation permission
     */
    async requestPermission() {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported');
        }

        try {
            // Attempt to get position to trigger permission prompt
            const position = await this.getCurrentPosition({ timeout: 10000 });
            this.permissionStatus = 'granted';
            this._emit('permission:granted', position);
            return 'granted';
        } catch (error) {
            if (error.code === 1) { // PERMISSION_DENIED
                this.permissionStatus = 'denied';
                this._emit('permission:denied', error);
                return 'denied';
            }
            throw error;
        }
    }

    // =========================================================================
    // POSITION METHODS
    // =========================================================================

    /**
     * Get current position with enhanced error handling and retry logic
     */
    async getCurrentPosition(options = {}) {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported');
        }

        const geoOptions = { ...CONFIG.geolocation, ...options };
        const requestId = `position-${Date.now()}-${Math.random()}`;

        // Check if we have a recent cached position
        if (this.currentPosition && !options.forceUpdate) {
            const age = Date.now() - this.currentPosition.timestamp.getTime();
            if (age < geoOptions.maximumAge) {
                this._emit('location:cached', this.currentPosition);
                return this.currentPosition;
            }
        }

        return new Promise((resolve, reject) => {
            let attempts = 0;

            const attemptLocation = () => {
                attempts++;

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        try {
                            const locationData = this._processPosition(position);
                            this.currentPosition = locationData;
                            this.lastKnownPosition = locationData;
                            this.lastLocationUpdate = Date.now();

                            // Cache the position
                            this._cachePosition(locationData);

                            this._emit('location:success', locationData);
                            resolve(locationData);
                        } catch (error) {
                            console.error('[GeolocationService] Position processing failed:', error);
                            reject(new Error('Failed to process location data'));
                        }
                    },
                    (error) => {
                        console.warn(`[GeolocationService] Attempt ${attempts} failed:`, error.message);

                        if (attempts < geoOptions.retryAttempts && error.code !== 1) {
                            // Don't retry on permission denied
                            setTimeout(attemptLocation, geoOptions.retryDelay * attempts);
                        } else {
                            const locationError = this._createLocationError(error);
                            this._emit('location:error', locationError);

                            // Try to fall back to last known position
                            if (this.lastKnownPosition && error.code !== 1) {
                                console.log('[GeolocationService] Using last known position as fallback');
                                resolve({
                                    ...this.lastKnownPosition,
                                    isStale: true,
                                    fallbackReason: 'location_error'
                                });
                            } else {
                                reject(locationError);
                            }
                        }
                    },
                    {
                        enableHighAccuracy: geoOptions.enableHighAccuracy,
                        timeout: geoOptions.timeout,
                        maximumAge: geoOptions.maximumAge
                    }
                );
            };

            this.pendingRequests.set(requestId, { resolve, reject, cancel: () => { } });
            attemptLocation();
        });
    }

    /**
     * Start watching position changes with intelligent filtering
     */
    async startWatching(options = {}) {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported');
        }

        if (this.isWatching) {
            this.stopWatching();
        }

        const geoOptions = { ...CONFIG.geolocation, ...options };

        return new Promise((resolve, reject) => {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    try {
                        const locationData = this._processPosition(position);

                        // Intelligent position filtering
                        if (this._shouldUpdatePosition(locationData)) {
                            this.currentPosition = locationData;
                            this.lastKnownPosition = locationData;
                            this.lastLocationUpdate = Date.now();

                            this._cachePosition(locationData);
                            this._emit('location:change', locationData);
                        }
                    } catch (error) {
                        console.error('[GeolocationService] Position processing failed:', error);
                        this._emit('location:error', error);
                    }
                },
                (error) => {
                    console.error('[GeolocationService] Watch position error:', error);
                    const locationError = this._createLocationError(error);
                    this._emit('location:error', locationError);

                    // Don't stop watching on temporary errors
                    if (error.code !== 1) { // Not permission denied
                        console.log('[GeolocationService] Continuing to watch despite error');
                    }
                },
                {
                    enableHighAccuracy: geoOptions.enableHighAccuracy,
                    timeout: geoOptions.timeout,
                    maximumAge: geoOptions.maximumAge
                }
            );

            this.isWatching = true;
            this._emit('watching:started', { watchId: this.watchId });
            resolve(this.watchId);
        });
    }

    /**
     * Stop watching position changes
     */
    stopWatching() {
        if (this.watchId && this.isWatching) {
            navigator.geolocation.clearWatch(this.watchId);
            this.isWatching = false;
            this._emit('watching:stopped', { watchId: this.watchId });
            this.watchId = null;
        }
    }

    /**
     * Get last known position (from cache or memory)
     */
    getLastKnownPosition() {
        if (this.lastKnownPosition) {
            return {
                ...this.lastKnownPosition,
                isStale: Date.now() - this.lastKnownPosition.timestamp.getTime() > CONFIG.cache.locationTtl
            };
        }

        // Try to load from cache
        const cached = this._loadCachedPosition();
        if (cached) {
            return {
                ...cached,
                isStale: true,
                fallbackReason: 'cache'
            };
        }

        return null;
    }

    // =========================================================================
    // GEOCODING METHODS
    // =========================================================================

    /**
     * Geocode address to coordinates with caching and batching
     */
    async geocodeAddress(address, options = {}) {
        if (!address || typeof address !== 'string') {
            throw new Error('Invalid address provided');
        }

        const normalizedAddress = address.toLowerCase().trim();
        const {
            skipCache = false,
            bias = null,
            region = 'MA', // Morocco
            language = 'en'
        } = options;

        // Check cache first
        const cacheKey = this._createGeocodeKey(normalizedAddress, { bias, region, language });
        if (!skipCache && this.geocodeCache.has(cacheKey)) {
            const cached = this.geocodeCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.cache.geocodeTtl) {
                this._emit('geocode:cached', { address, results: cached.results });
                return cached.results;
            }
        }

        try {
            // Add to request queue to prevent rate limiting
            const results = await this._queueGeocodingRequest(async () => {
                return await this._performGeocode(normalizedAddress, { bias, region, language });
            });

            // Cache successful results
            if (results && results.length > 0) {
                this.geocodeCache.set(cacheKey, {
                    results,
                    timestamp: Date.now(),
                    hits: 0
                });

                // Clean cache if it gets too large
                this._cleanGeocodeCache();
            }

            this._emit('geocode:success', { address, results });
            return results;

        } catch (error) {
            console.error('[GeolocationService] Geocoding failed:', error);
            this._emit('geocode:error', { address, error });
            throw new Error(`Geocoding failed: ${error.message}`);
        }
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(lat, lng, options = {}) {
        if (!this._isValidCoordinates(lat, lng)) {
            throw new Error('Invalid coordinates provided');
        }

        const {
            skipCache = false,
            language = 'en',
            resultTypes = ['street_address', 'route', 'locality']
        } = options;

        // Create cache key with rounded coordinates
        const roundedLat = Math.round(lat * 100000) / 100000;
        const roundedLng = Math.round(lng * 100000) / 100000;
        const cacheKey = `reverse:${roundedLat},${roundedLng}:${language}`;

        // Check cache
        if (!skipCache && this.geocodeCache.has(cacheKey)) {
            const cached = this.geocodeCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.cache.geocodeTtl) {
                cached.hits++;
                this._emit('reverse-geocode:cached', { lat, lng, result: cached.result });
                return cached.result;
            }
        }

        try {
            const result = await this._queueGeocodingRequest(async () => {
                return await this._performReverseGeocode(lat, lng, { language, resultTypes });
            });

            // Cache result
            if (result) {
                this.geocodeCache.set(cacheKey, {
                    result,
                    timestamp: Date.now(),
                    hits: 0
                });

                this._cleanGeocodeCache();
            }

            this._emit('reverse-geocode:success', { lat, lng, result });
            return result;

        } catch (error) {
            console.error('[GeolocationService] Reverse geocoding failed:', error);
            this._emit('reverse-geocode:error', { lat, lng, error });
            throw new Error(`Reverse geocoding failed: ${error.message}`);
        }
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(lat1, lng1, lat2, lng2, unit = 'km') {
        if (!this._isValidCoordinates(lat1, lng1) || !this._isValidCoordinates(lat2, lng2)) {
            throw new Error('Invalid coordinates provided');
        }

        const R = unit === 'miles' ? 3959 : 6371; // Earth's radius
        const dLat = this._toRadians(lat2 - lat1);
        const dLng = this._toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._toRadians(lat1)) * Math.cos(this._toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 1000) / 1000; // Round to 3 decimal places
    }

    /**
     * Check if point is within radius of center point
     */
    isWithinRadius(centerLat, centerLng, pointLat, pointLng, radiusKm) {
        const distance = this.calculateDistance(centerLat, centerLng, pointLat, pointLng);
        return distance <= radiusKm;
    }

    /**
     * Check if point is within bounds
     */
    isWithinBounds(lat, lng, bounds) {
        const { north, south, east, west } = bounds;
        return lat >= south && lat <= north && lng >= west && lng <= east;
    }

    /**
     * Get compass bearing between two points
     */
    getBearing(lat1, lng1, lat2, lng2) {
        const φ1 = this._toRadians(lat1);
        const φ2 = this._toRadians(lat2);
        const Δλ = this._toRadians(lng2 - lng1);

        const x = Math.sin(Δλ) * Math.cos(φ2);
        const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

        const θ = Math.atan2(x, y);
        return (this._toDegrees(θ) + 360) % 360;
    }

    /**
     * Get compass direction from bearing
     */
    getCompassDirection(bearing) {
        const directions = [
            'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
        ];
        const index = Math.round(bearing / 22.5) % 16;
        return directions[index];
    }

    /**
     * Format coordinates for display
     */
    formatCoordinates(lat, lng, options = {}) {
        const {
            precision = 6,
            format = 'decimal', // 'decimal', 'dms'
            separator = ', '
        } = options;

        if (format === 'dms') {
            return this._toDMS(lat, lng, precision);
        }

        return `${lat.toFixed(precision)}${separator}${lng.toFixed(precision)}`;
    }

    /**
     * Get default location for region
     */
    getDefaultLocation(region = 'fes') {
        const location = CONFIG.defaultLocations[region] || CONFIG.defaultLocations.fes;
        return {
            ...LocationModel,
            ...location,
            type: 'default',
            timestamp: new Date()
        };
    }

    // =========================================================================
    // EVENT MANAGEMENT
    // =========================================================================

    /**
     * Add event listener
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remove event listener
     */
    off(event, handler) {
        if (!this.eventHandlers.has(event)) return;

        const handlers = this.eventHandlers.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Remove all event listeners for an event
     */
    removeAllListeners(event = null) {
        if (event) {
            this.eventHandlers.delete(event);
        } else {
            this.eventHandlers.clear();
        }
    }

    // =========================================================================
    // SERVICE MANAGEMENT
    // =========================================================================

    /**
     * Get service status and statistics
     */
    getStatus() {
        return {
            isSupported: this.isSupported(),
            isInitialized: this.isInitialized,
            isWatching: this.isWatching,
            permissionStatus: this.permissionStatus,
            hasCurrentPosition: !!this.currentPosition,
            hasLastKnownPosition: !!this.lastKnownPosition,
            capabilities: this.capabilities,
            cache: {
                geocodeSize: this.geocodeCache.size,
                locationSize: this.locationCache.size
            },
            queue: {
                size: this.requestQueue.length,
                isProcessing: this.isProcessingQueue
            },
            performance: {
                lastUpdate: this.lastLocationUpdate,
                pendingRequests: this.pendingRequests.size
            }
        };
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.geocodeCache.clear();
        this.locationCache.clear();
        this._clearLocalStorage();
        console.log('[GeolocationService] All caches cleared');
    }

    /**
     * Update service configuration
     */
    updateConfig(newConfig) {
        Object.assign(CONFIG, newConfig);
        this._emit('config:updated', CONFIG);
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...CONFIG };
    }

    /**
     * Destroy service and cleanup
     */
    destroy() {
        this.stopWatching();
        this.clearCache();

        // Cancel pending requests
        for (const [id, request] of this.pendingRequests.entries()) {
            if (request.cancel) request.cancel();
        }
        this.pendingRequests.clear();

        // Clear timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();

        // Clear event handlers
        this.eventHandlers.clear();

        // Reset state
        this.currentPosition = null;
        this.lastKnownPosition = null;
        this.isInitialized = false;

        console.log('[GeolocationService] Service destroyed');
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Process raw position data from browser API
     * @private
     */
    _processPosition(position) {
        const { coords, timestamp } = position;

        return {
            ...LocationModel,
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            altitudeAccuracy: coords.altitudeAccuracy,
            heading: coords.heading,
            speed: coords.speed,
            timestamp: new Date(timestamp),
            type: 'user',
            isCurrentUserLocation: true
        };
    }

    /**
     * Determine if position should trigger an update
     * @private
     */
    _shouldUpdatePosition(newPosition) {
        if (!this.currentPosition) return true;

        // Check time threshold
        const timeDiff = newPosition.timestamp - this.currentPosition.timestamp;
        if (timeDiff < 1000) return false; // Less than 1 second

        // Check distance threshold
        const distance = this.calculateDistance(
            this.currentPosition.lat,
            this.currentPosition.lng,
            newPosition.lat,
            newPosition.lng
        ) * 1000; // Convert to meters

        if (distance < CONFIG.geolocation.distanceThreshold) return false;

        // Check accuracy improvement
        if (newPosition.accuracy > this.currentPosition.accuracy * 2) return false;

        return true;
    }

    /**
     * Create standardized location error
     * @private
     */
    _createLocationError(error) {
        const errorMessages = {
            1: 'Permission denied - Location access was denied by user',
            2: 'Position unavailable - Location information is unavailable',
            3: 'Timeout - Location request timed out'
        };

        return {
            code: error.code,
            message: errorMessages[error.code] || error.message,
            timestamp: new Date(),
            fallbackLocation: this.getDefaultLocation()
        };
    }

    /**
     * Validate coordinates
     * @private
     */
    _isValidCoordinates(lat, lng) {
        return typeof lat === 'number' && typeof lng === 'number' &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
            !isNaN(lat) && !isNaN(lng);
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
     * Convert decimal degrees to DMS format
     * @private
     */
    _toDMS(lat, lng, precision = 2) {
        const formatDMS = (coord, isLat) => {
            const absolute = Math.abs(coord);
            const degrees = Math.floor(absolute);
            const minutes = Math.floor((absolute - degrees) * 60);
            const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(precision);

            const direction = coord >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
            return `${degrees}°${minutes}'${seconds}"${direction}`;
        };

        return `${formatDMS(lat, true)}, ${formatDMS(lng, false)}`;
    }

    /**
     * Cache position data
     * @private
     */
    _cachePosition(position) {
        const cacheData = {
            position,
            timestamp: Date.now()
        };

        this.locationCache.set('current', cacheData);

        // Store in localStorage for persistence
        try {
            localStorage.setItem('virtuello_location', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('[GeolocationService] Failed to cache position:', error);
        }
    }

    /**
     * Load cached position from storage
     * @private
     */
    _loadCachedPosition() {
        try {
            // Try memory cache first
            if (this.locationCache.has('current')) {
                const cached = this.locationCache.get('current');
                if (Date.now() - cached.timestamp < CONFIG.cache.locationTtl) {
                    return cached.position;
                }
            }

            // Try localStorage
            const stored = localStorage.getItem('virtuello_location');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Date.now() - parsed.timestamp < CONFIG.cache.locationTtl) {
                    return {
                        ...parsed.position,
                        timestamp: new Date(parsed.position.timestamp)
                    };
                }
            }
        } catch (error) {
            console.warn('[GeolocationService] Failed to load cached position:', error);
        }

        return null;
    }

    /**
     * Create geocoding cache key
     * @private
     */
    _createGeocodeKey(address, options) {
        const optionsStr = Object.keys(options)
            .sort()
            .map(key => `${key}:${options[key]}`)
            .join('|');
        return `${address}:${optionsStr}`;
    }

    /**
     * Clean geocoding cache when it gets too large
     * @private
     */
    _cleanGeocodeCache() {
        if (this.geocodeCache.size > CONFIG.cache.maxSize) {
            // Remove least recently used items
            const entries = Array.from(this.geocodeCache.entries())
                .sort((a, b) => a[1].hits - b[1].hits)
                .slice(0, Math.floor(CONFIG.cache.maxSize * 0.3));

            entries.forEach(([key]) => this.geocodeCache.delete(key));
        }
    }

    /**
     * Queue geocoding request to prevent rate limiting
     * @private
     */
    async _queueGeocodingRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ requestFn, resolve, reject });
            this._processGeocodeQueue();
        });
    }

    /**
     * Process geocoding request queue
     * @private
     */
    async _processGeocodeQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const { requestFn, resolve, reject } = this.requestQueue.shift();

            try {
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, CONFIG.performance.batchDelay));
        }

        this.isProcessingQueue = false;
    }

    /**
     * Perform actual geocoding (placeholder - implement with your geocoding service)
     * @private
     */
    async _performGeocode(address, options) {
        // This would integrate with your actual geocoding service
        // For now, return a mock result
        console.log('[GeolocationService] Geocoding:', address, options);
        throw new Error('Geocoding service not implemented');
    }

    /**
     * Perform actual reverse geocoding (placeholder)
     * @private
     */
    async _performReverseGeocode(lat, lng, options) {
        // This would integrate with your actual reverse geocoding service
        console.log('[GeolocationService] Reverse geocoding:', lat, lng, options);
        throw new Error('Reverse geocoding service not implemented');
    }

    /**
     * Handle online event
     * @private
     */
    _handleOnline() {
        this.capabilities.online = true;
        this._emit('connectivity:online');
    }

    /**
     * Handle offline event
     * @private
     */
    _handleOffline() {
        this.capabilities.online = false;
        this._emit('connectivity:offline');
    }

    /**
     * Clear localStorage data
     * @private
     */
    _clearLocalStorage() {
        try {
            localStorage.removeItem('virtuello_location');
        } catch (error) {
            console.warn('[GeolocationService] Failed to clear localStorage:', error);
        }
    }

    /**
     * Emit event to all listeners
     * @private
     */
    _emit(event, data = null) {
        if (!this.eventHandlers.has(event)) return;

        const handlers = this.eventHandlers.get(event);
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`[GeolocationService] Error in event handler for '${event}':`, error);
            }
        });
    }
}

// =============================================================================
// CREATE AND EXPORT SINGLETON INSTANCE
// =============================================================================

const geolocationService = new GeolocationService();

export default geolocationService;

// Named exports
export {
    geolocationService,
    CONFIG as GeolocationConfig
};