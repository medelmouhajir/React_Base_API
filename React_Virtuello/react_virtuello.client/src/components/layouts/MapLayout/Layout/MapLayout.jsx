/**
 * MapLayout - Main map container component with Leaflet integration
 * Provides the foundation for displaying businesses, events, and interactive map features
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import MapControls from '../Controls/MapControls';
import geolocationService from '../Services/GeolocationService';
import mapService from '../../../../services/mapService';
import './MapLayout.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Map Events Handler - Handles map interactions and updates
 */
const MapEventsHandler = ({ onBoundsChange, onLocationFound, isTrackingLocation }) => {
    const map = useMapEvents({
        moveend: () => {
            const bounds = map.getBounds();
            const center = map.getCenter();
            const zoom = map.getZoom();

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
        },

        locationfound: (e) => {
            onLocationFound({
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                accuracy: e.accuracy
            });
        },

        locationerror: (e) => {
            console.warn('[MapLayout] Location error:', e.message);
        }
    });

    // Handle location tracking
    useEffect(() => {
        if (isTrackingLocation) {
            map.locate({
                watch: true,
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 15000
            });
        } else {
            map.stopLocate();
        }
    }, [isTrackingLocation, map]);

    return null;
};

/**
 * Map Controller - Handles programmatic map control
 */
const MapController = ({ center, zoom, fitToBounds }) => {
    const map = useMap();

    useEffect(() => {
        if (fitToBounds) {
            map.fitBounds(fitToBounds, { padding: [20, 20] });
        } else if (center) {
            map.setView([center.lat, center.lng], zoom || map.getZoom());
        }
    }, [map, center, zoom, fitToBounds]);

    return null;
};

/**
 * Main MapLayout Component
 */
const MapLayout = ({
    children,
    defaultCenter = [34.0522, -6.7736], // Fes, Morocco
    defaultZoom = 13,
    className = '',
    showControls = true,
    enableGeolocation = true,
    onLocationSelect,
    onSearchResult,
    onMapReady,
    // Props for future data integration
    businesses = [],
    events = [],
    routes = [],
    markers = [],
    // Map styling options
    mapStyle = 'default',
    theme = 'light'
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const mapRef = useRef(null);
    const [mapState, setMapState] = useState({
        center: { lat: defaultCenter[0], lng: defaultCenter[1] },
        zoom: defaultZoom,
        bounds: null,
        isReady: false
    });

    const [userLocation, setUserLocation] = useState(null);
    const [isTrackingLocation, setIsTrackingLocation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState({
        showBusinesses: true,
        showEvents: true,
        showRoutes: false,
        categories: [],
        tags: [],
        dateRange: null
    });

    // =============================================================================
    // MAP EVENT HANDLERS
    // =============================================================================

    const handleBoundsChange = useCallback((mapData) => {
        setMapState(prev => ({
            ...prev,
            bounds: mapData.bounds,
            center: mapData.center,
            zoom: mapData.zoom
        }));

        // TODO: Trigger data fetching based on new bounds
        // fetchMapData(mapData.bounds, activeFilters);
    }, [activeFilters]);

    const handleLocationFound = useCallback((location) => {
        setUserLocation(location);
        onLocationSelect?.(location);
    }, [onLocationSelect]);

    const handleMapReady = useCallback(() => {
        setMapState(prev => ({ ...prev, isReady: true }));
        onMapReady?.(mapRef.current);
    }, [onMapReady]);

    // =============================================================================
    // GEOLOCATION FUNCTIONS
    // =============================================================================

    const handleGetCurrentLocation = useCallback(async () => {
        if (!enableGeolocation) return;

        setIsLoading(true);
        setError(null);

        try {
            const position = await geolocationService.getCurrentPosition();
            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };

            setUserLocation(location);
            setMapState(prev => ({
                ...prev,
                center: location,
                zoom: Math.max(prev.zoom, 15)
            }));

            onLocationSelect?.(location);
        } catch (err) {
            setError(`Location error: ${err.message}`);
            console.error('[MapLayout] Geolocation error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [enableGeolocation, onLocationSelect]);

    const handleToggleLocationTracking = useCallback(() => {
        setIsTrackingLocation(prev => !prev);
    }, []);

    // =============================================================================
    // SEARCH FUNCTIONS
    // =============================================================================

    const handleSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchQuery('');
            return;
        }

        setSearchQuery(query);
        setIsLoading(true);
        setError(null);

        try {
            // TODO: Implement search functionality
            // const results = await mapService.searchLocations(query);
            // onSearchResult?.(results);

            // For now, just update search query
            console.log('[MapLayout] Search query:', query);
            onSearchResult?.({ query, results: [] });
        } catch (err) {
            setError(`Search error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [onSearchResult]);

    // =============================================================================
    // FILTER FUNCTIONS
    // =============================================================================

    const handleFilterChange = useCallback((newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));

        // TODO: Trigger data refetch with new filters
        // if (mapState.bounds) {
        //     fetchMapData(mapState.bounds, { ...activeFilters, ...newFilters });
        // }
    }, [mapState.bounds, activeFilters]);

    // =============================================================================
    // DATA FETCHING (PLACEHOLDER FOR FUTURE IMPLEMENTATION)
    // =============================================================================

    const fetchMapData = useCallback(async (bounds, filters) => {
        // TODO: Implement data fetching logic
        // setIsLoading(true);
        // try {
        //     const data = await mapService.getMapDataInBounds({
        //         bounds,
        //         filters,
        //         signal: abortController.signal
        //     });
        //     
        //     // Update markers, businesses, events state
        //     setBusinesses(data.businesses);
        //     setEvents(data.events);
        // } catch (err) {
        //     if (err.name !== 'AbortError') {
        //         setError(err.message);
        //     }
        // } finally {
        //     setIsLoading(false);
        // }

        console.log('[MapLayout] TODO: Fetch data for bounds:', bounds, 'with filters:', filters);
    }, []);

    // =============================================================================
    // TILE LAYER CONFIGURATION
    // =============================================================================

    const getTileLayerUrl = () => {
        switch (mapStyle) {
            case 'satellite':
                return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            case 'terrain':
                return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
            case 'dark':
                return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            default:
                return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        }
    };

    const getTileLayerAttribution = () => {
        switch (mapStyle) {
            case 'satellite':
                return '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
            case 'terrain':
                return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
            case 'dark':
                return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
            default:
                return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        }
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <div className={`map-layout ${className} map-layout--${theme}`}>
            {/* Error Display */}
            {error && (
                <div className="map-layout__error">
                    <span className="map-layout__error-message">{error}</span>
                    <button
                        className="map-layout__error-close"
                        onClick={() => setError(null)}
                        aria-label="Close error message"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="map-layout__loading">
                    <div className="map-layout__loading-spinner"></div>
                    <span className="map-layout__loading-text">Loading map data...</span>
                </div>
            )}

            {/* Map Controls */}
            {showControls && (
                <MapControls
                    searchQuery={searchQuery}
                    onSearch={handleSearch}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onGetLocation={handleGetCurrentLocation}
                    onToggleTracking={handleToggleLocationTracking}
                    isTrackingLocation={isTrackingLocation}
                    userLocation={userLocation}
                    isLoading={isLoading}
                    mapStyle={mapStyle}
                    theme={theme}
                />
            )}

            {/* Main Map Container */}
            <div className="map-layout__container">
                <MapContainer
                    ref={mapRef}
                    center={[mapState.center.lat, mapState.center.lng]}
                    zoom={mapState.zoom}
                    className="map-layout__map"
                    whenReady={handleMapReady}
                    zoomControl={false} // We'll add custom zoom controls
                >
                    {/* Tile Layer */}
                    <TileLayer
                        url={getTileLayerUrl()}
                        attribution={getTileLayerAttribution()}
                        maxZoom={19}
                        minZoom={3}
                    />

                    {/* Map Event Handlers */}
                    <MapEventsHandler
                        onBoundsChange={handleBoundsChange}
                        onLocationFound={handleLocationFound}
                        isTrackingLocation={isTrackingLocation}
                    />

                    {/* Map Controller */}
                    <MapController
                        center={mapState.center}
                        zoom={mapState.zoom}
                        fitToBounds={null} // TODO: Calculate from markers
                    />

                    {/* TODO: Add Markers and Data Layers */}
                    {/* 
                    <BusinessMarkers businesses={businesses} />
                    <EventMarkers events={events} />
                    <RouteMarkers routes={routes} />
                    <CustomMarkers markers={markers} />
                    
                    {userLocation && (
                        <UserLocationMarker 
                            position={userLocation}
                            accuracy={userLocation.accuracy}
                        />
                    )}
                    */}
                </MapContainer>
            </div>

            {/* Child Content Overlay */}
            {children && (
                <div className="map-layout__content">
                    {children}
                </div>
            )}

            {/* Map Stats (Development Info) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="map-layout__debug">
                    <div>Center: {mapState.center.lat.toFixed(4)}, {mapState.center.lng.toFixed(4)}</div>
                    <div>Zoom: {mapState.zoom}</div>
                    <div>Bounds: {mapState.bounds ? 'Set' : 'None'}</div>
                    <div>Businesses: {businesses.length}</div>
                    <div>Events: {events.length}</div>
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
    // Data props (for future use)
    businesses: PropTypes.array,
    events: PropTypes.array,
    routes: PropTypes.array,
    markers: PropTypes.array,
    // Styling props
    mapStyle: PropTypes.oneOf(['default', 'satellite', 'terrain', 'dark']),
    theme: PropTypes.oneOf(['light', 'dark'])
};

MapEventsHandler.propTypes = {
    onBoundsChange: PropTypes.func.isRequired,
    onLocationFound: PropTypes.func.isRequired,
    isTrackingLocation: PropTypes.bool.isRequired
};

MapController.propTypes = {
    center: PropTypes.object,
    zoom: PropTypes.number,
    fitToBounds: PropTypes.array
};

export default MapLayout;