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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                    <div className="summary-title">
                        <h1>{t('gps.modern.title', 'GPS Dashboard')}</h1>
                        <div className="summary-subtitle">
                            <span className="update-time">{lastUpdateText}</span>
                            <motion.button
                                className="refresh-btn"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                whileTap={{ scale: 0.95 }}
                                animate={isRefreshing ? { rotate: 360 } : {}}
                                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 12a8 8 0 018-8V2l3 3-3 3V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 01-16 0z" fill="currentColor" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>

                    <div className="summary-actions">
                        <motion.button
                            className="action-btn drawer-toggle"
                            onClick={onToggleDrawer}
                            whileTap={{ scale: 0.95 }}
                        >
                            <motion.div
                                animate={{ rotate: isDrawerOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor" />
                                </svg>
                            </motion.div>
                        </motion.button>

                        <motion.button
                            className="action-btn fullscreen-toggle"
                            onClick={onToggleFullScreen}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor" />
                            </svg>
                        </motion.button>
                    </div>
                </div>

                <div className="summary-metrics mobile">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={metric.key}
                            className={`metric-card ${metric.color} ${metric.highlight ? 'highlight' : ''} ${metric.clickable ? 'clickable' : ''}`}
                            onClick={metric.onClick}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileTap={metric.clickable ? { scale: 0.95 } : {}}
                        >
                            <div className="metric-icon">{metric.icon}</div>
                            <div className="metric-content">
                                <div className="metric-value">{metric.value}</div>
                                <div className="metric-label">{metric.label}</div>
                            </div>
                            {metric.value > 0 && (
                                <motion.div
                                    className="metric-pulse"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.3, 0.7] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="enhanced-summary-bar desktop glass"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="summary-primary">
                <div className="summary-header">
                    <div className="summary-title">
                        <h1>{t('gps.modern.title', 'GPS Dashboard')}</h1>
                        <p className="summary-subtitle">
                            {t('gps.modern.subtitle', 'Real-time vehicle tracking and fleet management')}
                        </p>
                    </div>

                    <div className="summary-actions">
                        <motion.button
                            className="action-btn"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            whileTap={{ scale: 0.95 }}
                            animate={isRefreshing ? { rotate: 360 } : {}}
                            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M4 12a8 8 0 018-8V2l3 3-3 3V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 01-16 0z" fill="currentColor" />
                            </svg>
                            {t('common.refresh', 'Refresh')}
                        </motion.button>

                        <motion.button
                            className="action-btn"
                            onClick={onToggleDrawer}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor" />
                            </svg>
                            {isDrawerOpen ? t('common.hide', 'Hide') : t('common.show', 'Show')} Panel
                        </motion.button>

                        <motion.button
                            className="action-btn secondary"
                            onClick={onSwitchLegacy}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2l3.09 6.26L22 9l-5.91 1.74L17 17l-4.91-2.26L7 17l.91-6.26L2 9l6.91-1.74L12 1z" fill="currentColor" />
                            </svg>
                            {t('gps.switchLegacy', 'Legacy View')}
                        </motion.button>
                    </div>
                </div>

                <div className="summary-metrics desktop">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={metric.key}
                            className={`metric-card ${metric.color} ${metric.highlight ? 'highlight' : ''} ${metric.clickable ? 'clickable' : ''}`}
                            onClick={metric.onClick}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                            whileTap={metric.clickable ? { scale: 0.95 } : {}}
                        >
                            <div className="metric-header">
                                <div className="metric-icon">{metric.icon}</div>
                                <div className="metric-label">{metric.label}</div>
                            </div>
                            <div className="metric-value">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={metric.value}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {metric.value}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                            {metric.value > 0 && (
                                <motion.div
                                    className="metric-pulse"
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0.4, 0.8] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="summary-secondary">
                <div className="summary-info">
                    <span className="info-text">
                        {t('gps.modern.lastUpdate', 'Last updated')}: {lastUpdateText}
                    </span>
                    {stats?.totalDistance > 0 && (
                        <span className="info-text">
                            {t('gps.modern.totalDistance', 'Total distance')}: {(stats.totalDistance / 1000).toFixed(1)} km
                        </span>
                    )}
                </div>

                <div className="summary-status">
                    <motion.div
                        className="status-indicator online"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span>{t('gps.modern.systemOnline', 'System Online')}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default EnhancedSummaryBar;