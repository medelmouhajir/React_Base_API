class LocationService {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.callbacks = new Set();
    }

    // Get current position once
    async getCurrentPosition(options = {}) {
        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        const finalOptions = { ...defaultOptions, ...options };

        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = this.formatPosition(position);
                    this.currentPosition = locationData;
                    this.notifyCallbacks(locationData);
                    resolve(locationData);
                },
                (error) => {
                    const formattedError = this.formatGeolocationError(error);
                    reject(formattedError);
                },
                finalOptions
            );
        });
    }

    // Start watching position changes
    startWatching(options = {}) {
        if (this.watchId) {
            this.stopWatching();
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000 // 1 minute
        };

        const finalOptions = { ...defaultOptions, ...options };

        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const locationData = this.formatPosition(position);
                this.currentPosition = locationData;
                this.notifyCallbacks(locationData);
            },
            (error) => {
                const formattedError = this.formatGeolocationError(error);
                this.notifyCallbacks(null, formattedError);
            },
            finalOptions
        );

        return this.watchId;
    }

    // Stop watching position changes
    stopWatching() {
        if (this.watchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    // Add callback for position updates
    addCallback(callback) {
        this.callbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
        };
    }

    // Remove all callbacks
    clearCallbacks() {
        this.callbacks.clear();
    }

    // Notify all callbacks
    notifyCallbacks(position, error = null) {
        this.callbacks.forEach(callback => {
            try {
                callback(position, error);
            } catch (err) {
                console.error('Error in location callback:', err);
            }
        });
    }

    // Format position object
    formatPosition(position) {
        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
        };
    }

    // Format geolocation error
    formatGeolocationError(error) {
        const errorMessages = {
            1: 'Permission denied - User denied the request for Geolocation',
            2: 'Position unavailable - Location information is unavailable',
            3: 'Timeout - The request to get user location timed out'
        };

        return {
            code: error.code,
            message: errorMessages[error.code] || 'An unknown geolocation error occurred',
            originalMessage: error.message
        };
    }

    // Check if geolocation is supported
    isSupported() {
        return 'geolocation' in navigator;
    }

    // Get current cached position
    getCachedPosition() {
        return this.currentPosition;
    }

    // Calculate distance between two points (in kilometers)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLng = this.degreesToRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Convert degrees to radians
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Check if position is within bounds
    isWithinBounds(position, bounds) {
        if (!position || !bounds) return false;

        return position.lat >= bounds.south &&
            position.lat <= bounds.north &&
            position.lng >= bounds.west &&
            position.lng <= bounds.east;
    }

    // Get accuracy level description
    getAccuracyLevel(accuracy) {
        if (accuracy <= 5) return 'high';
        if (accuracy <= 20) return 'medium';
        if (accuracy <= 100) return 'low';
        return 'very-low';
    }

    // Clear cached position
    clearCache() {
        this.currentPosition = null;
    }

    // Cleanup - stop watching and clear callbacks
    cleanup() {
        this.stopWatching();
        this.clearCallbacks();
        this.clearCache();
    }
}

// Export singleton instance
export default new LocationService();