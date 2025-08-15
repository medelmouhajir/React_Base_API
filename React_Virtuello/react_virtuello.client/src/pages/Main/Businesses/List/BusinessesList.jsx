import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { businessService } from '../../../../services/businessService';
import './BusinessesList.css';

const BusinessesList = () => {
    const { t } = useTranslation();
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const apiBaseUrl = import.meta.env.VITE_API_URL + '/' || '';

    // Load businesses
    const loadBusinesses = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await businessService.getAll(page, pageSize);

            if (response.success) {
                setBusinesses(response.data || []);
                setCurrentPage(response.currentPage || page);
                setTotalPages(response.totalPages || 0);
                setTotalCount(response.totalCount || 0);
            } else {
                setError(response.message || t('businesses.list.error_loading'));
            }
        } catch (err) {
            console.error('Error loading businesses:', err);
            setError(t('businesses.list.error_loading'));
        } finally {
            setLoading(false);
        }
    }, [pageSize, t]);

    // Search businesses
    const searchBusinesses = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        try {
            setIsSearching(true);
            const response = await businessService.search(query);

            if (response.success) {
                setSearchResults(response.data || []);
            } else {
                console.error('Search error:', response.message);
                setSearchResults([]);
            }
        } catch (err) {
            console.error('Error searching businesses:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadBusinesses(1);
    }, [loadBusinesses]);

    // Handle search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchBusinesses(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchBusinesses]);

    // Get business status label
    const getStatusLabel = (status) => {
        const statusMap = {
            0: t('businesses.status.draft'),
            1: t('businesses.status.active'),
            2: t('businesses.status.suspended'),
            3: t('businesses.status.closed'),
            4: t('businesses.status.under_review')
        };
        return statusMap[status] || t('businesses.status.unknown');
    };

    // Get business status class
    const getStatusClass = (status) => {
        const statusClasses = {
            0: 'draft',
            1: 'active',
            2: 'suspended',
            3: 'closed',
            4: 'under-review'
        };
        return statusClasses[status] || 'unknown';
    };

    // Format rating
    const formatRating = (rating) => {
        if (!rating) return t('businesses.list.no_rating');
        return `${rating.toFixed(1)} ⭐`;
    };

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            loadBusinesses(page);
        }
    };

    // Retry loading
    const handleRetry = () => {
        loadBusinesses(currentPage);
    };

    // Get display data (search results or regular businesses)
    const displayData = searchQuery.trim() ? searchResults : businesses;
    const showPagination = !searchQuery.trim() && totalPages > 1;

    return (
        <div className="businesses-list">
            {/* Header */}
            <div className="businesses-list__header">
                <div className="businesses-list__title-section">
                    <h1 className="businesses-list__title">
                        {t('businesses.list.title')}
                    </h1>
                    {!searchQuery.trim() && (
                        <span className="businesses-list__count">
                            {t('businesses.list.total_count', { count: totalCount })}
                        </span>
                    )}
                </div>

                {/* Search */}
                <div className="businesses-list__search">
                    <div className="search-input-container">
                        <svg className="search-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={t('businesses.list.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchQuery('')}
                                aria-label={t('common.clear')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {isSearching && (
                        <span className="search-status">
                            {t('businesses.list.searching')}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="businesses-list__content">
                {/* Loading State */}
                {loading && (
                    <div className="businesses-list__loading">
                        <div className="loading-spinner"></div>
                        <span>{t('businesses.list.loading')}</span>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="businesses-list__error">
                        <div className="error-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        </div>
                        <h3 className="error-title">{t('businesses.list.error_title')}</h3>
                        <p className="error-message">{error}</p>
                        <button className="btn btn-primary" onClick={handleRetry}>
                            {t('common.retry')}
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && displayData.length === 0 && (
                    <div className="businesses-list__empty">
                        <div className="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                            </svg>
                        </div>
                        <h3 className="empty-title">
                            {searchQuery.trim()
                                ? t('businesses.list.no_search_results')
                                : t('businesses.list.no_businesses')
                            }
                        </h3>
                        <p className="empty-message">
                            {searchQuery.trim()
                                ? t('businesses.list.try_different_search')
                                : t('businesses.list.no_businesses_message')
                            }
                        </p>
                        {searchQuery.trim() && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSearchQuery('')}
                            >
                                {t('businesses.list.clear_search')}
                            </button>
                        )}
                    </div>
                )}

                {/* Businesses Grid */}
                {!loading && !error && displayData.length > 0 && (
                    <>
                        <div className="businesses-list__grid">
                            {displayData.map((business) => (
                                <div key={business.id} className="business-card">
                                    {/* Business Image */}
                                    <div className="business-card__image">
                                        {business.imagePath ? (
                                            <img
                                                src={apiBaseUrl + business.imagePath}
                                                alt={business.name}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="business-card__placeholder">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <div className={`business-card__status business-card__status--${getStatusClass(business.status)}`}>
                                            {getStatusLabel(business.status)}
                                        </div>
                                    </div>

                                    {/* Business Content */}
                                    <div className="business-card__content">
                                        <div className="business-card__header">
                                            <h3 className="business-card__name">
                                                {business.name}
                                            </h3>
                                            {business.logoPath && (
                                                <img
                                                    src={apiBaseUrl + business.logoPath}
                                                    alt={`${business.name} logo`}
                                                    className="business-card__logo"
                                                />
                                            )}
                                        </div>

                                        {business.description && (
                                            <p className="business-card__description">
                                                {business.description.length > 120
                                                    ? `${business.description.slice(0, 120)}...`
                                                    : business.description
                                                }
                                            </p>
                                        )}

                                        {business.address && (
                                            <div className="business-card__address">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg>
                                                <span>{business.address}</span>
                                            </div>
                                        )}

                                        {/* Rating and Comments */}
                                        <div className="business-card__stats">
                                            <div className="business-card__rating">
                                                {formatRating(business.averageRating)}
                                            </div>
                                            <div className="business-card__comments">
                                                {t('businesses.list.comments_count', { count: business.commentCount })}
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="business-card__contact">
                                            {business.phone && (
                                                <a
                                                    href={`tel:${business.phone}`}
                                                    className="business-card__contact-btn"
                                                    aria-label={t('businesses.list.call_business')}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                    </svg>
                                                </a>
                                            )}
                                            {business.email && (
                                                <a
                                                    href={`mailto:${business.email}`}
                                                    className="business-card__contact-btn"
                                                    aria-label={t('businesses.list.email_business')}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                                    </svg>
                                                </a>
                                            )}
                                            {business.website && (
                                                <a
                                                    href={business.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="business-card__contact-btn"
                                                    aria-label={t('businesses.list.visit_website')}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                    </svg>
                                                </a>
                                            )}
                                            {business.whatsApp && (
                                                <a
                                                    href={`https://wa.me/${business.whatsApp}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="business-card__contact-btn business-card__contact-btn--whatsapp"
                                                    aria-label={t('businesses.list.whatsapp_business')}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>

                                        {/* Created Date */}
                                        <div className="business-card__meta">
                                            <span className="business-card__date">
                                                {t('businesses.list.created_at')}: {new Date(business.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {showPagination && (
                            <div className="businesses-list__pagination">
                                <button
                                    className="pagination-btn pagination-btn--prev"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    aria-label={t('common.previous_page')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                                    </svg>
                                    {t('common.previous')}
                                </button>

                                <div className="pagination-info">
                                    {t('common.page_info', {
                                        current: currentPage,
                                        total: totalPages
                                    })}
                                </div>

                                <button
                                    className="pagination-btn pagination-btn--next"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    aria-label={t('common.next_page')}
                                >
                                    {t('common.next')}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default BusinessesList;