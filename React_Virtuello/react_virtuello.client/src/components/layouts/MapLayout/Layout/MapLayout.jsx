import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import { useMapFilters } from '../../../../hooks/useMapFilters';
import MapContainer from './../components/MapContainer/MapContainer';
import MapSidebar from './../components/MapSidebar/MapSidebar';
import MapSearchInput from './../components/MapSearchInput/MapSearchInput';
import { mapUtils } from './../utils/mapUtils';
import './MapLayout.css';

const MapLayout = ({
    // Configuration
    showSidebar = true,
    showSearch = true,
    showBusinesses = true,
    showEvents = true,
    clustering = false,
    tileLayer = 'openStreetMap',

    // Initial state
    initialCenter = mapUtils.DEFAULT_CONFIG.center,
    initialZoom = mapUtils.DEFAULT_CONFIG.zoom,

    // API configuration
    apiBaseUrl = '',

    // Event handlers
    onBusinessSelect,
    onEventSelect,
    onLocationSelect,

    // Custom styling
    className = '',
    style = {}
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Map filters hook
    const {
        // Data - using correct property names from the hook
        businesses: filteredBusinesses = [],
        events: filteredEvents = [],
        allBusinesses: businesses = [],
        allEvents: events = [],
        tags: availableTags = [],
        categories: availableCategories = [],
        allTags: tags = [],
        allCategories: categories = [],
        loading,
        error,

        // Filter states
        selectedTags = [],
        selectedCategories = [],
        searchQuery = '',
        mapBounds,
        centerLocation,
        radiusKm,

        // Filter actions
        selectTag,
        deselectTag,
        toggleTag,
        clearSelectedTags,
        selectCategory,
        deselectCategory,
        toggleCategory,
        clearSelectedCategories,
        updateSearchQuery, // Correct function name
        updateMapBounds, // Use updateMapBounds instead of setMapBounds
        updateCenterLocation, // Correct function name
        updateRadius, // Correct function name
        refreshData
    } = useMapFilters();

    // Local state
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(showSidebar);
    const [mapCenter, setMapCenter] = useState(initialCenter);
    const [mapZoom, setMapZoom] = useState(initialZoom);
    const [showBusinessesLocal, setShowBusinessesLocal] = useState(showBusinesses);
    const [showEventsLocal, setShowEventsLocal] = useState(showEvents);

    // Handle map click
    const handleMapClick = useCallback((latlng, event) => {
        // Clear selections when clicking on empty map
        setSelectedBusiness(null);
        setSelectedEvent(null);

        if (onLocationSelect) {
            onLocationSelect(latlng, event);
        }
    }, [onLocationSelect]);

    // Handle marker click
    const handleMarkerClick = useCallback((item, type, event) => {
        if (type === 'business') {
            setSelectedBusiness(item);
            setSelectedEvent(null);
            if (onBusinessSelect) {
                onBusinessSelect(item, event);
            }
        } else if (type === 'event') {
            setSelectedEvent(item);
            setSelectedBusiness(null);
            if (onEventSelect) {
                onEventSelect(item, event);
            }
        }
    }, [onBusinessSelect, onEventSelect]);

    // Handle map bounds change - FIXED: Use the correct function name from useMapFilters
    const handleBoundsChange = useCallback((bounds) => {
        if (updateMapBounds) {
            updateMapBounds(bounds);
        }
    }, [updateMapBounds]);

    // Handle sidebar toggle
    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev);
    }, []);

    // Handle layer toggles
    const toggleBusinessLayer = useCallback(() => {
        setShowBusinessesLocal(prev => !prev);
    }, []);

    const toggleEventLayer = useCallback(() => {
        setShowEventsLocal(prev => !prev);
    }, []);

    // Handle search
    const handleSearch = useCallback((query) => {
        if (updateSearchQuery) {
            updateSearchQuery(query);
        }
    }, [updateSearchQuery]);

    // Handle filter actions
    const handleTagSelect = useCallback((tagId) => {
        toggleTag(tagId);
    }, [toggleTag]);

    const handleCategorySelect = useCallback((categoryId) => {
        toggleCategory(categoryId);
    }, [toggleCategory]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        if (clearSelectedTags) clearSelectedTags();
        if (clearSelectedCategories) clearSelectedCategories();
        if (updateSearchQuery) updateSearchQuery('');
        if (updateCenterLocation) updateCenterLocation(null);
        if (updateRadius) updateRadius(10);
    }, [clearSelectedTags, clearSelectedCategories, updateSearchQuery, updateCenterLocation, updateRadius]);

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        return (selectedTags?.length || 0) +
            (selectedCategories?.length || 0) +
            (searchQuery?.trim() ? 1 : 0) +
            (centerLocation ? 1 : 0);
    }, [selectedTags?.length, selectedCategories?.length, searchQuery, centerLocation]);

    // Auto-fit map when filters change
    const fitMapToResults = useCallback(() => {
        const allItems = [
            ...(showBusinessesLocal && filteredBusinesses ? filteredBusinesses : []),
            ...(showEventsLocal && filteredEvents ? filteredEvents : [])
        ];

        if (allItems.length > 0 && mapUtils?.calculateBounds) {
            const bounds = mapUtils.calculateBounds(allItems);
            if (bounds && mapUtils?.getCenterPoint) {
                const center = mapUtils.getCenterPoint(allItems);
                if (center) {
                    setMapCenter([center.lat, center.lng]);
                    if (mapUtils?.getOptimalZoom) {
                        setMapZoom(mapUtils.getOptimalZoom(bounds));
                    }
                }
            }
        }
    }, [filteredBusinesses, filteredEvents, showBusinessesLocal, showEventsLocal]);

    // Error handling
    useEffect(() => {
        if (error) {
            console.error('Map data error:', error);
            // You could show a toast notification here
        }
    }, [error]);

    // Render loading state
    if (loading && (!businesses || businesses.length === 0) && (!events || events.length === 0)) {
        return (
            <div className="map-layout map-layout--loading">
                <div className="map-layout__loading">
                    <div className="loading-spinner"></div>
                    <p>{t('map.loadingData', 'Loading map data...')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`map-layout ${className}`} style={style}>
            {/* Header with search and controls */}
            {showSearch && (
                <div className="map-layout__header">
                    <div className="map-layout__search">
                        <MapSearchInput
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder={t('map.searchPlaceholder', 'Search businesses and events...')}
                            loading={loading}
                        />
                    </div>

                    <div className="map-layout__header-controls">
                        {/* Filter count badge */}
                        {activeFilterCount > 0 && (
                            <div className="filter-count-badge">
                                {activeFilterCount} {t('map.filtersActive', 'filters active')}
                                <button
                                    onClick={clearAllFilters}
                                    className="clear-filters-btn"
                                    title={t('map.clearFilters', 'Clear all filters')}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {/* Layer toggles */}
                        <div className="layer-toggles">
                            <button
                                className={`layer-toggle ${showBusinessesLocal ? 'active' : ''}`}
                                onClick={toggleBusinessLayer}
                                title={t('map.toggleBusinesses', 'Toggle businesses')}
                            >
                                🏪 {filteredBusinesses?.length || 0}
                            </button>

                            <button
                                className={`layer-toggle ${showEventsLocal ? 'active' : ''}`}
                                onClick={toggleEventLayer}
                                title={t('map.toggleEvents', 'Toggle events')}
                            >
                                📅 {filteredEvents?.length || 0}
                            </button>
                        </div>

                        {/* Sidebar toggle */}
                        {showSidebar && (
                            <button
                                className="sidebar-toggle"
                                onClick={toggleSidebar}
                                title={t('map.toggleSidebar', 'Toggle sidebar')}
                            >
                                {sidebarOpen ? '◀' : '▶'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div className="map-layout__content">
                {/* Sidebar */}
                {showSidebar && sidebarOpen && (
                    <div className="map-layout__sidebar">
                        <MapSidebar
                            // Data
                            businesses={businesses}
                            events={events}
                            filteredBusinesses={filteredBusinesses}
                            filteredEvents={filteredEvents}
                            tags={availableTags}
                            categories={availableCategories}

                            // Selected states
                            selectedTags={selectedTags}
                            selectedCategories={selectedCategories}
                            selectedBusiness={selectedBusiness}
                            selectedEvent={selectedEvent}

                            // Filter states
                            searchQuery={searchQuery}
                            centerLocation={centerLocation}
                            radiusKm={radiusKm}

                            // Event handlers
                            onTagSelect={handleTagSelect}
                            onCategorySelect={handleCategorySelect}
                            onBusinessSelect={(business) => {
                                setSelectedBusiness(business);
                                setSelectedEvent(null);
                                if (onBusinessSelect) {
                                    onBusinessSelect(business);
                                }
                            }}
                            onEventSelect={(event) => {
                                setSelectedEvent(event);
                                setSelectedBusiness(null);
                                if (onEventSelect) {
                                    onEventSelect(event);
                                }
                            }}
                            onClearFilters={clearAllFilters}
                            onFitToResults={fitMapToResults}

                            // Loading state
                            loading={loading}
                            error={error}

                            // Configuration
                            apiBaseUrl={apiBaseUrl}
                        />
                    </div>
                )}

                {/* Map container */}
                <div className={`map-layout__map ${sidebarOpen && showSidebar ? 'with-sidebar' : 'full-width'}`}>
                    <MapContainer
                        // Map configuration
                        center={mapCenter}
                        zoom={mapZoom}
                        tileLayer={tileLayer}

                        // Data
                        businesses={businesses}
                        events={events}
                        filteredBusinesses={filteredBusinesses}
                        filteredEvents={filteredEvents}

                        // Selected items
                        selectedBusiness={selectedBusiness}
                        selectedEvent={selectedEvent}

                        // Event handlers
                        onMapClick={handleMapClick}
                        onMarkerClick={handleMarkerClick}
                        onBoundsChange={handleBoundsChange}

                        // Configuration
                        showBusinesses={showBusinessesLocal}
                        showEvents={showEventsLocal}
                        clustering={clustering}
                        apiBaseUrl={apiBaseUrl}
                    />
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="map-layout__error">
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                        <button onClick={() => refreshData()} className="retry-btn">
                            {t('common.retry', 'Retry')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapLayout;