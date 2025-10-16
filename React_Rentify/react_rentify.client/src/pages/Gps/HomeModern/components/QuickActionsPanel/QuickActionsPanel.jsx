import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
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
    onToggleTraffic,
    onRecenterMap,
    onToggleFollow,
    isMobile = false,
    vehicleStats = {},
    selectedVehicle = null
}) => {
    const { t } = useTranslation();
    const panelRef = useRef(null);
    const dragControls = useDragControls();

    // Handle swipe down to close (mobile only)
    const handleDragEnd = (event, info) => {
        if (isMobile && info.offset.y > 100) {
            onClose();
        }
    };

    // Handle touch events for better mobile interaction
    useEffect(() => {
        if (!isMobile || !isOpen) return;

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            if (touch) {
                // Store initial touch position
                e.target.setAttribute('data-start-y', touch.clientY);
            }
        };

        const handleTouchMove = (e) => {
            const touch = e.touches[0];
            const startY = parseFloat(e.target.getAttribute('data-start-y') || '0');

            if (touch && startY) {
                const deltaY = touch.clientY - startY;
                // Only allow downward swipes to close
                if (deltaY > 20) {
                    e.target.style.transform = `translateY(${Math.max(0, deltaY * 0.5)}px)`;
                }
            }
        };

        const handleTouchEnd = (e) => {
            const transform = e.target.style.transform;
            const translateY = transform ? parseFloat(transform.match(/translateY\((.+)px\)/)?.[1] || '0') : 0;

            if (translateY > 50) {
                onClose();
            } else {
                // Reset position
                e.target.style.transform = '';
            }

            e.target.removeAttribute('data-start-y');
        };

        const panel = panelRef.current;
        if (panel) {
            panel.addEventListener('touchstart', handleTouchStart, { passive: true });
            panel.addEventListener('touchmove', handleTouchMove, { passive: true });
            panel.addEventListener('touchend', handleTouchEnd, { passive: true });

            return () => {
                panel.removeEventListener('touchstart', handleTouchStart);
                panel.removeEventListener('touchmove', handleTouchMove);
                panel.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isMobile, isOpen, onClose]);

    // Animation variants
    const overlayVariants = {
        hidden: {
            opacity: 0,
            transition: {
                duration: 0.2
            }
        },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3
            }
        }
    };

    const panelVariants = {
        hidden: {
            y: isMobile ? '100%' : 0,
            x: isMobile ? 0 : '100%',
            opacity: 0,
            scale: 0.9,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        },
        visible: {
            y: 0,
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            x: isMobile ? 0 : 20,
            y: isMobile ? 10 : 0
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    // Handle action click with ripple effect
    const handleActionClick = (action) => {
        if (action && typeof action === 'function') {
            action();
        }
        // Auto-close after action on mobile
        if (isMobile) {
            setTimeout(onClose, 150);
        }
    };

    // Get action color for dynamic styling
    const getActionColor = (colorType) => {
        const colors = {
            primary: 'linear-gradient(135deg, var(--modern-primary), var(--modern-primary-light))',
            warning: 'linear-gradient(135deg, var(--modern-warning), #fbbf24)',
            info: 'linear-gradient(135deg, var(--modern-info), #38bdf8)',
            success: 'linear-gradient(135deg, var(--modern-success), #34d399)',
            danger: 'linear-gradient(135deg, var(--modern-danger), #f87171)',
            secondary: 'linear-gradient(135deg, var(--modern-secondary), #8b5cf6)'
        };
        return colors[colorType] || colors.primary;
    };

    // Quick actions configuration
    const quickActions = [
        {
            id: 'refresh',
            label: t('common.refresh', 'Refresh'),
            description: t('gps.modern.quickActions.refresh.desc', 'Update vehicle positions and data'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12a8 8 0 018-8V2l3 3-3 3V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 01-16 0z" fill="currentColor" />
                </svg>
            ),
            action: onRefresh,
            color: 'primary',
            shortcut: 'R'
        },
        {
            id: 'alerts',
            label: t('gps.modern.viewAlerts', 'View Alerts'),
            description: t('gps.modern.quickActions.alerts.desc', 'Check active alerts and notifications'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                </svg>
            ),
            action: onOpenAlerts,
            color: 'warning',
            shortcut: 'A',
            badge: vehicleStats.activeAlerts || 0
        },
        {
            id: 'fullscreen',
            label: t('gps.modern.fullscreen', 'Toggle Fullscreen'),
            description: t('gps.modern.quickActions.fullscreen.desc', 'Maximize map view for better visibility'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor" />
                </svg>
            ),
            action: onToggleFullScreen,
            color: 'info',
            shortcut: 'F'
        },
        {
            id: 'traffic',
            label: t('gps.modern.quickActions.traffic', 'Toggle Traffic'),
            description: t('gps.modern.quickActions.traffic.desc', 'Show/hide traffic information'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="7" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7" />
                    <circle cx="12" cy="17" r="2" fill="currentColor" opacity="0.4" />
                    <rect x="10" y="2" width="4" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            ),
            action: onToggleTraffic,
            color: 'warning',
            shortcut: 'T'
        },
        {
            id: 'recenter',
            label: t('gps.modern.quickActions.recenter', 'Recenter Map'),
            description: t('gps.modern.quickActions.recenter.desc', 'Center map on all vehicles'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            action: onRecenterMap,
            color: 'info',
            shortcut: 'C'
        },
        {
            id: 'follow',
            label: t('gps.modern.quickActions.follow', 'Follow Vehicle'),
            description: selectedVehicle
                ? t('gps.modern.quickActions.follow.desc', 'Follow selected vehicle on map')
                : t('gps.modern.quickActions.follow.noVehicle', 'Select a vehicle to follow'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="10" r="3" fill="currentColor" />
                </svg>
            ),
            action: onToggleFollow,
            color: selectedVehicle ? 'success' : 'secondary',
            shortcut: 'G',
            disabled: !selectedVehicle
        }
    ];

    // Conditional actions based on context
    const contextualActions = [
        {
            id: 'legacy',
            label: t('sidebar.dashboard', 'Switch to Legacy View'),
            description: t('gps.modern.quickActions.legacy.desc', 'Use the classic GPS interface'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M9 9h6v6H9z" fill="currentColor" opacity="0.3" />
                    <path d="M9 3v2M15 3v2M21 9h-2M21 15h-2M15 21v-2M9 21v-2M3 15h2M3 9h2" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            action: onSwitchLegacy,
            color: 'secondary',
            shortcut: 'L'
        }
    ];

    // Handle overlay click (close when clicking outside panel)
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="quick-actions-overlay"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        ref={panelRef}
                        className={`quick-actions-panel ${isMobile ? 'mobile' : 'desktop'}`}
                        variants={panelVariants}
                        onClick={(e) => e.stopPropagation()}
                        drag={isMobile ? "y" : false}
                        dragConstraints={{ top: 0, bottom: 300 }}
                        dragElastic={{ top: 0, bottom: 0.2 }}
                        onDragEnd={handleDragEnd}
                        dragControls={dragControls}
                    >
                        {/* Panel Header */}
                        <div className="quick-actions-header">
                            {/* Drag Handle (Mobile only) */}
                            {isMobile && (
                                <div
                                    className="quick-actions-drag-handle"
                                    onPointerDown={(e) => dragControls.start(e)}
                                />
                            )}
                            <h2 className="quick-actions-title">
                                {t('gps.modern.quickActions.title', 'Quick Actions')}
                            </h2>
                            <button
                                className="quick-actions-close"
                                onClick={onClose}
                                aria-label={t('common.close', 'Close')}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Quick Actions List */}
                        <div className="quick-actions-content">
                            {/* Main Actions */}
                            <div className="quick-actions-group">
                                <h3 className="quick-actions-group-title">
                                    {t('gps.modern.quickActions.main', 'Main Actions')}
                                </h3>
                                <div className="quick-actions-list">
                                    {quickActions.map((item, index) => (
                                        <motion.button
                                            key={item.id}
                                            className={`quick-action-item ${item.disabled ? 'disabled' : ''}`}
                                            variants={itemVariants}
                                            onClick={() => handleActionClick(item.action)}
                                            disabled={item.disabled}
                                            whileHover={!item.disabled ? {
                                                scale: 1.02,
                                                x: isMobile ? 0 : -8,
                                                transition: { duration: 0.2 }
                                            } : {}}
                                            whileTap={!item.disabled ? { scale: 0.98 } : {}}
                                            aria-label={item.description}
                                        >
                                            <div
                                                className={`quick-action-icon ${item.color}`}
                                                style={{ background: getActionColor(item.color) }}
                                            >
                                                {item.icon}
                                                {item.badge > 0 && (
                                                    <div className="quick-action-badge">
                                                        {item.badge > 99 ? '99+' : item.badge}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="quick-action-content">
                                                <span className="quick-action-label">
                                                    {item.label}
                                                </span>
                                                {!isMobile && (
                                                    <span className="quick-action-description">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="quick-action-extras">
                                                {item.shortcut && !isMobile && (
                                                    <div className="quick-action-shortcut">
                                                        {item.shortcut}
                                                    </div>
                                                )}
                                                <div className="quick-action-arrow">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="quick-actions-divider" />

                            {/* Contextual Actions */}
                            <div className="quick-actions-group">
                                <h3 className="quick-actions-group-title">
                                    {t('gps.modern.quickActions.more', 'More Options')}
                                </h3>
                                <div className="quick-actions-list">
                                    {contextualActions.map((item, index) => (
                                        <motion.button
                                            key={item.id}
                                            className="quick-action-item"
                                            variants={itemVariants}
                                            onClick={() => handleActionClick(item.action)}
                                            whileHover={{
                                                scale: 1.02,
                                                x: isMobile ? 0 : -8,
                                                transition: { duration: 0.2 }
                                            }}
                                            whileTap={{ scale: 0.98 }}
                                            aria-label={item.description}
                                        >
                                            <div
                                                className={`quick-action-icon ${item.color}`}
                                                style={{ background: getActionColor(item.color) }}
                                            >
                                                {item.icon}
                                            </div>
                                            <div className="quick-action-content">
                                                <span className="quick-action-label">
                                                    {item.label}
                                                </span>
                                                {!isMobile && (
                                                    <span className="quick-action-description">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="quick-action-extras">
                                                {item.shortcut && !isMobile && (
                                                    <div className="quick-action-shortcut">
                                                        {item.shortcut}
                                                    </div>
                                                )}
                                                <div className="quick-action-arrow">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="quick-actions-footer">
                            <div className="footer-text">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {isMobile
                                    ? t('gps.modern.quickActionsHint.mobile', 'Tap to perform action')
                                    : t('gps.modern.quickActionsHint.desktop', 'Click or use keyboard shortcuts')
                                }
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickActionsPanel;