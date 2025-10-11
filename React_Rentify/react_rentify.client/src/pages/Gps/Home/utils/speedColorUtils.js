// src/pages/Gps/Home/utils/speedColorUtils.js

// Speed thresholds and colors
export const SPEED_THRESHOLDS = {
    STATIONARY: 0,     // 0 km/h
    SLOW: 20,          // 0-20 km/h (parking, city traffic)
    CITY: 50,          // 20-50 km/h (city driving)
    HIGHWAY: 90,       // 50-90 km/h (highway)
    HIGH_SPEED: 120    // 90+ km/h (high speed)
};

export const SPEED_COLORS = {
    STATIONARY: '#6b7280',    // Gray - parked/stopped
    SLOW: '#10b981',          // Green - slow/city traffic
    CITY: '#f59e0b',          // Amber - city driving
    HIGHWAY: '#f97316',       // Orange - highway speeds
    HIGH_SPEED: '#ef4444',    // Red - high speed
    NO_DATA: '#9ca3af'        // Light gray - no speed data
};

export const SPEED_LABELS = {
    STATIONARY: 'Stationary',
    SLOW: 'Slow (0-20 km/h)',
    CITY: 'City (20-50 km/h)',
    HIGHWAY: 'Highway (50-90 km/h)',
    HIGH_SPEED: 'High Speed (90+ km/h)',
    NO_DATA: 'No Data'
};

/**
 * Get color based on speed value
 * @param {number} speed - Speed in km/h
 * @param {boolean} ignitionOn - Whether ignition is on
 * @returns {string} Hex color code
 */
export const getSpeedColor = (speed, ignitionOn = true) => {
    // If ignition is off, always show as stationary
    if (!ignitionOn) {
        return SPEED_COLORS.STATIONARY;
    }

    // Handle null/undefined speed
    if (speed === null || speed === undefined || isNaN(speed)) {
        return SPEED_COLORS.NO_DATA;
    }

    const speedValue = parseFloat(speed);

    if (speedValue <= SPEED_THRESHOLDS.STATIONARY) {
        return SPEED_COLORS.STATIONARY;
    } else if (speedValue <= SPEED_THRESHOLDS.SLOW) {
        return SPEED_COLORS.SLOW;
    } else if (speedValue <= SPEED_THRESHOLDS.CITY) {
        return SPEED_COLORS.CITY;
    } else if (speedValue <= SPEED_THRESHOLDS.HIGHWAY) {
        return SPEED_COLORS.HIGHWAY;
    } else {
        return SPEED_COLORS.HIGH_SPEED;
    }
};

/**
 * Get speed category based on speed value
 * @param {number} speed - Speed in km/h
 * @param {boolean} ignitionOn - Whether ignition is on
 * @returns {string} Speed category key
 */
export const getSpeedCategory = (speed, ignitionOn = true) => {
    if (!ignitionOn) {
        return 'STATIONARY';
    }

    if (speed === null || speed === undefined || isNaN(speed)) {
        return 'NO_DATA';
    }

    const speedValue = parseFloat(speed);

    if (speedValue <= SPEED_THRESHOLDS.STATIONARY) {
        return 'STATIONARY';
    } else if (speedValue <= SPEED_THRESHOLDS.SLOW) {
        return 'SLOW';
    } else if (speedValue <= SPEED_THRESHOLDS.CITY) {
        return 'CITY';
    } else if (speedValue <= SPEED_THRESHOLDS.HIGHWAY) {
        return 'HIGHWAY';
    } else {
        return 'HIGH_SPEED';
    }
};

/**
 * Get interpolated color between two colors based on speed
 * @param {number} speed - Current speed
 * @param {number} minSpeed - Minimum speed in range
 * @param {number} maxSpeed - Maximum speed in range
 * @param {string} startColor - Start color (hex)
 * @param {string} endColor - End color (hex)
 * @returns {string} Interpolated color
 */
export const interpolateSpeedColor = (speed, minSpeed, maxSpeed, startColor, endColor) => {
    if (maxSpeed === minSpeed) return startColor;

    const ratio = Math.max(0, Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed)));

    // Convert hex to RGB
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const startRgb = hexToRgb(startColor);
    const endRgb = hexToRgb(endColor);

    if (!startRgb || !endRgb) return startColor;

    // Interpolate RGB values
    const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * ratio);
    const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * ratio);
    const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * ratio);

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Create speed legend data for UI components
 * @returns {Array} Array of legend items
 */
export const createSpeedLegend = () => {
    return [
        {
            category: 'STATIONARY',
            color: SPEED_COLORS.STATIONARY,
            label: SPEED_LABELS.STATIONARY,
            range: '0 km/h',
            icon: '⏸️'
        },
        {
            category: 'SLOW',
            color: SPEED_COLORS.SLOW,
            label: SPEED_LABELS.SLOW,
            range: '0-20 km/h',
            icon: '🐌'
        },
        {
            category: 'CITY',
            color: SPEED_COLORS.CITY,
            label: SPEED_LABELS.CITY,
            range: '20-50 km/h',
            icon: '🏙️'
        },
        {
            category: 'HIGHWAY',
            color: SPEED_COLORS.HIGHWAY,
            label: SPEED_LABELS.HIGHWAY,
            range: '50-90 km/h',
            icon: '🛣️'
        },
        {
            category: 'HIGH_SPEED',
            color: SPEED_COLORS.HIGH_SPEED,
            label: SPEED_LABELS.HIGH_SPEED,
            range: '90+ km/h',
            icon: '🏁'
        }
    ];
};

