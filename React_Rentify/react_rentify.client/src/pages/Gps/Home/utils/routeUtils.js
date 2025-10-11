// src/pages/Gps/Home/utils/routeUtils.js
import { getSpeedColor, getSpeedCategory, calculateSpeedStats } from './speedColorUtils';

/**
 * Process GPS records into speed-colored route segments
 * @param {Array} records - Array of GPS records
 * @returns {Array} Array of colored route segments
 */
export const processRouteForSpeedColoring = (records) => {
    if (!records || records.length < 2) return [];

    const segments = [];

    for (let i = 0; i < records.length - 1; i++) {
        const current = records[i];
        const next = records[i + 1];

        // Validate coordinates
        const currentLat = parseFloat(current.latitude);
        const currentLng = parseFloat(current.longitude);
        const nextLat = parseFloat(next.latitude);
        const nextLng = parseFloat(next.longitude);

        if (isNaN(currentLat) || isNaN(currentLng) || isNaN(nextLat) || isNaN(nextLng)) {
            continue;
        }

        // Create segment
        const segment = {
            id: `segment-${i}`,
            startPoint: { lat: currentLat, lng: currentLng },
            endPoint: { lat: nextLat, lng: nextLng },
            positions: [[currentLat, currentLng], [nextLat, nextLng]],

            // Speed and status data
            speed: current.speedKmh || 0,
            ignitionOn: current.ignitionOn || false,
            color: getSpeedColor(current.speedKmh, current.ignitionOn),
            category: getSpeedCategory(current.speedKmh, current.ignitionOn),

            // Time data
            startTime: new Date(current.timestamp),
            endTime: new Date(next.timestamp),
            duration: new Date(next.timestamp) - new Date(current.timestamp),

            // Additional metadata
            distance: calculateDistance(currentLat, currentLng, nextLat, nextLng),
            bearing: calculateBearing(currentLat, currentLng, nextLat, nextLng),

            // Original records for reference
            startRecord: current,
            endRecord: next
        };

        segments.push(segment);
    }

    return segments;
};

/**
 * Detect stops and significant points in the route
 * @param {Array} records - Array of GPS records
 * @param {Object} options - Detection options
 * @returns {Array} Array of stop/point objects
 */
export const detectStops = (records, options = {}) => {
    const {
        minStopDuration = 5 * 60 * 1000, // 5 minutes in milliseconds
        maxStopRadius = 50, // 50 meters
        minMovementSpeed = 5 // 5 km/h
    } = options;

    if (!records || records.length < 3) return [];

    const stops = [];
    let currentStopStart = null;
    let stopRecords = [];

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const speed = parseFloat(record.speedKmh) || 0;
        const isStationary = speed < minMovementSpeed && !record.ignitionOn;

        if (isStationary) {
            if (!currentStopStart) {
                // Start of a potential stop
                currentStopStart = record;
                stopRecords = [record];
            } else {
                // Continuing stop - check if still within radius
                const distance = calculateDistance(
                    parseFloat(currentStopStart.latitude),
                    parseFloat(currentStopStart.longitude),
                    parseFloat(record.latitude),
                    parseFloat(record.longitude)
                );

                if (distance <= maxStopRadius) {
                    stopRecords.push(record);
                } else {
                    // Moved too far, end current stop and start new one
                    if (stopRecords.length > 0) {
                        const duration = new Date(stopRecords[stopRecords.length - 1].timestamp) -
                            new Date(currentStopStart.timestamp);

                        if (duration >= minStopDuration) {
                            stops.push(createStopObject(stopRecords, duration));
                        }
                    }

                    currentStopStart = record;
                    stopRecords = [record];
                }
            }
        } else {
            // Vehicle is moving
            if (currentStopStart && stopRecords.length > 0) {
                const duration = new Date(stopRecords[stopRecords.length - 1].timestamp) -
                    new Date(currentStopStart.timestamp);

                if (duration >= minStopDuration) {
                    stops.push(createStopObject(stopRecords, duration));
                }
            }

            currentStopStart = null;
            stopRecords = [];
        }
    }

    // Handle final stop if exists
    if (currentStopStart && stopRecords.length > 0) {
        const duration = new Date(stopRecords[stopRecords.length - 1].timestamp) -
            new Date(currentStopStart.timestamp);

        if (duration >= minStopDuration) {
            stops.push(createStopObject(stopRecords, duration));
        }
    }

    return stops;
};

/**
 * Create a stop object from stop records
 * @param {Array} stopRecords - Records during the stop
 * @param {number} duration - Stop duration in milliseconds
 * @returns {Object} Stop object
 */
const createStopObject = (stopRecords, duration) => {
    // Calculate center point of stop
    const latitudes = stopRecords.map(r => parseFloat(r.latitude)).filter(lat => !isNaN(lat));
    const longitudes = stopRecords.map(r => parseFloat(r.longitude)).filter(lng => !isNaN(lng));

    const centerLat = latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
    const centerLng = longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length;

    return {
        id: `stop-${stopRecords[0].timestamp}`,
        type: 'stop',
        position: { lat: centerLat, lng: centerLng },
        startTime: new Date(stopRecords[0].timestamp),
        endTime: new Date(stopRecords[stopRecords.length - 1].timestamp),
        duration: duration,
        durationFormatted: formatDuration(duration),
        recordCount: stopRecords.length,
        // Determine stop type based on duration
        stopType: duration > 8 * 60 * 60 * 1000 ? 'overnight' :
            duration > 2 * 60 * 60 * 1000 ? 'long' : 'short',
        records: stopRecords
    };
};

