// src/pages/Gps/Home/components/RoutePanel/RouteStats.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { calculateSpeedStats } from '../../utils/speedColorUtils';

const RouteStats = ({ routeStats, routeData }) => {
    const { t } = useTranslation();

    if (!routeData?.records?.length) {
        return (
            <div className="stats-empty">
                <div className="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                    </svg>
                </div>
                <p>{t('gps.stats.noData', 'No statistics available')}</p>
            </div>
        );
    }

    const stats = calculateSpeedStats(routeData.records);
    const duration = stats.totalTime;
    const distance = stats.totalDistance;

    const formatDuration = (milliseconds) => {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const formatDistance = (meters) => {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${meters.toFixed(0)} m`;
    };

    return (
        <div className="route-stats">
            {/* Overview Cards */}
            <div className="stats-overview">
                <div className="stat-card primary">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatDistance(distance)}</div>
                        <div className="stat-label">{t('gps.stats.totalDistance', 'Total Distance')}</div>
                    </div>
                </div>

                <div className="stat-card primary">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatDuration(duration)}</div>
                        <div className="stat-label">{t('gps.stats.totalTime', 'Total Time')}</div>
                    </div>
                </div>

                <div className="stat-card primary">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{Math.round(stats.averageSpeed)} km/h</div>
                        <div className="stat-label">{t('gps.stats.averageSpeed', 'Average Speed')}</div>
                    </div>
                </div>

                <div className="stat-card primary">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{Math.round(stats.maxSpeed)} km/h</div>
                        <div className="stat-label">{t('gps.stats.maxSpeed', 'Max Speed')}</div>
                    </div>
                </div>
            </div>

            {/* Speed Distribution */}
            <div className="stats-section">
                <h4>{t('gps.stats.speedDistribution', 'Speed Distribution')}</h4>
                <div className="speed-distribution">
                    {Object.entries(stats.speedDistribution).map(([category, data]) => (
                        <div key={category} className="speed-category">
                            <div className="category-header">
                                <div
                                    className="category-color"
                                    style={{ backgroundColor: data.color }}
                                />
                                <span className="category-name">{data.label}</span>
                                <span className="category-percentage">
                                    {((data.count / routeData.records.length) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="category-details">
                                <span>{t('gps.stats.points', 'Points')}: {data.count}</span>
                                <span>{t('gps.stats.time', 'Time')}: {formatDuration(data.duration || 0)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Movement Analysis */}
            <div className="stats-section">
                <h4>{t('gps.stats.movementAnalysis', 'Movement Analysis')}</h4>
                <div className="movement-stats">
                    <div className="movement-item">
                        <div className="movement-label">{t('gps.stats.movingTime', 'Moving Time')}</div>
                        <div className="movement-value">{formatDuration(stats.movingTime || 0)}</div>
                        <div className="movement-percentage">
                            {((stats.movingTime / duration) * 100).toFixed(1)}%
                        </div>
                    </div>

                    <div className="movement-item">
                        <div className="movement-label">{t('gps.stats.stoppedTime', 'Stopped Time')}</div>
                        <div className="movement-value">{formatDuration(stats.stoppedTime || 0)}</div>
                        <div className="movement-percentage">
                            {((stats.stoppedTime / duration) * 100).toFixed(1)}%
                        </div>
                    </div>

                    <div className="movement-item">
                        <div className="movement-label">{t('gps.stats.ignitionOffTime', 'Engine Off Time')}</div>
                        <div className="movement-value">{formatDuration(stats.ignitionOffTime || 0)}</div>
                        <div className="movement-percentage">
                            {((stats.ignitionOffTime / duration) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Journey Details */}
            <div className="stats-section">
                <h4>{t('gps.stats.journeyDetails', 'Journey Details')}</h4>
                <div className="journey-details">
                    <div className="detail-row">
                        <span className="detail-label">{t('gps.stats.startTime', 'Start Time')}:</span>
                        <span className="detail-value">
                            {new Date(routeData.records[0].timestamp).toLocaleString()}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">{t('gps.stats.endTime', 'End Time')}:</span>
                        <span className="detail-value">
                            {new Date(routeData.records[routeData.records.length - 1].timestamp).toLocaleString()}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">{t('gps.stats.dataPoints', 'Data Points')}:</span>
                        <span className="detail-value">{routeData.records.length}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">{t('gps.stats.avgInterval', 'Avg Recording Interval')}:</span>
                        <span className="detail-value">
                            {Math.round(duration / (routeData.records.length - 1) / 1000)}s
                        </span>
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="stats-actions">
                <button className="btn btn-secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {t('gps.stats.exportData', 'Export Data')}
                </button>

                <button className="btn btn-secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                    </svg>
                    {t('gps.stats.generateReport', 'Generate Report')}
                </button>
            </div>
        </div>
    );
};

export default RouteStats;