// =============================================================================
// MAP CONTROLLER COMPONENT - Handles map events, bounds, zoom and navigation
// =============================================================================
import React, { useEffect, useRef, useCallback, forwardRef } from 'react';
import { useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import * as geoUtils from '../../utils/geoUtils';
import { MAP_CONFIG } from '../../utils/mapConstants';

const MapController = forwardRef(({
    center,
    zoom,
    bounds,
    userLocation,
    isMoving,
    onViewportChange,
    onLocationChange,
    enableKeyboardNavigation = true,
    enableGestureHandling = true,
    restrictBounds = true,
    animationDuration = 500
}, ref) => {
    const { t } = useTranslation();
    const map = useMap();
    const previousCenter = useRef(center);
    const previousZoom = useRef(zoom);
    const isAnimating = useRef(false);

    // Keyboard navigation setup
    useEffect(() => {
        if (!enableKeyboardNavigation || !map) return;

        const handleKeyDown = (e) => {
            // Only handle if map is focused or no other input is focused
            if (document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            const panDistance = 50; // pixels
            const zoomStep = 1;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    map.panBy([0, -panDistance]);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    map.panBy([0, panDistance]);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    map.panBy([-panDistance, 0]);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    map.panBy([panDistance, 0]);
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    map.zoomIn(zoomStep);
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    map.zoomOut(zoomStep);
                    break;
                case 'Home':
                    e.preventDefault();
                    if (userLocation) {
                        map.setView([userLocation.lat, userLocation.lng], MAP_CONFIG.DEFAULT_ZOOM);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Clear any selections or close popups
                    map.closePopup();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [map, enableKeyboardNavigation, userLocation]);

    // Gesture handling setup
    useEffect(() => {
        if (!enableGestureHandling || !map) return;

        // Disable map interaction when scrolling over it without focusing
        let isMapFocused = false;

        const handleMouseEnter = () => {
            if (!isMapFocused) {
                map.scrollWheelZoom.disable();
            }
        };

        const handleMouseLeave = () => {
            map.scrollWheelZoom.enable();
            isMapFocused = false;
        };

        const handleClick = () => {
            isMapFocused = true;
            map.scrollWheelZoom.enable();
        };

        const mapContainer = map.getContainer();
        mapContainer.addEventListener('mouseenter', handleMouseEnter);
        mapContainer.addEventListener('mouseleave', handleMouseLeave);
        mapContainer.addEventListener('click', handleClick);

        return () => {
            mapContainer.removeEventListener('mouseenter', handleMouseEnter);
            mapContainer.removeEventListener('mouseleave', handleMouseLeave);
            mapContainer.removeEventListener('click', handleClick);
        };
    }, [map, enableGestureHandling]);

    // Bounds restriction setup
    useEffect(() => {
        if (!restrictBounds || !map) return;

        const moroccanBounds = L.latLngBounds(
            L.latLng(MAP_CONFIG.MOROCCO_BOUNDS.south, MAP_CONFIG.MOROCCO_BOUNDS.west),
            L.latLng(MAP_CONFIG.MOROCCO_BOUNDS.north, MAP_CONFIG.MOROCCO_BOUNDS.east)
        );

        map.setMaxBounds(moroccanBounds);
        map.on('drag', () => {
            map.panInsideBounds(moroccanBounds, { animate: false });
        });

        return () => {
            map.setMaxBounds(null);
            map.off('drag');
        };
    }, [map, restrictBounds]);

    // Center change handler
    useEffect(() => {
        if (!map || !center || isAnimating.current) return;

        const currentCenter = map.getCenter();
        const newCenter = Array.isArray(center) ? center : [center.lat, center.lng];

        // Check if center actually changed significantly
        const distance = geoUtils.calculateDistance(
            currentCenter.lat,
            currentCenter.lng,
            newCenter[0],
            newCenter[1]
        );

        // Only update if distance is more than 100 meters
        if (distance > 0.1) {
            isAnimating.current = true;

            map.setView(newCenter, map.getZoom(), {
                animate: true,
                duration: animationDuration / 1000,
                easeLinearity: 0.25
            });

            setTimeout(() => {
                isAnimating.current = false;
            }, animationDuration);
        }

        previousCenter.current = center;
    }, [center, map, animationDuration]);

    // Zoom change handler
    useEffect(() => {
        if (!map || zoom === undefined || isAnimating.current) return;

        const currentZoom = map.getZoom();

        if (Math.abs(currentZoom - zoom) > 0.1) {
            isAnimating.current = true;

            map.setZoom(zoom, {
                animate: true,
                duration: animationDuration / 1000
            });

            setTimeout(() => {
                isAnimating.current = false;
            }, animationDuration);
        }

        previousZoom.current = zoom;
    }, [zoom, map, animationDuration]);

    // Viewport change handler
    useEffect(() => {
        if (!map || !onViewportChange) return;

        const handleViewportChange = () => {
            if (isAnimating.current) return;

            const newCenter = map.getCenter();
            const newZoom = map.getZoom();
            const newBounds = map.getBounds();

            onViewportChange({
                center: { lat: newCenter.lat, lng: newCenter.lng },
                zoom: newZoom,
                bounds: {
                    north: newBounds.getNorth(),
                    south: newBounds.getSouth(),
                    east: newBounds.getEast(),
                    west: newBounds.getWest()
                }
            });
        };

        map.on('moveend', handleViewportChange);
        map.on('zoomend', handleViewportChange);

        return () => {
            map.off('moveend', handleViewportChange);
            map.off('zoomend', handleViewportChange);
        };
    }, [map, onViewportChange]);

    // User location change handler
    useEffect(() => {
        if (!userLocation || !onLocationChange) return;

        onLocationChange(userLocation);
    }, [userLocation, onLocationChange]);

    // Public methods for external control
    const flyTo = useCallback((center, zoom = map?.getZoom(), options = {}) => {
        if (!map) return;

        const target = Array.isArray(center) ? center : [center.lat, center.lng];

        map.flyTo(target, zoom, {
            animate: true,
            duration: animationDuration / 1000,
            easeLinearity: 0.25,
            ...options
        });
    }, [map, animationDuration]);

    const fitBounds = useCallback((bounds, options = {}) => {
        if (!map || !bounds) return;

        const leafletBounds = L.latLngBounds(
            L.latLng(bounds.south, bounds.west),
            L.latLng(bounds.north, bounds.east)
        );

        map.fitBounds(leafletBounds, {
            animate: true,
            duration: animationDuration / 1000,
            maxZoom: MAP_CONFIG.MAX_ZOOM,
            padding: [20, 20],
            ...options
        });
    }, [map, animationDuration]);

    const panTo = useCallback((center, options = {}) => {
        if (!map) return;

        const target = Array.isArray(center) ? center : [center.lat, center.lng];

        map.panTo(target, {
            animate: true,
            duration: animationDuration / 1000,
            easeLinearity: 0.25,
            ...options
        });
    }, [map, animationDuration]);

    const zoomToFit = useCallback((items, options = {}) => {
        if (!map || !items || items.length === 0) return;

        // Calculate bounds for all items
        const bounds = geoUtils.calculateBounds(items);

        if (bounds) {
            fitBounds(bounds, options);
        }
    }, [map, fitBounds]);

    const resetView = useCallback(() => {
        if (!map) return;

        const defaultCenter = userLocation
            ? [userLocation.lat, userLocation.lng]
            : MAP_CONFIG.DEFAULT_CENTER;

        flyTo(defaultCenter, MAP_CONFIG.DEFAULT_ZOOM);
    }, [map, userLocation, flyTo]);

    // Expose methods to parent components via ref
    React.useImperativeHandle(ref, () => ({
        flyTo,
        fitBounds,
        panTo,
        zoomToFit,
        resetView,
        getMap: () => map
    }), [flyTo, fitBounds, panTo, zoomToFit, resetView, map]);

    // Add map state classes
    useEffect(() => {
        if (!map) return;

        const container = map.getContainer();

        if (isMoving) {
            container.classList.add('map-moving');
        } else {
            container.classList.remove('map-moving');
        }

        if (isAnimating.current) {
            container.classList.add('map-animating');
        } else {
            container.classList.remove('map-animating');
        }
    }, [map, isMoving]);

    // Add accessibility attributes
    useEffect(() => {
        if (!map) return;

        const container = map.getContainer();
        container.setAttribute('role', 'application');
        container.setAttribute('aria-label', t('map.main_map', 'Interactive map showing businesses and events'));
        container.setAttribute('tabindex', '0');

        // Add keyboard instructions for screen readers
        const instructions = document.createElement('div');
        instructions.className = 'sr-only';
        instructions.innerHTML = t('map.keyboard_instructions',
            'Use arrow keys to pan, plus/minus to zoom, Home to return to your location, Escape to close popups');
        container.appendChild(instructions);

        return () => {
            instructions.remove();
        };
    }, [map, t]);

    return null; // This component only manages map behavior
});

export default MapController;