/**
 * Calculate comprehensive route statistics
 * @param {Array} records - Array of GPS records
 * @returns {Object} Route statistics
 */
export const calculateRouteStats = (records) => {
    if (!records || records.length === 0) return null;

    // Basic info
    const startTime = new Date(records[0].timestamp);
    const endTime = new Date(records[records.length - 1].timestamp);
    const totalTime = endTime - startTime;

    // Distance calculation
    let totalDistance = 0;
    let movingDistance = 0;
    let movingTime = 0;

    // Speed and movement analysis
    const speeds = [];
    const validRecords = [];

    for (let i = 0; i < records.length - 1; i++) {
        const current = records[i];
        const next = records[i + 1];

        const currentLat = parseFloat(current.latitude);
        const currentLng = parseFloat(current.longitude);
        const nextLat = parseFloat(next.latitude);
        const nextLng = parseFloat(next.longitude);

        if (isNaN(currentLat) || isNaN(currentLng) || isNaN(nextLat) || isNaN(nextLng)) {
            continue;
        }

        validRecords.push(current);

        const segmentDistance = calculateDistance(currentLat, currentLng, nextLat, nextLng);
        const segmentTime = new Date(next.timestamp) - new Date(current.timestamp);

        totalDistance += segmentDistance;

        // Track speeds
        if (current.speedKmh !== null && current.speedKmh !== undefined) {
            speeds.push(parseFloat(current.speedKmh));
        }

        // Moving distance and time (only when vehicle is actually moving)
        if (current.speedKmh > 5) { // Consider moving if speed > 5 km/h
            movingDistance += segmentDistance;
            movingTime += segmentTime;
        }
    }

    // Speed statistics using utility function
    const speedStats = calculateSpeedStats(records);

    // Efficiency metrics
    const averageSpeed = totalDistance > 0 ? (totalDistance / (totalTime / 3600000)) : 0; // km/h
    const movingAverageSpeed = movingDistance > 0 ? (movingDistance / (movingTime / 3600000)) : 0;

    // Detect stops
    const stops = detectStops(records);

    return {
        // Time metrics
        startTime,
        endTime,
        totalTime,
        totalTimeFormatted: formatDuration(totalTime),
        movingTime,
        movingTimeFormatted: formatDuration(movingTime),
        stopTime: totalTime - movingTime,
        stopTimeFormatted: formatDuration(totalTime - movingTime),

        // Distance metrics
        totalDistance: Math.round(totalDistance * 100) / 100, // km, rounded to 2 decimals
        movingDistance: Math.round(movingDistance * 100) / 100,

        // Speed metrics
        ...speedStats,
        averageSpeed: Math.round(averageSpeed * 10) / 10,
        movingAverageSpeed: Math.round(movingAverageSpeed * 10) / 10,

        // Points of interest
        stops,
        stopCount: stops.length,

        // Route bounds
        bounds: calculateRouteBounds(validRecords),

        // Additional metrics
        recordCount: records.length,
        validRecordCount: validRecords.length,
        dataQuality: (validRecords.length / records.length) * 100,

        // Fuel estimation (rough calculation)
        estimatedFuelUsed: estimateFuelConsumption(totalDistance, speeds),

        // Environmental impact
        co2Emissions: estimateCO2Emissions(totalDistance)
    };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point  
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
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
 * Calculate bearing between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point  
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
        Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
};

/**
 * Calculate route bounds
 * @param {Array} records - Array of GPS records
 * @returns {Object} Bounds object
 */
const calculateRouteBounds = (records) => {
    if (!records || records.length === 0) return null;

    const latitudes = records.map(r => parseFloat(r.latitude)).filter(lat => !isNaN(lat));
    const longitudes = records.map(r => parseFloat(r.longitude)).filter(lng => !isNaN(lng));

    if (latitudes.length === 0) return null;

    return {
        north: Math.max(...latitudes),
        south: Math.min(...latitudes),
        east: Math.max(...longitudes),
        west: Math.min(...longitudes),
        center: {
            lat: (Math.max(...latitudes) + Math.min(...latitudes)) / 2,
            lng: (Math.max(...longitudes) + Math.min(...longitudes)) / 2
        }
    };
};

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (duration) => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

/**
 * Estimate fuel consumption based on distance and average speed
 * @param {number} distance - Distance in km
 * @param {Array} speeds - Array of speed values
 * @returns {number} Estimated fuel consumption in liters
 */
const estimateFuelConsumption = (distance, speeds) => {
    if (distance <= 0 || speeds.length === 0) return 0;

    const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

    // Rough fuel consumption model (L/100km) based on average speed
    let fuelRate;
    if (avgSpeed < 30) {
        fuelRate = 12; // City driving
    } else if (avgSpeed < 60) {
        fuelRate = 8; // Mixed driving  
    } else if (avgSpeed < 90) {
        fuelRate = 7; // Highway
    } else {
        fuelRate = 9; // High speed (less efficient)
    }

    return Math.round((distance * fuelRate / 100) * 10) / 10;
};

/**
 * Estimate CO2 emissions based on distance
 * @param {number} distance - Distance in km
 * @returns {number} Estimated CO2 emissions in kg
 */
const estimateCO2Emissions = (distance) => {
    // Average car emits about 0.2 kg CO2 per km
    const emissionFactor = 0.2;
    return Math.round(distance * emissionFactor * 10) / 10;
};

// Helper functions
const toRadians = (degrees) => degrees * (Math.PI / 180);
const toDegrees = (radians) => radians * (180 / Math.PI);