/**
 * MapLayout - Main map container component with Leaflet integration
 * Provides the foundation for displaying businesses, events, and interactive map features
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';

// Components
import MapControls from '../Controls/MapControls';
import BusinessMarker from '../Markers/BusinessMarker';
import EventMarker from '../Markers/EventMarker';
import CustomMarker from '../Markers/CustomMarker';

// Services and Hooks
import geolocationService from '../Services/GeolocationService';
import mapService from '../Services/MapService';
import { useMapBounds } from '../Hooks/useMapBounds';
import { useMarkers } from '../Hooks/useMarkers';

// Utils and Config
import { DEFAULT_MAP_CONFIG, TILE_LAYERS } from '../Config/mapConfig';
import { createBoundsFromRadius } from '../Utils/mapUtils';

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
    onZoomChange,
    isTrackingLocation
}) => {
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

        zoomend: () => {
            const zoom = map.getZoom();
            onZoomChange(zoom);
        },

        click: (e) => {
            onMapClick({
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                originalEvent: e.originalEvent
            });
        },

        locationfound: (e) => {
            onLocationFound({
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                accuracy: e.accuracy,
                timestamp: e.timestamp
            });
        },

        locationerror: (e) => {
            console.error('[MapLayout] Location error:', e.message);
        }
    });

    // Auto-request location if tracking is enabled
    useEffect(() => {
        if (isTrackingLocation && map) {
            map.locate({
                watch: true,
                enableHighAccuracy: true,
                maximumAge: 60000,
                timeout: 10000
            });
        } else if (map) {
            map.stopLocate();
        }

        return () => {
            if (map) {
                map.stopLocate();
            }
        };
    }, [isTrackingLocation, map]);

    return null;
};

/**
 * Map Controller - Handles programmatic map updates
 */
const MapController = ({ center, zoom, fitToBounds, userLocation }) => {
    const map = useMap();

    // Update map center and zoom
    useEffect(() => {
        if (map && center && zoom) {
            const currentCenter = map.getCenter();
            const currentZoom = map.getZoom();

            const centerChanged = Math.abs(currentCenter.lat - center.lat) > 0.001 ||
                Math.abs(currentCenter.lng - center.lng) > 0.001;
            const zoomChanged = currentZoom !== zoom;

            if (centerChanged || zoomChanged) {
                map.setView([center.lat, center.lng], zoom);
            }
        }
    }, [map, center, zoom]);

    // Fit to bounds when specified
    useEffect(() => {
        if (map && fitToBounds && Array.isArray(fitToBounds) && fitToBounds.length > 0) {
            const bounds = L.latLngBounds(fitToBounds);
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [map, fitToBounds]);

    // Update user location marker
    useEffect(() => {
        if (map && userLocation) {
            // Remove existing user location marker
            map.eachLayer((layer) => {
                if (layer.options && layer.options.isUserLocation) {
                    map.removeLayer(layer);
                }
            });

            // Add new user location marker
            const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
                radius: 8,
                fillColor: '#007bff',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
                isUserLocation: true
            }).addTo(map);

            // Add accuracy circle if available
            if (userLocation.accuracy) {
                const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
                    radius: userLocation.accuracy,
                    fillColor: '#007bff',
                    color: '#007bff',
                    weight: 1,
                    opacity: 0.3,
                    fillOpacity: 0.1,
                    isUserLocation: true
                }).addTo(map);
            }
        }
    }, [map, userLocation]);

    return null;
};

// =============================================================================
// MAIN MAP LAYOUT COMPONENT
// =============================================================================

