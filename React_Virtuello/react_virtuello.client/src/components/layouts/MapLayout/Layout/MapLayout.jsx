/**
 * MapLayout - Clean map container component with Leaflet integration
 * Displays map and controls without data fetching logic
 * 
 * @author WAN SOLUTIONS
 * @version 2.0.0 - Clean implementation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';

// Components
import MapControls from '../Controls/MapControls';

// Styles
import './MapLayout.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// =============================================================================
// MAP EVENT HANDLERS
// =============================================================================

/**
 * Map Events Handler - Handles map interactions and updates
 */
const MapEventsHandler = ({
    onBoundsChange,
    onLocationFound,
    onMapClick,
    onZoomChange
}) => {
    const mapEvents = useMapEvents({
        moveend: () => {
            const bounds = mapEvents.getBounds();
            const center = mapEvents.getCenter();
            const zoom = mapEvents.getZoom();

            if (onBoundsChange) {
                onBoundsChange({
                    bounds: {
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest()
                    },
                    center: { lat: center.lat, lng: center.lng },
                    zoom
                });
            }
        },

        zoomend: () => {
            const zoom = mapEvents.getZoom();
            if (onZoomChange) {
                onZoomChange(zoom);
            }
        },

        click: (e) => {
            if (onMapClick) {
                onMapClick({
                    latlng: e.latlng,
                    layerPoint: e.layerPoint,
                    containerPoint: e.containerPoint
                });
            }
        },

        locationfound: (e) => {
            if (onLocationFound) {
                onLocationFound({
                    latlng: e.latlng,
                    bounds: e.bounds,
                    accuracy: e.accuracy
                });
            }
        }
    });

    return null;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const MapLayout = ({
    children,
    defaultCenter = [34.0622, -6.7636], // Fes, Morocco
    defaultZoom = 13,
    className = '',
    showControls = true,
    enableGeolocation = true,
    onLocationSelect,
    onSearchResult,
    onMapReady,
    onMapClick,
    mapStyle = 'default',
    theme = 'light',
    maxZoom = 18,
    minZoom = 3
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [mapState, setMapState] = useState({
        center: { lat: defaultCenter[0], lng: defaultCenter[1] },
        zoom: defaultZoom,
        bounds: null
    });

    const [userLocation, setUserLocation] = useState(null);
    const [isTrackingLocation, setIsTrackingLocation] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);

    const mapRef = useRef(null);

    // =============================================================================
    // COMPUTED VALUES
    // =============================================================================

    const tileLayerUrl = (() => {
        switch (mapStyle) {
            case 'satellite':
                return 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
            case 'terrain':
                return 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
            case 'dark':
                return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            default:
                return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        }
    })();

    const tileLayerAttribution = (() => {
        switch (mapStyle) {
            case 'satellite':
            case 'terrain':
                return '&copy; Google';
            case 'dark':
                return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
            default:
                return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        }
    })();

    // =============================================================================
    // LIFECYCLE METHODS
    // =============================================================================

    useEffect(() => {
        if (mapRef.current && !mapInstance) {
            setMapInstance(mapRef.current);
            if (onMapReady) {
                onMapReady(mapRef.current);
            }
        }
    }, [mapInstance, onMapReady]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle map bounds change
     */
    const handleBoundsChange = useCallback((boundsData) => {
        setMapState(prev => ({
            ...prev,
            center: boundsData.center,
            zoom: boundsData.zoom,
            bounds: boundsData.bounds
        }));
    }, []);

    /**
     * Handle user location found
     */
    const handleLocationFound = useCallback((locationData) => {
        setUserLocation(locationData);

        if (onLocationSelect) {
            onLocationSelect(locationData);
        }
    }, [onLocationSelect]);

    /**
     * Handle map click
     */
    const handleMapClickInternal = useCallback((clickData) => {
        if (onMapClick) {
            onMapClick(clickData);
        }
    }, [onMapClick]);

    /**
     * Handle zoom change
     */
    const handleZoomChange = useCallback((newZoom) => {
        setMapState(prev => ({
            ...prev,
            zoom: newZoom
        }));
    }, []);

    /**
     * Handle search result
     */
    const handleSearchResult = useCallback((result) => {
        if (result?.lat && result?.lng) {
            setMapState(prev => ({
                ...prev,
                center: { lat: result.lat, lng: result.lng },
                zoom: result.zoom || 16
            }));
        }

        if (onSearchResult) {
            onSearchResult(result);
        }
    }, [onSearchResult]);

    /**
     * Toggle location tracking
     */
    const handleLocationToggle = useCallback(() => {
        setIsTrackingLocation(prev => !prev);

        if (mapInstance && !isTrackingLocation) {
            mapInstance.locate({ setView: true, maxZoom: 16 });
        }
    }, [mapInstance, isTrackingLocation]);

    /**
     * Handle layer toggle
     */
    const handleLayerToggle = useCallback((layerType, enabled) => {
        console.log(`[MapLayout] Toggle layer ${layerType}:`, enabled);
        // Layer toggle logic will be implemented later
    }, []);

    /**
     * Handle filter changes
     */
    const handleFilterChange = useCallback((newFilters) => {
        console.log(`[MapLayout] Filter change:`, newFilters);
        // Filter logic will be implemented later
    }, []);

    /**
     * Handle reset view
     */
    const handleResetView = useCallback(() => {
        setMapState({
            center: { lat: defaultCenter[0], lng: defaultCenter[1] },
            zoom: defaultZoom,
            bounds: null
        });

        if (mapInstance) {
            mapInstance.setView(defaultCenter, defaultZoom);
        }
    }, [defaultCenter, defaultZoom, mapInstance]);

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <div className={`map-layout ${className} map-layout--${theme}`}>
            {/* Map Controls */}
            {showControls && (
                <MapControls
                    mapInstance={mapInstance}
                    mapBounds={mapState.bounds}
                    currentZoom={mapState.zoom}
                    minZoom={minZoom}
                    maxZoom={maxZoom}
                    userLocation={userLocation}
                    isLocationTracking={isTrackingLocation}
                    onSearchResult={handleSearchResult}
                    onFilterChange={handleFilterChange}
                    onLayerToggle={handleLayerToggle}
                    onZoomChange={handleZoomChange}
                    onLocationToggle={handleLocationToggle}
                    onLocationFound={handleLocationFound}
                    onResetView={handleResetView}
                    theme={theme}
                    layout="responsive"
                    showSearch={true}
                    showFilters={true}
                    showLayers={true}
                    showZoom={true}
                    showLocation={enableGeolocation}
                    showMarkerCount={true}
                />
            )}

            {/* Map Container */}
            <div className="map-layout__container">
                <MapContainer
                    ref={mapRef}
                    center={[mapState.center.lat, mapState.center.lng]}
                    zoom={mapState.zoom}
                    maxZoom={maxZoom}
                    minZoom={minZoom}
                    className="map-layout__map"
                    zoomControl={false} // We'll use custom controls
                    attributionControl={true}
                    scrollWheelZoom={true}
                    dragging={true}
                    tap={true}
                    touchZoom={true}
                    doubleClickZoom={true}
                    keyboard={true}
                >
                    {/* Tile Layer */}
                    <TileLayer
                        url={tileLayerUrl}
                        attribution={tileLayerAttribution}
                        maxZoom={maxZoom}
                        minZoom={minZoom}
                    />

                    {/* Map Event Handler */}
                    <MapEventsHandler
                        onBoundsChange={handleBoundsChange}
                        onLocationFound={handleLocationFound}
                        onMapClick={handleMapClickInternal}
                        onZoomChange={handleZoomChange}
                    />

                    {/* Future markers will be rendered here */}
                </MapContainer>
            </div>

            {/* Child Content Overlay */}
            {children && (
                <div className="map-layout__content">
                    {children}
                </div>
            )}

            {/* Development Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="map-layout__debug">
                    <div>Center: {mapState.center.lat.toFixed(4)}, {mapState.center.lng.toFixed(4)}</div>
                    <div>Zoom: {mapState.zoom}</div>
                    <div>Bounds: {mapState.bounds ? 'Set' : 'None'}</div>
                    <div>User Location: {userLocation ? 'Found' : 'None'}</div>
                    <div>Tracking: {isTrackingLocation ? 'Yes' : 'No'}</div>
                </div>
            )}
        </div>
    );
};

// =============================================================================
// PROP TYPES
// =============================================================================

MapLayout.propTypes = {
    children: PropTypes.node,
    defaultCenter: PropTypes.arrayOf(PropTypes.number),
    defaultZoom: PropTypes.number,
    className: PropTypes.string,
    showControls: PropTypes.bool,
    enableGeolocation: PropTypes.bool,
    onLocationSelect: PropTypes.func,
    onSearchResult: PropTypes.func,
    onMapReady: PropTypes.func,
    onMapClick: PropTypes.func,
    mapStyle: PropTypes.oneOf(['default', 'satellite', 'terrain', 'dark']),
    theme: PropTypes.oneOf(['light', 'dark']),
    maxZoom: PropTypes.number,
    minZoom: PropTypes.number
};

MapEventsHandler.propTypes = {
    onBoundsChange: PropTypes.func,
    onLocationFound: PropTypes.func,
    onMapClick: PropTypes.func,
    onZoomChange: PropTypes.func
};

export default MapLayout;