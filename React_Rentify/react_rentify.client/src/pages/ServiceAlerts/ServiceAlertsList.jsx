// src/pages/ServiceAlerts/ServiceAlertsList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import serviceAlertService from '../../services/serviceAlertService';
import LoadingScreen from '../../components/ui/LoadingScreen';
import './ServiceAlertsList.css';

const ServiceAlertsList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    // State Management
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('cards'); // cards or table
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });

    // Filter States
    const [filters, setFilters] = useState({
        status: 'all', // all, resolved, unresolved, overdue
        alertType: 'all',
        searchTerm: '',
        dateRange: 'all' // all, week, month, year
    });

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load Service Alerts
    useEffect(() => {
        loadServiceAlerts();
    }, []);

    const loadServiceAlerts = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await serviceAlertService.getAll();
            setAlerts(data);
        } catch (err) {
            console.error('Error loading service alerts:', err);
            setError(t('alerts.list.error') || 'Failed to load service alerts');
            toast.error(t('alerts.list.error') || 'Failed to load service alerts');
        } finally {
            setLoading(false);
        }
    };

    // Get Alert Type Options
    const alertTypeOptions = serviceAlertService.getAlertTypeOptions();

    // Filter and Sort Logic
    const filteredAndSortedAlerts = useMemo(() => {
        let filtered = alerts.filter(alert => {
            // Status filter
            if (filters.status !== 'all') {
                if (filters.status === 'resolved' && !alert.isResolved) return false;
                if (filters.status === 'unresolved' && alert.isResolved) return false;
                if (filters.status === 'overdue' && (!alert.isOverdue || alert.isResolved)) return false;
            }

            // Alert type filter
            if (filters.alertType !== 'all' && alert.alertType !== parseInt(filters.alertType)) return false;

            // Search filter
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const matchesLicensePlate = alert.carInfo?.licensePlate?.toLowerCase().includes(searchLower);
                const matchesCarInfo = `${alert.carInfo?.manufacturer || ''} ${alert.carInfo?.model || ''}`.toLowerCase().includes(searchLower);
                const matchesAlertType = alert.alertTypeName?.toLowerCase().includes(searchLower);
                const matchesNotes = alert.notes?.toLowerCase().includes(searchLower);

                if (!matchesLicensePlate && !matchesCarInfo && !matchesAlertType && !matchesNotes) return false;
            }

            // Date range filter
            if (filters.dateRange !== 'all') {
                const alertDate = new Date(alert.dueDate);
                const now = new Date();
                const daysAgo = Math.floor((now - alertDate) / (1000 * 60 * 60 * 24));

                if (filters.dateRange === 'week' && Math.abs(daysAgo) > 7) return false;
                if (filters.dateRange === 'month' && Math.abs(daysAgo) > 30) return false;
                if (filters.dateRange === 'year' && Math.abs(daysAgo) > 365) return false;
            }

            return true;
        });

        // Sort logic
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle nested properties
                if (sortConfig.key === 'licensePlate') {
                    aValue = a.carInfo?.licensePlate || '';
                    bValue = b.carInfo?.licensePlate || '';
                } else if (sortConfig.key === 'carInfo') {
                    aValue = `${a.carInfo?.manufacturer || ''} ${a.carInfo?.model || ''}`;
                    bValue = `${b.carInfo?.manufacturer || ''} ${b.carInfo?.model || ''}`;
                }

                // Handle dates
                if (sortConfig.key === 'dueDate') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [alerts, filters, sortConfig]);

    // Event Handlers
    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
    };

    const toggleFilters = () => {
        setShowFilters(prev => !prev);
    };

    const handleResolveAlert = async (alertId) => {
        try {
            await serviceAlertService.resolve(alertId, { notes: 'Resolved from alerts list' });
            toast.success(t('alerts.list.resolved') || 'Service alert resolved successfully');
            loadServiceAlerts();
        } catch (err) {
            console.error('Error resolving alert:', err);
            toast.error(t('alerts.list.resolveError') || 'Failed to resolve service alert');
        }
    };

    const handleDeleteAlert = async (alertId) => {
        if (!window.confirm(t('alerts.list.deleteConfirm') || 'Are you sure you want to delete this service alert?')) {
            return;
        }

        try {
            await serviceAlertService.delete(alertId);
            toast.success(t('alerts.list.deleted') || 'Service alert deleted successfully');
            loadServiceAlerts();
        } catch (err) {
            console.error('Error deleting alert:', err);
            toast.error(t('alerts.list.deleteError') || 'Failed to delete service alert');
        }
    };

    const getAlertStatusClass = (alert) => {
        if (alert.isResolved) return 'resolved';
        if (alert.isOverdue) return 'overdue';
        if (alert.daysUntilDue <= 7) return 'urgent';
        return 'pending';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysUntilDueText = (alert) => {
        if (alert.isResolved) return t('alerts.status.resolved') || 'Resolved';
        if (alert.isOverdue) return t('alerts.status.overdue') || `${Math.abs(alert.daysUntilDue)} days overdue`;
        if (alert.daysUntilDue === 0) return t('alerts.status.today') || 'Due today';
        if (alert.daysUntilDue === 1) return t('alerts.status.tomorrow') || 'Due tomorrow';
        return `${alert.daysUntilDue} days remaining`;
    };

    // Loading State
    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className={`alertsList-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header Section */}
            <div className="alertsList-header">
                <div className="header-content">
                    <div className="header-info">
                        <h1 className="header-title">
                            {t('alerts.list.title') || 'Service Alerts'}
                        </h1>
                        <p className="header-subtitle">
                            {filteredAndSortedAlerts.length} {t('alerts.list.total') || 'total alerts'}
                            {filteredAndSortedAlerts.filter(a => !a.isResolved).length > 0 &&
                                ` • ${filteredAndSortedAlerts.filter(a => !a.isResolved).length} active`
                            }
                        </p>
                    </div>

                    <div className="header-actions">
                        {!isMobile && (
                            <div className="view-toggle">
                                <button
                                    className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                                    onClick={() => setViewMode('cards')}
                                    aria-label="Card view"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                    </svg>
                                </button>
                                <button
                                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                    onClick={() => setViewMode('table')}
                                    aria-label="Table view"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18" />
                                        <path d="M3 12h18" />
                                        <path d="M3 18h18" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <button
                            className="add-button"
                            onClick={() => navigate('/service-alerts/add')}
                            aria-label={t('alerts.list.addButton') || 'Add Service Alert'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {!isMobile && (t('alerts.list.addButton') || 'Add Alert')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alertsList-error" role="alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Filters Toggle */}
            <button
                className={`filters-toggle ${showFilters ? 'open' : ''}`}
                onClick={toggleFilters}
                aria-expanded={showFilters}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
                </svg>
                {showFilters
                    ? t('alerts.list.filter.hide') || 'Hide Filters'
                    : t('alerts.list.filter.show') || 'Show Filters'}
                <span className="toggle-icon">{showFilters ? '▲' : '▼'}</span>
            </button>

            {/* Filters Section */}
            <div className={`filters-container ${showFilters ? 'expanded' : 'collapsed'}`}>
                <div className="filters-content">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label htmlFor="status-filter" className="filter-label">
                                {t('alerts.list.filter.status') || 'Status'}
                            </label>
                            <select
                                id="status-filter"
                                className="filter-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="all">{t('alerts.list.filter.allStatuses') || 'All Statuses'}</option>
                                <option value="unresolved">{t('alerts.list.filter.unresolved') || 'Active'}</option>
                                <option value="overdue">{t('alerts.list.filter.overdue') || 'Overdue'}</option>
                                <option value="resolved">{t('alerts.list.filter.resolved') || 'Resolved'}</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="type-filter" className="filter-label">
                                {t('alerts.list.filter.type') || 'Alert Type'}
                            </label>
                            <select
                                id="type-filter"
                                className="filter-select"
                                value={filters.alertType}
                                onChange={(e) => handleFilterChange('alertType', e.target.value)}
                            >
                                <option value="all">{t('alerts.list.filter.allTypes') || 'All Types'}</option>
                                {alertTypeOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="date-filter" className="filter-label">
                                {t('alerts.list.filter.dateRange') || 'Date Range'}
                            </label>
                            <select
                                id="date-filter"
                                className="filter-select"
                                value={filters.dateRange}
                                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            >
                                <option value="all">{t('alerts.list.filter.allDates') || 'All Dates'}</option>
                                <option value="week">{t('alerts.list.filter.thisWeek') || 'This Week'}</option>
                                <option value="month">{t('alerts.list.filter.thisMonth') || 'This Month'}</option>
                                <option value="year">{t('alerts.list.filter.thisYear') || 'This Year'}</option>
                            </select>
                        </div>
                    </div>

                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                className="search-input"
                                placeholder={t('alerts.list.search') || 'Search alerts...'}
                                value={filters.searchTerm}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                            />
                            {filters.searchTerm && (
                                <button
                                    className="search-clear"
                                    onClick={() => handleFilterChange('searchTerm', '')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="alertsList-content">
                {filteredAndSortedAlerts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <h3 className="empty-title">
                            {t('alerts.list.empty.title') || 'No Service Alerts Found'}
                        </h3>
                        <p className="empty-description">
                            {filters.searchTerm || filters.status !== 'all' || filters.alertType !== 'all'
                                ? (t('alerts.list.empty.filtered') || 'No alerts match your current filters.')
                                : (t('alerts.list.empty.none') || 'No service alerts have been created yet.')
                            }
                        </p>
                        <button
                            className="empty-action-btn"
                            onClick={() => navigate('/maintenances/add')}
                        >
                            {t('alerts.list.empty.create') || 'Create First Alert'}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Cards View */}
                        {viewMode === 'cards' && (
                            <div className="alerts-grid">
                                {filteredAndSortedAlerts.map(alert => (
                                    <div
                                        key={alert.id}
                                        className={`alert-card-car ${getAlertStatusClass(alert)}`}
                                        onClick={() => navigate(`/maintenances/${alert.id}`)}
                                    >
                                        <div className="card-header">
                                            <div className="card-title">
                                                <h3>{alert.alertTypeName}</h3>
                                                <div className="card-subtitle">
                                                    {alert.carInfo?.licensePlate} • {alert.carInfo?.manufacturer} {alert.carInfo?.model}
                                                </div>
                                            </div>
                                            <div className="card-actions">
                                                {!alert.isResolved && (
                                                    <button
                                                        className="action-btn resolve-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResolveAlert(alert.id);
                                                        }}
                                                        title="Mark as resolved"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteAlert(alert.id);
                                                    }}
                                                    title="Delete alert"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="card-content">
                                            <div className="card-field">
                                                <span className="field-label">Due Date:</span>
                                                <span className="field-value">{formatDate(alert.dueDate)}</span>
                                            </div>

                                            <div className="card-field">
                                                <span className="field-label">Status:</span>
                                                <span className={`status-badge status-${getAlertStatusClass(alert)}`}>
                                                    {getDaysUntilDueText(alert)}
                                                </span>
                                            </div>

                                            {alert.dueMileage && (
                                                <div className="card-field">
                                                    <span className="field-label">Due Mileage:</span>
                                                    <span className="field-value">{alert.dueMileage.toLocaleString()} mi</span>
                                                </div>
                                            )}

                                            {alert.notes && (
                                                <div className="card-field notes">
                                                    <span className="field-label">Notes:</span>
                                                    <span className="field-value">{alert.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Table View */}
                        {viewMode === 'table' && !isMobile && (
                            <div className="table-container">
                                <table className="alerts-table">
                                    <thead>
                                        <tr>
                                            <th
                                                className={`sortable ${sortConfig.key === 'licensePlate' ? `sorted-${sortConfig.direction}` : ''}`}
                                                onClick={() => handleSort('licensePlate')}
                                            >
                                                Vehicle
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </th>
                                            <th
                                                className={`sortable ${sortConfig.key === 'alertTypeName' ? `sorted-${sortConfig.direction}` : ''}`}
                                                onClick={() => handleSort('alertTypeName')}
                                            >
                                                Alert Type
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </th>
                                            <th
                                                className={`sortable ${sortConfig.key === 'dueDate' ? `sorted-${sortConfig.direction}` : ''}`}
                                                onClick={() => handleSort('dueDate')}
                                            >
                                                Due Date
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedAlerts.map(alert => (
                                            <tr
                                                key={alert.id}
                                                className={`alert-row ${getAlertStatusClass(alert)}`}
                                                onClick={() => navigate(`/maintenances/${alert.id}`)}
                                            >
                                                <td>
                                                    <div className="vehicle-info">
                                                        <div className="license-plate">{alert.carInfo?.licensePlate}</div>
                                                        <div className="vehicle-details">
                                                            {alert.carInfo?.manufacturer} {alert.carInfo?.model} ({alert.carInfo?.year})
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{alert.alertTypeName}</td>
                                                <td>{formatDate(alert.dueDate)}</td>
                                                <td>
                                                    <span className={`status-badge status-${getAlertStatusClass(alert)}`}>
                                                        {getDaysUntilDueText(alert)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        {!alert.isResolved && (
                                                            <button
                                                                className="action-btn resolve-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResolveAlert(alert.id);
                                                                }}
                                                                title="Mark as resolved"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <button
                                                            className="action-btn delete-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteAlert(alert.id);
                                                            }}
                                                            title="Delete alert"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Mobile Hint */}
                        {isMobile && (
                            <div className="mobile-hint">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                                {t('alerts.list.mobileHint') || 'Tap cards to view details'}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ServiceAlertsList;