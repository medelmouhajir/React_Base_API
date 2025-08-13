import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const [businessTags] = useState(dummyBusinessTags);
    const [eventCategories] = useState(dummyEventCategories);

    // Mobile gesture handling refs and state
    const panelRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [translateY, setTranslateY] = useState(0);

    // Enhanced mobile touch/swipe gesture handling
    const handleTouchStart = useCallback((e) => {
        if (!isMobile) return;

        const touch = e.touches[0];
        setStartY(touch.clientY);
        setCurrentY(touch.clientY);
        setIsDragging(true);
        setTranslateY(0);
    }, [isMobile]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging || !isMobile) return;

        const touch = e.touches[0];
        const diff = touch.clientY - startY;

        // Only allow downward dragging
        if (diff > 0) {
            setCurrentY(touch.clientY);
            setTranslateY(diff);

            // Add resistance when dragging
            const resistance = Math.min(diff / 3, 100);
            if (panelRef.current) {
                panelRef.current.style.transform = `translateY(${resistance}px)`;
                panelRef.current.style.transition = 'none';
            }
        }
    }, [isDragging, startY, isMobile]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging || !isMobile) return;

        setIsDragging(false);

        // Determine if should close based on drag distance
        const dragDistance = currentY - startY;
        const threshold = 120; // Minimum drag distance to close

        if (panelRef.current) {
            panelRef.current.style.transition = 'transform var(--gm-transition-normal) ease-out';

            if (dragDistance > threshold) {
                // Close the panel
                panelRef.current.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    onToggleVisibility();
                }, 200);
            } else {
                // Snap back to original position
                panelRef.current.style.transform = 'translateY(0)';
            }
        }

        setTranslateY(0);
        setStartY(0);
        setCurrentY(0);
    }, [isDragging, currentY, startY, onToggleVisibility, isMobile]);

    // Click outside handler
    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onToggleVisibility();
        }
    }, [onToggleVisibility]);

    // Escape key handler
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isVisible) {
                onToggleVisibility();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleEscape);

            // Prevent body scroll on mobile
            if (isMobile) {
                document.body.style.overflow = 'hidden';
            }
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            if (isMobile) {
                document.body.style.overflow = '';
            }
        };
    }, [isVisible, onToggleVisibility, isMobile]);

    // Icon functions
    const getBusinessIcon = (businessName) => {
        const iconMap = {
            'Restaurant': '🍽️',
            'Hotel': '🏨',
            'Shopping': '🛍️',
            'Entertainment': '🎭',
            'Healthcare': '🏥',
            'Education': '🎓',
            'Automotive': '🚗',
            'Beauty & Spa': '💅',
            'Sports & Recreation': '⚽',
            'Professional Services': '💼',
        };
        return iconMap[businessName] || '📍';
    };

    const getEventIcon = (eventName) => {
        const iconMap = {
            'Conference': '👥',
            'Workshop': '🔧',
            'Exhibition': '🖼️',
            'Concert': '🎵',
            'Sports': '🏆',
            'Festival': '🎪',
            'Networking': '🤝',
            'Cultural': '🎭',
        };
        return iconMap[eventName] || '📅';
    };

    // Click handlers
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

    // Desktop version (unchanged)
    if (!isMobile) {
        return (
            <div className={`gm-tags gm-tags--desktop ${className}`}>
                <div className="gm-tags__panel">
                    <div className="gm-tags__header">
                        <h3 className="gm-tags__title">{t('map.filters')}</h3>
                        {hasActiveFilters && (
                            <span className="gm-tags__filter-badge">
                                {selectedTags.length + selectedCategories.length}
                            </span>
                        )}
                    </div>

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
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

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
    }

    // Enhanced Mobile version
    return (
        <div className={`gm-tags gm-tags--mobile ${className}`}>
            {/* Enhanced Backdrop with better touch handling */}
            <div
                className="gm-tags__backdrop"
                onClick={handleBackdropClick}
                style={{ cursor: 'pointer' }}
            />

            {/* Enhanced Mobile Panel with gesture support */}
            <div
                ref={panelRef}
                className="gm-tags__mobile-panel gm-tags__mobile-panel--enhanced"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: translateY > 0 ? `translateY(${Math.min(translateY / 3, 100)}px)` : undefined,
                    transition: isDragging ? 'none' : 'transform var(--gm-transition-normal) ease-out'
                }}
            >
                {/* Enhanced Header with drag indicator */}
                <div className="gm-tags__header gm-tags__header--enhanced">
                    {/* Drag Indicator */}
                    <div className="gm-tags__drag-indicator" />

                    <div className="gm-tags__header-content">
                        <h3 className="gm-tags__title">{t('map.filters')}</h3>
                        <button
                            className="gm-tags__close-btn gm-tags__close-btn--enhanced"
                            onClick={onToggleVisibility}
                            aria-label={t('common.close')}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Enhanced Filter count indicator */}
                {hasActiveFilters && (
                    <div className="gm-tags__filter-count gm-tags__filter-count--enhanced">
                        <div className="gm-tags__filter-count-content">
                            <span className="gm-tags__filter-count-number">
                                {selectedTags.length + selectedCategories.length}
                            </span>
                            <span className="gm-tags__filter-count-text">
                                {t('map.filters_active')}
                            </span>
                        </div>
                    </div>
                )}

                {/* Enhanced Tabs */}
                <div className="gm-tags__tabs gm-tags__tabs--enhanced">
                    <button
                        className={`gm-tags__tab gm-tags__tab--enhanced ${activeTab === 'businesses' ? 'gm-tags__tab--active' : ''}`}
                        onClick={() => setActiveTab('businesses')}
                    >
                        <span className="gm-tags__tab-icon">🏢</span>
                        <span className="gm-tags__tab-text">
                            {t('map.businesses')}
                            <span className="gm-tags__tab-count">({businessTags.length})</span>
                        </span>
                    </button>
                    <button
                        className={`gm-tags__tab gm-tags__tab--enhanced ${activeTab === 'events' ? 'gm-tags__tab--active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        <span className="gm-tags__tab-icon">📅</span>
                        <span className="gm-tags__tab-text">
                            {t('map.events')}
                            <span className="gm-tags__tab-count">({eventCategories.length})</span>
                        </span>
                    </button>
                </div>

                {/* Enhanced Content */}
                <div className="gm-tags__content gm-tags__content--enhanced">
                    {activeTab === 'businesses' ? (
                        <div className="gm-tags__section gm-tags__section--enhanced">
                            <div className="gm-tags__list gm-tags__list--enhanced">
                                {businessTags.map((tag) => {
                                    const isSelected = selectedTags.some(t => t.id === tag.id);
                                    return (
                                        <div
                                            key={tag.id}
                                            className={`gm-tags__item gm-tags__item--enhanced ${isSelected ? 'gm-tags__item--selected' : ''}`}
                                            onClick={() => handleTagClick(tag)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    handleTagClick(tag);
                                                }
                                            }}
                                        >
                                            <div className="gm-tags__item-content gm-tags__item-content--enhanced">
                                                <div className="gm-tags__item-icon gm-tags__item-icon--enhanced">
                                                    {getBusinessIcon(tag.name)}
                                                </div>
                                                <div className="gm-tags__item-info">
                                                    <span className="gm-tags__item-name">{tag.name}</span>
                                                    <span className="gm-tags__item-count">({tag.businessCount})</span>
                                                </div>
                                                {isSelected && (
                                                    <div className="gm-tags__item-check">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
                        <div className="gm-tags__section gm-tags__section--enhanced">
                            <div className="gm-tags__list gm-tags__list--enhanced">
                                {eventCategories.map((category) => {
                                    const isSelected = selectedCategories.some(c => c.id === category.id);
                                    return (
                                        <div
                                            key={category.id}
                                            className={`gm-tags__item gm-tags__item--enhanced ${isSelected ? 'gm-tags__item--selected' : ''}`}
                                            onClick={() => handleCategoryClick(category)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    handleCategoryClick(category);
                                                }
                                            }}
                                        >
                                            <div className="gm-tags__item-content gm-tags__item-content--enhanced">
                                                <div className="gm-tags__item-icon gm-tags__item-icon--enhanced">
                                                    {getEventIcon(category.name)}
                                                </div>
                                                <div className="gm-tags__item-info">
                                                    <span className="gm-tags__item-name">{category.name}</span>
                                                    <span className="gm-tags__item-count">({category.eventCount})</span>
                                                </div>
                                                {isSelected && (
                                                    <div className="gm-tags__item-check">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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

                {/* Enhanced Actions */}
                {hasActiveFilters && (
                    <div className="gm-tags__actions gm-tags__actions--enhanced">
                        <button
                            className="gm-tags__clear-btn gm-tags__clear-btn--enhanced"
                            onClick={clearAllFilters}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                            {t('map.clear_all')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapTags;