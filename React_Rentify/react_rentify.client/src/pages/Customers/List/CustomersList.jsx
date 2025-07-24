import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import customerService from '../../../services/customerService';
import './CustomersList.css';

const CustomersList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    // State management
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'fullName', direction: 'ascending' });
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('fullName');

    // Fetch customers on mount or when agencyId changes
    useEffect(() => {
        fetchCustomers();
    }, [agencyId]);

    const fetchCustomers = async () => {
        if (!agencyId) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await customerService.getByAgencyId(agencyId);
            setCustomers(data || []);
        } catch (err) {
            console.error('❌ Error fetching customers:', err);
            setError(t('customer.list.error', 'Failed to load customers'));
        } finally {
            setIsLoading(false);
        }
    };

    // Enhanced delete handler with better UX
    const handleDelete = async (customer, e) => {
        e.stopPropagation();

        const confirmMessage = t('customer.list.confirmDelete', 'Are you sure you want to delete this customer?');
        if (!window.confirm(`${confirmMessage}\n\n${customer.fullName}`)) return;

        try {
            await customerService.delete(customer.id);
            setCustomers(prev => prev.filter(c => c.id !== customer.id));

            // Show success feedback (you can replace with toast notification)
            console.log('✅ Customer deleted successfully');
        } catch (err) {
            console.error('❌ Error deleting customer:', err);
            setError(t('customer.list.deleteError', 'Failed to delete customer'));
        }
    };

    // Sorting function with enhanced logic
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setSortBy(key);
    };

    // Memoized filtered and sorted customers for performance
    const filteredAndSortedCustomers = useMemo(() => {
        let result = [...customers];

        // Apply search filter
        if (searchTerm.trim()) {
            const searchTermLower = searchTerm.toLowerCase();
            result = result.filter(customer => {
                const searchableFields = [
                    customer.fullName,
                    customer.email,
                    customer.phoneNumber,
                    customer.licenseNumber,
                    customer.nationalId,
                    customer.passportId,
                    customer.address
                ].filter(Boolean);

                return searchableFields.some(field =>
                    field.toLowerCase().includes(searchTermLower)
                );
            });
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            const isBlacklistedFilter = statusFilter === 'blacklisted';
            result = result.filter(customer => customer.isBlacklisted === isBlacklistedFilter);
        }

        // Apply sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle different data types
                if (sortConfig.key === 'dateOfBirth') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                } else if (typeof aValue === 'boolean') {
                    aValue = aValue ? 1 : 0;
                    bValue = bValue ? 1 : 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [customers, searchTerm, statusFilter, sortConfig]);

    // Navigation handlers
    const navigateToDetails = (id) => {
        navigate(`/customers/${id}`);
    };

    const navigateToEdit = (id, e) => {
        e.stopPropagation();
        navigate(`/customers/${id}/edit`);
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortBy('fullName');
        setSortConfig({ key: 'fullName', direction: 'ascending' });
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return '-';
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`customerlist-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="customerlist-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading', 'Loading')}...</p>
                </div>
            </div>
        );
    }

    // Statistics
    const totalCustomers = customers.length;
    const blacklistedCustomers = customers.filter(c => c.isBlacklisted).length;
    const filteredCount = filteredAndSortedCustomers.length;

    return (
        <div className={`customerlist-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header Section */}
            <div className="customerlist-header">
                <div className="header-main">
                    <h1 className="customerlist-title">
                        {t('customer.list.title', 'Customers')}
                    </h1>
                    <div className="header-stats">
                        <span className="stat-item">
                            {t('customer.list.total', 'Total')}: {totalCustomers}
                        </span>
                        {blacklistedCustomers > 0 && (
                            <span className="stat-item blacklisted">
                                {t('customer.list.blacklisted', 'Blacklisted')}: {blacklistedCustomers}
                            </span>
                        )}
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="btn-add"
                        onClick={() => navigate('/customers/add')}
                        aria-label={t('customer.list.addNew', 'Add New Customer')}
                    >
                        <span className="btn-icon">+</span>
                        <span className="btn-text">{t('customer.list.addNew', 'Add New')}</span>
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="customerlist-error" role="alert">
                    <span className="error-icon">⚠️</span>
                    <span className="error-message">{error}</span>
                    <button
                        className="error-retry"
                        onClick={fetchCustomers}
                        aria-label={t('common.retry', 'Retry')}
                    >
                        {t('common.retry', 'Retry')}
                    </button>
                </div>
            )}

            {/* Search and Filter Section */}
            <div className="customerlist-controls">
                <div className="search-section">
                    <div className="search-input-customers-wrapper">
                        <input
                            type="text"
                            className="search-input-customers"
                            placeholder={t('customer.list.searchPlaceholder', 'Search customers...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label={t('customer.list.searchPlaceholder', 'Search customers')}
                        />
                        <span className="search-icon-customers">🔍</span>
                    </div>

                    <button
                        className={`filter-toggle ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        aria-label={t('common.filters', 'Filters')}
                    >
                        <span className="filter-icon">⚙️</span>
                        <span className="filter-text">{t('common.filters', 'Filters')}</span>
                    </button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="filters-section">
                        <div className="filter-group">
                            <label className="filter-label">
                                {t('customer.list.status', 'Status')}:
                            </label>
                            <select
                                className="filter-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">{t('common.all', 'All')}</option>
                                <option value="active">{t('customer.list.active', 'Active')}</option>
                                <option value="blacklisted">{t('customer.list.blacklisted', 'Blacklisted')}</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">
                                {t('common.sortBy', 'Sort by')}:
                            </label>
                            <select
                                className="filter-select"
                                value={sortBy}
                                onChange={(e) => requestSort(e.target.value)}
                            >
                                <option value="fullName">{t('customer.fields.fullName', 'Full Name')}</option>
                                <option value="phoneNumber">{t('customer.fields.phoneNumber', 'Phone')}</option>
                                <option value="email">{t('customer.fields.email', 'Email')}</option>
                                <option value="dateOfBirth">{t('customer.fields.dateOfBirth', 'Date of Birth')}</option>
                                <option value="isBlacklisted">{t('customer.fields.isBlacklisted', 'Status')}</option>
                            </select>
                        </div>

                        <div className="filter-actions">
                            <button
                                className="btn-clear-filters"
                                onClick={clearFilters}
                            >
                                {t('common.clearFilters', 'Clear Filters')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Results Summary */}
                <div className="results-summary">
                    {searchTerm || statusFilter !== 'all' ? (
                        <p className="results-text">
                            {t('common.showingResults', 'Showing {{count}} of {{total}} customers', {
                                count: filteredCount,
                                total: totalCustomers
                            })}
                        </p>
                    ) : (
                        <p className="results-text">
                            {t('customer.list.totalCustomers', 'Total: {{count}} customers', {
                                count: totalCustomers
                            })}
                        </p>
                    )}
                </div>
            </div>

            {/* View Mode Toggle (Desktop) */}
            <div className="view-mode-toggle desktop-only">
                <button
                    className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                    aria-label={t('common.cardView', 'Card View')}
                >
                    <span className="view-icon">⊞</span>
                    <span>{t('common.cards', 'Cards')}</span>
                </button>
                <button
                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                    aria-label={t('common.tableView', 'Table View')}
                >
                    <span className="view-icon">☰</span>
                    <span>{t('common.table', 'Table')}</span>
                </button>
            </div>

            {/* No Results State */}
            {filteredAndSortedCustomers.length === 0 && !isLoading && (
                <div className="no-results">
                    <div className="no-results-icon">👥</div>
                    <h3 className="no-results-title">
                        {searchTerm || statusFilter !== 'all'
                            ? t('customer.list.noResults', 'No customers found')
                            : t('customer.list.noCustomers', 'No customers yet')
                        }
                    </h3>
                    <p className="no-results-description">
                        {searchTerm || statusFilter !== 'all'
                            ? t('customer.list.tryDifferentSearch', 'Try adjusting your search or filters')
                            : t('customer.list.getStarted', 'Add your first customer to get started')
                        }
                    </p>
                    {(searchTerm || statusFilter !== 'all') && (
                        <button
                            className="btn-clear-search"
                            onClick={clearFilters}
                        >
                            {t('common.clearSearch', 'Clear Search')}
                        </button>
                    )}
                    {!searchTerm && statusFilter === 'all' && (
                        <button
                            className="btn-add-first"
                            onClick={() => navigate('/customers/add')}
                        >
                            {t('customer.list.addFirstCustomer', 'Add First Customer')}
                        </button>
                    )}
                </div>
            )}

            {/* Desktop Table View */}
            {viewMode === 'table' && filteredAndSortedCustomers.length > 0 && (
                <div className="customerlist-table-wrapper desktop-only">
                    <div className="table-container">
                        <table className="customerlist-table">
                            <thead>
                                <tr>
                                    <th
                                        onClick={() => requestSort('fullName')}
                                        className={`sortable ${sortConfig.key === 'fullName' ? `sorted-${sortConfig.direction}` : ''}`}
                                    >
                                        {t('customer.fields.fullName', 'Full Name')}
                                        <span className="sort-indicator"></span>
                                    </th>
                                    <th
                                        onClick={() => requestSort('phoneNumber')}
                                        className={`sortable ${sortConfig.key === 'phoneNumber' ? `sorted-${sortConfig.direction}` : ''}`}
                                    >
                                        {t('customer.fields.phoneNumber', 'Phone')}
                                        <span className="sort-indicator"></span>
                                    </th>
                                    <th
                                        onClick={() => requestSort('email')}
                                        className={`sortable ${sortConfig.key === 'email' ? `sorted-${sortConfig.direction}` : ''}`}
                                    >
                                        {t('customer.fields.email', 'Email')}
                                        <span className="sort-indicator"></span>
                                    </th>
                                    <th
                                        onClick={() => requestSort('licenseNumber')}
                                        className={`sortable ${sortConfig.key === 'licenseNumber' ? `sorted-${sortConfig.direction}` : ''}`}
                                    >
                                        {t('customer.fields.licenseNumber', 'License')}
                                        <span className="sort-indicator"></span>
                                    </th>
                                    <th
                                        onClick={() => requestSort('dateOfBirth')}
                                        className={`sortable ${sortConfig.key === 'dateOfBirth' ? `sorted-${sortConfig.direction}` : ''}`}
                                    >
                                        {t('customer.fields.dateOfBirth', 'Date of Birth')}
                                        <span className="sort-indicator"></span>
                                    </th>
                                    <th
                                        onClick={() => requestSort('isBlacklisted')}
                                        className={`sortable ${sortConfig.key === 'isBlacklisted' ? `sorted-${sortConfig.direction}` : ''}`}
                                    >
                                        {t('customer.fields.isBlacklisted', 'Status')}
                                        <span className="sort-indicator"></span>
                                    </th>
                                    <th className="actions-header">
                                        {t('customer.list.actions', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="table-row clickable"
                                        onClick={() => navigateToDetails(customer.id)}
                                    >
                                        <td className="customer-name-cell">
                                            {customer.fullName}
                                        </td>
                                        <td>{customer.phoneNumber || '-'}</td>
                                        <td>{customer.email || '-'}</td>
                                        <td>{customer.licenseNumber || '-'}</td>
                                        <td>{formatDate(customer.dateOfBirth)}</td>
                                        <td>
                                            <span className={`status-badge ${customer.isBlacklisted ? 'blacklisted' : 'active'}`}>
                                                {customer.isBlacklisted
                                                    ? t('customer.status.blacklisted', 'Blacklisted')
                                                    : t('customer.status.active', 'Active')
                                                }
                                            </span>
                                        </td>
                                        <td className="table-actions">
                                            <div className="action-buttons">
                                                <button
                                                    onClick={(e) => navigateToEdit(customer.id, e)}
                                                    className="btn-table-action edit"
                                                    title={t('common.edit', 'Edit')}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(customer, e)}
                                                    className="btn-table-action delete"
                                                    title={t('common.delete', 'Delete')}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mobile Card View (Default) */}
            {(viewMode === 'cards' || window.innerWidth <= 768) && filteredAndSortedCustomers.length > 0 && (
                <div className="customerlist-cards">
                    {filteredAndSortedCustomers.map((customer) => (
                        <div
                            key={customer.id}
                            className="customer-card"
                            onClick={() => navigateToDetails(customer.id)}
                        >
                            <div className="customer-card-header">
                                <h3 className="customer-name">
                                    {customer.fullName}
                                </h3>
                                <div className="customer-status">
                                    <span className={`status-badge ${customer.isBlacklisted ? 'blacklisted' : 'active'}`}>
                                        {customer.isBlacklisted
                                            ? t('customer.status.blacklisted', 'Blacklisted')
                                            : t('customer.status.active', 'Active')
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="customer-card-body">
                                <div className="customer-info">
                                    {customer.phoneNumber && (
                                        <div className="info-item">
                                            <span className="info-label">
                                                {t('customer.fields.phoneNumber', 'Phone')}:
                                            </span>
                                            <span className="info-value">
                                                <a href={`tel:${customer.phoneNumber}`} onClick={(e) => e.stopPropagation()}>
                                                    {customer.phoneNumber}
                                                </a>
                                            </span>
                                        </div>
                                    )}

                                    {customer.email && (
                                        <div className="info-item">
                                            <span className="info-label">
                                                {t('customer.fields.email', 'Email')}:
                                            </span>
                                            <span className="info-value">
                                                <a href={`mailto:${customer.email}`} onClick={(e) => e.stopPropagation()}>
                                                    {customer.email}
                                                </a>
                                            </span>
                                        </div>
                                    )}

                                    {customer.licenseNumber && (
                                        <div className="info-item">
                                            <span className="info-label">
                                                {t('customer.fields.licenseNumber', 'License')}:
                                            </span>
                                            <span className="info-value">{customer.licenseNumber}</span>
                                        </div>
                                    )}

                                    <div className="info-item">
                                        <span className="info-label">
                                            {t('customer.fields.dateOfBirth', 'Date of Birth')}:
                                        </span>
                                        <span className="info-value">{formatDate(customer.dateOfBirth)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="customer-card-actions">
                                <Link
                                    to={`/customers/${customer.id}`}
                                    className="btn-action primary"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {t('common.details', 'Details')}
                                </Link>
                                <Link
                                    to={`/customers/${customer.id}/edit`}
                                    className="btn-action secondary"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {t('common.edit', 'Edit')}
                                </Link>
                                <button
                                    onClick={(e) => handleDelete(customer, e)}
                                    className="btn-action danger"
                                >
                                    {t('common.delete', 'Delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomersList;