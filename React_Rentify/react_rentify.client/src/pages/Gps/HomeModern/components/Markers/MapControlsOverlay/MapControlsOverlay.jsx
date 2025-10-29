// src/pages/Gps/HomeModern/components/Markers/MapControlsOverlay/MapControlsOverlay.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Styles
import './MapControlsOverlay.css';

const MapControlsOverlay = ({
    isVisible = true,
    isMobile = false,
    isFullScreen = false,
    onToggleFullScreen,
    mapMode = 'streets',
    followVehicle = false,
    showTraffic = false,
    showClusters = true,
    onMapModeToggle,
    onFollowToggle,
    onTrafficToggle,
    onClusterToggle,
    onRecenterMap,
    vehicleCount = 0,
    selectedVehicle = null,
    className = ''
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(!isMobile);
    const [activeTooltip, setActiveTooltip] = useState(null);

    // Auto-collapse on mobile after inactivity
    useEffect(() => {
        if (isMobile && isExpanded) {
            const timer = setTimeout(() => {
                setIsExpanded(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isMobile, isExpanded]);

    // Animation variants
    const overlayVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            x: 20
        },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut",
                staggerChildren: 0.05
            }
        }
    };

    const groupVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                staggerChildren: 0.03
            }
        }
    };

    const buttonVariants = {
        hidden: { opacity: 0, scale: 0.7, x: 10 },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        },
        hover: {
            scale: 1.05,
            transition: { duration: 0.15 }
        },
        tap: { scale: 0.95 }
    };

    // Enhanced tooltip management
    const showTooltip = useCallback((buttonId) => {
        if (isMobile) {
            setActiveTooltip(buttonId);
            setTimeout(() => setActiveTooltip(null), 2000);
        }
    }, [isMobile]);

    // Map mode configuration with enhanced labels
    const mapModes = [
        {
            key: 'satellite',
            icon: 'satellite',
            label: t('gps.map.modes.satellite', 'Satellite'),
            shortLabel: t('gps.map.modes.satellite.short', 'Sat')
        },
        {
            key: 'streets',
            icon: 'streets',
            label: t('gps.map.modes.streets', 'Streets'),
            shortLabel: t('gps.map.modes.streets.short', 'Map')
        },
        {
            key: 'terrain',
            icon: 'terrain',
            label: t('gps.map.modes.terrain', 'Terrain'),
            shortLabel: t('gps.map.modes.terrain.short', 'Ter')
        }
    ];

    const currentModeIndex = mapModes.findIndex(mode => mode.key === mapMode);
    const nextMode = mapModes[(currentModeIndex + 1) % mapModes.length];

    // Enhanced icon renderer with better SVG icons
    const renderIcon = (iconType, size = 20) => {
        const iconProps = {
            width: size,
            height: size,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        };

        const icons = {
            satellite: (
                <svg {...iconProps}>
                    <circle cx="12" cy="12" r="2" />
                    <path d="M4.93 4.93l4.24 4.24" />
                    <path d="M14.83 9.17l4.24-4.24" />
                    <path d="M14.83 14.83l4.24 4.24" />
                    <path d="M9.17 14.83l-4.24 4.24" />
                    <path d="M12 2v4" />
                    <path d="M12 18v4" />
                    <path d="M2 12h4" />
                    <path d="M18 12h4" />
                </svg>
            ),
            streets: (
                <svg {...iconProps}>
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-6" />
                    <path d="M9 9v1" />
                    <path d="M9 12v1" />
                    <path d="M9 15v1" />
                    <path d="M9 18v1" />
                </svg>
            ),
            terrain: (
                <svg {...iconProps}>
                    <path d="M3 20h18L14 4l-3 6-4-2z" />
                    <path d="M14 4l3-3" />
                    <path d="M17 7l3-3" />
                </svg>
            ),
            follow: (
                <svg {...iconProps}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M8 21l4-7 4 7" strokeWidth="1.5" />
                </svg>
            ),
            traffic: (
                <svg {...iconProps}>
                    <rect x="9" y="2" width="6" height="20" rx="2" />
                    <circle cx="12" cy="7" r="1.5" fill="#ef4444" />
                    <circle cx="12" cy="12" r="1.5" fill="#f59e0b" />
                    <circle cx="12" cy="17" r="1.5" fill="#10b981" />
                </svg>
            ),
            cluster: (
                <svg {...iconProps}>
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="19" r="2" />
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                    <path d="M10.5 6.5L7 10" />
                    <path d="M13.5 6.5L17 10" />
                    <path d="M10.5 17.5L7 14" />
                    <path d="M13.5 17.5L17 14" />
                </svg>
            ),
            recenter: (
                <svg {...iconProps}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6" />
                    <path d="M12 17v6" />
                    <path d="M4.22 4.22l4.24 4.24" />
                    <path d="M15.54 15.54l4.24 4.24" />
                    <path d="M1 12h6" />
                    <path d="M17 12h6" />
                    <path d="M4.22 19.78l4.24-4.24" />
                    <path d="M15.54 8.46l4.24-4.24" />
                </svg>
            ),
            expand: (
                <svg {...iconProps}>
                    <path d="M15 3h6v6" />
                    <path d="M9 21H3v-6" />
                    <path d="M21 3l-7 7" />
                    <path d="M3 21l7-7" />
                </svg>
            ),
            collapse: (
                <svg {...iconProps}>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
            ),
            fullscreen: (
                <svg {...iconProps}>
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
            ),
            exitFullscreen: (
                <svg {...iconProps}>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
            )
        };

        return icons[iconType] || icons.satellite;
    };

    // Enhanced control button renderer
    const renderControlButton = (config) => {
        const {
            id,
            icon,
            label,
            shortLabel,
            isActive = false,
            onClick,
            disabled = false,
            badge = null,
            className: buttonClass = '',
            priority = 'normal'
        } = config;

        const buttonId = `btn-${id}`;

        return (
            <motion.button
                key={buttonId}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className={`
                    enhanced-control-btn 
                    ${isActive ? 'active' : ''} 
                    ${disabled ? 'disabled' : ''} 
                    ${buttonClass}
                    priority-${priority}
                `}
                onClick={onClick}
                disabled={disabled}
                onMouseEnter={() => !isMobile && setActiveTooltip(buttonId)}
                onMouseLeave={() => !isMobile && setActiveTooltip(null)}
                onTouchStart={() => showTooltip(buttonId)}
                title={label}
                aria-label={label}
                aria-pressed={isActive}
            >
                <div className="btn-content">
                    <div className="btn-icon">
                        {renderIcon(icon)}
                        {badge && (
                            <span className="btn-badge">
                                {typeof badge === 'number' && badge > 99 ? '99+' : badge}
                            </span>
                        )}
                    </div>

                    {/* Show short label on desktop when expanded */}
                    {isExpanded && !isMobile && shortLabel && (
                        <span className="btn-short-label">
                            {shortLabel}
                        </span>
                    )}
                </div>

                {/* Enhanced tooltip */}
                <AnimatePresence>
                    {activeTooltip === buttonId && (
                        <motion.div
                            className="enhanced-tooltip"
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {label}
                            <div className="tooltip-arrow" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        );
    };

    if (!isVisible) return null;

    // Control configurations
    const primaryControls = [
        {
            id: 'mapMode',
            icon: mapMode,
            label: t('gps.controls.switchTo', 'Switch to {{mode}}', { mode: nextMode.label }),
            shortLabel: nextMode.shortLabel,
            onClick: onMapModeToggle,
            className: 'map-mode-btn',
            priority: 'high'
        },
        ...(selectedVehicle ? [{
            id: 'follow',
            icon: 'follow',
            label: followVehicle
                ? t('gps.controls.stopFollow', 'Stop Following')
                : t('gps.controls.followVehicle', 'Follow {{vehicle}}', { vehicle: selectedVehicle?.plateNumber || 'Vehicle' }),
            shortLabel: followVehicle ? t('gps.controls.following', 'Following') : t('gps.controls.follow', 'Follow'),
            isActive: followVehicle,
            onClick: onFollowToggle,
            className: 'follow-btn',
            priority: 'high'
        }] : []),
        {
            id: 'traffic',
            icon: 'traffic',
            label: showTraffic
                ? t('gps.controls.hideTraffic', 'Hide Traffic')
                : t('gps.controls.showTraffic', 'Show Traffic'),
            shortLabel: t('gps.controls.traffic', 'Traffic'),
            isActive: showTraffic,
            onClick: onTrafficToggle,
            className: 'traffic-btn',
            priority: 'normal'
        }
    ];

    const secondaryControls = [
        ...(vehicleCount > 1 ? [{
            id: 'cluster',
            icon: 'cluster',
            label: showClusters
                ? t('gps.controls.hideClusters', 'Hide Clusters')
                : t('gps.controls.showClusters', 'Show Clusters'),
            shortLabel: t('gps.controls.clusters', 'Clusters'),
            isActive: showClusters,
            onClick: onClusterToggle,
            badge: vehicleCount > 10 ? vehicleCount : null,
            className: 'cluster-btn',
            priority: 'normal'
        }] : []),
        {
            id: 'recenter',
            icon: 'recenter',
            label: t('gps.controls.recenterMap', 'Recenter Map'),
            shortLabel: t('gps.controls.center', 'Center'),
            onClick: onRecenterMap,
            className: 'recenter-btn',
            priority: 'low'
        }
    ];

    const utilityControls = [
        {
            id: 'fullscreen',
            icon: isFullScreen ? 'exitFullscreen' : 'fullscreen',
            label: isFullScreen
                ? t('gps.controls.exitFullscreen', 'Exit Fullscreen')
                : t('gps.controls.enterFullscreen', 'Enter Fullscreen'),
            shortLabel: isFullScreen ? t('gps.controls.exit', 'Exit') : t('gps.controls.full', 'Full'),
            isActive: isFullScreen,
            onClick: onToggleFullScreen,
            className: 'fullscreen-btn',
            priority: 'low'
        }
    ];

    return (
        <motion.div
            className={`enhanced-map-controls-overlay ${isMobile ? 'mobile' : 'desktop'} ${isFullScreen ? 'fullscreen' : ''} ${className}`}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            {/* Mobile expand/collapse button */}
            {isMobile && (
                <motion.button
                    className="mobile-toggle-btn"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label={isExpanded ? t('gps.controls.collapse', 'Collapse') : t('gps.controls.expand', 'Expand')}
                >
                    {renderIcon(isExpanded ? 'collapse' : 'expand', 18)}
                </motion.button>
            )}

            {/* Primary Controls Group */}
            <AnimatePresence>
                {(isExpanded || !isMobile) && (
                    <motion.div
                        className="controls-group primary"
                        variants={groupVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {primaryControls.map(control => renderControlButton(control))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Secondary Controls Group */}
            <AnimatePresence>
                {(isExpanded || !isMobile) && secondaryControls.length > 0 && (
                    <motion.div
                        className="controls-group secondary"
                        variants={groupVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {secondaryControls.map(control => renderControlButton(control))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Utility Controls Group */}
            <AnimatePresence>
                {(isExpanded || !isMobile) && (
                    <motion.div
                        className="controls-group utility"
                        variants={groupVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {utilityControls.map(control => renderControlButton(control))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Vehicle Info Badge - Only show when following */}
            <AnimatePresence>
                {followVehicle && selectedVehicle && (
                    <motion.div
                        className="vehicle-info-badge"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="vehicle-badge-content">
                            <div className="follow-indicator">
                                <div className="pulse-dot" />
                                <span className="follow-text">
                                    {t('gps.controls.followingVehicle', 'Following')}
                                </span>
                            </div>
                            <span className="vehicle-plate">
                                {selectedVehicle.plateNumber || selectedVehicle.name}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MapControlsOverlay;