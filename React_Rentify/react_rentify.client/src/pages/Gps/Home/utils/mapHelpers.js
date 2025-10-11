// src/pages/Gps/Home/utils/mapHelpers.js

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
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
 * @param {number} degrees
 * @returns {number} Radians
 */
export const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {number} radians
 * @returns {number} Degrees
 */
export const toDegrees = (radians) => {
    return radians * (180 / Math.PI);
};

/**
 * Calculate bearing between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = toRadians(lon2 - lon1);
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
};

/**
 * Get compass direction from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
export const getCompassDirection = (bearing) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
};

/**
 * Calculate bounds from an array of coordinates
 * @param {Array} coordinates - Array of [lat, lng] coordinates
 * @returns {Object} Bounds object with north, south, east, west
 */
export const calculateBounds = (coordinates) => {
    if (!coordinates || coordinates.length === 0) {
        return null;
    }

    let north = -90, south = 90, east = -180, west = 180;

    coordinates.forEach(([lat, lng]) => {
        if (lat > north) north = lat;
        if (lat < south) south = lat;
        if (lng > east) east = lng;
        if (lng < west) west = lng;
    });

    // Add small padding to bounds
    const latPadding = (north - south) * 0.1;
    const lngPadding = (east - west) * 0.1;

    return {
        north: north + latPadding,
        south: south - latPadding,
        east: east + lngPadding,
        west: west - lngPadding
    };
};

/**
 * Get center point from bounds
 * @param {Object} bounds - Bounds object
 * @returns {Array} [lat, lng] center coordinates
 */
export const getBoundsCenter = (bounds) => {
    if (!bounds) return null;

    return [
        (bounds.north + bounds.south) / 2,
        (bounds.east + bounds.west) / 2
    ];
};

/**
 * Check if coordinates are valid
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid
 */
export const isValidCoordinate = (lat, lng) => {
    return typeof lat === 'number' && typeof lng === 'number' &&
        !isNaN(lat) && !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180;
};

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places (default 6)
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (lat, lng, precision = 6) => {
    if (!isValidCoordinate(lat, lng)) {
        return 'Invalid coordinates';
    }

    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

/**
 * Get appropriate zoom level for distance
 * @param {number} distance - Distance in meters
 * @returns {number} Appropriate zoom level
 */
export const getZoomForDistance = (distance) => {
    if (distance < 100) return 18;
    if (distance < 500) return 16;
    if (distance < 1000) return 15;
    if (distance < 5000) return 13;
    if (distance < 10000) return 12;
    if (distance < 20000) return 11;
    if (distance < 50000) return 10;
    if (distance < 100000) return 9;
    return 8;
};

/**
 * Simplify path using Douglas-Peucker algorithm
 * @param {Array} points - Array of [lat, lng] points
 * @param {number} tolerance - Simplification tolerance
 * @returns {Array} Simplified points array
 */
export const simplifyPath = (points, tolerance = 0.0001) => {
    if (points.length <= 2) return points;

    const simplified = douglasPeucker(points, tolerance);
    return simplified.length < 2 ? points : simplified;
};

/**
 * Douglas-Peucker path simplification algorithm
 * @param {Array} points - Array of points
 * @param {number} tolerance - Tolerance value
 * @returns {Array} Simplified points
 */
const douglasPeucker = (points, tolerance) => {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;
    const end = points.length - 1;

    // Find the point with maximum distance from the line
    for (let i = 1; i < end; i++) {
        const distance = perpendicularDistance(points[i], points[0], points[end]);
        if (distance > maxDistance) {
            maxDistance = distance;
            maxIndex = i;
        }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
        const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
        const right = douglasPeucker(points.slice(maxIndex), tolerance);

        // Combine results
        return [...left.slice(0, -1), ...right];
    }

    // Return only start and end points
    return [points[0], points[end]];
};

/**
 * Calculate perpendicular distance from point to line
 * @param {Array} point - Point [lat, lng]
 * @param {Array} lineStart - Line start [lat, lng]
 * @param {Array} lineEnd - Line end [lat, lng]
 * @returns {number} Distance
 */
const perpendicularDistance = (point, lineStart, lineEnd) => {
    const [x0, y0] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const A = x0 - x1;
    const B = y0 - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    const param = dot / lenSq;
    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x0 - xx;
    const dy = y0 - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Create marker cluster bounds
 * @param {Array} markers - Array of marker objects with lat/lng
 * @param {number} clusterRadius - Clustering radius in pixels
 * @param {number} zoom - Current zoom level
 * @returns {Array} Array of cluster groups
 */
export const createMarkerClusters = (markers, clusterRadius = 50, zoom = 10) => {
    if (!markers?.length) return [];

    const clusters = [];
    const processed = new Set();

    markers.forEach((marker, index) => {
        if (processed.has(index)) return;

        const cluster = {
            center: [marker.lat, marker.lng],
            markers: [marker],
            bounds: {
                north: marker.lat,
                south: marker.lat,
                east: marker.lng,
                west: marker.lng
            }
        };

        // Find nearby markers to cluster
        markers.forEach((otherMarker, otherIndex) => {
            if (otherIndex === index || processed.has(otherIndex)) return;

            const distance = calculateDistance(
                marker.lat, marker.lng,
                otherMarker.lat, otherMarker.lng
            );

            // Convert cluster radius from pixels to meters based on zoom
            const radiusInMeters = (clusterRadius * 40075000) / (256 * Math.pow(2, zoom));

            if (distance <= radiusInMeters) {
                cluster.markers.push(otherMarker);
                processed.add(otherIndex);

                // Update cluster bounds
                cluster.bounds.north = Math.max(cluster.bounds.north, otherMarker.lat);
                cluster.bounds.south = Math.min(cluster.bounds.south, otherMarker.lat);
                cluster.bounds.east = Math.max(cluster.bounds.east, otherMarker.lng);
                cluster.bounds.west = Math.min(cluster.bounds.west, otherMarker.lng);
            }
        });

        // Update cluster center to be the centroid
        const sumLat = cluster.markers.reduce((sum, m) => sum + m.lat, 0);
        const sumLng = cluster.markers.reduce((sum, m) => sum + m.lng, 0);
        cluster.center = [sumLat / cluster.markers.length, sumLng / cluster.markers.length];

        clusters.push(cluster);
        processed.add(index);
    });

    return clusters;
};

/**
 * Convert speed from km/h to other units
 * @param {number} speedKmh - Speed in km/h
 * @param {string} unit - Target unit ('mph', 'ms', 'knots')
 * @returns {number} Converted speed
 */
export const convertSpeed = (speedKmh, unit) => {
    switch (unit) {
        case 'mph':
            return speedKmh * 0.621371;
        case 'ms':
            return speedKmh / 3.6;
        case 'knots':
            return speedKmh * 0.539957;
        default:
            return speedKmh;
    }
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted distance
 */
export const formatDistance = (meters, locale = 'en-US') => {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }

    const km = meters / 1000;
    if (km < 10) {
        return `${km.toFixed(1)} km`;
    }

    return `${Math.round(km)} km`;
};

/**
 * Get tile layer configurations for different map styles
 * @returns {Object} Tile layer configurations
 */
export const getTileLayerConfigs = () => {
    return {
        osm: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            name: 'OpenStreetMap'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri',
            name: 'Satellite'
        },
        terrain: {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
            name: 'Terrain'
        },
        dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            name: 'Dark'
        }
    };
};