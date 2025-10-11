// src/pages/Gps/Home/hooks/useMapControls.js
import { useState, useCallback, useRef, useEffect } from 'react';

const useMapControls = (initialCenter = [33.5731, -7.5898], initialZoom = 6) => {
    const mapRef = useRef(null);

    // Map state
    const [mapState, setMapState] = useState({
        center: initialCenter,
        zoom: initialZoom,
        followVehicle: false,
        isReady: false
    });

    const [viewMode, setViewMode] = useState('vehicles'); // 'vehicles' or 'route'
    const [followMode, setFollowMode] = useState(false);
    const [trackingVehicle, setTrackingVehicle] = useState(null);

    // Map ready handler
    const handleMapReady = useCallback((map) => {
        mapRef.current = map;
        setMapState(prev => ({ ...prev, isReady: true }));

        // Add map event listeners
        map.on('moveend', () => {
            const center = map.getCenter();
            const zoom = map.getZoom();

            setMapState(prev => ({
                ...prev,
                center: [center.lat, center.lng],
                zoom,
                followVehicle: false
            }));

            // Stop following when user manually moves map
            if (followMode) {
                setFollowMode(false);
            }
        });

        map.on('zoomend', () => {
            const zoom = map.getZoom();
            setMapState(prev => ({ ...prev, zoom }));
        });
    }, [followMode]);

    // Center map on coordinates
    const centerMap = useCallback((center, zoom = null, animate = true) => {
        if (!mapRef.current) return;

        const targetZoom = zoom || mapState.zoom || 10;

        if (animate) {
            mapRef.current.flyTo(center, targetZoom, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        } else {
            mapRef.current.setView(center, targetZoom);
        }

        setMapState(prev => ({
            ...prev,
            center,
            zoom: targetZoom,
            followVehicle: false
        }));
    }, [mapState.zoom]);

    // Fit bounds to show all points
    const fitBounds = useCallback((bounds, options = {}) => {
        if (!mapRef.current) return;

        const defaultOptions = {
            padding: [20, 20],
            maxZoom: 16,
            animate: true
        };

        mapRef.current.fitBounds(bounds, { ...defaultOptions, ...options });
        setFollowMode(false);
    }, []);

    // Center on specific vehicle
    const centerOnVehicle = useCallback((vehicle, zoom = 15) => {
        if (!vehicle?.lastLocation) return;

        const { latitude, longitude } = vehicle.lastLocation;
        centerMap([latitude, longitude], zoom);
        setTrackingVehicle(vehicle);
    }, [centerMap]);

    // Center on all vehicles
    const centerOnAllVehicles = useCallback((vehicles) => {
        if (!vehicles?.length || !mapRef.current) return;

        const validVehicles = vehicles.filter(v => v.lastLocation);
        if (validVehicles.length === 0) return;

        if (validVehicles.length === 1) {
            centerOnVehicle(validVehicles[0]);
            return;
        }

        // Create bounds from all vehicle positions
        const positions = validVehicles.map(v => [
            v.lastLocation.latitude,
            v.lastLocation.longitude
        ]);

        const bounds = positions.reduce((bounds, pos) => {
            return bounds.extend(pos);
        }, L.latLngBounds(positions[0], positions[0]));

        fitBounds(bounds);
    }, [centerOnVehicle, fitBounds]);

    // Center on route
    const centerOnRoute = useCallback((routeData) => {
        if (!routeData?.bounds || !mapRef.current) return;

        const { north, south, east, west } = routeData.bounds;
        const bounds = [[south, west], [north, east]];

        fitBounds(bounds, { padding: [30, 30] });
    }, [fitBounds]);

    // Toggle follow vehicle mode
    const toggleFollowVehicle = useCallback((vehicle) => {
        if (!vehicle?.lastLocation) return;

        const newFollowMode = !followMode || trackingVehicle?.id !== vehicle.id;

        setFollowMode(newFollowMode);
        setTrackingVehicle(newFollowMode ? vehicle : null);

        if (newFollowMode) {
            centerOnVehicle(vehicle, 16);
            setMapState(prev => ({ ...prev, followVehicle: true }));
        } else {
            setMapState(prev => ({ ...prev, followVehicle: false }));
        }
    }, [followMode, trackingVehicle, centerOnVehicle]);

    // Auto-follow selected vehicle (for real-time updates)
    const autoFollowVehicle = useCallback((vehicle) => {
        if (!followMode || trackingVehicle?.id !== vehicle?.id) return;
        if (!vehicle?.lastLocation) return;

        const { latitude, longitude } = vehicle.lastLocation;

        // Only update if position has changed significantly
        const currentCenter = mapState.center;
        const distance = Math.sqrt(
            Math.pow(currentCenter[0] - latitude, 2) +
            Math.pow(currentCenter[1] - longitude, 2)
        );

        // If vehicle moved more than ~50 meters, update map center
        if (distance > 0.0005) {
            centerMap([latitude, longitude], mapState.zoom, true);
        }
    }, [followMode, trackingVehicle, mapState.center, mapState.zoom, centerMap]);

    // Toggle view mode
    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'vehicles' ? 'route' : 'vehicles');
    }, []);

    // Set view mode explicitly
    const setMapViewMode = useCallback((mode) => {
        setViewMode(mode);
    }, []);

    // Get current map bounds
    const getCurrentBounds = useCallback(() => {
        if (!mapRef.current) return null;

        const bounds = mapRef.current.getBounds();
        return {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        };
    }, []);

    // Check if coordinates are in current view
    const isInCurrentView = useCallback((lat, lng) => {
        const bounds = getCurrentBounds();
        if (!bounds) return false;

        return lat >= bounds.south && lat <= bounds.north &&
            lng >= bounds.west && lng <= bounds.east;
    }, [getCurrentBounds]);

    // Zoom to specific level
    const zoomTo = useCallback((zoom, animate = true) => {
        if (!mapRef.current) return;

        if (animate) {
            mapRef.current.setZoom(zoom);
        } else {
            mapRef.current.setZoom(zoom, { animate: false });
        }

        setMapState(prev => ({ ...prev, zoom }));
    }, []);

    // Reset map to initial state
    const resetMap = useCallback(() => {
        centerMap(initialCenter, initialZoom, true);
        setFollowMode(false);
        setTrackingVehicle(null);
        setViewMode('vehicles');
    }, [centerMap, initialCenter, initialZoom]);

    // Effect to handle real-time vehicle following
    useEffect(() => {
        if (followMode && trackingVehicle) {
            // Set up interval for smooth following (optional)
            const interval = setInterval(() => {
                autoFollowVehicle(trackingVehicle);
            }, 2000); // Check every 2 seconds

            return () => clearInterval(interval);
        }
    }, [followMode, trackingVehicle, autoFollowVehicle]);

    return {
        // State
        mapRef,
        mapState,
        viewMode,
        followMode,
        trackingVehicle,

        // Map control functions
        handleMapReady,
        centerMap,
        fitBounds,
        centerOnVehicle,
        centerOnAllVehicles,
        centerOnRoute,
        toggleFollowVehicle,
        autoFollowVehicle,

        // View control functions
        toggleViewMode,
        setMapViewMode,

        // Utility functions
        getCurrentBounds,
        isInCurrentView,
        zoomTo,
        resetMap,

        // Manual state setters (for external control)
        setMapState,
        setFollowMode,
        setTrackingVehicle
    };
};

export default useMapControls;