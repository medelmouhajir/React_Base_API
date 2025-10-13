import React from 'react';
import { useTranslation } from 'react-i18next';

const formatRelativeTime = (date, t) => {
    if (!date) {
        return t('gps.lastUpdateUnknown', 'No recent update');
    }

    const now = new Date();
    const diff = now - new Date(date);

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
        return t('gps.lastUpdateNow', 'Updated just now');
    }

    if (minutes < 60) {
        return t('gps.lastUpdateMinutes', '{{count}} minutes ago', { count: minutes });
    }

    if (hours < 24) {
        return t('gps.lastUpdateHours', '{{count}} hours ago', { count: hours });
    }

    return t('gps.lastUpdateDays', '{{count}} days ago', { count: days });
};

const SummaryBar = ({
    stats,
    lastUpdate,
    isMobile,
    onRefresh,
    onToggleDrawer,
    isDrawerOpen,
    onOpenAlerts,
    onSwitchLegacy
}) => {
    const { t } = useTranslation();

    const vehicleStats = stats?.vehicles || { total: 0, online: 0, moving: 0, parked: 0, offline: 0 };
    const routeStats = stats?.route;
    const alertStats = stats?.alerts || { count: 0, unacknowledged: 0 };

    return (
        <header className={`summary-bar ${isMobile ? 'mobile' : ''}`}>
            <div className="summary-primary">
                <div className="summary-heading">
                    <div>
                        <h1>{t('gps.modern.title', 'Fleet command center')}</h1>
                        <p className="summary-subtitle">
                            {t('gps.modern.subtitle', 'Monitor occupancy, routes, and alerts in real-time.')}
                        </p>
                    </div>
                    <div className="summary-actions">
                        <button type="button" className="ghost-btn" onClick={onRefresh}>
                            {t('common.refresh', 'Refresh')}
                        </button>
                        <button type="button" className="ghost-btn" onClick={onSwitchLegacy}>
                            {t('gps.switchLegacy', 'Legacy view')}
                        </button>
                    </div>
                </div>

                <div className="summary-metrics">
                    <div className="metric-card glass">
                        <span className="metric-label">{t('gps.summary.totalVehicles', 'Vehicles')}</span>
                        <span className="metric-value">{vehicleStats.total}</span>
                        <div className="metric-breakdown">
                            <span className="online">{t('gps.status.online', 'Online')} • {vehicleStats.online}</span>
                            <span className="offline">{t('gps.status.offline', 'Offline')} • {vehicleStats.offline}</span>
                        </div>
                    </div>
                    <div className="metric-card glass">
                        <span className="metric-label">{t('gps.summary.moving', 'Moving')}</span>
                        <span className="metric-value">{vehicleStats.moving}</span>
                        <div className="metric-breakdown">
                            <span className="parked">{t('gps.status.parked', 'Parked')} • {vehicleStats.parked}</span>
                        </div>
                    </div>
                    <div className="metric-card glass">
                        <span className="metric-label">{t('gps.summary.alerts', 'Alerts')}</span>
                        <span className="metric-value highlight">{alertStats.count}</span>
                        <div className="metric-breakdown">
                            <button type="button" className="link-btn" onClick={onOpenAlerts}>
                                {t('gps.summary.viewAlerts', '{{count}} critical', { count: alertStats.unacknowledged })}
                            </button>
                        </div>
                    </div>
                    <div className="metric-card glass">
                        <span className="metric-label">{t('gps.summary.route', 'Route distance')}</span>
                        <span className="metric-value">
                            {routeStats?.totalDistance ? `${routeStats.totalDistance.toFixed(1)} km` : '--'}
                        </span>
                        <div className="metric-breakdown">
                            {routeStats?.totalTime
                                ? `${(routeStats.totalTime / 3600000).toFixed(1)} h`
                                : t('gps.summary.noRoute', 'Awaiting route data')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="summary-secondary glass">
                <div className="summary-update">
                    <span>{formatRelativeTime(lastUpdate, t)}</span>
                    {isMobile && (
                        <button type="button" className="link-btn" onClick={onToggleDrawer}>
                            {isDrawerOpen ? t('gps.modern.hideDrawer', 'Hide drawer') : t('gps.modern.showDrawer', 'Show drawer')}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SummaryBar;