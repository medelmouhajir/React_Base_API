import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Styles
import './ModernVehicleDetailsPanel.css';

const ModernVehicleDetailsPanel = ({
    selectedVehicle,
    onClose,
    isMobile = false,
    onVehicleAction,
    isLoading = false
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');
    const [actionLoading, setActionLoading] = useState({});

    // Vehicle status based on DTO structure
    const vehicleStatus = useMemo(() => {
        if (!selectedVehicle) return null;

        if (selectedVehicle.status === 'Available') {
            return {
                status: 'available',
                label: t('car.status.available', 'Offline'),
                color: '#6B7280',
                icon: 'offline'
            };
        }

        if (selectedVehicle.status === 'Rented') {
            return {
                status: 'rented',
                label: t('car.status.rented', 'Offline'),
                color: 'var(--modern-success)',
                icon: 'moving'
            };
        }

        if (selectedVehicle.status === 'Maintenance') {
            return {
                status: 'maintenance',
                label: t('car.status.maintenance', 'Offline'),
                color: 'var(--modern-warning)',
                icon: 'idle'
            };
        }
        return {
            status: 'idle',
            label: t('gps.modern.status.idle', 'Idle'),
            color: 'var(--modern-warning)',
            icon: 'idle'
        };
    }, [selectedVehicle, t]);

    // Format last update time
    const formatLastUpdate = useCallback((lastUpdate) => {
        if (!lastUpdate) return t('gps.modern.never', 'Never');

        const now = new Date();
        const updateTime = new Date(lastUpdate);
        const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));

        if (diffMinutes < 1) return t('gps.modern.justNow', 'Just now');
        if (diffMinutes < 60) return t('gps.modern.minutesAgo', '{{count}} min ago', { count: diffMinutes });

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return t('gps.modern.hoursAgo', '{{count}}h ago', { count: diffHours });

        const diffDays = Math.floor(diffHours / 24);
        return t('gps.modern.daysAgo', '{{count}}d ago', { count: diffDays });
    }, [t]);

    // Handle vehicle actions
    const handleVehicleAction = useCallback(async (actionType) => {
        if (!selectedVehicle || !onVehicleAction) return;

        setActionLoading(prev => ({ ...prev, [actionType]: true }));

        try {
            await onVehicleAction(selectedVehicle, actionType);
        } catch (error) {
            console.error(`Failed to execute ${actionType}:`, error);
        } finally {
            setActionLoading(prev => ({ ...prev, [actionType]: false }));
        }
    }, [selectedVehicle, onVehicleAction]);

    // Get vehicle actions based on status
    const getVehicleActions = useMemo(() => {
        if (!selectedVehicle) return [];

        const ignitionOn = selectedVehicle.lastRecord?.ignitionOn ??
            selectedVehicle.ignitionOn ??
            false;

        return [
            {
                id: 'ignition',
                label: ignitionOn ?
                    t('gps.modern.actions.turnOff', 'Turn Off') :
                    t('gps.modern.actions.turnOn', 'Turn On'),
                icon: ignitionOn ? 'power-off' : 'power-on',
                color: ignitionOn ? 'danger' : 'success',
                action: () => handleVehicleAction(ignitionOn ? 'ignition_off' : 'ignition_on'),
                disabled: !vehicleStatus?.status === 'online'
            },
            {
                id: 'lock',
                label: t('gps.modern.actions.lock', 'Lock Vehicle'),
                icon: 'lock',
                color: 'warning',
                action: () => handleVehicleAction('lock'),
                disabled: !vehicleStatus?.status === 'online'
            },
            {
                id: 'unlock',
                label: t('gps.modern.actions.unlock', 'Unlock Vehicle'),
                icon: 'unlock',
                color: 'info',
                action: () => handleVehicleAction('unlock'),
                disabled: !vehicleStatus?.status === 'online'
            },
            {
                id: 'locate',
                label: t('gps.modern.actions.locate', 'Locate'),
                icon: 'locate',
                color: 'primary',
                action: () => handleVehicleAction('locate')
            }
        ];
    }, [selectedVehicle, vehicleStatus, t, handleVehicleAction]);

    // Tab configuration
    const tabs = [
        {
            id: 'overview',
            label: t('gps.modern.tabs.overview', 'Overview'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" fill="currentColor" />
                </svg>
            )
        },
        {
            id: 'details',
            label: t('gps.modern.tabs.details', 'Details'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" />
                </svg>
            )
        }
    ];

    // Get icon for action
    const getActionIcon = (iconType) => {
        const icons = {
            'power-on': (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v10M18.36 6.64a9 9 0 11-12.73 0" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            'power-off': (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            'lock': (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6zM11 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            'unlock': (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6zM11 11V7a4 4 0 014-4 4 4 0 014 4" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            'locate': (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="10" r="3" fill="currentColor" />
                </svg>
            )
        };
        return icons[iconType] || icons.locate;
    };

    // Get action color
    const getActionColor = (colorType) => {
        const colors = {
            primary: 'var(--modern-primary)',
            success: 'var(--modern-success)',
            warning: 'var(--modern-warning)',
            danger: 'var(--modern-danger)',
            info: 'var(--modern-info)'
        };
        return colors[colorType] || colors.primary;
    };

    if (!selectedVehicle) {
        return (
            <div className="vehicule-details-panel-empty">
                <div className="vehicule-details-panel-empty-content">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M7 17h10l1.29-3.5H5.71L7 17zM20 8v6h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V8h16z" />
                    </svg>
                    <h3>{t('gps.modern.selectVehicle', 'Select a Vehicle')}</h3>
                    <p>{t('gps.modern.selectVehicleDesc', 'Choose a vehicle from the list to view its details and controls')}</p>
                </div>
            </div>
        );
    }

    const panelClasses = [
        'vehicule-details-panel',
        isMobile ? 'vehicule-details-panel-mobile' : 'vehicule-details-panel-desktop'
    ].filter(Boolean).join(' ');

    return (
        <motion.div
            className={panelClasses}
            initial={{ opacity: 0, x: isMobile ? 100 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {/* Panel Header */}
            <div className="vehicule-details-panel-header">
                <div className="vehicule-details-panel-header-main">
                    <div className="vehicule-details-panel-vehicle-info">
                        <div className="vehicule-details-panel-vehicule-avatar">
                            {selectedVehicle.mainImage ? (
                                <img
                                    src={selectedVehicle.mainImage}
                                    alt={selectedVehicle.model}
                                    className="vehicule-details-panel-vehicle-image"
                                />
                            ) : (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 17h10l1.29-3.5H5.71L7 17zM20 8v6h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V8h16z" fill="currentColor" />
                                </svg>
                            )}
                        </div>
                        <div className="vehicule-details-panel-vehicle-details">
                            <h2>{selectedVehicle.licensePlate || selectedVehicle.plateNumber}</h2>
                            <p>{selectedVehicle.model} {selectedVehicle.year && `(${selectedVehicle.year})`}</p>
                            <div className="vehicule-details-panel-status-badge"
                                style={{ backgroundColor: vehicleStatus?.color }}>
                                {vehicleStatus?.label}
                            </div>
                        </div>
                    </div>

                    <div className="vehicule-details-panel-header-actions">
                        <motion.button
                            className="vehicule-details-panel-close-btn"
                            onClick={onClose}
                            whileTap={{ scale: 0.95 }}
                            aria-label={t('common.close', 'Close')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </motion.button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="vehicule-details-panel-tab-navigation">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            className={`vehicule-details-panel-tab-btn ${activeTab === tab.id ? 'vehicule-details-panel-tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            whileTap={{ scale: 0.95 }}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Panel Content */}
            <div className="vehicule-details-panel-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="vehicule-details-panel-tab-content"
                    >
                        {activeTab === 'overview' && (
                            <div className="vehicule-details-panel-overview">

                                {/* Reservation Info Section */}
                                {selectedVehicle.lastReservation ? (
                                    <div className="modern-vehicle-details-panel-reservation-container">
                                        <div className="modern-vehicle-details-panel-reservation-header">
                                            <div className="modern-vehicle-details-panel-reservation-status">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <h4>{t('gps.modern.activeReservation', 'Active Reservation')}</h4>
                                            </div>
                                            <span className={`modern-vehicle-details-panel-reservation-badge modern-vehicle-details-panel-reservation-badge-${selectedVehicle.lastReservation.status?.toLowerCase()}`}>
                                                {selectedVehicle.lastReservation.status || 'N/A'}
                                            </span>
                                        </div>

                                        {/* Reservation Dates */}
                                        <div className="modern-vehicle-details-panel-reservation-dates">
                                            <div className="modern-vehicle-details-panel-reservation-date-item">
                                                <div className="modern-vehicle-details-panel-reservation-date-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <div className="modern-vehicle-details-panel-reservation-date-content">
                                                    <span className="modern-vehicle-details-panel-reservation-date-label">
                                                        {t('gps.modern.startDate', 'Start Date')}
                                                    </span>
                                                    <span className="modern-vehicle-details-panel-reservation-date-value">
                                                        {selectedVehicle.lastReservation.startDate
                                                            ? new Date(selectedVehicle.lastReservation.startDate).toLocaleDateString([], {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="modern-vehicle-details-panel-reservation-date-divider">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>

                                            <div className="modern-vehicle-details-panel-reservation-date-item">
                                                <div className="modern-vehicle-details-panel-reservation-date-icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <div className="modern-vehicle-details-panel-reservation-date-content">
                                                    <span className="modern-vehicle-details-panel-reservation-date-label">
                                                        {t('gps.modern.endDate', 'End Date')}
                                                    </span>
                                                    <span className="modern-vehicle-details-panel-reservation-date-value">
                                                        {selectedVehicle.lastReservation.endDate
                                                            ? new Date(selectedVehicle.lastReservation.endDate).toLocaleDateString([], {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Information */}
                                        {selectedVehicle.driverName && (
                                            <div className="modern-vehicle-details-panel-reservation-section">
                                                <h5 className="modern-vehicle-details-panel-reservation-section-title">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    {t('gps.modern.customerInfo', 'Customer Information')}
                                                </h5>
                                                <div className="modern-vehicle-details-panel-reservation-customer">
                                                    <div className="modern-vehicle-details-panel-reservation-customer-avatar">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                    <div className="modern-vehicle-details-panel-reservation-customer-info">
                                                        <span className="modern-vehicle-details-panel-reservation-customer-name">
                                                            {selectedVehicle.driverName}
                                                        </span>
                                                        <span className="modern-vehicle-details-panel-reservation-customer-label">
                                                            {t('gps.modern.renter', 'Renter')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pricing Information */}
                                        <div className="modern-vehicle-details-panel-reservation-section">
                                            <h5 className="modern-vehicle-details-panel-reservation-section-title">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                {t('gps.modern.pricing', 'Pricing')}
                                            </h5>
                                            <div className="modern-vehicle-details-panel-reservation-pricing">
                                                <div className="modern-vehicle-details-panel-reservation-price-item">
                                                    <span className="modern-vehicle-details-panel-reservation-price-label">
                                                        {t('gps.modern.agreedPrice', 'Agreed Price')}
                                                    </span>
                                                    <span className="modern-vehicle-details-panel-reservation-price-value">
                                                        {selectedVehicle.lastReservation.agreedPrice
                                                            ? `${selectedVehicle.lastReservation.agreedPrice.toLocaleString()} MAD`
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                </div>
                                                {selectedVehicle.lastReservation.finalPrice && (
                                                    <div className="modern-vehicle-details-panel-reservation-price-item">
                                                        <span className="modern-vehicle-details-panel-reservation-price-label">
                                                            {t('gps.modern.finalPrice', 'Final Price')}
                                                        </span>
                                                        <span className="modern-vehicle-details-panel-reservation-price-value modern-vehicle-details-panel-reservation-price-final">
                                                            {selectedVehicle.lastReservation.finalPrice.toLocaleString()} MAD
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pickup & Dropoff Locations */}
                                        {(selectedVehicle.lastReservation.pickupLocation || selectedVehicle.lastReservation.dropoffLocation) && (
                                            <div className="modern-vehicle-details-panel-reservation-section">
                                                <h5 className="modern-vehicle-details-panel-reservation-section-title">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    {t('gps.modern.locations', 'Locations')}
                                                </h5>
                                                <div className="modern-vehicle-details-panel-reservation-locations">
                                                    {selectedVehicle.lastReservation.pickupLocation && (
                                                        <div className="modern-vehicle-details-panel-reservation-location-item">
                                                            <div className="modern-vehicle-details-panel-reservation-location-icon modern-vehicle-details-panel-reservation-location-pickup">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                </svg>
                                                            </div>
                                                            <div className="modern-vehicle-details-panel-reservation-location-content">
                                                                <span className="modern-vehicle-details-panel-reservation-location-label">
                                                                    {t('gps.modern.pickup', 'Pickup')}
                                                                </span>
                                                                <span className="modern-vehicle-details-panel-reservation-location-address">
                                                                    {selectedVehicle.lastReservation.pickupLocation}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedVehicle.lastReservation.dropoffLocation && (
                                                        <div className="modern-vehicle-details-panel-reservation-location-item">
                                                            <div className="modern-vehicle-details-panel-reservation-location-icon modern-vehicle-details-panel-reservation-location-dropoff">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                </svg>
                                                            </div>
                                                            <div className="modern-vehicle-details-panel-reservation-location-content">
                                                                <span className="modern-vehicle-details-panel-reservation-location-label">
                                                                    {t('gps.modern.dropoff', 'Dropoff')}
                                                                </span>
                                                                <span className="modern-vehicle-details-panel-reservation-location-address">
                                                                    {selectedVehicle.lastReservation.dropoffLocation}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* No Reservation State */
                                    <div className="modern-vehicle-details-panel-reservation-empty">
                                        <div className="modern-vehicle-details-panel-reservation-empty-icon">
                                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <h3 className="modern-vehicle-details-panel-reservation-empty-title">
                                            {t('gps.modern.noActiveReservation', 'No Active Reservation')}
                                        </h3>
                                        <p className="modern-vehicle-details-panel-reservation-empty-description">
                                            {t('gps.modern.noReservationDesc', 'This vehicle currently has no active reservation')}
                                        </p>
                                    </div>
                                )}

                                {/* Car Actions Section */}
                                <div className="vehicule-details-panel-car-actions">
                                    <h4>{t('gps.modern.carActions', 'Vehicle Controls')}</h4>
                                    <div className="vehicule-details-panel-actions-grid">
                                        {getVehicleActions.map((action) => (
                                            <motion.button
                                                key={action.id}
                                                className={`vehicule-details-panel-action-btn ${action.disabled ? 'vehicule-details-panel-action-disabled' : ''}`}
                                                onClick={action.action}
                                                disabled={action.disabled || actionLoading[action.id]}
                                                whileTap={{ scale: action.disabled ? 1 : 0.95 }}
                                                style={{ '--action-color': getActionColor(action.color) }}
                                            >
                                                <div className="vehicule-details-panel-action-icon">
                                                    {actionLoading[action.id] ? (
                                                        <motion.svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        >
                                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" />
                                                        </motion.svg>
                                                    ) : (
                                                        getActionIcon(action.icon)
                                                    )}
                                                </div>
                                                <span className="vehicule-details-panel-action-label">
                                                    {action.label}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="vehicule-details-panel-details">
                                <div className="vehicule-details-panel-detail-group">
                                    <h4>{t('gps.modern.vehicleInfo', 'Vehicle Information')}</h4>
                                    <div className="vehicule-details-panel-detail-item">
                                        <span className="vehicule-details-panel-detail-label">{t('gps.modern.manufacturer', 'Manufacturer')}</span>
                                        <span className="vehicule-details-panel-detail-value">{selectedVehicle.manufacturer || 'N/A'}</span>
                                    </div>
                                    <div className="vehicule-details-panel-detail-item">
                                        <span className="vehicule-details-panel-detail-label">{t('gps.modern.model', 'Model')}</span>
                                        <span className="vehicule-details-panel-detail-value">{selectedVehicle.model || 'N/A'}</span>
                                    </div>
                                    <div className="vehicule-details-panel-detail-item">
                                        <span className="vehicule-details-panel-detail-label">{t('gps.modern.year', 'Year')}</span>
                                        <span className="vehicule-details-panel-detail-value">{selectedVehicle.year || 'N/A'}</span>
                                    </div>
                                    <div className="vehicule-details-panel-detail-item">
                                        <span className="vehicule-details-panel-detail-label">{t('gps.modern.licensePlate', 'License Plate')}</span>
                                        <span className="vehicule-details-panel-detail-value">{selectedVehicle.licensePlate || selectedVehicle.plateNumber || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="vehicule-details-panel-detail-group">
                                    <h4>{t('gps.modern.gpsInfo', 'GPS Information')}</h4>
                                    <div className="vehicule-details-panel-detail-item">
                                        <span className="vehicule-details-panel-detail-label">{t('gps.modern.deviceSerial', 'Device Serial')}</span>
                                        <span className="vehicule-details-panel-detail-value">{selectedVehicle.deviceSerialNumber || 'N/A'}</span>
                                    </div>
                                    <div className="vehicule-details-panel-detail-item">
                                        <span className="vehicule-details-panel-detail-label">{t('gps.modern.trackingActive', 'Tracking Active')}</span>
                                        <span className="vehicule-details-panel-detail-value">
                                            {selectedVehicle.isTrackingActive ?
                                                t('common.yes', 'Yes') :
                                                t('common.no', 'No')
                                            }
                                        </span>
                                    </div>
                                </div>

                                {selectedVehicle.driverName && (
                                    <div className="vehicule-details-panel-detail-group">
                                        <h4>{t('gps.modern.driverInfo', 'Driver Information')}</h4>
                                        <div className="vehicule-details-panel-detail-item">
                                            <span className="vehicule-details-panel-detail-label">{t('gps.modern.driver', 'Driver')}</span>
                                            <span className="vehicule-details-panel-detail-value">{selectedVehicle.driverName}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default ModernVehicleDetailsPanel;