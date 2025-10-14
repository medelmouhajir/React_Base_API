import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Styles
import './VehicleCard.css';

const VehicleCard = ({
    vehicle,
    isSelected = false,
    viewMode = 'list', // list, grid, compact
    onClick,
    isMobile = false,
    index = 0
}) => {
    const { t } = useTranslation();

    // Memoized vehicle status based on DTOs structure
    const vehicleStatus = useMemo(() => {
        // Handle both API DTO formats: VehicleLatestPositionDto and AgencyVehicleDto
        const isOnline = vehicle.isOnline ??
            (vehicle.lastRecord?.timestamp ?
                (new Date() - new Date(vehicle.lastRecord.timestamp)) < 5 * 60 * 1000 :
                false);

        const isMoving = vehicle.isMoving ??
            (vehicle.lastRecord?.speedKmh > 2 && vehicle.lastRecord?.ignitionOn) ??
            (vehicle.speedKmh > 2 && vehicle.ignitionOn) ??
            false;

        if (!isOnline) {
            return {
                status: 'offline',
                label: t('gps.modern.status.offline', 'Offline'),
                color: '#6B7280',
                icon: 'offline'
            };
        }
        if (isMoving) {
            return {
                status: 'moving',
                label: t('gps.modern.status.moving', 'Moving'),
                color: 'var(--modern-success)',
                icon: 'moving'
            };
        }
        return {
            status: 'idle',
            label: t('gps.modern.status.idle', 'Idle'),
            color: 'var(--modern-warning)',
            icon: 'idle'
        };
    }, [vehicle, t]);

    // Format last update time - handle multiple DTO timestamp formats
    const formatLastUpdate = (lastUpdate) => {
        const timestamp = lastUpdate ??
            vehicle.lastRecord?.timestamp ??
            vehicle.timestamp ??
            vehicle.lastUpdateMinutesAgo;

        if (!timestamp) return t('gps.modern.noData', 'No data');

        // If lastUpdateMinutesAgo is provided directly (from VehicleLatestPositionDto)
        if (typeof vehicle.lastUpdateMinutesAgo === 'number') {
            const minutes = vehicle.lastUpdateMinutesAgo;
            if (minutes < 1) return t('gps.modern.justNow', 'Just now');
            if (minutes < 60) return t('gps.modern.minutesAgo', '{{minutes}}m ago', { minutes });
            return t('gps.modern.hoursAgo', '{{hours}}h ago', { hours: Math.floor(minutes / 60) });
        }

        // Handle datetime string
        const now = new Date();
        const diff = Math.floor((now - new Date(timestamp)) / 1000);

        if (diff < 60) return t('gps.modern.justNow', 'Just now');
        if (diff < 3600) return t('gps.modern.minutesAgo', '{{minutes}}m ago', { minutes: Math.floor(diff / 60) });
        return t('gps.modern.hoursAgo', '{{hours}}h ago', { hours: Math.floor(diff / 3600) });
    };

    // Get status icon
    const getStatusIcon = (iconType) => {
        const icons = {
            moving: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 3l3.5 7h-7l3.5-7z" fill="currentColor" />
                    <circle cx="12" cy="17" r="4" fill="currentColor" />
                </svg>
            ),
            idle: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            offline: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5" />
                    <path d="M3 3l18 18M9 9l6 6" stroke="currentColor" strokeWidth="2" />
                </svg>
            )
        };
        return icons[iconType] || icons.offline;
    };

    // Extract vehicle data from DTOs
    const plateNumber = vehicle.plateNumber || vehicle.licensePlate || vehicle.licencePlate || vehicle.deviceSerialNumber || 'Unknown';
    const model = vehicle.model || vehicle.carModel || t('gps.modern.unknownModel', 'Unknown Model');
    const driverName = vehicle.driverName || vehicle.driver || t('gps.modern.unknownDriver', 'Unknown Driver');

    // Handle location from multiple DTO formats
    const locationAddress = vehicle.lastLocation?.address ||
        vehicle.lastRecord?.address ||
        vehicle.address ||
        t('gps.modern.unknownLocation', 'Unknown location');

    // Handle speed from multiple DTO formats
    const currentSpeed = vehicle.speed ||
        vehicle.speedKmh ||
        vehicle.lastRecord?.speedKmh ||
        0;

    // Handle alerts
    const hasAlerts = vehicle.hasAlerts || (vehicle.alertCount && vehicle.alertCount > 0) || false;
    const alertCount = vehicle.alertCount || 0;

    // Handle distance
    const totalDistance = vehicle.totalDistance || vehicle.dailyDistance || 0;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delay: index * 0.05,
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    const cardClasses = [
        'vehicle-card',
        viewMode,
        isSelected ? 'selected' : '',
        vehicleStatus.status,
        isMobile ? 'mobile' : 'desktop'
    ].filter(Boolean).join(' ');

    return (
        <motion.div
            className={cardClasses}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            onClick={onClick}
            whileHover={{
                y: -2,
                scale: 1.02,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            layout
        >
            {/* Alerts Badge */}
            {hasAlerts && (
                <div className="alerts-badge">
                    {alertCount > 0 ? alertCount : '!'}
                </div>
            )}

            {/* Vehicle Avatar/Icon */}
            <div className="vehicle-avatar">
                <motion.div
                    className="avatar-content"
                    animate={vehicleStatus.status === 'moving' ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 16" fill="none">
                        <rect x="2" y="6" width="20" height="8" rx="2" fill="currentColor" opacity="0.8" />
                        <circle cx="6" cy="12" r="2" fill="var(--color-gray-700)" />
                        <circle cx="18" cy="12" r="2" fill="var(--color-gray-700)" />
                        <rect x="4" y="4" width="16" height="4" rx="1" fill="currentColor" />
                    </svg>
                </motion.div>

                {/* Status Indicator */}
                <motion.div
                    className="status-indicator"
                    style={{ backgroundColor: vehicleStatus.color }}
                    animate={vehicleStatus.status === 'moving' ?
                        { scale: [1, 1.2, 1] } :
                        { opacity: [1, 0.6, 1] }
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>

            {/* Vehicle Info */}
            <div className="vehicle-info">
                <div className="vehicle-primary">
                    <h3 className="vehicle-plate">
                        {plateNumber}
                    </h3>
                    <div className="vehicle-status">
                        {getStatusIcon(vehicleStatus.icon)}
                        <span>{vehicleStatus.label}</span>
                    </div>
                </div>

                {viewMode !== 'compact' && (
                    <div className="vehicle-secondary">
                        <div className="vehicle-driver">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                            <span>{driverName}</span>
                        </div>

                        <div className="vehicle-location">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="10" r="3" fill="currentColor" />
                            </svg>
                            <span>
                                {locationAddress.length > 30 ?
                                    `${locationAddress.slice(0, 30)}...` :
                                    locationAddress
                                }
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Vehicle Stats */}
            {viewMode === 'list' && (
                <div className="vehicle-stats">
                    <div className="stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L13.09 8.26L22 9l-6.74 5.74L17 21l-5-2.65L7 21l1.74-6.26L2 9l8.91-1.74L12 2z" fill="currentColor" />
                        </svg>
                        <span>{currentSpeed} km/h</span>
                    </div>

                    <div className="stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="1" />
                        </svg>
                        <span>{formatLastUpdate()}</span>
                    </div>

                    {totalDistance > 0 && (
                        <div className="stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M9 11H1l8-8 8 8h-8l4 4-4 4z" fill="currentColor" />
                            </svg>
                            <span>{(totalDistance / 1000).toFixed(1)} km</span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <motion.div
                className="vehicle-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: isSelected ? 1 : 0 }}
                whileHover={{ opacity: 1 }}
            >
                <button
                    className="action-btn locate"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Handle locate action - this will be handled by parent container
                        console.log('Locate vehicle:', vehicle);
                    }}
                    aria-label={t('gps.modern.locate', 'Locate vehicle')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor" />
                        <circle cx="12" cy="10" r="3" fill="white" />
                    </svg>
                </button>

                {hasAlerts && (
                    <button
                        className="action-btn alerts"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Handle alert action - this will be handled by parent container
                            console.log('View alerts for vehicle:', vehicle);
                        }}
                        aria-label={t('gps.modern.viewAlerts', 'View alerts')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                        </svg>
                    </button>
                )}
            </motion.div>

            {/* Grid View Additional Info */}
            {viewMode === 'grid' && (
                <div className="grid-footer">
                    <div className="grid-stats">
                        <span className="speed">{currentSpeed} km/h</span>
                        <span className="update">{formatLastUpdate()}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default VehicleCard;