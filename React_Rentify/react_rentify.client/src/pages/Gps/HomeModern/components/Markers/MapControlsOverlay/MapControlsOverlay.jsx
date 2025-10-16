// src/pages/Gps/HomeModern/components/Markers/MapControlsOverlay/MapControlsOverlay.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Styles
import './MapControlsOverlay.css';

const MapControlsOverlay = ({
    isVisible = true,
    isMobile = false,
    isFullScreen = false,
    mapMode = 'satellite',
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
    const [showTooltips, setShowTooltips] = useState(false);

    // Auto-collapse on mobile when not in use
    useEffect(() => {
        if (isMobile) {
            const timer = setTimeout(() => {
                setIsExpanded(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isMobile, isExpanded]);

    // Control animation variants
    const overlayVariants = {
        hidden: {
            opacity: 0,
            scale: 0.9,
            y: -20
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        }
    };

    const groupVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0 }
    };

    const buttonVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        hover: {
            scale: 1.05,
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.95 }
    };

    // Map mode options
    const mapModes = [
        { key: 'satellite', icon: 'satellite', label: t('gps.map.satellite', 'Satellite') },
        { key: 'streets', icon: 'streets', label: t('gps.map.streets', 'Streets') },
        { key: 'terrain', icon: 'terrain', label: t('gps.map.terrain', 'Terrain') }
    ];

    const currentModeIndex = mapModes.findIndex(mode => mode.key === mapMode);
    const nextMode = mapModes[(currentModeIndex + 1) % mapModes.length];

    // Handle control interaction
    const handleControlInteraction = () => {
        if (isMobile) {
            setIsExpanded(true);
        }
    };

    // Render control button
    const renderControlButton = (config) => {
        const {
            icon,
            label,
            isActive = false,
            onClick,
            disabled = false,
            badge = null,
            className: buttonClass = ''
        } = config;

        return (
            <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className={`
                    map-control-btn 
                    ${isActive ? 'active' : ''} 
                    ${disabled ? 'disabled' : ''} 
                    ${buttonClass}
                `}
                onClick={onClick}
                disabled={disabled}
                onMouseEnter={() => setShowTooltips(true)}
                onMouseLeave={() => setShowTooltips(false)}
                title={label}
                aria-label={label}
            >
                <div className="btn-icon">
                    {renderIcon(icon)}
                    {badge && (
                        <span className="btn-badge">
                            {badge}
                        </span>
                    )}
                </div>

                {(isExpanded && !isMobile) && (
                    <span className="btn-label">
                        {label}
                    </span>
                )}

                {showTooltips && isMobile && (
                    <div className="btn-tooltip">
                        {label}
                    </div>
                )}
            </motion.button>
        );
    };

    // Render icon based on type
    const renderIcon = (iconType) => {
        const iconProps = {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        };

        switch (iconType) {
            case 'satellite':
                return (
                    <svg {...iconProps}>
                        <circle cx="12" cy="12" r="2" />
                        <path d="M4.93 4.93l4.24 4.24" />
                        <path d="M14.83 9.17l4.24-4.24" />
                        <path d="M14.83 14.83l4.24 4.24" />
                        <path d="M9.17 14.83l-4.24 4.24" />
                    </svg>
                );
            case 'streets':
                return (
                    <svg {...iconProps}>
                        <path d="M3 3l18 18" />
                        <path d="M14 6l7 7-2 2" />
                        <path d="M8 6l-2 2 7 7" />
                        <path d="M2 18h20" />
                    </svg>
                );
            case 'terrain':
                return (
                    <svg {...iconProps}>
                        <path d="M3 12l3-3 3 3 6-6 6 6v7H3z" />
                    </svg>
                );
            case 'follow':
                return (
                    <svg {...iconProps}>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
                    </svg>
                );
            case 'traffic':
                return (
                    <svg {...iconProps}>
                        <circle cx="12" cy="17" r="1" />
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="7" r="1" />
                        <rect x="9" y="3" width="6" height="18" rx="2" />
                    </svg>
                );
            case 'cluster':
                return (
                    <svg {...iconProps}>
                        <circle cx="12" cy="5" r="3" />
                        <circle cx="12" cy="19" r="3" />
                        <circle cx="5" cy="12" r="3" />
                        <circle cx="19" cy="12" r="3" />
                    </svg>
                );
            case 'recenter':
                return (
                    <svg {...iconProps}>
                        <circle cx="12" cy="12" r="1" />
                        <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z" />
                        <path d="M15.7 15.7l4.58 4.58" />
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    </svg>
                );
            case 'expand':
                return (
                    <svg {...iconProps}>
                        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                    </svg>
                );
            case 'collapse':
                return (
                    <svg {...iconProps}>
                        <path d="M8 3v3a2 2 0 0 1-2 2H3M18 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 1-2-2H3M18 21v-3a2 2 0 0 0 2-2h3" />
                    </svg>
                );
            default:
                return (
                    <svg {...iconProps}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                );
        }
    };

    if (!isVisible) return null;

    return (
        <motion.div
            className={`map-controls-overlay ${isMobile ? 'mobile' : ''} ${isFullScreen ? 'fullscreen' : ''} ${className}`}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleControlInteraction}
        >
            {/* Primary Controls Group */}
            <motion.div
                className="controls-group primary"
                variants={groupVariants}
            >
                {/* Mobile Toggle Button */}
                {isMobile && (
                    <motion.button
                        className="mobile-toggle-btn"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label={isExpanded ? t('gps.controls.collapse', 'Collapse') : t('gps.controls.expand', 'Expand')}
                    >
                        {renderIcon(isExpanded ? 'collapse' : 'expand')}
                    </motion.button>
                )}

                <AnimatePresence>
                    {(isExpanded || !isMobile) && (
                        <>
                            {/* Map Mode Toggle */}
                            {renderControlButton({
                                icon: mapMode,
                                label: `${t('gps.map.layer', 'Layer')}: ${nextMode.label}`,
                                onClick: onMapModeToggle,
                                className: 'map-mode-btn'
                            })}

                            {/* Follow Vehicle */}
                            {selectedVehicle && renderControlButton({
                                icon: 'follow',
                                label: followVehicle
                                    ? t('gps.controls.stopFollow', 'Stop Following')
                                    : t('gps.controls.followVehicle', 'Follow Vehicle'),
                                isActive: followVehicle,
                                onClick: onFollowToggle,
                                className: 'follow-btn'
                            })}

                            {/* Traffic Layer */}
                            {renderControlButton({
                                icon: 'traffic',
                                label: showTraffic
                                    ? t('gps.controls.hideTraffic', 'Hide Traffic')
                                    : t('gps.controls.showTraffic', 'Show Traffic'),
                                isActive: showTraffic,
                                onClick: onTrafficToggle,
                                className: 'traffic-btn'
                            })}
                        </>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Secondary Controls Group */}
            <AnimatePresence>
                {(isExpanded || !isMobile) && (
                    <motion.div
                        className="controls-group secondary"
                        variants={groupVariants}
                    >
                        {/* Cluster Toggle */}
                        {vehicleCount > 10 && renderControlButton({
                            icon: 'cluster',
                            label: showClusters
                                ? t('gps.controls.hideClusters', 'Hide Clusters')
                                : t('gps.controls.showClusters', 'Show Clusters'),
                            isActive: showClusters,
                            onClick: onClusterToggle,
                            badge: vehicleCount > 99 ? '99+' : vehicleCount.toString(),
                            className: 'cluster-btn'
                        })}

                        {/* Recenter Map */}
                        {renderControlButton({
                            icon: 'recenter',
                            label: t('gps.controls.recenterMap', 'Recenter Map'),
                            onClick: onRecenterMap,
                            disabled: vehicleCount === 0,
                            className: 'recenter-btn'
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Vehicle Info Badge */}
            {/*{selectedVehicle && (*/}
            {/*    <motion.div*/}
            {/*        className="vehicle-info-badge"*/}
            {/*        initial={{ opacity: 0, scale: 0.8 }}*/}
            {/*        animate={{ opacity: 1, scale: 1 }}*/}
            {/*        exit={{ opacity: 0, scale: 0.8 }}*/}
            {/*    >*/}
            {/*        <div className="vehicle-badge-content">*/}
            {/*            <span className="vehicle-plate">*/}
            {/*                {selectedVehicle.plateNumber}*/}
            {/*            </span>*/}
            {/*            {followVehicle && (*/}
            {/*                <div className="follow-indicator">*/}
            {/*                    <div className="pulse-dot" />*/}
            {/*                    <span className="follow-text">*/}
            {/*                        {t('gps.following', 'Following')}*/}
            {/*                    </span>*/}
            {/*                </div>*/}
            {/*            )}*/}
            {/*        </div>*/}
            {/*    </motion.div>*/}
            {/*)}*/}
        </motion.div>
    );
};

export default MapControlsOverlay;