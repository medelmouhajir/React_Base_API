// =============================================================================
// FULLSCREEN MAP COMPONENT - Core map container with fullscreen layout
// =============================================================================
import React, { useRef, useEffect, useState, useCallback , forwardRef  } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
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

    const currentTileLayer = tileLayerConfig[tileLayer] || tileLayerConfig.openStreetMap;

    // Initialize map center based on user location
    const initialCenter = userLocation && !locationLoading && !locationError
        ? [userLocation.lat, userLocation.lng]
        : Array.isArray(center) ? center : [center.lat, center.lng];

    // Handle map creation
    const handleMapCreated = useCallback((map) => {
        setMapInstance(map);
        mapRef.current = map;

        // Set up progress tracking
        let tilesLoaded = 0;
        let tilesToLoad = 0;

        map.on('loading', () => {
            setLoadingProgress(0);
            tilesLoaded = 0;
            tilesToLoad = 0;
        });

        map.on('tileloadstart', () => {
            tilesToLoad++;
        });

        map.on('tileload', () => {
            tilesLoaded++;
            if (tilesToLoad > 0) {
                setLoadingProgress((tilesLoaded / tilesToLoad) * 100);
            }
        });

        map.on('load', () => {
            setIsMapLoaded(true);
            setLoadingProgress(100);
            handleMapReady(true);
            onMapReady(map);

            // Only set initial bounds after map is fully loaded
            const initialBounds = map.getBounds();
            const initialMapCenter = map.getCenter();
            const initialZoom = map.getZoom();

            if (initialBounds && initialMapCenter) {
                handleBoundsChange(
                    {
                        north: initialBounds.getNorth(),
                        south: initialBounds.getSouth(),
                        east: initialBounds.getEast(),
                        west: initialBounds.getWest()
                    },
                    { lat: initialMapCenter.lat, lng: initialMapCenter.lng },
                    initialZoom
                );
            }
        });

        // Set up map event handlers
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

        // Initial bounds setup
        //setTimeout(() => {
        //    const initialBounds = map.getBounds();
        //    const initialMapCenter = map.getCenter();
        //    const initialZoom = map.getZoom();

        //    handleBoundsChange(
        //        {
        //            north: initialBounds.getNorth(),
        //            south: initialBounds.getSouth(),
        //            east: initialBounds.getEast(),
        //            west: initialBounds.getWest()
        //        },
        //        { lat: initialMapCenter.lat, lng: initialMapCenter.lng },
        //        initialZoom
        //    );
        //}, 100);
    }, [handleBoundsChange, handleMoveStart, handleMapClick, handleMapReady, onMapReady]);

    // Set up bounds change callback for data fetching
    useEffect(() => {
        onBoundsChange((boundsData) => {
            if (boundsData.shouldFetch) {
                onDataRequest({
                    bounds: boundsData.bounds,
                    center: boundsData.center,
                    zoom: boundsData.zoom,
                    forceRefresh: boundsData.forceRefresh
                });
            }
        });
    }, [onBoundsChange, onDataRequest]);

    // Get user location on mount
    useEffect(() => {
        if (showUserLocation && !userLocation && !locationLoading) {
            getCurrentPosition();
        }
    }, [showUserLocation, userLocation, locationLoading, getCurrentPosition]);

    // Watch user position if enabled
    useEffect(() => {
        if (showUserLocation && mapReady) {
            watchPosition();
        }

        return () => {
            stopWatching();
        };
    }, [showUserLocation, mapReady, watchPosition, stopWatching]);

    // Mark data as fetched when new data arrives
    useEffect(() => {
        if (businesses.length > 0 || events.length > 0) {
            markDataFetched();
        }
    }, [businesses.length, events.length, markDataFetched]);

    // Handle marker interactions
    const handleMarkerSelect = useCallback((markerId, markerData, markerType) => {
        onMarkerSelect(markerId, markerData, markerType);
    }, [onMarkerSelect]);

    const handleMarkerHoverChange = useCallback((markerId, markerData, markerType) => {
        onMarkerHover(markerId, markerData, markerType);
    }, [onMarkerHover]);

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
                ref={mapRef}
                center={initialCenter}
                zoom={zoom}
                zoomControl={false}
                attributionControl={false}
                whenCreated={handleMapCreated}
                className="fullscreen-map__container"
                style={{ height: '100%', width: '100%' }}
            >
                {/* Tile Layer */}
                <TileLayer
                    url={currentTileLayer.url}
                    attribution={currentTileLayer.attribution}
                    maxZoom={MAP_CONFIG.MAX_ZOOM}
                    minZoom={MAP_CONFIG.MIN_ZOOM}
                />

                {/* Map Controller */}
                <MapController
                    mapInstance={mapInstance}
                    center={mapCenter}
                    zoom={mapZoom}
                    bounds={bounds}
                    userLocation={userLocation}
                    isMoving={isMoving}
                />

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
                        onMarkerSelect={handleMarkerSelect}
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