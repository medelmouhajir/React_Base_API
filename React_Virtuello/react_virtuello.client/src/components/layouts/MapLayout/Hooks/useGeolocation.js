/**
 * useGeolocation Hook - Comprehensive Geolocation Management
 * Provides location access, tracking and geocoding utilities through GeolocationService
 *
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import geolocationService from '../Services/GeolocationService';
import { GEOLOCATION_CONFIG, PERFORMANCE_CONFIG } from '../Config/mapConfig';

/**
 * React hook for managing user geolocation
 * @param {Object} options - Configuration options
 * @returns {Object} Geolocation state and utility methods
 */
export const useGeolocation = (options = {}) => {
    const {
        autoDetect = false,
        watch = false,
        enableHighAccuracy = GEOLOCATION_CONFIG.enableHighAccuracy,
        timeout = GEOLOCATION_CONFIG.timeout,
        maximumAge = GEOLOCATION_CONFIG.maximumAge,
        updateInterval = PERFORMANCE_CONFIG.locationUpdateInterval
    } = options;

    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [position, setPosition] = useState(null);
    const [permission, setPermission] = useState('prompt');
    const [isWatching, setIsWatching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const watchIdRef = useRef(null);
    const updateTimerRef = useRef(null);

    // =============================================================================
    // PERMISSION HANDLING
    // =============================================================================

    /**
     * Check browser permission for geolocation
     * @returns {Promise<string>} Permission state
     */
    const checkPermission = useCallback(async () => {
        try {
            const status = await geolocationService.checkPermission();
            setPermission(status);
            return status;
        } catch (err) {
            console.error('[useGeolocation] Permission check failed:', err);
            setPermission('not-supported');
            return 'not-supported';
        }
    }, []);

    // =============================================================================
    // LOCATION RETRIEVAL
    // =============================================================================

    /**
     * Get current user position
     * @returns {Promise<Object|null>} Position object or null on failure
     */
    const getCurrentPosition = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const pos = await geolocationService.getCurrentPosition({
                enableHighAccuracy,
                timeout,
                maximumAge
            });

            const location = {
                lat: pos.latitude,
                lng: pos.longitude,
                accuracy: pos.accuracy,
                altitude: pos.altitude,
                altitudeAccuracy: pos.altitudeAccuracy,
                heading: pos.heading,
                speed: pos.speed,
                timestamp: pos.timestamp
            };

            setPosition(location);
            return location;
        } catch (err) {
            console.error('[useGeolocation] Error getting position:', err);
            setError(err.message || 'Unable to retrieve location');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [enableHighAccuracy, timeout, maximumAge]);

    // =============================================================================
    // LOCATION WATCHING
    // =============================================================================

    /**
     * Start watching location changes
     */
    const startTracking = useCallback(async () => {
        if (isWatching) return;

        try {
            watchIdRef.current = await geolocationService.startWatching({
                enableHighAccuracy,
                timeout,
                maximumAge
            });
            setIsWatching(true);
        } catch (err) {
            console.error('[useGeolocation] Failed to start tracking:', err);
            setError(err.message || 'Failed to start tracking');
        }
    }, [isWatching, enableHighAccuracy, timeout, maximumAge]);

    /**
     * Stop watching location changes
     */
    const stopTracking = useCallback(() => {
        geolocationService.stopWatching();
        setIsWatching(false);
        watchIdRef.current = null;
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
        }
    }, []);

    // =============================================================================
    // GEOCODING UTILITIES
    // =============================================================================

    /**
     * Geocode an address to coordinates
     * @param {string} address - Address text
     * @param {Object} opts - Geocoding options
     * @returns {Promise<Array|null>} Geocoding results
     */
    const geocodeAddress = useCallback(async (address, opts = {}) => {
        try {
            return await geolocationService.geocodeAddress(address, opts);
        } catch (err) {
            console.error('[useGeolocation] Geocode error:', err);
            setError(err.message || 'Geocode failed');
            return null;
        }
    }, []);

    /**
     * Reverse geocode coordinates to an address
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} opts - Options
     * @returns {Promise<Object|null>} Reverse geocoding result
     */
    const reverseGeocode = useCallback(async (lat, lng, opts = {}) => {
        try {
            return await geolocationService.reverseGeocode(lat, lng, opts);
        } catch (err) {
            console.error('[useGeolocation] Reverse geocode error:', err);
            setError(err.message || 'Reverse geocode failed');
            return null;
        }
    }, []);

    /**
     * Calculate distance from current position to target coordinates
     * @param {number} lat - Target latitude
     * @param {number} lng - Target longitude
     * @returns {number|null} Distance in meters
     */
    const getDistanceTo = useCallback((lat, lng) => {
        return geolocationService.getDistanceToTarget(lat, lng);
    }, []);

    /**
     * Check if target coordinates are within a radius from current position
     * @param {number} lat - Target latitude
     * @param {number} lng - Target longitude
     * @param {number} radius - Radius in meters
     * @returns {boolean|null} Whether target is within radius
     */
    const isWithinRadius = useCallback((lat, lng, radius) => {
        return geolocationService.isWithinRadius(lat, lng, radius);
    }, []);

    /**
     * Format coordinates for display
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} opts - Format options
     * @returns {string} Formatted coordinates
     */
    const formatCoordinates = useCallback((lat, lng, opts = {}) => {
        return geolocationService.formatCoordinates(lat, lng, opts);
    }, []);

    // =============================================================================
    // EVENT SUBSCRIPTIONS
    // =============================================================================

    useEffect(() => {
        const handleLocationChange = (loc) => setPosition(loc);
        const handleLocationError = (err) => setError(err.message || err);
        const handleWatchStart = () => setIsWatching(true);
        const handleWatchStop = () => setIsWatching(false);

        geolocationService.on('location:change', handleLocationChange);
        geolocationService.on('location:success', handleLocationChange);
        geolocationService.on('location:error', handleLocationError);
        geolocationService.on('location:watch:start', handleWatchStart);
        geolocationService.on('location:watch:stop', handleWatchStop);

        return () => {
            geolocationService.off('location:change', handleLocationChange);
            geolocationService.off('location:success', handleLocationChange);
            geolocationService.off('location:error', handleLocationError);
            geolocationService.off('location:watch:start', handleWatchStart);
            geolocationService.off('location:watch:stop', handleWatchStop);
        };
    }, []);

    // =============================================================================
    // AUTO-INITIALIZATION
    // =============================================================================

    useEffect(() => {
        checkPermission();

        if (autoDetect) {
            getCurrentPosition();
        }

        if (watch) {
            startTracking();
        }

        return () => {
            stopTracking();
        };
    }, [autoDetect, watch, checkPermission, getCurrentPosition, startTracking, stopTracking]);

    // Periodic updates while watching
    useEffect(() => {
        if (!isWatching || updateInterval <= 0) return;

        const schedule = () => {
            updateTimerRef.current = setTimeout(async () => {
                await getCurrentPosition();
                schedule();
            }, updateInterval);
        };

        schedule();
        return () => {
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
                updateTimerRef.current = null;
            }
        };
    }, [isWatching, updateInterval, getCurrentPosition]);

    // =============================================================================
    // RETURN HOOK INTERFACE
    // =============================================================================

    return {
        // State
        position,
        permission,
        isWatching,
        isLoading,
        error,

        // Core methods
        checkPermission,
        getCurrentPosition,
        startTracking,
        stopTracking,

        // Geocoding utilities
        geocodeAddress,
        reverseGeocode,
        getDistanceTo,
        isWithinRadius,
        formatCoordinates,

        // Helpers
        clearError: () => setError(null)
    };
};

export default useGeolocation;