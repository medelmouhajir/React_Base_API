// =============================================================================
// FLOATING CONTROLS COMPONENT - Map controls (zoom, location, etc.)
// =============================================================================
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { locationService } from '../../services/locationService';
import './FloatingControls.css';

const FloatingControls = ({
    position = 'bottom-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    className = '',
    onZoomIn = () => { },
    onZoomOut = () => { },
    onCurrentLocation = () => { },
    onToggleFullscreen = () => { },
    onToggleLayer = () => { },
    onCompass = () => { },
    showZoomControls = true,
    showLocationButton = true,
    showFullscreenButton = true,
    showLayerButton = true,
    showCompassButton = false,
    showTiltControls = false,
    currentZoom = 12,
    maxZoom = 18,
    minZoom = 2,
    isFullscreen = false,
    currentLayer = 'openStreetMap',
    availableLayers = ['openStreetMap', 'satellite', 'hybrid'],
    compact = false,
    disabled = false
}) => {
    const { t } = useTranslation();
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [compassHeading, setCompassHeading] = useState(0);
    const [tilt, setTilt] = useState(0);

    const layerMenuRef = useRef(null);
    const compassRef = useRef(null);

    // Layer configurations
    const layerConfigs = {
        openStreetMap: {
            name: t('layers.openStreetMap', 'Street Map'),
            icon: '🗺️',
            description: t('layers.openStreetMapDesc', 'Standard street map view')
        },
        satellite: {
            name: t('layers.satellite', 'Satellite'),
            icon: '🛰️',
            description: t('layers.satelliteDesc', 'Satellite imagery view')
        },
        hybrid: {
            name: t('layers.hybrid', 'Hybrid'),
            icon: '🌍',
            description: t('layers.hybridDesc', 'Satellite with street labels')
        },
        terrain: {
            name: t('layers.terrain', 'Terrain'),
            icon: '⛰️',
            description: t('layers.terrainDesc', 'Topographic terrain view')
        }
    };
    // First try with high accuracy, then fallback
    const getCurrentLocationWithFallback = async () => {
        try {
            // First attempt with high accuracy but shorter timeout
            return await locationService.getCurrentLocation({
                enableHighAccuracy: true,
                timeout: 30000, // Reduced from 30000 to 10000
                maximumAge: 300000
            });
        } catch (error) {
            console.warn('High accuracy location failed, trying fallback:', error.message);
            try {
                // Fallback with lower accuracy but faster response
                return await locationService.getCurrentLocation({
                    enableHighAccuracy: false,
                    timeout: 30000, // Reduced timeout
                    maximumAge: 600000 // Accept older cached location
                });
            } catch (fallbackError) {
                console.warn('Fallback location failed, trying browser default:', fallbackError.message);
                // Last resort - basic browser geolocation
                return new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            resolve({
                                success: true,
                                location: {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude,
                                    accuracy: position.coords.accuracy
                                },
                                fromCache: false
                            });
                        },
                        (error) => {
                            resolve({
                                success: false,
                                error: error.message,
                                fallbackUsed: false
                            });
                        },
                        { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
                    );
                });
            }
        }
    };

    // Handle current location
    // In FloatingControls.jsx - replace the entire handleCurrentLocation function with:
    const handleCurrentLocation = useCallback(async () => {
        if (gettingLocation || disabled) return;

        setGettingLocation(true);
        setLocationError(null);

        try {
            // Just call the parent's handler which will handle getting location AND flying to it
            await onCurrentLocation();
            setLocationError(null);
        } catch (error) {
            setLocationError('Failed to get location');
            console.error('Location error:', error);
        } finally {
            setGettingLocation(false);
        }
    }, [gettingLocation, disabled, onCurrentLocation]);

    // Handle zoom controls
    const handleZoomIn = useCallback(() => {
        if (disabled || currentZoom >= maxZoom) return;
        onZoomIn();
    }, [disabled, currentZoom, maxZoom, onZoomIn]);

    const handleZoomOut = useCallback(() => {
        if (disabled || currentZoom <= minZoom) return;
        onZoomOut();
    }, [disabled, currentZoom, minZoom, onZoomOut]);

    // Handle fullscreen toggle
    const handleFullscreen = useCallback(() => {
        if (disabled) return;
        onToggleFullscreen();
    }, [disabled, onToggleFullscreen]);

    // Handle layer selection
    const handleLayerSelect = useCallback((layerType) => {
        setShowLayerMenu(false);
        if (layerType !== currentLayer) {
            onToggleLayer(layerType);
        }
    }, [currentLayer, onToggleLayer]);

    // Handle compass
    const handleCompass = useCallback(() => {
        if (disabled) return;
        setCompassHeading(0);
        setTilt(0);
        onCompass();
    }, [disabled, onCompass]);

    // Handle tilt controls
    const handleTiltUp = useCallback(() => {
        if (disabled) return;
        const newTilt = Math.min(tilt + 15, 60);
        setTilt(newTilt);
    }, [disabled, tilt]);

    const handleTiltDown = useCallback(() => {
        if (disabled) return;
        const newTilt = Math.max(tilt - 15, 0);
        setTilt(newTilt);
    }, [disabled, tilt]);

    // Close layer menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (layerMenuRef.current && !layerMenuRef.current.contains(event.target)) {
                setShowLayerMenu(false);
            }
        };

        if (showLayerMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showLayerMenu]);

    // Compass orientation (if device supports it)
    useEffect(() => {
        if (!showCompassButton) return;

        const handleOrientation = (event) => {
            if (event.alpha !== null) {
                setCompassHeading(event.alpha);
            }
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
            return () => window.removeEventListener('deviceorientation', handleOrientation);
        }
    }, [showCompassButton]);

    return (
        <div className={`floating-controls ${className} floating-controls--${position} ${compact ? 'floating-controls--compact' : ''}`}>
            <div className="floating-controls__container">
                {/* Zoom controls */}
                {showZoomControls && (
                    <div className="floating-controls__group">
                        <button
                            className={`floating-controls__button ${currentZoom >= maxZoom ? 'floating-controls__button--disabled' : ''}`}
                            onClick={handleZoomIn}
                            disabled={disabled || currentZoom >= maxZoom}
                            aria-label={t('controls.zoomIn', 'Zoom in')}
                            title={t('controls.zoomIn', 'Zoom in')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                                <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="2" />
                                <line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>

                        <button
                            className={`floating-controls__button ${currentZoom <= minZoom ? 'floating-controls__button--disabled' : ''}`}
                            onClick={handleZoomOut}
                            disabled={disabled || currentZoom <= minZoom}
                            aria-label={t('controls.zoomOut', 'Zoom out')}
                            title={t('controls.zoomOut', 'Zoom out')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                                <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Tilt controls */}
                {showTiltControls && (
                    <div className="floating-controls__group">
                        <button
                            className={`floating-controls__button ${tilt >= 60 ? 'floating-controls__button--disabled' : ''}`}
                            onClick={handleTiltUp}
                            disabled={disabled || tilt >= 60}
                            aria-label={t('controls.tiltUp', 'Tilt up')}
                            title={t('controls.tiltUp', 'Tilt up')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <button
                            className={`floating-controls__button ${tilt <= 0 ? 'floating-controls__button--disabled' : ''}`}
                            onClick={handleTiltDown}
                            disabled={disabled || tilt <= 0}
                            aria-label={t('controls.tiltDown', 'Tilt down')}
                            title={t('controls.tiltDown', 'Tilt down')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M17 10l-5 5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Location button */}
                {showLocationButton && (
                    <div className="floating-controls__group">
                        <button
                            className={`floating-controls__button floating-controls__location ${gettingLocation ? 'floating-controls__button--loading' : ''} ${locationError ? 'floating-controls__button--error' : ''}`}
                            onClick={handleCurrentLocation}
                            disabled={disabled || gettingLocation}
                            aria-label={t('controls.currentLocation', 'Go to current location')}
                            title={locationError ? locationError : t('controls.currentLocation', 'Go to current location')}
                        >
                            {gettingLocation ? (
                                <div className="floating-controls__spinner">
                                    <div className="spinner-ring"></div>
                                </div>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}

                {/* Compass button */}
                {showCompassButton && (
                    <div className="floating-controls__group">
                        <button
                            ref={compassRef}
                            className={`floating-controls__button floating-controls__compass ${compassHeading !== 0 ? 'floating-controls__compass--active' : ''}`}
                            onClick={handleCompass}
                            disabled={disabled}
                            aria-label={t('controls.compass', 'Reset compass')}
                            title={t('controls.compass', 'Reset compass')}
                            style={{ transform: `rotate(${-compassHeading}deg)` }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <polygon points="16,12 12,6 8,12 12,10" fill="currentColor" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Layer button */}
                {showLayerButton && (
                    <div className="floating-controls__group" ref={layerMenuRef}>
                        <button
                            className={`floating-controls__button ${showLayerMenu ? 'floating-controls__button--active' : ''}`}
                            onClick={() => setShowLayerMenu(!showLayerMenu)}
                            disabled={disabled}
                            aria-label={t('controls.changeLayers', 'Change map layers')}
                            aria-expanded={showLayerMenu}
                            aria-haspopup="true"
                        >
                            <span style={{ fontSize: '14px' }}>
                                {layerConfigs[currentLayer]?.icon || '🗺️'}
                            </span>
                        </button>

                        {/* Layer menu */}
                        {showLayerMenu && (
                            <div className="floating-controls__layer-menu">
                                <div className="floating-controls__layer-title">
                                    {t('controls.mapLayers', 'Map Layers')}
                                </div>
                                {availableLayers.map(layerType => {
                                    const config = layerConfigs[layerType];
                                    if (!config) return null;

                                    return (
                                        <button
                                            key={layerType}
                                            className={`floating-controls__layer-item ${layerType === currentLayer ? 'floating-controls__layer-item--active' : ''}`}
                                            onClick={() => handleLayerSelect(layerType)}
                                        >
                                            <span className="floating-controls__layer-icon">
                                                {config.icon}
                                            </span>
                                            <div className="floating-controls__layer-info">
                                                <div className="floating-controls__layer-name">
                                                    {config.name}
                                                </div>
                                                <div className="floating-controls__layer-desc">
                                                    {config.description}
                                                </div>
                                            </div>
                                            {layerType === currentLayer && (
                                                <div className="floating-controls__layer-check">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Fullscreen button */}
                {showFullscreenButton && (
                    <div className="floating-controls__group">
                        <button
                            className={`floating-controls__button ${isFullscreen ? 'floating-controls__button--active' : ''}`}
                            onClick={handleFullscreen}
                            disabled={disabled}
                            aria-label={isFullscreen ? t('controls.exitFullscreen', 'Exit fullscreen') : t('controls.enterFullscreen', 'Enter fullscreen')}
                            title={isFullscreen ? t('controls.exitFullscreen', 'Exit fullscreen') : t('controls.enterFullscreen', 'Enter fullscreen')}
                        >
                            {isFullscreen ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 3h6l-6 6V3zM21 3h-6l6 6V3zM3 21h6l-6-6v6zM21 21h-6l6-6v6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloatingControls;