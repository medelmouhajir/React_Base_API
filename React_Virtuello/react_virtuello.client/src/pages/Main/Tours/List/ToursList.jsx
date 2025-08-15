import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { tourService } from '../../../../services/tourService';
import './ToursList.css';

const ToursList = ({
    onTourSelect,
    selectedTourId = null,
    className = '',
    showActions = true,
    searchable = true,
    filterable = true,
    pageSize = 12,
    viewMode = 'grid' // 'grid' | 'list'
}) => {
    const { t } = useTranslation();
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentViewMode, setCurrentViewMode] = useState(viewMode);
    const [refreshing, setRefreshing] = useState(false);
    const searchTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);
    const apiBaseUrl = import.meta.env.VITE_API_URL + '/' || '';

    // Fetch tours data
    const fetchTours = useCallback(async (page = 1, search = '', showLoader = true) => {
        try {
            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new abort controller
            abortControllerRef.current = new AbortController();

            if (showLoader) {
                setLoading(true);
            }
            setError(null);

            let response;
            if (search.trim()) {
                response = await tourService.search(search);
            } else {
                response = await tourService.getAll(page, pageSize);
            }

            if (response.success) {
                setTours(response.data || []);
                setCurrentPage(response.currentPage || 1);
                setTotalPages(response.totalPages || 1);
                setTotalCount(response.totalCount || 0);
            } else {
                throw new Error(response.message || t('tours.error.fetch_failed'));
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error fetching tours:', err);
                setError(err.message || t('tours.error.fetch_failed'));
                setTours([]);
            }
        } finally {
            if (showLoader) {
                setLoading(false);
            }
            setRefreshing(false);
        }
    }, [pageSize, t]);

    // Initial load
    useEffect(() => {
        fetchTours(1, searchQuery);
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchTours]);

    // Handle search with debouncing
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchTours(1, query);
        }, 300);
    }, [fetchTours]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
            fetchTours(page, searchQuery);
        }
    }, [currentPage, totalPages, fetchTours, searchQuery]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTours(currentPage, searchQuery, false);
    }, [currentPage, searchQuery, fetchTours]);

    // Handle tour selection
    const handleTourSelect = useCallback((tour) => {
        if (onTourSelect) {
            onTourSelect(tour);
        }
    }, [onTourSelect]);

    // Handle sort change
    const handleSortChange = useCallback((field) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);

        // Sort the current tours array
        const sortedTours = [...tours].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (newOrder === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });

        setTours(sortedTours);
    }, [tours, sortBy, sortOrder]);

    // Format date
    const formatDate = useCallback((dateString) => {
        if (!dateString) return t('tours.no_date');
        return new Date(dateString).toLocaleDateString();
    }, [t]);

    // Get image URL with fallback
    const getImageUrl = useCallback((imagePath) => {
        if (!imagePath) return '/images/tour-placeholder.jpg';
        return imagePath.startsWith('http') ? apiBaseUrl + imagePath: `/uploads/${imagePath}`;
    }, []);

    // Render tour card
    const renderTourCard = useCallback((tour) => (
        <div
            key={tour.id}
            className={`tours-list__card ${selectedTourId === tour.id ? 'tours-list__card--selected' : ''}`}
            onClick={() => handleTourSelect(tour)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTourSelect(tour);
                }
            }}
        >
            <div className="tours-list__card-image">
                <img
                    src={apiBaseUrl + tour.imagePath}
                    alt={tour.name}
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = '/images/tour-placeholder.jpg';
                    }}
                />
                <div className="tours-list__card-overlay">
                    <div className="tours-list__card-stats">
                        <span className="tours-list__stat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2M12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" />
                            </svg>
                            {tour.sceneCount} {t('tours.scenes')}
                        </span>
                    </div>
                </div>
            </div>
            <div className="tours-list__card-content">
                <h3 className="tours-list__card-title">{tour.name}</h3>
                {tour.description && (
                    <p className="tours-list__card-description">
                        {tour.description.length > 100
                            ? `${tour.description.substring(0, 100)}...`
                            : tour.description
                        }
                    </p>
                )}
                {showActions && (
                    <div className="tours-list__card-actions">
                        <button
                            className="tours-list__action-btn tours-list__action-btn--primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTourSelect(tour);
                            }}
                        >
                            {t('tours.view_tour')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    ), [selectedTourId, handleTourSelect, getImageUrl, showActions, t]);

    // Render tour row (list view)
    const renderTourRow = useCallback((tour) => (
        <div
            key={tour.id}
            className={`tours-list__row ${selectedTourId === tour.id ? 'tours-list__row--selected' : ''}`}
            onClick={() => handleTourSelect(tour)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTourSelect(tour);
                }
            }}
        >
            <div className="tours-list__row-image">
                <img
                    src={apiBaseUrl + tour.imagePath}
                    alt={tour.name}
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = '/images/tour-placeholder.jpg';
                    }}
                />
            </div>
            <div className="tours-list__row-content">
                <div className="tours-list__row-header">
                    <h3 className="tours-list__row-title">{tour.name}</h3>
                    <div className="tours-list__row-stats">
                        <span className="tours-list__stat">
                            {tour.sceneCount} {t('tours.scenes')}
                        </span>
                    </div>
                </div>
                {tour.description && (
                    <p className="tours-list__row-description">{tour.description}</p>
                )}
            </div>
            {showActions && (
                <div className="tours-list__row-actions">
                    <button
                        className="tours-list__action-btn tours-list__action-btn--primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTourSelect(tour);
                        }}
                    >
                        {t('tours.view_tour')}
                    </button>
                </div>
            )}
        </div>
    ), [selectedTourId, handleTourSelect, getImageUrl, showActions, t]);

    // Render pagination
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Previous button
        pages.push(
            <button
                key="prev"
                className="tours-list__page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label={t('common.previous_page')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12Z" />
                </svg>
            </button>
        );

        // First page
        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    className="tours-list__page-btn"
                    onClick={() => handlePageChange(1)}
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="tours-list__ellipsis">...</span>);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={`tours-list__page-btn ${i === currentPage ? 'tours-list__page-btn--active' : ''}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis2" className="tours-list__ellipsis">...</span>);
            }
            pages.push(
                <button
                    key={totalPages}
                    className="tours-list__page-btn"
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </button>
            );
        }

        // Next button
        pages.push(
            <button
                key="next"
                className="tours-list__page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label={t('common.next_page')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z" />
                </svg>
            </button>
        );

        return (
            <div className="tours-list__pagination">
                <div className="tours-list__pagination-info">
                    {t('tours.pagination_info', {
                        start: (currentPage - 1) * pageSize + 1,
                        end: Math.min(currentPage * pageSize, totalCount),
                        total: totalCount
                    })}
                </div>
                <div className="tours-list__pagination-controls">
                    {pages}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`tours-list ${className}`}>
                <div className="tours-list__loading">
                    <div className="tours-list__spinner"></div>
                    <p>{t('tours.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`tours-list ${className}`}>
                <div className="tours-list__error">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
                    </svg>
                    <h3>{t('tours.error.title')}</h3>
                    <p>{error}</p>
                    <button
                        className="tours-list__retry-btn"
                        onClick={() => fetchTours(currentPage, searchQuery)}
                    >
                        {t('tours.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`tours-list ${className}`}>
            {/* Header */}
            <div className="tours-list__header">
                <div className="tours-list__header-left">
                    <h2 className="tours-list__title">{t('tours.title')}</h2>
                    <span className="tours-list__count">
                        {t('tours.count', { count: totalCount })}
                    </span>
                </div>
                <div className="tours-list__header-right">
                    {/* View Mode Toggle */}
                    <div className="tours-list__view-toggle">
                        <button
                            className={`tours-list__view-btn ${currentViewMode === 'grid' ? 'tours-list__view-btn--active' : ''}`}
                            onClick={() => setCurrentViewMode('grid')}
                            aria-label={t('tours.grid_view')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 3V11H11V3H3M5 5H9V9H5V5M13 3V11H21V3H13M15 5H19V9H15V5M3 13V21H11V13H3M5 15H9V19H5V15M13 13V21H21V13H13M15 15H19V19H15V15Z" />
                            </svg>
                        </button>
                        <button
                            className={`tours-list__view-btn ${currentViewMode === 'list' ? 'tours-list__view-btn--active' : ''}`}
                            onClick={() => setCurrentViewMode('list')}
                            aria-label={t('tours.list_view')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 4H21V6H3V4M3 11H21V13H3V11M3 18H21V20H3V18Z" />
                            </svg>
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                        className={`tours-list__refresh-btn ${refreshing ? 'tours-list__refresh-btn--loading' : ''}`}
                        onClick={handleRefresh}
                        disabled={refreshing}
                        aria-label={t('tours.refresh')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12S7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12S8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            {(searchable || filterable) && (
                <div className="tours-list__filters">
                    {searchable && (
                        <div className="tours-list__search">
                            <div className="tours-list__search-input">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9.5 3C13.09 3 16 5.91 16 9.5C16 11.11 15.41 12.59 14.44 13.73L20.71 20L19.29 21.42L13.02 15.15C11.88 15.98 10.5 16.5 9.5 16.5C5.91 16.5 3 13.59 3 10C3 6.41 5.91 3.5 9.5 3.5M9.5 5C7.01 5 5 7.01 5 9.5S7.01 14 9.5 14 14 11.99 14 9.5 11.99 5 9.5 5Z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={t('tours.search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="tours-list__search-field"
                                />
                                {searchQuery && (
                                    <button
                                        className="tours-list__search-clear"
                                        onClick={() => handleSearch('')}
                                        aria-label={t('tours.clear_search')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {filterable && (
                        <div className="tours-list__sort">
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split('-');
                                    setSortBy(field);
                                    setSortOrder(order);
                                    handleSortChange(field);
                                }}
                                className="tours-list__sort-select"
                            >
                                <option value="name-asc">{t('tours.sort.name_asc')}</option>
                                <option value="name-desc">{t('tours.sort.name_desc')}</option>
                                <option value="sceneCount-desc">{t('tours.sort.scenes_desc')}</option>
                                <option value="sceneCount-asc">{t('tours.sort.scenes_asc')}</option>
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="tours-list__content">
                {tours.length === 0 ? (
                    <div className="tours-list__empty">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2M12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" />
                        </svg>
                        <h3>{t('tours.empty.title')}</h3>
                        <p>
                            {searchQuery
                                ? t('tours.empty.search', { query: searchQuery })
                                : t('tours.empty.no_tours')
                            }
                        </p>
                        {searchQuery && (
                            <button
                                className="tours-list__clear-search-btn"
                                onClick={() => handleSearch('')}
                            >
                                {t('tours.clear_search')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={`tours-list__grid tours-list__grid--${currentViewMode}`}>
                            {currentViewMode === 'grid'
                                ? tours.map(renderTourCard)
                                : tours.map(renderTourRow)
                            }
                        </div>
                        {renderPagination()}
                    </>
                )}
            </div>
        </div>
    );
};

export default ToursList;