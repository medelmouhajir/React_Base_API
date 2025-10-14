/**
 * Map Optimization Utilities
 * Performance utilities for optimizing map rendering and interactions
 */

import L from 'leaflet';

/**
 * Calculate optimal map bounds for a collection of vehicles or coordinates
 * @param {Object} data - Data containing vehicles or coordinates
 * @returns {L.LatLngBounds} - Leaflet bounds object
 */
export const calculateMapBounds = (data) => {
    let coordinates = [];

    // Extract coordinates from different data structures
    if (data.vehicles && Array.isArray(data.vehicles)) {
        coordinates = data.vehicles
            .filter(v => v.lastLocation && v.lastLocation.latitude && v.lastLocation.longitude)
            .map(v => [v.lastLocation.latitude, v.lastLocation.longitude]);
    } else if (data.coordinates && Array.isArray(data.coordinates)) {
        coordinates = data.coordinates
            .filter(c => c.latitude && c.longitude)
            .map(c => [c.latitude, c.longitude]);
    } else if (data.bounds) {
        // Use provided bounds
        return L.latLngBounds([
            [data.bounds.south, data.bounds.west],
            [data.bounds.north, data.bounds.east]
        ]);
    }

    if (coordinates.length === 0) {
        // Default to Morocco bounds if no coordinates
        return L.latLngBounds([
            [27.662, -13.169], // Southwest
            [35.922, -0.997]   // Northeast
        ]);
    }

    if (coordinates.length === 1) {
        // Single point - create small bounds around it
        const point = coordinates[0];
        const offset = 0.01; // ~1km
        return L.latLngBounds([
            [point[0] - offset, point[1] - offset],
            [point[0] + offset, point[1] + offset]
        ]);
    }

    // Multiple points - calculate bounds with padding
    const bounds = L.latLngBounds(coordinates);

    // Add padding based on bounds size
    const center = bounds.getCenter();
    const size = Math.max(bounds.getNorth() - bounds.getSouth(), bounds.getEast() - bounds.getWest());
    const padding = Math.max(0.001, size * 0.1); // 10% padding, minimum 0.001 degrees

    return L.latLngBounds([
        [bounds.getSouth() - padding, bounds.getWest() - padding],
        [bounds.getNorth() + padding, bounds.getEast() + padding]
    ]);
};

/**
 * Optimize marker rendering based on zoom level and density
 * @param {Array} vehicles - Array of vehicle objects
 * @param {number} zoomLevel - Current map zoom level
 * @param {Object} viewBounds - Current map view bounds
 * @returns {Array} - Optimized vehicles array
 */
export const optimizeMarkerRendering = (vehicles, zoomLevel = 12, viewBounds = null) => {
    if (!Array.isArray(vehicles)) return [];

    let filteredVehicles = vehicles.filter(vehicle =>
        vehicle.lastLocation &&
        vehicle.lastLocation.latitude &&
        vehicle.lastLocation.longitude
    );

    // Filter by view bounds if provided
    if (viewBounds) {
        filteredVehicles = filteredVehicles.filter(vehicle => {
            const lat = vehicle.lastLocation.latitude;
            const lng = vehicle.lastLocation.longitude;
            return lat >= viewBounds.south && lat <= viewBounds.north &&
                lng >= viewBounds.west && lng <= viewBounds.east;
        });
    }

    // Optimize based on zoom level
    if (zoomLevel < 10) {
        // Very zoomed out - show only moving vehicles or those with alerts
        return filteredVehicles.filter(vehicle =>
            vehicle.isMoving || vehicle.hasAlerts
        ).slice(0, 50); // Limit to 50 markers at low zoom
    } else if (zoomLevel < 13) {
        // Medium zoom - show online vehicles, limit total
        return filteredVehicles.filter(vehicle => vehicle.isOnline).slice(0, 100);
    } else if (zoomLevel < 15) {
        // High zoom - show most vehicles, reasonable limit
        return filteredVehicles.slice(0, 200);
    }

    // Very high zoom - show all vehicles in view
    return filteredVehicles;
};

/**
 * Cluster nearby vehicles for better performance and cleaner display
 * @param {Array} vehicles - Array of vehicle objects
 * @param {number} clusterRadius - Clustering radius in meters
 * @param {number} zoomLevel - Current zoom level
 * @returns {Array} - Array of clusters and individual vehicles
 */
