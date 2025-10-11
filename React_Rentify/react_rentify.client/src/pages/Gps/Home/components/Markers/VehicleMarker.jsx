// src/pages/Gps/Home/components/Markers/VehicleMarker.jsx
import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

const VehicleMarker = ({
    vehicle,
    isSelected = false,
    onClick,
    followMode = false,
    showPopup = false
}) => {
    const { t } = useTranslation();
    const { lastLocation } = vehicle;

    if (!lastLocation || isNaN(lastLocation.latitude) || isNaN(lastLocation.longitude)) {
        return null;
    }

    // Create custom vehicle icon based on status
    const vehicleIcon = useMemo(() => {
        const isOnline = vehicle.isOnline;
        const isMoving = vehicle.isMoving;
        const ignitionOn = lastLocation.ignitionOn;

        // Determine color based on vehicle status
        let color = '#6b7280'; // Gray for offline
        if (isOnline) {
            if (isMoving) {
                color = '#10b981'; // Green for moving
            } else if (ignitionOn) {
                color = '#f59e0b'; // Orange for stationary with ignition on
            } else {
                color = '#3b82f6'; // Blue for parked
            }
        }

        // Create icon HTML
        const iconHtml = `
            <div class="vehicle-marker ${isSelected ? 'selected' : ''} ${followMode ? 'following' : ''}">
                <div class="vehicle-icon" style="background-color: ${color};">
                    <svg viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                        <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                        <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0v-6h-8m0 -5h3l3 3" />
                    </svg>
                </div>
                ${isSelected ? `
                    <div class="vehicle-pulse-ring"></div>
                ` : ''}
                <div class="vehicle-label">
                    ${vehicle.licensePlate}
                </div>
            </div>
        `;

        return L.divIcon({
            html: iconHtml,
            className: 'vehicle-marker-container',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    }, [vehicle, isSelected, followMode, lastLocation]);

    // Format last update time
    const formatLastUpdate = (timestamp) => {
        if (!timestamp) return t('common.unknown', 'Unknown');

        const now = new Date();
        const updateTime = new Date(timestamp);
        const diffMinutes = Math.floor((now - updateTime) / 60000);

        if (diffMinutes < 1) {
            return t('gps.justNow', 'Just now');
        } else if (diffMinutes < 60) {
            return t('gps.minutesAgo', '{{minutes}}m ago', { minutes: diffMinutes });
        } else if (diffMinutes < 1440) {
            const hours = Math.floor(diffMinutes / 60);
            return t('gps.hoursAgo', '{{hours}}h ago', { hours });
        } else {
            return updateTime.toLocaleDateString();
        }
    };

    // Get status text and color
    const getStatusInfo = () => {
        if (!vehicle.isOnline) {
            return { text: t('gps.status.offline', 'Offline'), color: '#ef4444' };
        }

        if (vehicle.isMoving) {
            return { text: t('gps.status.moving', 'Moving'), color: '#10b981' };
        }

        if (lastLocation.ignitionOn) {
            return { text: t('gps.status.idling', 'Idling'), color: '#f59e0b' };
        }

        return { text: t('gps.status.parked', 'Parked'), color: '#3b82f6' };
    };

    const statusInfo = getStatusInfo();

    return (
        <Marker
            position={[lastLocation.latitude, lastLocation.longitude]}
            icon={vehicleIcon}
            eventHandlers={{
                click: () => onClick?.(vehicle)
            }}
        >
            <Popup closeOnEscapeKey={true} maxWidth={300}>
                <div className="vehicle-popup">
                    <div className="popup-header">
                        <div className="vehicle-info">
                            <h4 className="vehicle-model">{vehicle.model}</h4>
                            <div className="vehicle-plate">{vehicle.licensePlate}</div>
                        </div>
                        <div className="vehicle-status" style={{ color: statusInfo.color }}>
                            <div className="status-indicator" style={{ backgroundColor: statusInfo.color }}></div>
                            {statusInfo.text}
                        </div>
                    </div>

                    <div className="popup-content">
                        <div className="info-row">
                            <span className="label">{t('gps.speed', 'Speed')}:</span>
                            <span className="value">
                                {lastLocation.speedKmh ? `${lastLocation.speedKmh} km/h` : '0 km/h'}
                            </span>
                        </div>

                        <div className="info-row">
                            <span className="label">{t('gps.direction', 'Direction')}:</span>
                            <span className="value">
                                {lastLocation.course ? `${lastLocation.course}°` : t('common.na', 'N/A')}
                            </span>
                        </div>

                        <div className="info-row">
                            <span className="label">{t('gps.ignition', 'Ignition')}:</span>
                            <span className={`value ${lastLocation.ignitionOn ? 'text-success' : 'text-danger'}`}>
                                {lastLocation.ignitionOn ?
                                    t('common.on', 'ON') :
                                    t('common.off', 'OFF')
                                }
                            </span>
                        </div>

                        {vehicle.deviceSerialNumber && (
                            <div className="info-row">
                                <span className="label">{t('gps.device', 'Device')}:</span>
                                <span className="value device-serial">
                                    {vehicle.deviceSerialNumber}
                                </span>
                            </div>
                        )}

                        <div className="info-row">
                            <span className="label">{t('gps.lastUpdate', 'Last Update')}:</span>
                            <span className="value">
                                {formatLastUpdate(lastLocation.timestamp)}
                            </span>
                        </div>

                        {lastLocation.altitude && (
                            <div className="info-row">
                                <span className="label">{t('gps.altitude', 'Altitude')}:</span>
                                <span className="value">
                                    {lastLocation.altitude}m
                                </span>
                            </div>
                        )}

                        {lastLocation.satellites && (
                            <div className="info-row">
                                <span className="label">{t('gps.satellites', 'Satellites')}:</span>
                                <span className="value">
                                    {lastLocation.satellites}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="popup-actions">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onClick?.(vehicle)}
                        >
                            {t('gps.viewHistory', 'View History')}
                        </button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

export default VehicleMarker;