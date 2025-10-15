import React, { useMemo, useState } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';

const ModernVehicleMarker = ({
    vehicle,
    isSelected = false,
    onClick,
    isMobile = false,
    showDetails = true,
    showTooltip = true
}) => {
    const [showPopup, setShowPopup] = useState(false);

    // Create custom marker icon based on vehicle status
    const markerIcon = useMemo(() => {
        const getStatusColor = () => {
            if (!vehicle.isOnline) return '#6B7280'; // Gray
            if (vehicle.isMoving) return '#3B82F6'; // Blue
            return '#F59E0B'; // Orange for idle
        };

        const getIconRotation = () => {
            if (vehicle.isMoving && vehicle.heading) {
                return vehicle.heading;
            }
            return 0;
        };

        const statusColor = getStatusColor();
        const rotation = getIconRotation();
        const size = isSelected ? 48 : 36;
        const pulse = vehicle.isMoving;

        // Create SVG icon
        const svgIcon = `
            <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feMorphology operator="dilate" radius="2"/>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/> 
                        </feMerge>
                    </filter>
                    ${pulse ? `
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                    ` : ''}
                </defs>
                
                <!-- Outer glow circle -->
                <circle cx="24" cy="24" r="20" fill="${statusColor}" opacity="0.2" filter="url(#glow)"/>
                
                <!-- Main circle -->
                <circle cx="24" cy="24" r="16" fill="${statusColor}" stroke="white" stroke-width="3"/>
                
                <!-- Vehicle icon -->
                <g transform="translate(24,24) rotate(${rotation}) translate(-8,-6)">
                    <rect x="2" y="4" width="12" height="6" rx="1" fill="white" opacity="0.9"/>
                    <circle cx="5" cy="8" r="1.5" fill="#374151"/>
                    <circle cx="11" cy="8" r="1.5" fill="#374151"/>
                    <rect x="3" y="2" width="10" height="3" rx="0.5" fill="white" opacity="0.7"/>
                </g>
                
                <!-- Status indicator -->
                <circle cx="36" cy="12" r="6" fill="${vehicle.hasAlerts ? '#EF4444' : statusColor}" stroke="white" stroke-width="2"/>
                
                <!-- Selection ring -->
                ${isSelected ? `
                <circle cx="24" cy="24" r="22" fill="none" stroke="${statusColor}" stroke-width="2" stroke-dasharray="4 4" opacity="0.8">
                    <animateTransform attributeName="transform" attributeType="XML" type="rotate" 
                        from="0 24 24" to="360 24 24" dur="3s" repeatCount="indefinite"/>
                </circle>
                ` : ''}
            </svg>
        `;

        return new L.DivIcon({
            html: svgIcon,
            className: `modern-vehicle-marker ${vehicle.isMoving ? 'moving' : ''} ${isSelected ? 'selected' : ''}`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    }, [vehicle, isSelected, isMobile]);

    // Format vehicle info for display
    const formatSpeed = (speed) => speed ? `${Math.round(speed)} km/h` : '0 km/h';

    const formatLastUpdate = (lastUpdate) => {
        if (!lastUpdate) return 'No data';
        const diff = Math.floor((new Date() - new Date(lastUpdate)) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const getStatusText = () => {
        if (!vehicle.isOnline) return 'Offline';
        if (vehicle.isMoving) return 'Moving';
        return 'Idle';
    };

    const position = [vehicle.lastLocation?.latitude, vehicle.lastLocation?.longitude];

    if (!position[0] || !position[1]) {
        return null;
    }

    console.warn(position);

    return (
        <Marker
            position={position}
            icon={markerIcon}
            eventHandlers={{
                click: () => onClick?.(vehicle),
                mouseover: () => {
                    if (!isMobile && showTooltip) {
                        setShowPopup(true);
                    }
                },
                mouseout: () => {
                    if (!isMobile) {
                        setShowPopup(false);
                    }
                }
            }}
        >
            {/* Tooltip for quick info */}
            {showTooltip && !isMobile && (
                <Tooltip
                    direction="top"
                    offset={[0, -20]}
                    opacity={0.9}
                    permanent={false}
                    className="modern-vehicle-tooltip"
                >
                    <div className="tooltip-content">
                        <div className="tooltip-header">
                            <strong>{vehicle.plateNumber || vehicle.deviceSerialNumber}</strong>
                            <span className={`status-badge ${getStatusText().toLowerCase()}`}>
                                {getStatusText()}
                            </span>
                        </div>
                        <div className="tooltip-details">
                            <div className="detail-item">
                                <span className="label">Speed:</span>
                                <span className="value">{formatSpeed(vehicle.speed)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Driver:</span>
                                <span className="value">{vehicle.driverName || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </Tooltip>
            )}

            {/* Detailed popup for mobile or when clicked */}
            {showDetails && (isMobile || isSelected) && (
                <Popup
                    closeButton={true}
                    autoClose={!isSelected}
                    className="modern-vehicle-popup"
                    maxWidth={isMobile ? 280 : 320}
                >
                    <div className="popup-content">
                        {/* Popup Header */}
                        <div className="popup-header">
                            <div className="vehicle-info">
                                <div className="vehicle-avatar">
                                    <svg width="24" height="24" viewBox="0 0 24 16" fill="none">
                                        <rect x="2" y="6" width="20" height="8" rx="2" fill="currentColor" opacity="0.8" />
                                        <circle cx="6" cy="12" r="2" fill="#374151" />
                                        <circle cx="18" cy="12" r="2" fill="#374151" />
                                        <rect x="4" y="4" width="16" height="4" rx="1" fill="currentColor" />
                                    </svg>
                                </div>
                                <div className="vehicle-details">
                                    <h3>{vehicle.plateNumber || vehicle.deviceSerialNumber}</h3>
                                    <p>{vehicle.driverName || 'Unknown Driver'}</p>
                                </div>
                            </div>
                            <div className={`status-indicator ${getStatusText().toLowerCase()}`}>
                                <div className="status-dot"></div>
                                <span>{getStatusText()}</span>
                            </div>
                        </div>

                        {/* Vehicle Stats */}
                        <div className="popup-stats">
                            <div className="stat-item">
                                <div className="stat-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L13.09 8.26L22 9l-6.74 5.74L17 21l-5-2.65L7 21l1.74-6.26L2 9l8.91-1.74L12 2z" fill="currentColor" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Speed</span>
                                    <span className="stat-value">{formatSpeed(vehicle.speed)}</span>
                                </div>
                            </div>

                            <div className="stat-item">
                                <div className="stat-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Last Update</span>
                                    <span className="stat-value">{formatLastUpdate(vehicle.lastUpdate)}</span>
                                </div>
                            </div>

                            {vehicle.totalDistance && (
                                <div className="stat-item">
                                    <div className="stat-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 11H1l8-8 8 8h-8l4 4-4 4z" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Distance</span>
                                        <span className="stat-value">{(vehicle.totalDistance / 1000).toFixed(1)} km</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Location Info */}
                        {vehicle.lastLocation?.address && (
                            <div className="popup-location">
                                <div className="location-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="12" cy="10" r="3" fill="currentColor" />
                                    </svg>
                                </div>
                                <span className="location-text">
                                    {vehicle.lastLocation.address}
                                </span>
                            </div>
                        )}

                        {/* Alerts */}
                        {vehicle.hasAlerts && (
                            <div className="popup-alerts">
                                <div className="alert-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                                    </svg>
                                    <span>
                                        {vehicle.alertsCount ?
                                            `${vehicle.alertsCount} active alert${vehicle.alertsCount > 1 ? 's' : ''}` :
                                            'Has active alerts'
                                        }
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="popup-actions">
                            <button
                                className="action-btn primary"
                                onClick={() => onClick?.(vehicle)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor" />
                                    <circle cx="12" cy="10" r="3" fill="white" />
                                </svg>
                                Track Vehicle
                            </button>

                            {vehicle.hasAlerts && (
                                <button className="action-btn secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                                    </svg>
                                    View Alerts
                                </button>
                            )}
                        </div>
                    </div>
                </Popup>
            )}
        </Marker>
    );
};

export default ModernVehicleMarker;