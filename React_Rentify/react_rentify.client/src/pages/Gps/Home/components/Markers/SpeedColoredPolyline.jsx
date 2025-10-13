// src/pages/Gps/Home/components/Markers/SpeedColoredPolyline.jsx
import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { useTranslation } from 'react-i18next';

// Styles
import './SpeedColoredPolyline.css';

const SpeedColoredPolyline = ({ segment, zoom = 10, showTooltip = true }) => {
    const { t } = useTranslation();

    if (!segment || !segment.positions || segment.positions.length < 2) {
        return null;
    }

    // Adjust line weight based on zoom level
    const getLineWeight = () => {
        if (zoom < 10) return 2;
        if (zoom < 14) return 3;
        if (zoom < 16) return 4;
        return 5;
    };

    // Path options for the polyline
    const pathOptions = {
        color: segment.color,
        weight: getLineWeight(),
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: segment.ignitionOn ? null : '10, 5' // Dashed line when ignition is off
    };

    // Format time for tooltip
    const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format duration
    const formatDuration = (ms) => {
        if (!ms || ms < 1000) return '< 1s';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    };

    return (
        <Polyline
            positions={segment.positions}
            pathOptions={pathOptions}
        >
            {showTooltip && (
                <Tooltip
                    permanent={false}
                    direction="top"
                    offset={[0, -10]}
                    className="route-segment-tooltip"
                >
                    <div className="segment-tooltip-content">
                        <div className="tooltip-header">
                            <div
                                className="speed-indicator"
                                style={{ backgroundColor: segment.color }}
                            ></div>
                            <strong>
                                {segment.category === 'stopped'
                                    ? t('gps.route.stopped', 'Stopped')
                                    : `${segment.speed} km/h`
                                }
                            </strong>
                        </div>

                        <div className="tooltip-details">
                            {segment.startTime && (
                                <div className="detail-row">
                                    <span className="label">{t('gps.route.startTime', 'Start')}:</span>
                                    <span className="value">{formatTime(segment.startTime)}</span>
                                </div>
                            )}

                            {segment.endTime && (
                                <div className="detail-row">
                                    <span className="label">{t('gps.route.endTime', 'End')}:</span>
                                    <span className="value">{formatTime(segment.endTime)}</span>
                                </div>
                            )}

                            {segment.duration && (
                                <div className="detail-row">
                                    <span className="label">{t('gps.route.duration', 'Duration')}:</span>
                                    <span className="value">{formatDuration(segment.duration)}</span>
                                </div>
                            )}

                            {segment.distance && (
                                <div className="detail-row">
                                    <span className="label">{t('gps.route.distance', 'Distance')}:</span>
                                    <span className="value">
                                        {segment.distance > 1000
                                            ? `${(segment.distance / 1000).toFixed(2)} km`
                                            : `${Math.round(segment.distance)} m`
                                        }
                                    </span>
                                </div>
                            )}

                            <div className="detail-row">
                                <span className="label">{t('gps.ignition', 'Ignition')}:</span>
                                <span className={`value ${segment.ignitionOn ? 'text-success' : 'text-danger'}`}>
                                    {segment.ignitionOn ? t('common.on', 'ON') : t('common.off', 'OFF')}
                                </span>
                            </div>

                            {segment.category && (
                                <div className="detail-row">
                                    <span className="label">{t('gps.route.category', 'Category')}:</span>
                                    <span className="value">
                                        {t(`gps.speedCategories.${segment.category}`, segment.category)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </Tooltip>
            )}
        </Polyline>
    );
};

export default SpeedColoredPolyline;