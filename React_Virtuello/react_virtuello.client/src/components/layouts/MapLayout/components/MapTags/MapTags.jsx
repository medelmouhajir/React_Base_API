import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapFilters } from '../../../../../hooks/useMapFilters';
import './MapTags.css';

const MapTags = ({
    selectedTags = [],
    selectedCategories = [],
    onTagSelect = () => { },
    onCategorySelect = () => { },
    onTagDeselect = () => { },
    onCategoryDeselect = () => { },
    className = '',
    isVisible = true,
    onToggleVisibility = () => { },
    isMobile = false,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('businesses');
    const [isExpanded, setIsExpanded] = useState(!isMobile);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const scrollContainerRef = useRef(null);

    const {
        tags,
        categories,
        loading: dataLoading,
        error: dataError,
        refreshData
    } = useMapFilters();

    // Filter tags/categories based on search
    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle tab change
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        setSearchTerm(''); // Clear search when switching tabs
    }, []);

    // Handle tag selection
    const handleTagClick = useCallback((tagId) => {
        if (selectedTags.includes(tagId)) {
            onTagDeselect(tagId);
        } else {
            onTagSelect(tagId);
        }
    }, [selectedTags, onTagSelect, onTagDeselect]);

    // Handle category selection
    const handleCategoryClick = useCallback((categoryId) => {
        if (selectedCategories.includes(categoryId)) {
            onCategoryDeselect(categoryId);
        } else {
            onCategorySelect(categoryId);
        }
    }, [selectedCategories, onCategorySelect, onCategoryDeselect]);

    // Handle search input
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    // Refresh data
    const handleRefresh = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            await refreshData();
        } catch (err) {
            setError(err.message || 'Failed to refresh data');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    // Handle visibility toggle
    const handleToggleVisibility = useCallback(() => {
        setIsExpanded(!isExpanded);
        if (onToggleVisibility) {
            onToggleVisibility(!isExpanded);
        }
    }, [isExpanded, onToggleVisibility]);

    // Auto-collapse on mobile when not visible
    useEffect(() => {
        if (isMobile && !isVisible) {
            setIsExpanded(false);
        }
    }, [isMobile, isVisible]);

    // Loading state
    if (dataLoading && tags.length === 0 && categories.length === 0) {
        return (
            <div className={`map-tags ${className} ${isMobile ? 'map-tags--mobile' : ''}`}>
                <div className="map-tags__loading">
                    <div className="map-tags__loading-spinner"></div>
                    <span>{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    // Error state
    if (dataError && !tags.length && !categories.length) {
        return (
            <div className={`map-tags ${className} ${isMobile ? 'map-tags--mobile' : ''}`}>
                <div className="map-tags__error">
                    <span className="map-tags__error-message">{dataError}</span>
                    <button
                        className="map-tags__retry-button"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`map-tags ${className} ${isMobile ? 'map-tags--mobile' : ''} ${!isExpanded ? 'map-tags--collapsed' : ''}`}>
            {/* Header */}
            <div className="map-tags__header">
                <div className="map-tags__title-section">
                    <h3 className="map-tags__title">{t('map.filters')}</h3>
                    <button
                        className="map-tags__toggle"
                        onClick={handleToggleVisibility}
                        aria-label={isExpanded ? t('common.collapse') : t('common.expand')}
                    >
                        <svg
                            className={`map-tags__toggle-icon ${isExpanded ? 'map-tags__toggle-icon--expanded' : ''}`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                        </svg>
                    </button>
                </div>

                {isExpanded && (
                    <button
                        className="map-tags__refresh"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title={t('common.refresh')}
                    >
                        <svg
                            className={`map-tags__refresh-icon ${isLoading ? 'map-tags__refresh-icon--spinning' : ''}`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="map-tags__content">
                    {/* Tabs */}
                    <div className="map-tags__tabs">
                        <button
                            className={`map-tags__tab ${activeTab === 'businesses' ? 'map-tags__tab--active' : ''}`}
                            onClick={() => handleTabChange('businesses')}
                        >
                            {t('map.businesses')} ({filteredTags.length})
                        </button>
                        <button
                            className={`map-tags__tab ${activeTab === 'events' ? 'map-tags__tab--active' : ''}`}
                            onClick={() => handleTabChange('events')}
                        >
                            {t('map.events')} ({filteredCategories.length})
                        </button>
                    </div>

                    {/* Search */}
                    <div className="map-tags__search">
                        <div className="map-tags__search-input-wrapper">
                            <input
                                type="text"
                                placeholder={t('map.search_filters')}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="map-tags__search-input"
                            />
                            {searchTerm && (
                                <button
                                    className="map-tags__search-clear"
                                    onClick={clearSearch}
                                    aria-label={t('common.clear')}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tags/Categories List */}
                    <div
                        className="map-tags__list"
                        ref={scrollContainerRef}
                    >
                        {activeTab === 'businesses' ? (
                            // Business Tags
                            filteredTags.length > 0 ? (
                                filteredTags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        className={`map-tags__item ${selectedTags.includes(tag.id) ? 'map-tags__item--selected' : ''}`}
                                        onClick={() => handleTagClick(tag.id)}
                                    >
                                        <div className="map-tags__item-content">
                                            <div className="map-tags__item-icon">
                                                {tag.iconPath ? (
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL}/${tag.iconPath}`}
                                                        alt={tag.name}
                                                        className="map-tags__item-icon-image"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'block';
                                                        }}
                                                    />
                                                ) : null}
                                                <svg
                                                    className="map-tags__item-icon-default"
                                                    style={{ display: tag.iconPath ? 'none' : 'block' }}
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                                                </svg>
                                            </div>
                                            <div className="map-tags__item-info">
                                                <span className="map-tags__item-name">{tag.name}</span>
                                                <span className="map-tags__item-count">
                                                    {tag.businessCount || 0} {t('map.businesses_count')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="map-tags__empty">
                                    {searchTerm ? t('map.no_tags_found') : t('map.no_tags_available')}
                                </div>
                            )
                        ) : (
                            // Event Categories
                            filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => (
                                    <button
                                        key={category.id}
                                        className={`map-tags__item ${selectedCategories.includes(category.id) ? 'map-tags__item--selected' : ''}`}
                                        onClick={() => handleCategoryClick(category.id)}
                                    >
                                        <div className="map-tags__item-content">
                                            <div className="map-tags__item-icon">
                                                <svg
                                                    className="map-tags__item-icon-default"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                                                </svg>
                                            </div>
                                            <div className="map-tags__item-info">
                                                <span className="map-tags__item-name">{category.name}</span>
                                                <span className="map-tags__item-count">
                                                    {category.eventCount || 0} {t('map.events_count')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="map-tags__empty">
                                    {searchTerm ? t('map.no_categories_found') : t('map.no_categories_available')}
                                </div>
                            )
                        )}
                    </div>

                    {/* Selected Count */}
                    {(selectedTags.length > 0 || selectedCategories.length > 0) && (
                        <div className="map-tags__selected-count">
                            {activeTab === 'businesses' && selectedTags.length > 0 && (
                                <span>{selectedTags.length} {t('map.tags_selected')}</span>
                            )}
                            {activeTab === 'events' && selectedCategories.length > 0 && (
                                <span>{selectedCategories.length} {t('map.categories_selected')}</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MapTags;