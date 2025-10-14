import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const MobileBottomNav = ({
    activePanel,
    onPanelChange,
    alertsCount = 0,
    vehiclesCount = 0,
    selectedVehicle,
    onToggleFullScreen,
    height = 80,
    onHeightChange
}) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentHeight, setCurrentHeight] = useState(height);

    const navItems = [
        {
            id: 'vehicles',
            icon: 'vehicles',
            label: t('gps.modern.nav.vehicles', 'Vehicles'),
            badge: vehiclesCount,
            badgeColor: 'primary'
        },
        {
            id: 'routes',
            icon: 'routes',
            label: t('gps.modern.nav.routes', 'Routes'),
            disabled: !selectedVehicle,
            badge: selectedVehicle ? 1 : 0,
            badgeColor: 'secondary'
        },
        {
            id: 'alerts',
            icon: 'alerts',
            label: t('gps.modern.nav.alerts', 'Alerts'),
            badge: alertsCount,
            badgeColor: 'warning'
        },
        {
            id: 'fullscreen',
            icon: 'fullscreen',
            label: t('gps.modern.nav.fullscreen', 'Fullscreen'),
            action: true
        }
    ];

    const getIcon = (iconName) => {
        const icons = {
            vehicles: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7 17h10l1.29-3.5H5.71L7 17zM20 8v6h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V8h16z" fill="currentColor" />
                </svg>
            ),
            routes: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L13.09 8.26L18 7L16.74 12.74L22 14L15.74 15.26L17 21L11.26 19.74L10 24L8.74 19.74L3 21L4.26 15.26L2 14L7.26 12.74L6 7L10.91 8.26L12 2Z" fill="currentColor" />
                </svg>
            ),
            alerts: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                </svg>
            ),
            fullscreen: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor" />
                </svg>
            )
        };
        return icons[iconName] || null;
    };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY;
        const newHeight = Math.max(60, Math.min(120, currentHeight + deltaY * 0.5));

        setCurrentHeight(newHeight);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        onHeightChange?.(currentHeight);
    };

    const handleItemClick = (item) => {
        if (item.action) {
            if (item.id === 'fullscreen') {
                onToggleFullScreen?.();
            }
        } else if (!item.disabled) {
            onPanelChange?.(item.id);
        }
    };

    useEffect(() => {
        setCurrentHeight(height);
    }, [height]);

    return (
        <motion.div
            className="mobile-bottom-nav glass"
            style={{ height: `${currentHeight}px` }}
            initial={{ y: currentHeight }}
            animate={{ y: 0 }}
            exit={{ y: currentHeight }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Drag Handle */}
            <div
                className="nav-drag-handle"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="drag-indicator" />
            </div>

            {/* Navigation Items */}
            <div className="nav-items">
                {navItems.map((item) => (
                    <motion.button
                        key={item.id}
                        className={`nav-item ${activePanel === item.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                        onClick={() => handleItemClick(item)}
                        disabled={item.disabled}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="nav-item-icon">
                            {getIcon(item.icon)}
                            {item.badge > 0 && (
                                <motion.span
                                    className={`nav-badge ${item.badgeColor}`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                >
                                    {item.badge > 99 ? '99+' : item.badge}
                                </motion.span>
                            )}
                        </div>
                        <span className="nav-item-label">{item.label}</span>
                    </motion.button>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="nav-quick-stats">
                <div className="quick-stat">
                    <span className="stat-value">{vehiclesCount}</span>
                    <span className="stat-label">Vehicles</span>
                </div>
                {selectedVehicle && (
                    <div className="quick-stat selected">
                        <span className="stat-value">{selectedVehicle.plateNumber}</span>
                        <span className="stat-label">Selected</span>
                    </div>
                )}
                {alertsCount > 0 && (
                    <div className="quick-stat alert">
                        <span className="stat-value">{alertsCount}</span>
                        <span className="stat-label">Alerts</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default MobileBottomNav;