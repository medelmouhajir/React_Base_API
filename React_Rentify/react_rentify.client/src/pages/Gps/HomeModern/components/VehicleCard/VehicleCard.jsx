import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './VehicleCard.css';

const VehicleCard = ({
    vehicle,
    isSelected = false,
    viewMode = 'list',
    onClick,
    isMobile = false,
    index = 0
}) => {
    const { t } = useTranslation();

    // Extract vehicle data from DTO
    const licensePlate = vehicle.plateNumber || vehicle.licensePlate || vehicle.licencePlate || vehicle.deviceSerialNumber || 'N/A';
    const model = vehicle.model || vehicle.carModel || t('gps.modern.unknownModel', 'Unknown Model');
    const manufacturer = vehicle.manufacturer || t('gps.modern.unknownManufacturer', 'Unknown');
    const status = vehicle.status || 'Available';

    // Check if vehicle has current reservation
    const hasReservation = vehicle.currentReservation != null || vehicle.lastReservation != null;

    // Determine vehicle status based on GPS data
    const vehicleStatus = useMemo(() => {
        const isOnline = vehicle.isOnline ?? false;
        const isMoving = vehicle.isMoving ?? false;


        if (vehicle.status === 'Available') {
            return {
                status: 'available',
                label: t('car.status.available', 'Offline'),
                color: '#6B7280',
                icon: 'offline'
            };
        }

        if (vehicle.status === 'Rented') {
            return {
                status: 'rented',
                label: t('car.status.rented', 'Offline'),
                color: 'var(--modern-success)',
                icon: 'moving'
            };
        }

        if (vehicle.status === 'Maintenance') {
            return {
                status: 'maintenance',
                label: t('car.status.maintenance', 'Offline'),
                color: 'var(--modern-warning)',
                icon: 'idle'
            };
        }

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

    // Card animation variants
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

    // Build card class names
    const cardClasses = [
        'modern-vehicle-card',
        `modern-vehicle-card-${viewMode}`,
        isSelected ? 'modern-vehicle-card-selected' : '',
        `modern-vehicle-card-${vehicleStatus.status}`,
        isMobile ? 'modern-vehicle-card-mobile' : ''
    ].filter(Boolean).join(' ');

    // Status icon component
    const StatusIcon = ({ iconType }) => {
        const icons = {
            moving: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.5 9H8.5L12 2Z" fill="currentColor" />
                    <circle cx="12" cy="17" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M12 13V17" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            idle: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 1V5M12 19V23M23 12H19M5 12H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            offline: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5" />
                    <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        };
        return icons[iconType] || icons.offline;
    };

    return (
        <motion.div
            className={cardClasses}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            onClick={onClick}
            whileHover={{
                y: -2,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            layout
        >
            {/* Status Bar Indicator */}
            <div
                className="modern-vehicle-card-status-bar"
                style={{ backgroundColor: vehicleStatus.color }}
            />

            {/* Reservation Badge */}
            {hasReservation && (
                <motion.div
                    className="modern-vehicle-card-reservation-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{t('gps.modern.reserved', 'Reserved')}</span>
                </motion.div>
            )}

            {/* Card Content */}
            <div className="modern-vehicle-card-content">
                {/* Vehicle Icon/Avatar */}
                <div className="modern-vehicle-card-avatar">
                    <div
                        className="modern-vehicle-card-avatar-inner"
                        style={{ borderColor: vehicleStatus.color }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 13L7.5 9H16.5L19 13M5 13V18C5 18.5523 5.44772 19 6 19H7M5 13H19M19 13V18C19 18.5523 18.5523 19 18 19H17M7 19C7 19.5523 7.44772 20 8 20C8.55228 20 9 19.5523 9 19C9 18.4477 8.55228 18 8 18C7.44772 18 7 18.4477 7 19ZM17 19C17 19.5523 16.5523 20 16 20C15.4477 20 15 19.5523 15 19C15 18.4477 15.4477 18 16 18C16.5523 18 17 18.4477 17 19Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    {/* Status Pulse Effect for Moving Vehicles */}
                    {vehicleStatus.status === 'moving' && (
                        <motion.div
                            className="modern-vehicle-card-pulse"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{ borderColor: vehicleStatus.color }}
                        />
                    )}
                </div>

                {/* Vehicle Information */}
                <div className="modern-vehicle-card-info">
                    {/* License Plate - Primary */}
                    <div className="modern-vehicle-card-plate">
                        {licensePlate}
                    </div>

                    {/* Status Badge */}
                    <div
                        className="modern-vehicle-card-status-badge"
                        style={{
                            backgroundColor: `${vehicleStatus.color}20`,
                            color: vehicleStatus.color
                        }}
                    >
                        <StatusIcon iconType={vehicleStatus.icon} />
                        <span>{vehicleStatus.label}</span>
                    </div>

                    {/* Vehicle Details */}
                    <div className="modern-vehicle-card-details">
                        <div className="modern-vehicle-card-detail-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                                <path d="M7 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="modern-vehicle-card-detail-label">{t('gps.modern.model', 'Model')}:</span>
                            <span className="modern-vehicle-card-detail-value">{model}</span>
                        </div>

                        <div className="modern-vehicle-card-detail-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="modern-vehicle-card-detail-label">{t('gps.modern.manufacturer', 'Manufacturer')}:</span>
                            <span className="modern-vehicle-card-detail-value">{manufacturer}</span>
                        </div>

                        <div className="modern-vehicle-card-detail-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="modern-vehicle-card-detail-label">{t('gps.modern.status', 'Status')}:</span>
                            <span className="modern-vehicle-card-detail-value">{status}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <motion.div
                    className="modern-vehicle-card-selected-indicator"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>
            )}
        </motion.div>
    );
};

export default VehicleCard;