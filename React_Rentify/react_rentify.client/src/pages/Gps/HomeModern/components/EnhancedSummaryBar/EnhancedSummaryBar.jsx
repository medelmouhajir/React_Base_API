import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Styles
import './EnhancedSummaryBar.css';

const EnhancedSummaryBar = ({
    stats,
    lastUpdate,
    isMobile,
    onRefresh,
    onToggleDrawer,
    isDrawerOpen,
    onOpenAlerts,
    onSwitchLegacy,
    onToggleFullScreen,
    isFullScreen
}) => {
    const { t } = useTranslation();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdateText, setLastUpdateText] = useState('');

    // Format last update time
    useEffect(() => {
        if (!lastUpdate) return;

        const updateInterval = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now - new Date(lastUpdate)) / 1000);

            if (diff < 60) {
                setLastUpdateText(t('gps.modern.justNow', 'Just now'));
            } else if (diff < 3600) {
                const minutes = Math.floor(diff / 60);
                setLastUpdateText(t('gps.modern.minutesAgo', '{{minutes}}m ago', { minutes }));
            } else {
                const hours = Math.floor(diff / 3600);
                setLastUpdateText(t('gps.modern.hoursAgo', '{{hours}}h ago', { hours }));
            }
        }, 30000); // Update every 30 seconds

        return () => clearInterval(updateInterval);
    }, [lastUpdate, t]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await onRefresh?.();
        } finally {
            setTimeout(() => setIsRefreshing(false), 1000);
        }
    };

    const metrics = [
        {
            key: 'total',
            label: t('gps.modern.totalVehicles', 'Total Vehicles'),
            value: stats?.totalVehicles || 0,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 17h10l1.29-3.5H5.71L7 17zM20 8v6h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V8h16z" fill="currentColor" />
                </svg>
            ),
            color: 'primary'
        },
        {
            key: 'online',
            label: t('gps.modern.onlineVehicles', 'Online'),
            value: stats?.onlineVehicles || 0,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 1l3.09 6.26L22 9l-5.91 1.74L17 17l-4.91-2.26L7 17l.91-6.26L2 9l6.91-1.74L12 1z" fill="currentColor" />
                </svg>
            ),
            color: 'success'
        },
        {
            key: 'moving',
            label: t('gps.modern.movingVehicles', 'Moving'),
            value: stats?.movingVehicles || 0,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M13 3l3.5 7h-7l3.5-7z" fill="currentColor" />
                    <circle cx="12" cy="17" r="4" fill="currentColor" />
                </svg>
            ),
            color: 'info',
            highlight: stats?.movingVehicles > 0
        },
        {
            key: 'alerts',
            label: t('gps.modern.activeAlerts', 'Active Alerts'),
            value: stats?.activeAlerts || 0,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                </svg>
            ),
            color: 'warning',
            highlight: stats?.activeAlerts > 0,
            clickable: true,
            onClick: onOpenAlerts
        }
    ];

    if (isMobile) {
        return (
            <motion.div
                className="enhanced-summary-bar mobile glass"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="summary-header">
                    <div className="summary-title-section">
                        <div className="summary-title">
                            <h1>{t('gps.modern.title', 'GPS Dashboard')}</h1>
                        </div>
                        <div className="summary-subtitle">
                            <span className="update-time">{lastUpdateText}</span>
                            <div className="summary-status">
                                <div className={`status-indicator ${stats?.onlineVehicles > 0 ? 'online' : 'offline'}`}></div>
                                <span>{t('gps.modern.system', 'System')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="summary-actions">
                        <motion.button
                            className={`action-btn ${isRefreshing ? 'refreshing' : ''}`}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            whileTap={{ scale: 0.95 }}
                            title={t('gps.modern.refresh', 'Refresh')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>
                        {onToggleDrawer && (
                            <motion.button
                                className="action-btn"
                                onClick={onToggleDrawer}
                                whileTap={{ scale: 0.95 }}
                                title={t('gps.modern.toggleMenu', 'Menu')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" />
                                    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
                                    <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </motion.button>
                        )}
                    </div>
                </div>

                <div className="summary-main">
                    <div className="summary-metrics mobile">
                        {metrics.map((metric) => (
                            <motion.div
                                key={metric.key}
                                className={`metric-card ${metric.color} ${metric.highlight ? 'highlight' : ''} ${metric.clickable ? 'clickable' : ''}`}
                                onClick={metric.onClick}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="metric-header">
                                    <div className="metric-icon">
                                        {metric.icon}
                                    </div>
                                    <div className="metric-label">
                                        {metric.label}
                                    </div>
                                </div>
                                <div className="metric-value">
                                    {metric.value}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="enhanced-summary-bar glass"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="summary-header">
                <div className="summary-title-section">
                    <div className="summary-title">
                        <h1>{t('gps.modern.title', 'GPS Dashboard')}</h1>
                    </div>
                    <div className="summary-subtitle">
                        <span className="last-update-indicator">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span className="update-time">{lastUpdateText}</span>
                        </span>
                        <div className="summary-status">
                            <div className={`status-indicator ${stats?.onlineVehicles > 0 ? 'online' : 'offline'}`}></div>
                            <span>{t('gps.modern.systemStatus', 'System Status')}</span>
                        </div>
                    </div>
                </div>

                <div className="summary-actions">
                    <motion.button
                        className={`action-btn refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        whileTap={{ scale: 0.95 }}
                        title={t('gps.modern.refresh', 'Refresh Data')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{t('gps.modern.refresh', 'Refresh')}</span>
                    </motion.button>

                    {onToggleFullScreen && (
                        <motion.button
                            className="action-btn"
                            onClick={onToggleFullScreen}
                            whileTap={{ scale: 0.95 }}
                            title={isFullScreen ? t('gps.modern.exitFullscreen', 'Exit Fullscreen') : t('gps.modern.fullscreen', 'Fullscreen')}
                        >
                            {isFullScreen ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 3v3a2 2 0 0 1-2 2H3M18 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 1-2-2H3M18 21v-3a2 2 0 0 0 2-2h3" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            )}
                            <span>{isFullScreen ? t('gps.modern.exitFullscreen', 'Exit') : t('gps.modern.fullscreen', 'Fullscreen')}</span>
                        </motion.button>
                    )}

                    {onToggleDrawer && (
                        <motion.button
                            className="action-btn"
                            onClick={onToggleDrawer}
                            whileTap={{ scale: 0.95 }}
                            title={t('gps.modern.toggleVehicles', 'Toggle Vehicles Panel')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2" />
                                <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>{t('gps.modern.vehicles', 'Vehicles')}</span>
                        </motion.button>
                    )}

                    {onSwitchLegacy && (
                        <motion.button
                            className="action-btn"
                            onClick={onSwitchLegacy}
                            whileTap={{ scale: 0.95 }}
                            title={t('gps.modern.switchToClassic', 'Switch to Classic View')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>{t('gps.modern.classic', 'Classic')}</span>
                        </motion.button>
                    )}
                </div>
            </div>

            <div className="summary-main">
                <div className="summary-metrics">
                    <AnimatePresence>
                        {metrics.map((metric, index) => (
                            <motion.div
                                key={metric.key}
                                className={`metric-card ${metric.color} ${metric.highlight ? 'highlight' : ''} ${metric.clickable ? 'clickable' : ''}`}
                                onClick={metric.onClick}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="metric-header">
                                    <div className="metric-icon">
                                        {metric.icon}
                                    </div>
                                    <div className="metric-label">
                                        {metric.label}
                                    </div>
                                </div>
                                <div className="metric-value">
                                    {metric.value}
                                    {metric.highlight && (
                                        <div className="metric-pulse" />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="summary-secondary">
                <div className="summary-info">
                    <div className="info-text">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span>{t('gps.modern.realTimeTracking', 'Real-time tracking active')}</span>
                    </div>
                    <div className="info-text">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span>{t('gps.modern.autoRefresh', 'Auto-refresh: 30s')}</span>
                    </div>
                </div>

                {stats?.totalVehicles > 0 && (
                    <div className="summary-info">
                        <div className="info-text">
                            <span>{t('gps.modern.coverage', 'Coverage')}: </span>
                            <span style={{ color: 'var(--modern-primary)' }}>
                                {Math.round((stats.onlineVehicles / stats.totalVehicles) * 100)}%
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default EnhancedSummaryBar;