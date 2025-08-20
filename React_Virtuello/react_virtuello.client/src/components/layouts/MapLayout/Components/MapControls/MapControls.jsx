/**
 * MapControls Component - Map Search and Filter Controls
 * Provides search, filtering, location controls, and map style options
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './MapControls.css';

const MapControls = ({
    searchQuery = '',
    onSearch,
    activeFilters = {},
    onFilterChange,
    onGetLocation,
    onToggleTracking,
    isTrackingLocation = false,
    userLocation = null,
    isLoading = false,
    mapStyle = 'default',
    onMapStyleChange,
    theme = 'light',
    className = '',
    position = 'top-left'
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const [showFilters, setShowFilters] = useState(false);
    const [showStyleSelector, setShowStyleSelector] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Refs
    const searchInputRef = useRef(null);
    const filtersRef = useRef(null);
    const styleRef = useRef(null);
    const searchResultsRef = useRef(null);

    // =============================================================================
    // SEARCH FUNCTIONALITY
    // =============================================================================

    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setLocalSearchQuery(value);

        // Trigger search with debouncing
        if (onSearch) {
            const timeoutId = setTimeout(() => {
                onSearch(value);
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [onSearch]);

    const handleSearchSubmit = useCallback((e) => {
        e.preventDefault();
        if (onSearch && localSearchQuery.trim()) {
            onSearch(localSearchQuery.trim());
        }
    }, [onSearch, localSearchQuery]);

    const clearSearch = useCallback(() => {
        setLocalSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
        if (onSearch) {
            onSearch('');
        }
    }, [onSearch]);

    // =============================================================================
    // FILTER FUNCTIONALITY
    // =============================================================================

    const handleFilterToggle = useCallback((filterType, value) => {
        if (!onFilterChange) return;

        const currentValues = activeFilters[filterType] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];

        onFilterChange({
            ...activeFilters,
            [filterType]: newValues
        });
    }, [activeFilters, onFilterChange]);

    const clearAllFilters = useCallback(() => {
        if (onFilterChange) {
            onFilterChange({});
        }
    }, [onFilterChange]);

    // =============================================================================
    // LOCATION FUNCTIONALITY
    // =============================================================================

    const handleLocationClick = useCallback(() => {
        if (onGetLocation) {
            onGetLocation();
        }
    }, [onGetLocation]);

    const handleTrackingToggle = useCallback(() => {
        if (onToggleTracking) {
            onToggleTracking();
        }
    }, [onToggleTracking]);

    // =============================================================================
    // MAP STYLE FUNCTIONALITY
    // =============================================================================

    const mapStyles = [
        { id: 'default', name: 'Default', icon: '🗺️' },
        { id: 'satellite', name: 'Satellite', icon: '🛰️' },
        { id: 'terrain', name: 'Terrain', icon: '🏔️' },
        { id: 'dark', name: 'Dark', icon: '🌙' }
    ];

    const handleStyleChange = useCallback((styleId) => {
        if (onMapStyleChange) {
            onMapStyleChange(styleId);
        }
        setShowStyleSelector(false);
    }, [onMapStyleChange]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filtersRef.current && !filtersRef.current.contains(event.target)) {
                setShowFilters(false);
            }
            if (styleRef.current && !styleRef.current.contains(event.target)) {
                setShowStyleSelector(false);
            }
            if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    const renderSearchResults = () => {
        if (!showSearchResults || !searchResults.length) return null;

        return (
            <div ref={searchResultsRef} className="map-controls__search-results">
                {searchResults.map((result, index) => (
                    <div
                        key={index}
                        className="map-controls__search-result"
                        onClick={() => {
                            // TODO: Handle result selection
                            setShowSearchResults(false);
                        }}
                    >
                        <div className="map-controls__search-result-icon">
                            {result.type === 'business' ? '🏢' : '📅'}
                        </div>
                        <div className="map-controls__search-result-content">
                            <div className="map-controls__search-result-title">
                                {result.name}
                            </div>
                            <div className="map-controls__search-result-address">
                                {result.address}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderFilters = () => {
        if (!showFilters) return null;

        const getActiveFilterCount = () => {
            return Object.values(activeFilters).flat().length;
        };

        return (
            <div ref={filtersRef} className="map-controls__filters-panel">
                <div className="map-controls__filters-header">
                    <h3>Filters</h3>
                    {getActiveFilterCount() > 0 && (
                        <button
                            className="map-controls__filters-clear"
                            onClick={clearAllFilters}
                        >
                            Clear All ({getActiveFilterCount()})
                        </button>
                    )}
                </div>

                <div className="map-controls__filters-content">
                    {/* Business Status Filter */}
                    <div className="map-controls__filter-group">
                        <h4>Business Status</h4>
                        {['Active', 'Pending', 'Suspended'].map(status => (
                            <label key={status} className="map-controls__filter-option">
                                <input
                                    type="checkbox"
                                    checked={(activeFilters.businessStatus || []).includes(status)}
                                    onChange={() => handleFilterToggle('businessStatus', status)}
                                />
                                <span>{status}</span>
                            </label>
                        ))}
                    </div>

                    {/* Event Status Filter */}
                    <div className="map-controls__filter-group">
                        <h4>Event Status</h4>
                        {['Upcoming', 'Ongoing', 'Completed'].map(status => (
                            <label key={status} className="map-controls__filter-option">
                                <input
                                    type="checkbox"
                                    checked={(activeFilters.eventStatus || []).includes(status)}
                                    onChange={() => handleFilterToggle('eventStatus', status)}
                                />
                                <span>{status}</span>
                            </label>
                        ))}
                    </div>

                    {/* Event Type Filter */}
                    <div className="map-controls__filter-group">
                        <h4>Event Type</h4>
                        {['Public', 'Private', 'Online'].map(type => (
                            <label key={type} className="map-controls__filter-option">
                                <input
                                    type="checkbox"
                                    checked={(activeFilters.eventType || []).includes(type)}
                                    onChange={() => handleFilterToggle('eventType', type)}
                                />
                                <span>{type}</span>
                            </label>
                        ))}
                    </div>

                    {/* Date Range Filter */}
                    <div className="map-controls__filter-group">
                        <h4>Date Range</h4>
                        <div className="map-controls__date-inputs">
                            <input
                                type="date"
                                value={activeFilters.startDate || ''}
                                onChange={(e) => onFilterChange({ ...activeFilters, startDate: e.target.value })}
                                placeholder="Start Date"
                            />
                            <input
                                type="date"
                                value={activeFilters.endDate || ''}
                                onChange={(e) => onFilterChange({ ...activeFilters, endDate: e.target.value })}
                                placeholder="End Date"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStyleSelector = () => {
        if (!showStyleSelector) return null;

        return (
            <div ref={styleRef} className="map-controls__style-panel">
                <h3>Map Style</h3>
                <div className="map-controls__style-options">
                    {mapStyles.map(style => (
                        <button
                            key={style.id}
                            className={`map-controls__style-option ${mapStyle === style.id ? 'active' : ''}`}
                            onClick={() => handleStyleChange(style.id)}
                        >
                            <span className="map-controls__style-icon">{style.icon}</span>
                            <span className="map-controls__style-name">{style.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <div className={`map-controls ${className} map-controls--${position} map-controls--${theme} ${isExpanded ? 'expanded' : ''}`}>
            {/* Main Controls Container */}
            <div className="map-controls__main">
                {/* Search Section */}
                <div className="map-controls__search">
                    <form onSubmit={handleSearchSubmit} className="map-controls__search-form">
                        <div className="map-controls__search-input-wrapper">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={localSearchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search businesses, events..."
                                className="map-controls__search-input"
                                aria-label="Search map"
                            />
                            {localSearchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="map-controls__search-clear"
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                            <button
                                type="submit"
                                className="map-controls__search-submit"
                                disabled={isLoading}
                                aria-label="Submit search"
                            >
                                {isLoading ? '⏳' : '🔍'}
                            </button>
                        </div>
                    </form>
                    {renderSearchResults()}
                </div>

                {/* Action Buttons */}
                <div className="map-controls__actions">
                    {/* Filters Toggle */}
                    <button
                        className={`map-controls__action-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        aria-label="Toggle filters"
                        title="Filters"
                    >
                        🔽
                        {Object.values(activeFilters).flat().length > 0 && (
                            <span className="map-controls__filter-count">
                                {Object.values(activeFilters).flat().length}
                            </span>
                        )}
                    </button>

                    {/* Location Button */}
                    <button
                        className={`map-controls__action-btn ${userLocation ? 'has-location' : ''}`}
                        onClick={handleLocationClick}
                        disabled={isLoading}
                        aria-label="Get current location"
                        title="Get Location"
                    >
                        📍
                    </button>

                    {/* Location Tracking Toggle */}
                    <button
                        className={`map-controls__action-btn ${isTrackingLocation ? 'active' : ''}`}
                        onClick={handleTrackingToggle}
                        aria-label="Toggle location tracking"
                        title="Track Location"
                    >
                        {isTrackingLocation ? '🎯' : '📡'}
                    </button>

                    {/* Map Style Toggle */}
                    <button
                        className={`map-controls__action-btn ${showStyleSelector ? 'active' : ''}`}
                        onClick={() => setShowStyleSelector(!showStyleSelector)}
                        aria-label="Change map style"
                        title="Map Style"
                    >
                        🎨
                    </button>

                    {/* Expand/Collapse Toggle */}
                    <button
                        className={`map-controls__action-btn ${isExpanded ? 'active' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label="Toggle controls"
                        title="Toggle Controls"
                    >
                        {isExpanded ? '⬆️' : '⬇️'}
                    </button>
                </div>
            </div>

            {/* Panels */}
            {renderFilters()}
            {renderStyleSelector()}
        </div>
    );
};

export default MapControls;