const MapLayout = ({
    children,
    defaultCenter = [34.0522, -6.7736], // Fes, Morocco
    defaultZoom = 13,
    className = '',
    showControls = true,
    enableGeolocation = true,
    onLocationSelect = null,
    onSearchResult = null,
    onMapReady = null,
    onMapClick = null,
    // Data props
    businesses = [],
    events = [],
    routes = [],
    markers = [],
    // Map configuration
    mapStyle = 'default',
    theme = 'light',
    enableClustering = true,
    maxZoom = 19,
    minZoom = 3,
    // Filter and interaction props
    filters = {},
    selectedMarkerId = null,
    hoveredMarkerId = null,
    onMarkerClick = null,
    onMarkerHover = null
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [mapInstance, setMapInstance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [isTrackingLocation, setIsTrackingLocation] = useState(false);

    const [mapState, setMapState] = useState({
        center: { lat: defaultCenter[0], lng: defaultCenter[1] },
        zoom: defaultZoom,
        bounds: null
    });

    // =============================================================================
    // HOOKS
    // =============================================================================

    // Map bounds management
    const {
        bounds,
        center,
        zoom,
        updateBounds,
        getBoundsForAPI,
        isInBounds
    } = useMapBounds(mapInstance, {
        onBoundsChange: handleDataFetch,
        autoFetch: true,
        debounceDelay: 500
    });


    // Marker event handlers must be defined before useMarkers
    const handleMarkerClick = useCallback((marker, event) => {
        if (onMarkerClick) {
            onMarkerClick(marker, event);
        }
    }, [onMarkerClick]);

    const handleMarkerHover = useCallback((marker, event) => {
        if (onMarkerHover) {
            onMarkerHover(marker, event);
        }
    }, [onMarkerHover]);

    // Markers management
    const {
        filteredMarkers,
        markerStats,
        updateBusinessMarkers,
        updateEventMarkers,
        addCustomMarkers,
        clearMarkers,
        getMarkerById,
        getMarkersInBounds,
        setFilters
    } = useMarkers(mapInstance, {
        enableClustering,
        onMarkerClick: handleMarkerClick,
        onMarkerHover: handleMarkerHover,
        filterConfig: filters
    });

    // =============================================================================
    // DATA FETCHING
    // =============================================================================

    /**
     * Fetch map data based on current bounds
     */
    async function handleDataFetch(boundsData) {
        if (!boundsData?.bounds || !mapInstance) return;

        setIsLoading(true);
        setError(null);

        try {
            const apiBounds = getBoundsForAPI(boundsData.bounds);

            // Fetch businesses and events in parallel
            const [businessesData, eventsData] = await Promise.allSettled([
                mapService.getBusinessesInBounds({ bounds: apiBounds, filters }),
                mapService.getEventsInBounds({ bounds: apiBounds, filters })
            ]);

            // Update businesses
            if (businessesData.status === 'fulfilled' && businessesData.value?.success) {
                updateBusinessMarkers(businessesData.value.data || []);
            }

            // Update events
            if (eventsData.status === 'fulfilled' && eventsData.value?.success) {
                updateEventMarkers(eventsData.value.data || []);
            }

            // Handle errors
            const errors = [];
            if (businessesData.status === 'rejected') {
                errors.push(`Businesses: ${businessesData.reason.message}`);
            }
            if (eventsData.status === 'rejected') {
                errors.push(`Events: ${eventsData.reason.message}`);
            }

            if (errors.length > 0) {
                setError(errors.join(', '));
            }

        } catch (error) {
            console.error('[MapLayout] Data fetch error:', error);
            setError(error.message || 'Failed to load map data');
        } finally {
            setIsLoading(false);
        }
    }

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

        updateBounds(boundsData);
    }, [updateBounds]);

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
    }, []);

    /**
     * Handle layer toggle
     */
    const handleLayerToggle = useCallback((layerType, enabled) => {
        // Update layer visibility logic here
        console.log(`[MapLayout] Toggle layer ${layerType}:`, enabled);
    }, []);

    /**
     * Handle filter changes
     */
    const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
    }, [setFilters]);

    // =============================================================================
    // COMPUTED VALUES
    // =============================================================================

    /**
     * Get tile layer configuration
     */
    const tileLayerConfig = useMemo(() => {
        return TILE_LAYERS[mapStyle] || TILE_LAYERS.openStreetMap;
    }, [mapStyle]);

    /**
     * Get tile layer attribution
     */
    const getTileLayerAttribution = useCallback(() => {
        return tileLayerConfig.attribution;
    }, [tileLayerConfig]);

    /**
     * Get component classes
     */
    const componentClasses = useMemo(() => {
        return [
            'map-layout',
            `map-layout--${theme}`,
            mapStyle !== 'default' && `map-layout--${mapStyle}`,
            isLoading && 'map-layout--loading',
            error && 'map-layout--error',
            className
        ].filter(Boolean).join(' ');
    }, [theme, mapStyle, isLoading, error, className]);

    // =============================================================================
    // EFFECTS
    // =============================================================================

    // Update filters when props change
    useEffect(() => {
        setFilters(filters);
    }, [filters, setFilters]);

    // Handle prop-based data updates
    useEffect(() => {
        if (businesses.length > 0) {
            updateBusinessMarkers(businesses);
        }
    }, [businesses, updateBusinessMarkers]);

    useEffect(() => {
        if (events.length > 0) {
            updateEventMarkers(events);
        }
    }, [events, updateEventMarkers]);

    useEffect(() => {
        if (markers.length > 0) {
            addCustomMarkers(markers);
        }
    }, [markers, addCustomMarkers]);

    // Call onMapReady when map is initialized
    useEffect(() => {
        if (mapInstance && onMapReady) {
            onMapReady(mapInstance);
        }
    }, [mapInstance, onMapReady]);

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <div className={componentClasses}>
            {/* Map Controls */}
            {showControls && (
                <MapControls
                    onSearch={handleSearchResult}
                    onLocationToggle={handleLocationToggle}
                    onLayerToggle={handleLayerToggle}
                    onFilterChange={handleFilterChange}
                    isLocationTracking={isTrackingLocation}
                    userLocation={userLocation}
                    mapBounds={mapState.bounds}
                    markerStats={markerStats}
                    className="map-layout__controls"
                    theme={theme}
                />
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="map-layout__loading">
                    <div className="map-layout__spinner"></div>
                    <span>Loading map data...</span>
                </div>
            )}

            {/* Error Overlay */}
            {error && (
                <div className="map-layout__error">
                    <div className="map-layout__error-content">
                        <h3>Unable to load map data</h3>
                        <p>{error}</p>
                        <button
                            onClick={() => handleDataFetch({ bounds: mapState.bounds })}
                            className="map-layout__retry-button"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div className="map-layout__map">
                <MapContainer
                    center={[mapState.center.lat, mapState.center.lng]}
                    zoom={mapState.zoom}
                    style={{ height: '100%', width: '100%' }}
                    maxZoom={maxZoom}
                    minZoom={minZoom}
                    whenReady={(mapEvent) => setMapInstance(mapEvent.target)}
                    zoomControl={false} // Custom zoom control
                    attributionControl={true}
                >
                    {/* Tile Layer */}
                    <TileLayer
                        url={tileLayerConfig.url}
                        attribution={getTileLayerAttribution()}
                        maxZoom={maxZoom}
                        minZoom={minZoom}
                    />

                    {/* Map Event Handlers */}
                    <MapEventsHandler
                        onBoundsChange={handleBoundsChange}
                        onLocationFound={handleLocationFound}
                        onMapClick={handleMapClickInternal}
                        onZoomChange={handleZoomChange}
                        isTrackingLocation={isTrackingLocation}
                    />

                    {/* Map Controller */}
                    <MapController
                        center={mapState.center}
                        zoom={mapState.zoom}
                        userLocation={userLocation}
                        fitToBounds={null} // TODO: Calculate from markers when needed
                    />

                    {/* Business Markers */}
                    {filteredMarkers.businesses?.map(marker => (
                        <BusinessMarker
                            key={marker.id}
                            marker={marker}
                            isSelected={selectedMarkerId === marker.id}
                            isHovered={hoveredMarkerId === marker.id}
                            onClick={handleMarkerClick}
                            onHover={handleMarkerHover}
                        />
                    ))}

                    {/* Event Markers */}
                    {filteredMarkers.events?.map(marker => (
                        <EventMarker
                            key={marker.id}
                            marker={marker}
                            isSelected={selectedMarkerId === marker.id}
                            isHovered={hoveredMarkerId === marker.id}
                            onClick={handleMarkerClick}
                            onHover={handleMarkerHover}
                        />
                    ))}

                    {/* Custom Markers */}
                    {filteredMarkers.custom?.map(marker => (
                        <CustomMarker
                            key={marker.id}
                            marker={marker}
                            isSelected={selectedMarkerId === marker.id}
                            isHovered={hoveredMarkerId === marker.id}
                            onClick={handleMarkerClick}
                            onHover={handleMarkerHover}
                        />
                    ))}
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
                    <div>Businesses: {filteredMarkers.businesses?.length || 0}</div>
                    <div>Events: {filteredMarkers.events?.length || 0}</div>
                    <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                    <div>Error: {error ? 'Yes' : 'No'}</div>
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
    // Data props
    businesses: PropTypes.array,
    events: PropTypes.array,
    routes: PropTypes.array,
    markers: PropTypes.array,
    // Styling props
    mapStyle: PropTypes.oneOf(['default', 'satellite', 'terrain', 'dark']),
    theme: PropTypes.oneOf(['light', 'dark']),
    enableClustering: PropTypes.bool,
    maxZoom: PropTypes.number,
    minZoom: PropTypes.number,
    // Filter and interaction props
    filters: PropTypes.object,
    selectedMarkerId: PropTypes.string,
    hoveredMarkerId: PropTypes.string,
    onMarkerClick: PropTypes.func,
    onMarkerHover: PropTypes.func
};

MapEventsHandler.propTypes = {
    onBoundsChange: PropTypes.func.isRequired,
    onLocationFound: PropTypes.func.isRequired,
    onMapClick: PropTypes.func,
    onZoomChange: PropTypes.func,
    isTrackingLocation: PropTypes.bool.isRequired
};

MapController.propTypes = {
    center: PropTypes.object,
    zoom: PropTypes.number,
    fitToBounds: PropTypes.array,
    userLocation: PropTypes.object
};

export default MapLayout;