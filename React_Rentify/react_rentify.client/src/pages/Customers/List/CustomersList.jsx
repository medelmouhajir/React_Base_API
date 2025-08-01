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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('fullName');

    // Handle window resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

        const confirmMessage = t('customer.list.confirmDelete',
            `Are you sure you want to delete ${customer.fullName}? This action cannot be undone.`);

        if (!window.confirm(confirmMessage)) return;

        try {
            await customerService.delete(customer.id);
            setCustomers(prev => prev.filter(c => c.id !== customer.id));
        } catch (err) {
            console.error('❌ Error deleting customer:', err);
            alert(t('customer.list.deleteError', 'Failed to delete customer'));
        }
    };

    // Enhanced filtering and sorting
    const filteredAndSortedCustomers = useMemo(() => {
        let filtered = customers.filter(customer => {
            // Search filter
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                customer.fullName?.toLowerCase().includes(searchTermLower) ||
                customer.email?.toLowerCase().includes(searchTermLower) ||
                customer.phoneNumber?.toLowerCase().includes(searchTermLower) ||
                customer.licenseNumber?.toLowerCase().includes(searchTermLower);

            // Status filter
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'blacklisted' && customer.isBlacklisted) ||
                (statusFilter === 'active' && !customer.isBlacklisted);

            return matchesSearch && matchesStatus;
        });

        // Sort filtered results
        filtered.sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';

            if (typeof aValue === 'string') {
                return sortConfig.direction === 'ascending'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (sortConfig.direction === 'ascending') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filtered;
    }, [customers, searchTerm, statusFilter, sortBy, sortConfig.direction]);

    // Handle sorting
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
        setSortBy(key);
    };

    // Handle customer card click
    const handleCustomerClick = (customerId) => {
        navigate(`/customers/${customerId}`);
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return '—';
        }
    };

    // Handle view mode toggle
    const toggleViewMode = () => {
        setViewMode(prev => prev === 'cards' ? 'table' : 'cards');
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
                            <span className="stat-label">{t('customer.list.total', 'Total')}:</span>
                            <span className="stat-value">{totalCustomers}</span>
                        </span>
                        {blacklistedCustomers > 0 && (
                            <span className="stat-item blacklisted">
                                <span className="stat-label">{t('customer.list.blacklisted', 'Blacklisted')}:</span>
                                <span className="stat-value">{blacklistedCustomers}</span>
                            </span>
                        )}
                        {filteredCount !== totalCustomers && (
                            <span className="stat-item filtered">
                                <span className="stat-label">{t('customer.list.showing', 'Showing')}:</span>
                                <span className="stat-value">{filteredCount}</span>
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
                        <span className="btn-text">{t('customer.list.addNew', 'Add Customer')}</span>
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
                <div className="search-customers-section">
                    <div className="search-customers-input-wrapper">
                        <input
                            type="text"
                            className="search-customers-input"
                            placeholder={t('customer.list.searchPlaceholder', 'Search customers by name, email, phone...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label={t('customer.list.searchPlaceholder', 'Search customers')}
                        />
                        <span className="search-customers-icon">🔍</span>
                    </div>

                    <div className="control-buttons">
                        <button
                            className={`filter-toggle ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                            aria-label={t('customer.list.toggleFilters', 'Toggle Filters')}
                        >
                            <span className="filter-icon">⚙️</span>
                            <span className="filter-text">{t('customer.list.filters', 'Filters')}</span>
                        </button>

                        {!isMobile && (
                            <button
                                className={`view-toggle ${viewMode}`}
                                onClick={toggleViewMode}
                                aria-label={t('customer.list.toggleView', 'Toggle View Mode')}
                                title={viewMode === 'cards' ? t('customer.list.tableView', 'Table View') : t('customer.list.cardView', 'Card View')}
                            >
                                <span className="view-icon">
                                    {viewMode === 'cards' ? '☰' : '▦'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="filters-section">
                        <div className="filter-grid">
                            <div className="filter-group">
                                <label className="filter-label">
                                    {t('customer.list.filterByStatus', 'Status')}
                                </label>
                                <select
                                    className="filter-select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">{t('customer.list.allCustomers', 'All Customers')}</option>
                                    <option value="active">{t('customer.list.activeOnly', 'Active Only')}</option>
                                    <option value="blacklisted">{t('customer.list.blacklistedOnly', 'Blacklisted Only')}</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">
                                    {t('customer.list.sortBy', 'Sort By')}
                                </label>
                                <select
                                    className="filter-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="fullName">{t('customer.fields.fullName', 'Full Name')}</option>
                                    <option value="email">{t('customer.fields.email', 'Email')}</option>
                                    <option value="phoneNumber">{t('customer.fields.phoneNumber', 'Phone Number')}</option>
                                    <option value="dateOfBirth">{t('customer.fields.dateOfBirth', 'Date of Birth')}</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">
                                    {t('customer.list.sortOrder', 'Order')}
                                </label>
                                <select
                                    className="filter-select"
                                    value={sortConfig.direction}
                                    onChange={(e) => setSortConfig(prev => ({ ...prev, direction: e.target.value }))}
                                >
                                    <option value="ascending">{t('customer.list.ascending', 'A-Z / Low-High')}</option>
                                    <option value="descending">{t('customer.list.descending', 'Z-A / High-Low')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Section */}
            <div className="customerlist-results">
                {filteredAndSortedCustomers.length === 0 ? (
                    <div className="customerlist-empty">
                        <div className="empty-icon">👥</div>
                        <h3 className="empty-title">
                            {searchTerm || statusFilter !== 'all'
                                ? t('customer.list.noResults', 'No customers match your criteria')
                                : t('customer.list.noCustomers', 'No customers yet')
                            }
                        </h3>
                        <p className="empty-description">
                            {searchTerm || statusFilter !== 'all'
                                ? t('customer.list.tryDifferentSearch', 'Try adjusting your search or filters')
                                : t('customer.list.addFirstCustomer', 'Add your first customer to get started')
                            }
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <button
                                className="btn-add-empty"
                                onClick={() => navigate('/customers/add')}
                            >
                                {t('customer.list.addFirst', 'Add First Customer')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Table View - Desktop */}
                        {viewMode === 'table' && !isMobile && (
                            <div className="customerlist-table-container">
                                <table className="customerlist-table">
                                    <thead>
                                        <tr>
                                            <th
                                                className={`sortable ${sortBy === 'fullName' ? `sorted-${sortConfig.direction}` : ''}`}
                                                onClick={() => handleSort('fullName')}
                                            >
                                                {t('customer.fields.fullName', 'Full Name')}
                                                <span className="sort-indicator"></span>
                                            </th>
                                            <th
                                                className={`sortable ${sortBy === 'email' ? `sorted-${sortConfig.direction}` : ''}`}
                                                onClick={() => handleSort('email')}
                                            >
                                                {t('customer.fields.email', 'Email')}
                                                <span className="sort-indicator"></span>
                                            </th>
                                            <th
                                                className={`sortable ${sortBy === 'phoneNumber' ? `sorted-${sortConfig.direction}` : ''}`}
                                                onClick={() => handleSort('phoneNumber')}
                                            >
                                                {t('customer.fields.phoneNumber', 'Phone')}
                                                <span className="sort-indicator"></span>
                                            </th>
                                            <th>{t('customer.fields.status', 'Status')}</th>
                                            <th className="actions-header">{t('common.actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedCustomers.map((customer) => (
                                            <tr
                                                key={customer.id}
                                                onClick={() => handleCustomerClick(customer.id)}
                                                className="table-row"
                                            >
                                                <td className="customer-name-cell">
                                                    {customer.fullName}
                                                    {customer.isBlacklisted && (
                                                        <span className="blacklist-badge">⚠️</span>
                                                    )}
                                                </td>
                                                <td>{customer.email || '—'}</td>
                                                <td>{customer.phoneNumber || '—'}</td>
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
                                                        <Link
                                                            to={`/customers/${customer.id}/edit`}
                                                            className="btn-table-action edit"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title={t('common.edit', 'Edit')}
                                                        >
                                                            ✏️
                                                        </Link>
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
                        )}

                        {/* Card View - Mobile and Desktop */}
                        {(viewMode === 'cards' || isMobile) && (
                            <div className="customerlist-cards">
                                {filteredAndSortedCustomers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className={`customer-card ${customer.isBlacklisted ? 'blacklisted' : ''}`}
                                        onClick={() => handleCustomerClick(customer.id)}
                                    >
                                        <div className="customer-card-header">
                                            <div className="customer-name-section">
                                                <h3 className="customer-name">
                                                    {customer.fullName}
                                                    {customer.isBlacklisted && (
                                                        <span className="blacklist-indicator" title={t('customer.status.blacklisted', 'Blacklisted')}>
                                                            ⚠️
                                                        </span>
                                                    )}
                                                </h3>
                                                <span className={`status-badge ${customer.isBlacklisted ? 'blacklisted' : 'active'}`}>
                                                    {customer.isBlacklisted
                                                        ? t('customer.status.blacklisted', 'Blacklisted')
                                                        : t('customer.status.active', 'Active')
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="customer-card-content">
                                            <div className="customer-info">
                                                {customer.phoneNumber && (
                                                    <div className="info-item">
                                                        <span className="info-label">
                                                            📞 {t('customer.fields.phoneNumber', 'Phone')}:
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
                                                            ✉️ {t('customer.fields.email', 'Email')}:
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
                                                            🆔 {t('customer.fields.licenseNumber', 'License')}:
                                                        </span>
                                                        <span className="info-value">{customer.licenseNumber}</span>
                                                    </div>
                                                )}

                                                <div className="info-item">
                                                    <span className="info-label">
                                                        🎂 {t('customer.fields.dateOfBirth', 'Date of Birth')}:
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
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomersList;