import React, { useMemo } from 'react';
import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';

const ModernRoutePolyline = ({
    routeData,
    selectedVehicle,
    isVisible = true,
    isMobile = false,
    showSpeedColors = true,
    showStops = true,
    showStartEnd = true
}) => {
    // Process route data for speed-based coloring
    const processedSegments = useMemo(() => {
        if (!routeData?.coordinates?.length) return [];

        const segments = [];
        const coordinates = routeData.coordinates;

        for (let i = 0; i < coordinates.length - 1; i++) {
            const current = coordinates[i];
            const next = coordinates[i + 1];

            const speed = current.speed || 0;
            const segmentColor = getSpeedColor(speed);
            const weight = getSpeedWeight(speed);

            segments.push({
                positions: [
                    [current.latitude, current.longitude],
                    [next.latitude, next.longitude]
                ],
                color: segmentColor,
                weight: weight,
                speed: speed,
                timestamp: current.timestamp
            });
        }

        return segments;
    }, [routeData]);

    // Get stops from route data
    const stops = useMemo(() => {
        if (!routeData?.coordinates?.length) return [];

        return routeData.coordinates.filter(coord => coord.isStop || coord.stop);
    }, [routeData]);

    // Get start and end points
    const startEndPoints = useMemo(() => {
        if (!routeData?.coordinates?.length) return null;

        const coordinates = routeData.coordinates;
        return {
            start: coordinates[0],
            end: coordinates[coordinates.length - 1]
        };
    }, [routeData]);

    // Speed to color mapping
    const getSpeedColor = (speed) => {
        if (speed === 0) return '#6B7280'; // Gray for stopped
        if (speed < 20) return '#10B981'; // Green for slow
        if (speed < 40) return '#F59E0B'; // Orange for medium
        if (speed < 60) return '#3B82F6'; // Blue for fast
        return '#EF4444'; // Red for very fast/speeding
    };

    // Speed to line weight mapping
    const getSpeedWeight = (speed) => {
        if (speed === 0) return 2;
        if (speed < 20) return 3;
        if (speed < 40) return 4;
        if (speed < 60) return 5;
        return 6;
    };

    // Format time for display
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isVisible || !routeData?.coordinates?.length) {
        return null;
    }

    return (
        <>
            {/* Route segments with speed colors */}
            {showSpeedColors ? (
                processedSegments.map((segment, index) => (
                    <Polyline
                        key={`segment-${index}`}
                        positions={segment.positions}
                        color={segment.color}
                        weight={segment.weight}
                        opacity={0.8}
                        smoothFactor={1}
                        className="route-segment"
                    >
                        <Popup className="segment-popup">
                            <div className="segment-info">
                                <div className="segment-header">
                                    <strong>Route Segment</strong>
                                    <span className="segment-time">
                                        {formatTime(segment.timestamp)}
                                    </span>
                                </div>
                                <div className="segment-details">
                                    <div className="detail-item">
                                        <span className="label">Speed:</span>
                                        <span className="value">{Math.round(segment.speed)} km/h</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Polyline>
                ))
            ) : (
                // Single polyline for simple route
                <Polyline
                    positions={routeData.coordinates.map(coord => [coord.latitude, coord.longitude])}
                    color="#3B82F6"
                    weight={4}
                    opacity={0.7}
                    smoothFactor={1}
                    className="route-line"
                />
            )}

            {/* Start point marker */}
            {showStartEnd && startEndPoints?.start && (
                <CircleMarker
                    center={[startEndPoints.start.latitude, startEndPoints.start.longitude]}
                    radius={8}
                    fillColor="#10B981"
                    color="white"
                    weight={3}
                    fillOpacity={1}
                    className="route-start-marker"
                >
                    <Popup className="start-end-popup">
                        <div className="point-info">
                            <div className="point-header">
                                <div className="point-icon start">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="point-details">
                                    <strong>Start Point</strong>
                                    <span className="point-time">
                                        {formatTime(startEndPoints.start.timestamp)}
                                    </span>
                                </div>
                            </div>
                            {startEndPoints.start.address && (
                                <div className="point-address">
                                    {startEndPoints.start.address}
                                </div>
                            )}
                        </div>
                    </Popup>
                </CircleMarker>
            )}

            {/* End point marker */}
            {showStartEnd && startEndPoints?.end && (
                <CircleMarker
                    center={[startEndPoints.end.latitude, startEndPoints.end.longitude]}
                    radius={8}
                    fillColor="#EF4444"
                    color="white"
                    weight={3}
                    fillOpacity={1}
                    className="route-end-marker"
                >
                    <Popup className="start-end-popup">
                        <div className="point-info">
                            <div className="point-header">
                                <div className="point-icon end">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <rect x="6" y="6" width="12" height="12" fill="white" />
                                    </svg>
                                </div>
                                <div className="point-details">
                                    <strong>End Point</strong>
                                    <span className="point-time">
                                        {formatTime(startEndPoints.end.timestamp)}
                                    </span>
                                </div>
                            </div>
                            {startEndPoints.end.address && (
                                <div className="point-address">
                                    {startEndPoints.end.address}
                                </div>
                            )}
                        </div>
                    </Popup>
                </CircleMarker>
            )}

            {/* Stop markers */}
            {showStops && stops.map((stop, index) => (
                <CircleMarker
                    key={`stop-${index}`}
                    center={[stop.latitude, stop.longitude]}
                    radius={6}
                    fillColor="#F59E0B"
                    color="white"
                    weight={2}
                    fillOpacity={1}
                    className="route-stop-marker"
                >
                    <Popup className="stop-popup">
                        <div className="stop-info">
                            <div className="stop-header">
                                <div className="stop-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" fill="white" />
                                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="white" strokeWidth="1" />
                                    </svg>
                                </div>
                                <div className="stop-details">
                                    <strong>Stop #{index + 1}</strong>
                                    <span className="stop-time">
                                        {formatTime(stop.timestamp)}
                                    </span>
                                </div>
                            </div>
                            <div className="stop-stats">
                                {stop.duration && (
                                    <div className="stop-stat">
                                        <span className="label">Duration:</span>
                                        <span className="value">{Math.round(stop.duration / 60)} min</span>
                                    </div>
                                )}
                                {stop.address && (
                                    <div className="stop-address">
                                        {stop.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            {/* Route direction arrows (for longer routes) */}
            {processedSegments.length > 10 && (
                processedSegments
                    .filter((_, index) => index % Math.ceil(processedSegments.length / 5) === 0)
                    .map((segment, index) => {
                        const midPoint = [
                            (segment.positions[0][0] + segment.positions[1][0]) / 2,
                            (segment.positions[0][1] + segment.positions[1][1]) / 2
                        ];

                        // Calculate arrow direction
                        const angle = Math.atan2(
                            segment.positions[1][0] - segment.positions[0][0],
                            segment.positions[1][1] - segment.positions[0][1]
                        ) * 180 / Math.PI;

                        return (
                            <CircleMarker
                                key={`arrow-${index}`}
                                center={midPoint}
                                radius={4}
                                fillColor={segment.color}
                                color="white"
                                weight={1}
                                fillOpacity={0.9}
                                className="route-direction-arrow"
                            >
                                <Popup>
                                    <div className="arrow-info">
                                        <strong>Direction Indicator</strong>
                                        <div className="arrow-details">
                                            <div className="detail-item">
                                                <span className="label">Speed:</span>
                                                <span className="value">{Math.round(segment.speed)} km/h</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Time:</span>
                                                <span className="value">{formatTime(segment.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })
            )}
        </>
    );
};

export default ModernRoutePolyline;