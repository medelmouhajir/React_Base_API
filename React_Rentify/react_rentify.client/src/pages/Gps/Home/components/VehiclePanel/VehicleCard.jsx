// src/pages/Gps/Home/components/VehiclePanel/VehicleCard.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';


import './VehicleCard.css';

const VehicleCard = ({
    vehicle,
    isSelected,
    onSelect
}) => {
    const { t } = useTranslation();

    // Format last update time
    const getLastUpdateText = (lastUpdate) => {
        if (!lastUpdate) return t('gps.noData', 'No data');

        const now = new Date();
        const updateTime = new Date(lastUpdate);
        const diffMs = now - updateTime;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return t('gps.justNow', 'Just now');
        if (diffMins < 60) return t('gps.minutesAgo', '{{minutes}}m ago', { minutes: diffMins });
        if (diffHours < 24) return t('gps.hoursAgo', '{{hours}}h ago', { hours: diffHours });
        return t('gps.daysAgo', '{{days}}d ago', { days: diffDays });
    };

    // Get status icon and color
    const getStatusInfo = () => {
        if (!vehicle.isOnline) {
            return {
                icon: '⚫',
                color: '#6b7280',
                text: t('gps.status.offline', 'Offline'),
                class: 'offline'
            };
        }

        if (vehicle.isMoving) {
            return {
                icon: '🟢',
                color: '#10b981',
                text: t('gps.status.moving', 'Moving'),
                class: 'moving'
            };
        }

        return {
            icon: '🟡',
            color: '#f59e0b',
            text: t('gps.status.parked', 'Parked'),
            class: 'parked'
        };
    };

    // Get battery status
    const getBatteryInfo = () => {
        const { batteryStatus } = vehicle;

        switch (batteryStatus) {
            case 'good':
                return { icon: '🔋', color: '#10b981', text: t('gps.battery.good', 'Good') };
            case 'low':
                return { icon: '🪫', color: '#f59e0b', text: t('gps.battery.low', 'Low') };
            case 'critical':
                return { icon: '🔋', color: '#ef4444', text: t('gps.battery.critical', 'Critical') };
            default:
                return { icon: '❓', color: '#6b7280', text: t('gps.battery.unknown', 'Unknown') };
        }
    };

    // Get signal strength info
    const getSignalInfo = () => {
        const { signalStrength } = vehicle;

        switch (signalStrength) {
            case 'excellent':
                return { bars: 4, color: '#10b981', text: t('gps.signal.excellent', 'Excellent') };
            case 'good':
                return { bars: 3, color: '#10b981', text: t('gps.signal.good', 'Good') };
            case 'fair':
                return { bars: 2, color: '#f59e0b', text: t('gps.signal.fair', 'Fair') };
            case 'poor':
                return { bars: 1, color: '#ef4444', text: t('gps.signal.poor', 'Poor') };
            default:
                return { bars: 0, color: '#6b7280', text: t('gps.signal.unknown', 'Unknown') };
        }
    };

    const statusInfo = getStatusInfo();
    const batteryInfo = getBatteryInfo();
    const signalInfo = getSignalInfo();

    return (
        <div
            className={`vehicle-card ${isSelected ? 'selected' : ''} ${statusInfo.class}`}
            onClick={onSelect}
        >
            {/* Vehicle Header */}
            <div className="vehicle-header">
                <div className="vehicle-info">
                    <h4 className="vehicle-model">{vehicle.model}</h4>
                    <div className="vehicle-plate">{vehicle.licensePlate}</div>
                </div>

                <div className="status-indicator">
                    <div
                        className="status-dot"
                        style={{ backgroundColor: statusInfo.color }}
                        title={statusInfo.text}
                    ></div>
                </div>
            </div>

            {/* Vehicle Status */}
            <div className="vehicle-status">
                <div className="status-item">
                    <span className="status-icon">{statusInfo.icon}</span>
                    <span className="status-text">{statusInfo.text}</span>
                </div>

                {vehicle.isOnline && (
                    <div className="speed-info">
                        <span className="speed-value">{Math.round(vehicle.lastSpeed || 0)}</span>
                        <span className="speed-unit">km/h</span>
                    </div>
                )}
            </div>

            {/* Vehicle Details */}
            <div className="vehicle-details">

                {/* Location Info */}
                {vehicle.lastLocation && (
                    <div className="detail-item location">
                        <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="detail-text">
                            {vehicle.lastLocation.latitude.toFixed(4)}, {vehicle.lastLocation.longitude.toFixed(4)}
                        </span>
                    </div>
                )}

                {/* Last Update */}
                <div className="detail-item time">
                    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                    </svg>
                    <span className="detail-text">
                        {getLastUpdateText(vehicle.lastUpdate)}
                    </span>
                </div>

                {/* Device Serial */}
                {vehicle.deviceSerialNumber && (
                    <div className="detail-item device">
                        <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M7 15h0M12 15h0M17 15h0" />
                        </svg>
                        <span className="detail-text device-serial">
                            {vehicle.deviceSerialNumber}
                        </span>
                    </div>
                )}
            </div>

            {/* Technical Status */}
            {vehicle.isOnline && (
                <div className="vehicle-technical">

                    {/* Battery Status */}
                    <div className="tech-item battery">
                        <span className="tech-icon">{batteryInfo.icon}</span>
                        <span
                            className="tech-text"
                            style={{ color: batteryInfo.color }}
                        >
                            {batteryInfo.text}
                        </span>
                        {vehicle.batteryVoltage && (
                            <span className="tech-value">
                                {vehicle.batteryVoltage.toFixed(1)}V
                            </span>
                        )}
                    </div>

                    {/* Signal Strength */}
                    <div className="tech-item signal">
                        <div className="signal-bars">
                            {[1, 2, 3, 4].map(bar => (
                                <div
                                    key={bar}
                                    className={`signal-bar ${bar <= signalInfo.bars ? 'active' : ''}`}
                                    style={{
                                        backgroundColor: bar <= signalInfo.bars ? signalInfo.color : '#e5e7eb'
                                    }}
                                ></div>
                            ))}
                        </div>
                        <span
                            className="tech-text"
                            style={{ color: signalInfo.color }}
                            title={signalInfo.text}
                        >
                            {signalInfo.text}
                        </span>
                    </div>

                    {/* Ignition Status */}
                    <div className="tech-item ignition">
                        <span className={`ignition-indicator ${vehicle.ignitionOn ? 'on' : 'off'}`}>
                            {vehicle.ignitionOn ? '🔑' : '🚫'}
                        </span>
                        <span className="tech-text">
                            {vehicle.ignitionOn ?
                                t('gps.ignition.on', 'Engine On') :
                                t('gps.ignition.off', 'Engine Off')
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="vehicle-actions">
                <button
                    className="action-btn primary"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    disabled={isSelected}
                >
                    {isSelected ?
                        t('gps.selected', 'Selected') :
                        t('gps.select', 'Select')
                    }
                </button>

                {vehicle.isOnline && (
                    <button
                        className="action-btn secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Handle view route action
                            console.log('View route for vehicle:', vehicle.id);
                        }}
                    >
                        {t('gps.viewRoute', 'View Route')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VehicleCard;