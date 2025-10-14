import React, { useMemo } from 'react';
import { Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { motion } from 'framer-motion';
import './ModernRoutePolyline.css';

const ModernRoutePolyline = ({
    processedRouteData,
    selectedVehicle,
    isVisible = true,
    isMobile = false,
    showSpeedColors = true,
    showStops = true,
    showStartEnd = true,
    animateRoute = false
}) => {
    // Extract segments and stops from processed route data
    const { segments, stops } = useMemo(() => {
        if (!processedRouteData || !processedRouteData.segments) {
            return { segments: [], stops: [] };
        }
        return {
            segments: processedRouteData.segments,
            stops: processedRouteData.stops || []
        };
    }, [processedRouteData]);

    // Get start and end points
    const startEndPoints = useMemo(() => {
        if (!processedRouteData?.records || processedRouteData.records.length === 0) {
            return null;
        }

        const records = processedRouteData.records;
        return {
            start: {
                latitude: records[0].latitude,
                longitude: records[0].longitude,
                timestamp: records[0].timestamp,
                speed: records[0].speedKmh
            },
            end: {
                latitude: records[records.length - 1].latitude,
                longitude: records[records.length - 1].longitude,
                timestamp: records[records.length - 1].timestamp,
                speed: records[records.length - 1].speedKmh
            }
        };
    }, [processedRouteData]);

    // Format time for display
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format duration for display
    const formatDuration = (milliseconds) => {
        const minutes = Math.floor(milliseconds / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    };

    // Format distance for display
    const formatDistance = (meters) => {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    };

    if (!isVisible || segments.length === 0) {
        return null;
    }

    return (
        <div className="modern-route-polyline">
            {/* Route segments with speed colors */}
            {showSpeedColors ? (
                segments.map((segment, index) => (
                    <Polyline
                        key={`segment-${index}`}
                        positions={[segment.start, segment.end]}
                        pathOptions={{
                            color: segment.color,
                            weight: isMobile ? segment.weight * 0.8 : segment.weight,
                            opacity: segment.opacity,
                            className: animateRoute ? 'route-segment-animated' : 'route-segment'
                        }}
                    >
                        <Tooltip sticky>
                            <div className="segment-tooltip">
                                <span className="speed-value">{segment.speed.toFixed(0)} km/h</span>
                                <span className="time-value">{formatTime(segment.timestamp)}</span>
                                {segment.ignitionOn !== undefined && (
                                    <span className={`ignition-status ${segment.ignitionOn ? 'on' : 'off'}`}>
                                        {segment.ignitionOn ? '🔥 Engine On' : '⭕ Engine Off'}
                                    </span>
                                )}
                            </div>
                        </Tooltip>
                    </Polyline>
                ))
            ) : (
                // Single polyline without speed coloring
                <Polyline
                    positions={segments.map(s => s.start)}
                    pathOptions={{
                        color: '#3B82F6',
                        weight: isMobile ? 3 : 4,
                        opacity: 0.8
                    }}
                />
            )}

            {/* Stop markers */}
            {showStops && stops.map((stop, index) => (
                <CircleMarker
                    key={`stop-${index}`}
                    center={[stop.latitude, stop.longitude]}
                    radius={isMobile ? 6 : 8}
                    pathOptions={{
                        fillColor: stop.ignitionOn ? '#F59E0B' : '#EF4444',
                        fillOpacity: 0.8,
                        color: '#ffffff',
                        weight: 2
                    }}
                >
                    <Popup>
                        <div className="stop-popup">
                            <h4>Stop #{index + 1}</h4>
                            <div className="stop-details">
                                <div className="detail-row">
                                    <span className="detail-label">Duration:</span>
                                    <span className="detail-value">{formatDuration(stop.duration)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Start:</span>
                                    <span className="detail-value">{formatTime(stop.startTime)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">End:</span>
                                    <span className="detail-value">{formatTime(stop.endTime)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Engine:</span>
                                    <span className={`detail-value ${stop.ignitionOn ? 'ignition-on' : 'ignition-off'}`}>
                                        {stop.ignitionOn ? 'On (Idle)' : 'Off'}
                                    </span>
                                </div>
                                {stop.address && (
                                    <div className="detail-row">
                                        <span className="detail-label">Location:</span>
                                        <span className="detail-value">{stop.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -10]}>
                        <span className="stop-tooltip">
                            Stop: {formatDuration(stop.duration)}
                        </span>
                    </Tooltip>
                </CircleMarker>
            ))}

            {/* Start and End markers */}
            {showStartEnd && startEndPoints && (
                <>
                    {/* Start marker */}
                    <CircleMarker
                        center={[startEndPoints.start.latitude, startEndPoints.start.longitude]}
                        radius={isMobile ? 10 : 12}
                        pathOptions={{
                            fillColor: '#10B981',
                            fillOpacity: 0.9,
                            color: '#ffffff',
                            weight: 3
                        }}
                    >
                        <Popup>
                            <div className="endpoint-popup">
                                <h4>Route Start</h4>
                                <div className="endpoint-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Time:</span>
                                        <span className="detail-value">{formatTime(startEndPoints.start.timestamp)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Speed:</span>
                                        <span className="detail-value">{startEndPoints.start.speed.toFixed(0)} km/h</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                        <Tooltip permanent direction="top" offset={[0, -10]}>
                            <span className="endpoint-tooltip start">START</span>
                        </Tooltip>
                    </CircleMarker>

                    {/* End marker */}
                    <CircleMarker
                        center={[startEndPoints.end.latitude, startEndPoints.end.longitude]}
                        radius={isMobile ? 10 : 12}
                        pathOptions={{
                            fillColor: '#EF4444',
                            fillOpacity: 0.9,
                            color: '#ffffff',
                            weight: 3
                        }}
                    >
                        <Popup>
                            <div className="endpoint-popup">
                                <h4>Route End</h4>
                                <div className="endpoint-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Time:</span>
                                        <span className="detail-value">{formatTime(startEndPoints.end.timestamp)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Speed:</span>
                                        <span className="detail-value">{startEndPoints.end.speed.toFixed(0)} km/h</span>
                                    </div>
                                    {processedRouteData.statistics && (
                                        <>
                                            <div className="detail-row">
                                                <span className="detail-label">Total Distance:</span>
                                                <span className="detail-value">
                                                    {formatDistance(processedRouteData.statistics.totalDistance)}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Total Duration:</span>
                                                <span className="detail-value">
                                                    {formatDuration(processedRouteData.statistics.totalDuration)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Popup>
                        <Tooltip permanent direction="top" offset={[0, -10]}>
                            <span className="endpoint-tooltip end">END</span>
                        </Tooltip>
                    </CircleMarker>
                </>
            )}
        </div>
    );
};

export default ModernRoutePolyline;