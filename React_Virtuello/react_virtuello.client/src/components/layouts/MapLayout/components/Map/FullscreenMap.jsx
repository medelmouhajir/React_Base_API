// =============================================================================
// FULLSCREEN MAP COMPONENT - Fixed version
// =============================================================================
import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useMapBounds } from '../../hooks/useMapBounds';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import MapController from './MapController';
import MapMarkerManager from './MapMarkerManager';
import { MAP_CONFIG } from '../../utils/mapConstants';
import 'leaflet/dist/leaflet.css';
import './FullscreenMap.css';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map initialization component
const MapInitializer = ({ onMapReady, onLoadingProgress }) => {
    const map = useMap();
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (!map || hasInitialized) return;

        console.log('🗺️ Map initializer started');

        let tilesLoaded = 0;
        let tilesToLoad = 0;
        let loadingTimer = null;
        let safetyTimer = null;

        const updateProgress = () => {
            const progress = tilesToLoad > 0 ? Math.min((tilesLoaded / tilesToLoad) * 100, 95) : 0;
            onLoadingProgress(progress);
            console.log(`🔄 Loading progress: ${progress.toFixed(1)}% (${tilesLoaded}/${tilesToLoad})`);
        };

        const completeInitialization = () => {
            if (hasInitialized) return;

            console.log('✅ Map initialization complete');
            setHasInitialized(true);
            onLoadingProgress(100);
            onMapReady(map);

            // Clear timers
            if (loadingTimer) clearTimeout(loadingTimer);
            if (safetyTimer) clearTimeout(safetyTimer);
        };

        // Set up event listeners
        const handleTileLoadStart = () => {
            tilesToLoad++;
            updateProgress();
        };

        const handleTileLoad = () => {
            tilesLoaded++;
            updateProgress();

            // If all tiles loaded, complete initialization
            if (tilesLoaded >= tilesToLoad && tilesToLoad > 0) {
                setTimeout(completeInitialization, 100);
            }
        };

        const handleTileError = (e) => {
            console.warn('⚠️ Tile load error:', e);
            tilesLoaded++; // Count errors as loaded to not block progress
            updateProgress();
        };

        const handleMapLoad = () => {
            console.log('🎯 Map load event fired');
            setTimeout(completeInitialization, 100);
        };

        // Add event listeners
        map.on('tileloadstart', handleTileLoadStart);
        map.on('tileload', handleTileLoad);
        map.on('tileerror', handleTileError);
        map.on('load', handleMapLoad);

        // Safety timeout - force completion after 8 seconds
        safetyTimer = setTimeout(() => {
            console.log('⏰ Safety timeout - forcing map completion');
            completeInitialization();
        }, 8000);

        // Initial load timeout - if no tiles start loading within 2 seconds
        loadingTimer = setTimeout(() => {
            if (tilesToLoad === 0) {
                console.log('🚀 No tiles detected - completing initialization');
                completeInitialization();
            }
        }, 2000);

        // Try to trigger initial load
        setTimeout(() => {
            if (map.isLoaded && map.isLoaded()) {
                console.log('🎯 Map already loaded - completing initialization');
                completeInitialization();
            } else {
                console.log('🔄 Map not yet loaded, waiting for events...');
            }
        }, 100);

        return () => {
            map.off('tileloadstart', handleTileLoadStart);
            map.off('tileload', handleTileLoad);
            map.off('tileerror', handleTileError);
            map.off('load', handleMapLoad);

            if (loadingTimer) clearTimeout(loadingTimer);
            if (safetyTimer) clearTimeout(safetyTimer);
        };
    }, [map, onMapReady, onLoadingProgress, hasInitialized]);

    return null;
};