/**
 * Calculate speed statistics from route data
 * @param {Array} records - GPS records with speed data
 * @returns {Object} Speed statistics
 */
export const calculateSpeedStats = (records) => {
    if (!records || records.length === 0) {
        return {
            maxSpeed: 0,
            avgSpeed: 0,
            timeSpentByCategory: {},
            distanceByCategory: {},
            speedViolations: []
        };
    }

    const speeds = records
        .filter(r => r.speedKmh !== null && r.speedKmh !== undefined && !isNaN(r.speedKmh))
        .map(r => parseFloat(r.speedKmh));

    if (speeds.length === 0) {
        return {
            maxSpeed: 0,
            avgSpeed: 0,
            timeSpentByCategory: {},
            distanceByCategory: {},
            speedViolations: []
        };
    }

    // Basic stats
    const maxSpeed = Math.max(...speeds);
    const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

    // Time spent in each speed category
    const timeSpentByCategory = {};
    const distanceByCategory = {};
    const speedViolations = [];

    // Initialize categories
    Object.keys(SPEED_COLORS).forEach(category => {
        timeSpentByCategory[category] = 0;
        distanceByCategory[category] = 0;
    });

    // Process each record
    for (let i = 0; i < records.length - 1; i++) {
        const current = records[i];
        const next = records[i + 1];

        if (!current.speedKmh && current.speedKmh !== 0) continue;

        const category = getSpeedCategory(current.speedKmh, current.ignitionOn);
        const timeDiff = (new Date(next.timestamp) - new Date(current.timestamp)) / 1000; // seconds

        timeSpentByCategory[category] += timeDiff;

        // Estimate distance (speed * time)
        const distanceKm = (current.speedKmh * timeDiff) / 3600; // km
        distanceByCategory[category] += distanceKm;

        // Check for speed violations (configurable threshold)
        const SPEED_LIMIT_THRESHOLD = 90; // km/h
        if (current.speedKmh > SPEED_LIMIT_THRESHOLD) {
            speedViolations.push({
                timestamp: current.timestamp,
                speed: current.speedKmh,
                location: {
                    lat: current.latitude,
                    lng: current.longitude
                },
                duration: timeDiff
            });
        }
    }

    // Convert time to more readable format
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return { hours, minutes, totalSeconds: seconds };
    };

    const formattedTimeByCategory = {};
    Object.keys(timeSpentByCategory).forEach(category => {
        formattedTimeByCategory[category] = formatTime(timeSpentByCategory[category]);
    });

    return {
        maxSpeed: Math.round(maxSpeed * 10) / 10,
        avgSpeed: Math.round(avgSpeed * 10) / 10,
        timeSpentByCategory: formattedTimeByCategory,
        distanceByCategory,
        speedViolations,
        totalDistance: Object.values(distanceByCategory).reduce((sum, dist) => sum + dist, 0),
        totalTime: formatTime(Object.values(timeSpentByCategory).reduce((sum, time) => sum + time, 0))
    };
};

/**
 * Get appropriate line weight based on zoom level and speed
 * @param {number} zoom - Current map zoom level
 * @param {string} speedCategory - Speed category
 * @returns {number} Line weight
 */
export const getSpeedLineWeight = (zoom, speedCategory) => {
    const baseWeight = zoom < 10 ? 2 : zoom < 15 ? 3 : 4;

    // Make high-speed segments slightly thicker for emphasis
    const multiplier = speedCategory === 'HIGH_SPEED' ? 1.2 : 1;

    return Math.round(baseWeight * multiplier);
};

/**
 * Get opacity based on speed category and time
 * @param {string} speedCategory - Speed category
 * @param {Date} timestamp - Record timestamp
 * @param {Date} currentTime - Current time for age calculation
 * @returns {number} Opacity value (0-1)
 */
export const getSpeedLineOpacity = (speedCategory, timestamp, currentTime = new Date()) => {
    // Base opacity by speed category
    const baseOpacity = {
        'STATIONARY': 0.4,
        'SLOW': 0.7,
        'CITY': 0.8,
        'HIGHWAY': 0.9,
        'HIGH_SPEED': 1.0,
        'NO_DATA': 0.3
    };

    let opacity = baseOpacity[speedCategory] || 0.7;

    // Fade older segments
    const ageHours = (currentTime - new Date(timestamp)) / (1000 * 60 * 60);
    if (ageHours > 24) {
        opacity *= 0.5; // Fade segments older than 24 hours
    } else if (ageHours > 12) {
        opacity *= 0.7; // Partially fade segments older than 12 hours
    }

    return Math.max(0.1, Math.min(1.0, opacity));
};