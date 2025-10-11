// src/pages/Gps/Home/components/RoutePanel/RouteTimeline.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSpeedColor, getSpeedCategory } from '../../utils/speedColorUtils';

const RouteTimeline = ({
    routeData,
    playbackState,
    onPlaybackChange
}) => {
    const { t } = useTranslation();
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // Auto-play functionality
    useEffect(() => {
        if (!playbackState.isPlaying || !routeData?.records) return;

        const interval = setInterval(() => {
            onPlaybackChange(prev => {
                const nextIndex = prev.currentIndex + 1;
                if (nextIndex >= routeData.records.length) {
                    return { ...prev, isPlaying: false, currentIndex: 0 };
                }
                return { ...prev, currentIndex: nextIndex };
            });
        }, 1000 / playbackState.speed);

        return () => clearInterval(interval);
    }, [playbackState.isPlaying, playbackState.speed, routeData?.records, onPlaybackChange]);

    const handlePlayPause = () => {
        onPlaybackChange(prev => ({
            ...prev,
            isPlaying: !prev.isPlaying
        }));
    };

    const handleSpeedChange = (speed) => {
        onPlaybackChange(prev => ({
            ...prev,
            speed
        }));
    };

    const handleTimelineClick = (index) => {
        onPlaybackChange(prev => ({
            ...prev,
            currentIndex: index,
            isPlaying: false
        }));
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatSpeed = (speed) => {
        return `${Math.round(speed || 0)} km/h`;
    };

    if (!routeData?.records?.length) {
        return (
            <div className="timeline-empty">
                <div className="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                    </svg>
                </div>
                <p>{t('gps.timeline.noData', 'No route data available for selected time range')}</p>
            </div>
        );
    }

    const currentRecord = routeData.records[playbackState.currentIndex];
    const totalDuration = new Date(routeData.records[routeData.records.length - 1].timestamp) -
        new Date(routeData.records[0].timestamp);

    return (
        <div className="route-timeline">
            {/* Playback Controls */}
            <div className="playback-controls">
                <button
                    className={`play-btn ${playbackState.isPlaying ? 'playing' : ''}`}
                    onClick={handlePlayPause}
                >
                    {playbackState.isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21" />
                        </svg>
                    )}
                </button>

                <div className="playback-info">
                    <div className="current-time">
                        {currentRecord ? formatTime(currentRecord.timestamp) : '--:--'}
                    </div>
                    <div className="timeline-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${(playbackState.currentIndex / (routeData.records.length - 1)) * 100}%`
                                }}
                            />
                        </div>
                        <div className="timeline-ticks">
                            {routeData.records.map((record, index) => {
                                if (index % Math.ceil(routeData.records.length / 20) !== 0) return null;

                                return (
                                    <div
                                        key={index}
                                        className="timeline-tick"
                                        style={{
                                            left: `${(index / (routeData.records.length - 1)) * 100}%`
                                        }}
                                        onClick={() => handleTimelineClick(index)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="speed-controls">
                    <label>{t('gps.timeline.speed', 'Speed')}:</label>
                    {[0.5, 1, 2, 4].map(speed => (
                        <button
                            key={speed}
                            className={`speed-btn ${playbackState.speed === speed ? 'active' : ''}`}
                            onClick={() => handleSpeedChange(speed)}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Point Info */}
            {currentRecord && (
                <div className="current-point-info">
                    <div className="point-header">
                        <div className="point-time">
                            {formatTime(currentRecord.timestamp)}
                        </div>
                        <div
                            className="point-speed"
                            style={{
                                color: getSpeedColor(currentRecord.speedKmh, currentRecord.ignitionOn)
                            }}
                        >
                            {formatSpeed(currentRecord.speedKmh)}
                        </div>
                    </div>

                    <div className="point-details">
                        <div className="detail-item">
                            <span className="detail-label">{t('gps.timeline.coordinates', 'Coordinates')}:</span>
                            <span className="detail-value">
                                {parseFloat(currentRecord.latitude).toFixed(6)}, {parseFloat(currentRecord.longitude).toFixed(6)}
                            </span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-label">{t('gps.timeline.ignition', 'Ignition')}:</span>
                            <span className={`detail-value ignition ${currentRecord.ignitionOn ? 'on' : 'off'}`}>
                                {currentRecord.ignitionOn ?
                                    t('gps.timeline.ignitionOn', 'ON') :
                                    t('gps.timeline.ignitionOff', 'OFF')
                                }
                            </span>
                        </div>

                        {currentRecord.statusFlags && (
                            <div className="detail-item">
                                <span className="detail-label">{t('gps.timeline.event', 'Event')}:</span>
                                <span className="detail-value">
                                    {currentRecord.statusFlags.match(/EventName=([^;]+)/)?.[1] || 'N/A'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Timeline List */}
            <div className="timeline-list">
                <h4>{t('gps.timeline.routePoints', 'Route Points')} ({routeData.records.length})</h4>

                <div className="timeline-items">
                    {routeData.records.map((record, index) => (
                        <div
                            key={index}
                            className={`timeline-item ${index === playbackState.currentIndex ? 'current' : ''}`}
                            onClick={() => handleTimelineClick(index)}
                            onMouseEnter={() => setHoveredPoint(index)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            <div className="timeline-marker">
                                <div
                                    className="speed-indicator"
                                    style={{
                                        backgroundColor: getSpeedColor(record.speedKmh, record.ignitionOn)
                                    }}
                                />
                            </div>

                            <div className="timeline-content">
                                <div className="timeline-header">
                                    <div className="timeline-time">
                                        {formatTime(record.timestamp)}
                                    </div>
                                    <div className="timeline-speed">
                                        {formatSpeed(record.speedKmh)}
                                    </div>
                                    <div className={`ignition-status ${record.ignitionOn ? 'on' : 'off'}`}>
                                        {record.ignitionOn ? '🔥' : '❄️'}
                                    </div>
                                </div>

                                {(hoveredPoint === index || index === playbackState.currentIndex) && (
                                    <div className="timeline-details">
                                        <div className="coordinates">
                                            {parseFloat(record.latitude).toFixed(4)}, {parseFloat(record.longitude).toFixed(4)}
                                        </div>
                                        {record.statusFlags && (
                                            <div className="event-info">
                                                {record.statusFlags.match(/EventName=([^;]+)/)?.[1]}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RouteTimeline;