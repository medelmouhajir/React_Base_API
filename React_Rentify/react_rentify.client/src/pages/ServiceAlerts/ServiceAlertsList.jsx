import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import serviceAlertService from '../../services/serviceAlertService';
import './ServiceAlertsList.css';

const ServiceAlertsList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, overdue, resolved
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchServiceAlerts();
    }, []);

    const fetchServiceAlerts = async () => {
        try {
            setIsLoading(true);
            const data = await serviceAlertService.getAll();
            setAlerts(data);
        } catch (err) {
            console.error('❌ Error fetching service alerts:', err);
            setError(t('serviceAlerts.fetchError') || 'Error loading service alerts.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (alertId) => {
        if (!window.confirm(t('serviceAlerts.resolveConfirm') || 'Mark this alert as resolved?')) {
            return;
        }

        try {
            await serviceAlertService.resolve(alertId, {
                notes: 'Resolved from dashboard'
            });
            await fetchServiceAlerts(); // Refresh the list
        } catch (err) {
            console.error('❌ Error resolving alert:', err);
            setError(t('serviceAlerts.resolveError') || 'Error resolving alert.');
        }
    };

    const handleEdit = (alertId) => {
        navigate(`/service-alerts/edit/${alertId}`);
    };

    const handleAdd = () => {
        navigate('/service-alerts/add');
    };

    const getAlertTypeIcon = (alertType) => {
        const icons = {
            1: '🛢️', // Oil Change
            2: '🚙', // Brake Inspection
            3: '🔄', // Tire Rotation
            4: '💧', // Fluid Check
            5: '🔧', // Drain
            10: '⚙️' // Other
        };
        return icons[alertType] || '⚙️';
    };

    const getStatusBadge = (alert) => {
        if (alert.isResolved) {
            return <span className="status-badge resolved">✅ {t('serviceAlerts.status.resolved') || 'Resolved'}</span>;
        }
        if (alert.isOverdue) {
            return <span className="status-badge overdue">⚠️ {t('serviceAlerts.status.overdue') || 'Overdue'}</span>;
        }
        return <span className="status-badge pending">⏳ {t('serviceAlerts.status.pending') || 'Pending'}</span>;
    };

    const filteredAlerts = alerts.filter(alert => {
        // Apply status filter
        if (filter === 'pending' && (alert.isResolved || alert.isOverdue)) return false;
        if (filter === 'overdue' && !alert.isOverdue) return false;
        if (filter === 'resolved' && !alert.isResolved) return false;

        // Apply search filter
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            return (
                alert.alertTypeName.toLowerCase().includes(searchLower) ||
                alert.carInfo?.licensePlate.toLowerCase().includes(searchLower) ||
                alert.carInfo?.manufacturer.toLowerCase().includes(searchLower) ||
                alert.carInfo?.model.toLowerCase().includes(searchLower)
            );
        }

        return true;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="service-alerts-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="service-alerts-container">
            {/* Header */}
            <div className="alerts-header">
                <h1 className="alerts-title">
                    {t('serviceAlerts.title') || 'Service Alerts'}
                </h1>
                <button
                    className="btn-primary add-alert-btn"
                    onClick={handleAdd}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t('serviceAlerts.addAlert') || 'Add Alert'}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message" role="alert">
                    {error}
                </div>
            )}

            {/* Filters and Search */}
            <div className="alerts-controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder={t('serviceAlerts.search.placeholder') || 'Search alerts...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-tabs">
                    {['all', 'pending', 'overdue', 'resolved'].map(filterType => (
                        <button
                            key={filterType}
                            className={`filter-tab ${filter === filterType ? 'active' : ''}`}
                            onClick={() => setFilter(filterType)}
                        >
                            {t(`serviceAlerts.filter.${filterType}`) || filterType}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alerts List */}
            <div className="alerts-grid">
                {filteredAlerts.length === 0 ? (
                    <div className="no-alerts">
                        <p>{t('serviceAlerts.noAlerts') || 'No service alerts found.'}</p>
                    </div>
                ) : (
                    filteredAlerts.map(alert => (
                        <div key={alert.id} className={`alert-card ${alert.isOverdue ? 'overdue' : ''} ${alert.isResolved ? 'resolved' : ''}`}>
                            <div className="alert-header">
                                <div className="alert-icon">
                                    {getAlertTypeIcon(alert.alertType)}
                                </div>
                                <div className="alert-info">
                                    <h3 className="alert-type">{alert.alertTypeName}</h3>
                                    <p className="car-info">
                                        {alert.carInfo?.manufacturer} {alert.carInfo?.model} • {alert.carInfo?.licensePlate}
                                    </p>
                                </div>
                                {getStatusBadge(alert)}
                            </div>

                            <div className="alert-body">
                                <div className="alert-date">
                                    <span className="label">{t('serviceAlerts.dueDate') || 'Due Date'}:</span>
                                    <span className="value">{formatDate(alert.dueDate)}</span>
                                </div>

                                {alert.dueMileage && (
                                    <div className="alert-mileage">
                                        <span className="label">{t('serviceAlerts.dueMileage') || 'Due Mileage'}:</span>
                                        <span className="value">{alert.dueMileage.toLocaleString()} km</span>
                                    </div>
                                )}

                                {alert.daysUntilDue !== undefined && (
                                    <div className="alert-countdown">
                                        <span className={`countdown ${alert.daysUntilDue < 0 ? 'overdue' : alert.daysUntilDue < 7 ? 'urgent' : ''}`}>
                                            {alert.daysUntilDue < 0
                                                ? `${Math.abs(alert.daysUntilDue)} days overdue`
                                                : `${alert.daysUntilDue} days remaining`
                                            }
                                        </span>
                                    </div>
                                )}

                                {alert.notes && (
                                    <div className="alert-notes">
                                        <span className="label">{t('serviceAlerts.notes') || 'Notes'}:</span>
                                        <p className="notes-text">{alert.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="alert-actions">
                                {!alert.isResolved && (
                                    <button
                                        className="btn-success resolve-btn"
                                        onClick={() => handleResolve(alert.id)}
                                    >
                                        ✓ {t('serviceAlerts.resolve') || 'Resolve'}
                                    </button>
                                )}
                                <button
                                    className="btn-secondary edit-btn"
                                    onClick={() => handleEdit(alert.id)}
                                >
                                    ✏️ {t('common.edit') || 'Edit'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ServiceAlertsList;