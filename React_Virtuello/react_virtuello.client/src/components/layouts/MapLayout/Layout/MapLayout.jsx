// =============================================================================
// MAP LAYOUT COMPONENT - Modern fullscreen map layout with floating UI
// =============================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import { useMapFilters } from '../../../../hooks/useMapFilters';
import { useGeolocation } from '../hooks/useGeolocation';
import { useMapBounds } from '../hooks/useMapBounds';
import { useMapInteractions } from '../hooks/useMapInteractions';

// Map Components
import FullscreenMap from '../components/Map/FullscreenMap';
import MapController from '../components/Map/MapController';
import MapMarkerManager from '../components/Map/MapMarkerManager';

// Floating UI Components
import FloatingSearch from '../components/FloatingUI/FloatingSearch';
import FloatingProfile from '../components/FloatingUI/FloatingProfile';
import FloatingControls from '../components/FloatingUI/FloatingControls';
import FloatingFilters from '../components/FloatingUI/FloatingFilters';

// Panel Components
import ResultsPanel from '../components/Panels/ResultsPanel';
import DetailsPanel from '../components/Panels/DetailsPanel';
import FiltersPanel from '../components/Panels/FiltersPanel';

// Services
import { mapDataService } from '../services/mapDataService';
import { locationService } from '../services/locationService';
import { mapCacheService } from '../services/mapCacheService';

// Utils
import { MAP_CONFIG } from '../utils/mapConstants';
import * as geoUtils from '../utils/geoUtils';

import './MapLayout.css';

const MapLayout = ({
    // Configuration
    showSearch = true,
    showProfile = true,
    showControls = true,
    showFilters = false,
    showBusinesses = true,
    showEvents = true,
    clustering = true,
    tileLayer = 'openStreetMap',

    // Initial state
    initialCenter = MAP_CONFIG.DEFAULT_CENTER,
    initialZoom = MAP_CONFIG.DEFAULT_ZOOM,

    // API configuration
    apiBaseUrl = import.meta.env.VITE_API_URL || '',

    // Event handlers
    onBusinessSelect,
    onEventSelect,
    onLocationSelect,

    // Custom styling
    className = '',
    style = {},

    // Feature flags
    enableVoiceSearch = true,
    enableLocationTracking = true,
    enableOfflineMode = false,
    enablePushNotifications = false
}) => {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    // Refs
    const mapRef = useRef(null);
    const searchRef = useRef(null);

    // Loading states
    const [isInitializing, setIsInitializing] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);
    const [mapReady, setMapReady] = useState(false);

    // UI States
    const [showResultsPanel, setShowResultsPanel] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentLayer, setCurrentLayer] = useState(tileLayer);

    // Map data and filters
    const {
        // Data
        businesses,
        events,
        tags,
        categories,
        loading: dataLoading,
        error: dataError,

        // Filtered data
        filteredBusinesses,
        filteredEvents,
        availableTags,
        availableCategories,

        // Filter states
        selectedTags,
        selectedCategories,
        searchQuery,
        mapBounds,
        centerLocation,
        radiusKm,

        // Actions
        loadAllData,
        refreshData,
        selectTag,
        deselectTag,
        selectCategory,
        deselectCategory,
        updateSearchQuery,
        updateMapBounds,
        updateCenterLocation,
        clearAllFilters,

        // Summary
        filterSummary
    } = useMapFilters();

    // Geolocation hook
    const {
        location: userLocation,
        loading: locationLoading,
        error: locationError,
        getCurrentPosition,
        watchPosition,
        stopWatching
    } = useGeolocation({
        enableHighAccuracy: true,
        fallback: initialCenter,
        enableTracking: enableLocationTracking
    });

    // Map bounds hook
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

    // Map interactions hook
    const {
        selectedMarker,
        hoveredMarker,
        handleMarkerSelect,
        handleMarkerHover,
        handleMapClick,
        resetSelection
    } = useMapInteractions();

    // =============================================================================
    // INITIALIZATION & LIFECYCLE
    // =============================================================================

    // Initialize the map layout
    useEffect(() => {
        const initializeLayout = async () => {
            try {
                setLoadingProgress(10);
                setError(null);

                // Check geolocation permissions and get initial location
                if (enableLocationTracking && !userLocation) {
                    setLoadingProgress(30);
                    await getCurrentPosition();
                }

                setLoadingProgress(50);

                // Initialize map cache
                if (enableOfflineMode) {
                    await mapCacheService.initialize();
                }

                setLoadingProgress(70);

                // Load initial map data based on location or default area
                const initialCenter2 = userLocation || initialCenter;
                await handleInitialDataLoad(initialCenter2);

                setLoadingProgress(90);

                // Setup push notifications if enabled
                if (enablePushNotifications && isAuthenticated) {
                    await setupPushNotifications();
                }

                setLoadingProgress(100);
                setIsInitializing(false);

                // QUICK FIX: Force map ready after a delay if it's still not ready
                setTimeout(() => {
                    if (!mapReady) {
                        console.log('Force setting map ready - fallback');
                        setMapReady(true);
                    }
                }, 3000);

            } catch (err) {
                console.error('Map initialization error:', err);
                setError(err.message);
                setIsInitializing(false);

                // Even on error, set map ready to show the interface
                setTimeout(() => {
                    setMapReady(true);
                }, 1000);
            }
        };

        initializeLayout();
    }, []);

    // Handle initial data loading
    const handleInitialDataLoad = useCallback(async (center) => {
        try {

            console.warn(center);

            const radius = MAP_CONFIG.INITIAL_RADIUS_KM;
            const bounds = geoUtils.createBoundsFromCenter(center, radius);

            console.warn(bounds);

            await loadDataForBounds(bounds, true);
            updateCenterLocation(center);
        } catch (err) {
            console.error('Initial data load error:', err);
        }
    }, [updateCenterLocation]);

    // =============================================================================
    // DATA MANAGEMENT
    // =============================================================================

    // Load data for specific bounds
    const loadDataForBounds = useCallback(async (bounds, forceRefresh = false) => {
        try {
            // Validate bounds before making API calls
            if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
                console.warn('Invalid bounds provided to loadDataForBounds:', bounds);
                return;
            }
            const cached = await mapCacheService.getCachedData(bounds);

            if (cached && !forceRefresh) {
                // Use cached data
                console.log('Using cached map data');
                return;
            }

            // Fetch fresh data
            const dataPromises = [];

            if (showBusinesses) {
                dataPromises.push(
                    mapDataService.getBusinessesInBounds(bounds, {
                        tags: selectedTags,
                        query: searchQuery
                    })
                );
            }

            if (showEvents) {
                dataPromises.push(
                    mapDataService.getEventsInBounds(bounds, {
                        categories: selectedCategories,
                        query: searchQuery
                    })
                );
            }

            const results = await Promise.all(dataPromises);

            console.log(results);

            // Cache the results
            if (enableOfflineMode) {
                await mapCacheService.setCachedData(bounds, {
                    businesses: results[0] || [],
                    events: results[1] || []
                });
            }

            markDataFetched();

        } catch (err) {
            console.error('Data loading error:', err);
            setError(t('map.dataLoadError', 'Failed to load map data'));
        }
    }, [
        showBusinesses,
        showEvents,
        selectedTags,
        selectedCategories,
        searchQuery,
        markDataFetched,
        enableOfflineMode,
        t
    ]);

    // Handle bounds change and data fetching
    useEffect(() => {
        onBoundsChange(async (boundsData) => {
            if (boundsData.shouldFetch) {
                await loadDataForBounds(boundsData.bounds, boundsData.forceRefresh);
            }
        });
    }, [onBoundsChange, loadDataForBounds]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    // Handle search input changes
    const handleSearchChange = useCallback(async (query) => {
        updateSearchQuery(query);

        if (query.trim().length > 2) {
            try {
                const results = await mapDataService.searchGlobal(query, {
                    bounds: bounds,
                    includeBusinesses: showBusinesses,
                    includeEvents: showEvents
                });

                setSearchResults(results);
                setShowResultsPanel(true);
            } catch (err) {
                console.error('Search error:', err);
            }
        } else {
            setSearchResults([]);
            setShowResultsPanel(false);
        }
    }, [updateSearchQuery, bounds, showBusinesses, showEvents]);

    // Handle location selection from search
    const handleLocationSelect = useCallback(async (location) => {
        try {
            const newCenter = { lat: location.lat, lng: location.lng };

            // Update map center
            if (mapRef.current?.flyTo) {
                mapRef.current.flyTo(newCenter, MAP_CONFIG.LOCATION_ZOOM);
            }

            // Update center location and load new data
            updateCenterLocation(newCenter);

            // Clear search results
            setSearchResults([]);
            setShowResultsPanel(false);

            // Trigger data refresh for new area
            const newBounds = geoUtils.createBoundsFromCenter(newCenter, radiusKm);
            await loadDataForBounds(newBounds, true);

            if (onLocationSelect) {
                onLocationSelect(location);
            }
        } catch (err) {
            console.error('Location selection error:', err);
        }
    }, [updateCenterLocation, radiusKm, onLocationSelect]);

    // Handle business/event selection
    const handleItemSelect = useCallback((item, type) => {
        setSelectedItem({ ...item, type });
        setShowDetailsPanel(true);
        setShowResultsPanel(false);

        // Call appropriate callback
        if (type === 'business' && onBusinessSelect) {
            onBusinessSelect(item);
        } else if (type === 'event' && onEventSelect) {
            onEventSelect(item);
        }
    }, [onBusinessSelect, onEventSelect]);

    // Handle marker interactions
    const handleMarkerClick = useCallback((marker) => {
        handleMarkerSelect(marker);
        handleItemSelect(marker.data, marker.type);
    }, [handleMarkerSelect, handleItemSelect]);

    const handleMarkerHoverEvent = useCallback((marker) => {
        handleMarkerHover(marker);
    }, [handleMarkerHover]);

    // Handle map controls
    const handleZoomIn = useCallback(() => {
        if (mapRef.current?.zoomIn) {
            mapRef.current.zoomIn();
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        if (mapRef.current?.zoomOut) {
            mapRef.current.zoomOut();
        }
    }, []);

    const handleCurrentLocation = useCallback(async () => {
        try {
            const result = await getCurrentPosition();

            if (result.success && mapRef.current?.flyTo) {
                const newCenter = result.location;
                mapRef.current.flyTo(newCenter, MAP_CONFIG.LOCATION_ZOOM);
                updateCenterLocation(newCenter);
            }
        } catch (err) {
            console.error('Current location error:', err);
        }
    }, [getCurrentPosition, updateCenterLocation]);

    const handleToggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    const handleLayerChange = useCallback((layer) => {
        setCurrentLayer(layer);
    }, []);

    // =============================================================================
    // NOTIFICATION SETUP
    // =============================================================================

    const setupPushNotifications = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Push notifications enabled');
                // Register service worker and setup push subscription
            }
        } catch (err) {
            console.error('Push notification setup error:', err);
        }
    }, []);

    // =============================================================================
    // RENDER LOADING STATE
    // =============================================================================

    if (isInitializing) {
        return (
            <div className="map-layout map-layout--initializing">
                <div className="map-layout__loading">
                    <div className="map-layout__loading-container">
                        <div className="map-layout__loading-logo">
                            <div className="map-layout__loading-spinner"></div>
                        </div>
                        <div className="map-layout__loading-text">
                            <h3>{t('map.initializing', 'Initializing Map...')}</h3>
                            <p>{t('map.loadingProgress', 'Loading map data and getting your location')}</p>
                        </div>
                        <div className="map-layout__loading-progress">
                            <div
                                className="map-layout__loading-progress-bar"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                        {loadingProgress < 100 && (
                            <div className="map-layout__loading-percentage">
                                {loadingProgress}%
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // =============================================================================
    // RENDER ERROR STATE
    // =============================================================================

    if (error && !mapReady) {
        return (
            <div className="map-layout map-layout--error">
                <div className="map-layout__error">
                    <div className="map-layout__error-icon">⚠️</div>
                    <h3>{t('map.error', 'Map Error')}</h3>
                    <p>{error}</p>
                    <button
                        className="map-layout__error-retry"
                        onClick={() => window.location.reload()}
                    >
                        {t('common.retry', 'Retry')}
                    </button>
                </div>
            </div>
        );
    }

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    return (
        <div className={`map-layout ${className} ${isFullscreen ? 'map-layout--fullscreen' : ''}`} style={style}>
            {/* Main Map Container */}
            <FullscreenMap
                ref={mapRef}
                businesses={filteredBusinesses}
                events={filteredEvents}
                center={mapCenter || userLocation || initialCenter}
                zoom={mapZoom || initialZoom}
                tileLayer={currentLayer}
                clustering={clustering}
                showUserLocation={enableLocationTracking}
                onMapReady={() => setMapReady(true)}
                onDataRequest={loadDataForBounds}
                onMarkerSelect={handleMarkerClick}
                onMarkerHover={handleMarkerHoverEvent}
                className="map-layout__map"
            />

            {/* Floating UI Layer */}
            <div className="map-layout__floating-ui">
                {/* Search Component */}
                {showSearch && (
                    <FloatingSearch
                        ref={searchRef}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onLocationSelect={handleLocationSelect}
                        onBusinessSelect={(business) => handleItemSelect(business, 'business')}
                        onEventSelect={(event) => handleItemSelect(event, 'event')}
                        position="top-left"
                        showVoiceSearch={enableVoiceSearch}
                        className="map-layout__search"
                    />
                )}

                {/* Profile Component */}
                {showProfile && (
                    <FloatingProfile
                        position="top-right"
                        className="map-layout__profile"
                    />
                )}

                {/* Map Controls */}
                {showControls && (
                    <FloatingControls
                        position="bottom-right"
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onCurrentLocation={handleCurrentLocation}
                        onToggleFullscreen={handleToggleFullscreen}
                        onToggleLayer={handleLayerChange}
                        currentZoom={mapZoom}
                        isFullscreen={isFullscreen}
                        currentLayer={currentLayer}
                        className="map-layout__controls"
                    />
                )}

                {/* Filters Component */}
                {showFilters && (
                    <FloatingFilters
                        position="bottom-left"
                        selectedTags={selectedTags}
                        selectedCategories={selectedCategories}
                        onTagSelect={selectTag}
                        onTagDeselect={deselectTag}
                        onCategorySelect={selectCategory}
                        onCategoryDeselect={deselectCategory}
                        filteredBusinesses={filteredBusinesses}
                        filteredEvents={filteredEvents}
                        filterSummary={filterSummary}
                        onTogglePanel={() => setShowFiltersPanel(!showFiltersPanel)}
                        className="map-layout__filters"
                    />
                )}
            </div>

            {/* Panel Layer */}
            <div className="map-layout__panels">
                {/* Search Results Panel */}
                {showResultsPanel && (
                    <ResultsPanel
                        results={searchResults}
                        onItemSelect={handleItemSelect}
                        onClose={() => setShowResultsPanel(false)}
                        position="left"
                        className="map-layout__results-panel"
                    />
                )}

                {/* Details Panel */}
                {showDetailsPanel && selectedItem && (
                    <DetailsPanel
                        item={selectedItem}
                        onClose={() => {
                            setShowDetailsPanel(false);
                            setSelectedItem(null);
                            resetSelection();
                        }}
                        position="right"
                        className="map-layout__details-panel"
                    />
                )}

                {/* Advanced Filters Panel */}
                {showFiltersPanel && (
                    <FiltersPanel
                        tags={availableTags}
                        categories={availableCategories}
                        selectedTags={selectedTags}
                        selectedCategories={selectedCategories}
                        onTagSelect={selectTag}
                        onTagDeselect={deselectTag}
                        onCategorySelect={selectCategory}
                        onCategoryDeselect={deselectCategory}
                        onClearAll={clearAllFilters}
                        onClose={() => setShowFiltersPanel(false)}
                        position="left"
                        className="map-layout__filters-panel"
                    />
                )}
            </div>

            {/* Accessibility Features */}
            <div className="sr-only">
                <h1>{t('map.title', 'Interactive Map')}</h1>
                <p>{t('map.description', 'Browse businesses and events in your area using this interactive map. Use arrow keys to navigate, plus/minus to zoom.')}</p>
            </div>
        </div>
    );
};

export default MapLayout;