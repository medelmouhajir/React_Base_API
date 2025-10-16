// ModernVehicleMarker.jsx - Enhanced vehicle marker with i18n and mobile support
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import L from 'leaflet';
import './ModernVehicleMarker.css';

const ModernVehicleMarker = ({
    vehicle,
    isSelected = false,
    isMobile = false,
    onClick,
    onLocate,
    onViewDetails,
    onTrackRoute,
    showDetails = true,
    showTooltip = true,
    ...props
}) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const markerRef = useRef(null);
    const { t, i18n } = useTranslation();

    // Vehicle status calculation
    const vehicleStatus = useMemo(() => {
        if (!vehicle.isOnline) return { status: 'offline', color: '#EF4444' };
        if (vehicle.isMoving) return { status: 'moving', color: '#22C55E' };
        if (vehicle.speed > 0) return { status: 'moving', color: '#22C55E' };
        return { status: 'idle', color: '#F59E0B' };
    }, [vehicle.isOnline, vehicle.isMoving, vehicle.speed]);

    // Create custom marker icon with SVG
    const markerIcon = useMemo(() => {
        const size = isMobile ? 32 : 40;
        const statusColor = vehicleStatus.color;

        // Vehicle icon based on type
        const getVehicleIcon = () => {
            switch (vehicle.type?.toLowerCase()) {
                case 'truck':
                case 'camion':
                    return `
                        <path d="M3 7h3v2H3V7zm14 0h3v2h-3V7zM5 10v4h2v-2h10v2h2v-4H5z" fill="currentColor"/>
                        <rect x="7" y="6" width="10" height="3" fill="currentColor"/>
                    `;
                case 'bus':
                case 'autobus':
                    return `
                        <path d="M4 7h16v8H4V7zm2 2v4h12V9H6z" fill="currentColor"/>
                        <circle cx="8" cy="17" r="1.5" fill="currentColor"/>
                        <circle cx="16" cy="17" r="1.5" fill="currentColor"/>
                    `;
                case 'motorcycle':
                case 'moto':
                    return `
                        <circle cx="7" cy="16" r="3" fill="currentColor"/>
                        <circle cx="17" cy="16" r="3" fill="currentColor"/>
                        <path d="M10 8h4l-1 4h-2l-1-4z" fill="currentColor"/>
                    `;
                default: // car/voiture
                    return `
                        <path d="M5 11l1.5-4.5h11L19 11v8h-2v-2H7v2H5v-8z" fill="currentColor"/>
                        <circle cx="8.5" cy="15.5" r="1.5" fill="white"/>
                        <circle cx="15.5" cy="15.5" r="1.5" fill="white"/>
                    `;
            }
        };

        const svgIcon = `
            <svg width="${size}" height="${size}" viewBox="0 0 48 48" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
                <!-- Background circle -->
                <circle cx="24" cy="24" r="20" fill="${statusColor}" stroke="white" stroke-width="2"/>
                
                <!-- Vehicle icon -->
                <g transform="translate(12, 12) scale(1)" fill="white">
                    ${getVehicleIcon()}
                </g>
                
                <!-- Selection ring animation -->
                ${isSelected ? `
                <circle cx="24" cy="24" r="22" fill="none" stroke="${statusColor}" stroke-width="2" stroke-dasharray="4 4" opacity="0.8">
                    <animateTransform attributeName="transform" attributeType="XML" type="rotate" 
                        from="0 24 24" to="360 24 24" dur="3s" repeatCount="indefinite"/>
                </circle>
                ` : ''}
                
                <!-- Moving indicator -->
                ${vehicle.isMoving || vehicle.speed > 0 ? `
                <circle cx="24" cy="24" r="24" fill="none" stroke="${statusColor}" stroke-width="1" opacity="0.6">
                    <animate attributeName="r" values="20;28;20" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                </circle>
                ` : ''}
            </svg>
        `;

        return new L.DivIcon({
            html: svgIcon,
            className: `modern-vehicle-marker ${vehicle.isMoving || vehicle.speed > 0 ? 'moving' : ''} ${isSelected ? 'selected' : ''} status-${vehicleStatus.status}`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    }, [vehicle, isSelected, isMobile, vehicleStatus]);

    // Format functions with i18n support
    const formatSpeed = useCallback((speed) => {
        if (!speed || speed === 0) return t('gps.modern.marker.noSpeed', '0 km/h');
        return t('gps.modern.marker.speed', '{{speed}} km/h', { speed: Math.round(speed) });
    }, [t]);

    const formatLastUpdate = useCallback((lastUpdate) => {
        if (!lastUpdate) return t('gps.modern.marker.noData', 'No data');

        const diff = Math.floor((new Date() - new Date(lastUpdate)) / 1000);

        if (diff < 60) return t('gps.modern.marker.justNow', 'Just now');
        if (diff < 3600) {
            const minutes = Math.floor(diff / 60);
            return t('gps.modern.marker.minutesAgo', '{{minutes}}m ago', { minutes });
        }
        const hours = Math.floor(diff / 3600);
        return t('gps.modern.marker.hoursAgo', '{{hours}}h ago', { hours });
    }, [t]);

    const formatDistance = useCallback((distance) => {
        if (!distance || distance === 0) return t('gps.modern.marker.noDistance', '0 km');
        if (distance < 1) {
            return t('gps.modern.marker.meters', '{{meters}}m', { meters: Math.round(distance * 1000) });
        }
        return t('gps.modern.marker.kilometers', '{{km}} km', { km: distance.toFixed(1) });
    }, [t]);

    const getStatusText = useCallback(() => {
        switch (vehicleStatus.status) {
            case 'moving':
                return t('gps.modern.marker.status.moving', 'Moving');
            case 'idle':
                return t('gps.modern.marker.status.idle', 'Idle');
            case 'offline':
                return t('gps.modern.marker.status.offline', 'Offline');
            default:
                return t('gps.modern.marker.status.online', 'Online');
        }
    }, [vehicleStatus.status, t]);

    const getDriverName = useCallback(() => {
        return vehicle.driverName ||
            vehicle.driver ||
            t('gps.modern.marker.unknownDriver', 'Unknown Driver');
    }, [vehicle.driverName, vehicle.driver, t]);

    const getLocationAddress = useCallback(() => {
        return vehicle.lastLocation?.address ||
            vehicle.lastRecord?.address ||
            vehicle.address ||
            t('gps.modern.marker.unknownLocation', 'Unknown location');
    }, [vehicle, t]);

    // Handle click events
    const handleMarkerClick = useCallback((e) => {
        if (markerRef.current && showDetails) {
            markerRef.current.openPopup();
            setIsPopupOpen(true);
        }
        onClick?.(vehicle);
        // Prevent event propagation to avoid closing popup immediately
        e.originalEvent?.stopPropagation();
    }, [onClick, vehicle, showDetails]);

    // Handle popup close
    const handlePopupClose = useCallback(() => {
        setIsPopupOpen(false);
    }, []);

    // Effect to handle selected state
    useEffect(() => {
        if (isSelected && markerRef.current && showDetails) {
            markerRef.current.openPopup();
            setIsPopupOpen(true);
        } else if (!isSelected && markerRef.current) {
            markerRef.current.closePopup();
            setIsPopupOpen(false);
        }
    }, [isSelected, showDetails]);

    // Close popup when clicking outside (map click handler)
    useEffect(() => {
        const handleMapClick = () => {
            if (isPopupOpen && markerRef.current) {
                markerRef.current.closePopup();
                setIsPopupOpen(false);
            }
        };

        // Listen for map clicks to close popup
        if (isPopupOpen && markerRef.current) {
            const map = markerRef.current._map;
            if (map) {
                map.on('click', handleMapClick);
                return () => {
                    map.off('click', handleMapClick);
                };
            }
        }
    }, [isPopupOpen]);

    const handleLocateClick = useCallback((e) => {
        e.stopPropagation();
        onLocate?.(vehicle);
    }, [onLocate, vehicle]);

    const handleDetailsClick = useCallback((e) => {
        e.stopPropagation();
        onViewDetails?.(vehicle);
    }, [onViewDetails, vehicle]);

    const handleTrackClick = useCallback((e) => {
        e.stopPropagation();
        onTrackRoute?.(vehicle);
    }, [onTrackRoute, vehicle]);

    // Get position from vehicle data
    const position = useMemo(() => {
        const lat = vehicle.lastLocation?.latitude || vehicle.latitude;
        const lng = vehicle.lastLocation?.longitude || vehicle.longitude;
        return lat && lng ? [lat, lng] : null;
    }, [vehicle]);

    // Don't render if no position
    if (!position) {
        return null;
    }

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={markerIcon}
            eventHandlers={{
                click: handleMarkerClick,
                mouseover: () => {
                    if (!isMobile && showTooltip) {
                        // Show tooltip on hover for desktop
                    }
                }
            }}
            {...props}
        >
            {/* Tooltip for quick info on desktop */}
            {showTooltip && !isMobile && (
                <Tooltip
                    direction="top"
                    offset={[0, -20]}
                    opacity={0.9}
                    permanent={false}
                    className="modern-vehicle-tooltip"
                >
                    <div style={{ textAlign: 'center' }}>
                        <strong>{vehicle.plateNumber || vehicle.name || t('gps.modern.marker.unknownVehicle', 'Unknown Vehicle')}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: '#888' }}>
                            {getStatusText()} • {formatSpeed(vehicle.speed || vehicle.speedKmh)}
                        </span>
                    </div>
                </Tooltip>
            )}

            {/* Main popup - always available but controlled by state */}
            {showDetails && (
                <Popup
                    className="vehicle-popup"
                    closeButton={true}
                    autoClose={false}
                    closeOnEscapeKey={true}
                    closeOnClick={false}
                    maxWidth={isMobile ? 300 : 320}
                    minWidth={isMobile ? 260 : 280}
                    autoPan={true}
                    autoPanPadding={[50, 50]}
                    keepInView={true}
                    eventHandlers={{
                        close: handlePopupClose
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Header */}
                        <div className="popup-header">
                            <h3 className="popup-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 11l1.5-4.5h11L19 11v8h-2v-2H7v2H5v-8z" fill="currentColor" />
                                    <circle cx="8.5" cy="15.5" r="1.5" fill="white" />
                                    <circle cx="15.5" cy="15.5" r="1.5" fill="white" />
                                </svg>
                                {vehicle.plateNumber || vehicle.name || t('gps.modern.marker.unknownVehicle', 'Unknown Vehicle')}
                            </h3>
                            <div className={`popup-status ${vehicleStatus.status}`}>
                                <div className="status-dot"></div>
                                {getStatusText()}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="popup-content">
                            {/* Stats Grid */}
                            <div className="popup-stats">
                                <div className="stat-item">
                                    <div className="stat-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">{t('gps.modern.marker.speed', 'Speed')}</span>
                                        <span className="stat-value">{formatSpeed(vehicle.speed || vehicle.speedKmh)}</span>
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
                                        <span className="stat-label">{t('gps.modern.marker.lastUpdate', 'Last Update')}</span>
                                        <span className="stat-value">{formatLastUpdate(vehicle.lastUpdate || vehicle.lastRecord?.timestamp)}</span>
                                    </div>
                                </div>

                                {(vehicle.totalDistance || vehicle.dailyDistance) && (
                                    <div className="stat-item">
                                        <div className="stat-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 11H1l8-8 8 8h-8l4 4-4 4z" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-label">{t('gps.modern.marker.distance', 'Distance')}</span>
                                            <span className="stat-value">{formatDistance(vehicle.totalDistance || vehicle.dailyDistance)}</span>
                                        </div>
                                    </div>
                                )}

                                {vehicle.fuelLevel && (
                                    <div className="stat-item">
                                        <div className="stat-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-label">{t('gps.modern.marker.fuel', 'Fuel')}</span>
                                            <span className="stat-value">{Math.round(vehicle.fuelLevel)}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Info */}
                            <div className="popup-info">
                                <div className="info-row">
                                    <svg className="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    <span className="info-text">{t('gps.modern.marker.driver', 'Driver')}</span>
                                    <span className="info-value">{getDriverName()}</span>
                                </div>

                                <div className="info-row">
                                    <svg className="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    <span className="info-text" title={getLocationAddress()}>
                                        {getLocationAddress().length > 30
                                            ? `${getLocationAddress().substring(0, 30)}...`
                                            : getLocationAddress()
                                        }
                                    </span>
                                </div>

                                {vehicle.engineStatus && (
                                    <div className="info-row">
                                        <svg className="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                        <span className="info-text">{t('gps.modern.marker.engine', 'Engine')}</span>
                                        <span className="info-value">
                                            {vehicle.engineStatus === 'on' || vehicle.engineStatus === true
                                                ? t('gps.modern.marker.engineOn', 'On')
                                                : t('gps.modern.marker.engineOff', 'Off')
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="popup-actions">
                            {onLocate && (
                                <button
                                    className="popup-action-btn"
                                    onClick={handleLocateClick}
                                    aria-label={t('gps.modern.marker.locate', 'Locate vehicle')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor" />
                                        <circle cx="12" cy="10" r="3" fill="white" />
                                    </svg>
                                    {t('gps.modern.marker.locate', 'Locate')}
                                </button>
                            )}

                            {onTrackRoute && (
                                <button
                                    className="popup-action-btn"
                                    onClick={handleTrackClick}
                                    aria-label={t('gps.modern.marker.trackRoute', 'Track route')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 11H1l8-8 8 8h-8l4 4-4 4z" fill="currentColor" />
                                    </svg>
                                    {t('gps.modern.marker.track', 'Track')}
                                </button>
                            )}

                            {onViewDetails && (
                                <button
                                    className="popup-action-btn primary"
                                    onClick={handleDetailsClick}
                                    aria-label={t('gps.modern.marker.viewDetails', 'View details')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    {t('gps.modern.marker.details', 'Details')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </Popup>
            )}
        </Marker>
    );
};

export default ModernVehicleMarker;