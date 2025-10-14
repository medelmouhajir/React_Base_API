/**
 * Modern Route Utilities
 * Enhanced utilities for processing and analyzing GPS route data
 */

/**
 * Process route data for speed-based visualization
 * Updated to work with LocationRecordDto from GPSController
 * @param {Array} records - Array of LocationRecordDto objects from API
 * @returns {Object} - Processed route data with speed coloring
 */
export const processRouteForSpeedColoring = (records) => {
    if (!records || !Array.isArray(records) || records.length === 0) {
        return null;
    }

    const segments = [];
    const speedPoints = [];
    const stops = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let maxSpeed = 0;
    let minSpeed = Infinity;

    // Process each record pair to create segments
    for (let i = 0; i < records.length - 1; i++) {
        const current = records[i];
        const next = records[i + 1];

        if (!current || !next ||
            current.latitude === undefined || current.longitude === undefined ||
            next.latitude === undefined || next.longitude === undefined) {
            continue;
        }

        // Use speedKmh from DTO (previously was speed)
        const speed = current.speedKmh || 0;
        const timestamp = new Date(current.timestamp);
        const nextTimestamp = new Date(next.timestamp);

        // Calculate segment distance
        const segmentDistance = calculateDistance(
            current.latitude, current.longitude,
            next.latitude, next.longitude
        );

        // Calculate segment duration in milliseconds
        const segmentDuration = nextTimestamp - timestamp;

        totalDistance += segmentDistance;
        totalDuration += segmentDuration;
        maxSpeed = Math.max(maxSpeed, speed);
        if (speed > 0) {
            minSpeed = Math.min(minSpeed, speed);
        }

        // Create segment with styling information
        segments.push({
            start: [current.latitude, current.longitude],
            end: [next.latitude, next.longitude],
            speed: speed,
            color: getSpeedColor(speed),
            weight: getSpeedWeight(speed),
            opacity: getSpeedOpacity(speed),
            timestamp: timestamp,
            distance: segmentDistance,
            duration: segmentDuration,
            ignitionOn: current.ignitionOn || false
        });

        // Add to speed points for charting
        speedPoints.push({
            timestamp: timestamp,
            speed: speed,
            latitude: current.latitude,
            longitude: current.longitude,
            distance: totalDistance,
            heading: current.heading,
            altitude: current.altitude,
            ignitionOn: current.ignitionOn
        });

        // Detect stops based on speed and ignition status
        if (speed === 0 && segmentDuration > 60000) { // Stop if 0 speed for more than 1 minute
            stops.push({
                latitude: current.latitude,
                longitude: current.longitude,
                timestamp: timestamp,
                duration: segmentDuration,
                address: current.address || null,
                isStop: true
            });
        }
    }

    // Add the last point to speedPoints
    if (records.length > 0) {
        const lastRecord = records[records.length - 1];
        speedPoints.push({
            timestamp: new Date(lastRecord.timestamp),
            speed: lastRecord.speedKmh || 0,
            latitude: lastRecord.latitude,
            longitude: lastRecord.longitude,
            distance: totalDistance,
            heading: lastRecord.heading,
            altitude: lastRecord.altitude,
            ignitionOn: lastRecord.ignitionOn
        });
    }

    // Calculate additional statistics
    const averageSpeed = speedPoints.length > 0
        ? speedPoints.reduce((sum, p) => sum + p.speed, 0) / speedPoints.length
        : 0;

    // Fix minSpeed if no movement detected
    if (minSpeed === Infinity) {
        minSpeed = 0;
    }

    // Calculate speed distribution
    const speedDistribution = calculateSpeedDistribution(speedPoints);

    // Calculate time statistics
    const timeStats = calculateTimeStats(records);

    // Create route bounds for map fitting
    const bounds = calculateRouteBounds(records);

    return {
        // Original records for reference (DTOs)
        records: records,
        // Processed data
        segments: segments,
        speedPoints: speedPoints,
        stops: stops,
        bounds: bounds,
        // Statistics
        statistics: {
            totalDistance: totalDistance,
            totalDuration: totalDuration,
            averageSpeed: averageSpeed,
            maxSpeed: maxSpeed,
            minSpeed: minSpeed,
            stopCount: stops.length,
            dataPoints: records.length,
            speedDistribution: speedDistribution,
            ...timeStats
        },
        // Metadata
        metadata: {
            vehicleId: records[0]?.gps_DeviceId || null,
            deviceSerialNumber: records[0]?.deviceSerialNumber || null,
            startTime: timeStats.startTime,
            endTime: timeStats.endTime
        }
    };
};

/**
 * Calculate distance between two GPS points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} - Distance in kilometers
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
 */
const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Get color based on speed
 * @param {number} speed - Speed in km/h
 * @returns {string} - Hex color code
 */
