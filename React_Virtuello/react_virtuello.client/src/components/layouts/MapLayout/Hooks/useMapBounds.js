/**
 * useMapBounds Hook - Map Bounds Management
 * Manages map bounds, viewport changes, and data loading based on visible area
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PERFORMANCE_CONFIG } from '../Config/mapConfig';

/**
 * Custom hook for managing map bounds and viewport-based data loading
 * @param {Object} map - Leaflet map instance
 * @param {Object} options - Hook configuration options
 * @returns {Object} Bounds management utilities and state
 */
export const useMapBounds = (map, options = {}) => {
    const {
        onBoundsChange = null,
        debounceDelay = PERFORMANCE_CONFIG.boundsUpdateDelay,
        autoFetch = true,
        fetchOnZoom = true,
        minZoomForFetch = 10,
        enableHistory = true,
        maxHistorySize = 10
    } = options;

    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [bounds, setBounds] = useState(null);
    const [center, setCenter] = useState(null);
    const [zoom, setZoom] = useState(13);
    const [isLoading, setIsLoading] = useState(false);
    const [boundsHistory, setBoundsHistory] = useState([]);
    const [currentBoundsIndex, setCurrentBoundsIndex] = useState(-1);

    // Refs for debouncing and cleanup
    const debounceTimeoutRef = useRef(null);
    const lastBoundsRef = useRef(null);
    const fetchControllerRef = useRef(null);

    // =============================================================================
    // BOUNDS CALCULATION UTILITIES
    // =============================================================================

    /**
     * Convert Leaflet bounds to API format
     * @param {Object} leafletBounds - Leaflet LatLngBounds object
     * @returns {Object} Formatted bounds for API calls
     */
    const formatBoundsForAPI = useCallback((leafletBounds) => {
        if (!leafletBounds) return null;

        const sw = leafletBounds.getSouthWest();
        const ne = leafletBounds.getNorthEast();

        return {
            north: ne.lat,
            south: sw.lat,
            east: ne.lng,
            west: sw.lng,
            center: leafletBounds.getCenter(),
            area: calculateBoundsArea(leafletBounds)
        };
    }, []);

    /**
     * Calculate approximate area of bounds in square kilometers
     * @param {Object} leafletBounds - Leaflet LatLngBounds object
     * @returns {number} Area in square kilometers
     */
    const calculateBoundsArea = useCallback((leafletBounds) => {
        if (!leafletBounds) return 0;

        const sw = leafletBounds.getSouthWest();
        const ne = leafletBounds.getNorthEast();

        // Approximate calculation (not perfectly accurate but sufficient for our use)
        const latDiff = ne.lat - sw.lat;
        const lngDiff = ne.lng - sw.lng;

        // Convert to approximate kilometers (very rough estimation)
        const latKm = latDiff * 111; // 1 degree latitude ≈ 111 km
        const lngKm = lngDiff * 111 * Math.cos((sw.lat + ne.lat) / 2 * Math.PI / 180);

        return Math.abs(latKm * lngKm);
    }, []);

    /**
     * Check if bounds have changed significantly
     * @param {Object} newBounds - New bounds to compare
     * @param {Object} oldBounds - Previous bounds
     * @param {number} threshold - Change threshold (0-1)
     * @returns {boolean} Whether bounds changed significantly
     */
    const hasBoundsChangedSignificantly = useCallback((newBounds, oldBounds, threshold = 0.1) => {
        if (!newBounds || !oldBounds) return true;

        const newArea = newBounds.area;
        const oldArea = oldBounds.area;

        // Check area change
        const areaChange = Math.abs(newArea - oldArea) / Math.max(newArea, oldArea);
        if (areaChange > threshold) return true;

        // Check center movement
        const centerDistance = newBounds.center.distanceTo(oldBounds.center);
        const maxDistance = Math.sqrt(newArea) * 1000 * threshold; // Convert to meters

        return centerDistance > maxDistance;
    }, []);

    // =============================================================================
    // BOUNDS UPDATE HANDLERS
    // =============================================================================

    /**
     * Handle map bounds change with debouncing
     */
    const handleBoundsChange = useCallback(() => {
        if (!map) return;

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new debounced update
        debounceTimeoutRef.current = setTimeout(() => {
            try {
                const leafletBounds = map.getBounds();
                const mapCenter = map.getCenter();
                const mapZoom = map.getZoom();

                const formattedBounds = formatBoundsForAPI(leafletBounds);
                const previousBounds = lastBoundsRef.current;

                // Check if bounds changed significantly
                if (!hasBoundsChangedSignificantly(formattedBounds, previousBounds)) {
                    return;
                }

                // Update state
                setBounds(formattedBounds);
                setCenter(mapCenter);
                setZoom(mapZoom);

                // Update history
                if (enableHistory && formattedBounds) {
                    setBoundsHistory(prev => {
                        const newHistory = [...prev, formattedBounds].slice(-maxHistorySize);
                        setCurrentBoundsIndex(newHistory.length - 1);
                        return newHistory;
                    });
                }

                // Store reference for comparison
                lastBoundsRef.current = formattedBounds;

                // Trigger callback
                if (onBoundsChange) {
                    onBoundsChange(formattedBounds, mapZoom, mapCenter);
                }

            } catch (error) {
                console.error('[useMapBounds] Error handling bounds change:', error);
            }
        }, debounceDelay);
    }, [map, debounceDelay, onBoundsChange, formatBoundsForAPI, hasBoundsChangedSignificantly, enableHistory, maxHistorySize]);

    // =============================================================================
    // MAP EVENT LISTENERS
    // =============================================================================

    useEffect(() => {
        if (!map) return;

        // Initial bounds setup
        handleBoundsChange();

        // Event handlers
        const events = ['moveend', 'zoomend'];
        if (fetchOnZoom) {
            events.push('zoomend');
        }

        // Add event listeners
        events.forEach(event => {
            map.on(event, handleBoundsChange);
        });

        // Cleanup function
        return () => {
            // Remove event listeners
            events.forEach(event => {
                map.off(event, handleBoundsChange);
            });

            // Clear timeouts
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            // Abort any pending fetch requests
            if (fetchControllerRef.current) {
                fetchControllerRef.current.abort();
            }
        };
    }, [map, handleBoundsChange, fetchOnZoom]);

    // =============================================================================
    // BOUNDS MANIPULATION METHODS
    // =============================================================================

    /**
     * Fit map to specific bounds
     * @param {Object} targetBounds - Bounds to fit
     * @param {Object} options - Fit options
     */
    const fitToBounds = useCallback((targetBounds, fitOptions = {}) => {
        if (!map || !targetBounds) return;

        const defaultOptions = {
            padding: [20, 20],
            maxZoom: 16,
            animate: true,
            duration: 1.5
        };

        try {
            // Convert to Leaflet bounds format if needed
            let leafletBounds;
            if (targetBounds.north && targetBounds.south) {
                // API format
                leafletBounds = [
                    [targetBounds.south, targetBounds.west],
                    [targetBounds.north, targetBounds.east]
                ];
            } else {
                // Already in Leaflet format
                leafletBounds = targetBounds;
            }

            map.fitBounds(leafletBounds, { ...defaultOptions, ...fitOptions });
        } catch (error) {
            console.error('[useMapBounds] Error fitting to bounds:', error);
        }
    }, [map]);

    /**
     * Expand current bounds by percentage
     * @param {number} percentage - Expansion percentage (0.1 = 10%)
     */
    const expandBounds = useCallback((percentage = 0.2) => {
        if (!map || !bounds) return;

        try {
            const currentBounds = map.getBounds();
            const center = currentBounds.getCenter();

            // Calculate expansion
            const latExpansion = (bounds.north - bounds.south) * percentage / 2;
            const lngExpansion = (bounds.east - bounds.west) * percentage / 2;

            // Create expanded bounds
            const expandedBounds = [
                [bounds.south - latExpansion, bounds.west - lngExpansion],
                [bounds.north + latExpansion, bounds.east + lngExpansion]
            ];

            map.fitBounds(expandedBounds, { animate: true });
        } catch (error) {
            console.error('[useMapBounds] Error expanding bounds:', error);
        }
    }, [map, bounds]);

    // =============================================================================
    // HISTORY NAVIGATION
    // =============================================================================

    /**
     * Navigate to previous bounds in history
     */
    const goToPreviousBounds = useCallback(() => {
        if (!enableHistory || currentBoundsIndex <= 0) return;

        const previousIndex = currentBoundsIndex - 1;
        const previousBounds = boundsHistory[previousIndex];

        if (previousBounds) {
            fitToBounds(previousBounds);
            setCurrentBoundsIndex(previousIndex);
        }
    }, [enableHistory, currentBoundsIndex, boundsHistory, fitToBounds]);

    /**
     * Navigate to next bounds in history
     */
    const goToNextBounds = useCallback(() => {
        if (!enableHistory || currentBoundsIndex >= boundsHistory.length - 1) return;

        const nextIndex = currentBoundsIndex + 1;
        const nextBounds = boundsHistory[nextIndex];

        if (nextBounds) {
            fitToBounds(nextBounds);
            setCurrentBoundsIndex(nextIndex);
        }
    }, [enableHistory, currentBoundsIndex, boundsHistory, fitToBounds]);

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    /**
     * Check if coordinates are within current bounds
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} Whether coordinates are within bounds
     */
    const isWithinBounds = useCallback((lat, lng) => {
        if (!bounds) return false;

        return lat >= bounds.south &&
            lat <= bounds.north &&
            lng >= bounds.west &&
            lng <= bounds.east;
    }, [bounds]);

    /**
     * Get distance from center to bounds edge
     * @returns {number} Distance in meters
     */
    const getBoundsRadius = useCallback(() => {
        if (!bounds || !center) return 0;

        // Calculate distance from center to northeast corner
        const corner = { lat: bounds.north, lng: bounds.east };
        return center.distanceTo(corner);
    }, [bounds, center]);

    /**
     * Reset bounds history
     */
    const resetBoundsHistory = useCallback(() => {
        setBoundsHistory([]);
        setCurrentBoundsIndex(-1);
    }, []);

    // =============================================================================
    // RETURN HOOK INTERFACE
    // =============================================================================

    return {
        // Current state
        bounds,
        center,
        zoom,
        isLoading,

        // History state
        boundsHistory,
        currentBoundsIndex,
        canGoBack: enableHistory && currentBoundsIndex > 0,
        canGoForward: enableHistory && currentBoundsIndex < boundsHistory.length - 1,

        // Bounds manipulation
        fitToBounds,
        expandBounds,
        goToPreviousBounds,
        goToNextBounds,
        resetBoundsHistory,

        // Utility methods
        isWithinBounds,
        getBoundsRadius,
        formatBoundsForAPI,
        calculateBoundsArea,
        hasBoundsChangedSignificantly,

        // Manual triggers
        refreshBounds: handleBoundsChange,
        setIsLoading
    };
};

export default useMapBounds;