// src/pages/Gps/HomeModern/components/ModernRoutePanel/RouteTimeline.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './RouteTimeline.css';

const RouteTimeline = ({
    timePoints = [],
    currentIndex = 0,
    onPointSelect,
    isMobile = false
}) => {
    const { t } = useTranslation();
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);

    // Speed categorization
    const getSpeedCategory = (speed) => {
        if (speed === 0) return 'stopped';
        if (speed < 10) return 'slow';
        if (speed < 30) return 'moderate';
        if (speed < 60) return 'fast';
        return 'very-fast';
    };

    // Process time points for visualization
    const processedPoints = useMemo(() => {
        if (!timePoints.length) return [];

        return timePoints.map((point, index) => ({
            ...point,
            progress: (index / (timePoints.length - 1)) * 100,
            isFirst: index === 0,
            isLast: index === timePoints.length - 1,
            isCurrent: index === currentIndex,
            isPast: index < currentIndex,
            isFuture: index > currentIndex,
            speedCategory: getSpeedCategory(point.speed || 0)
        }));
    }, [timePoints, currentIndex]);


    // Get speed color
    const getSpeedColor = (speed) => {
        const category = getSpeedCategory(speed);
        const colors = {
            stopped: '#6B7280',
            slow: '#10B981',
            moderate: '#F59E0B',
            fast: '#EF4444',
            'very-fast': '#DC2626'
        };
        return colors[category] || '#6B7280';
    };

    // Format time for display
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            ...(isMobile ? {} : { second: '2-digit' })
        });
    };

    // Format duration
    const formatDuration = (start, end) => {
        if (!start || !end) return '';
        const diff = new Date(end) - new Date(start);
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    // Handle point selection
    const handlePointClick = (index) => {
        if (onPointSelect) {
            onPointSelect(index);
        }
    };

    if (!timePoints.length) {
        return (
            <div className="route-timeline-empty">
                <div className="empty-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 1v6m0 6v6" stroke="currentColor" strokeWidth="2" />
                        <path d="m21 12-6 0m-6 0-6 0" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <h3>{t('gps.timeline.noData', 'No Timeline Data')}</h3>
                    <p>{t('gps.timeline.noDataDesc', 'No route timeline available for the selected period.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`route-timeline ${isMobile ? 'mobile' : ''}`}>
            {/* Timeline Header */}
            <div className="timeline-header">
                <div className="timeline-info">
                    <h3>{t('gps.timeline.title', 'Route Timeline')}</h3>
                    <p className="timeline-summary">
                        {processedPoints.length} {t('gps.timeline.points', 'points')} • {' '}
                        {timePoints.length > 1 && formatDuration(
                            timePoints[0].timestamp,
                            timePoints[timePoints.length - 1].timestamp
                        )}
                    </p>
                </div>

                <div className="timeline-controls">
                    <button
                        className="control-btn"
                        onClick={() => handlePointClick(0)}
                        disabled={currentIndex === 0}
                        title={t('gps.timeline.goToStart', 'Go to start')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>

                    <button
                        className="control-btn"
                        onClick={() => handlePointClick(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        title={t('gps.timeline.previous', 'Previous point')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>

                    <button
                        className="control-btn"
                        onClick={() => handlePointClick(Math.min(timePoints.length - 1, currentIndex + 1))}
                        disabled={currentIndex === timePoints.length - 1}
                        title={t('gps.timeline.next', 'Next point')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>

                    <button
                        className="control-btn"
                        onClick={() => handlePointClick(timePoints.length - 1)}
                        disabled={currentIndex === timePoints.length - 1}
                        title={t('gps.timeline.goToEnd', 'Go to end')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Timeline Visualization */}
            <div className="timeline-container">
                <div className="timeline-track">
                    <div
                        className="timeline-progress"
                        style={{ width: `${(currentIndex / (timePoints.length - 1)) * 100}%` }}
                    />

                    {processedPoints.map((point, index) => (
                        <motion.div
                            key={index}
                            className={`timeline-point ${point.speedCategory} ${point.isCurrent ? 'current' : ''} ${point.isStop ? 'stop' : ''}`}
                            style={{
                                left: `${point.progress}%`,
                                '--speed-color': getSpeedColor(point.speed || 0)
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: point.isCurrent ? 1.2 : 1,
                                opacity: 1
                            }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.02
                            }}
                            onClick={() => handlePointClick(index)}
                            onMouseEnter={() => {
                                setHoveredIndex(index);
                                setShowTooltip(true);
                            }}
                            onMouseLeave={() => {
                                setHoveredIndex(null);
                                setShowTooltip(false);
                            }}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {point.isStop && (
                                <div className="stop-indicator">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                        <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                                    </svg>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                    {showTooltip && hoveredIndex !== null && (
                        <motion.div
                            className="timeline-tooltip"
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            style={{
                                left: `${processedPoints[hoveredIndex]?.progress}%`,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <div className="tooltip-content">
                                <div className="tooltip-time">
                                    {formatTime(processedPoints[hoveredIndex]?.timestamp)}
                                </div>
                                <div className="tooltip-speed">
                                    {Math.round(processedPoints[hoveredIndex]?.speed || 0)} km/h
                                </div>
                                {processedPoints[hoveredIndex]?.address && (
                                    <div className="tooltip-address">
                                        {processedPoints[hoveredIndex].address}
                                    </div>
                                )}
                                {processedPoints[hoveredIndex]?.isStop && (
                                    <div className="tooltip-stop">
                                        {t('gps.timeline.stop', 'Stop')}
                                    </div>
                                )}
                            </div>
                            <div className="tooltip-arrow" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Current Point Details */}
            <AnimatePresence>
                {currentIndex >= 0 && processedPoints[currentIndex] && (
                    <motion.div
                        className="current-point-details"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="detail-row">
                            <span className="label">{t('gps.timeline.time', 'Time')}:</span>
                            <span className="value">
                                {formatTime(processedPoints[currentIndex].timestamp)}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="label">{t('gps.timeline.speed', 'Speed')}:</span>
                            <span className="value speed" style={{ color: getSpeedColor(processedPoints[currentIndex].speed || 0) }}>
                                {Math.round(processedPoints[currentIndex].speed || 0)} km/h
                            </span>
                        </div>

                        {processedPoints[currentIndex].distance && (
                            <div className="detail-row">
                                <span className="label">{t('gps.timeline.distance', 'Distance')}:</span>
                                <span className="value">
                                    {(processedPoints[currentIndex].distance / 1000).toFixed(2)} km
                                </span>
                            </div>
                        )}

                        {processedPoints[currentIndex].address && (
                            <div className="detail-row full-width">
                                <span className="label">{t('gps.timeline.location', 'Location')}:</span>
                                <span className="value address">
                                    {processedPoints[currentIndex].address}
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RouteTimeline;