export const getSpeedColor = (speed) => {
    if (speed === 0) return '#6B7280'; // Gray - Stopped
    if (speed < 10) return '#10B981'; // Green - Very slow
    if (speed < 30) return '#3B82F6'; // Blue - Slow
    if (speed < 50) return '#F59E0B'; // Orange - Medium
    if (speed < 70) return '#8B5CF6'; // Purple - Fast
    return '#EF4444'; // Red - Very fast/Speeding
};

/**
 * Get line weight based on speed
 * @param {number} speed - Speed in km/h
 * @returns {number} - Line weight
 */
export const getSpeedWeight = (speed) => {
    if (speed === 0) return 2;
    if (speed < 10) return 3;
    if (speed < 30) return 4;
    if (speed < 50) return 5;
    if (speed < 70) return 6;
    return 7;
};

/**
 * Get opacity based on speed
 * @param {number} speed - Speed in km/h
 * @returns {number} - Opacity value
 */
export const getSpeedOpacity = (speed) => {
    if (speed === 0) return 0.4;
    if (speed < 10) return 0.6;
    return 0.8;
};

/**
 * Calculate speed distribution for analytics
 * @param {Array} speedPoints - Array of speed data points
 * @returns {Object} - Speed distribution statistics
 */
const calculateSpeedDistribution = (speedPoints) => {
    const distribution = {
        stopped: 0,
        verySlow: 0,
        slow: 0,
        medium: 0,
        fast: 0,
        veryFast: 0
    };

    speedPoints.forEach(point => {
        const speed = point.speed;
        if (speed === 0) distribution.stopped++;
        else if (speed < 10) distribution.verySlow++;
        else if (speed < 30) distribution.slow++;
        else if (speed < 50) distribution.medium++;
        else if (speed < 70) distribution.fast++;
        else distribution.veryFast++;
    });

    // Convert to percentages
    const total = speedPoints.length;
    Object.keys(distribution).forEach(key => {
        distribution[key] = total > 0 ? (distribution[key] / total) * 100 : 0;
    });

    return distribution;
};

/**
 * Calculate time-based statistics
 * @param {Array} coordinates - Route coordinates
 * @returns {Object} - Time statistics
 */
const calculateTimeStats = (coordinates) => {
    if (!coordinates || coordinates.length < 2) {
        return {
            startTime: null,
            endTime: null,
            duration: 0,
            movingTime: 0,
            stoppedTime: 0
        };
    }

    const startTime = new Date(coordinates[0].timestamp);
    const endTime = new Date(coordinates[coordinates.length - 1].timestamp);
    const totalDuration = endTime - startTime;

    let movingTime = 0;
    let stoppedTime = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
        const current = coordinates[i];
        const next = coordinates[i + 1];
        const segmentTime = new Date(next.timestamp) - new Date(current.timestamp);

        if (current.speed > 0) {
            movingTime += segmentTime;
        } else {
            stoppedTime += segmentTime;
        }
    }

    return {
        startTime,
        endTime,
        duration: totalDuration,
        movingTime,
        stoppedTime,
        movingPercentage: totalDuration > 0 ? (movingTime / totalDuration) * 100 : 0,
        stoppedPercentage: totalDuration > 0 ? (stoppedTime / totalDuration) * 100 : 0
    };
};

/**
 * Calculate route bounds for map fitting
 * @param {Array} records - Array of LocationRecordDto objects
 * @returns {Object} - Bounds object with north, south, east, west coordinates
 */
export const calculateRouteBounds = (records) => {
    if (!records || records.length === 0) {
        return null;
    }

    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;

    records.forEach(record => {
        if (record.latitude !== undefined && record.longitude !== undefined) {
            north = Math.max(north, record.latitude);
            south = Math.min(south, record.latitude);
            east = Math.max(east, record.longitude);
            west = Math.min(west, record.longitude);
        }
    });

    // Add some padding to the bounds
    const latPadding = (north - south) * 0.1;
    const lngPadding = (east - west) * 0.1;

    return {
        north: north + latPadding,
        south: south - latPadding,
        east: east + lngPadding,
        west: west - lngPadding,
        center: {
            lat: (north + south) / 2,
            lng: (east + west) / 2
        }
    };
};

/**
 * Detect stops in route data
 * @param {Array} records - Array of LocationRecordDto objects
 * @param {number} minStopDuration - Minimum stop duration in milliseconds (default: 60000 = 1 minute)
 * @returns {Array} - Array of stop objects
 */
