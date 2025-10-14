// src/pages/Gps/HomeModern/components/ModernRoutePanel/RoutePlayback.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './RoutePlayback.css';

const RoutePlayback = ({
    timePoints = [],
    currentIndex = 0,
    onIndexChange,
    onPlaybackStateChange,
    isMobile = false
}) => {
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedControls, setShowSpeedControls] = useState(false);
    const [playbackMode, setPlaybackMode] = useState('linear'); // linear, smooth, realtime

    // Available playback speeds
    const speedOptions = [0.25, 0.5, 1, 2, 4, 8, 16];

    // Auto-advance playback
    useEffect(() => {
        if (!isPlaying || !timePoints.length || currentIndex >= timePoints.length - 1) {
            return;
        }

        const interval = setInterval(() => {
            if (onIndexChange) {
                onIndexChange(prevIndex => {
                    const nextIndex = Math.min(prevIndex + 1, timePoints.length - 1);
                    if (nextIndex === timePoints.length - 1) {
                        setIsPlaying(false);
                    }
                    return nextIndex;
                });
            }
        }, 1000 / playbackSpeed);

        return () => clearInterval(interval);
    }, [isPlaying, playbackSpeed, currentIndex, timePoints.length, onIndexChange]);

    // Notify parent of playback state changes
    useEffect(() => {
        if (onPlaybackStateChange) {
            onPlaybackStateChange({
                isPlaying,
                currentIndex,
                playbackSpeed,
                playbackMode
            });
        }
    }, [isPlaying, currentIndex, playbackSpeed, playbackMode, onPlaybackStateChange]);

    // Playback progress as percentage
    const progress = useMemo(() => {
        if (!timePoints.length) return 0;
        return (currentIndex / (timePoints.length - 1)) * 100;
    }, [currentIndex, timePoints.length]);

    // Current point data
    const currentPoint = useMemo(() => {
        return timePoints[currentIndex] || null;
    }, [timePoints, currentIndex]);

    // Format time for display
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Handle play/pause
    const handlePlayPause = () => {
        if (currentIndex >= timePoints.length - 1) {
            // Reset to beginning if at end
            if (onIndexChange) {
                onIndexChange(0);
            }
        }
        setIsPlaying(!isPlaying);
    };

    // Handle stop (reset to beginning)
    const handleStop = () => {
        setIsPlaying(false);
        if (onIndexChange) {
            onIndexChange(0);
        }
    };

    // Handle speed change
    const handleSpeedChange = (newSpeed) => {
        setPlaybackSpeed(newSpeed);
        setShowSpeedControls(false);
    };

    // Handle scrubbing (manual timeline control)
    const handleScrub = useCallback((event) => {
        if (!timePoints.length) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const newIndex = Math.round((percentage / 100) * (timePoints.length - 1));

        if (onIndexChange) {
            onIndexChange(newIndex);
        }
    }, [timePoints.length, onIndexChange]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeydown = (event) => {
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    handlePlayPause();
                    break;
                case 'ArrowLeft':
                    if (onIndexChange) {
                        onIndexChange(Math.max(0, currentIndex - 1));
                    }
                    break;
                case 'ArrowRight':
                    if (onIndexChange) {
                        onIndexChange(Math.min(timePoints.length - 1, currentIndex + 1));
                    }
                    break;
                case 'Home':
                    if (onIndexChange) {
                        onIndexChange(0);
                    }
                    break;
                case 'End':
                    if (onIndexChange) {
                        onIndexChange(timePoints.length - 1);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [currentIndex, timePoints.length, onIndexChange, handlePlayPause]);

    if (!timePoints.length) {
        return (
            <div className="route-playback-empty">
                <div className="empty-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                    <h3>{t('gps.playback.noData', 'No Playback Data')}</h3>
                    <p>{t('gps.playback.noDataDesc', 'No route data available for playback.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`route-playback ${isMobile ? 'mobile' : ''}`}>
            {/* Playback Header */}
            <div className="playback-header">
                <div className="playback-info">
                    <h3>{t('gps.playback.title', 'Route Playback')}</h3>
                    <p className="playback-status">
                        {isPlaying ? t('gps.playback.playing', 'Playing') : t('gps.playback.paused', 'Paused')} • {' '}
                        {currentIndex + 1} / {timePoints.length} • {' '}
                        {playbackSpeed}x {t('gps.playback.speed', 'speed')}
                    </p>
                </div>

                <div className="playback-mode-selector">
                    <button
                        className={`mode-btn ${playbackMode === 'linear' ? 'active' : ''}`}
                        onClick={() => setPlaybackMode('linear')}
                        title={t('gps.playback.linearMode', 'Linear playback')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12h18m-9-9l9 9-9 9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                    <button
                        className={`mode-btn ${playbackMode === 'smooth' ? 'active' : ''}`}
                        onClick={() => setPlaybackMode('smooth')}
                        title={t('gps.playback.smoothMode', 'Smooth playback')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="timeline-scrubber">
                <div
                    className="scrubber-track"
                    onClick={handleScrub}
                >
                    <div
                        className="scrubber-progress"
                        style={{ width: `${progress}%` }}
                    />
                    <motion.div
                        className="scrubber-thumb"
                        style={{ left: `${progress}%` }}
                        animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
                        transition={{
                            duration: 1,
                            repeat: isPlaying ? Infinity : 0,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Timeline markers */}
                    {timePoints.map((point, index) => {
                        if (index % Math.ceil(timePoints.length / 20) === 0) {
                            const markerProgress = (index / (timePoints.length - 1)) * 100;
                            return (
                                <div
                                    key={index}
                                    className="timeline-marker"
                                    style={{ left: `${markerProgress}%` }}
                                    title={formatTime(point.timestamp)}
                                />
                            );
                        }
                        return null;
                    })}
                </div>

                <div className="timeline-labels">
                    <span className="timeline-start">
                        {timePoints[0] && formatTime(timePoints[0].timestamp)}
                    </span>
                    <span className="timeline-current">
                        {currentPoint && formatTime(currentPoint.timestamp)}
                    </span>
                    <span className="timeline-end">
                        {timePoints[timePoints.length - 1] && formatTime(timePoints[timePoints.length - 1].timestamp)}
                    </span>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="playback-controls">
                <div className="main-controls">
                    <motion.button
                        className="control-btn"
                        onClick={handleStop}
                        whileTap={{ scale: 0.9 }}
                        title={t('gps.playback.stop', 'Stop')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                        </svg>
                    </motion.button>

                    <motion.button
                        className="control-btn"
                        onClick={() => onIndexChange && onIndexChange(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        whileTap={{ scale: 0.9 }}
                        title={t('gps.playback.previousPoint', 'Previous point')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <polygon points="11,19 2,12 11,5" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M22 19V5" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </motion.button>

                    <motion.button
                        className="control-btn play-pause"
                        onClick={handlePlayPause}
                        whileTap={{ scale: 0.9 }}
                        title={isPlaying ? t('gps.playback.pause', 'Pause') : t('gps.playback.play', 'Play')}
                    >
                        <AnimatePresence mode="wait">
                            {isPlaying ? (
                                <motion.svg
                                    key="pause"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                                    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                                </motion.svg>
                            ) : (
                                <motion.svg
                                    key="play"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <polygon points="5,3 19,12 5,21" fill="currentColor" />
                                </motion.svg>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <motion.button
                        className="control-btn"
                        onClick={() => onIndexChange && onIndexChange(Math.min(timePoints.length - 1, currentIndex + 1))}
                        disabled={currentIndex === timePoints.length - 1}
                        whileTap={{ scale: 0.9 }}
                        title={t('gps.playback.nextPoint', 'Next point')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <polygon points="13,19 22,12 13,5" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M2 19V5" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </motion.button>

                    <div className="speed-control">
                        <motion.button
                            className="speed-btn"
                            onClick={() => setShowSpeedControls(!showSpeedControls)}
                            whileTap={{ scale: 0.9 }}
                            title={t('gps.playback.changeSpeed', 'Change speed')}
                        >
                            {playbackSpeed}x
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </motion.button>

                        <AnimatePresence>
                            {showSpeedControls && (
                                <motion.div
                                    className="speed-options"
                                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {speedOptions.map(speed => (
                                        <button
                                            key={speed}
                                            className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                                            onClick={() => handleSpeedChange(speed)}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Current Point Information */}
            <AnimatePresence>
                {currentPoint && (
                    <motion.div
                        className="current-point-info"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="point-details">
                            <div className="detail-group">
                                <div className="detail-item">
                                    <span className="detail-label">{t('gps.playback.time', 'Time')}:</span>
                                    <span className="detail-value">
                                        {formatTime(currentPoint.timestamp)}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">{t('gps.playback.speed', 'Speed')}:</span>
                                    <span className="detail-value speed">
                                        {Math.round(currentPoint.speed || 0)} km/h
                                    </span>
                                </div>
                            </div>

                            <div className="detail-group">
                                <div className="detail-item">
                                    <span className="detail-label">{t('gps.playback.coordinates', 'Coordinates')}:</span>
                                    <span className="detail-value coordinates">
                                        {currentPoint.latitude?.toFixed(6)}, {currentPoint.longitude?.toFixed(6)}
                                    </span>
                                </div>
                                {currentPoint.distance && (
                                    <div className="detail-item">
                                        <span className="detail-label">{t('gps.playback.totalDistance', 'Total Distance')}:</span>
                                        <span className="detail-value">
                                            {(currentPoint.distance / 1000).toFixed(2)} km
                                        </span>
                                    </div>
                                )}
                            </div>

                            {currentPoint.address && (
                                <div className="detail-group full-width">
                                    <div className="detail-item">
                                        <span className="detail-label">{t('gps.playback.location', 'Location')}:</span>
                                        <span className="detail-value address">
                                            {currentPoint.address}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {currentPoint.isStop && (
                                <div className="stop-indicator-info">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                                    </svg>
                                    <span>{t('gps.playback.stopLocation', 'Stop Location')}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard Shortcuts Help */}
            {!isMobile && (
                <div className="keyboard-shortcuts">
                    <span className="shortcuts-title">{t('gps.playback.shortcuts', 'Shortcuts')}:</span>
                    <span className="shortcut">Space: {t('gps.playback.playPause', 'Play/Pause')}</span>
                    <span className="shortcut">←/→: {t('gps.playback.navigate', 'Navigate')}</span>
                    <span className="shortcut">Home/End: {t('gps.playback.startEnd', 'Start/End')}</span>
                </div>
            )}
        </div>
    );
}
export default RoutePlayback;