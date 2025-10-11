// src/pages/Gps/Home/components/MapContainer/MapControls.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const MapControls = ({
    onToggleFollow,
    onCenterAll,
    onCenterRoute,
    onToggleTileLayer,
    followVehicle,
    hasRoute,
    hasVehicles,
    selectedVehicle,
    isMobile,
    mapMode,
    onMapModeChange
}) => {
    const { t } = useTranslation();

    return (
        <div className={`map-controls ${isMobile ? 'mobile' : ''}`}>

            {/* Primary Controls */}
            <div className="map-controls-group primary">

                {/* Follow Vehicle Toggle */}
                {selectedVehicle?.lastLocation && (
                    <button
                        className={`map-control-btn follow-btn ${followVehicle ? 'active' : ''}`}
                        onClick={onToggleFollow}
                        title={followVehicle ?
                            t('gps.map.stopFollowing', 'Stop Following') :
                            t('gps.map.followVehicle', 'Follow Vehicle')
                        }
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        {!isMobile && (
                            <span className="control-label">
                                {followVehicle ? t('common.following', 'Following') : t('common.follow', 'Follow')}
                            </span>
                        )}
                    </button>
                )}

                {/* Center All Vehicles */}
                {hasVehicles && (
                    <button
                        className="map-control-btn center-all-btn"
                        onClick={onCenterAll}
                        title={t('gps.map.centerAllVehicles', 'Center All Vehicles')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        {!isMobile && <span className="control-label">{t('gps.map.allVehicles', 'All Vehicles')}</span>}
                    </button>
                )}

                {/* Center Route */}
                {hasRoute && (
                    <button
                        className="map-control-btn center-route-btn"
                        onClick={onCenterRoute}
                        title={t('gps.map.centerRoute', 'Center Route')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 5.16-1 9-5.45 9-11V7l-10-5z" />
                            <path d="M8 11l2 2 4-4" />
                        </svg>
                        {!isMobile && <span className="control-label">{t('gps.map.fitRoute', 'Fit Route')}</span>}
                    </button>
                )}
            </div>

            {/* View Mode Toggle */}
            <div className="map-controls-group mode-toggle">
                <button
                    className={`map-control-btn mode-btn ${mapMode === 'vehicles' ? 'active' : ''}`}
                    onClick={() => onMapModeChange('vehicles')}
                    title={t('gps.map.vehiclesView', 'Vehicles View')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                        <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                        <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0v-6h-8m0 -5h3l3 3" />
                    </svg>
                    {!isMobile && <span className="control-label">{t('gps.vehicles', 'Vehicles')}</span>}
                </button>

                {hasRoute && (
                    <button
                        className={`map-control-btn mode-btn ${mapMode === 'route' ? 'active' : ''}`}
                        onClick={() => onMapModeChange('route')}
                        title={t('gps.map.routeView', 'Route View')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.29,7 12,12 20.71,7" />
                            <line x1="12" y1="22" x2="12" y2="12" />
                        </svg>
                        {!isMobile && <span className="control-label">{t('gps.route', 'Route')}</span>}
                    </button>
                )}
            </div>

            {/* Secondary Controls */}
            <div className="map-controls-group secondary">

                {/* Tile Layer Toggle */}
                <button
                    className="map-control-btn tile-layer-btn"
                    onClick={onToggleTileLayer}
                    title={t('gps.map.changeMapLayer', 'Change Map Layer')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <rect x="7" y="7" width="3" height="3" />
                        <rect x="14" y="7" width="3" height="3" />
                        <rect x="7" y="14" width="3" height="3" />
                        <rect x="14" y="14" width="3" height="3" />
                    </svg>
                    {!isMobile && <span className="control-label">{t('gps.map.layers', 'Layers')}</span>}
                </button>

                {/* Zoom Controls (Mobile) */}
                {isMobile && (
                    <>
                        <button
                            className="map-control-btn zoom-btn zoom-in"
                            onClick={() => {
                                // This would be handled by parent component with map reference
                                console.log('Zoom in clicked');
                            }}
                            title={t('gps.map.zoomIn', 'Zoom In')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>

                        <button
                            className="map-control-btn zoom-btn zoom-out"
                            onClick={() => {
                                // This would be handled by parent component with map reference
                                console.log('Zoom out clicked');
                            }}
                            title={t('gps.map.zoomOut', 'Zoom Out')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Location/GPS Button */}
                <button
                    className="map-control-btn location-btn"
                    onClick={() => {
                        if ('geolocation' in navigator) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    // Handle user location - would need to be passed to parent
                                    console.log('User location:', position.coords);
                                },
                                (error) => {
                                    console.error('Geolocation error:', error);
                                }
                            );
                        }
                    }}
                    title={t('gps.map.myLocation', 'My Location')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    {!isMobile && <span className="control-label">{t('gps.map.myLocation', 'My Location')}</span>}
                </button>
            </div>

            {/* Real-time Status Indicator */}
            <div className="map-controls-group status">
                <div className="realtime-status">
                    <div className="status-indicator online"></div>
                    {!isMobile && (
                        <span className="status-text">
                            {t('gps.status.realtime', 'Real-time')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapControls;