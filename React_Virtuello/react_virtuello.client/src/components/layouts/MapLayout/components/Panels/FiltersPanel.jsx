// =============================================================================
// FILTERS PANEL COMPONENT - Advanced sliding filter panel for map
// =============================================================================
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapFilters } from '../../hooks/useMapFilters';
import './FiltersPanel.css';

const FiltersPanel = ({
    // Panel configuration
    position = 'left', // 'left', 'right', 'bottom'
    isVisible = false,
    onClose = () => { },
    className = '',

    // Filter data
    tags = [],
    categories = [],
    selectedTags = [],
    selectedCategories = [],

    // Filter actions
    onTagSelect = () => { },
    onTagDeselect = () => { },
    onCategorySelect = () => { },
    onCategoryDeselect = () => { },
    onClearAll = () => { },

    // Additional props
    showBusinessFilters = true,
    showEventFilters = true,
    showQuickFilters = true,
    showAdvancedFilters = true,
    userLocation = null
}) => {
    const { t } = useTranslation();
    const panelRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('business');
    const [quickFilters, setQuickFilters] = useState({
        openNow: false,
        nearMe: false,
        popular: false,
        recentlyAdded: false,
        hasImages: false,
        freeEvents: false,
        todayEvents: false,
        thisWeekend: false
    });
    const [advancedFilters, setAdvancedFilters] = useState({
        priceRange: [0, 1000],
        distance: 10,
        rating: 0,
        hasPhotos: false,
        hasReviews: false,
        isVerified: false
    });

    // Filter search results
    const filteredTags = useMemo(() => {
        return tags.filter(tag =>
            tag.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tags, searchTerm]);

    const filteredCategories = useMemo(() => {
        return categories.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    // Calculate total active filters
    const totalActiveFilters = useMemo(() => {
        const quickFiltersCount = Object.values(quickFilters).filter(Boolean).length;
        const advancedFiltersCount = Object.values(advancedFilters).filter((value, index) => {
            // Custom logic for different filter types
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number' && index === 2) return value > 0; // rating
            if (Array.isArray(value)) return value[0] > 0 || value[1] < 1000; // price range
            return false;
        }).length;

        return selectedTags.length + selectedCategories.length + quickFiltersCount + advancedFiltersCount;
    }, [selectedTags.length, selectedCategories.length, quickFilters, advancedFilters]);

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isVisible, onClose]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isVisible, onClose]);

    // Quick filter handlers
    const handleQuickFilterToggle = useCallback((filterKey) => {
        setQuickFilters(prev => ({
            ...prev,
            [filterKey]: !prev[filterKey]
        }));
    }, []);

    // Advanced filter handlers
    const handleAdvancedFilterChange = useCallback((filterKey, value) => {
        setAdvancedFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
    }, []);

    // Tag handlers
    const handleTagToggle = useCallback((tagId) => {
        if (selectedTags.includes(tagId)) {
            onTagDeselect(tagId);
        } else {
            onTagSelect(tagId);
        }
    }, [selectedTags, onTagSelect, onTagDeselect]);

    // Category handlers
    const handleCategoryToggle = useCallback((categoryId) => {
        if (selectedCategories.includes(categoryId)) {
            onCategoryDeselect(categoryId);
        } else {
            onCategorySelect(categoryId);
        }
    }, [selectedCategories, onCategorySelect, onCategoryDeselect]);

    // Clear all filters
    const handleClearAll = useCallback(() => {
        setQuickFilters({
            openNow: false,
            nearMe: false,
            popular: false,
            recentlyAdded: false,
            hasImages: false,
            freeEvents: false,
            todayEvents: false,
            thisWeekend: false
        });
        setAdvancedFilters({
            priceRange: [0, 1000],
            distance: 10,
            rating: 0,
            hasPhotos: false,
            hasReviews: false,
            isVerified: false
        });
        setSearchTerm('');
        onClearAll();
    }, [onClearAll]);

    // Quick filters configuration
    const quickFiltersConfig = useMemo(() => ({
        business: [
            {
                key: 'openNow',
                label: t('filters.openNow', 'Open Now'),
                icon: '🕐',
                description: t('filters.openNowDesc', 'Show only businesses open right now')
            },
            {
                key: 'nearMe',
                label: t('filters.nearMe', 'Near Me'),
                icon: '📍',
                description: t('filters.nearMeDesc', 'Show businesses within 1km'),
                disabled: !userLocation
            },
            {
                key: 'popular',
                label: t('filters.popular', 'Popular'),
                icon: '⭐',
                description: t('filters.popularDesc', 'Most visited businesses')
            },
            {
                key: 'hasImages',
                label: t('filters.hasImages', 'Has Photos'),
                icon: '📷',
                description: t('filters.hasImagesDesc', 'Show businesses with photos')
            }
        ],
        event: [
            {
                key: 'freeEvents',
                label: t('filters.freeEvents', 'Free Events'),
                icon: '🆓',
                description: t('filters.freeEventsDesc', 'Show only free events')
            },
            {
                key: 'todayEvents',
                label: t('filters.todayEvents', 'Today'),
                icon: '📅',
                description: t('filters.todayEventsDesc', 'Events happening today')
            },
            {
                key: 'thisWeekend',
                label: t('filters.thisWeekend', 'This Weekend'),
                icon: '🎉',
                description: t('filters.thisWeekendDesc', 'Events this weekend')
            }
        ]
    }), [t, userLocation]);

    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="filters-panel__backdrop" onClick={onClose} />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`filters-panel filters-panel--${position} ${className}`}
                role="dialog"
                aria-labelledby="filters-panel-title"
                aria-modal="true"
            >
                {/* Header */}
                <div className="filters-panel__header">
                    <div className="filters-panel__header-content">
                        <h2 id="filters-panel-title" className="filters-panel__title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {t('filters.title', 'Filters')}
                            {totalActiveFilters > 0 && (
                                <span className="filters-panel__title-badge">
                                    {totalActiveFilters}
                                </span>
                            )}
                        </h2>

                        <div className="filters-panel__header-actions">
                            {/* Clear all button */}
                            {totalActiveFilters > 0 && (
                                <button
                                    className="filters-panel__clear-btn"
                                    onClick={handleClearAll}
                                    title={t('filters.clearAll', 'Clear all filters')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    {t('filters.clearAll', 'Clear All')}
                                </button>
                            )}

                            {/* Close button */}
                            <button
                                className="filters-panel__close-btn"
                                onClick={onClose}
                                aria-label={t('common.close', 'Close')}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M18 6L6 18M6 6l12 12"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="filters-panel__tabs">
                        <button
                            className={`filters-panel__tab ${activeTab === 'business' ? 'filters-panel__tab--active' : ''}`}
                            onClick={() => setActiveTab('business')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            {t('filters.businessesTab', 'Businesses')}
                            {selectedTags.length > 0 && (
                                <span className="filters-panel__tab-badge">{selectedTags.length}</span>
                            )}
                        </button>

                        <button
                            className={`filters-panel__tab ${activeTab === 'event' ? 'filters-panel__tab--active' : ''}`}
                            onClick={() => setActiveTab('event')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            {t('filters.eventsTab', 'Events')}
                            {selectedCategories.length > 0 && (
                                <span className="filters-panel__tab-badge">{selectedCategories.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="filters-panel__content">
                    {/* Quick Filters Section */}
                    {showQuickFilters && (
                        <div className="filters-panel__section">
                            <h3 className="filters-panel__section-title">
                                {t('filters.quickFilters', 'Quick Filters')}
                            </h3>
                            <div className="filters-panel__quick-grid">
                                {quickFiltersConfig[activeTab]?.map((filter) => (
                                    <button
                                        key={filter.key}
                                        className={`filters-panel__quick-filter ${quickFilters[filter.key] ? 'filters-panel__quick-filter--active' : ''
                                            } ${filter.disabled ? 'filters-panel__quick-filter--disabled' : ''}`}
                                        onClick={() => !filter.disabled && handleQuickFilterToggle(filter.key)}
                                        disabled={filter.disabled}
                                        title={filter.description}
                                    >
                                        <span className="filters-panel__quick-filter-icon">
                                            {filter.icon}
                                        </span>
                                        <span className="filters-panel__quick-filter-label">
                                            {filter.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags/Categories Section */}
                    <div className="filters-panel__section">
                        <div className="filters-panel__section-header">
                            <h3 className="filters-panel__section-title">
                                {activeTab === 'business'
                                    ? t('filters.businessTags', 'Business Tags')
                                    : t('filters.eventCategories', 'Event Categories')
                                }
                            </h3>

                            {/* Search */}
                            <div className="filters-panel__search">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={t('filters.searchPlaceholder', 'Search...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="filters-panel__search-input"
                                />
                                {searchTerm && (
                                    <button
                                        className="filters-panel__search-clear"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Items */}
                        <div className="filters-panel__filter-grid">
                            {activeTab === 'business' ? (
                                filteredTags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        className={`filters-panel__filter-item ${selectedTags.includes(tag.id) ? 'filters-panel__filter-item--active' : ''
                                            }`}
                                        onClick={() => handleTagToggle(tag.id)}
                                    >
                                        <span className="filters-panel__filter-name">{tag.name}</span>
                                        {tag.businessCount && (
                                            <span className="filters-panel__filter-count">
                                                {tag.businessCount}
                                            </span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                filteredCategories.map((category) => (
                                    <button
                                        key={category.id}
                                        className={`filters-panel__filter-item ${selectedCategories.includes(category.id) ? 'filters-panel__filter-item--active' : ''
                                            }`}
                                        onClick={() => handleCategoryToggle(category.id)}
                                    >
                                        <span className="filters-panel__filter-name">{category.name}</span>
                                        {category.eventCount && (
                                            <span className="filters-panel__filter-count">
                                                {category.eventCount}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* No results */}
                        {((activeTab === 'business' && filteredTags.length === 0) ||
                            (activeTab === 'event' && filteredCategories.length === 0)) && (
                                <div className="filters-panel__no-results">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    <p>{t('filters.noResults', 'No filters found')}</p>
                                    {searchTerm && (
                                        <button
                                            className="filters-panel__clear-search"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            {t('filters.clearSearch', 'Clear search')}
                                        </button>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* Advanced Filters Section */}
                    {showAdvancedFilters && (
                        <div className="filters-panel__section">
                            <h3 className="filters-panel__section-title">
                                {t('filters.advancedFilters', 'Advanced Filters')}
                            </h3>

                            <div className="filters-panel__advanced-grid">
                                {/* Distance Filter */}
                                {userLocation && (
                                    <div className="filters-panel__advanced-item">
                                        <label className="filters-panel__advanced-label">
                                            {t('filters.distance', 'Distance')} ({advancedFilters.distance}km)
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            step="1"
                                            value={advancedFilters.distance}
                                            onChange={(e) => handleAdvancedFilterChange('distance', parseInt(e.target.value))}
                                            className="filters-panel__range-slider"
                                        />
                                    </div>
                                )}

                                {/* Rating Filter */}
                                <div className="filters-panel__advanced-item">
                                    <label className="filters-panel__advanced-label">
                                        {t('filters.minRating', 'Minimum Rating')}
                                    </label>
                                    <div className="filters-panel__rating-selector">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                className={`filters-panel__rating-star ${rating <= advancedFilters.rating ? 'filters-panel__rating-star--active' : ''
                                                    }`}
                                                onClick={() => handleAdvancedFilterChange('rating',
                                                    rating === advancedFilters.rating ? 0 : rating
                                                )}
                                            >
                                                ⭐
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Boolean Filters */}
                                <div className="filters-panel__advanced-item">
                                    <label className="filters-panel__checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={advancedFilters.hasPhotos}
                                            onChange={(e) => handleAdvancedFilterChange('hasPhotos', e.target.checked)}
                                        />
                                        <span className="filters-panel__checkbox-label">
                                            {t('filters.hasPhotos', 'Has Photos')}
                                        </span>
                                    </label>
                                </div>

                                <div className="filters-panel__advanced-item">
                                    <label className="filters-panel__checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={advancedFilters.hasReviews}
                                            onChange={(e) => handleAdvancedFilterChange('hasReviews', e.target.checked)}
                                        />
                                        <span className="filters-panel__checkbox-label">
                                            {t('filters.hasReviews', 'Has Reviews')}
                                        </span>
                                    </label>
                                </div>

                                <div className="filters-panel__advanced-item">
                                    <label className="filters-panel__checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={advancedFilters.isVerified}
                                            onChange={(e) => handleAdvancedFilterChange('isVerified', e.target.checked)}
                                        />
                                        <span className="filters-panel__checkbox-label">
                                            {t('filters.verified', 'Verified Only')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="filters-panel__footer">
                    <button
                        className="filters-panel__apply-btn"
                        onClick={onClose}
                    >
                        {t('filters.apply', 'Apply Filters')}
                        {totalActiveFilters > 0 && (
                            <span className="filters-panel__apply-badge">
                                {totalActiveFilters}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default FiltersPanel;