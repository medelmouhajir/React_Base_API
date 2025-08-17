// =============================================================================
// GEOGRAPHIC UTILITIES
// =============================================================================
import { MAP_CONFIG, GEOLOCATION_CONFIG } from './mapConstants.js';

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude  
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export const toDegrees = (radians) => {
    return radians * (180 / Math.PI);
};

/**
 * Calculate the center point of multiple locations
 * @param {Array} locations - Array of {lat, lng} objects
 * @returns {Object|null} Center point {lat, lng} or null if empty array
 */
export const calculateCenter = (locations) => {
    if (!locations || locations.length === 0) return null;

    if (locations.length === 1) {
        return { lat: locations[0].latitude || locations[0].lat, lng: locations[0].longitude || locations[0].lng };
    }

    let totalLat = 0;
    let totalLng = 0;

    locations.forEach(location => {
        totalLat += location.latitude || location.lat;
        totalLng += location.longitude || location.lng;
    });

    return {
        lat: totalLat / locations.length,
        lng: totalLng / locations.length
    };
};

/**
 * Calculate bounding box for multiple locations
 * @param {Array} locations - Array of {lat, lng} objects  
 * @returns {Object|null} Bounds {north, south, east, west} or null
 */
export const calculateBounds = (locations) => {
    if (!locations || locations.length === 0) return null;

    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;

    locations.forEach(location => {
        const lat = location.latitude || location.lat;
        const lng = location.longitude || location.lng;

        if (lat > north) north = lat;
        if (lat < south) south = lat;
        if (lng > east) east = lng;
        if (lng < west) west = lng;
    });

    return { north, south, east, west };
};

/**
 * Get optimal zoom level for given bounds
 * @param {Object} bounds - Bounds {north, south, east, west}
 * @param {Object} mapSize - Map container size {width, height}
 * @returns {number} Optimal zoom level
 */
export const getOptimalZoom = (bounds, mapSize = { width: 800, height: 600 }) => {
    if (!bounds) return MAP_CONFIG.DEFAULT_ZOOM;

    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;

    // Calculate zoom based on latitude difference (simplified)
    const latZoom = Math.floor(Math.log2(360 / latDiff));
    const lngZoom = Math.floor(Math.log2(360 / lngDiff));

    const zoom = Math.min(latZoom, lngZoom, MAP_CONFIG.MAX_ZOOM);
    return Math.max(zoom, MAP_CONFIG.MIN_ZOOM);
};

/**
 * Check if a point is within given bounds
 * @param {Object} point - Point {lat, lng}
 * @param {Object} bounds - Bounds {north, south, east, west}
 * @returns {boolean} True if point is within bounds
 */
export const isPointInBounds = (point, bounds) => {
    if (!point || !bounds) return false;

    const lat = point.latitude || point.lat;
    const lng = point.longitude || point.lng;

    return lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east;
};

/**
 * Check if a point is within Morocco's boundaries
 * @param {Object} point - Point {lat, lng}
 * @returns {boolean} True if point is within Morocco
 */
export const isPointInMorocco = (point) => {
    return isPointInBounds(point, MAP_CONFIG.MOROCCO_BOUNDS);
};

/**
 * Filter locations within a radius from a center point
 * @param {Array} locations - Array of location objects
 * @param {Object} center - Center point {lat, lng}
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered locations within radius
 */
export const filterLocationsByRadius = (locations, center, radiusKm) => {
    if (!locations || !center || !radiusKm) return locations || [];

    return locations.filter(location => {
        const distance = calculateDistance(
            center.lat, center.lng,
            location.latitude || location.lat,
            location.longitude || location.lng
        );
        return distance <= radiusKm;
    });
};

/**
 * Sort locations by distance from a center point
 * @param {Array} locations - Array of location objects
 * @param {Object} center - Center point {lat, lng}
 * @returns {Array} Locations sorted by distance (closest first)
 */
export const sortLocationsByDistance = (locations, center) => {
    if (!locations || !center) return locations || [];

    return [...locations].sort((a, b) => {
        const distanceA = calculateDistance(
            center.lat, center.lng,
            a.latitude || a.lat,
            a.longitude || a.lng
        );
        const distanceB = calculateDistance(
            center.lat, center.lng,
            b.latitude || b.lat,
            b.longitude || b.lng
        );
        return distanceA - distanceB;
    });
};

/**
 * Generate viewport bounds from center point and zoom level
 * @param {Object} center - Center point {lat, lng}
 * @param {number} zoom - Zoom level
 * @param {Object} mapSize - Map container size {width, height}
 * @returns {Object} Viewport bounds {north, south, east, west}
 */
export const generateViewportBounds = (center, zoom, mapSize = { width: 800, height: 600 }) => {
    // Simplified calculation - in reality, this depends on map projection
    const latRange = 180 / Math.pow(2, zoom);
    const lngRange = 360 / Math.pow(2, zoom);

    const aspectRatio = mapSize.width / mapSize.height;
    const adjustedLngRange = lngRange * aspectRatio;

    return {
        north: center.lat + (latRange / 2),
        south: center.lat - (latRange / 2),
        east: center.lng + (adjustedLngRange / 2),
        west: center.lng - (adjustedLngRange / 2)
    };
};

/**
 * Validate geographic coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid
 */
export const validateCoordinates = (lat, lng) => {
    return typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180 &&
        !isNaN(lat) && !isNaN(lng);
};

/**
 * Get the closest fallback location to a given point
 * @param {Object} point - Point {lat, lng}
 * @returns {Object} Closest fallback location
 */
export const getClosestFallbackLocation = (point) => {
    if (!point) return GEOLOCATION_CONFIG.FALLBACK_LOCATIONS.casablanca;

    const fallbackLocations = Object.values(GEOLOCATION_CONFIG.FALLBACK_LOCATIONS);
    let closest = fallbackLocations[0];
    let minDistance = calculateDistance(
        point.lat, point.lng,
        closest.lat, closest.lng
    );

    fallbackLocations.slice(1).forEach(location => {
        const distance = calculateDistance(
            point.lat, point.lng,
            location.lat, location.lng
        );
        if (distance < minDistance) {
            minDistance = distance;
            closest = location;
        }
    });

    return closest;
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)}km`;
    } else {
        return `${Math.round(distanceKm)}km`;
    }
};

/**
 * Create a circular area around a point
 * @param {Object} center - Center point {lat, lng}
 * @param {number} radiusKm - Radius in kilometers
 * @param {number} points - Number of points to generate for the circle
 * @returns {Array} Array of {lat, lng} points forming a circle
 */
export const createCircle = (center, radiusKm, points = 32) => {
    const circle = [];
    const radiusInDegrees = radiusKm / 111.32; // Rough conversion for latitude

    for (let i = 0; i < points; i++) {
        const angle = (i * 2 * Math.PI) / points;
        const lat = center.lat + (radiusInDegrees * Math.cos(angle));
        const lng = center.lng + (radiusInDegrees * Math.sin(angle) / Math.cos(toRadians(center.lat)));
        circle.push({ lat, lng });
    }

    return circle;
};

/**
 * Expand bounds by a percentage or fixed amount
 * @param {Object} bounds - Original bounds {north, south, east, west}
 * @param {number} padding - Padding as percentage (0.1 = 10%) or absolute value
 * @param {boolean} isPercentage - Whether padding is percentage or absolute
 * @returns {Object} Expanded bounds
 */
export const expandBounds = (bounds, padding = 0.1, isPercentage = true) => {
    if (!bounds) return null;

    let latPadding, lngPadding;

    if (isPercentage) {
        latPadding = (bounds.north - bounds.south) * padding;
        lngPadding = (bounds.east - bounds.west) * padding;
    } else {
        latPadding = padding;
        lngPadding = padding;
    }

    return {
        north: bounds.north + latPadding,
        south: bounds.south - latPadding,
        east: bounds.east + lngPadding,
        west: bounds.west - lngPadding
    };
};

/**
 * Convert location objects to consistent format
 * @param {Object} location - Location with various possible formats
 * @returns {Object} Normalized location {lat, lng}
 */
export const normalizeLocation = (location) => {
    if (!location) return null;

    // Handle different property names
    const lat = location.latitude || location.lat || location.y;
    const lng = location.longitude || location.lng || location.lon || location.x;

    if (!validateCoordinates(lat, lng)) return null;

    return { lat, lng };
};

/**
 * Create bounds from center point and radius
 * @param {Object} center - Center point {lat, lng}
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounds {north, south, east, west}
 */
export const createBoundsFromCenter = (center, radiusKm) => {
    if (!center || !radiusKm) return null;

    // Approximate degrees per kilometer
    const latDegreePerKm = 1 / 111.32;
    const lngDegreePerKm = 1 / (111.32 * Math.cos(toRadians(center.lat)));

    const latOffset = radiusKm * latDegreePerKm;
    const lngOffset = radiusKm * lngDegreePerKm;

    return {
        north: center.lat + latOffset,
        south: center.lat - latOffset,
        east: center.lng + lngOffset,
        west: center.lng - lngOffset
    };
};

/**
 * Calculate bearing between two points
 * @param {Object} start - Start point {lat, lng}
 * @param {Object} end - End point {lat, lng}  
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (start, end) => {
    const startLat = toRadians(start.lat);
    const startLng = toRadians(start.lng);
    const endLat = toRadians(end.lat);
    const endLng = toRadians(end.lng);

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
};

export default {
    calculateDistance,
    toRadians,
    toDegrees,
    calculateCenter,
    calculateBounds,
    getOptimalZoom,
    isPointInBounds,
    isPointInMorocco,
    filterLocationsByRadius,
    sortLocationsByDistance,
    generateViewportBounds,
    validateCoordinates,
    getClosestFallbackLocation,
    formatDistance,
    createCircle,
    expandBounds,
    normalizeLocation,
    calculateBearing,
    createBoundsFromCenter
};