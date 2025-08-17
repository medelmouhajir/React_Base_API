// =============================================================================
// LOCATION SERVICE - Geolocation, geocoding, and location utilities
// =============================================================================
import apiClient from './../../../../services/apiClient';

export const locationService = {
    // Current location cache
    _currentLocation: null,
    _locationTimestamp: null,
    _watchId: null,

    // Cache duration (5 minutes)
    CACHE_DURATION: 5 * 60 * 1000,

    // Get current location with caching
    async getCurrentLocation(options = {}) {
        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
            useCache: true,
            fallback: {
                lat: 33.5731, // Casablanca default
                lng: -7.5898
            },
            ...options
        };

        // Return cached location if available and fresh
        if (defaultOptions.useCache && this._currentLocation && this._locationTimestamp) {
            const age = Date.now() - this._locationTimestamp;
            if (age < this.CACHE_DURATION) {
                return {
                    success: true,
                    location: this._currentLocation,
                    fromCache: true,
                    age
                };
            }
        }

        try {
            const position = await this._getGeolocationPosition(defaultOptions);

            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp
            };

            // Cache the location
            this._currentLocation = location;
            this._locationTimestamp = Date.now();

            return {
                success: true,
                location,
                fromCache: false
            };

        } catch (error) {
            console.warn('Geolocation failed:', error.message);

            // Return fallback location if available
            if (defaultOptions.fallback) {
                return {
                    success: false,
                    error: error.message,
                    fallbackUsed: true,
                    location: {
                        ...defaultOptions.fallback,
                        accuracy: null,
                        timestamp: Date.now()
                    }
                };
            }

            return {
                success: false,
                error: error.message
            };
        }
    },

    // Watch position changes
    watchPosition(onSuccess, onError, options = {}) {
        if (!navigator.geolocation) {
            const error = new Error('Geolocation not supported');
            onError?.(error);
            return null;
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000, // 1 minute
            ...options
        };

        this._watchId = navigator.geolocation.watchPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp
                };

                // Update cache
                this._currentLocation = location;
                this._locationTimestamp = Date.now();

                onSuccess?.(location);
            },
            (error) => {
                console.warn('Geolocation watch error:', error.message);
                onError?.(error);
            },
            defaultOptions
        );

        return this._watchId;
    },

    // Stop watching position
    clearWatch() {
        if (this._watchId) {
            navigator.geolocation.clearWatch(this._watchId);
            this._watchId = null;
        }
    },

    // Reverse geocoding - convert coordinates to address
    async reverseGeocode(lat, lng) {
        try {
            // Using a free geocoding service (you can replace with your preferred service)
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );

            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }

            const data = await response.json();

            return {
                success: true,
                address: {
                    formatted: data.localityInfo?.administrative?.[0]?.name ||
                        `${data.locality}, ${data.countryName}`,
                    street: data.localityInfo?.administrative?.[3]?.name || '',
                    city: data.locality || '',
                    region: data.principalSubdivision || '',
                    country: data.countryName || '',
                    countryCode: data.countryCode || '',
                    postalCode: data.postcode || ''
                }
            };

        } catch (error) {
            console.warn('Reverse geocoding failed:', error.message);
            return {
                success: false,
                error: error.message,
                address: {
                    formatted: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                    street: '',
                    city: '',
                    region: '',
                    country: '',
                    countryCode: '',
                    postalCode: ''
                }
            };
        }
    },

    // Forward geocoding - convert address to coordinates
    async geocode(address) {
        try {
            // Using Nominatim (OpenStreetMap) for free geocoding
            const encodedAddress = encodeURIComponent(address);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&countrycodes=ma&accept-language=en`
            );

            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                return {
                    success: false,
                    error: 'No results found',
                    results: []
                };
            }

            const results = data.map(item => ({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                formatted: item.display_name,
                importance: item.importance || 0,
                type: item.type || 'unknown',
                bbox: item.boundingbox ? {
                    north: parseFloat(item.boundingbox[1]),
                    south: parseFloat(item.boundingbox[0]),
                    east: parseFloat(item.boundingbox[3]),
                    west: parseFloat(item.boundingbox[2])
                } : null
            }));

            return {
                success: true,
                results,
                primary: results[0]
            };

        } catch (error) {
            console.warn('Geocoding failed:', error.message);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    },

    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this._toRadians(lat2 - lat1);
        const dLng = this._toRadians(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._toRadians(lat1)) * Math.cos(this._toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Calculate bearing between two points
    calculateBearing(lat1, lng1, lat2, lng2) {
        const dLng = this._toRadians(lng2 - lng1);
        const lat1Rad = this._toRadians(lat1);
        const lat2Rad = this._toRadians(lat2);

        const x = Math.sin(dLng) * Math.cos(lat2Rad);
        const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

        const bearing = Math.atan2(x, y);
        return (this._toDegrees(bearing) + 360) % 360;
    },

    // Check if point is within radius of center
    isWithinRadius(centerLat, centerLng, pointLat, pointLng, radiusKm) {
        const distance = this.calculateDistance(centerLat, centerLng, pointLat, pointLng);
        return distance <= radiusKm;
    },

    // Get bounding box for a center point and radius
    getBoundingBox(lat, lng, radiusKm) {
        const R = 6371; // Earth's radius in km
        const latDelta = (radiusKm / R) * (180 / Math.PI);
        const lngDelta = (radiusKm / R) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

        return {
            north: lat + latDelta,
            south: lat - latDelta,
            east: lng + lngDelta,
            west: lng - lngDelta
        };
    },

    // Filter items by distance from center point
    filterByDistance(items, centerLat, centerLng, radiusKm) {
        return items.filter(item =>
            this.isWithinRadius(centerLat, centerLng, item.latitude, item.longitude, radiusKm)
        ).map(item => ({
            ...item,
            distance: this.calculateDistance(centerLat, centerLng, item.latitude, item.longitude)
        })).sort((a, b) => a.distance - b.distance);
    },

    // Get user's saved locations (if implemented in your API)
    async getSavedLocations() {
        try {
            const response = await apiClient.get('/user/locations');
            return {
                success: true,
                locations: response.data || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                locations: []
            };
        }
    },

    // Save a location for the user
    async saveLocation(name, lat, lng, address = '') {
        try {
            const response = await apiClient.post('/user/locations', {
                name,
                latitude: lat,
                longitude: lng,
                address
            });

            return {
                success: true,
                location: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Clear location cache
    clearCache() {
        this._currentLocation = null;
        this._locationTimestamp = null;
    },

    // Check if geolocation is supported
    isSupported() {
        return 'geolocation' in navigator;
    },

    // Check geolocation permissions
    async checkPermissions() {
        if (!navigator.permissions) {
            return 'unsupported';
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            return permission.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            return 'unsupported';
        }
    },

    // Private helper methods
    _getGeolocationPosition(options) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    },

    _toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    _toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
};