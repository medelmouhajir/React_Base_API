// =============================================================================
// MAP INTERACTIONS HOOK - Handle map events & user interactions
// =============================================================================
import { useState, useCallback, useRef, useEffect } from 'react';

export const useMapInteractions = (options = {}) => {
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [hoveredMarker, setHoveredMarker] = useState(null);
    const [showMarkers, setShowMarkers] = useState(true);
    const [markerLoadingStates, setMarkerLoadingStates] = useState(new Map());
    const [mapReady, setMapReady] = useState(false);
    const [userInteracting, setUserInteracting] = useState(false);

    const interactionTimeoutRef = useRef(null);
    const markerCallbacksRef = useRef({});

    const defaultOptions = {
        markerHoverDelay: 200,
        markerClickDelay: 100,
        interactionDebounceMs: 1000,
        enableMarkerClustering: true,
        markerAnimationDuration: 300,
        ...options
    };

    // Handle marker selection
    const handleMarkerClick = useCallback((markerId, markerData, markerType = 'business') => {
        // Clear any pending hover states
        if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current);
        }

        // Set loading state for this marker
        setMarkerLoadingStates(prev => new Map(prev.set(markerId, true)));

        // Simulate slight delay for better UX
        setTimeout(() => {
            setSelectedMarker({
                id: markerId,
                data: markerData,
                type: markerType,
                timestamp: Date.now()
            });

            // Clear loading state
            setMarkerLoadingStates(prev => new Map(prev.set(markerId, false)));

            // Call registered callback
            const callback = markerCallbacksRef.current[`${markerType}Click`];
            if (callback) {
                callback(markerId, markerData);
            }
        }, defaultOptions.markerClickDelay);
    }, [defaultOptions.markerClickDelay]);

    // Handle marker hover
    const handleMarkerHover = useCallback((markerId, markerData, markerType = 'business') => {
        if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current);
        }

        interactionTimeoutRef.current = setTimeout(() => {
            setHoveredMarker({
                id: markerId,
                data: markerData,
                type: markerType,
                timestamp: Date.now()
            });

            // Call registered callback
            const callback = markerCallbacksRef.current[`${markerType}Hover`];
            if (callback) {
                callback(markerId, markerData);
            }
        }, defaultOptions.markerHoverDelay);
    }, [defaultOptions.markerHoverDelay]);

    // Handle marker hover end
    const handleMarkerHoverEnd = useCallback(() => {
        if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current);
        }
        setHoveredMarker(null);
    }, []);

    // Clear selected marker
    const clearSelectedMarker = useCallback(() => {
        setSelectedMarker(null);

        // Call registered callback
        const callback = markerCallbacksRef.current.markerDeselect;
        if (callback) {
            callback();
        }
    }, []);

    // Clear hovered marker
    const clearHoveredMarker = useCallback(() => {
        setHoveredMarker(null);
    }, []);

    // Handle business marker interactions
    const handleBusinessClick = useCallback((businessId, businessData) => {
        handleMarkerClick(businessId, businessData, 'business');
    }, [handleMarkerClick]);

    const handleBusinessHover = useCallback((businessId, businessData) => {
        handleMarkerHover(businessId, businessData, 'business');
    }, [handleMarkerHover]);

    // Handle event marker interactions
    const handleEventClick = useCallback((eventId, eventData) => {
        handleMarkerClick(eventId, eventData, 'event');
    }, [handleMarkerClick]);

    const handleEventHover = useCallback((eventId, eventData) => {
        handleMarkerHover(eventId, eventData, 'event');
    }, [handleMarkerHover]);

    // Handle map click (clear selections)
    const handleMapClick = useCallback((event) => {
        // Only clear if clicking on map background (not on markers)
        if (event.originalEvent && !event.originalEvent.defaultPrevented) {
            clearSelectedMarker();
            clearHoveredMarker();
        }
    }, [clearSelectedMarker, clearHoveredMarker]);

    // Handle user interaction start
    const handleInteractionStart = useCallback(() => {
        setUserInteracting(true);

        if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current);
        }

        interactionTimeoutRef.current = setTimeout(() => {
            setUserInteracting(false);
        }, defaultOptions.interactionDebounceMs);
    }, [defaultOptions.interactionDebounceMs]);

    // Register callbacks for marker interactions
    const onBusinessClick = useCallback((callback) => {
        markerCallbacksRef.current.businessClick = callback;
    }, []);

    const onBusinessHover = useCallback((callback) => {
        markerCallbacksRef.current.businessHover = callback;
    }, []);

    const onEventClick = useCallback((callback) => {
        markerCallbacksRef.current.eventClick = callback;
    }, []);

    const onEventHover = useCallback((callback) => {
        markerCallbacksRef.current.eventHover = callback;
    }, []);

    const onMarkerDeselect = useCallback((callback) => {
        markerCallbacksRef.current.markerDeselect = callback;
    }, []);

    // Toggle marker visibility
    const toggleMarkers = useCallback((visible = !showMarkers) => {
        setShowMarkers(visible);
    }, [showMarkers]);

    // Get marker loading state
    const isMarkerLoading = useCallback((markerId) => {
        return markerLoadingStates.get(markerId) || false;
    }, [markerLoadingStates]);

    // Select marker programmatically
    const selectMarker = useCallback((markerId, markerData, markerType = 'business') => {
        setSelectedMarker({
            id: markerId,
            data: markerData,
            type: markerType,
            timestamp: Date.now(),
            programmatic: true
        });
    }, []);

    // Focus on marker (center map and select)
    const focusOnMarker = useCallback((markerId, markerData, markerType = 'business') => {
        selectMarker(markerId, markerData, markerType);

        // Call focus callback if registered
        const callback = markerCallbacksRef.current.markerFocus;
        if (callback) {
            callback(markerId, markerData, markerType);
        }
    }, [selectMarker]);

    // Check if marker is selected
    const isMarkerSelected = useCallback((markerId) => {
        return selectedMarker?.id === markerId;
    }, [selectedMarker]);

    // Check if marker is hovered
    const isMarkerHovered = useCallback((markerId) => {
        return hoveredMarker?.id === markerId;
    }, [hoveredMarker]);

    // Get interaction state for marker
    const getMarkerState = useCallback((markerId) => {
        return {
            isSelected: isMarkerSelected(markerId),
            isHovered: isMarkerHovered(markerId),
            isLoading: isMarkerLoading(markerId),
            isInteractive: !userInteracting
        };
    }, [isMarkerSelected, isMarkerHovered, isMarkerLoading, userInteracting]);

    // Handle map ready state
    const handleMapReady = useCallback((ready = true) => {
        setMapReady(ready);
        if (ready) {
            // Show markers with animation after map is ready
            setTimeout(() => {
                setShowMarkers(true);
            }, defaultOptions.markerAnimationDuration);
        }
    }, [defaultOptions.markerAnimationDuration]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current);
            }
        };
    }, []);

    return {
        // State
        selectedMarker,
        hoveredMarker,
        showMarkers,
        mapReady,
        userInteracting,

        // Marker Actions
        handleBusinessClick,
        handleBusinessHover,
        handleEventClick,
        handleEventHover,
        handleMarkerHoverEnd,
        handleMapClick,

        // Selection Management
        selectMarker,
        clearSelectedMarker,
        clearHoveredMarker,
        focusOnMarker,

        // Callback Registration
        onBusinessClick,
        onBusinessHover,
        onEventClick,
        onEventHover,
        onMarkerDeselect,

        // Utilities
        isMarkerSelected,
        isMarkerHovered,
        isMarkerLoading,
        getMarkerState,
        toggleMarkers,

        // Map State
        handleMapReady,
        handleInteractionStart,

        // Status
        hasSelection: selectedMarker !== null,
        hasHover: hoveredMarker !== null,
        isInteractive: mapReady && !userInteracting,
        selectedMarkerType: selectedMarker?.type,
        selectedMarkerId: selectedMarker?.id
    };
};