export const detectStops = (records, minStopDuration = 60000) => {
    const stops = [];

    if (!records || records.length < 2) {
        return stops;
    }

    let currentStop = null;

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const speed = record.speedKmh || 0;
        const ignitionOn = record.ignitionOn || false;

        // Consider it a stop if speed is 0 or ignition is off
        if (speed === 0 || !ignitionOn) {
            if (!currentStop) {
                // Start of a new stop
                currentStop = {
                    startIndex: i,
                    startTime: new Date(record.timestamp),
                    latitude: record.latitude,
                    longitude: record.longitude,
                    ignitionOn: ignitionOn
                };
            }
        } else {
            // Vehicle is moving
            if (currentStop) {
                // End of stop detected
                const endTime = new Date(records[i - 1].timestamp);
                const duration = endTime - currentStop.startTime;

                if (duration >= minStopDuration) {
                    stops.push({
                        latitude: currentStop.latitude,
                        longitude: currentStop.longitude,
                        startTime: currentStop.startTime,
                        endTime: endTime,
                        duration: duration,
                        durationMinutes: Math.round(duration / 60000),
                        ignitionOn: currentStop.ignitionOn,
                        isStop: true
                    });
                }

                currentStop = null;
            }
        }
    }

    // Handle case where route ends with a stop
    if (currentStop && records.length > 0) {
        const lastRecord = records[records.length - 1];
        const endTime = new Date(lastRecord.timestamp);
        const duration = endTime - currentStop.startTime;

        if (duration >= minStopDuration) {
            stops.push({
                latitude: currentStop.latitude,
                longitude: currentStop.longitude,
                startTime: currentStop.startTime,
                endTime: endTime,
                duration: duration,
                durationMinutes: Math.round(duration / 60000),
                ignitionOn: currentStop.ignitionOn,
                isStop: true
            });
        }
    }

    return stops;
};
/**
 * Smooth route coordinates to reduce noise
 * @param {Array} coordinates - Raw coordinates
 * @param {number} windowSize - Smoothing window size
 * @returns {Array} - Smoothed coordinates
 */
export const smoothRoute = (coordinates, windowSize = 3) => {
    if (!coordinates || coordinates.length <= windowSize) {
        return coordinates;
    }

    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < coordinates.length; i++) {
        if (i < halfWindow || i >= coordinates.length - halfWindow) {
            // Keep original points at start and end
            smoothed.push(coordinates[i]);
        } else {
            // Apply moving average smoothing
            let sumLat = 0, sumLon = 0, count = 0;

            for (let j = i - halfWindow; j <= i + halfWindow; j++) {
                if (coordinates[j] && coordinates[j].latitude && coordinates[j].longitude) {
                    sumLat += coordinates[j].latitude;
                    sumLon += coordinates[j].longitude;
                    count++;
                }
            }

            if (count > 0) {
                smoothed.push({
                    ...coordinates[i],
                    latitude: sumLat / count,
                    longitude: sumLon / count
                });
            } else {
                smoothed.push(coordinates[i]);
            }
        }
    }

    return smoothed;
};

/**
 * Calculate route efficiency metrics
 * @param {Object} processedRoute - Processed route data
 * @returns {Object} - Efficiency metrics
 */
export const calculateRouteEfficiency = (processedRoute) => {
    if (!processedRoute || !processedRoute.coordinates) {
        return null;
    }

    const { coordinates, statistics } = processedRoute;

    // Calculate direct distance (as the crow flies)
    const directDistance = calculateDistance(
        coordinates[0].latitude, coordinates[0].longitude,
        coordinates[coordinates.length - 1].latitude, coordinates[coordinates.length - 1].longitude
    );

    // Route efficiency (how direct the route is)
    const routeEfficiency = directDistance > 0 ? (directDistance / statistics.totalDistance) * 100 : 0;

    // Speed efficiency (how close to optimal speed)
    const optimalSpeed = 50; // km/h - configurable
    const speedDeviation = Math.abs(statistics.averageSpeed - optimalSpeed);
    const speedEfficiency = Math.max(0, 100 - (speedDeviation / optimalSpeed) * 100);

    // Time efficiency (moving time vs total time)
    const timeEfficiency = statistics.duration > 0 ?
        (statistics.movingTime / statistics.duration) * 100 : 0;

    return {
        directDistance,
        actualDistance: statistics.totalDistance,
        routeEfficiency,
        speedEfficiency,
        timeEfficiency,
        overallEfficiency: (routeEfficiency + speedEfficiency + timeEfficiency) / 3,
        deviationFromOptimal: {
            distance: statistics.totalDistance - directDistance,
            distancePercentage: directDistance > 0 ?
                ((statistics.totalDistance - directDistance) / directDistance) * 100 : 0
        }
    };
};

export default {
    processRouteForSpeedColoring,
    calculateDistance,
    getSpeedColor,
    getSpeedWeight,
    getSpeedOpacity,
    calculateRouteBounds,
    detectStops,
    smoothRoute,
    calculateRouteEfficiency
};