export const clusterVehicles = (vehicles, clusterRadius = 100, zoomLevel = 12) => {
    if (!Array.isArray(vehicles) || vehicles.length === 0) return [];

    const clusters = [];
    const processed = new Set();

    // Adjust cluster radius based on zoom level
    const adjustedRadius = clusterRadius * Math.pow(2, 15 - zoomLevel);

    vehicles.forEach((vehicle, index) => {
        if (processed.has(index) || !vehicle.lastLocation) return;

        const vehicleLat = vehicle.lastLocation.latitude;
        const vehicleLng = vehicle.lastLocation.longitude;
        const nearbyVehicles = [vehicle];
        processed.add(index);

        // Find nearby vehicles
        vehicles.forEach((otherVehicle, otherIndex) => {
            if (processed.has(otherIndex) || !otherVehicle.lastLocation || index === otherIndex) return;

            const otherLat = otherVehicle.lastLocation.latitude;
            const otherLng = otherVehicle.lastLocation.longitude;

            const distance = calculateDistanceInMeters(vehicleLat, vehicleLng, otherLat, otherLng);

            if (distance <= adjustedRadius) {
                nearbyVehicles.push(otherVehicle);
                processed.add(otherIndex);
            }
        });

        if (nearbyVehicles.length > 1) {
            // Create cluster
            const centerLat = nearbyVehicles.reduce((sum, v) => sum + v.lastLocation.latitude, 0) / nearbyVehicles.length;
            const centerLng = nearbyVehicles.reduce((sum, v) => sum + v.lastLocation.longitude, 0) / nearbyVehicles.length;

            clusters.push({
                type: 'cluster',
                id: `cluster-${index}`,
                position: [centerLat, centerLng],
                vehicles: nearbyVehicles,
                count: nearbyVehicles.length,
                hasMoving: nearbyVehicles.some(v => v.isMoving),
                hasAlerts: nearbyVehicles.some(v => v.hasAlerts),
                hasOffline: nearbyVehicles.some(v => !v.isOnline)
            });
        } else {
            // Single vehicle
            clusters.push({
                type: 'vehicle',
                ...vehicle
            });
        }
    });

    return clusters;
};

/**
 * Calculate distance between two points in meters
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} - Distance in meters
 */
const calculateDistanceInMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Debounce map events to improve performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} - Debounced function
 */
export const debounceMapEvent = (func, wait = 250, immediate = false) => {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func(...args);
    };
};

/**
 * Throttle map events for better performance
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttleMapEvent = (func, limit = 100) => {
    let inThrottle;

    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Optimize route rendering based on complexity and zoom level
 * @param {Array} coordinates - Route coordinates
 * @param {number} zoomLevel - Current zoom level
 * @param {number} maxPoints - Maximum points to render
 * @returns {Array} - Optimized coordinates
 */
export const optimizeRouteRendering = (coordinates, zoomLevel = 12, maxPoints = 1000) => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) return [];

    // If route is already simple enough, return as-is
    if (coordinates.length <= maxPoints) {
        return coordinates;
    }

    // Calculate simplification factor based on zoom level
    const simplificationFactor = Math.max(1, Math.floor(coordinates.length / maxPoints));
    const adjustedFactor = Math.max(1, simplificationFactor * Math.pow(2, 15 - zoomLevel));

    // Always keep first and last points
    const simplified = [coordinates[0]];

    // Add intermediate points based on simplification factor
    for (let i = adjustedFactor; i < coordinates.length - 1; i += adjustedFactor) {
        simplified.push(coordinates[i]);
    }

    // Always add the last point
    if (coordinates.length > 1) {
        simplified.push(coordinates[coordinates.length - 1]);
    }

    return simplified;
};

/**
 * Calculate optimal tile layer based on map usage and device capabilities
 * @param {Object} deviceInfo - Device capability information
 * @param {string} usage - Usage type (tracking, analysis, etc.)
 * @returns {Object} - Optimal tile layer configuration
 */
