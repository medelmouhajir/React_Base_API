/**
 * Map Utility Functions
 * Collection of utility functions for map operations, calculations, and transformations
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

// =============================================================================
// GEOGRAPHIC CALCULATIONS
// =============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
export const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {number} radians - Radians to convert
 * @returns {number} Degrees
 */
export const toDegrees = (radians) => {
    return radians * (180 / Math.PI);
};

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Start latitude
 * @param {number} lng1 - Start longitude
 * @param {number} lat2 - End latitude
 * @param {number} lng2 - End longitude
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (lat1, lng1, lat2, lng2) => {
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δλ = toRadians(lng2 - lng1);

    const x = Math.sin(Δλ) * Math.cos(φ2);
    const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(x, y);
    return (toDegrees(θ) + 360) % 360;
};

/**
 * Get compass direction from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Compass direction (N, NE, E, etc.)
 */
export const getCompassDirection = (bearing) => {
    const directions = [
        'N', 'NNE', 'NE', 'ENE',
        'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW',
        'W', 'WNW', 'NW', 'NNW'
    ];

    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
};

/**
 * Calculate destination point given distance and bearing
 * @param {number} lat - Start latitude
 * @param {number} lng - Start longitude
 * @param {number} distance - Distance in kilometers
 * @param {number} bearing - Bearing in degrees
 * @returns {Object} Destination coordinates {lat, lng}
 */
export const calculateDestination = (lat, lng, distance, bearing) => {
    const R = 6371; // Earth's radius in km
    const δ = distance / R; // Angular distance
    const θ = toRadians(bearing);
    const φ1 = toRadians(lat);
    const λ1 = toRadians(lng);

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) +
        Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));

    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

    return {
        lat: toDegrees(φ2),
        lng: toDegrees(λ2)
    };
};

// =============================================================================
// BOUNDS OPERATIONS
// =============================================================================

/**
 * Create bounds from center point and radius
 * @param {Object} center - Center coordinates {lat, lng}
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounds {north, south, east, west}
 */
export const createBoundsFromRadius = (center, radiusKm) => {
    const latDelta = radiusKm / 111; // Approximate: 1 degree latitude ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos(toRadians(center.lat)));

    return {
        north: center.lat + latDelta,
        south: center.lat - latDelta,
        east: center.lng + lngDelta,
        west: center.lng - lngDelta
    };
};

/**
 * Check if point is within bounds
 * @param {number} lat - Point latitude
 * @param {number} lng - Point longitude
 * @param {Object} bounds - Bounds {north, south, east, west}
 * @returns {boolean} Whether point is within bounds
 */
export const isPointInBounds = (lat, lng, bounds) => {
    return lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east;
};

/**
 * Calculate bounds area in square kilometers
 * @param {Object} bounds - Bounds {north, south, east, west}
 * @returns {number} Area in square kilometers
 */
export const calculateBoundsArea = (bounds) => {
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;

    // Approximate calculation
    const latKm = latDiff * 111;
    const lngKm = lngDiff * 111 * Math.cos(toRadians((bounds.south + bounds.north) / 2));

    return Math.abs(latKm * lngKm);
};

/**
 * Expand bounds by percentage
 * @param {Object} bounds - Original bounds
 * @param {number} percentage - Expansion percentage (0.1 = 10%)
 * @returns {Object} Expanded bounds
 */
export const expandBounds = (bounds, percentage) => {
    const latExpansion = (bounds.north - bounds.south) * percentage / 2;
    const lngExpansion = (bounds.east - bounds.west) * percentage / 2;

    return {
        north: bounds.north + latExpansion,
        south: bounds.south - latExpansion,
        east: bounds.east + lngExpansion,
        west: bounds.west - lngExpansion
    };
};

/**
 * Merge multiple bounds into one
 * @param {Array} boundsArray - Array of bounds objects
 * @returns {Object} Merged bounds
 */
export const mergeBounds = (boundsArray) => {
    if (!boundsArray || boundsArray.length === 0) return null;
    if (boundsArray.length === 1) return boundsArray[0];

    return boundsArray.reduce((merged, bounds) => ({
        north: Math.max(merged.north, bounds.north),
        south: Math.min(merged.south, bounds.south),
        east: Math.max(merged.east, bounds.east),
        west: Math.min(merged.west, bounds.west)
    }));
};

// =============================================================================
// COORDINATE TRANSFORMATIONS
// =============================================================================

/**
 * Convert coordinates to different formats
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} format - Output format ('dms', 'ddm', 'dd')
 * @returns {Object} Formatted coordinates
 */
export const formatCoordinates = (lat, lng, format = 'dd') => {
    switch (format) {
        case 'dms': // Degrees, Minutes, Seconds
            return {
                lat: convertToDMS(lat, 'lat'),
                lng: convertToDMS(lng, 'lng')
            };

        case 'ddm': // Degrees, Decimal Minutes
            return {
                lat: convertToDDM(lat, 'lat'),
                lng: convertToDDM(lng, 'lng')
            };

        case 'dd': // Decimal Degrees
        default:
            return {
                lat: parseFloat(lat.toFixed(6)),
                lng: parseFloat(lng.toFixed(6))
            };
    }
};

/**
 * Convert decimal degrees to DMS format
 * @param {number} coordinate - Coordinate in decimal degrees
 * @param {string} type - 'lat' or 'lng'
 * @returns {string} DMS formatted string
 */
export const convertToDMS = (coordinate, type) => {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(1);

    const direction = getDirection(coordinate, type);

    return `${degrees}°${minutes}'${seconds}"${direction}`;
};

/**
 * Convert decimal degrees to DDM format
 * @param {number} coordinate - Coordinate in decimal degrees
 * @param {string} type - 'lat' or 'lng'
 * @returns {string} DDM formatted string
 */
export const convertToDDM = (coordinate, type) => {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutes = ((absolute - degrees) * 60).toFixed(3);

    const direction = getDirection(coordinate, type);

    return `${degrees}°${minutes}'${direction}`;
};

/**
 * Get direction letter for coordinate
 * @param {number} coordinate - Coordinate value
 * @param {string} type - 'lat' or 'lng'
 * @returns {string} Direction letter
 */
export const getDirection = (coordinate, type) => {
    if (type === 'lat') {
        return coordinate >= 0 ? 'N' : 'S';
    } else {
        return coordinate >= 0 ? 'E' : 'W';
    }
};

// =============================================================================
// ZOOM LEVEL CALCULATIONS
// =============================================================================

/**
 * Calculate appropriate zoom level for given bounds
 * @param {Object} bounds - Bounds object
 * @param {Object} mapSize - Map container size {width, height}
 * @returns {number} Appropriate zoom level
 */
export const calculateZoomLevel = (bounds, mapSize) => {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 18;

    function latRad(lat) {
        const sin = Math.sin(lat * Math.PI / 180);
        const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    const latFraction = (latRad(bounds.north) - latRad(bounds.south)) / Math.PI;
    const lngDiff = bounds.east - bounds.west;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const latZoom = zoom(mapSize.height, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(mapSize.width, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
};

/**
 * Get resolution for given zoom level
 * @param {number} zoom - Zoom level
 * @returns {number} Resolution in meters per pixel
 */
export const getResolution = (zoom) => {
    return 156543.03392 * Math.cos(0) / Math.pow(2, zoom);
};

// =============================================================================
// CLUSTERING UTILITIES
// =============================================================================

/**
 * Group nearby points for clustering
 * @param {Array} points - Array of points with lat/lng
 * @param {number} radius - Clustering radius in pixels
 * @param {number} zoom - Current zoom level
 * @returns {Array} Clustered groups
 */
export const clusterPoints = (points, radius = 50, zoom = 13) => {
    const clusters = [];
    const processed = new Set();

    points.forEach((point, index) => {
        if (processed.has(index)) return;

        const cluster = {
            center: { lat: point.lat, lng: point.lng },
            points: [point],
            bounds: {
                north: point.lat,
                south: point.lat,
                east: point.lng,
                west: point.lng
            }
        };

        // Find nearby points
        points.forEach((otherPoint, otherIndex) => {
            if (otherIndex === index || processed.has(otherIndex)) return;

            const distance = calculateDistance(
                point.lat, point.lng,
                otherPoint.lat, otherPoint.lng
            );

            // Convert radius from pixels to kilometers at current zoom
            const radiusKm = (radius * getResolution(zoom)) / 1000;

            if (distance <= radiusKm) {
                cluster.points.push(otherPoint);
                processed.add(otherIndex);

                // Update cluster bounds
                cluster.bounds.north = Math.max(cluster.bounds.north, otherPoint.lat);
                cluster.bounds.south = Math.min(cluster.bounds.south, otherPoint.lat);
                cluster.bounds.east = Math.max(cluster.bounds.east, otherPoint.lng);
                cluster.bounds.west = Math.min(cluster.bounds.west, otherPoint.lng);
            }
        });

        // Recalculate center as centroid
        if (cluster.points.length > 1) {
            const totalLat = cluster.points.reduce((sum, p) => sum + p.lat, 0);
            const totalLng = cluster.points.reduce((sum, p) => sum + p.lng, 0);
            cluster.center = {
                lat: totalLat / cluster.points.length,
                lng: totalLng / cluster.points.length
            };
        }

        clusters.push(cluster);
        processed.add(index);
    });

    return clusters;
};

// =============================================================================
// ROUTE UTILITIES
// =============================================================================

/**
 * Simplify route coordinates using Douglas-Peucker algorithm
 * @param {Array} coordinates - Array of [lat, lng] coordinates
 * @param {number} tolerance - Simplification tolerance
 * @returns {Array} Simplified coordinates
 */
export const simplifyRoute = (coordinates, tolerance = 0.001) => {
    if (coordinates.length <= 2) return coordinates;

    const simplified = douglasPeucker(coordinates, tolerance);
    return simplified.length < 2 ? coordinates : simplified;
};

/**
 * Douglas-Peucker line simplification algorithm
 * @param {Array} points - Array of points
 * @param {number} tolerance - Tolerance value
 * @returns {Array} Simplified points
 */
const douglasPeucker = (points, tolerance) => {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;

    for (let i = 1; i < points.length - 1; i++) {
        const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
        if (distance > maxDistance) {
            maxDistance = distance;
            maxIndex = i;
        }
    }

    if (maxDistance > tolerance) {
        const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
        const right = douglasPeucker(points.slice(maxIndex), tolerance);
        return [...left.slice(0, -1), ...right];
    } else {
        return [points[0], points[points.length - 1]];
    }
};

/**
 * Calculate perpendicular distance from point to line
 * @param {Array} point - Point coordinates [lat, lng]
 * @param {Array} lineStart - Line start coordinates [lat, lng]
 * @param {Array} lineEnd - Line end coordinates [lat, lng]
 * @returns {number} Distance
 */
const perpendicularDistance = (point, lineStart, lineEnd) => {
    const [x0, y0] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

    return numerator / denominator;
};

/**
 * Calculate route statistics
 * @param {Array} coordinates - Route coordinates
 * @returns {Object} Route statistics
 */
export const calculateRouteStats = (coordinates) => {
    if (!coordinates || coordinates.length < 2) {
        return {
            distance: 0,
            duration: 0,
            bounds: null,
            elevation: { gain: 0, loss: 0, max: 0, min: 0 }
        };
    }

    let totalDistance = 0;
    let minLat = coordinates[0][0];
    let maxLat = coordinates[0][0];
    let minLng = coordinates[0][1];
    let maxLng = coordinates[0][1];

    for (let i = 1; i < coordinates.length; i++) {
        const prev = coordinates[i - 1];
        const curr = coordinates[i];

        // Calculate distance
        totalDistance += calculateDistance(prev[0], prev[1], curr[0], curr[1]);

        // Update bounds
        minLat = Math.min(minLat, curr[0]);
        maxLat = Math.max(maxLat, curr[0]);
        minLng = Math.min(minLng, curr[1]);
        maxLng = Math.max(maxLng, curr[1]);
    }

    // Estimate duration (assuming average speed of 50 km/h)
    const estimatedDuration = (totalDistance / 50) * 60; // minutes

    return {
        distance: totalDistance,
        duration: estimatedDuration,
        bounds: {
            north: maxLat,
            south: minLat,
            east: maxLng,
            west: minLng
        },
        pointCount: coordinates.length
    };
};

// =============================================================================
// GEOCODING UTILITIES
// =============================================================================

/**
 * Parse address components from geocoding result
 * @param {Object} geocodeResult - Geocoding result object
 * @returns {Object} Parsed address components
 */
export const parseAddressComponents = (geocodeResult) => {
    const address = {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        formatted: geocodeResult.display_name || ''
    };

    if (geocodeResult.address) {
        const addr = geocodeResult.address;

        address.street = addr.road || addr.pedestrian || addr.path || '';
        address.city = addr.city || addr.town || addr.village || addr.hamlet || '';
        address.state = addr.state || addr.province || addr.region || '';
        address.country = addr.country || '';
        address.postalCode = addr.postcode || '';
    }

    return address;
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Whether coordinates are valid
 */
export const isValidCoordinate = (lat, lng) => {
    return typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180 &&
        !isNaN(lat) && !isNaN(lng);
};

/**
 * Normalize coordinates to valid range
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Normalized coordinates
 */
export const normalizeCoordinates = (lat, lng) => {
    // Normalize latitude to [-90, 90]
    let normalizedLat = Math.max(-90, Math.min(90, lat));

    // Normalize longitude to [-180, 180]
    let normalizedLng = lng;
    while (normalizedLng > 180) normalizedLng -= 360;
    while (normalizedLng < -180) normalizedLng += 360;

    return {
        lat: normalizedLat,
        lng: normalizedLng
    };
};

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Create viewport-based data loader
 * @param {Function} loadFunction - Data loading function
 * @param {number} delay - Debounce delay
 * @returns {Function} Debounced loader
 */
export const createViewportLoader = (loadFunction, delay = 300) => {
    return debounce((bounds, zoom, filters) => {
        // Only load if zoom level is appropriate
        if (zoom >= 10) {
            loadFunction(bounds, zoom, filters);
        }
    }, delay);
};

// =============================================================================
// FORMAT UTILITIES
// =============================================================================

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @param {string} unit - Unit preference ('km' | 'mi')
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance, unit = 'km') => {
    if (unit === 'mi') {
        const miles = distance * 0.621371;
        return miles < 1
            ? `${Math.round(miles * 5280)} ft`
            : `${miles.toFixed(1)} mi`;
    }

    return distance < 1
        ? `${Math.round(distance * 1000)} m`
        : `${distance.toFixed(1)} km`;
};

/**
 * Format duration for display
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (minutes) => {
    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (hours < 24) {
        return remainingMinutes > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0
        ? `${days}d ${remainingHours}h`
        : `${days}d`;
};

/**
 * Generate map share URL
 * @param {Object} params - Map parameters
 * @returns {string} Shareable URL
 */
export const generateShareUrl = (params) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlParams = new URLSearchParams();

    if (params.center) {
        urlParams.set('lat', params.center.lat.toFixed(6));
        urlParams.set('lng', params.center.lng.toFixed(6));
    }

    if (params.zoom) {
        urlParams.set('z', params.zoom);
    }

    if (params.layers) {
        urlParams.set('layers', params.layers.join(','));
    }

    if (params.filters) {
        urlParams.set('filters', btoa(JSON.stringify(params.filters)));
    }

    return `${baseUrl}?${urlParams.toString()}`;
};

/**
 * Parse map parameters from URL
 * @param {string} url - URL to parse
 * @returns {Object} Parsed parameters
 */
export const parseMapUrl = (url = window.location.href) => {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    const result = {};

    const lat = params.get('lat');
    const lng = params.get('lng');
    if (lat && lng) {
        result.center = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };
    }

    const zoom = params.get('z');
    if (zoom) {
        result.zoom = parseInt(zoom);
    }

    const layers = params.get('layers');
    if (layers) {
        result.layers = layers.split(',');
    }

    const filters = params.get('filters');
    if (filters) {
        try {
            result.filters = JSON.parse(atob(filters));
        } catch (e) {
            console.warn('Failed to parse filters from URL:', e);
        }
    }

    return result;
};

// =============================================================================
// EXPORT ALL UTILITIES
// =============================================================================

export default {
    // Geographic calculations
    calculateDistance,
    toRadians,
    toDegrees,
    calculateBearing,
    getCompassDirection,
    calculateDestination,

    // Bounds operations
    createBoundsFromRadius,
    isPointInBounds,
    calculateBoundsArea,
    expandBounds,
    mergeBounds,

    // Coordinate transformations
    formatCoordinates,
    convertToDMS,
    convertToDDM,
    getDirection,

    // Zoom calculations
    calculateZoomLevel,
    getResolution,

    // Clustering
    clusterPoints,

    // Route utilities
    simplifyRoute,
    calculateRouteStats,

    // Geocoding
    parseAddressComponents,
    isValidCoordinate,
    normalizeCoordinates,

    // Performance
    debounce,
    throttle,
    createViewportLoader,

    // Formatting
    formatDistance,
    formatDuration,
    generateShareUrl,
    parseMapUrl
};