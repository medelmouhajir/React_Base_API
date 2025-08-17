// =============================================================================
// FLOATING FILTERS COMPONENT - Quick filter toggles for map data
// =============================================================================
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapFilters } from '../../hooks/useMapFilters';
import './FloatingFilters.css';

const FloatingFilters = ({
    position = 'bottom-left', // 'bottom-left', 'bottom-center', 'bottom-right'
    className = '',
    showBusinessFilters = true,
    showEventFilters = true,
    showQuickFilters = true,
    showTagsPanel = true,
    compact = false,
    onFiltersChange = () => { },
    onToggleTagsPanel = () => { },
    isTagsPanelVisible = false
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(!compact);
    const [activeQuickFilters, setActiveQuickFilters] = useState(new Set());
    const containerRef = useRef(null);

    const {
        selectedTags,
        selectedCategories,
        filteredBusinesses,
        filteredEvents,
        filterSummary,
        toggleTag,
        toggleCategory,
        clearAllFilters
    } = useMapFilters();

    // Quick filter definitions
    const quickFilters = useMemo(() => [
        {
            id: 'open-now',
            label: t('filters.openNow', 'Open Now'),
            icon: '🕐',
            type: 'business',
            description: t('filters.openNowDesc', 'Show only businesses open right now')
        },
        {
            id: 'nearby',
            label: t('filters.nearby', 'Nearby'),
            icon: '📍',
            type: 'both',
            description: t('filters.nearbyDesc', 'Show items within 1km')
        },
        {
            id: 'popular',
            label: t('filters.popular', 'Popular'),
            icon: '⭐',
            type: 'both',
            description: t('filters.popularDesc', 'Highly rated items')
        },
        {
            id: 'happening-now',
            label: t('filters.happeningNow', 'Live Events'),
            icon: '🎪',
            type: 'event',
            description: t('filters.happeningNowDesc', 'Events happening right now')
        },
        {
            id: 'today',
            label: t('filters.today', 'Today'),
            icon: '📅',
            type: 'event',
            description: t('filters.todayDesc', 'Events happening today')
        },
        {
            id: 'free',
            label: t('filters.free', 'Free'),
            icon: '🆓',
            type: 'event',
            description: t('filters.freeDesc', 'Free events only')
        }
    ], [t]);

    // Filter quick filters based on type
    const availableQuickFilters = useMemo(() => {
        return quickFilters.filter(filter => {
            if (!showBusinessFilters && filter.type === 'business') return false;
            if (!showEventFilters && filter.type === 'event') return false;
            return true;
        });
    }, [quickFilters, showBusinessFilters, showEventFilters]);

    // Handle quick filter toggle
    const handleQuickFilterToggle = useCallback((filterId) => {
        setActiveQuickFilters(prev => {
            const newFilters = new Set(prev);
            if (newFilters.has(filterId)) {
                newFilters.delete(filterId);
            } else {
                newFilters.add(filterId);
            }

            // Notify parent component
            onFiltersChange({
                quickFilters: Array.from(newFilters),
                selectedTags,
                selectedCategories
            });

            return newFilters;
        });
    }, [onFiltersChange, selectedTags, selectedCategories]);

    // Handle clear all filters
    const handleClearAll = useCallback(() => {
        setActiveQuickFilters(new Set());
        clearAllFilters();
        onFiltersChange({
            quickFilters: [],
            selectedTags: [],
            selectedCategories: []
        });
    }, [clearAllFilters, onFiltersChange]);

    // Calculate total active filters
    const totalActiveFilters = useMemo(() => {
        return activeQuickFilters.size + selectedTags.length + selectedCategories.length;
    }, [activeQuickFilters.size, selectedTags.length, selectedCategories.length]);

    // Toggle expanded state
    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    // Handle tags panel toggle
    const handleTagsToggle = useCallback(() => {
        onToggleTagsPanel();
    }, [onToggleTagsPanel]);

    // Auto-collapse on mobile when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                if (window.innerWidth <= 768 && isExpanded) {
                    setIsExpanded(false);
                }
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isExpanded]);

    return (
        <div
            ref={containerRef}
            className={`floating-filters ${className} floating-filters--${position} ${isExpanded ? 'floating-filters--expanded' : ''} ${compact ? 'floating-filters--compact' : ''}`}
        >
            {/* Main container */}
            <div className="floating-filters__container">
                {/* Toggle button (for compact mode) */}
                {compact && (
                    <button
                        className={`floating-filters__toggle ${totalActiveFilters > 0 ? 'floating-filters__toggle--active' : ''}`}
                        onClick={toggleExpanded}
                        aria-label={t('filters.toggleFilters', 'Toggle filters')}
                        aria-expanded={isExpanded}
                    >
                        <div className="floating-filters__toggle-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        {totalActiveFilters > 0 && (
                            <div className="floating-filters__toggle-badge">
                                {totalActiveFilters > 99 ? '99+' : totalActiveFilters}
                            </div>
                        )}
                    </button>
                )}

                {/* Filters panel */}
                <div className={`floating-filters__panel ${(!compact || isExpanded) ? 'floating-filters__panel--visible' : ''}`}>
                    {/* Header */}
                    <div className="floating-filters__header">
                        <div className="floating-filters__title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>{t('filters.title', 'Filters')}</span>
                            {totalActiveFilters > 0 && (
                                <span className="floating-filters__count">
                                    ({totalActiveFilters})
                                </span>
                            )}
                        </div>

                        <div className="floating-filters__header-actions">
                            {/* Clear all button */}
                            {totalActiveFilters > 0 && (
                                <button
                                    className="floating-filters__clear"
                                    onClick={handleClearAll}
                                    title={t('filters.clearAll', 'Clear all filters')}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M18 6L6 18M6 6l12 12"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            )}

                            {/* Tags panel toggle */}
                            {showTagsPanel && (
                                <button
                                    className={`floating-filters__tags-toggle ${isTagsPanelVisible ? 'floating-filters__tags-toggle--active' : ''}`}
                                    onClick={handleTagsToggle}
                                    title={t('filters.toggleTags', 'Toggle tags panel')}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </button>
                            )}

                            {/* Collapse button (compact mode) */}
                            {compact && (
                                <button
                                    className="floating-filters__collapse"
                                    onClick={toggleExpanded}
                                    title={t('filters.collapse', 'Collapse filters')}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M18 15l-6-6-6 6"
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

                    {/* Quick filters */}
                    {showQuickFilters && (
                        <div className="floating-filters__section">
                            <div className="floating-filters__section-title">
                                {t('filters.quickFilters', 'Quick Filters')}
                            </div>
                            <div className="floating-filters__quick-grid">
                                {availableQuickFilters.map(filter => (
                                    <button
                                        key={filter.id}
                                        className={`floating-filters__quick-filter ${activeQuickFilters.has(filter.id) ? 'floating-filters__quick-filter--active' : ''}`}
                                        onClick={() => handleQuickFilterToggle(filter.id)}
                                        title={filter.description}
                                    >
                                        <span className="floating-filters__quick-filter-icon">
                                            {filter.icon}
                                        </span>
                                        <span className="floating-filters__quick-filter-label">
                                            {filter.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results summary */}
                    <div className="floating-filters__section">
                        <div className="floating-filters__results">
                            <div className="floating-filters__result-item">
                                <span className="floating-filters__result-icon">🏪</span>
                                <span className="floating-filters__result-text">
                                    {filteredBusinesses?.length || 0} {t('filters.businesses', 'businesses')}
                                </span>
                            </div>
                            <div className="floating-filters__result-item">
                                <span className="floating-filters__result-icon">📅</span>
                                <span className="floating-filters__result-text">
                                    {filteredEvents?.length || 0} {t('filters.events', 'events')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filter summary */}
                    {filterSummary.hasActiveFilters && (
                        <div className="floating-filters__section">
                            <div className="floating-filters__summary">
                                <div className="floating-filters__summary-text">
                                    {t('filters.activeFilters', 'Active filters')}: {filterSummary.activeFiltersText}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile backdrop */}
            {compact && isExpanded && (
                <div
                    className="floating-filters__backdrop"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
};

export default FloatingFilters;