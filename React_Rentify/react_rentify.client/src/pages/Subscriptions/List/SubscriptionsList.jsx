// src/pages/Subscriptions/List/SubscriptionsList.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import subscriptionService from '../../../services/subscriptionService';
import './SubscriptionsList.css';

const SubscriptionsList = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();

    // State management
    const [subscriptions, setSubscriptions] = useState([]);
    const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Available status options for filtering
    const statusOptions = [
        { value: 'all', label: t('subscriptions.filters.allStatuses') },
        { value: 'active', label: t('subscriptions.status.active') },
        { value: 'inactive', label: t('subscriptions.status.inactive') },
        { value: 'cancelled', label: t('subscriptions.status.cancelled') },
        { value: 'suspended', label: t('subscriptions.status.suspended') },
        { value: 'trial', label: t('subscriptions.status.trial') },
        { value: 'expired', label: t('subscriptions.status.expired') }
    ];

    // Sort options
    const sortOptions = [
        { value: 'createdAt', label: t('subscriptions.sort.dateCreated') },
        { value: 'agencyName', label: t('subscriptions.sort.agencyName') },
        { value: 'planName', label: t('subscriptions.sort.planName') },
        { value: 'status', label: t('subscriptions.sort.status') },
        { value: 'nextBillingDate', label: t('subscriptions.sort.nextBilling') }
    ];

    // Fetch subscriptions data
    const fetchSubscriptions = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError(null);

        try {
            const params = {
                page: currentPage,
                pageSize: itemsPerPage,
                sortBy,
                sortOrder,
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: searchTerm || undefined
            };

            const data = await subscriptionService.getAllSubscriptions(params);
            setSubscriptions(data.items || data);
            setTotalPages(Math.ceil((data.totalCount || data.length) / itemsPerPage));
        } catch (err) {
            console.error('❌ Error fetching subscriptions:', err);
            setError(t('subscriptions.errors.fetchFailed'));
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSubscriptions(false);
        setRefreshing(false);
    };

    // Filter subscriptions based on search term and status
    useEffect(() => {
        let filtered = [...subscriptions];

        // Apply search filter
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(sub =>
                sub.agencyName?.toLowerCase().includes(search) ||
                sub.planName?.toLowerCase().includes(search) ||
                sub.id?.toString().includes(search)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(sub => sub.status?.toLowerCase() === statusFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle date sorting
            if (sortBy.includes('Date') || sortBy === 'createdAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // Handle string sorting
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredSubscriptions(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    }, [subscriptions, searchTerm, statusFilter, sortBy, sortOrder, itemsPerPage]);

    // Initial load
    useEffect(() => {
        fetchSubscriptions();
    }, [currentPage, itemsPerPage]);

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
    };

    // Get status badge class
    const getStatusClass = (status) => {
        const statusMap = {
            'active': 'status-active',
            'inactive': 'status-inactive',
            'cancelled': 'status-cancelled',
            'suspended': 'status-suspended',
            'trial': 'status-trial',
            'expired': 'status-expired'
        };
        return statusMap[status?.toLowerCase()] || 'status-default';
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(dateString));
    };

    // Format currency
    const formatCurrency = (amount, currency = 'USD') => {
        if (!amount) return '—';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency
        }).format(amount);
    };

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredSubscriptions.slice(startIndex, endIndex);

    // Loading component
    const LoadingComponent = () => (
        <div className="subscriptions-loading">
            <div className="loading-spinner"></div>
            <p>{t('common.loading')}</p>
        </div>
    );

    // Error component
    const ErrorComponent = () => (
        <div className="subscriptions-error">
            <div className="error-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
            </div>
            <h3>{t('subscriptions.errors.title')}</h3>
            <p>{error}</p>
            <button onClick={() => fetchSubscriptions()} className="btn-retry">
                {t('common.tryAgain')}
            </button>
        </div>
    );

    // Empty state component
    const EmptyComponent = () => (
        <div className="subscriptions-empty">
            <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M8 14h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 14h.01" />
                    <path d="M8 18h.01" />
                    <path d="M12 18h.01" />
                </svg>
            </div>
            <h3>{t('subscriptions.empty.title')}</h3>
            <p>{t('subscriptions.empty.message')}</p>
        </div>
    );

    return (
        <div className={`subscriptions-list-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="subscriptions-header">
                <div className="header-content">
                    <h1 className="subscriptions-title">{t('subscriptions.title')}</h1>
                    <p className="subscriptions-subtitle">{t('subscriptions.subtitle')}</p>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
                        disabled={refreshing}
                        title={t('common.refresh')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10" />
                            <path d="M3.51 15a9 9 0 0 0 14.85 3.36L23 14" />
                        </svg>
                        <span className="sr-only">{t('common.refresh')}</span>
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="subscriptions-filters">
                <div className="filters-row">
                    <div className="filter-group">
                        <label htmlFor="search" className="filter-label">
                            {t('common.search')}
                        </label>
                        <div className="search-input-container">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                id="search"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('subscriptions.searchPlaceholder')}
                                className="search-input"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="clear-search-button"
                                    title={t('common.clear')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="status-filter" className="filter-label">
                            {t('subscriptions.filters.status')}
                        </label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="sort-by" className="filter-label">
                            {t('common.sortBy')}
                        </label>
                        <select
                            id="sort-by"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="filter-select"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="sort-order" className="filter-label">
                            {t('common.order')}
                        </label>
                        <select
                            id="sort-order"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="filter-select"
                        >
                            <option value="asc">{t('common.ascending')}</option>
                            <option value="desc">{t('common.descending')}</option>
                        </select>
                    </div>
                </div>

                {(searchTerm || statusFilter !== 'all') && (
                    <div className="active-filters">
                        <span className="active-filters-label">{t('common.activeFilters')}:</span>
                        {searchTerm && (
                            <span className="filter-tag">
                                {t('common.search')}: "{searchTerm}"
                                <button onClick={clearSearch} className="filter-tag-close">×</button>
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="filter-tag">
                                {t('subscriptions.filters.status')}: {statusOptions.find(opt => opt.value === statusFilter)?.label}
                                <button onClick={() => setStatusFilter('all')} className="filter-tag-close">×</button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Results Info */}
            {!isLoading && !error && (
                <div className="results-info">
                    {t('subscriptions.resultsCount', {
                        count: filteredSubscriptions.length,
                        total: subscriptions.length
                    })}
                </div>
            )}

            {/* Content */}
            <div className="subscriptions-content">
                {isLoading ? (
                    <LoadingComponent />
                ) : error ? (
                    <ErrorComponent />
                ) : currentItems.length === 0 ? (
                    <EmptyComponent />
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="desktop-table">
                            <div className="table-wrapper">
                                <table className="subscriptions-table">
                                    <thead>
                                        <tr>
                                            <th>{t('subscriptions.table.agency')}</th>
                                            <th>{t('subscriptions.table.plan')}</th>
                                            <th>{t('subscriptions.table.status')}</th>
                                            <th>{t('subscriptions.table.startDate')}</th>
                                            <th>{t('subscriptions.table.nextBilling')}</th>
                                            <th>{t('subscriptions.table.amount')}</th>
                                            <th className="actions-header">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((subscription) => (
                                            <tr key={subscription.id} className="table-row">
                                                <td className="agency-cell">
                                                    <div className="agency-info">
                                                        <span className="agency-name">{subscription.agencyName}</span>
                                                        <span className="subscription-id">ID: {subscription.id}</span>
                                                    </div>
                                                </td>
                                                <td className="plan-cell">
                                                    <span className="plan-name">{subscription.planName}</span>
                                                </td>
                                                <td className="status-cell">
                                                    <span className={`status-badge ${getStatusClass(subscription.status)}`}>
                                                        {t(`subscriptions.status.${subscription.status?.toLowerCase() || 'unknown'}`)}
                                                    </span>
                                                </td>
                                                <td className="date-cell">
                                                    {formatDate(subscription.startDate)}
                                                </td>
                                                <td className="date-cell">
                                                    {formatDate(subscription.nextBillingDate)}
                                                </td>
                                                <td className="amount-cell">
                                                    {formatCurrency(subscription.amount, subscription.currency)}
                                                </td>
                                                <td className="actions-cell">
                                                    <div className="action-buttons">
                                                        <button
                                                            type="button"
                                                            onClick={() => console.log('View details:', subscription.id)}
                                                            className="action-btn btn-view"
                                                            title={t('common.viewDetails')}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => console.log('Edit subscription:', subscription.id)}
                                                            className="action-btn btn-edit"
                                                            title={t('common.edit')}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="mobile-cards">
                            {currentItems.map((subscription) => (
                                <div key={subscription.id} className="subscription-card">
                                    <div className="card-header">
                                        <div className="subscription-info">
                                            <h3 className="agency-name">{subscription.agencyName}</h3>
                                            <span className="subscription-id">ID: {subscription.id}</span>
                                        </div>
                                        <span className={`status-badge ${getStatusClass(subscription.status)}`}>
                                            {t(`subscriptions.status.${subscription.status?.toLowerCase() || 'unknown'}`)}
                                        </span>
                                    </div>

                                    <div className="card-content">
                                        <div className="field-group">
                                            <label className="field-label">{t('subscriptions.table.plan')}:</label>
                                            <span className="field-value">{subscription.planName}</span>
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">{t('subscriptions.table.amount')}:</label>
                                            <span className="field-value amount">
                                                {formatCurrency(subscription.amount, subscription.currency)}
                                            </span>
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">{t('subscriptions.table.startDate')}:</label>
                                            <span className="field-value">{formatDate(subscription.startDate)}</span>
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label">{t('subscriptions.table.nextBilling')}:</label>
                                            <span className="field-value">{formatDate(subscription.nextBillingDate)}</span>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            type="button"
                                            onClick={() => console.log('View details:', subscription.id)}
                                            className="card-btn btn-view"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <span>{t('common.viewDetails')}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => console.log('Edit subscription:', subscription.id)}
                                            className="card-btn btn-edit"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            <span>{t('common.edit')}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                    <span>{t('common.previous')}</span>
                                </button>

                                <div className="pagination-info">
                                    <span>
                                        {t('common.pageOf', {
                                            current: currentPage,
                                            total: totalPages
                                        })}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="pagination-btn"
                                >
                                    <span>{t('common.next')}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
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

export default SubscriptionsList;