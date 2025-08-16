import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import { eventService } from '../../../../services/eventService';
import { eventCategoriesService } from '../../../../services/eventCategoriesService';
import { EventStatus, EventType } from '../../../../services/Constants';
import './EventsList.css';

const EventsList = ({
    viewMode = 'grid',
    showFilters = true,
    showSearch = true,
    pageSize = 12,
    className = ''
}) => {
    const { t } = useTranslation();
    const { user, isAdmin, isManager } = useAuth();
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [sortBy, setSortBy] = useState('start');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const apiBaseUrl = import.meta.env.VITE_API_URL + '/' || '';

    // Load initial data
    useEffect(() => {
        loadEvents();
        loadCategories();
    }, [currentPage, selectedCategory, selectedStatus, selectedType, sortBy, sortOrder, refreshTrigger]);

    // Handle search with debounce
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchQuery !== '') {
                searchEvents();
            } else {
                loadEvents();
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await eventService.getAll(currentPage, pageSize);

            if (response?.success && response?.data) {
                let filteredEvents = response.data.items || response.data;

                // Apply filters
                filteredEvents = applyFilters(filteredEvents);

                // Apply sorting
                filteredEvents = applySorting(filteredEvents);

                setEvents(filteredEvents);
                setTotalPages(response.data.totalPages || Math.ceil(filteredEvents.length / pageSize));
            }
        } catch (err) {
            console.error('Failed to load events:', err);
            setError(t('events.list.load_error'));
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await eventCategoriesService.getAll();
            if (response?.success && response?.data) {
                setCategories(response.data);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const searchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventService.search(searchQuery);

            if (response?.success && response?.data) {
                let filteredEvents = response.data;
                filteredEvents = applyFilters(filteredEvents);
                filteredEvents = applySorting(filteredEvents);
                setEvents(filteredEvents);
            }
        } catch (err) {
            console.error('Search failed:', err);
            setError(t('events.list.search_error'));
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = useCallback((eventsList) => {
        return eventsList.filter(event => {
            if (selectedCategory && event.eventCategoryId !== selectedCategory) return false;
            if (selectedStatus && event.status !== parseInt(selectedStatus)) return false;
            if (selectedType && event.type !== parseInt(selectedType)) return false;
            return true;
        });
    }, [selectedCategory, selectedStatus, selectedType]);

    const applySorting = useCallback((eventsList) => {
        return [...eventsList].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'start' || sortBy === 'end') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }, [sortBy, sortOrder]);

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm(t('events.list.confirm_delete'))) return;

        try {
            await eventService.delete(eventId);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Failed to delete event:', err);
            setError(t('events.list.delete_error'));
        }
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedStatus('');
        setSelectedType('');
        setSearchQuery('');
        setSortBy('start');
        setSortOrder('asc');
        setCurrentPage(1);
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            [EventStatus.DRAFT]: 'status-draft',
            [EventStatus.PUBLISHED]: 'status-published',
            [EventStatus.IN_PROGRESS]: 'status-in-progress',
            [EventStatus.COMPLETED]: 'status-completed',
            [EventStatus.CANCELLED]: 'status-cancelled'
        };
        return statusClasses[status] || 'status-draft';
    };

    const getStatusText = (status) => {
        const statusTexts = {
            [EventStatus.DRAFT]: t('events.status.draft'),
            [EventStatus.PUBLISHED]: t('events.status.published'),
            [EventStatus.IN_PROGRESS]: t('events.status.in_progress'),
            [EventStatus.COMPLETED]: t('events.status.completed'),
            [EventStatus.CANCELLED]: t('events.status.cancelled')
        };
        return statusTexts[status] || t('events.status.draft');
    };

    const getTypeText = (type) => {
        const typeTexts = {
            [EventType.CONFERENCE]: t('events.type.conference'),
            [EventType.WORKSHOP]: t('events.type.workshop'),
            [EventType.EXHIBITION]: t('events.type.exhibition'),
            [EventType.CONCERT]: t('events.type.concert'),
            [EventType.SPORTS]: t('events.type.sports'),
            [EventType.FESTIVAL]: t('events.type.festival'),
            [EventType.OTHER]: t('events.type.other')
        };
        return typeTexts[type] || t('events.type.other');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date;
        //return new Intl.DateTimeFormat(i18n.language, {
        //    year: 'numeric',
        //    month: 'short',
        //    day: 'numeric',
        //    hour: '2-digit',
        //    minute: '2-digit'
        //}).format(date);
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category?.name || t('events.category.unknown');
    };

    const canEditEvent = (event) => {
        return isAdmin || isManager || event.organizerId === user?.id;
    };

    if (loading && events.length === 0) {
        return (
            <div className={`events-list ${className}`}>
                <div className="events-list__loading">
                    <div className="loading-spinner"></div>
                    <p>{t('events.list.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`events-list ${className}`}>
            {/* Header */}
            <div className="events-list__header">
                <div className="events-list__title-section">
                    <h1 className="events-list__title">{t('events.list.title')}</h1>
                    <p className="events-list__subtitle">{t('events.list.subtitle')}</p>
                </div>

                <div className="events-list__actions">
                    {showFilters && (
                        <button
                            className="btn btn--outline events-list__filter-toggle"
                            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                            </svg>
                            {t('events.list.filters')}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && showFiltersPanel && (
                <div className="events-list__filters">
                    <div className="filters-grid">
                        {/* Search */}
                        {showSearch && (
                            <div className="filter-group">
                                <label className="filter-label">{t('events.list.search')}</label>
                                <div className="search-input-wrapper">
                                    <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                    </svg>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder={t('events.list.search_placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Category Filter */}
                        <div className="filter-group">
                            <label className="filter-label">{t('events.list.filter_category')}</label>
                            <select
                                className="filter-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">{t('events.list.all_categories')}</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="filter-group">
                            <label className="filter-label">{t('events.list.filter_status')}</label>
                            <select
                                className="filter-select"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">{t('events.list.all_statuses')}</option>
                                <option value={EventStatus.DRAFT}>{t('events.status.draft')}</option>
                                <option value={EventStatus.PUBLISHED}>{t('events.status.published')}</option>
                                <option value={EventStatus.IN_PROGRESS}>{t('events.status.in_progress')}</option>
                                <option value={EventStatus.COMPLETED}>{t('events.status.completed')}</option>
                                <option value={EventStatus.CANCELLED}>{t('events.status.cancelled')}</option>
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="filter-group">
                            <label className="filter-label">{t('events.list.filter_type')}</label>
                            <select
                                className="filter-select"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="">{t('events.list.all_types')}</option>
                                <option value={EventType.CONFERENCE}>{t('events.type.conference')}</option>
                                <option value={EventType.WORKSHOP}>{t('events.type.workshop')}</option>
                                <option value={EventType.EXHIBITION}>{t('events.type.exhibition')}</option>
                                <option value={EventType.CONCERT}>{t('events.type.concert')}</option>
                                <option value={EventType.SPORTS}>{t('events.type.sports')}</option>
                                <option value={EventType.FESTIVAL}>{t('events.type.festival')}</option>
                                <option value={EventType.OTHER}>{t('events.type.other')}</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="filter-group">
                            <label className="filter-label">{t('events.list.sort_by')}</label>
                            <select
                                className="filter-select"
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split('-');
                                    setSortBy(field);
                                    setSortOrder(order);
                                }}
                            >
                                <option value="start-asc">{t('events.list.sort_date_asc')}</option>
                                <option value="start-desc">{t('events.list.sort_date_desc')}</option>
                                <option value="name-asc">{t('events.list.sort_name_asc')}</option>
                                <option value="name-desc">{t('events.list.sort_name_desc')}</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <div className="filter-group">
                            <button
                                className="btn btn--outline filter-clear"
                                onClick={clearFilters}
                            >
                                {t('events.list.clear_filters')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="events-list__error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Events Grid */}
            <div className={`events-list__content ${viewMode}`}>
                {events.length === 0 && !loading ? (
                    <div className="events-list__empty">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                        <h3>{t('events.list.no_events')}</h3>
                        <p>{t('events.list.no_events_description')}</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {events.map(event => (
                            <div key={event.id} className="event-card">
                                {/* Event Image */}
                                <div className="event-card__image">
                                    {event.picture ? (
                                        <img
                                            src={apiBaseUrl + event.picture}
                                            alt={event.name}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="event-card__placeholder">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className={`event-card__status ${getStatusBadgeClass(event.status)}`}>
                                        {getStatusText(event.status)}
                                    </div>
                                </div>

                                {/* Event Content */}
                                <div className="event-card__content">
                                    <div className="event-card__header">
                                        <h3 className="event-card__title">{event.name}</h3>
                                        <span className="event-card__type">{getTypeText(event.type)}</span>
                                    </div>

                                    {event.description && (
                                        <p className="event-card__description">
                                            {event.description.length > 150
                                                ? `${event.description.substring(0, 150)}...`
                                                : event.description
                                            }
                                        </p>
                                    )}

                                    <div className="event-card__meta">
                                        <div className="event-card__date">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                                            </svg>
                                            <span>{event.start}</span>
                                        </div>

                                        <div className="event-card__category">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                            <span>{getCategoryName(event.eventCategoryId)}</span>
                                        </div>

                                        {event.address && (
                                            <div className="event-card__location">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg>
                                                <span>{event.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Event Actions */}
                                <div className="event-card__actions">
                                    <button className="btn btn--primary btn--sm">
                                        {t('events.list.view_details')}
                                    </button>

                                    {canEditEvent(event) && (
                                        <div className="event-card__admin-actions">
                                            <button className="btn btn--outline btn--sm">
                                                {t('events.list.edit')}
                                            </button>
                                            <button
                                                className="btn btn--danger btn--sm"
                                                onClick={() => handleDeleteEvent(event.id)}
                                            >
                                                {t('events.list.delete')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="events-list__pagination">
                    <button
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                        </svg>
                        {t('common.previous')}
                    </button>

                    <div className="pagination-info">
                        <span>{t('events.list.page_info', { current: currentPage, total: totalPages })}</span>
                    </div>

                    <button
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        {t('common.next')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Loading overlay for pagination */}
            {loading && events.length > 0 && (
                <div className="events-list__loading-overlay">
                    <div className="loading-spinner"></div>
                </div>
            )}
        </div>
    );
};

export default EventsList;