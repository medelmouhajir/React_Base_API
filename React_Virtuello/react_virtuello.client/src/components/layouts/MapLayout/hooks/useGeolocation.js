// =============================================================================
// GEOLOCATION HOOK
// =============================================================================
import { useState, useEffect, useCallback, useRef } from 'react';

export const useGeolocation = (options = {}) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState('prompt'); // 'granted', 'denied', 'prompt'
    const watchIdRef = useRef(null);
    const retryCountRef = useRef(0);

    // Default geolocation options
    const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 30000, // Reduced from 10000 to 5000 (5 seconds)
        maximumAge: 300000, // 5 minutes
        retryAttempts: 2, // Reduced from 3 to 2
        retryDelay: 1000, // Reduced from 2000 to 1000
        fallbackLocation: {
            lat: 33.5731, // Casablanca default
            lng: -7.5898,
            accuracy: null
        },
        ...options
    };

    // Check if geolocation is supported
    const isSupported = 'geolocation' in navigator;

    // Check permissions
    const checkPermissions = useCallback(async () => {
        if (!navigator.permissions) return;

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            setPermissions(permission.state);

            permission.addEventListener('change', () => {
                setPermissions(permission.state);
            });
        } catch (err) {
            console.warn('Could not check geolocation permissions:', err);
        }
    }, []);

    // Get current position with retry logic
    const getCurrentPosition = useCallback(async (forceRefresh = false) => {
        if (!isSupported) {
            const error = new Error('Geolocation is not supported by this browser');
            setError(error);
            return { success: false, error };
        }

        setLoading(true);
        setError(null);
        retryCountRef.current = 0;

        const attemptPosition = () => {
            return new Promise((resolve, reject) => {
                const options = {
                    enableHighAccuracy: defaultOptions.enableHighAccuracy,
                    timeout: defaultOptions.timeout,
                    maximumAge: forceRefresh ? 0 : defaultOptions.maximumAge
                };

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const locationData = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            altitude: position.coords.altitude,
                            altitudeAccuracy: position.coords.altitudeAccuracy,
                            heading: position.coords.heading,
                            speed: position.coords.speed,
                            timestamp: position.timestamp
                        };

                        setLocation(locationData);
                        setLoading(false);
                        resolve({ success: true, location: locationData });
                    },
                    (err) => {
                        reject(err);
                    },
                    options
                );
            });
        };

        const retryWithDelay = async (error) => {
            retryCountRef.current += 1;

            if (retryCountRef.current < defaultOptions.retryAttempts) {
                await new Promise(resolve => setTimeout(resolve, defaultOptions.retryDelay));
                try {
                    return await attemptPosition();
                } catch (retryError) {
                    return retryWithDelay(retryError);
                }
            } else {
                throw error;
            }
        };

        try {
            return await attemptPosition();
        } catch (err) {
            try {
                return await retryWithDelay(err);
            } catch (finalError) {
                const errorInfo = {
                    code: finalError.code,
                    message: getErrorMessage(finalError),
                    originalError: finalError
                };

                setError(errorInfo);
                setLoading(false);

                // Use fallback location if available
                if (defaultOptions.fallbackLocation) {
                    setLocation(defaultOptions.fallbackLocation);
                    return {
                        success: false,
                        error: errorInfo,
                        fallbackUsed: true,
                        location: defaultOptions.fallbackLocation
                    };
                }

                return { success: false, error: errorInfo };
            }
        }
    }, [isSupported, defaultOptions]);

    // Start watching position
    const startWatching = useCallback(() => {
        if (!isSupported || watchIdRef.current) return;

        const options = {
            enableHighAccuracy: defaultOptions.enableHighAccuracy,
            timeout: defaultOptions.timeout,
            maximumAge: defaultOptions.maximumAge
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const locationData = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp
                };

                setLocation(locationData);
                setError(null);
            },
            (err) => {
                const errorInfo = {
                    code: err.code,
                    message: getErrorMessage(err),
                    originalError: err
                };
                setError(errorInfo);
            },
            options
        );
    }, [isSupported, defaultOptions]);

    // Stop watching position
    const stopWatching = useCallback(() => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    // Clear location data
    const clearLocation = useCallback(() => {
        setLocation(null);
        setError(null);
        stopWatching();
    }, [stopWatching]);

    // Get human-readable error message
    const getErrorMessage = (error) => {
        switch (error.code) {
            case 1: // PERMISSION_DENIED
                return 'Location access denied by user';
            case 2: // POSITION_UNAVAILABLE
                return 'Location information unavailable';
            case 3: // TIMEOUT
                return 'Location request timed out';
            default:
                return 'An unknown error occurred while retrieving location';
        }
    };

    // Check permissions on mount
    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWatching();
        };
    }, [stopWatching]);

    return {
        // State
        location,
        error,
        loading,
        permissions,
        isSupported,

        // Actions
        getCurrentPosition,
        startWatching,
        stopWatching,
        clearLocation,

        // Utils
        isWatching: watchIdRef.current !== null,
        retryCount: retryCountRef.current,

        // Location utilities
        hasLocation: location !== null,
        isLocationFresh: location && (Date.now() - location.timestamp) < defaultOptions.maximumAge,
        isHighAccuracy: location && location.accuracy && location.accuracy < 100
    };
};