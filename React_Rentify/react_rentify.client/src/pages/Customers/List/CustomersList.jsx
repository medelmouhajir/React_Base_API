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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const [sortBy, setSortBy] = useState('fullName');
    const [selectedCustomers, setSelectedCustomers] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showDeleteToast, setShowDeleteToast] = useState(false);
    const [deletedCustomer, setDeletedCustomer] = useState(null);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch customers
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
            console.error('Error fetching customers:', err);
            setError(t('customer.list.error', 'Failed to load customers'));
        } finally {
            setIsLoading(false);
        }
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return '?';
        const names = name.trim().split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Get avatar color based on name
    const getAvatarColor = (name) => {
        if (!name) return '#6366f1';
        const colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
            '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // Enhanced delete handler with undo
    const handleDelete = async (customer, e) => {
        if (e) e.stopPropagation();

        setDeletedCustomer(customer);
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
        setShowDeleteToast(true);

        setTimeout(() => {
            if (deletedCustomer?.id === customer.id) {
                customerService.delete(customer.id).catch(err => {
                    console.error('Error deleting customer:', err);
                    setCustomers(prev => [...prev, customer]);
                });
                setShowDeleteToast(false);
                setDeletedCustomer(null);
            }
        }, 5000);
    };

    // Undo delete
    const handleUndoDelete = () => {
        if (deletedCustomer) {
            setCustomers(prev => [...prev, deletedCustomer]);
            setShowDeleteToast(false);
            setDeletedCustomer(null);
        }
    };

    // Filtering and sorting
    const filteredAndSortedCustomers = useMemo(() => {
        let filtered = customers.filter(customer => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                customer.fullName?.toLowerCase().includes(searchTermLower) ||
                customer.email?.toLowerCase().includes(searchTermLower) ||
                customer.phoneNumber?.toLowerCase().includes(searchTermLower);

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'blacklisted' && customer.isBlacklisted) ||
                (statusFilter === 'active' && !customer.isBlacklisted);

            return matchesSearch && matchesStatus;
        });

        filtered.sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';

            if (typeof aValue === 'string') {
                return sortConfig.direction === 'ascending'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortConfig.direction === 'ascending'
                ? (aValue < bValue ? -1 : 1)
                : (aValue > bValue ? -1 : 1);
        });

        return filtered;
    }, [customers, searchTerm, statusFilter, sortBy, sortConfig.direction]);

    // Quick filter
    const QuickFilter = ({ label, value, count }) => (
        <button
            className={`quick-filter-chip ${statusFilter === value ? 'active' : ''}`}
            onClick={() => setStatusFilter(value)}
        >
            {label}
            <span className="chip-count">{count}</span>
        </button>
    );

    // Statistics
    const totalCustomers = customers.length;
    const blacklistedCount = customers.filter(c => c.isBlacklisted).length;
    const activeCount = totalCustomers - blacklistedCount;

    // Loading skeleton
    if (isLoading) {
        return (
            <div className={`customers-modern-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="skeleton-loader">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton-avatar"></div>
                            <div className="skeleton-content">
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line short"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`customers-modern-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Hero Header with Gradient */}
            <div className="hero-header">
                <div className="hero-content">
                    <div className="hero-icon">👥</div>
                    <h1 className="hero-title">{t('customer.list.title', 'Customers')}</h1>
                    <p className="hero-subtitle">
                        {t('customer.list.subtitle', 'Manage your customer relationships')}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <span className="stat-label">{t('customer.list.total', 'Total')}</span>
                            <span className="stat-value">{totalCustomers}</span>
                        </div>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-icon">✓</div>
                        <div className="stat-info">
                            <span className="stat-label">{t('customer.list.active', 'Active')}</span>
                            <span className="stat-value">{activeCount}</span>
                        </div>
                    </div>
                    {blacklistedCount > 0 && (
                        <div className="stat-card danger">
                            <div className="stat-icon">⚠</div>
                            <div className="stat-info">
                                <span className="stat-label">{t('customer.list.blacklisted', 'Blacklisted')}</span>
                                <span className="stat-value">{blacklistedCount}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                    <button onClick={fetchCustomers} className="error-retry-btn">
                        {t('common.retry', 'Retry')}
                    </button>
                </div>
            )}

            {/* Search Bar */}
            <div className="search-bar-container">
                <div className="search-customers-input-wrapper">
                    <svg className="search-customers-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="search"
                        className="search-customers-input"
                        placeholder={t('customer.list.searchPlaceholder', 'Search by name, email, or phone...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="customers-clear-search" onClick={() => setSearchTerm('')}>
                            ✕
                        </button>
                    )}
                </div>

                <button
                    className="filter-btn"
                    onClick={() => setShowFilterSheet(!showFilterSheet)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 6h18M7 12h10M11 18h2" />
                    </svg>
                </button>
            </div>

            {/* Quick Filter Chips */}
            <div className="quick-filters">
                <QuickFilter label={t('customer.list.all', 'All')} value="all" count={totalCustomers} />
                <QuickFilter label={t('customer.list.active', 'Active')} value="active" count={activeCount} />
                <QuickFilter label={t('customer.list.blacklisted', 'Blacklisted')} value="blacklisted" count={blacklistedCount} />
            </div>

            {/* Filter Bottom Sheet (Mobile) */}
            {showFilterSheet && (
                <div className="bottom-sheet-overlay" onClick={() => setShowFilterSheet(false)}>
                    <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-handle"></div>
                        <h3 className="sheet-title">{t('customer.list.filters', 'Filters & Sorting')}</h3>

                        <div className="sheet-content">
                            <div className="filter-group">
                                <label>{t('customer.list.sortBy', 'Sort By')}</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="fullName">{t('customer.fields.fullName', 'Name')}</option>
                                    <option value="email">{t('customer.fields.email', 'Email')}</option>
                                    <option value="phoneNumber">{t('customer.fields.phoneNumber', 'Phone')}</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>{t('customer.list.sortOrder', 'Order')}</label>
                                <div className="toggle-buttons">
                                    <button
                                        className={sortConfig.direction === 'ascending' ? 'active' : ''}
                                        onClick={() => setSortConfig(prev => ({ ...prev, direction: 'ascending' }))}
                                    >
                                        ↑ A-Z
                                    </button>
                                    <button
                                        className={sortConfig.direction === 'descending' ? 'active' : ''}
                                        onClick={() => setSortConfig(prev => ({ ...prev, direction: 'descending' }))}
                                    >
                                        ↓ Z-A
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            className="sheet-close-btn"
                            onClick={() => setShowFilterSheet(false)}
                        >
                            {t('common.apply', 'Apply')}
                        </button>
                    </div>
                </div>
            )}

            {/* Customer List */}
            <div className="customers-list">
                {filteredAndSortedCustomers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-illustration">
                            <svg viewBox="0 0 200 200" fill="none">
                                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.1" />
                                <path d="M100 60 L100 100 L130 130" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className="empty-title">
                            {searchTerm || statusFilter !== 'all'
                                ? t('customer.list.noResults', 'No customers found')
                                : t('customer.list.noCustomers', 'No customers yet')
                            }
                        </h3>
                        <p className="empty-description">
                            {searchTerm || statusFilter !== 'all'
                                ? t('customer.list.tryDifferent', 'Try adjusting your search or filters')
                                : t('customer.list.getStarted', 'Add your first customer to get started')
                            }
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <button className="btn-primary" onClick={() => navigate('/customers/add')}>
                                + {t('customer.list.addFirst', 'Add First Customer')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {filteredAndSortedCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                className={`customer-card-modern ${customer.isBlacklisted ? 'blacklisted' : ''}`}
                                onClick={() => navigate(`/customers/${customer.id}`)}
                            >
                                {/* Status Bar */}
                                <div className={`status-bar ${customer.isBlacklisted ? 'red' : 'green'}`}></div>

                                {/* Avatar */}
                                <div
                                    className="customer-avatar"
                                    style={{ backgroundColor: getAvatarColor(customer.fullName) }}
                                >
                                    {getInitials(customer.fullName)}
                                </div>

                                {/* Content */}
                                <div className="customer-content">
                                    <div className="customer-header-row">
                                        <h3 className="customer-name">{customer.fullName}</h3>
                                        {customer.isBlacklisted && (
                                            <span className="badge-warning">⚠ Blacklisted</span>
                                        )}
                                    </div>

                                    <div className="customer-info">
                                        {customer.email && (
                                            <div className="info-item">
                                                <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                                    <path d="m3 7 9 6 9-6" />
                                                </svg>
                                                <span>{customer.email}</span>
                                            </div>
                                        )}
                                        {customer.phoneNumber && (
                                            <div className="info-item">
                                                <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                                <span>{customer.phoneNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="customer-actions">
                                    <button
                                        className="action-btn-icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/customers/${customer.id}/edit`);
                                        }}
                                        title={t('common.edit', 'Edit')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="action-btn-icon danger"
                                        onClick={(e) => handleDelete(customer, e)}
                                        title={t('common.delete', 'Delete')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Floating Action Button (Mobile) */}
            {isMobile && (
                <button
                    className="fab"
                    onClick={() => navigate('/customers/add')}
                    aria-label={t('customer.list.addNew', 'Add Customer')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            )}

            {/* Desktop Add Button */}
            {!isMobile && (
                <button
                    className="btn-add-desktop"
                    onClick={() => navigate('/customers/add')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>{t('customer.list.addNew', 'Add Customer')}</span>
                </button>
            )}

            {/* Undo Toast */}
            {showDeleteToast && (
                <div className="toast-notification">
                    <span>{t('customer.list.deleted', 'Customer deleted')}</span>
                    <button className="toast-undo" onClick={handleUndoDelete}>
                        {t('common.undo', 'Undo')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomersList;