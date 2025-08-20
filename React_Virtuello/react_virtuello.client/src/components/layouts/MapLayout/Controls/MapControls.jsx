/**
 * MapControls - Master Control Interface for Map Interactions
 * Orchestrates all map UI components: search, filters, layers, zoom, location
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

// UI Components
import SearchBox from '../UI/SearchBox';
import FilterPanel from '../UI/FilterPanel';
import LayerToggle from '../UI/LayerToggle';
import ZoomControls from '../UI/ZoomControls';
import LocationButton from '../UI/LocationButton';

// Services
import geolocationService from '../Services/GeolocationService';
import mapService from '../../../../services/mapService';

// Styles
import './MapControls.css';

const MapControls = ({
    // Map state props
    mapInstance = null,
    mapBounds = null,
    currentZoom = 13,
    minZoom = 1,
    maxZoom = 18,
    userLocation = null,
    isLocationTracking = false,

    // Data props
    businessTags = [],
    eventCategories = [],
    markerStats = { businesses: 0, events: 0, total: 0 },

    // Event handlers
    onSearchResult = null,
    onFilterChange = null,
    onLayerToggle = null,
    onZoomChange = null,
    onLocationToggle = null,
    onLocationFound = null,
    onResetView = null,

    // UI configuration
    layout = 'responsive', // 'responsive' | 'mobile' | 'desktop'
    theme = 'light',
    className = '',
    showSearch = true,
    showFilters = true,
    showLayers = true,
    showZoom = true,
    showLocation = true,
    showMarkerCount = true,

    // Advanced options
    enableKeyboardShortcuts = true,
    enableGestures = true,
    autoHideFilters = true,
    collapsible = true,
    persistSettings = true,

    // Filter configuration
    initialFilters = {},
    availableFilters = {},
    quickFilters = [],

    // Performance options
    debounceSearch = 300,
    debounceFilters = 150,
    enableCaching = true
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [controlsState, setControlsState] = useState({
        isSearchOpen: true,
        isFiltersOpen: false,
        isLayersOpen: false,
        isCollapsed: layout === 'mobile',
        activePanel: null, // 'search' | 'filters' | 'layers' | null
        searchQuery: '',
        filters: { ...initialFilters },
        layers: {
            businesses: true,
            events: true,
            routes: false,
            heatmap: false
        }
    });

    const [uiState, setUiState] = useState({
        isSearching: false,
        isFiltering: false,
        searchResults: [],
        filterCount: 0,
        lastSearchTime: 0,
        isMobile: false,
        orientation: 'portrait'
    });

    const [accessibility, setAccessibility] = useState({
        announcements: [],
        focusedControl: null,
        keyboardActive: false,
        screenReaderActive: false
    });

    // Refs for DOM interactions
    const controlsRef = useRef(null);
    const searchDebounceRef = useRef(null);
    const filterDebounceRef = useRef(null);
    const panelRefs = useRef({});

    // =============================================================================
    // RESPONSIVE DETECTION
    // =============================================================================

    useEffect(() => {
        const checkResponsive = () => {
            const isMobile = window.innerWidth <= 768;
            const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

            setUiState(prev => ({
                ...prev,
                isMobile,
                orientation
            }));

            // Auto-collapse on mobile
            if (isMobile && autoHideFilters) {
                setControlsState(prev => ({
                    ...prev,
                    isCollapsed: true,
                    isFiltersOpen: false,
                    isLayersOpen: false
                }));
            }
        };

        checkResponsive();
        window.addEventListener('resize', checkResponsive);
        return () => window.removeEventListener('resize', checkResponsive);
    }, [autoHideFilters]);

    // =============================================================================
    // SEARCH FUNCTIONALITY
    // =============================================================================

    /**
     * Handle search input changes with debouncing
     */
    const handleSearchChange = useCallback(async (query, options = {}) => {
        setControlsState(prev => ({ ...prev, searchQuery: query }));
        setUiState(prev => ({ ...prev, isSearching: true }));

        // Clear previous debounce
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        searchDebounceRef.current = setTimeout(async () => {
            try {
                let results = [];

                if (query.trim().length > 2) {
                    // Perform search via geocoding service
                    results = await geolocationService.geocodeAddress(query, {
                        bounds: mapBounds,
                        limit: 10,
                        ...options
                    });
                }

                setUiState(prev => ({
                    ...prev,
                    searchResults: results,
                    isSearching: false,
                    lastSearchTime: Date.now()
                }));

                // Announce results for screen readers
                announceToScreenReader(`Found ${results.length} search results`);

            } catch (error) {
                console.error('[MapControls] Search failed:', error);
                setUiState(prev => ({
                    ...prev,
                    searchResults: [],
                    isSearching: false
                }));
                announceToScreenReader('Search failed, please try again');
            }
        }, debounceSearch);
    }, [mapBounds, debounceSearch]);

    /**
     * Handle search result selection
     */
    const handleSearchSelect = useCallback((result) => {
        if (onSearchResult) {
            onSearchResult(result);
        }

        // Close search results
        setUiState(prev => ({ ...prev, searchResults: [] }));

        // Focus map for keyboard navigation
        if (mapInstance && enableKeyboardShortcuts) {
            mapInstance.getContainer().focus();
        }

        announceToScreenReader(`Navigated to ${result.name || result.address}`);
    }, [onSearchResult, mapInstance, enableKeyboardShortcuts]);

    // =============================================================================
    // FILTER FUNCTIONALITY
    // =============================================================================

    /**
     * Handle filter changes with debouncing
     */
    const handleFilterUpdate = useCallback((newFilters) => {
        setControlsState(prev => ({
            ...prev,
            filters: { ...prev.filters, ...newFilters }
        }));

        setUiState(prev => ({ ...prev, isFiltering: true }));

        // Clear previous debounce
        if (filterDebounceRef.current) {
            clearTimeout(filterDebounceRef.current);
        }

        filterDebounceRef.current = setTimeout(() => {
            const mergedFilters = { ...controlsState.filters, ...newFilters };

            if (onFilterChange) {
                onFilterChange(mergedFilters);
            }

            // Count active filters
            const filterCount = Object.values(mergedFilters).filter(value => {
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'boolean') return value;
                if (typeof value === 'string') return value.trim() !== '';
                if (typeof value === 'number') return value > 0;
                return false;
            }).length;

            setUiState(prev => ({
                ...prev,
                isFiltering: false,
                filterCount
            }));

            announceToScreenReader(`Filters updated, ${filterCount} active filters`);
        }, debounceFilters);
    }, [controlsState.filters, onFilterChange, debounceFilters]);

    /**
     * Reset all filters
     */
    const handleFilterReset = useCallback(() => {
        const resetFilters = { ...initialFilters };
        setControlsState(prev => ({ ...prev, filters: resetFilters }));

        if (onFilterChange) {
            onFilterChange(resetFilters);
        }

        setUiState(prev => ({ ...prev, filterCount: 0 }));
        announceToScreenReader('All filters cleared');
    }, [initialFilters, onFilterChange]);

    // =============================================================================
    // LAYER MANAGEMENT
    // =============================================================================

    /**
     * Handle layer toggle
     */
    const handleLayerChange = useCallback((layerType, enabled) => {
        setControlsState(prev => ({
            ...prev,
            layers: { ...prev.layers, [layerType]: enabled }
        }));

        if (onLayerToggle) {
            onLayerToggle(layerType, enabled);
        }

        const action = enabled ? 'enabled' : 'disabled';
        announceToScreenReader(`${layerType} layer ${action}`);
    }, [onLayerToggle]);

    // =============================================================================
    // LOCATION FUNCTIONALITY
    // =============================================================================

    /**
     * Handle location button actions
     */
    const handleLocationAction = useCallback(async (action) => {
        try {
            switch (action) {
                case 'getCurrentLocation':
                    const location = await geolocationService.getCurrentPosition();
                    if (onLocationFound) {
                        onLocationFound(location);
                    }
                    announceToScreenReader('Current location found');
                    break;

                case 'toggleTracking':
                    if (onLocationToggle) {
                        onLocationToggle();
                    }
                    const trackingState = isLocationTracking ? 'disabled' : 'enabled';
                    announceToScreenReader(`Location tracking ${trackingState}`);
                    break;

                default:
                    console.warn('[MapControls] Unknown location action:', action);
            }
        } catch (error) {
            console.error('[MapControls] Location action failed:', error);
            announceToScreenReader('Location access failed');
        }
    }, [onLocationFound, onLocationToggle, isLocationTracking]);

    // =============================================================================
    // ZOOM CONTROLS
    // =============================================================================

    /**
     * Handle zoom operations
     */
    const handleZoomAction = useCallback((action, value) => {
        if (!mapInstance || !onZoomChange) return;

        try {
            switch (action) {
                case 'zoomIn':
                    const newZoomIn = Math.min(currentZoom + 1, maxZoom);
                    onZoomChange(newZoomIn);
                    announceToScreenReader(`Zoomed in to level ${newZoomIn}`);
                    break;

                case 'zoomOut':
                    const newZoomOut = Math.max(currentZoom - 1, minZoom);
                    onZoomChange(newZoomOut);
                    announceToScreenReader(`Zoomed out to level ${newZoomOut}`);
                    break;

                case 'zoomToFit':
                    if (mapBounds && mapInstance) {
                        mapInstance.fitBounds(mapBounds);
                        announceToScreenReader('Zoomed to fit all markers');
                    }
                    break;

                case 'resetView':
                    if (onResetView) {
                        onResetView();
                        announceToScreenReader('Map view reset');
                    }
                    break;

                case 'zoomToLocation':
                    if (userLocation && mapInstance) {
                        mapInstance.setView([userLocation.lat, userLocation.lng], 16);
                        announceToScreenReader('Zoomed to your location');
                    }
                    break;

                default:
                    console.warn('[MapControls] Unknown zoom action:', action);
            }
        } catch (error) {
            console.error('[MapControls] Zoom action failed:', error);
        }
    }, [mapInstance, onZoomChange, currentZoom, minZoom, maxZoom, mapBounds, onResetView, userLocation]);

    // =============================================================================
    // PANEL MANAGEMENT
    // =============================================================================

    /**
     * Toggle panel visibility
     */
    const togglePanel = useCallback((panelType) => {
        setControlsState(prev => {
            const isCurrentlyOpen = prev[`is${panelType}Open`];
            const newState = { ...prev };

            // Close all panels first
            newState.isSearchOpen = false;
            newState.isFiltersOpen = false;
            newState.isLayersOpen = false;

            // Open the requested panel if it wasn't already open
            if (!isCurrentlyOpen) {
                newState[`is${panelType}Open`] = true;
                newState.activePanel = panelType.toLowerCase();
                newState.isCollapsed = false;
            } else {
                newState.activePanel = null;
            }

            return newState;
        });
    }, []);

    /**
     * Toggle entire controls visibility
     */
    const toggleControls = useCallback(() => {
        setControlsState(prev => ({
            ...prev,
            isCollapsed: !prev.isCollapsed,
            activePanel: prev.isCollapsed ? prev.activePanel : null
        }));
    }, []);

    // =============================================================================
    // KEYBOARD SHORTCUTS
    // =============================================================================

    useEffect(() => {
        if (!enableKeyboardShortcuts) return;

        const handleKeyPress = (event) => {
            // Only handle shortcuts when map controls are focused
            if (!controlsRef.current?.contains(document.activeElement)) return;

            const { key, ctrlKey, metaKey, altKey } = event;
            const modifier = ctrlKey || metaKey;

            switch (key) {
                case 'f':
                    if (modifier) {
                        event.preventDefault();
                        togglePanel('Search');
                        // Focus search input
                        setTimeout(() => {
                            const searchInput = controlsRef.current?.querySelector('.search-box__input');
                            searchInput?.focus();
                        }, 100);
                    }
                    break;

                case 'g':
                    if (modifier) {
                        event.preventDefault();
                        handleLocationAction('getCurrentLocation');
                    }
                    break;

                case '+':
                case '=':
                    if (modifier) {
                        event.preventDefault();
                        handleZoomAction('zoomIn');
                    }
                    break;

                case '-':
                    if (modifier) {
                        event.preventDefault();
                        handleZoomAction('zoomOut');
                    }
                    break;

                case 'r':
                    if (modifier && altKey) {
                        event.preventDefault();
                        handleZoomAction('resetView');
                    }
                    break;

                case 'Escape':
                    event.preventDefault();
                    setControlsState(prev => ({
                        ...prev,
                        isSearchOpen: false,
                        isFiltersOpen: false,
                        isLayersOpen: false,
                        activePanel: null
                    }));
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [enableKeyboardShortcuts, togglePanel, handleLocationAction, handleZoomAction]);

    // =============================================================================
    // ACCESSIBILITY HELPERS
    // =============================================================================

    /**
     * Announce message to screen readers
     */
    const announceToScreenReader = useCallback((message) => {
        setAccessibility(prev => ({
            ...prev,
            announcements: [...prev.announcements.slice(-4), message]
        }));

        // Remove announcement after delay
        setTimeout(() => {
            setAccessibility(prev => ({
                ...prev,
                announcements: prev.announcements.filter(msg => msg !== message)
            }));
        }, 3000);
    }, []);

    // =============================================================================
    // LAYER CONFIGURATION
    // =============================================================================

    const layerConfig = useMemo(() => [
        {
            id: 'businesses',
            label: 'Businesses',
            description: 'Local businesses and services',
            enabled: controlsState.layers.businesses,
            count: markerStats.businesses || 0,
            icon: '🏢',
            color: '#6366f1'
        },
        {
            id: 'events',
            label: 'Events',
            description: 'Upcoming events and activities',
            enabled: controlsState.layers.events,
            count: markerStats.events || 0,
            icon: '📅',
            color: '#10b981'
        },
        {
            id: 'routes',
            label: 'Routes',
            description: 'Travel routes and directions',
            enabled: controlsState.layers.routes,
            count: 0,
            icon: '🛣️',
            color: '#f59e0b'
        }
    ], [controlsState.layers, markerStats]);

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    const getControlsClassName = () => {
        const classes = ['map-controls'];

        if (className) classes.push(className);
        if (theme) classes.push(`map-controls--${theme}`);
        if (layout) classes.push(`map-controls--${layout}`);
        if (controlsState.isCollapsed) classes.push('map-controls--collapsed');
        if (uiState.isMobile) classes.push('map-controls--mobile');
        if (controlsState.activePanel) classes.push(`map-controls--${controlsState.activePanel}-active`);

        return classes.join(' ');
    };

    // =============================================================================
    // COMPONENT RENDER
    // =============================================================================

    return (
        <div
            ref={controlsRef}
            className={getControlsClassName()}
            role="region"
            aria-label="Map Controls"
            data-theme={theme}
        >
            {/* Screen Reader Announcements */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {accessibility.announcements.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>

            {/* Main Controls Header */}
            <div className="map-controls__header">
                {/* Search Control */}
                {showSearch && (
                    <div className="map-controls__search">
                        <SearchBox
                            onSearch={handleSearchChange}
                            onResultSelect={handleSearchSelect}
                            onClear={() => handleSearchChange('')}
                            results={uiState.searchResults}
                            isLoading={uiState.isSearching}
                            placeholder="Search places, businesses..."
                            query={controlsState.searchQuery}
                            showSuggestions={true}
                            theme={theme}
                            className="map-controls__search-box"
                        />
                    </div>
                )}

                {/* Control Buttons */}
                <div className="map-controls__buttons">
                    {/* Filters Toggle */}
                    {showFilters && (
                        <button
                            className={`map-controls__button ${controlsState.isFiltersOpen ? 'map-controls__button--active' : ''}`}
                            onClick={() => togglePanel('Filters')}
                            aria-label={`${controlsState.isFiltersOpen ? 'Close' : 'Open'} filters`}
                            aria-expanded={controlsState.isFiltersOpen}
                            title="Toggle Filters (Ctrl+F)"
                        >
                            <span className="map-controls__button-icon">🔧</span>
                            {uiState.filterCount > 0 && (
                                <span className="map-controls__badge">{uiState.filterCount}</span>
                            )}
                        </button>
                    )}

                    {/* Layers Toggle */}
                    {showLayers && (
                        <button
                            className={`map-controls__button ${controlsState.isLayersOpen ? 'map-controls__button--active' : ''}`}
                            onClick={() => togglePanel('Layers')}
                            aria-label={`${controlsState.isLayersOpen ? 'Close' : 'Open'} layers`}
                            aria-expanded={controlsState.isLayersOpen}
                            title="Toggle Layers"
                        >
                            <span className="map-controls__button-icon">📋</span>
                        </button>
                    )}

                    {/* Collapse Toggle */}
                    {collapsible && (
                        <button
                            className="map-controls__button map-controls__collapse"
                            onClick={toggleControls}
                            aria-label={`${controlsState.isCollapsed ? 'Expand' : 'Collapse'} controls`}
                            title="Toggle Controls"
                        >
                            <span className="map-controls__button-icon">
                                {controlsState.isCollapsed ? '📤' : '📥'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Panels Container */}
            {!controlsState.isCollapsed && (
                <div className="map-controls__panels">
                    {/* Filter Panel */}
                    {showFilters && controlsState.isFiltersOpen && (
                        <div
                            ref={el => panelRefs.current.filters = el}
                            className="map-controls__panel map-controls__panel--filters"
                        >
                            <FilterPanel
                                onFiltersChange={handleFilterUpdate}
                                onReset={handleFilterReset}
                                initialFilters={controlsState.filters}
                                availableFilters={availableFilters}
                                businessTags={businessTags}
                                eventCategories={eventCategories}
                                isLoading={uiState.isFiltering}
                                resultCount={markerStats.total}
                                theme={theme}
                                compactMode={uiState.isMobile}
                                className="map-controls__filter-panel"
                            />
                        </div>
                    )}

                    {/* Layer Panel */}
                    {showLayers && controlsState.isLayersOpen && (
                        <div
                            ref={el => panelRefs.current.layers = el}
                            className="map-controls__panel map-controls__panel--layers"
                        >
                            <LayerToggle
                                layers={layerConfig}
                                onChange={handleLayerChange}
                                theme={theme}
                                showCounts={showMarkerCount}
                                orientation="vertical"
                                className="map-controls__layer-panel"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Zoom Controls */}
            {showZoom && (
                <div className="map-controls__zoom">
                    <ZoomControls
                        onZoomIn={() => handleZoomAction('zoomIn')}
                        onZoomOut={() => handleZoomAction('zoomOut')}
                        onZoomToFit={() => handleZoomAction('zoomToFit')}
                        onResetView={() => handleZoomAction('resetView')}
                        onZoomToLocation={() => handleZoomAction('zoomToLocation')}
                        currentZoom={currentZoom}
                        minZoom={minZoom}
                        maxZoom={maxZoom}
                        showZoomLevel={true}
                        showResetButton={true}
                        showFitButton={true}
                        showLocationButton={false} // Handled separately
                        theme={theme}
                        orientation="vertical"
                        position="topright"
                        className="map-controls__zoom-controls"
                    />
                </div>
            )}

            {/* Location Controls */}
            {showLocation && (
                <div className="map-controls__location">
                    <LocationButton
                        onLocationFound={(location) => handleLocationAction('getCurrentLocation')}
                        onTrackingToggle={() => handleLocationAction('toggleTracking')}
                        userLocation={userLocation}
                        isTracking={isLocationTracking}
                        showAccuracy={true}
                        autoCenter={true}
                        theme={theme}
                        size="medium"
                        className="map-controls__location-button"
                    />
                </div>
            )}

            {/* Status Bar */}
            {showMarkerCount && (
                <div className="map-controls__status">
                    <div className="map-controls__stats">
                        <span className="map-controls__stat">
                            <span className="map-controls__stat-icon">🏢</span>
                            <span className="map-controls__stat-value">{markerStats.businesses || 0}</span>
                        </span>
                        <span className="map-controls__stat">
                            <span className="map-controls__stat-icon">📅</span>
                            <span className="map-controls__stat-value">{markerStats.events || 0}</span>
                        </span>
                        {uiState.filterCount > 0 && (
                            <span className="map-controls__stat map-controls__stat--filters">
                                <span className="map-controls__stat-icon">🔧</span>
                                <span className="map-controls__stat-value">{uiState.filterCount}</span>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================================================
// PROP TYPES
// =============================================================================

MapControls.propTypes = {
    // Map state
    mapInstance: PropTypes.object,
    mapBounds: PropTypes.object,
    currentZoom: PropTypes.number,
    minZoom: PropTypes.number,
    maxZoom: PropTypes.number,
    userLocation: PropTypes.object,
    isLocationTracking: PropTypes.bool,

    // Data
    businessTags: PropTypes.array,
    eventCategories: PropTypes.array,
    markerStats: PropTypes.object,

    // Event handlers
    onSearchResult: PropTypes.func,
    onFilterChange: PropTypes.func,
    onLayerToggle: PropTypes.func,
    onZoomChange: PropTypes.func,
    onLocationToggle: PropTypes.func,
    onLocationFound: PropTypes.func,
    onResetView: PropTypes.func,

    // UI configuration
    layout: PropTypes.oneOf(['responsive', 'mobile', 'desktop']),
    theme: PropTypes.oneOf(['light', 'dark']),
    className: PropTypes.string,
    showSearch: PropTypes.bool,
    showFilters: PropTypes.bool,
    showLayers: PropTypes.bool,
    showZoom: PropTypes.bool,
    showLocation: PropTypes.bool,
    showMarkerCount: PropTypes.bool,

    // Advanced options
    enableKeyboardShortcuts: PropTypes.bool,
    enableGestures: PropTypes.bool,
    autoHideFilters: PropTypes.bool,
    collapsible: PropTypes.bool,
    persistSettings: PropTypes.bool,

    // Filter configuration
    initialFilters: PropTypes.object,
    availableFilters: PropTypes.object,
    quickFilters: PropTypes.array,

    // Performance options
    debounceSearch: PropTypes.number,
    debounceFilters: PropTypes.number,
    enableCaching: PropTypes.bool
};

export default MapControls;