export const getOptimalTileLayer = (deviceInfo = {}, usage = 'tracking') => {
    const isMobile = deviceInfo.isMobile || false;
    const hasRetina = deviceInfo.hasRetina || false;
    const isLowBandwidth = deviceInfo.isLowBandwidth || false;

    const configs = {
        // High quality for desktop analysis
        desktop_analysis: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; Esri',
            maxZoom: 19,
            tileSize: hasRetina ? 512 : 256,
            zoomOffset: hasRetina ? -1 : 0
        },

        // Balanced for desktop tracking
        desktop_tracking: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18,
            tileSize: 256
        },

        // Optimized for mobile
        mobile: {
            url: isLowBandwidth ?
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' :
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            attribution: isLowBandwidth ? '&copy; OpenStreetMap' : '&copy; Esri',
            maxZoom: isMobile ? 17 : 18,
            tileSize: 256
        }
    };

    if (isMobile) return configs.mobile;
    return usage === 'analysis' ? configs.desktop_analysis : configs.desktop_tracking;
};

/**
 * Memory management for large datasets
 * @param {Array} items - Items to manage
 * @param {number} maxItems - Maximum items to keep in memory
 * @param {Function} priorityFn - Function to determine item priority
 * @returns {Array} - Managed items array
 */
export const manageMapMemory = (items, maxItems = 500, priorityFn = null) => {
    if (!Array.isArray(items) || items.length <= maxItems) {
        return items;
    }

    if (priorityFn && typeof priorityFn === 'function') {
        // Sort by priority and take top items
        return items
            .sort((a, b) => priorityFn(b) - priorityFn(a))
            .slice(0, maxItems);
    }

    // Default: keep most recent items
    return items.slice(-maxItems);
};

/**
 * Detect device capabilities for map optimization
 * @returns {Object} - Device capability information
 */
export const detectDeviceCapabilities = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    return {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        hasRetina: window.devicePixelRatio > 1,
        hasWebGL: !!gl,
        hasTouch: 'ontouchstart' in window,
        connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
        isLowBandwidth: navigator.connection ?
            ['slow-2g', '2g'].includes(navigator.connection.effectiveType) : false,
        memory: navigator.deviceMemory || 4, // GB
        cores: navigator.hardwareConcurrency || 2
    };
};

/**
 * Optimize map performance based on device capabilities
 * @param {Object} mapInstance - Leaflet map instance
 * @param {Object} deviceInfo - Device capabilities
 */
export const optimizeMapPerformance = (mapInstance, deviceInfo = null) => {
    if (!mapInstance) return;

    const device = deviceInfo || detectDeviceCapabilities();

    // Disable animations on low-end devices
    if (device.memory < 4 || device.cores < 4) {
        mapInstance.options.fadeAnimation = false;
        mapInstance.options.zoomAnimation = false;
        mapInstance.options.markerZoomAnimation = false;
    }

    // Adjust zoom speed for mobile
    if (device.isMobile) {
        mapInstance.options.wheelDebounceTime = 100;
        mapInstance.options.wheelPxPerZoomLevel = 120;
    }

    // Disable some features for low bandwidth
    if (device.isLowBandwidth) {
        mapInstance.options.preferCanvas = true;
    }

    // Enable hardware acceleration where available
    if (device.hasWebGL) {
        mapInstance.options.preferCanvas = false;
    }
};

/**
 * Cache management for map tiles and data
 */
class MapCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    set(key, value, ttl = 300000) { // 5 minutes default TTL
        if (this.cache.size >= this.maxSize) {
            // Remove oldest entries
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

// Global cache instance
export const mapCache = new MapCache(200);

/**
 * Batch process map updates for better performance
 * @param {Array} updates - Array of update operations
 * @param {number} batchSize - Size of each batch
 * @param {number} delay - Delay between batches in ms
 * @returns {Promise} - Promise that resolves when all batches are processed
 */
export const batchMapUpdates = (updates, batchSize = 50, delay = 16) => {
    return new Promise((resolve) => {
        if (!Array.isArray(updates) || updates.length === 0) {
            resolve();
            return;
        }

        let currentIndex = 0;

        const processBatch = () => {
            const batch = updates.slice(currentIndex, currentIndex + batchSize);

            batch.forEach(update => {
                if (typeof update === 'function') {
                    update();
                }
            });

            currentIndex += batchSize;

            if (currentIndex < updates.length) {
                setTimeout(processBatch, delay);
            } else {
                resolve();
            }
        };

        processBatch();
    });
};

export default {
    calculateMapBounds,
    optimizeMarkerRendering,
    clusterVehicles,
    debounceMapEvent,
    throttleMapEvent,
    optimizeRouteRendering,
    getOptimalTileLayer,
    manageMapMemory,
    detectDeviceCapabilities,
    optimizeMapPerformance,
    mapCache,
    batchMapUpdates
};