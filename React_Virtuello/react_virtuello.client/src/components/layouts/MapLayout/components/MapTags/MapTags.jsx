import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    { id: '7', name: 'Networking', eventCount: 9 },
    { id: '8', name: 'Cultural', eventCount: 7 },
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
    isMobile = false,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('businesses');
    const [businessTags, setBusinessTags] = useState(dummyBusinessTags);
    const [eventCategories, setEventCategories] = useState(dummyEventCategories);

    // Get icon for business type
    const getBusinessIcon = (tagName) => {
        const icons = {
            'Restaurant': '🍽️',
            'Hotel': '🏨',
            'Shopping': '🛍️',
            'Entertainment': '🎭',
            'Healthcare': '🏥',
            'Education': '🎓',
            'Automotive': '🚗',
            'Beauty & Spa': '💄',
            'Sports & Recreation': '⚽',
            'Professional Services': '💼'
        };
        return icons[tagName] || '📍';
    };

    // Get icon for event category
    const getEventIcon = (categoryName) => {
        const icons = {
            'Conference': '🏢',
            'Workshop': '🔧',
            'Exhibition': '🖼️',
            'Concert': '🎵',
            'Sports': '🏆',
            'Festival': '🎪',
            'Networking': '🤝',
            'Cultural': '🎨'
        };
        return icons[categoryName] || '📅';
    };

    const handleTagClick = (tag) => {
        const isSelected = selectedTags.some(t => t.id === tag.id);
        if (isSelected) {
            onTagDeselect(tag);
        } else {
            onTagSelect(tag);
        }
    };

    const handleCategoryClick = (category) => {
        const isSelected = selectedCategories.some(c => c.id === category.id);
        if (isSelected) {
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

    if (!isVisible) {
        return null;
    }

    // Mobile overlay version
    if (isMobile) {
        return (
            <>
                {/* Backdrop */}
                <div className="gm-tags__backdrop" onClick={onToggleVisibility} />

                {/* Mobile Panel */}
                <div className={`gm-tags gm-tags--mobile ${className}`}>
                    <div className="gm-tags__mobile-panel">
                        {/* Header */}
                        <div className="gm-tags__header">
                            <h3 className="gm-tags__title">{t('map.filters')}</h3>
                            <button
                                className="gm-tags__close-btn"
                                onClick={onToggleVisibility}
                                aria-label={t('common.close')}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>

                        {/* Filter count indicator */}
                        {hasActiveFilters && (
                            <div className="gm-tags__filter-count">
                                {selectedTags.length + selectedCategories.length} {t('map.filters_active')}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="gm-tags__tabs">
                            <button
                                className={`gm-tags__tab ${activeTab === 'businesses' ? 'gm-tags__tab--active' : ''}`}
                                onClick={() => setActiveTab('businesses')}
                            >
                                {t('map.businesses')} ({businessTags.length})
                            </button>
                            <button
                                className={`gm-tags__tab ${activeTab === 'events' ? 'gm-tags__tab--active' : ''}`}
                                onClick={() => setActiveTab('events')}
                            >
                                {t('map.events')} ({eventCategories.length})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="gm-tags__content">
                            {activeTab === 'businesses' ? (
                                <div className="gm-tags__section">
                                    <div className="gm-tags__list">
                                        {businessTags.map((tag) => {
                                            const isSelected = selectedTags.some(t => t.id === tag.id);
                                            return (
                                                <div
                                                    key={tag.id}
                                                    className={`gm-tags__item ${isSelected ? 'gm-tags__item--selected' : ''}`}
                                                    onClick={() => handleTagClick(tag)}
                                                >
                                                    <div className="gm-tags__item-content">
                                                        <div className="gm-tags__item-icon">
                                                            {getBusinessIcon(tag.name)}
                                                        </div>
                                                        <div className="gm-tags__item-info">
                                                            <span className="gm-tags__item-name">{tag.name}</span>
                                                            <span className="gm-tags__item-count">({tag.businessCount})</span>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="gm-tags__item-check">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="gm-tags__section">
                                    <div className="gm-tags__list">
                                        {eventCategories.map((category) => {
                                            const isSelected = selectedCategories.some(c => c.id === category.id);
                                            return (
                                                <div
                                                    key={category.id}
                                                    className={`gm-tags__item ${isSelected ? 'gm-tags__item--selected' : ''}`}
                                                    onClick={() => handleCategoryClick(category)}
                                                >
                                                    <div className="gm-tags__item-content">
                                                        <div className="gm-tags__item-icon">
                                                            {getEventIcon(category.name)}
                                                        </div>
                                                        <div className="gm-tags__item-info">
                                                            <span className="gm-tags__item-name">{category.name}</span>
                                                            <span className="gm-tags__item-count">({category.eventCount})</span>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="gm-tags__item-check">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {hasActiveFilters && (
                            <div className="gm-tags__actions">
                                <button
                                    className="gm-tags__clear-btn"
                                    onClick={clearAllFilters}
                                >
                                    {t('map.clear_all_filters')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }

    // Desktop floating panel version
    return (
        <div className={`gm-tags gm-tags--desktop ${className}`}>
            <div className="gm-tags__panel">
                {/* Header */}
                <div className="gm-tags__header">
                    <h3 className="gm-tags__title">{t('map.filters')}</h3>
                    {hasActiveFilters && (
                        <div className="gm-tags__filter-badge">
                            {selectedTags.length + selectedCategories.length}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="gm-tags__tabs">
                    <button
                        className={`gm-tags__tab ${activeTab === 'businesses' ? 'gm-tags__tab--active' : ''}`}
                        onClick={() => setActiveTab('businesses')}
                    >
                        {t('map.businesses')}
                    </button>
                    <button
                        className={`gm-tags__tab ${activeTab === 'events' ? 'gm-tags__tab--active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        {t('map.events')}
                    </button>
                </div>

                {/* Content */}
                <div className="gm-tags__content">
                    {activeTab === 'businesses' ? (
                        <div className="gm-tags__section">
                            <div className="gm-tags__list">
                                {businessTags.slice(0, 6).map((tag) => {
                                    const isSelected = selectedTags.some(t => t.id === tag.id);
                                    return (
                                        <div
                                            key={tag.id}
                                            className={`gm-tags__item gm-tags__item--compact ${isSelected ? 'gm-tags__item--selected' : ''}`}
                                            onClick={() => handleTagClick(tag)}
                                        >
                                            <div className="gm-tags__item-content">
                                                <div className="gm-tags__item-icon">
                                                    {getBusinessIcon(tag.name)}
                                                </div>
                                                <div className="gm-tags__item-info">
                                                    <span className="gm-tags__item-name">{tag.name}</span>
                                                    <span className="gm-tags__item-count">({tag.businessCount})</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="gm-tags__section">
                            <div className="gm-tags__list">
                                {eventCategories.slice(0, 6).map((category) => {
                                    const isSelected = selectedCategories.some(c => c.id === category.id);
                                    return (
                                        <div
                                            key={category.id}
                                            className={`gm-tags__item gm-tags__item--compact ${isSelected ? 'gm-tags__item--selected' : ''}`}
                                            onClick={() => handleCategoryClick(category)}
                                        >
                                            <div className="gm-tags__item-content">
                                                <div className="gm-tags__item-icon">
                                                    {getEventIcon(category.name)}
                                                </div>
                                                <div className="gm-tags__item-info">
                                                    <span className="gm-tags__item-name">{category.name}</span>
                                                    <span className="gm-tags__item-count">({category.eventCount})</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {hasActiveFilters && (
                    <div className="gm-tags__actions">
                        <button
                            className="gm-tags__clear-btn gm-tags__clear-btn--compact"
                            onClick={clearAllFilters}
                        >
                            {t('map.clear_all')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapTags;