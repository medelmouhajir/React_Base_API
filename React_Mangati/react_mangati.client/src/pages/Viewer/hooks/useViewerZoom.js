// src/pages/Viewer/hooks/useViewerZoom.js
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to handle zoom functionality for the manga viewer
 * 
 * Features:
 * - Zoom in/out with configurable steps
 * - Customizable min/max zoom limits
 * - Smooth zoom indicator display and hiding
 * - Mouse wheel zoom support
 * - Double-click to reset zoom
 * - Pinch-to-zoom gesture support (mobile)
 * - Persistent zoom settings (optional)
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.initialZoom - Starting zoom level (default: 100)
 * @param {number} options.minZoom - Minimum allowed zoom (default: 50)
 * @param {number} options.maxZoom - Maximum allowed zoom (default: 200)
 * @param {number} options.step - Zoom increment/decrement step (default: 10)
 * @param {number} options.indicatorDuration - How long to show the indicator in ms (default: 1500)
 * @param {boolean} options.persistZoom - Whether to save zoom preference in localStorage (default: false)
 * @param {string} options.storageKey - Key for localStorage if persistZoom is true (default: 'mangaViewerZoom')
 * @param {boolean} options.enableMouseWheel - Enable mouse wheel zoom (default: true)
 * @returns {Object} Zoom control methods and state
 */
const useViewerZoom = ({
    initialZoom = 100,
    minZoom = 50,
    maxZoom = 200,
    step = 10,
    indicatorDuration = 1500,
    persistZoom = false,
    storageKey = 'mangaViewerZoom',
    enableMouseWheel = true
} = {}) => {
    // Try to load saved zoom from localStorage if persistZoom is enabled
    const getSavedZoom = () => {
        if (persistZoom && typeof window !== 'undefined') {
            try {
                const savedZoom = parseInt(localStorage.getItem(storageKey));
                if (savedZoom && !isNaN(savedZoom)) {
                    return Math.min(Math.max(savedZoom, minZoom), maxZoom);
                }
            } catch (error) {
                console.warn('Error retrieving saved zoom:', error);
            }
        }
        return initialZoom;
    };

    // State
    const [zoom, setZoom] = useState(getSavedZoom);
    const [zoomIndicatorVisible, setZoomIndicatorVisible] = useState(false);
    const [gestureZooming, setGestureZooming] = useState(false);
    const zoomTimeout = useRef(null);
    const containerRef = useRef(null);
    const initialDistance = useRef(null);
    const initialZoomRef = useRef(zoom);

    // Save zoom to localStorage if persistZoom is enabled
    useEffect(() => {
        if (persistZoom && typeof window !== 'undefined') {
            try {
                localStorage.setItem(storageKey, zoom.toString());
            } catch (error) {
                console.warn('Error saving zoom preference:', error);
            }
        }
    }, [zoom, persistZoom, storageKey]);

    // Show zoom indicator with auto-hide
    const showZoomIndicator = useCallback(() => {
        setZoomIndicatorVisible(true);

        if (zoomTimeout.current) {
            clearTimeout(zoomTimeout.current);
        }

        zoomTimeout.current = setTimeout(() => {
            setZoomIndicatorVisible(false);
        }, indicatorDuration);
    }, [indicatorDuration]);

    // Core zoom functions
    const setZoomWithinBounds = useCallback((newZoom) => {
        const boundedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
        setZoom(boundedZoom);
        return boundedZoom;
    }, [minZoom, maxZoom]);

    const zoomIn = useCallback(() => {
        setZoomWithinBounds(zoom + step);
        showZoomIndicator();
    }, [zoom, step, setZoomWithinBounds, showZoomIndicator]);

    const zoomOut = useCallback(() => {
        setZoomWithinBounds(zoom - step);
        showZoomIndicator();
    }, [zoom, step, setZoomWithinBounds, showZoomIndicator]);

    const resetZoom = useCallback(() => {
        setZoomWithinBounds(initialZoom);
        showZoomIndicator();
    }, [initialZoom, setZoomWithinBounds, showZoomIndicator]);

    const zoomTo = useCallback((zoomLevel) => {
        const newZoom = setZoomWithinBounds(zoomLevel);
        showZoomIndicator();
        return newZoom;
    }, [setZoomWithinBounds, showZoomIndicator]);

    // Mouse wheel zoom handler
    const handleWheel = useCallback((event) => {
        if (!enableMouseWheel || event.ctrlKey) return;

        event.preventDefault();

        // Zoom in on scroll up, out on scroll down
        if (event.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    }, [enableMouseWheel, zoomIn, zoomOut]);

    // Attach/detach wheel event listener
    useEffect(() => {
        if (!enableMouseWheel || !containerRef.current) return;

        const element = containerRef.current;
        element.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            element.removeEventListener('wheel', handleWheel);
        };
    }, [enableMouseWheel, handleWheel]);

    // Touch gesture zoom handlers for mobile devices
    const handleTouchStart = useCallback((event) => {
        if (event.touches.length !== 2) return;

        // Calculate initial distance between two fingers
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        initialDistance.current = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        initialZoomRef.current = zoom;
        setGestureZooming(true);
    }, [zoom]);

    const handleTouchMove = useCallback((event) => {
        if (!gestureZooming || event.touches.length !== 2 || !initialDistance.current) return;

        event.preventDefault();

        // Calculate new distance and determine zoom factor
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );

        const scale = currentDistance / initialDistance.current;
        const newZoom = Math.round(initialZoomRef.current * scale);

        setZoomWithinBounds(newZoom);
        setZoomIndicatorVisible(true);
    }, [gestureZooming, setZoomWithinBounds]);

    const handleTouchEnd = useCallback(() => {
        if (gestureZooming) {
            setGestureZooming(false);
            initialDistance.current = null;

            // Hide zoom indicator after a delay
            if (zoomTimeout.current) {
                clearTimeout(zoomTimeout.current);
            }

            zoomTimeout.current = setTimeout(() => {
                setZoomIndicatorVisible(false);
            }, indicatorDuration);
        }
    }, [gestureZooming, indicatorDuration]);

    // Attach/detach touch event listeners
    useEffect(() => {
        if (!containerRef.current) return;

        const element = containerRef.current;
        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd);
        element.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    // Double-click to reset zoom
    const handleDoubleClick = useCallback((event) => {
        event.preventDefault();
        resetZoom();
    }, [resetZoom]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (zoomTimeout.current) {
                clearTimeout(zoomTimeout.current);
            }
        };
    }, []);

    return {
        zoom,
        zoomIn,
        zoomOut,
        resetZoom,
        zoomTo,
        zoomIndicatorVisible,
        containerRef,
        handleDoubleClick,
        minZoom,
        maxZoom,
        step,
        isMaxZoom: zoom >= maxZoom,
        isMinZoom: zoom <= minZoom,
        // Additional helper functions
        getZoomPercent: () => zoom,
        getZoomDecimal: () => zoom / 100,
        getZoomStyle: () => ({ transform: `scale(${zoom / 100})` })
    };
};

export default useViewerZoom;