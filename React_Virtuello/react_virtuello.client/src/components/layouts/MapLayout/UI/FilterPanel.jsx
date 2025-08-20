/**
 * FilterPanel Component - Advanced Map Filtering Interface
 * Provides comprehensive filtering options for businesses, events, and map data
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './filterpanel.css';

const FilterPanel = ({
    onFiltersChange,
    initialFilters = {},
    availableFilters = {},
    businessTags = [],
    eventCategories = [],
    isLoading = false,
    resultCount = 0,
    showResultCount = true,
    showResetButton = true,
    showPresets = true,
    compactMode = false,
    className = '',
    theme = 'light'
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [filters, setFilters] = useState({
        // Business filters
        businessStatus: '',
        businessTags: [],
        businessRating: 0,
        businessOpenNow: false,

        // Event filters
        eventStatus: '',
        eventCategories: [],
        eventType: '',
        eventDateRange: { start: '', end: '' },
        eventUpcomingOnly: false,

        // Location filters
        searchRadius: 10, // km
        withinBounds: true,

        // General filters
        searchQuery: '',
        sortBy: 'distance',
        showOnlyWithImages: false,
        excludeRejected: true,

        ...initialFilters
    });

    const [expandedSections, setExpandedSections] = useState({
        business: !compactMode,
        event: !compactMode,
        location: !compactMode,
        general: !compactMode
    });

    const [isCollapsed, setIsCollapsed] = useState(compactMode);
    const [savedPresets, setSavedPresets] = useState([]);

    // =============================================================================
    // FILTER PRESETS
    // =============================================================================

    const filterPresets = useMemo(() => [
        {
            id: 'all',
            name: 'Show All',
            icon: '🌍',
            description: 'Show all available items',
            filters: {
                businessStatus: '',
                eventStatus: '',
                businessTags: [],
                eventCategories: [],
                businessRating: 0,
                searchRadius: 50
            }
        },
        {
            id: 'nearby',
            name: 'Nearby',
            icon: '📍',
            description: 'Items within 5km',
            filters: {
                searchRadius: 5,
                withinBounds: true,
                sortBy: 'distance'
            }
        },
        {
            id: 'active-businesses',
            name: 'Active Businesses',
            icon: '🏢',
            description: 'Active businesses only',
            filters: {
                businessStatus: 'Active',
                businessRating: 3,
                businessOpenNow: true
            }
        },
        {
            id: 'upcoming-events',
            name: 'Upcoming Events',
            icon: '📅',
            description: 'Events happening soon',
            filters: {
                eventStatus: 'Upcoming',
                eventUpcomingOnly: true,
                sortBy: 'date'
            }
        },
        {
            id: 'top-rated',
            name: 'Top Rated',
            icon: '⭐',
            description: 'Highly rated places',
            filters: {
                businessRating: 4,
                showOnlyWithImages: true,
                sortBy: 'rating'
            }
        }
    ], []);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle filter change
     */
    const handleFilterChange = useCallback((filterKey, value) => {
        const newFilters = { ...filters, [filterKey]: value };
        setFilters(newFilters);

        if (onFiltersChange) {
            onFiltersChange(newFilters);
        }
    }, [filters, onFiltersChange]);

    /**
     * Handle array filter change (tags, categories)
     */
    const handleArrayFilterChange = useCallback((filterKey, value, checked) => {
        const currentArray = filters[filterKey] || [];
        let newArray;

        if (checked) {
            newArray = [...currentArray, value];
        } else {
            newArray = currentArray.filter(item => item !== value);
        }

        handleFilterChange(filterKey, newArray);
    }, [filters, handleFilterChange]);

    /**
     * Handle date range change
     */
    const handleDateRangeChange = useCallback((dateType, value) => {
        const newDateRange = {
            ...filters.eventDateRange,
            [dateType]: value
        };
        handleFilterChange('eventDateRange', newDateRange);
    }, [filters.eventDateRange, handleFilterChange]);

    /**
     * Apply filter preset
     */
    const applyPreset = useCallback((preset) => {
        const newFilters = { ...filters, ...preset.filters };
        setFilters(newFilters);

        if (onFiltersChange) {
            onFiltersChange(newFilters);
        }
    }, [filters, onFiltersChange]);

    /**
     * Reset all filters
     */
    const resetFilters = useCallback(() => {
        const resetFilters = {
            businessStatus: '',
            businessTags: [],
            businessRating: 0,
            businessOpenNow: false,
            eventStatus: '',
            eventCategories: [],
            eventType: '',
            eventDateRange: { start: '', end: '' },
            eventUpcomingOnly: false,
            searchRadius: 10,
            withinBounds: true,
            searchQuery: '',
            sortBy: 'distance',
            showOnlyWithImages: false,
            excludeRejected: true
        };

        setFilters(resetFilters);

        if (onFiltersChange) {
            onFiltersChange(resetFilters);
        }
    }, [onFiltersChange]);

    /**
     * Toggle section expansion
     */
    const toggleSection = useCallback((section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    /**
     * Toggle panel collapsed state
     */
    const toggleCollapsed = useCallback(() => {
        setIsCollapsed(!isCollapsed);
    }, [isCollapsed]);

    /**
     * Get active filter count
     */
    const getActiveFilterCount = useMemo(() => {
        let count = 0;

        // Count non-default values
        if (filters.businessStatus) count++;
        if (filters.businessTags.length > 0) count++;
        if (filters.businessRating > 0) count++;
        if (filters.businessOpenNow) count++;
        if (filters.eventStatus) count++;
        if (filters.eventCategories.length > 0) count++;
        if (filters.eventType) count++;
        if (filters.eventDateRange.start || filters.eventDateRange.end) count++;
        if (filters.eventUpcomingOnly) count++;
        if (filters.searchRadius !== 10) count++;
        if (!filters.withinBounds) count++;
        if (filters.searchQuery) count++;
        if (filters.sortBy !== 'distance') count++;
        if (filters.showOnlyWithImages) count++;
        if (!filters.excludeRejected) count++;

        return count;
    }, [filters]);

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    /**
     * Render section header
     */
    const renderSectionHeader = useCallback((title, icon, section) => {
        const isExpanded = expandedSections[section];

        return (
            <div className="filter-panel__section-header">
                <button
                    className={`filter-panel__section-toggle ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleSection(section)}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} section`}
                >
                    <span className="filter-panel__section-icon">{icon}</span>
                    <span className="filter-panel__section-title">{title}</span>
                    <span className="filter-panel__section-arrow">
                        {isExpanded ? '▼' : '▶'}
                    </span>
                </button>
            </div>
        );
    }, [expandedSections, toggleSection]);

    /**
     * Render business filters
     */
    const renderBusinessFilters = useCallback(() => {
        if (!expandedSections.business) return null;

        return (
            <div className="filter-panel__section-content">
                {/* Business Status */}
                <div className="filter-panel__field">
                    <label className="filter-panel__label">Status</label>
                    <select
                        className="filter-panel__select"
                        value={filters.businessStatus}
                        onChange={(e) => handleFilterChange('businessStatus', e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Suspended">Suspended</option>
                    </select>
                </div>

                {/* Business Tags */}
                {businessTags.length > 0 && (
                    <div className="filter-panel__field">
                        <label className="filter-panel__label">
                            Tags ({filters.businessTags.length} selected)
                        </label>
                        <div className="filter-panel__checkboxes">
                            {businessTags.map(tag => (
                                <label key={tag.id} className="filter-panel__checkbox">
                                    <input
                                        type="checkbox"
                                        checked={filters.businessTags.includes(tag.id)}
                                        onChange={(e) => handleArrayFilterChange(
                                            'businessTags',
                                            tag.id,
                                            e.target.checked
                                        )}
                                    />
                                    <span className="filter-panel__checkbox-label">
                                        {tag.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Minimum Rating */}
                <div className="filter-panel__field">
                    <label className="filter-panel__label">
                        Minimum Rating: {filters.businessRating > 0 ? `${filters.businessRating}+ stars` : 'Any'}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={filters.businessRating}
                        onChange={(e) => handleFilterChange('businessRating', parseInt(e.target.value))}
                        className="filter-panel__range"
                    />
                    <div className="filter-panel__range-labels">
                        <span>Any</span>
                        <span>5⭐</span>
                    </div>
                </div>

                {/* Open Now */}
                <div className="filter-panel__field">
                    <label className="filter-panel__checkbox">
                        <input
                            type="checkbox"
                            checked={filters.businessOpenNow}
                            onChange={(e) => handleFilterChange('businessOpenNow', e.target.checked)}
                        />
                        <span className="filter-panel__checkbox-label">
                            Open now
                        </span>
                    </label>
                </div>
            </div>
        );
    }, [expandedSections.business, filters, businessTags, handleFilterChange, handleArrayFilterChange]);

    /**
     * Render event filters
     */
    const renderEventFilters = useCallback(() => {
        if (!expandedSections.event) return null;

        return (
            <div className="filter-panel__section-content">
                {/* Event Status */}
                <div className="filter-panel__field">
                    <label className="filter-panel__label">Status</label>
                    <select
                        className="filter-panel__select"
                        value={filters.eventStatus}
                        onChange={(e) => handleFilterChange('eventStatus', e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Event Type */}
                <div className="filter-panel__field">
                    <label className="filter-panel__label">Type</label>
                    <select
                        className="filter-panel__select"
                        value={filters.eventType}
                        onChange={(e) => handleFilterChange('eventType', e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Public">Public</option>
                        <option value="Private">Private</option>
                        <option value="Online">Online</option>
                    </select>
                </div>

                {/* Event Categories */}
                {eventCategories.length > 0 && (
                    <div className="filter-panel__field">
                        <label className="filter-panel__label">
                            Categories ({filters.eventCategories.length} selected)
                        </label>
                        <div className="filter-panel__checkboxes">
                            {eventCategories.map(category => (
                                <label key={category.id} className="filter-panel__checkbox">
                                    <input
                                        type="checkbox"
                                        checked={filters.eventCategories.includes(category.id)}
                                        onChange={(e) => handleArrayFilterChange(
                                            'eventCategories',
                                            category.id,
                                            e.target.checked
                                        )}
                                    />
                                    <span className="filter-panel__checkbox-label">
                                        {category.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Date Range */}
                <div className="filter-panel__field">
                    <label className="filter-panel__label">Date Range</label>
                    <div className="filter-panel__date-range">
                        <input
                            type="date"
                            value={filters.eventDateRange.start}
                            onChange={(e) => handleDateRangeChange('start', e.target.value)}
                            className="filter-panel__date"
                            placeholder="Start date"
                        />
                        <span className="filter-panel__date-separator">to</span>
                        <input
                            type="date"
                            value={filters.eventDateRange.end}
                            onChange={(e) => handleDateRangeChange('end', e.target.value)}
                            className="filter-panel__date"
                            placeholder="End date"
                        />
                    </div>
                </div>

                {/* Upcoming Only */}
                <div className="filter-panel__field">
                    <label className="filter-panel__checkbox">
                        <input
                            type="checkbox"
                            checked={filters.eventUpcomingOnly}
                            onChange={(e) => handleFilterChange('eventUpcomingOnly', e.target.checked)}
                        />
                        <span className="filter-panel__checkbox-label">
                            Upcoming events only
                        </span>
                    </label>
                </div>
            </div>
        );
    }, [expandedSections.event, filters, eventCategories, handleFilterChange, handleArrayFilterChange, handleDateRangeChange]);

    /**
     * Render location filters
     */
    const renderLocationFilters = useCallback(() => {
        if (!expandedSections.location) return null;

        return (
            <div className="filter-panel__section-content">
                {/* Search Radius */}
                <div className="filter-panel__field">
                    <label className="filter-panel__label">
                        Search Radius: {filters.searchRadius}km
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={filters.searchRadius}
                        onChange={(e) => handleFilterChange('searchRadius', parseInt(e.target.value))}
                        className="filter-panel__range"
                    />
                    <div className="filter-panel__range-labels">
                        <span>1km</span>
                        <span>100km</span>
                    </div>
                </div>

                {/* Within Bounds */}
                <div className="filter-panel__field">
                    <label className="filter-panel__checkbox">
                        <input
                            type="checkbox"
                            checked={filters.withinBounds}
                            onChange={(e) => handleFilterChange('withinBounds', e.target.checked)}
                        />
                        <span className="filter-panel__checkbox-label">
                            Only show items in current map view
                        </span>
                    </label>
                </div>
            </div>
        );
    }, [expandedSections.location, filters, handleFilterChange]);

    /**
     * Render general filters
     */
    const renderGeneralFilters = useCallback(() => {
        if (!expandedSections.general) return null;

        return (
            <div className="filter-panel__section-content">
                {/* Sort By */}
                <div className="filter-panel__field">
                    <label className="filter-panel__label">Sort By</label>
                    <select
                        className="filter-panel__select"
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                        <option value="distance">Distance</option>
                        <option value="name">Name</option>
                        <option value="rating">Rating</option>
                        <option value="date">Date Added</option>
                        <option value="popularity">Popularity</option>
                    </select>
                </div>

                {/* Show Only With Images */}
                <div className="filter-panel__field">
                    <label className="filter-panel__checkbox">
                        <input
                            type="checkbox"
                            checked={filters.showOnlyWithImages}
                            onChange={(e) => handleFilterChange('showOnlyWithImages', e.target.checked)}
                        />
                        <span className="filter-panel__checkbox-label">
                            Only show items with images
                        </span>
                    </label>
                </div>

                {/* Exclude Rejected */}
                <div className="filter-panel__field">
                    <label className="filter-panel__checkbox">
                        <input
                            type="checkbox"
                            checked={filters.excludeRejected}
                            onChange={(e) => handleFilterChange('excludeRejected', e.target.checked)}
                        />
                        <span className="filter-panel__checkbox-label">
                            Exclude rejected items
                        </span>
                    </label>
                </div>
            </div>
        );
    }, [expandedSections.general, filters, handleFilterChange]);

    /**
     * Render filter presets
     */
    const renderPresets = useCallback(() => {
        if (!showPresets) return null;

        return (
            <div className="filter-panel__presets">
                <h4 className="filter-panel__presets-title">Quick Filters</h4>
                <div className="filter-panel__presets-grid">
                    {filterPresets.map(preset => (
                        <button
                            key={preset.id}
                            className="filter-panel__preset"
                            onClick={() => applyPreset(preset)}
                            title={preset.description}
                        >
                            <span className="filter-panel__preset-icon">{preset.icon}</span>
                            <span className="filter-panel__preset-name">{preset.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }, [showPresets, filterPresets, applyPreset]);

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    return (
        <div className={`filter-panel ${className} theme-${theme} ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            {/* Header */}
            <div className="filter-panel__header">
                <div className="filter-panel__title-section">
                    <h3 className="filter-panel__title">
                        🔍 Filters
                        {getActiveFilterCount > 0 && (
                            <span className="filter-panel__count">({getActiveFilterCount})</span>
                        )}
                    </h3>
                    <button
                        className="filter-panel__collapse"
                        onClick={toggleCollapsed}
                        aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
                    >
                        {isCollapsed ? '⬇️' : '⬆️'}
                    </button>
                </div>

                {/* Result Count */}
                {showResultCount && !isCollapsed && (
                    <div className="filter-panel__results">
                        {isLoading ? (
                            <span className="filter-panel__loading">Loading...</span>
                        ) : (
                            <span className="filter-panel__result-count">
                                {resultCount} result{resultCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {!isCollapsed && (
                <div className="filter-panel__content">
                    {/* Filter Presets */}
                    {renderPresets()}

                    {/* Business Filters */}
                    <div className="filter-panel__section">
                        {renderSectionHeader('Businesses', '🏢', 'business')}
                        {renderBusinessFilters()}
                    </div>

                    {/* Event Filters */}
                    <div className="filter-panel__section">
                        {renderSectionHeader('Events', '📅', 'event')}
                        {renderEventFilters()}
                    </div>

                    {/* Location Filters */}
                    <div className="filter-panel__section">
                        {renderSectionHeader('Location', '📍', 'location')}
                        {renderLocationFilters()}
                    </div>

                    {/* General Filters */}
                    <div className="filter-panel__section">
                        {renderSectionHeader('General', '⚙️', 'general')}
                        {renderGeneralFilters()}
                    </div>

                    {/* Actions */}
                    {showResetButton && (
                        <div className="filter-panel__actions">
                            <button
                                className="filter-panel__reset"
                                onClick={resetFilters}
                                disabled={getActiveFilterCount === 0}
                            >
                                🔄 Reset All Filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilterPanel;