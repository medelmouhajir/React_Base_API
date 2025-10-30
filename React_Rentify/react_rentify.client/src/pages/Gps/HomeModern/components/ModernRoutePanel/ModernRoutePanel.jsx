import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Modern Components
import RouteTimeline from './components/RouteTimeline/RouteTimeline';
import RouteStats from './components/RouteStats/RouteStats';
import DateRangePicker from './components/DateRangePicker/DateRangePicker';
import SpeedChart from './components/SpeedChart/SpeedChart';

import './ModernRoutePanel.css';

const ModernRoutePanel = ({
    selectedVehicle,
    routeData,
    routeStats,
    dateRange,
    onDateRangeChange,
    isLoading = false,
    error = null,
    onClose,
    isMobile = false,
    onPlaybackStateChange
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('timeline'); // overview, timeline, playback, analytics
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [selectedMetric, setSelectedMetric] = useState('speed'); // speed, distance, stops

    // Calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Process route data for visualization
    const processedRouteData = useMemo(() => {
        // Handle both old format (routeData.coordinates) and new format (routeData.records)
        const records = routeData?.records || routeData?.coordinates;

        if (!records?.length) return null;

        const timePoints = [];
        const speedPoints = [];
        const distancePoints = [];
        let totalDistance = 0;

        records.forEach((record, index) => {
            // Handle timestamp - works for both old and new format
            const timestamp = new Date(record.timestamp);

            // Handle speed - new format uses speedKmh, old format uses speed
            const speed = record.speedKmh || record.speed || 0;

            // Calculate cumulative distance
            if (index > 0) {
                const prevRecord = records[index - 1];
                const distance = calculateDistance(
                    prevRecord.latitude, prevRecord.longitude,
                    record.latitude, record.longitude
                );
                totalDistance += distance;
            }

            // Create time point with all available data
            timePoints.push({
                index,
                timestamp,
                latitude: record.latitude,
                longitude: record.longitude,
                speed,
                distance: totalDistance,
                address: record.address || null,
                isStop: record.isStop || false,
                // Additional fields from DTO
                ignitionOn: record.ignitionOn,
                heading: record.heading,
                altitude: record.altitude,
                deviceSerialNumber: record.deviceSerialNumber
            });

            // Create chart data points
            speedPoints.push({
                time: timestamp,
                value: speed
            });

            distancePoints.push({
                time: timestamp,
                value: totalDistance
            });
        });

        // Use statistics from processRouteForSpeedColoring if available
        const statistics = routeData?.statistics;

        return {
            timePoints,
            speedPoints,
            distancePoints,
            totalDistance: statistics?.totalDistance || totalDistance,
            totalDuration: statistics?.totalDuration || (
                timePoints.length > 0
                    ? timePoints[timePoints.length - 1].timestamp - timePoints[0].timestamp
                    : 0
            ),
            maxSpeed: statistics?.maxSpeed || Math.max(...speedPoints.map(p => p.value)),
            avgSpeed: statistics?.averageSpeed || (
                speedPoints.reduce((sum, p) => sum + p.value, 0) / speedPoints.length
            ),
            // Include additional statistics if available
            minSpeed: statistics?.minSpeed,
            stopCount: statistics?.stopCount,
            movingTime: statistics?.movingTime,
            stoppedTime: statistics?.stoppedTime,
            speedDistribution: statistics?.speedDistribution
        };
    }, [routeData]);




    const tabs = [
        {
            id: 'timeline',
            label: t('gps.modern.timeline', 'Timeline'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 7l-5 5-5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            )
        },
        {
            id: 'analytics',
            label: t('gps.modern.analytics', 'Analytics'),
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3v18h18M9 17V9M13 17v-6M17 17v-4" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            )
        }
    ];

    const panelClasses = [
        'modern-route-panel',
        isMobile ? 'mobile' : 'desktop',
        activeTab
    ].filter(Boolean).join(' ');

    if (!selectedVehicle) {
        return (
            <motion.div
                className="route-panel-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="empty-content">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L13.09 8.26L18 7L16.74 12.74L22 14L15.74 15.26L17 21L11.26 19.74L10 24L8.74 19.74L3 21L4.26 15.26L2 14L7.26 12.74L6 7L10.91 8.26L12 2Z" fill="currentColor" opacity="0.3" />
                    </svg>
                    <h3>{t('gps.modern.selectVehicle', 'Select a vehicle')}</h3>
                    <p>{t('gps.modern.selectVehicleDescription', 'Choose a vehicle to view its route history and tracking data')}</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={panelClasses}
            initial={{ opacity: 0, y: isMobile ? 100 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {/* Panel Header */}
            <div className="panel-header">
                <div className="header-main">
                    <div className="vehicle-info">
                        <div className="vehicle-avatar">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M7 17h10l1.29-3.5H5.71L7 17zM20 8v6h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H4V8h16z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="vehicle-details">
                            <h2>{selectedVehicle.plateNumber || selectedVehicle.deviceSerialNumber}</h2>
                            <p>{selectedVehicle.driverName || t('gps.modern.unknownDriver', 'Unknown Driver')}</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <DateRangePicker
                            value={dateRange}
                            onChange={onDateRangeChange}
                            isMobile={isMobile}
                        />

                        <motion.button
                            className="close-route-panel-btn"
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
                <div className="tab-navigation">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
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
            <div className="panel-content">
                {error ? (
                    <motion.div
                        className="error-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="error-content">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                            <h3>{t('gps.modern.routeError', 'Route Error')}</h3>
                            <p>{error}</p>
                            <button
                                className="retry-btn"
                                onClick={() => window.location.reload()}
                            >
                                {t('common.retry', 'Retry')}
                            </button>
                        </div>
                    </motion.div>
                ) : isLoading ? (
                    <motion.div
                        className="loading-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="loading-content">
                            <div className="loading-spinner" />
                            <span>{t('gps.modern.loadingRoute', 'Loading route data...')}</span>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">

                        {activeTab === 'timeline' && (
                            <motion.div
                                key="timeline"
                                className="tab-content timeline"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <RouteTimeline
                                    timePoints={processedRouteData?.timePoints || []}
                                    currentIndex={currentTimeIndex}
                                    onPointSelect={setCurrentTimeIndex}
                                    isMobile={isMobile}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'analytics' && (
                            <motion.div
                                key="analytics"
                                className="tab-content analytics"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="analytics-grid">
                                    <SpeedChart
                                        data={processedRouteData?.speedPoints || []}
                                        selectedMetric={selectedMetric}
                                        onMetricChange={setSelectedMetric}
                                        isMobile={isMobile}
                                    />

                                    <div className="analytics-metrics">
                                        <div className="metric-card">
                                            <h4>{t('gps.modern.topSpeed', 'Top Speed')}</h4>
                                            <span className="value">{processedRouteData?.maxSpeed?.toFixed(1) || 0} km/h</span>
                                        </div>
                                        <div className="metric-card">
                                            <h4>{t('gps.modern.avgSpeed', 'Avg Speed')}</h4>
                                            <span className="value">{processedRouteData?.avgSpeed?.toFixed(1) || 0} km/h</span>
                                        </div>
                                        <div className="metric-card">
                                            <h4>{t('gps.modern.totalTime', 'Total Time')}</h4>
                                            <span className="value">
                                                {processedRouteData?.totalDuration ?
                                                    new Date(processedRouteData.totalDuration).toISOString().substr(11, 8) :
                                                    '00:00:00'
                                                }
                                            </span>
                                        </div>
                                        <div className="metric-card">
                                            <h4>{t('gps.modern.totalDistance', 'Total Distance')}</h4>
                                            <span className="value">{(processedRouteData?.totalDistance || 0).toFixed(1)} km</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
};

export default ModernRoutePanel;