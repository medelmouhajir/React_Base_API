// src/pages/Gps/Home/components/Markers/RouteMarker.jsx
import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

const RouteMarker = ({
    position,
    type = 'waypoint', // 'start', 'end', 'waypoint', 'stop', 'event'
    data = {},
    onClick,
    showPopup = false,
    icon = null
}) => {
    const { t } = useTranslation();

    if (!position || isNaN(position[0]) || isNaN(position[1])) {
        return null;
    }

    // Create custom icon based on marker type
    const markerIcon = useMemo(() => {
        if (icon) return icon;

        const getMarkerConfig = () => {
            switch (type) {
                case 'start':
                    return {
                        color: '#10b981',
                        icon: '🟢',
                        size: [32, 32],
                        label: t('gps.route.start', 'Start')
                    };
                case 'end':
                    return {
                        color: '#ef4444',
                        icon: '🔴',
                        size: [32, 32],
                        label: t('gps.route.end', 'End')
                    };
                case 'stop':
                    return {
                        color: '#f59e0b',
                        icon: '⏸️',
                        size: [24, 24],
                        label: t('gps.route.stop', 'Stop')
                    };
                case 'event':
                    return {
                        color: '#8b5cf6',
                        icon: '⚡',
                        size: [24, 24],
                        label: data.eventType || t('gps.route.event', 'Event')
                    };
                default: // waypoint
                    return {
                        color: '#3b82f6',
                        icon: '📍',
                        size: [20, 20],
                        label: t('gps.route.waypoint', 'Waypoint')
                    };
            }
        };

        const config = getMarkerConfig();

        const iconHtml = `
            <div class="route-marker route-marker-${type}">
                <div class="marker-icon" style="
                    background-color: ${config.color};
                    width: ${config.size[0]}px;
                    height: ${config.size[1]}px;
                ">
                    <span class="marker-emoji">${config.icon}</span>
                </div>
                ${type === 'start' || type === 'end' ? `
                    <div class="marker-label" style="color: ${config.color};">
                        ${config.label}
                    </div>
                ` : ''}
            </div>
        `;

        return L.divIcon({
            html: iconHtml,
            className: 'route-marker-container',
            iconSize: config.size,
            iconAnchor: [config.size[0] / 2, config.size[1]],
            popupAnchor: [0, -config.size[1]]
        });
    }, [type, data, icon, t]);

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleString();
    };

    // Format duration for stops
    const formatStopDuration = (duration) => {
        if (!duration) return '';

        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);

        if (minutes > 60) {
            const hours = Math.floor(minutes / 60);
            return `${hours}h ${minutes % 60}m`;
        }

        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    return (
        <Marker
            position={position}
            icon={markerIcon}
            eventHandlers={{
                click: () => onClick?.(data)
            }}
        >
            <Popup closeOnEscapeKey={true} maxWidth={250}>
                <div className={`route-marker-popup ${type}`}>
                    <div className="popup-header">
                        <h4>
                            {type === 'start' && t('gps.route.startPoint', 'Start Point')}
                            {type === 'end' && t('gps.route.endPoint', 'End Point')}
                            {type === 'stop' && t('gps.route.stopPoint', 'Stop Point')}
                            {type === 'event' && (data.eventType || t('gps.route.eventPoint', 'Event Point'))}
                            {type === 'waypoint' && t('gps.route.waypointDetails', 'Waypoint')}
                        </h4>
                    </div>

                    <div className="popup-content">
                        {data.timestamp && (
                            <div className="info-row">
                                <span className="label">{t('gps.timestamp', 'Time')}:</span>
                                <span className="value">{formatTime(data.timestamp)}</span>
                            </div>
                        )}

                        {data.address && (
                            <div className="info-row">
                                <span className="label">{t('gps.address', 'Address')}:</span>
                                <span className="value">{data.address}</span>
                            </div>
                        )}

                        {data.speed !== undefined && (
                            <div className="info-row">
                                <span className="label">{t('gps.speed', 'Speed')}:</span>
                                <span className="value">{data.speed} km/h</span>
                            </div>
                        )}

                        {type === 'stop' && data.duration && (
                            <div className="info-row">
                                <span className="label">{t('gps.route.stopDuration', 'Stop Duration')}:</span>
                                <span className="value">{formatStopDuration(data.duration)}</span>
                            </div>
                        )}

                        {data.ignitionOn !== undefined && (
                            <div className="info-row">
                                <span className="label">{t('gps.ignition', 'Ignition')}:</span>
                                <span className={`value ${data.ignitionOn ? 'text-success' : 'text-danger'}`}>
                                    {data.ignitionOn ? t('common.on', 'ON') : t('common.off', 'OFF')}
                                </span>
                            </div>
                        )}

                        {data.coordinates && (
                            <div className="info-row">
                                <span className="label">{t('gps.coordinates', 'Coordinates')}:</span>
                                <span className="value coordinates">
                                    {data.coordinates.lat.toFixed(6)}, {data.coordinates.lng.toFixed(6)}
                                </span>
                            </div>
                        )}

                        {data.eventDetails && (
                            <div className="info-row">
                                <span className="label">{t('gps.details', 'Details')}:</span>
                                <span className="value">{data.eventDetails}</span>
                            </div>
                        )}

                        {data.altitude && (
                            <div className="info-row">
                                <span className="label">{t('gps.altitude', 'Altitude')}:</span>
                                <span className="value">{data.altitude}m</span>
                            </div>
                        )}

                        {data.satellites && (
                            <div className="info-row">
                                <span className="label">{t('gps.satellites', 'Satellites')}:</span>
                                <span className="value">{data.satellites}</span>
                            </div>
                        )}
                    </div>

                    {onClick && (
                        <div className="popup-actions">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => onClick(data)}
                            >
                                {t('gps.viewDetails', 'View Details')}
                            </button>
                        </div>
                    )}
                </div>
            </Popup>
        </Marker>
    );
};

export default RouteMarker;