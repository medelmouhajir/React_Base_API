import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Styles
import './QuickActionsPanel.css';


const QuickActionsPanel = ({
    isOpen = false,
    onClose,
    onRefresh,
    onOpenAlerts,
    onSwitchLegacy,
    onToggleFullScreen,
    isMobile = false
}) => {
    const { t } = useTranslation();

    const quickActions = [
        {
            id: 'refresh',
            label: t('common.refresh', 'Refresh'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12a8 8 0 018-8V2l3 3-3 3V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 01-16 0z" fill="currentColor" />
                </svg>
            ),
            action: onRefresh,
            color: 'primary'
        },
        {
            id: 'alerts',
            label: t('gps.modern.viewAlerts', 'View Alerts'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                </svg>
            ),
            action: onOpenAlerts,
            color: 'warning'
        },
        {
            id: 'fullscreen',
            label: t('gps.modern.fullscreen', 'Fullscreen'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor" />
                </svg>
            ),
            action: onToggleFullScreen,
            color: 'info'
        },
        {
            id: 'legacy',
            label: t('gps.switchLegacy', 'Legacy View'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3.09 6.26L22 9l-5.91 1.74L17 17l-4.91-2.26L7 17l.91-6.26L2 9l6.91-1.74L12 1z" fill="currentColor" />
                </svg>
            ),
            action: onSwitchLegacy,
            color: 'secondary'
        }
    ];

    const containerVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            y: 20
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                staggerChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            y: 20,
            transition: {
                duration: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            x: -20,
            scale: 0.8
        },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
            }
        }
    };

    const handleActionClick = (action) => {
        if (action) {
            action();
        }
        onClose?.();
    };

    const getActionColor = (color) => {
        const colorMap = {
            primary: 'var(--modern-primary)',
            warning: 'var(--modern-warning)',
            info: 'var(--modern-info)',
            secondary: 'rgba(255, 255, 255, 0.6)'
        };
        return colorMap[color] || colorMap.primary;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="quick-actions-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="quick-actions-panel glass"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="quick-actions-header">
                            <h3>{t('gps.modern.quickActions', 'Quick Actions')}</h3>
                            <button
                                className="close-btn"
                                onClick={onClose}
                                aria-label={t('common.close', 'Close')}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <div className="quick-actions-list">
                            {quickActions.map((item) => (
                                <motion.button
                                    key={item.id}
                                    className="quick-action-item"
                                    variants={itemVariants}
                                    onClick={() => handleActionClick(item.action)}
                                    whileHover={{
                                        scale: 1.05,
                                        x: -8,
                                        transition: { duration: 0.2 }
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div
                                        className="quick-action-icon"
                                        style={{ background: getActionColor(item.color) }}
                                    >
                                        {item.icon}
                                    </div>
                                    <span className="quick-action-label">
                                        {item.label}
                                    </span>
                                    <div className="quick-action-arrow">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="quick-actions-footer">
                            <div className="footer-text">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {t('gps.modern.quickActionsHint', 'Tap to perform action')}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default QuickActionsPanel;