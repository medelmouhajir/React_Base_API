// =============================================================================
// MAP BOUNDS HOOK - Viewport-based Data Fetching
// =============================================================================
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';

// Complete fix for useMapBounds.js - replace the entire hook implementation

export const useMapBounds = (options = {}) => {
    const [bounds, setBounds] = useState(null);
    const [center, setCenter] = useState(null);
    const [zoom, setZoom] = useState(12);
    const [mapInstance, setMapInstance] = useState(null);
    const [isMoving, setIsMoving] = useState(false);
    const [lastFetchBounds, setLastFetchBounds] = useState(null);

    const boundsChangeCallbackRef = useRef(null);
    const previousBoundsRef = useRef(null);

    const defaultOptions = {
        debounceMs: 500,
        minZoomForFetch: 10,
        expansionFactor: 0.2,
        refetchThreshold: 0.3,
        ...options
    };

    // Check if we need to fetch new data
    const shouldFetchData = useCallback((newBounds, newZoom) => {
        // Don't fetch if zoom is too low
        if (newZoom < defaultOptions.minZoomForFetch) {
            return false;
        }

        // Always fetch if we haven't fetched before
        if (!lastFetchBounds) {
            return true;
        }

        // Check if current view has moved significantly outside cached area
        const currentViewArea = calculateBoundsArea(newBounds);
        const cachedArea = calculateBoundsArea(lastFetchBounds);
        const intersection = calculateBoundsIntersection(newBounds, lastFetchBounds);
        const intersectionArea = intersection ? calculateBoundsArea(intersection) : 0;

        const coverageRatio = intersectionArea / currentViewArea;

        return coverageRatio < (1 - defaultOptions.refetchThreshold);
    }, [lastFetchBounds, defaultOptions.minZoomForFetch, defaultOptions.refetchThreshold]);

    // Debounced bounds change handler - now defined after shouldFetchData
    const debouncedBoundsChange = useMemo(
        () => debounce((newBounds, newCenter, newZoom) => {
            setBounds(newBounds);
            setCenter(newCenter);
            setZoom(newZoom);
            setIsMoving(false);

            if (boundsChangeCallbackRef.current) {
                boundsChangeCallbackRef.current({
                    bounds: newBounds,
                    center: newCenter,
                    zoom: newZoom,
                    shouldFetch: shouldFetchData(newBounds, newZoom)
                });
            }
        }, defaultOptions.debounceMs),
        [defaultOptions.debounceMs, shouldFetchData]
    );

    // Calculate expanded bounds for prefetching
    const getExpandedBounds = useCallback((bounds) => {
        if (!bounds) return null;

        const { north, south, east, west } = bounds;
        const latExpansion = (north - south) * defaultOptions.expansionFactor;
        const lngExpansion = (east - west) * defaultOptions.expansionFactor;

        return {
            north: north + latExpansion,
            south: south - latExpansion,
            east: east + lngExpansion,
            west: west - lngExpansion
        };
    }, [defaultOptions.expansionFactor]);

    // Handle map move start
    const handleMoveStart = useCallback(() => {
        setIsMoving(true);
        debouncedBoundsChange.cancel();
    }, [debouncedBoundsChange]);

    // Handle map bounds change
    const handleBoundsChange = useCallback((newBounds, newCenter, newZoom) => {
        // Store the current bounds for comparison
        previousBoundsRef.current = bounds;

        // Trigger debounced update
        debouncedBoundsChange(newBounds, newCenter, newZoom);
    }, [bounds, debouncedBoundsChange]);

    // Set bounds change callback
    const onBoundsChange = useCallback((callback) => {
        boundsChangeCallbackRef.current = callback;
    }, []);

    // Update last fetch bounds when data is successfully fetched
    const markDataFetched = useCallback((fetchedBounds = bounds) => {
        if (fetchedBounds) {
            setLastFetchBounds(getExpandedBounds(fetchedBounds));
        }
    }, [bounds, getExpandedBounds]);

    // Get bounds for API call (with expansion for prefetching)
    const getBoundsForFetch = useCallback(() => {
        return getExpandedBounds(bounds);
    }, [bounds, getExpandedBounds]);

    // Calculate if point is within bounds
    const isPointInBounds = useCallback((lat, lng, boundsToCheck = bounds) => {
        if (!boundsToCheck) return false;

        const { north, south, east, west } = boundsToCheck;
        return lat >= south && lat <= north && lng >= west && lng <= east;
    }, [bounds]);

    // Calculate distance from bounds center
    const getDistanceFromCenter = useCallback((lat, lng) => {
        if (!center) return null;

        // Simple distance calculation (in degrees)
        const latDiff = lat - center.lat;
        const lngDiff = lng - center.lng;
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    }, [center]);

    // Check if bounds are significantly different
    const haveBoundsChanged = useCallback((newBounds, threshold = 0.001) => {
        if (!bounds || !newBounds) return true;

        const latDiff = Math.abs(newBounds.north - bounds.north) +
            Math.abs(newBounds.south - bounds.south);
        const lngDiff = Math.abs(newBounds.east - bounds.east) +
            Math.abs(newBounds.west - bounds.west);

        return (latDiff + lngDiff) > threshold;
    }, [bounds]);

    // Reset bounds and force refetch
    const resetBounds = useCallback(() => {
        setLastFetchBounds(null);
        setBounds(null);
        setCenter(null);
        if (boundsChangeCallbackRef.current && bounds) {
            boundsChangeCallbackRef.current({
                bounds,
                center,
                zoom,
                shouldFetch: true,
                forceRefresh: true
            });
        }
    }, [bounds, center, zoom]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            debouncedBoundsChange.cancel();
        };
    }, [debouncedBoundsChange]);

    return {
        // State
        bounds,
        center,
        zoom,
        isMoving,
        lastFetchBounds,
        mapInstance,

        // Actions
        handleBoundsChange,
        handleMoveStart,
        onBoundsChange,
        markDataFetched,
        resetBounds,
        setMapInstance,

        // Utilities
        getBoundsForFetch,
        getExpandedBounds,
        isPointInBounds,
        getDistanceFromCenter,
        haveBoundsChanged,
        shouldFetchData: (boundsToCheck = bounds) => shouldFetchData(boundsToCheck, zoom),

        // Status
        hasValidBounds: bounds !== null,
        isZoomSufficient: zoom >= defaultOptions.minZoomForFetch,
        needsDataFetch: bounds && shouldFetchData(bounds, zoom)
    };
};

// Helper functions
const calculateBoundsArea = (bounds) => {
    if (!bounds) return 0;
    const { north, south, east, west } = bounds;
    return Math.abs(north - south) * Math.abs(east - west);
};

const calculateBoundsIntersection = (bounds1, bounds2) => {
    if (!bounds1 || !bounds2) return null;

    const north = Math.min(bounds1.north, bounds2.north);
    const south = Math.max(bounds1.south, bounds2.south);
    const east = Math.min(bounds1.east, bounds2.east);
    const west = Math.max(bounds1.west, bounds2.west);

    // Check if intersection exists
    if (north <= south || east <= west) return null;

    return { north, south, east, west };
};