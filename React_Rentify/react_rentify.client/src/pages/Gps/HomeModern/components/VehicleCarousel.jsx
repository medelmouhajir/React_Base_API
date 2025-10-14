import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const VehicleCarousel = ({
    vehicles = [],
    selectedVehicle,
    onVehicleSelect,
    onRefresh,
    isVisible = true
}) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const carouselRef = useRef(null);
    const autoScrollRef = useRef(null);

    // Find selected vehicle index
    useEffect(() => {
        if (selectedVehicle && vehicles.length > 0) {
            const index = vehicles.findIndex(v => v.id === selectedVehicle.id);
            if (index !== -1 && index !== currentIndex) {
                setCurrentIndex(index);
            }
        }
    }, [selectedVehicle, vehicles, currentIndex]);

    // Auto-scroll functionality (pause when user is interacting)
    const startAutoScroll = useCallback(() => {
        if (vehicles.length <= 1) return;

        autoScrollRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % vehicles.length);
        }, 5000);
    }, [vehicles.length]);

    const stopAutoScroll = useCallback(() => {
        if (autoScrollRef.current) {
            clearInterval(autoScrollRef.current);
            autoScrollRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isVisible && !isDragging) {
            startAutoScroll();
        } else {
            stopAutoScroll();
        }

        return stopAutoScroll;
    }, [isVisible, isDragging, startAutoScroll, stopAutoScroll]);

    const handleDragStart = () => {
        setIsDragging(true);
        stopAutoScroll();
    };

    const handleDragEnd = (event, info) => {
        setIsDragging(false);

        const threshold = 50;
        if (Math.abs(info.offset.x) > threshold) {
            if (info.offset.x > 0 && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            } else if (info.offset.x < 0 && currentIndex < vehicles.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        }

        setTimeout(startAutoScroll, 2000);
    };

    const handleVehicleClick = (vehicle) => {
        onVehicleSelect?.(vehicle);
        stopAutoScroll();
        setTimeout(startAutoScroll, 3000);
    };

    const getVehicleStatus = (vehicle) => {
        if (!vehicle.isOnline) return { status: 'offline', color: 'gray' };
        if (vehicle.isMoving) return { status: 'moving', color: 'green' };
        return { status: 'idle', color: 'yellow' };
    };

    const formatLastUpdate = (lastUpdate) => {
        if (!lastUpdate) return t('gps.modern.noData', 'No data');

        const now = new Date();
        const diff = Math.floor((now - new Date(lastUpdate)) / 1000);

        if (diff < 60) return t('gps.modern.justNow', 'Just now');
        if (diff < 3600) return t('gps.modern.minutesAgo', '{{minutes}}m ago', { minutes: Math.floor(diff / 60) });
        return t('gps.modern.hoursAgo', '{{hours}}h ago', { hours: Math.floor(diff / 3600) });
    };

    if (!vehicles.length) {
        return (
            <motion.div
                className="vehicle-carousel empty"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
            >
                <div className="carousel-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M7 17h10l1.29-3.5H5.71L7 17zM20 8v6h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V8h16z" fill="currentColor" opacity="0.3" />
                    </svg>
                    <p>{t('gps.modern.noVehicles', 'No vehicles found')}</p>
                    <button className="btn-refresh" onClick={onRefresh}>
                        {t('common.refresh', 'Refresh')}
                    </button>
                </div>
            </motion.div>
        );
    }

    const visibleVehicles = vehicles.slice(
        Math.max(0, currentIndex - 1),
        Math.min(vehicles.length, currentIndex + 2)
    );

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="vehicle-carousel glass"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {/* Header */}
                    <div className="carousel-header">
                        <div className="carousel-title">
                            <h3>{t('gps.modern.vehicles', 'Vehicles')}</h3>
                            <span className="vehicle-count">
                                {currentIndex + 1} / {vehicles.length}
                            </span>
                        </div>

                        <div className="carousel-controls">
                            <motion.button
                                className="control-btn"
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </motion.button>

                            <motion.button
                                className="control-btn refresh"
                                onClick={onRefresh}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 12a8 8 0 018-8V2l3 3-3 3V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 01-16 0z" fill="currentColor" />
                                </svg>
                            </motion.button>

                            <motion.button
                                className="control-btn"
                                onClick={() => setCurrentIndex(Math.min(vehicles.length - 1, currentIndex + 1))}
                                disabled={currentIndex === vehicles.length - 1}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>

                    {/* Carousel Container */}
                    <div className="carousel-container" ref={carouselRef}>
                        <motion.div
                            className="carousel-track"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            animate={{ x: -currentIndex * 100 + '%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {vehicles.map((vehicle, index) => {
                                const status = getVehicleStatus(vehicle);
                                const isSelected = selectedVehicle?.id === vehicle.id;
                                const isCurrent = index === currentIndex;

                                return (
                                    <motion.div
                                        key={vehicle.id}
                                        className={`vehicle-card ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                                        onClick={() => handleVehicleClick(vehicle)}
                                        whileTap={{ scale: 0.98 }}
                                        layout
                                    >
                                        {/* Vehicle Header */}
                                        <div className="vehicle-header">
                                            <div className="vehicle-info">
                                                <h4 className="vehicle-plate">
                                                    {vehicle.plateNumber || vehicle.deviceSerialNumber}
                                                </h4>
                                                <p className="vehicle-driver">
                                                    {vehicle.driverName || t('gps.modern.unknownDriver', 'Unknown Driver')}
                                                </p>
                                            </div>

                                            <div className="vehicle-status">
                                                <motion.div
                                                    className={`status-indicator ${status.status}`}
                                                    animate={vehicle.isMoving ?
                                                        { scale: [1, 1.2, 1] } :
                                                        { opacity: [1, 0.6, 1] }
                                                    }
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <span className="status-text">
                                                    {t(`gps.modern.status.${status.status}`, status.status)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Vehicle Stats */}
                                        <div className="vehicle-stats">
                                            <div className="stat">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 2L13.09 8.26L22 9l-6.74 5.74L17 21l-5-2.65L7 21l1.74-6.26L2 9l8.91-1.74L12 2z" fill="currentColor" />
                                                </svg>
                                                <span>{vehicle.speed || 0} km/h</span>
                                            </div>

                                            <div className="stat">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                                                </svg>
                                                <span>
                                                    {vehicle.lastLocation?.address?.slice(0, 20) ||
                                                        t('gps.modern.unknownLocation', 'Unknown')}
                                                    {vehicle.lastLocation?.address?.length > 20 && '...'}
                                                </span>
                                            </div>

                                            <div className="stat">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                                                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" />
                                                </svg>
                                                <span>{formatLastUpdate(vehicle.lastUpdate)}</span>
                                            </div>
                                        </div>

                                        {/* Vehicle Actions */}
                                        <div className="vehicle-actions">
                                            {vehicle.lastLocation && (
                                                <motion.button
                                                    className="action-btn locate"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleVehicleClick(vehicle);
                                                    }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor" />
                                                        <circle cx="12" cy="10" r="3" fill="white" />
                                                    </svg>
                                                    {t('gps.modern.locate', 'Locate')}
                                                </motion.button>
                                            )}

                                            {vehicle.hasAlerts && (
                                                <motion.button
                                                    className="action-btn alerts"
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                                                    </svg>
                                                    {t('gps.modern.alerts', 'Alerts')}
                                                </motion.button>
                                            )}
                                        </div>

                                        {/* Selection Indicator */}
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    className="selection-indicator"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                    transition={{ type: "spring" }}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Vehicle Image/Icon */}
                                        <div className="vehicle-image">
                                            <svg width="60" height="40" viewBox="0 0 24 16" fill="none">
                                                <rect x="2" y="6" width="20" height="8" rx="2" fill="var(--color-primary-500)" opacity="0.8" />
                                                <circle cx="6" cy="12" r="2" fill="var(--color-gray-700)" />
                                                <circle cx="18" cy="12" r="2" fill="var(--color-gray-700)" />
                                                <rect x="4" y="4" width="16" height="4" rx="1" fill="var(--color-primary-600)" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>

                    {/* Progress Indicators */}
                    <div className="carousel-indicators">
                        {vehicles.map((_, index) => (
                            <motion.button
                                key={index}
                                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(index)}
                                whileTap={{ scale: 0.9 }}
                                animate={index === currentIndex ? { scale: 1.2 } : { scale: 1 }}
                            />
                        ))}
                    </div>

                    {/* Swipe Hint */}
                    {vehicles.length > 1 && !isDragging && (
                        <motion.div
                            className="swipe-hint"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor" />
                            </svg>
                            <span>{t('gps.modern.swipeHint', 'Swipe to navigate')}</span>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VehicleCarousel;