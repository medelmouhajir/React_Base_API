import { useState, useCallback, useRef } from 'react';

export const useGeolocation = () => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState(null);
    const watchIdRef = useRef(null);

    const requestLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const error = new Error('Geolocation is not supported by this browser.');
                setError(error);
                reject(error);
                return;
            }

            setIsLocating(true);
            setError(null);

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };

                    setCurrentLocation(location);
                    setIsLocating(false);
                    resolve(location);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setError(error);
                    setIsLocating(false);
                    reject(error);
                },
                options
            );
        });
    }, []);

    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            setError(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1 minute
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                setCurrentLocation(location);
                setError(null);
            },
            (error) => {
                console.error('Geolocation watch error:', error);
                setError(error);
            },
            options
        );
    }, []);

    const stopWatching = useCallback(() => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    const clearLocation = useCallback(() => {
        setCurrentLocation(null);
        setError(null);
        stopWatching();
    }, [stopWatching]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            stopWatching();
        };
    }, [stopWatching]);

    return {
        currentLocation,
        isLocating,
        error,
        requestLocation,
        startWatching,
        stopWatching,
        clearLocation,
        hasGeolocation: !!navigator.geolocation
    };
};