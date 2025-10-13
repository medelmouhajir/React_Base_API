import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const AlertDrawer = ({
    isOpen,
    onClose,
    alerts = [],
    stats,
    isLoading,
    error,
    onRefresh,
    onAcknowledge
}) => {
    const { t } = useTranslation();

    const handleAcknowledge = useCallback(async (alertItem) => {
        if (!onAcknowledge) return;
        const notes = window.prompt(
            t('gps.modern.alertNotesPrompt', 'Add notes for this acknowledgement (optional)'),
            alertItem?.notes || ''
        );
        try {
            await onAcknowledge(alertItem.id, notes || '');
            onRefresh?.();
        } catch (err) {
            console.error('Failed to acknowledge alert', err);
            window.alert(t('gps.modern.alertAcknowledgeError', 'Unable to acknowledge alert.'));
        }
    }, [onAcknowledge, onRefresh, t]);

    return (
        <aside className={`alert-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
            <div className="alert-drawer__backdrop" onClick={onClose} />
            <div className="alert-drawer__panel glass">
                <div className="alert-drawer__header">
                    <div>
                        <h2>{t('gps.modern.alertsTitle', 'Speeding alerts')}</h2>
                        <p>{t('gps.modern.alertsSubtitle', 'Review and acknowledge speeding events')}</p>
                    </div>
                    <div className="alert-drawer__actions">
                        <button type="button" className="ghost-btn" onClick={onRefresh}>
                            {t('common.refresh', 'Refresh')}
                        </button>
                        <button type="button" className="ghost-btn" onClick={onClose}>
                            {t('common.close', 'Close')}
                        </button>
                    </div>
                </div>

                <div className="alert-drawer__stats">
                    <div className="stat">
                        <span className="stat-label">{t('gps.modern.alertTotal', 'Total')}</span>
                        <span className="stat-value">{stats?.totalAlerts ?? '--'}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">{t('gps.modern.alertOpen', 'Open')}</span>
                        <span className="stat-value highlight">{stats?.unacknowledgedAlerts ?? '--'}</span>
                    </div>
                </div>

                <div className="alert-drawer__body">
                    {isLoading && (
                        <div className="alert-drawer__loading">
                            <div className="loading-spinner" />
                            <p>{t('gps.modern.alertLoading', 'Loading alerts...')}</p>
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="alert-drawer__error">
                            <p>{error}</p>
                            <button type="button" className="btn btn-primary" onClick={onRefresh}>
                                {t('common.retry', 'Try Again')}
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && alerts.length === 0 && (
                        <div className="alert-drawer__empty">
                            <p>{t('gps.modern.alertEmpty', 'No speeding alerts recorded today')}</p>
                        </div>
                    )}

                    {!isLoading && !error && alerts.length > 0 && (
                        <ul className="alert-drawer__list">
                            {alerts.map(alertItem => (
                                <li key={alertItem.id} className={`alert-item severity-${(alertItem.severity || '').toLowerCase()}`}>
                                    <div className="alert-item__header">
                                        <div>
                                            <h3>{alertItem.deviceSerialNumber}</h3>
                                            <p>{alertItem.installCarPlate || alertItem.vehiclePlate || t('gps.modern.unknownVehicle', 'Unknown vehicle')}</p>
                                        </div>
                                        <span className="alert-item__severity">{alertItem.severity}</span>
                                    </div>
                                    <div className="alert-item__meta">
                                        <span>{new Date(alertItem.timestamp).toLocaleString()}</span>
                                        <span>
                                            {t('gps.modern.alertSpeed', '{{speed}} km/h in {{limit}} zone', {
                                                speed: alertItem.actualSpeedKmh,
                                                limit: alertItem.speedLimitKmh
                                            })}
                                        </span>
                                    </div>
                                    <div className="alert-item__actions">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => handleAcknowledge(alertItem)}
                                            disabled={alertItem.isAcknowledged}
                                        >
                                            {alertItem.isAcknowledged
                                                ? t('gps.modern.alertAcknowledged', 'Acknowledged')
                                                : t('gps.modern.alertAcknowledge', 'Acknowledge')}
                                        </button>
                                        <button
                                            type="button"
                                            className="ghost-btn"
                                            onClick={() => window.open(`https://www.google.com/maps?q=${alertItem.latitude},${alertItem.longitude}`, '_blank')}
                                        >
                                            {t('gps.modern.alertViewMap', 'View on map')}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default AlertDrawer;