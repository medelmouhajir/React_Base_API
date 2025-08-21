/**
 * GeolocationService - Location handling and geolocation operations
 * Manages user location, address geocoding, and location-based features
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

class GeolocationService {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.isWatching = false;
        this.eventHandlers = new Map();
        this.geocoder = null;
        this.config = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 300000, // 5 minutes
            retryAttempts: 3,
            retryDelay: 1000,
            distanceThreshold: 10, // meters
            defaultLocation: {
                lat: 34.0522,
                lng: -6.7736,
                city: 'Fes',
                country: 'Morocco'
            }
        };
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Check if geolocation is supported
     * @returns {boolean} Support status
     */
    isSupported() {
        return 'geolocation' in navigator;
    }

    /**
     * Check current permission status
     * @returns {Promise<string>} Permission status
     */
    async checkPermission() {
        if (!this.isSupported()) {
            return 'not-supported';
        }

        try {
            if ('permissions' in navigator) {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                return permission.state; // 'granted', 'denied', or 'prompt'
            }
            return 'unknown';
        } catch (error) {
            console.warn('[GeolocationService] Permission check failed:', error);
            return 'unknown';
        }
    }

    /**
     * Get current position
     * @param {Object} options - Geolocation options
     * @returns {Promise<Object>} Position data
     */
    async getCurrentPosition(options = {}) {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported');
        }

        const geoOptions = { ...this.config, ...options };

        return new Promise((resolve, reject) => {
            let attempts = 0;

            const attemptLocation = () => {
                attempts++;

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const locationData = this._processPosition(position);
                        this.currentPosition = locationData;
                        this._emit('location:success', locationData);
                        resolve(locationData);
                    },
                    (error) => {
                        console.warn(`[GeolocationService] Attempt ${attempts} failed:`, error.message);

                        if (attempts < geoOptions.retryAttempts) {
                            setTimeout(attemptLocation, geoOptions.retryDelay);
                        } else {
                            this._emit('location:error', error);
                            reject(this._createLocationError(error));
                        }
                    },
                    {
                        enableHighAccuracy: geoOptions.enableHighAccuracy,
                        timeout: geoOptions.timeout,
                        maximumAge: geoOptions.maximumAge
                    }
                );
            };

            attemptLocation();
        });
    }

    /**
     * Start watching position changes
     * @param {Object} options - Watch options
     * @returns {Promise<number>} Watch ID
     */
    async startWatching(options = {}) {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported');
        }

        if (this.isWatching) {
            this.stopWatching();
        }

        const geoOptions = { ...this.config, ...options };

        return new Promise((resolve, reject) => {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const locationData = this._processPosition(position);

                    // Check if location has changed significantly
                    if (this._hasLocationChanged(locationData)) {
                        this.currentPosition = locationData;
                        this._emit('location:change', locationData);
                    }
                },
                (error) => {
                    console.error('[GeolocationService] Watch position error:', error);
                    this._emit('location:error', error);
                },
                {
                    enableHighAccuracy: geoOptions.enableHighAccuracy,
                    timeout: geoOptions.timeout,
                    maximumAge: geoOptions.maximumAge
                }
            );

            if (this.watchId) {
                this.isWatching = true;
                this._emit('location:watch:start', { watchId: this.watchId });
                resolve(this.watchId);
            } else {
                reject(new Error('Failed to start watching position'));
            }
        });
    }

    /**
     * Stop watching position changes
     */
    stopWatching() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isWatching = false;
            this._emit('location:watch:stop');
        }
    }

    /**
     * Process raw position data
     * @private
     * @param {GeolocationPosition} position - Raw position
     * @returns {Object} Processed location data
     */
    _processPosition(position) {
        const { coords, timestamp } = position;

        return {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            altitudeAccuracy: coords.altitudeAccuracy,
            heading: coords.heading,
            speed: coords.speed,
            timestamp: new Date(timestamp),
            coordinates: [coords.latitude, coords.longitude]
        };
    }

    /**
     * Check if location has changed significantly
     * @private
     * @param {Object} newLocation - New location data
     * @returns {boolean} Has changed status
     */
    _hasLocationChanged(newLocation) {
        if (!this.currentPosition) return true;

        const distance = this._calculateDistance(
            this.currentPosition.lat,
            this.currentPosition.lng,
            newLocation.lat,
            newLocation.lng
        );

        return distance > this.config.distanceThreshold;
    }

    /**
     * Calculate distance between two points in meters
     * @private
     * @param {number} lat1 - Latitude 1
     * @param {number} lng1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lng2 - Longitude 2
     * @returns {number} Distance in meters
     */
    _calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Create standardized location error
     * @private
     * @param {GeolocationPositionError} error - Geolocation error
     * @returns {Object} Formatted error
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
            fallbackLocation: this.config.defaultLocation
        };
    }

    /**
     * Geocode address to coordinates
     * @param {string} address - Address to geocode
     * @param {Object} options - Geocoding options
     * @returns {Promise<Array>} Array of location results
     */
    async geocodeAddress(address, options = {}) {
        if (!address || typeof address !== 'string') {
            throw new Error('Invalid address provided');
        }

        const cacheKey = `geocode:${address.toLowerCase().trim()}`;

        // Check cache first
        if (this.cache.has(cacheKey) && !options.skipCache) {
            return this.cache.get(cacheKey);
        }

        try {
            // Add to request queue to prevent rate limiting
            const result = await this._queueRequest(() => this._performGeocode(address, options));

            // Cache successful results
            if (result && result.length > 0) {
                this.cache.set(cacheKey, result);

                // Clean cache if it gets too large
                if (this.cache.size > 100) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
            }

            return result;
        } catch (error) {
            console.error('[GeolocationService] Geocoding failed:', error);
            throw new Error(`Geocoding failed: ${error.message}`);
        }
    }

    /**
     * Reverse geocode coordinates to address
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} options - Reverse geocoding options
     * @returns {Promise<Object>} Address information
     */
    async reverseGeocode(lat, lng, options = {}) {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new Error('Invalid coordinates provided');
        }

        const cacheKey = `reverse:${lat.toFixed(4)},${lng.toFixed(4)}`;

        // Check cache first
        if (this.cache.has(cacheKey) && !options.skipCache) {
            return this.cache.get(cacheKey);
        }

        try {
            const result = await this._queueRequest(() => this._performReverseGeocode(lat, lng, options));

            // Cache successful results
            if (result) {
                this.cache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.error('[GeolocationService] Reverse geocoding failed:', error);
            throw new Error(`Reverse geocoding failed: ${error.message}`);
        }
    }

    /**
     * Perform actual geocoding using Nominatim API
     * @private
     * @param {string} address - Address to geocode
     * @param {Object} options - Options
     * @returns {Promise<Array>} Results
     */
    async _performGeocode(address, options = {}) {
        const params = new URLSearchParams({
            q: address,
            format: 'json',
            limit: options.limit || 5,
            countrycodes: options.countryCode || '',
            'accept-language': options.language || 'en',
            addressdetails: 1,
            extratags: 1
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: {
                'User-Agent': 'Virtuello-Map-App/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return data.map(item => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            displayName: item.display_name,
            address: {
                house_number: item.address?.house_number,
                road: item.address?.road,
                suburb: item.address?.suburb,
                city: item.address?.city || item.address?.town || item.address?.village,
                county: item.address?.county,
                state: item.address?.state,
                country: item.address?.country,
                postcode: item.address?.postcode
            },
            boundingBox: item.boundingbox?.map(coord => parseFloat(coord)),
            importance: item.importance,
            placeId: item.place_id,
            type: item.type,
            osm: {
                id: item.osm_id,
                type: item.osm_type
            }
        }));
    }

    /**
     * Perform reverse geocoding using Nominatim API
     * @private
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} options - Options
     * @returns {Promise<Object>} Address data
     */
    async _performReverseGeocode(lat, lng, options = {}) {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lng.toString(),
            format: 'json',
            'accept-language': options.language || 'en',
            addressdetails: 1,
            zoom: options.zoom || 18
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
            headers: {
                'User-Agent': 'Virtuello-Map-App/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || data.error) {
            throw new Error(data?.error || 'No results found');
        }

        return {
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lon),
            displayName: data.display_name,
            address: {
                house_number: data.address?.house_number,
                road: data.address?.road,
                suburb: data.address?.suburb,
                city: data.address?.city || data.address?.town || data.address?.village,
                county: data.address?.county,
                state: data.address?.state,
                country: data.address?.country,
                postcode: data.address?.postcode
            },
            placeId: data.place_id,
            type: data.type,
            osm: {
                id: data.osm_id,
                type: data.osm_type
            }
        };
    }

    /**
     * Queue request to prevent rate limiting
     * @private
     * @param {Function} requestFn - Request function
     * @returns {Promise<*>} Request result
     */
    async _queueRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ requestFn, resolve, reject });
            this._processQueue();
        });
    }

    /**
     * Process request queue
     * @private
     */
    async _processQueue() {
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

            // Rate limiting delay (1 request per second for Nominatim)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.isProcessingQueue = false;
    }

    /**
     * Get current position data
     * @returns {Object|null} Current position
     */
    getCurrentPositionData() {
        return this.currentPosition;
    }

    /**
     * Get default location
     * @returns {Object} Default location
     */
    getDefaultLocation() {
        return { ...this.config.defaultLocation };
    }

    /**
     * Calculate distance between current position and target
     * @param {number} targetLat - Target latitude
     * @param {number} targetLng - Target longitude
     * @returns {number|null} Distance in meters or null if no current position
     */
    getDistanceToTarget(targetLat, targetLng) {
        if (!this.currentPosition) {
            return null;
        }

        return this._calculateDistance(
            this.currentPosition.lat,
            this.currentPosition.lng,
            targetLat,
            targetLng
        );
    }

    /**
     * Check if target is within radius of current position
     * @param {number} targetLat - Target latitude
     * @param {number} targetLng - Target longitude
     * @param {number} radiusMeters - Radius in meters
     * @returns {boolean|null} Within radius status or null if no current position
     */
    isWithinRadius(targetLat, targetLng, radiusMeters) {
        const distance = this.getDistanceToTarget(targetLat, targetLng);
        return distance !== null ? distance <= radiusMeters : null;
    }

    /**
     * Format coordinates for display
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} options - Format options
     * @returns {string} Formatted coordinates
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
     * Convert decimal degrees to DMS format
     * @private
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} precision - Decimal precision for seconds
     * @returns {string} DMS formatted coordinates
     */
    _toDMS(lat, lng, precision = 2) {
        const formatDMS = (coord, isLat) => {
            const absolute = Math.abs(coord);
            const degrees = Math.floor(absolute);
            const minutes = Math.floor((absolute - degrees) * 60);
            const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(precision);

            const direction = coord >= 0
                ? (isLat ? 'N' : 'E')
                : (isLat ? 'S' : 'W');

            return `${degrees}°${minutes}'${seconds}"${direction}`;
        };

        return `${formatDMS(lat, true)}, ${formatDMS(lng, false)}`;
    }

    /**
     * Get location accuracy description
     * @param {number} accuracy - Accuracy in meters
     * @returns {string} Accuracy description
     */
    getAccuracyDescription(accuracy) {
        if (accuracy <= 5) return 'Very High';
        if (accuracy <= 10) return 'High';
        if (accuracy <= 50) return 'Medium';
        if (accuracy <= 100) return 'Low';
        return 'Very Low';
    }

    /**
     * Validate coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} Valid coordinates
     */
    validateCoordinates(lat, lng) {
        return typeof lat === 'number' &&
            typeof lng === 'number' &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180 &&
            !isNaN(lat) && !isNaN(lng);
    }

    /**
     * Get bounds for a location with radius
     * @param {number} lat - Center latitude
     * @param {number} lng - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @returns {Object} Bounds object with north, south, east, west
     */
    getBoundsFromRadius(lat, lng, radiusKm) {
        if (!this.validateCoordinates(lat, lng)) {
            throw new Error('Invalid coordinates');
        }

        const earthRadius = 6371; // Earth's radius in km
        const latDelta = (radiusKm / earthRadius) * (180 / Math.PI);
        const lngDelta = latDelta / Math.cos(lat * Math.PI / 180);

        return {
            north: lat + latDelta,
            south: lat - latDelta,
            east: lng + lngDelta,
            west: lng - lngDelta
        };
    }

    /**
     * Check if point is within bounds
     * @param {number} lat - Point latitude
     * @param {number} lng - Point longitude
     * @param {Object} bounds - Bounds object
     * @returns {boolean} Within bounds status
     */
    isWithinBounds(lat, lng, bounds) {
        const { north, south, east, west } = bounds;

        return lat >= south &&
            lat <= north &&
            lng >= west &&
            lng <= east;
    }

    /**
     * Get compass bearing between two points
     * @param {number} lat1 - Start latitude
     * @param {number} lng1 - Start longitude
     * @param {number} lat2 - End latitude
     * @param {number} lng2 - End longitude
     * @returns {number} Bearing in degrees (0-360)
     */
    getBearing(lat1, lng1, lat2, lng2) {
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const x = Math.sin(Δλ) * Math.cos(φ2);
        const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

        const θ = Math.atan2(x, y);

        return (θ * 180 / Math.PI + 360) % 360;
    }

    /**
     * Get compass direction from bearing
     * @param {number} bearing - Bearing in degrees
     * @returns {string} Compass direction
     */
    getCompassDirection(bearing) {
        const directions = [
            'N', 'NNE', 'NE', 'ENE',
            'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW',
            'W', 'WNW', 'NW', 'NNW'
        ];

        const index = Math.round(bearing / 22.5) % 16;
        return directions[index];
    }

    /**
     * Clear location cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[GeolocationService] Cache cleared');
    }

    /**
     * Update service configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get service configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
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
     * Emit event
     * @private
     * @param {string} event - Event name
     * @param {*} data - Event data
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

    /**
     * Get service status
     * @returns {Object} Service status information
     */
    getStatus() {
        return {
            isSupported: this.isSupported(),
            isWatching: this.isWatching,
            hasCurrentPosition: !!this.currentPosition,
            cacheSize: this.cache.size,
            queueLength: this.requestQueue.length,
            isProcessingQueue: this.isProcessingQueue,
            currentPosition: this.currentPosition,
            watchId: this.watchId
        };
    }

    /**
     * Destroy service and cleanup
     */
    destroy() {
        this.stopWatching();
        this.clearCache();
        this.requestQueue = [];
        this.eventHandlers.clear();
        this.currentPosition = null;
        this.isProcessingQueue = false;

        console.log('[GeolocationService] Service destroyed');
    }
}

// Create singleton instance
const geolocationService = new GeolocationService();

export default geolocationService;