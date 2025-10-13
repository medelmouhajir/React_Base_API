// src/pages/Gps/Home/components/RoutePanel/RoutePanel.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Components
import RouteTimeline from './RouteTimeline';
import RouteStats from './RouteStats';
import SpeedColorLegend from './SpeedColorLegend';

import './RoutePanel.css';

const RoutePanel = ({
    selectedVehicle,
    routeData,
    routeStats,
    dateRange,
    onDateRangeChange,
    isLoading,
    error,
    onClose,
    isMobile = false
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('timeline'); // timeline, stats, settings
    const [playbackState, setPlaybackState] = useState({
        isPlaying: false,
        currentIndex: 0,
        speed: 1
    });

    const handleDatePreset = (preset) => {
        const now = new Date();
        let start, end;

        switch (preset) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                start = new Date(yesterday.setHours(0, 0, 0, 0));
                end = new Date(yesterday.setHours(23, 59, 59, 999));
                break;
            case 'thisWeek':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                start = new Date(startOfWeek.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'lastWeek':
                const lastWeekStart = new Date(now);
                lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
                const lastWeekEnd = new Date(lastWeekStart);
                lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
                start = new Date(lastWeekStart.setHours(0, 0, 0, 0));
                end = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
                break;
            default:
                return;
        }

        onDateRangeChange({ start, end });
    };

    if (!selectedVehicle) {
        return (
            <div className="route-panel empty">
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.29,7 12,12 20.71,7" />
                            <line x1="12" y1="22" x2="12" y2="12" />
                        </svg>
                    </div>
                    <h3>{t('gps.route.selectVehicle', 'Select a Vehicle')}</h3>
                    <p>{t('gps.route.selectVehicleDesc', 'Choose a vehicle to view its route history')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`route-panel ${isMobile ? 'mobile' : ''}`}>
            {/* Header */}
            <div className="route-panel-header">
                <div className="panel-title">
                    <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        {t('gps.route.title', 'Route History')}
                    </h3>
                    <div className="vehicle-info">
                        <span className="vehicle-model">{selectedVehicle.model}</span>
                        <span className="vehicle-plate">{selectedVehicle.licensePlate}</span>
                    </div>
                </div>

                {!isMobile && (
                    <button className="close-panel-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Date Range Presets */}
            <div className="date-presets">
                <div className="preset-buttons">
                    <button
                        className="preset-btn"
                        onClick={() => handleDatePreset('today')}
                    >
                        {t('gps.route.today', 'Today')}
                    </button>
                    <button
                        className="preset-btn"
                        onClick={() => handleDatePreset('yesterday')}
                    >
                        {t('gps.route.yesterday', 'Yesterday')}
                    </button>
                    <button
                        className="preset-btn"
                        onClick={() => handleDatePreset('thisWeek')}
                    >
                        {t('gps.route.thisWeek', 'This Week')}
                    </button>
                    <button
                        className="preset-btn"
                        onClick={() => handleDatePreset('lastWeek')}
                    >
                        {t('gps.route.lastWeek', 'Last Week')}
                    </button>
                </div>
            </div>

            {/* Custom Date Range */}
            <div className="date-range-controls">
                <div className="date-input-group">
                    <label>{t('gps.route.from', 'From')}</label>
                    <input
                        type="datetime-local"
                        value={dateRange.start?.toISOString().slice(0, 16)}
                        onChange={(e) => onDateRangeChange({
                            ...dateRange,
                            start: new Date(e.target.value)
                        })}
                        className="date-input"
                    />
                </div>
                <div className="date-input-group">
                    <label>{t('gps.route.to', 'To')}</label>
                    <input
                        type="datetime-local"
                        value={dateRange.end?.toISOString().slice(0, 16)}
                        onChange={(e) => onDateRangeChange({
                            ...dateRange,
                            end: new Date(e.target.value)
                        })}
                        className="date-input"
                    />
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="route-tabs">
                <button
                    className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6" />
                    </svg>
                    {t('gps.route.timeline', 'Timeline')}
                </button>

                <button
                    className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                    </svg>
                    {t('gps.route.stats', 'Statistics')}
                </button>

                <button
                    className={`tab-btn ${activeTab === 'legend' ? 'active' : ''}`}
                    onClick={() => setActiveTab('legend')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <rect x="7" y="7" width="3" height="3" />
                        <rect x="14" y="7" width="3" height="3" />
                    </svg>
                    {t('gps.route.legend', 'Legend')}
                </button>
            </div>

            {/* Tab Content */}
            <div className="route-content">
                {error && (
                    <div className="error-message">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>{t('gps.route.loading', 'Loading route data...')}</p>
                    </div>
                )}

                {!isLoading && !error && (
                    <>
                        {activeTab === 'timeline' && (
                            <RouteTimeline
                                routeData={routeData}
                                playbackState={playbackState}
                                onPlaybackChange={setPlaybackState}
                            />
                        )}

                        {activeTab === 'stats' && (
                            <RouteStats
                                routeStats={routeStats}
                                routeData={routeData}
                            />
                        )}

                        {activeTab === 'legend' && (
                            <SpeedColorLegend />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RoutePanel;