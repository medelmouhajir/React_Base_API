import React, { useMemo } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';

// Import clustering utility
import { clusterVehicles } from '../../../utils/mapOptimization';
import ModernVehicleMarker from './../ModernVehicleMarker/ModernVehicleMarker';

const VehicleClusterGroup = ({
    vehicles = [],
    selectedVehicle,
    onVehicleClick,
    isMobile = false,
    clusterRadius = 100,
    zoomLevel = 12,
    maxClusterRadius = 80
}) => {
    // Generate clusters based on vehicle positions
    const clusters = useMemo(() => {
        return clusterVehicles(vehicles, clusterRadius, zoomLevel);
    }, [vehicles, clusterRadius, zoomLevel]);

    // Create cluster icon based on cluster properties
    const createClusterIcon = (cluster) => {
        const size = Math.min(maxClusterRadius, 30 + Math.min(cluster.count * 3, 50));
        const { hasMoving, hasAlerts, hasOffline } = cluster;

        // Determine cluster color based on content
        let primaryColor = '#6B7280'; // Gray default
        if (hasAlerts) primaryColor = '#EF4444'; // Red for alerts
        else if (hasMoving) primaryColor = '#3B82F6'; // Blue for moving
        else if (!hasOffline) primaryColor = '#10B981'; // Green if all online

        const svgIcon = `
            <svg width="${size}" height="${size}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="cluster-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feMorphology operator="dilate" radius="1"/>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/> 
                        </feMerge>
                    </filter>
                </defs>
                
                <!-- Outer pulse ring -->
                <circle cx="30" cy="30" r="25" fill="${primaryColor}" opacity="0.2" filter="url(#cluster-glow)">
                    <animate attributeName="r" values="25;30;25" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.2;0.1;0.2" dur="2s" repeatCount="indefinite"/>
                </circle>
                
                <!-- Main cluster circle -->
                <circle cx="30" cy="30" r="20" fill="${primaryColor}" stroke="white" stroke-width="3" opacity="0.9"/>
                
                <!-- Inner content circle -->
                <circle cx="30" cy="30" r="15" fill="white" opacity="0.9"/>
                
                <!-- Count text -->
                <text x="30" y="35" text-anchor="middle" fill="${primaryColor}" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
                    ${cluster.count}
                </text>
                
                <!-- Status indicators -->
                ${hasAlerts ? `
                <circle cx="45" cy="15" r="5" fill="#EF4444" stroke="white" stroke-width="1">
                    <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
                </circle>
                ` : ''}
                
                ${hasMoving ? `
                <circle cx="15" cy="45" r="4" fill="#3B82F6" stroke="white" stroke-width="1">
                    <animateTransform attributeName="transform" type="rotate" values="0 15 45;360 15 45" dur="3s" repeatCount="indefinite"/>
                </circle>
                ` : ''}
            </svg>
        `;

        return new L.DivIcon({
            html: svgIcon,
            className: 'modern-cluster-marker',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    };

    // Get cluster status summary
    const getClusterStatusSummary = (cluster) => {
        const { vehicles } = cluster;
        const online = vehicles.filter(v => v.isOnline).length;
        const moving = vehicles.filter(v => v.isMoving).length;
        const alerts = vehicles.filter(v => v.hasAlerts).length;

        return { online, moving, alerts, offline: vehicles.length - online };
    };

    return (
        <>
            {clusters.map((item, index) => {
                if (item.type === 'cluster') {
                    const statusSummary = getClusterStatusSummary(item);

                    return (
                        <CircleMarker
                            key={`cluster-${item.id}`}
                            center={item.position}
                            icon={createClusterIcon(item)}
                            eventHandlers={{
                                click: () => {
                                    // On cluster click, you might want to zoom in or show cluster details
                                    console.log('Cluster clicked:', item);
                                }
                            }}
                        >
                            <Popup
                                className="modern-cluster-popup"
                                maxWidth={isMobile ? 280 : 350}
                            >
                                <div className="cluster-popup-content">
                                    {/* Cluster Header */}
                                    <div className="cluster-header">
                                        <div className="cluster-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path d="M9 9l6 0M12 9l0 6" stroke="currentColor" strokeWidth="1" />
                                            </svg>
                                        </div>
                                        <div className="cluster-info">
                                            <h3>Vehicle Cluster</h3>
                                            <p>{item.count} vehicles in this area</p>
                                        </div>
                                    </div>

                                    {/* Status Summary */}
                                    <div className="cluster-status-summary">
                                        <div className="status-grid">
                                            <div className="status-item online">
                                                <div className="status-dot"></div>
                                                <span className="status-count">{statusSummary.online}</span>
                                                <span className="status-label">Online</span>
                                            </div>
                                            <div className="status-item moving">
                                                <div className="status-dot"></div>
                                                <span className="status-count">{statusSummary.moving}</span>
                                                <span className="status-label">Moving</span>
                                            </div>
                                            <div className="status-item alerts">
                                                <div className="status-dot"></div>
                                                <span className="status-count">{statusSummary.alerts}</span>
                                                <span className="status-label">Alerts</span>
                                            </div>
                                            <div className="status-item offline">
                                                <div className="status-dot"></div>
                                                <span className="status-count">{statusSummary.offline}</span>
                                                <span className="status-label">Offline</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vehicle List Preview */}
                                    <div className="cluster-vehicles-preview">
                                        <h4>Vehicles in this cluster:</h4>
                                        <div className="vehicles-list">
                                            {item.vehicles.slice(0, 5).map((vehicle) => (
                                                <div
                                                    key={vehicle.id}
                                                    className="vehicle-preview-item"
                                                    onClick={() => onVehicleClick?.(vehicle)}
                                                >
                                                    <div className="vehicle-avatar-small">
                                                        <svg width="16" height="16" viewBox="0 0 24 16" fill="none">
                                                            <rect x="2" y="6" width="20" height="8" rx="2" fill="currentColor" opacity="0.8" />
                                                            <circle cx="6" cy="12" r="2" fill="#374151" />
                                                            <circle cx="18" cy="12" r="2" fill="#374151" />
                                                        </svg>
                                                    </div>
                                                    <div className="vehicle-info-small">
                                                        <span className="vehicle-plate">
                                                            {vehicle.plateNumber || vehicle.deviceSerialNumber}
                                                        </span>
                                                        <span className={`vehicle-status ${vehicle.isOnline ? (vehicle.isMoving ? 'moving' : 'idle') : 'offline'}`}>
                                                            {vehicle.isOnline ? (vehicle.isMoving ? 'Moving' : 'Idle') : 'Offline'}
                                                        </span>
                                                    </div>
                                                    {vehicle.hasAlerts && (
                                                        <div className="alert-indicator">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {item.vehicles.length > 5 && (
                                                <div className="vehicles-more">
                                                    +{item.vehicles.length - 5} more vehicles
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="cluster-actions">
                                        <button
                                            className="action-btn primary"
                                            onClick={() => {
                                                // Zoom to fit all vehicles in cluster
                                                console.log('Zoom to cluster vehicles');
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                                                <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            Zoom to Vehicles
                                        </button>

                                        <button
                                            className="action-btn secondary"
                                            onClick={() => {
                                                // Show all vehicles individually
                                                console.log('Show individual vehicles');
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                                            </svg>
                                            Show Individual
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                } else {
                    // Individual vehicle marker
                    return (
                        <ModernVehicleMarker
                            key={`vehicle-${item.id}`}
                            vehicle={item}
                            isSelected={selectedVehicle?.id === item.id}
                            onClick={onVehicleClick}
                            isMobile={isMobile}
                            showDetails={true}
                            showTooltip={!isMobile}
                        />
                    );
                }
            })}
        </>
    );
};

export default VehicleClusterGroup;