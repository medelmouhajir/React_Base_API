// =============================================================================
// RESULTS PANEL COMPONENT - Sliding panel for search results with filtering
// =============================================================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
//import { useVirtualizer } from '@tanstack/react-virtual';
import { FixedSizeList as List } from 'react-window';
import { debounce } from 'lodash';
import './ResultsPanel.css';

const ResultsPanel = ({
    businesses = [],
    events = [],
    loading = false,
    error = null,
    isVisible = false,
    position = 'left', // 'left', 'right', 'bottom'
    onItemSelect = () => { },
    onItemHover = () => { },
    onClose = () => { },
    onFilterChange = () => { },
    showTypeToggle = true,
    showSortOptions = true,
    showViewModeToggle = true,
    compact = false,
    className = ''
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'businesses', 'events'
    const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'distance', 'rating', 'name'
    const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'compact'
    const [expandedItems, setExpandedItems] = useState(new Set());
    const [selectedItem, setSelectedItem] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);

    const panelRef = useRef(null);
    const listRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    // Debounced hover handler
    const debouncedHover = useCallback(
        debounce((item) => {
            onItemHover(item);
        }, 150),
        [onItemHover]
    );

    // Combined and sorted results
    const allResults = useMemo(() => {
        const combined = [
            ...businesses.map(b => ({ ...b, type: 'business' })),
            ...events.map(e => ({ ...e, type: 'event' }))
        ];

        // Sort results
        return combined.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return (a.distance || 0) - (b.distance || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'relevance':
                default:
                    // Business logic for relevance scoring
                    const aScore = (a.relevanceScore || 0) + (a.isSponsored ? 10 : 0);
                    const bScore = (b.relevanceScore || 0) + (b.isSponsored ? 10 : 0);
                    return bScore - aScore;
            }
        });
    }, [businesses, events, sortBy]);

    // Filtered results based on active tab
    const filteredResults = useMemo(() => {
        switch (activeTab) {
            case 'businesses':
                return allResults.filter(item => item.type === 'business');
            case 'events':
                return allResults.filter(item => item.type === 'event');
            case 'all':
            default:
                return allResults;
        }
    }, [allResults, activeTab]);

    // Handle item selection
    const handleItemSelect = useCallback((item) => {
        setSelectedItem(item);
        onItemSelect(item);
    }, [onItemSelect]);

    // Handle item hover
    const handleItemHover = useCallback((item) => {
        setHoveredItem(item);
        debouncedHover(item);
    }, [debouncedHover]);

    // Handle item expansion
    const toggleItemExpansion = useCallback((itemId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    }, []);

    // Tab counts
    const tabCounts = useMemo(() => ({
        all: allResults.length,
        businesses: businesses.length,
        events: events.length
    }), [allResults.length, businesses.length, events.length]);

    // Sort options
    const sortOptions = [
        { value: 'relevance', label: t('sort.relevance', 'Relevance') },
        { value: 'distance', label: t('sort.distance', 'Distance') },
        { value: 'rating', label: t('sort.rating', 'Rating') },
        { value: 'name', label: t('sort.name', 'Name') }
    ];

    // Scroll to top when results change
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(0);
        }
    }, [filteredResults]);

    // Handle scroll events for infinite loading
    const handleScroll = useCallback((scrollTop) => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            // Trigger load more if near bottom
            const container = panelRef.current;
            if (container) {
                const { scrollHeight, clientHeight } = container;
                const threshold = scrollHeight - clientHeight - 100;

                if (scrollTop > threshold && !loading) {
                    // onLoadMore could be called here if pagination is needed
                }
            }
        }, 100);
    }, [loading]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            debouncedHover.cancel();
        };
    }, [debouncedHover]);

    // Result Item Component
    const ResultItem = useCallback(({ index, style }) => {
        const item = filteredResults[index];
        const isExpanded = expandedItems.has(item.id);
        const isSelected = selectedItem?.id === item.id;
        const isHovered = hoveredItem?.id === item.id;

        if (!item) return null;

        return (
            <div
                style={style}
                className={`results-panel__item ${isSelected ? 'results-panel__item--selected' : ''} ${isHovered ? 'results-panel__item--hovered' : ''
                    } ${isExpanded ? 'results-panel__item--expanded' : ''}`}
                onClick={() => handleItemSelect(item)}
                onMouseEnter={() => handleItemHover(item)}
                onMouseLeave={() => handleItemHover(null)}
            >
                <div className="results-panel__item-content">
                    {/* Item Header */}
                    <div className="results-panel__item-header">
                        <div className="results-panel__item-icon">
                            {item.type === 'business' ? (
                                <div className="business-icon">🏢</div>
                            ) : (
                                <div className="event-icon">📅</div>
                            )}
                        </div>

                        <div className="results-panel__item-info">
                            <h3 className="results-panel__item-title">{item.name}</h3>
                            <div className="results-panel__item-meta">
                                {item.type === 'business' && (
                                    <>
                                        {item.category && (
                                            <span className="meta-category">{item.category}</span>
                                        )}
                                        {item.rating && (
                                            <div className="meta-rating">
                                                <span className="rating-stars">★</span>
                                                <span className="rating-value">{item.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {item.type === 'event' && (
                                    <>
                                        {item.eventCategory && (
                                            <span className="meta-category">{item.eventCategory.name}</span>
                                        )}
                                        {item.startDate && (
                                            <span className="meta-date">
                                                {new Date(item.startDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </>
                                )}

                                {item.distance && (
                                    <span className="meta-distance">
                                        {item.distance < 1
                                            ? `${Math.round(item.distance * 1000)}m`
                                            : `${item.distance.toFixed(1)}km`
                                        }
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="results-panel__item-actions">
                            <button
                                className="expand-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItemExpansion(item.id);
                                }}
                                aria-label={isExpanded ? t('common.collapse') : t('common.expand')}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className={`expand-icon ${isExpanded ? 'expand-icon--rotated' : ''}`}
                                >
                                    <path d="M7.41 8.84L12 13.42l4.59-4.58L18 10.25l-6 6-6-6z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                        <div className="results-panel__item-details">
                            {item.description && (
                                <p className="item-description">{item.description}</p>
                            )}

                            {item.address && (
                                <div className="item-address">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </svg>
                                    <span>{item.address}</span>
                                </div>
                            )}

                            {item.type === 'business' && item.openingHours && (
                                <div className="item-hours">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                                    </svg>
                                    <span>{item.openingHours}</span>
                                </div>
                            )}

                            {item.type === 'event' && (
                                <>
                                    {item.startDate && item.endDate && (
                                        <div className="item-dates">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1" />
                                            </svg>
                                            <span>
                                                {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}

                                    {item.price !== undefined && (
                                        <div className="item-price">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z" />
                                            </svg>
                                            <span>{item.price > 0 ? `$${item.price}` : t('common.free', 'Free')}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {item.tags && item.tags.length > 0 && (
                                <div className="item-tags">
                                    {item.tags.map(tag => (
                                        <span key={tag.id} className="tag">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }, [filteredResults, expandedItems, selectedItem, hoveredItem, handleItemSelect, handleItemHover, toggleItemExpansion, t]);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            ref={panelRef}
            className={`results-panel results-panel--${position} ${compact ? 'results-panel--compact' : ''} ${className}`}
        >
            {/* Panel Header */}
            <div className="results-panel__header">
                <div className="results-panel__header-top">
                    <h2 className="results-panel__title">
                        {t('results.title', 'Search Results')}
                    </h2>
                    <button
                        className="results-panel__close"
                        onClick={onClose}
                        aria-label={t('common.close')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                {showTypeToggle && (
                    <div className="results-panel__tabs">
                        <button
                            className={`tab ${activeTab === 'all' ? 'tab--active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            {t('tabs.all', 'All')} ({tabCounts.all})
                        </button>
                        <button
                            className={`tab ${activeTab === 'businesses' ? 'tab--active' : ''}`}
                            onClick={() => setActiveTab('businesses')}
                        >
                            {t('tabs.businesses', 'Businesses')} ({tabCounts.businesses})
                        </button>
                        <button
                            className={`tab ${activeTab === 'events' ? 'tab--active' : ''}`}
                            onClick={() => setActiveTab('events')}
                        >
                            {t('tabs.events', 'Events')} ({tabCounts.events})
                        </button>
                    </div>
                )}

                {/* Controls */}
                <div className="results-panel__controls">
                    {showSortOptions && (
                        <select
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}

                    {showViewModeToggle && (
                        <div className="view-mode-toggle">
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'view-btn--active' : ''}`}
                                onClick={() => setViewMode('list')}
                                aria-label={t('view.list', 'List view')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,5H21V7H3V5M3,13V11H21V13H3M3,19V17H21V19H3Z" />
                                </svg>
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'view-btn--active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                aria-label={t('view.grid', 'Grid view')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Panel Content */}
            <div className="results-panel__content">
                {loading && (
                    <div className="results-panel__loading">
                        <div className="loading-spinner"></div>
                        <p>{t('common.loading', 'Loading...')}</p>
                    </div>
                )}

                {error && (
                    <div className="results-panel__error">
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()}>
                            {t('common.retry', 'Retry')}
                        </button>
                    </div>
                )}

                {!loading && !error && filteredResults.length === 0 && (
                    <div className="results-panel__empty">
                        <div className="empty-icon">🔍</div>
                        <h3>{t('results.noResults', 'No results found')}</h3>
                        <p>{t('results.noResultsDesc', 'Try adjusting your search or filters')}</p>
                    </div>
                )}

                {!loading && !error && filteredResults.length > 0 && (
                    <div className="results-panel__list">
                        <List
                            ref={listRef}
                            height={400}
                            itemCount={filteredResults.length}
                            itemSize={compact ? 80 : 120}
                            onScroll={({ scrollTop }) => handleScroll(scrollTop)}
                        >
                            {ResultItem}
                        </List>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsPanel;