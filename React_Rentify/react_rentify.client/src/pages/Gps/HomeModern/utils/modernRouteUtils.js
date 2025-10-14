/**
 * Modern Route Utilities
 * Enhanced utilities for processing and analyzing GPS route data
 */

/**
 * Process route data for speed-based visualization
 * @param {Object} routeData - Raw route data from API
 * @returns {Object} - Processed route data with speed coloring
 */
export const processRouteForSpeedColoring = (routeData) => {
    if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
        return null;
    }

    const coordinates = routeData.coordinates;
    const segments = [];
    const speedPoints = [];
    const stops = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let maxSpeed = 0;
    let minSpeed = Infinity;

    // Process each coordinate pair to create segments
    for (let i = 0; i < coordinates.length - 1; i++) {
        const current = coordinates[i];
        const next = coordinates[i + 1];

        if (!current || !next || !current.latitude || !current.longitude) {
            continue;
        }

        const speed = current.speed || 0;
        const timestamp = new Date(current.timestamp);
        const nextTimestamp = new Date(next.timestamp);

        // Calculate segment distance
        const segmentDistance = calculateDistance(
            current.latitude, current.longitude,
            next.latitude, next.longitude
        );

        // Calculate segment duration
        const segmentDuration = nextTimestamp - timestamp;

        totalDistance += segmentDistance;
        totalDuration += segmentDuration;
        maxSpeed = Math.max(maxSpeed, speed);
        minSpeed = Math.min(minSpeed, speed);

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
            duration: segmentDuration
        });

        // Add to speed points for charting
        speedPoints.push({
            timestamp: timestamp,
            speed: speed,
            latitude: current.latitude,
            longitude: current.longitude,
            distance: totalDistance
        });

        // Detect stops
        if (speed === 0 || (current.isStop && segmentDuration > 60000)) { // Stop if 0 speed or marked stop > 1 minute
            stops.push({
                latitude: current.latitude,
                longitude: current.longitude,
                timestamp: timestamp,
                duration: segmentDuration,
                address: current.address,
                isStop: true
            });
        }
    }

    // Calculate additional statistics
    const averageSpeed = speedPoints.length > 0 ?
        speedPoints.reduce((sum, point) => sum + point.speed, 0) / speedPoints.length : 0;

    const speedDistribution = calculateSpeedDistribution(speedPoints);
    const timeStats = calculateTimeStats(coordinates);

    return {
        segments,
        speedPoints,
        stops,
        coordinates,
        statistics: {
            totalDistance,
            totalDuration,
            maxSpeed,
            minSpeed,
            averageSpeed,
            speedDistribution,
            ...timeStats
        },
        bounds: calculateRouteBounds(coordinates)
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
 * @param {Array} coordinates - Route coordinates
 * @returns {Object} - Bounds object with north, south, east, west
 */
export const calculateRouteBounds = (coordinates) => {
    if (!coordinates || coordinates.length === 0) {
        return null;
    }

    let north = -90, south = 90, east = -180, west = 180;

    coordinates.forEach(coord => {
        if (coord.latitude && coord.longitude) {
            north = Math.max(north, coord.latitude);
            south = Math.min(south, coord.latitude);
            east = Math.max(east, coord.longitude);
            west = Math.min(west, coord.longitude);
        }
    });

    // Add padding to bounds
    const latPadding = (north - south) * 0.1;
    const lonPadding = (east - west) * 0.1;

    return {
        north: north + latPadding,
        south: south - latPadding,
        east: east + lonPadding,
        west: west - lonPadding
    };
};

/**
 * Detect stops in route data
 * @param {Array} coordinates - Route coordinates
 * @param {number} minStopDuration - Minimum stop duration in milliseconds
 * @param {number} maxStopSpeed - Maximum speed to consider as stopped
 * @returns {Array} - Array of detected stops
 */
export const detectStops = (coordinates, minStopDuration = 120000, maxStopSpeed = 5) => {
    if (!coordinates || coordinates.length < 2) return [];

    const stops = [];
    let currentStop = null;

    for (let i = 0; i < coordinates.length; i++) {
        const coord = coordinates[i];
        const speed = coord.speed || 0;
        const timestamp = new Date(coord.timestamp);

        if (speed <= maxStopSpeed) {
            if (!currentStop) {
                currentStop = {
                    startIndex: i,
                    startTime: timestamp,
                    latitude: coord.latitude,
                    longitude: coord.longitude,
                    address: coord.address
                };
            }
        } else {
            if (currentStop) {
                const duration = timestamp - currentStop.startTime;
                if (duration >= minStopDuration) {
                    stops.push({
                        ...currentStop,
                        endTime: timestamp,
                        duration,
                        endIndex: i - 1
                    });
                }
                currentStop = null;
            }
        }
    }

    // Handle stop that goes to end of route
    if (currentStop) {
        const endTime = new Date(coordinates[coordinates.length - 1].timestamp);
        const duration = endTime - currentStop.startTime;
        if (duration >= minStopDuration) {
            stops.push({
                ...currentStop,
                endTime,
                duration,
                endIndex: coordinates.length - 1
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