const FullscreenMap = forwardRef(({
    businesses = [],
    events = [],
    center = MAP_CONFIG.DEFAULT_CENTER,
    zoom = MAP_CONFIG.DEFAULT_ZOOM,
    onMapReady = () => { },
    onDataRequest = () => { },
    onMarkerSelect = () => { },
    onMarkerHover = () => { },
    clustering = true,
    showUserLocation = true,
    tileLayer = 'openStreetMap',
    className = '',
    style = {}
}, ref) => {
    const { t } = useTranslation();
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Hooks for map functionality
    const {
        location: userLocation,
        loading: locationLoading,
        error: locationError,
        getCurrentPosition,
        watchPosition,
        stopWatching
    } = useGeolocation({
        enableHighAccuracy: true,
        fallback: MAP_CONFIG.DEFAULT_CENTER
    });

    const {
        bounds,
        center: mapCenter,
        zoom: mapZoom,
        isMoving,
        handleBoundsChange,
        handleMoveStart,
        onBoundsChange,
        markDataFetched,
        shouldFetchData
    } = useMapBounds({
        minZoomForFetch: MAP_CONFIG.MIN_ZOOM_FOR_DATA,
        debounceMs: 500
    });

    const {
        selectedMarker,
        hoveredMarker,
        showMarkers,
        mapReady,
        handleBusinessClick,
        handleBusinessHover,
        handleEventClick,
        handleEventHover,
        handleMapClick,
        handleMapReady
    } = useMapInteractions();

    // Map tiles configuration
    const tileLayerConfig = {
        openStreetMap: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        cartoDB: {
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
    };

    React.useImperativeHandle(ref, () => ({
        getMap: () => mapInstance,
        flyTo: (center, zoom) => {
            if (mapInstance) {
                const target = Array.isArray(center) ? center : [center.lat, center.lng];
                mapInstance.flyTo(target, zoom);
            }
        },
        // Add other methods you need
    }), [mapInstance]);

    const currentTileLayer = tileLayerConfig[tileLayer] || tileLayerConfig.openStreetMap;

    // Initialize map center based on user location
    const initialCenter = userLocation && !locationLoading && !locationError
        ? [userLocation.lat, userLocation.lng]
        : Array.isArray(center) ? center : [center.lat, center.lng];

    // Handle map ready
    const handleMapReadyCallback = useCallback((map) => {
        console.log('🗺️ Map ready callback triggered');
        setMapInstance(map);
        mapRef.current = map;
        setIsMapLoaded(true);
        handleMapReady(true);
        onMapReady(map);

        // Set up additional map event handlers
        map.on('movestart', handleMoveStart);
        map.on('moveend', () => {
            const newBounds = map.getBounds();
            const newCenter = map.getCenter();
            const newZoom = map.getZoom();

            handleBoundsChange(
                {
                    north: newBounds.getNorth(),
                    south: newBounds.getSouth(),
                    east: newBounds.getEast(),
                    west: newBounds.getWest()
                },
                { lat: newCenter.lat, lng: newCenter.lng },
                newZoom
            );
        });

        map.on('click', handleMapClick);
    }, [onMapReady, handleMapReady, handleMoveStart, handleBoundsChange, handleMapClick]);

    // Handle loading progress
    const handleLoadingProgressCallback = useCallback((progress) => {
        setLoadingProgress(progress);
    }, []);

    // Handle marker interactions
    const handleMarkerSelectChange = useCallback((markerId, markerData, markerType) => {
        onMarkerSelect(markerId, markerData, markerType);
    }, [onMarkerSelect]);

    const handleMarkerHoverChange = useCallback((markerId, markerData, markerType) => {
        onMarkerHover(markerId, markerData, markerType);
    }, [onMarkerHover]);

    // Set loading progress based on geolocation
    useEffect(() => {
        if (locationLoading) {
            setLoadingProgress(30);
        } else if (userLocation || locationError) {
            setLoadingProgress(50);
        }
    }, [locationLoading, userLocation, locationError]);

    return (
        <div ref={ref} className={`fullscreen-map ${className}`} style={style}>
            {/* Loading Overlay */}
            {!isMapLoaded && (
                <div className="fullscreen-map__loading">
                    <div className="fullscreen-map__loading-content">
                        <div className="fullscreen-map__loading-spinner">
                            <svg width="48" height="48" viewBox="0 0 24 24">
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeDasharray="32"
                                    strokeDashoffset="32"
                                >
                                    <animate
                                        attributeName="strokeDashoffset"
                                        dur="1s"
                                        values="32;0"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </svg>
                        </div>
                        <div className="fullscreen-map__loading-text">
                            {locationLoading
                                ? t('map.getting_location', 'Getting your location...')
                                : t('map.loading_map', 'Loading map...')
                            }
                        </div>
                        {loadingProgress > 0 && loadingProgress < 100 && (
                            <div className="fullscreen-map__loading-progress">
                                <div
                                    className="fullscreen-map__loading-progress-bar"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Map Container */}
            <MapContainer
                center={initialCenter}
                zoom={zoom}
                zoomControl={false}
                attributionControl={false}
                className="fullscreen-map__container"
                style={{ height: '100%', width: '100%' }}
            >
                {/* Map Initializer */}
                <MapInitializer
                    onMapReady={handleMapReadyCallback}
                    onLoadingProgress={handleLoadingProgressCallback}
                />

                {/* Tile Layer */}
                <TileLayer
                    url={currentTileLayer.url}
                    attribution={currentTileLayer.attribution}
                    maxZoom={MAP_CONFIG.MAX_ZOOM}
                    minZoom={MAP_CONFIG.MIN_ZOOM}
                />

                {/* Map Controller */}
                {mapInstance && (
                    <MapController
                        mapInstance={mapInstance}
                        center={mapCenter}
                        zoom={mapZoom}
                        bounds={bounds}
                        userLocation={userLocation}
                        isMoving={isMoving}
                    />
                )}

                {/* Marker Manager */}
                {mapReady && showMarkers && (
                    <MapMarkerManager
                        businesses={businesses}
                        events={events}
                        userLocation={userLocation}
                        selectedMarker={selectedMarker}
                        hoveredMarker={hoveredMarker}
                        onBusinessClick={handleBusinessClick}
                        onBusinessHover={handleBusinessHover}
                        onEventClick={handleEventClick}
                        onEventHover={handleEventHover}
                        onMarkerSelect={handleMarkerSelectChange}
                        onMarkerHover={handleMarkerHoverChange}
                        clustering={clustering}
                        zoom={mapZoom}
                        bounds={bounds}
                    />
                )}
            </MapContainer>

            {/* Error Display */}
            {locationError && showUserLocation && (
                <div className="fullscreen-map__error">
                    <button
                        className="fullscreen-map__error-retry"
                        onClick={() => getCurrentPosition(true)}
                        title={t('map.retry_location', 'Retry getting location')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
});

FullscreenMap.displayName = 'FullscreenMap';

export default FullscreenMap;