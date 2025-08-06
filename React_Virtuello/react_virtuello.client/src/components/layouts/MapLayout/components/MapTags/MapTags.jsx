import React, { useState, useEffect } from 'react';
import './MapTags.css';

// Dummy data matching the model structure
const dummyBusinessTags = [
    { id: '1', name: 'Restaurant', iconPath: null, businessCount: 15 },
    { id: '2', name: 'Hotel', iconPath: null, businessCount: 8 },
    { id: '3', name: 'Shopping', iconPath: null, businessCount: 23 },
    { id: '4', name: 'Entertainment', iconPath: null, businessCount: 12 },
    { id: '5', name: 'Healthcare', iconPath: null, businessCount: 6 },
    { id: '6', name: 'Education', iconPath: null, businessCount: 9 },
    { id: '7', name: 'Automotive', iconPath: null, businessCount: 4 },
    { id: '8', name: 'Beauty & Spa', iconPath: null, businessCount: 11 },
    { id: '9', name: 'Sports & Recreation', iconPath: null, businessCount: 7 },
    { id: '10', name: 'Professional Services', iconPath: null, businessCount: 14 },
];

const dummyEventCategories = [
    { id: '1', name: 'Conference', eventCount: 5 },
    { id: '2', name: 'Workshop', eventCount: 8 },
    { id: '3', name: 'Exhibition', eventCount: 3 },
    { id: '4', name: 'Concert', eventCount: 12 },
    { id: '5', name: 'Sports', eventCount: 6 },
    { id: '6', name: 'Festival', eventCount: 4 },
    { id: '7', name: 'Other', eventCount: 9 },
];

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
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [businessTags, setBusinessTags] = useState(dummyBusinessTags);
    const [eventCategories, setEventCategories] = useState(dummyEventCategories);

    // Check if device is mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // Future API integration points
    // TODO: Replace dummy data with API calls
    // useEffect(() => {
    //     const fetchBusinessTags = async () => {
    //         try {
    //             const response = await api.get('/api/tags/business');
    //             setBusinessTags(response.data);
    //         } catch (error) {
    //             console.error('Failed to fetch business tags:', error);
    //         }
    //     };
    //
    //     const fetchEventCategories = async () => {
    //         try {
    //             const response = await api.get('/api/categories/event');
    //             setEventCategories(response.data);
    //         } catch (error) {
    //             console.error('Failed to fetch event categories:', error);
    //         }
    //     };
    //
    //     fetchBusinessTags();
    //     fetchEventCategories();
    // }, []);

    const handleTagClick = (tag) => {
        if (selectedTags.some(t => t.id === tag.id)) {
            onTagDeselect(tag);
        } else {
            onTagSelect(tag);
        }
    };

    const handleCategoryClick = (category) => {
        if (selectedCategories.some(c => c.id === category.id)) {
            onCategoryDeselect(category);
        } else {
            onCategorySelect(category);
        }
    };

    const clearAllFilters = () => {
        selectedTags.forEach(tag => onTagDeselect(tag));
        selectedCategories.forEach(category => onCategoryDeselect(category));
    };

    const hasActiveFilters = selectedTags.length > 0 || selectedCategories.length > 0;

    return (
        <>
            {/* Mobile Toggle Button */}
            {isMobile && (
                <button
                    className="map-tags__mobile-toggle"
                    onClick={onToggleVisibility}
                    aria-label={isVisible ? "Hide filters" : "Show filters"}
                    title={isVisible ? "Hide filters" : "Show filters"}
                >
                    <svg
                        className="map-tags__mobile-toggle-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {hasActiveFilters && (
                        <span className="map-tags__mobile-toggle-badge">
                            {selectedTags.length + selectedCategories.length}
                        </span>
                    )}
                </button>
            )}

            {/* Tags Panel */}
            <div className={`map-tags ${className} ${isVisible || !isMobile ? 'map-tags--visible' : ''}`}>
                {/* Mobile Backdrop */}
                {isMobile && isVisible && (
                    <div
                        className="map-tags__backdrop"
                        onClick={onToggleVisibility}
                        aria-hidden="true"
                    />
                )}

                {/* Tags Container */}
                <div className="map-tags__container">
                    {/* Header */}
                    <div className="map-tags__header">
                        <h3 className="map-tags__title">Filters</h3>
                        <div className="map-tags__header-actions">
                            {hasActiveFilters && (
                                <button
                                    className="map-tags__clear-all"
                                    onClick={clearAllFilters}
                                    title="Clear all filters"
                                >
                                    Clear All
                                </button>
                            )}
                            {isMobile && (
                                <button
                                    className="map-tags__close-btn"
                                    onClick={onToggleVisibility}
                                    aria-label="Close filters"
                                    title="Close filters"
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M18 6L6 18M6 6L18 18"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="map-tags__content">
                        {/* Business Tags Section */}
                        <div className="map-tags__section">
                            <h4 className="map-tags__section-title">Business Categories</h4>
                            <div className="map-tags__list">
                                {businessTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        className={`map-tags__item ${selectedTags.some(t => t.id === tag.id) ? 'map-tags__item--active' : ''
                                            }`}
                                        onClick={() => handleTagClick(tag)}
                                        title={`Filter by ${tag.name} (${tag.businessCount} businesses)`}
                                    >
                                        <span className="map-tags__item-name">{tag.name}</span>
                                        <span className="map-tags__item-count">{tag.businessCount}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Event Categories Section */}
                        <div className="map-tags__section">
                            <h4 className="map-tags__section-title">Event Categories</h4>
                            <div className="map-tags__list">
                                {eventCategories.map(category => (
                                    <button
                                        key={category.id}
                                        className={`map-tags__item ${selectedCategories.some(c => c.id === category.id) ? 'map-tags__item--active' : ''
                                            }`}
                                        onClick={() => handleCategoryClick(category)}
                                        title={`Filter by ${category.name} (${category.eventCount} events)`}
                                    >
                                        <span className="map-tags__item-name">{category.name}</span>
                                        <span className="map-tags__item-count">{category.eventCount}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active Filters Summary */}
                        {hasActiveFilters && (
                            <div className="map-tags__active-filters">
                                <div className="map-tags__active-filters-title">Active Filters:</div>
                                <div className="map-tags__active-filters-list">
                                    {selectedTags.map(tag => (
                                        <span key={`tag-${tag.id}`} className="map-tags__active-filter">
                                            {tag.name}
                                            <button
                                                className="map-tags__remove-filter"
                                                onClick={() => onTagDeselect(tag)}
                                                aria-label={`Remove ${tag.name} filter`}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                    <path
                                                        d="M18 6L6 18M6 6L18 18"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                    {selectedCategories.map(category => (
                                        <span key={`cat-${category.id}`} className="map-tags__active-filter">
                                            {category.name}
                                            <button
                                                className="map-tags__remove-filter"
                                                onClick={() => onCategoryDeselect(category)}
                                                aria-label={`Remove ${category.name} filter`}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                    <path
                                                        d="M18 6L6 18M6 6L18 18"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MapTags;