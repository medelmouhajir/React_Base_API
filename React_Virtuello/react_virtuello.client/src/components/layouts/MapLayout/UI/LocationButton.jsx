/**
 * LocationButton Component - User Location Control
 * Provides location detection, tracking, and user position controls
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import geolocationService from '../Services/GeolocationService';
import './locationButton.css';

const LocationButton = ({
    onLocationFound,
    onLocationError,
    onTrackingToggle,
    userLocation = null,
    isTracking = false,
    accuracy = null,
    showAccuracy = true,
    autoCenter = true,
    className = '',
    theme = 'light',
    size = 'medium',
    disabled = false
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [isLoading, setIsLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('unknown'); // 'unknown', 'granted', 'denied', 'unsupported'
    const [lastKnownLocation, setLastKnownLocation] = useState(null);
    const [error, setError] = useState(null);

    // =============================================================================
    // LOCATION FUNCTIONALITY
    // =============================================================================

    /**
     * Check geolocation permission status
     */
    const checkPermissionStatus = useCallback(async () => {
        try {
            const permission = await geolocationService.checkPermission();
            setLocationStatus(permission);
            return permission;
        } catch (error) {
            console.error('[LocationButton] Permission check failed:', error);
            setLocationStatus('unsupported');
            return 'unsupported';
        }
    }, []);

    /**
     * Get current user location
     */
    const getCurrentLocation = useCallback(async () => {
        if (disabled || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            // Check if geolocation is supported
            if (!geolocationService.isSupported()) {
                throw new Error('Geolocation is not supported by this browser');
            }

            // Get current position
            const position = await geolocationService.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 // 1 minute cache
            });

            const locationData = {
                lat: position.latitude,
                lng: position.longitude,
                accuracy: position.accuracy,
                timestamp: position.timestamp,
                altitude: position.altitude,
                altitudeAccuracy: position.altitudeAccuracy,
                heading: position.heading,
                speed: position.speed
            };

            setLastKnownLocation(locationData);
            setLocationStatus('granted');

            // Call parent handler
            if (onLocationFound) {
                onLocationFound(locationData);
            }

        } catch (error) {
            console.error('[LocationButton] Location error:', error);
            setError(error.message);
            setLocationStatus(error.code === 1 ? 'denied' : 'unknown');

            // Call parent error handler
            if (onLocationError) {
                onLocationError(error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [disabled, isLoading, onLocationFound, onLocationError]);

    /**
     * Toggle location tracking
     */
    const toggleTracking = useCallback(async () => {
        if (disabled) return;

        try {
            if (isTracking) {
                // Stop tracking
                geolocationService.stopWatching();
                if (onTrackingToggle) {
                    onTrackingToggle(false);
                }
            } else {
                // Start tracking
                const watchId = await geolocationService.watchPosition(
                    (position) => {
                        const locationData = {
                            lat: position.latitude,
                            lng: position.longitude,
                            accuracy: position.accuracy,
                            timestamp: position.timestamp,
                            altitude: position.altitude,
                            altitudeAccuracy: position.altitudeAccuracy,
                            heading: position.heading,
                            speed: position.speed
                        };

                        setLastKnownLocation(locationData);

                        if (onLocationFound) {
                            onLocationFound(locationData);
                        }
                    },
                    (error) => {
                        console.error('[LocationButton] Watch position error:', error);
                        setError(error.message);

                        if (onLocationError) {
                            onLocationError(error);
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 30000 // 30 second cache
                    }
                );

                if (onTrackingToggle) {
                    onTrackingToggle(true);
                }
            }
        } catch (error) {
            console.error('[LocationButton] Tracking toggle error:', error);
            setError(error.message);
        }
    }, [disabled, isTracking, onTrackingToggle, onLocationFound, onLocationError]);

    // =============================================================================
    // EFFECTS
    // =============================================================================

    // Check permission status on mount
    useEffect(() => {
        checkPermissionStatus();
    }, [checkPermissionStatus]);

    // Set up geolocation service event listeners
    useEffect(() => {
        const handleLocationUpdate = (position) => {
            setLastKnownLocation(position);
        };

        const handleLocationError = (error) => {
            setError(error.message);
        };

        // Add event listeners
        geolocationService.on('locationUpdate', handleLocationUpdate);
        geolocationService.on('locationError', handleLocationError);

        // Cleanup
        return () => {
            geolocationService.off('locationUpdate', handleLocationUpdate);
            geolocationService.off('locationError', handleLocationError);
        };
    }, []);

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    const getButtonIcon = () => {
        if (isLoading) {
            return '⏳';
        }

        if (isTracking) {
            return '🎯';
        }

        if (userLocation || lastKnownLocation) {
            return '📍';
        }

        switch (locationStatus) {
            case 'granted':
                return '📍';
            case 'denied':
                return '🚫';
            case 'unsupported':
                return '❌';
            default:
                return '📡';
        }
    };

    const getButtonTitle = () => {
        if (isLoading) {
            return 'Getting location...';
        }

        if (isTracking) {
            return 'Stop location tracking';
        }

        if (userLocation || lastKnownLocation) {
            return 'Update location';
        }

        switch (locationStatus) {
            case 'granted':
                return 'Get current location';
            case 'denied':
                return 'Location access denied';
            case 'unsupported':
                return 'Geolocation not supported';
            default:
                return 'Get current location';
        }
    };

    const getAccuracyText = () => {
        const currentAccuracy = accuracy || userLocation?.accuracy || lastKnownLocation?.accuracy;

        if (!currentAccuracy) return null;

        if (currentAccuracy < 10) {
            return `±${currentAccuracy.toFixed(0)}m (High)`;
        } else if (currentAccuracy < 50) {
            return `±${currentAccuracy.toFixed(0)}m (Good)`;
        } else if (currentAccuracy < 100) {
            return `±${currentAccuracy.toFixed(0)}m (Fair)`;
        } else {
            return `±${currentAccuracy.toFixed(0)}m (Low)`;
        }
    };

    const renderLocationInfo = () => {
        const location = userLocation || lastKnownLocation;
        if (!location || !showAccuracy) return null;

        return (
            <div className="location-button__info">
                <div className="location-button__coordinates">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
                {location.accuracy && (
                    <div className="location-button__accuracy">
                        {getAccuracyText()}
                    </div>
                )}
                {location.timestamp && (
                    <div className="location-button__timestamp">
                        Updated: {new Date(location.timestamp).toLocaleTimeString()}
                    </div>
                )}
            </div>
        );
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <div className={`location-button ${className} location-button--${theme} location-button--${size}`}>
            {/* Main Location Button */}
            <button
                className={`location-button__main ${isTracking ? 'tracking' : ''} ${locationStatus}`}
                onClick={getCurrentLocation}
                onDoubleClick={toggleTracking}
                disabled={disabled || locationStatus === 'unsupported'}
                title={getButtonTitle()}
                aria-label={getButtonTitle()}
            >
                <span className="location-button__icon">
                    {getButtonIcon()}
                </span>
                {isLoading && (
                    <span className="location-button__spinner"></span>
                )}
            </button>

            {/* Tracking Toggle Button */}
            <button
                className={`location-button__tracking ${isTracking ? 'active' : ''}`}
                onClick={toggleTracking}
                disabled={disabled || locationStatus !== 'granted'}
                title={isTracking ? 'Stop tracking' : 'Start tracking'}
                aria-label={isTracking ? 'Stop location tracking' : 'Start location tracking'}
            >
                {isTracking ? '⏸️' : '▶️'}
            </button>

            {/* Location Info Tooltip */}
            {(userLocation || lastKnownLocation) && (
                <div className="location-button__tooltip">
                    {renderLocationInfo()}
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="location-button__error">
                    <span className="location-button__error-icon">⚠️</span>
                    <span className="location-button__error-text">{error}</span>
                    <button
                        className="location-button__error-close"
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Status Indicator */}
            <div className={`location-button__status location-button__status--${locationStatus}`}>
                <div className={`location-button__status-dot ${isTracking ? 'pulsing' : ''}`}></div>
            </div>
        </div>
    );
};

export default LocationButton;