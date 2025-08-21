/**
 * MapControls - Clean map controls component
 * Provides search, filters, zoom, and location controls
 * 
 * @author WAN SOLUTIONS
 * @version 2.0.0 - Clean implementation
 */

import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

// Import icons (you may need to adjust imports based on your icon library)
// For now, using simple text buttons - you can replace with proper icons later
import './MapControls.css';

const MapControls = ({
    mapInstance,
    mapBounds,
    currentZoom = 13,
    minZoom = 3,
    maxZoom = 18,
    userLocation,
    isLocationTracking = false,
    onSearchResult,
    onFilterChange,
    onLayerToggle,
    onZoomChange,
    onLocationToggle,
    onLocationFound,
    onResetView,
    theme = 'light',
    layout = 'responsive',
    showSearch = true,
    showFilters = true,
    showLayers = true,
    showZoom = true,
    showLocation = true,
    showMarkerCount = true
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        businesses: true,
        events: true,
        routes: false
    });
    const [activeLayers, setActiveLayers] = useState({
        satellite: false,
        terrain: false,
        traffic: false
    });
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [showLayerPanel, setShowLayerPanel] = useState(false);

    const searchInputRef = useRef(null);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle search input change
     */
    const handleSearchChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    /**
     * Handle search submission
     */
    const handleSearchSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            // Simple search simulation - replace with actual search API
            const mockResult = {
                lat: 34.0622 + (Math.random() - 0.5) * 0.1,
                lng: -6.7636 + (Math.random() - 0.5) * 0.1,
                zoom: 16,
                query: searchQuery,
                address: `${searchQuery}, Fes, Morocco`
            };

            if (onSearchResult) {
                onSearchResult(mockResult);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, onSearchResult]);

    /**
     * Handle filter toggle
     */
    const handleFilterToggle = useCallback((filterType) => {
        const newFilters = {
            ...activeFilters,
            [filterType]: !activeFilters[filterType]
        };
        setActiveFilters(newFilters);

        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    }, [activeFilters, onFilterChange]);

    /**
     * Handle layer toggle
     */
    const handleLayerToggle = useCallback((layerType) => {
        const newLayers = {
            ...activeLayers,
            [layerType]: !activeLayers[layerType]
        };
        setActiveLayers(newLayers);

        if (onLayerToggle) {
            onLayerToggle(layerType, newLayers[layerType]);
        }
    }, [activeLayers, onLayerToggle]);

    /**
     * Handle zoom in
     */
    const handleZoomIn = useCallback(() => {
        const newZoom = Math.min(currentZoom + 1, maxZoom);
        if (mapInstance) {
            mapInstance.setZoom(newZoom);
        }
        if (onZoomChange) {
            onZoomChange(newZoom);
        }
    }, [currentZoom, maxZoom, mapInstance, onZoomChange]);

    /**
     * Handle zoom out
     */
    const handleZoomOut = useCallback(() => {
        const newZoom = Math.max(currentZoom - 1, minZoom);
        if (mapInstance) {
            mapInstance.setZoom(newZoom);
        }
        if (onZoomChange) {
            onZoomChange(newZoom);
        }
    }, [currentZoom, minZoom, mapInstance, onZoomChange]);

    /**
     * Handle location button click
     */
    const handleLocationClick = useCallback(() => {
        if (onLocationToggle) {
            onLocationToggle();
        }
    }, [onLocationToggle]);

    /**
     * Handle reset view
     */
    const handleResetClick = useCallback(() => {
        if (onResetView) {
            onResetView();
        }
    }, [onResetView]);

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    const renderSearchControls = () => {
        if (!showSearch) return null;

        return (
            <div className="map-controls__search">
                <form onSubmit={handleSearchSubmit} className="map-controls__search-form">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search places in Fes..."
                        className="map-controls__search-input"
                        disabled={isSearching}
                    />
                    <button
                        type="submit"
                        className="map-controls__search-button"
                        disabled={isSearching || !searchQuery.trim()}
                    >
                        {isSearching ? '...' : '🔍'}
                    </button>
                </form>
            </div>
        );
    };

    const renderFilterControls = () => {
        if (!showFilters) return null;

        return (
            <div className="map-controls__filters">
                <button
                    className={`map-controls__filter-toggle ${showFilterPanel ? 'active' : ''}`}
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                >
                    Filters
                </button>

                {showFilterPanel && (
                    <div className="map-controls__filter-panel">
                        <div className="map-controls__filter-group">
                            <h4>Show on Map</h4>
                            {Object.entries(activeFilters).map(([key, active]) => (
                                <label key={key} className="map-controls__filter-item">
                                    <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={() => handleFilterToggle(key)}
                                    />
                                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderLayerControls = () => {
        if (!showLayers) return null;

        return (
            <div className="map-controls__layers">
                <button
                    className={`map-controls__layer-toggle ${showLayerPanel ? 'active' : ''}`}
                    onClick={() => setShowLayerPanel(!showLayerPanel)}
                >
                    Layers
                </button>

                {showLayerPanel && (
                    <div className="map-controls__layer-panel">
                        <div className="map-controls__layer-group">
                            <h4>Map Layers</h4>
                            {Object.entries(activeLayers).map(([key, active]) => (
                                <label key={key} className="map-controls__layer-item">
                                    <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={() => handleLayerToggle(key)}
                                    />
                                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderZoomControls = () => {
        if (!showZoom) return null;

        return (
            <div className="map-controls__zoom">
                <button
                    className="map-controls__zoom-in"
                    onClick={handleZoomIn}
                    disabled={currentZoom >= maxZoom}
                    title="Zoom In"
                >
                    +
                </button>
                <div className="map-controls__zoom-level">
                    {currentZoom}
                </div>
                <button
                    className="map-controls__zoom-out"
                    onClick={handleZoomOut}
                    disabled={currentZoom <= minZoom}
                    title="Zoom Out"
                >
                    −
                </button>
            </div>
        );
    };

    const renderLocationControls = () => {
        if (!showLocation) return null;

        return (
            <div className="map-controls__location">
                <button
                    className={`map-controls__location-button ${isLocationTracking ? 'active' : ''}`}
                    onClick={handleLocationClick}
                    title="Find My Location"
                >
                    📍
                </button>
                {userLocation && (
                    <div className="map-controls__location-info">
                        Location found
                    </div>
                )}
            </div>
        );
    };

    const renderUtilityControls = () => {
        return (
            <div className="map-controls__utilities">
                <button
                    className="map-controls__reset-button"
                    onClick={handleResetClick}
                    title="Reset View"
                >
                    🏠
                </button>
            </div>
        );
    };

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    return (
        <div className={`map-controls map-controls--${theme} map-controls--${layout}`}>
            {/* Top Controls */}
            <div className="map-controls__top">
                {renderSearchControls()}
                <div className="map-controls__top-actions">
                    {renderFilterControls()}
                    {renderLayerControls()}
                </div>
            </div>

            {/* Side Controls */}
            <div className="map-controls__side">
                {renderZoomControls()}
                {renderLocationControls()}
                {renderUtilityControls()}
            </div>

            {/* Stats */}
            {showMarkerCount && (
                <div className="map-controls__stats">
                    <div className="map-controls__stat-item">
                        Zoom: {currentZoom}
                    </div>
                    {userLocation && (
                        <div className="map-controls__stat-item">
                            📍 Location Active
                        </div>
                    )}
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
    showSearch: PropTypes.bool,
    showFilters: PropTypes.bool,
    showLayers: PropTypes.bool,
    showZoom: PropTypes.bool,
    showLocation: PropTypes.bool,
    showMarkerCount: PropTypes.bool
};

export default MapControls;