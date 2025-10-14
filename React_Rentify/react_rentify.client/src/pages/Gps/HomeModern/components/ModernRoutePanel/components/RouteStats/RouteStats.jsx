// src/pages/Gps/HomeModern/components/ModernRoutePanel/RouteStats.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './RouteStats.css';

const RouteStats = ({
    routeData,
    vehicle,
    dateRange,
    isMobile = false
}) => {
    const { t } = useTranslation();

    // Calculate comprehensive route statistics
    const stats = useMemo(() => {
        if (!routeData?.timePoints?.length) {
            return {
                totalDistance: 0,
                totalDuration: 0,
                maxSpeed: 0,
                avgSpeed: 0,
                stopCount: 0,
                totalStopTime: 0,
                fuelEfficiency: 0,
                dataPoints: 0,
                startTime: null,
                endTime: null,
                speedDistribution: {},
                distanceByHour: []
            };
        }

        const points = routeData.timePoints;
        const totalDistance = routeData.totalDistance || 0;
        const totalDuration = routeData.totalDuration || 0;
        const speeds = points.map(p => p.speed || 0).filter(s => s > 0);
        const stops = points.filter(p => p.isStop || (p.speed || 0) === 0);

        // Speed distribution
        const speedRanges = { '0': 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        speeds.forEach(speed => {
            if (speed === 0) speedRanges['0']++;
            else if (speed <= 30) speedRanges['1-30']++;
            else if (speed <= 60) speedRanges['31-60']++;
            else if (speed <= 90) speedRanges['61-90']++;
            else speedRanges['90+']++;
        });

        // Distance by hour analysis
        const hourlyDistance = {};
        points.forEach(point => {
            if (point.timestamp && point.distance) {
                const hour = new Date(point.timestamp).getHours();
                hourlyDistance[hour] = (hourlyDistance[hour] || 0) + (point.distance || 0);
            }
        });

        // Convert to array for chart
        const distanceByHour = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            distance: hourlyDistance[hour] || 0,
            label: `${hour.toString().padStart(2, '0')}:00`
        }));

        // Calculate stop time
        let totalStopTime = 0;
        stops.forEach((stop, index) => {
            if (index < stops.length - 1) {
                const nextPoint = stops[index + 1];
                if (nextPoint && stop.timestamp) {
                    totalStopTime += new Date(nextPoint.timestamp) - new Date(stop.timestamp);
                }
            }
        });

        return {
            totalDistance: totalDistance / 1000, // Convert to km
            totalDuration,
            maxSpeed: Math.max(...speeds, 0),
            avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
            stopCount: stops.length,
            totalStopTime,
            fuelEfficiency: totalDistance > 0 ? (totalDistance / 1000) * 0.08 : 0, // Estimated
            dataPoints: points.length,
            startTime: points[0]?.timestamp,
            endTime: points[points.length - 1]?.timestamp,
            speedDistribution: speedRanges,
            distanceByHour
        };
    }, [routeData]);

    // Format duration
    const formatDuration = (milliseconds) => {
        if (!milliseconds || milliseconds <= 0) return '0m';

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    // Format distance
    const formatDistance = (km) => {
        if (km >= 1000) {
            return `${(km / 1000).toFixed(1)}k km`;
        } else if (km >= 1) {
            return `${km.toFixed(1)} km`;
        } else {
            return `${(km * 1000).toFixed(0)} m`;
        }
    };

    // Format date/time
    const formatDateTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Stat card component
    const StatCard = ({ icon, title, value, unit, trend, trendColor, description, delay = 0 }) => (
        <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 }
            }}
        >
            <div className="stat-header">
                <div className="stat-icon">
                    {icon}
                </div>
                {trend && (
                    <div className={`stat-trend ${trendColor}`}>
                        {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="stat-content">
                <div className="stat-value">
                    {value}
                    {unit && <span className="stat-unit">{unit}</span>}
                </div>
                <div className="stat-title">{title}</div>
                {description && <div className="stat-description">{description}</div>}
            </div>
        </motion.div>
    );

    if (!routeData?.timePoints?.length) {
        return (
            <div className="route-stats-empty">
                <div className="empty-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <h3>{t('gps.stats.noData', 'No Statistics Available')}</h3>
                    <p>{t('gps.stats.noDataDesc', 'No route data available for statistical analysis.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`route-stats ${isMobile ? 'mobile' : ''}`}>
            {/* Header */}
            <div className="stats-header">
                <div className="stats-title">
                    <h3>{t('gps.stats.title', 'Route Statistics')}</h3>
                    <p className="stats-subtitle">
                        {vehicle?.plateNumber || vehicle?.deviceSerialNumber} • {' '}
                        {formatDateTime(stats.startTime)} - {formatDateTime(stats.endTime)}
                    </p>
                </div>
            </div>

            {/* Primary Stats Grid */}
            <div className="primary-stats-grid">
                <StatCard
                    icon={
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M9 11H7a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-2M9 11V9a2 2 0 112 0v2M9 11h6"
                                stroke="currentColor" strokeWidth="2" />
                        </svg>
                    }
                    title={t('gps.stats.totalDistance', 'Total Distance')}
                    value={formatDistance(stats.totalDistance)}
                    description={`${stats.dataPoints} ${t('gps.stats.dataPoints', 'data points')}`}
                    delay={0}
                />

                <StatCard
                    icon={
                        <svg viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    }
                    title={t('gps.stats.totalTime', 'Total Time')}
                    value={formatDuration(stats.totalDuration)}
                    description={formatDuration(stats.totalStopTime) + ' ' + t('gps.stats.stopped', 'stopped')}
                    delay={0.1}
                />

                <StatCard
                    icon={
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    }
                    title={t('gps.stats.maxSpeed', 'Max Speed')}
                    value={Math.round(stats.maxSpeed)}
                    unit=" km/h"
                    description={`${t('gps.stats.avgSpeed', 'Avg')}: ${Math.round(stats.avgSpeed)} km/h`}
                    delay={0.2}
                />

                <StatCard
                    icon={
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                                stroke="currentColor" strokeWidth="2" />
                            <polyline points="7.5,8 12,5 16.5,8" stroke="currentColor" strokeWidth="2" />
                            <polyline points="7.5,16 12,19 16.5,16" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    }
                    title={t('gps.stats.stops', 'Stops')}
                    value={stats.stopCount}
                    description={`${formatDuration(stats.totalStopTime / Math.max(stats.stopCount, 1))} ${t('gps.stats.avgStopTime', 'avg stop')}`}
                    delay={0.3}
                />
            </div>

            {/* Speed Distribution */}
            <motion.div
                className="stats-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
            >
                <h4 className="section-title">{t('gps.stats.speedDistribution', 'Speed Distribution')}</h4>
                <div className="speed-distribution">
                    {Object.entries(stats.speedDistribution).map(([range, count], index) => {
                        const total = Object.values(stats.speedDistribution).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (count / total * 100) : 0;

                        return (
                            <div key={range} className="speed-range">
                                <div className="range-header">
                                    <span className="range-label">
                                        {range === '0' ? t('gps.stats.stopped', 'Stopped') :
                                            range === '90+' ? '90+ km/h' : `${range} km/h`}
                                    </span>
                                    <span className="range-percentage">{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="range-bar">
                                    <motion.div
                                        className="range-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                        style={{
                                            backgroundColor: getSpeedRangeColor(range)
                                        }}
                                    />
                                </div>
                                <span className="range-count">{count} {t('gps.stats.points', 'points')}</span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Additional Details */}
            <motion.div
                className="stats-details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
            >
                <h4 className="section-title">{t('gps.stats.additionalDetails', 'Additional Details')}</h4>

                <div className="details-grid">
                    <div className="detail-item">
                        <span className="detail-label">{t('gps.stats.startLocation', 'Start Location')}:</span>
                        <span className="detail-value">
                            {routeData.timePoints[0]?.address ||
                                `${routeData.timePoints[0]?.latitude?.toFixed(6)}, ${routeData.timePoints[0]?.longitude?.toFixed(6)}`}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">{t('gps.stats.endLocation', 'End Location')}:</span>
                        <span className="detail-value">
                            {routeData.timePoints[routeData.timePoints.length - 1]?.address ||
                                `${routeData.timePoints[routeData.timePoints.length - 1]?.latitude?.toFixed(6)}, ${routeData.timePoints[routeData.timePoints.length - 1]?.longitude?.toFixed(6)}`}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">{t('gps.stats.avgRecordingInterval', 'Avg Recording Interval')}:</span>
                        <span className="detail-value">
                            {stats.totalDuration > 0 && stats.dataPoints > 1
                                ? Math.round(stats.totalDuration / (stats.dataPoints - 1) / 1000) + 's'
                                : 'N/A'
                            }
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">{t('gps.stats.estimatedFuel', 'Estimated Fuel Used')}:</span>
                        <span className="detail-value">{stats.fuelEfficiency.toFixed(1)} L</span>
                    </div>
                </div>
            </motion.div>

            {/* Actions */}
            <motion.div
                className="stats-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
            >
                <button className="action-btn primary">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" />
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" />
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {t('gps.stats.exportReport', 'Export Report')}
                </button>

                <button className="action-btn secondary">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {t('gps.stats.generatePdf', 'Generate PDF')}
                </button>
            </motion.div>
        </div>
    );

    // Helper function for speed range colors
    function getSpeedRangeColor(range) {
        const colors = {
            '0': '#6B7280',      // Gray for stopped
            '1-30': '#10B981',   // Green for slow
            '31-60': '#F59E0B',  // Yellow for moderate
            '61-90': '#EF4444',  // Red for fast
            '90+': '#DC2626'     // Dark red for very fast
        };
        return colors[range] || '#6B7280';
    }
};

export default RouteStats;