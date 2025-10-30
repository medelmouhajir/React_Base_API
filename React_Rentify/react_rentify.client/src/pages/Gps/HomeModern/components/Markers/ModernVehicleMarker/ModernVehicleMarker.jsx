// ModernVehicleMarker.jsx - Enhanced vehicle marker with i18n and mobile support
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
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

    const markerRef = useRef(null);
    const { t } = useTranslation();

    // Vehicle status calculation
    const vehicleStatus = useMemo(() => {
        if (!vehicle.status === 'Available') return { status: 'offline', color: '#EF4444' };
        if (vehicle.status === 'Rented') return { status: 'moving', color: '#22C55E' };
        if (vehicle.status === 'Maintenance') return { status: 'maintenance', color: '#22C55E' };
        return { status: 'idle', color: '#F59E0B' };
    }, [vehicle.status]);

    // Create custom marker icon with SVG
    const markerIcon = useMemo(() => {
        const size = isMobile ? 32 : 40;
        const statusColor = vehicleStatus.color;
        // Meaningful car + status icons
        const getVehicleIcon = () => {
            switch (vehicle.status?.toLowerCase()) {
                case 'available':
                    return `
                <!-- Car Base -->
                <path d="M3 10l1.5-4.5h15L21 10v6h-1.5v-2h-12v2H6v-2H4v2H3v-6z" fill="currentColor"/>
                <circle cx="7" cy="15" r="1.5" fill="white"/>
                <circle cx="17" cy="15" r="1.5" fill="white"/>
                <!-- Check Mark -->
                <path d="M8 6l2 2 4-4" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;

                case 'rented':
                    return `
                <!-- Car Base -->
                <path d="M3 10l1.5-4.5h15L21 10v6h-1.5v-2h-12v2H6v-2H4v2H3v-6z" fill="currentColor"/>
                <circle cx="7" cy="15" r="1.5" fill="white"/>
                <circle cx="17" cy="15" r="1.5" fill="white"/>
                <!-- Lock -->
                <rect x="9.5" y="3" width="5" height="4" rx="1" fill="red"/>
                <path d="M10.5 3v-1a2 2 0 1 1 4 0v1" stroke="red" stroke-width="1.5"/>
            `;

                case 'maintenance':
                    return `
                <!-- Car Base -->
                <path d="M3 10l1.5-4.5h15L21 10v6h-1.5v-2h-12v2H6v-2H4v2H3v-6z" fill="currentColor"/>
                <circle cx="7" cy="15" r="1.5" fill="white"/>
                <circle cx="17" cy="15" r="1.5" fill="white"/>
                <!-- Wrench -->
                <path d="M15 3a3 3 0 1 1-3 3l-5 5 1.5 1.5 5-5a3 3 0 0 1 1.5-4.5z"
                      fill="orange"/>
            `;

                default:
                    return `
                <!-- Car Base -->
                <path d="M3 10l1.5-4.5h15L21 10v6h-1.5v-2h-12v2H6v-2H4v2H3v-6z" fill="gray"/>
                <circle cx="7" cy="15" r="1.5" fill="white"/>
                <circle cx="17" cy="15" r="1.5" fill="white"/>
                <!-- Question Mark -->
                <text x="11" y="7" font-size="6" fill="yellow" font-weight="bold">?</text>
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
            iconAnchor: [size / 2, size / 2]
        });
    }, [vehicle, isSelected, isMobile, vehicleStatus]);

    // Format functions with i18n support
    const formatSpeed = useCallback((speed) => {
        if (!speed || speed === 0) return t('gps.modern.marker.noSpeed', '0 km/h');
        return t('gps.modern.marker.speed', '{{speed}} km/h', { speed: Math.round(speed) });
    }, [t]);


    const getStatusText = useCallback(() => {
        switch (vehicleStatus.status.toLowerCase()) {
            case 'rented':
                return t('car.status.rented', 'Moving');
            case 'available':
                return t('car.status.available', 'Idle');
            case 'maintenance':
                return t('car.status.maintenance', 'Offline');
            default:
                return t('gps.modern.marker.status.online', 'Online');
        }
    }, [vehicleStatus.status, t]);


    const handleMarkerClick = useCallback((e) => {
        onClick?.(vehicle);
    }, [onClick, vehicle]);



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

        </Marker>
    );
};

export default ModernVehicleMarker;