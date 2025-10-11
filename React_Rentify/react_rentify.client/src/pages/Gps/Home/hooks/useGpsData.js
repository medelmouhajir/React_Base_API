// src/pages/Gps/Home/hooks/useGpsData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import gpsService from '../../../../services/gpsService';

const useGpsData = (agencyId) => {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Real-time updates
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const intervalRef = useRef(null);
    const wsRef = useRef(null);

    // Fetch vehicles for agency
    const fetchVehicles = useCallback(async () => {
        if (!agencyId) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await gpsService.getAgencyVehicles(agencyId);

            // Transform and enrich vehicle data
            const enrichedVehicles = response.map(vehicle => ({
                ...vehicle,
                // Add computed properties
                isOnline: vehicle.lastUpdate &&
                    (new Date() - new Date(vehicle.lastUpdate)) < 5 * 60 * 1000, // 5 minutes
                isMoving: vehicle.lastSpeed > 0 && vehicle.ignitionOn,
                batteryStatus: getBatteryStatus(vehicle.batteryVoltage),
                signalStrength: getSignalStrength(vehicle.gsmSignal),
                lastLocation: vehicle.latitude && vehicle.longitude ? {
                    latitude: parseFloat(vehicle.latitude),
                    longitude: parseFloat(vehicle.longitude),
                    accuracy: vehicle.accuracy || null
                } : null
            }));

            setVehicles(enrichedVehicles);
            setLastUpdateTime(new Date());

        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError('Failed to load vehicles. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [agencyId]);

    // Real-time vehicle updates via polling
    const startRealTimeUpdates = useCallback(() => {
        if (intervalRef.current) return;

        intervalRef.current = setInterval(async () => {
            try {
                // Only update positions for online vehicles to reduce load
                const onlineVehicles = vehicles.filter(v => v.isOnline);

                if (onlineVehicles.length === 0) return;

                const updates = await Promise.all(
                    onlineVehicles.map(async (vehicle) => {
                        try {
                            const latestData = await gpsService.getVehicleLatestPosition(vehicle.id);
                            return { vehicleId: vehicle.id, ...latestData };
                        } catch (error) {
                            console.warn(`Failed to update vehicle ${vehicle.id}:`, error);
                            return null;
                        }
                    })
                );

                // Update vehicles state with new positions
                setVehicles(prev => prev.map(vehicle => {
                    const update = updates.find(u => u?.vehicleId === vehicle.id);
                    if (!update) return vehicle;

                    return {
                        ...vehicle,
                        ...update,
                        lastLocation: update.latitude && update.longitude ? {
                            latitude: parseFloat(update.latitude),
                            longitude: parseFloat(update.longitude),
                            accuracy: update.accuracy || null
                        } : vehicle.lastLocation,
                        isOnline: new Date() - new Date(update.timestamp) < 5 * 60 * 1000,
                        isMoving: update.speedKmh > 0 && update.ignitionOn
                    };
                }));

                setLastUpdateTime(new Date());

            } catch (error) {
                console.error('Real-time update failed:', error);
            }
        }, 30000); // Update every 30 seconds
    }, [vehicles]);

    // Stop real-time updates
    const stopRealTimeUpdates = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // WebSocket connection for real-time updates (if available)
    const initializeWebSocket = useCallback(() => {
        if (!agencyId || wsRef.current) return;

        try {
            const wsUrl = `${process.env.REACT_APP_WS_BASE_URL}/gps/${agencyId}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('GPS WebSocket connected');
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'VEHICLE_UPDATE':
                            updateSingleVehicle(data.vehicleId, data.update);
                            break;
                        case 'VEHICLE_ALERT':
                            handleVehicleAlert(data);
                            break;
                        default:
                            console.log('Unknown WebSocket message type:', data.type);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            wsRef.current.onclose = () => {
                console.log('GPS WebSocket disconnected');
                wsRef.current = null;
                // Attempt to reconnect after 5 seconds
                setTimeout(initializeWebSocket, 5000);
            };

            wsRef.current.onerror = (error) => {
                console.error('GPS WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            // Fall back to polling
            startRealTimeUpdates();
        }
    }, [agencyId]);

    // Update single vehicle in the list
    const updateSingleVehicle = useCallback((vehicleId, update) => {
        setVehicles(prev => prev.map(vehicle => {
            if (vehicle.id !== vehicleId) return vehicle;

            return {
                ...vehicle,
                ...update,
                lastLocation: update.latitude && update.longitude ? {
                    latitude: parseFloat(update.latitude),
                    longitude: parseFloat(update.longitude),
                    accuracy: update.accuracy || null
                } : vehicle.lastLocation,
                isOnline: new Date() - new Date(update.timestamp) < 5 * 60 * 1000,
                isMoving: update.speedKmh > 0 && update.ignitionOn,
                batteryStatus: getBatteryStatus(update.batteryVoltage),
                signalStrength: getSignalStrength(update.gsmSignal)
            };
        }));
    }, []);

    // Handle vehicle alerts
    const handleVehicleAlert = useCallback((alertData) => {
        // This could integrate with a notification system
        console.log('Vehicle alert:', alertData);
        // You could dispatch to a global alert/notification context here
    }, []);

    // Refresh vehicles manually
    const refreshVehicles = useCallback(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    // Helper functions
    const getBatteryStatus = (voltage) => {
        if (!voltage) return 'unknown';
        if (voltage > 12.5) return 'good';
        if (voltage > 11.8) return 'low';
        return 'critical';
    };

    const getSignalStrength = (signal) => {
        if (!signal) return 'unknown';
        if (signal > -70) return 'excellent';
        if (signal > -85) return 'good';
        if (signal > -100) return 'fair';
        return 'poor';
    };

    // Effects
    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    useEffect(() => {
        if (vehicles.length > 0) {
            // Try WebSocket first, fall back to polling
            if (process.env.REACT_APP_WS_BASE_URL) {
                initializeWebSocket();
            } else {
                startRealTimeUpdates();
            }
        }

        return () => {
            stopRealTimeUpdates();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [vehicles.length, initializeWebSocket, startRealTimeUpdates, stopRealTimeUpdates]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRealTimeUpdates();
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [stopRealTimeUpdates]);

    return {
        vehicles,
        selectedVehicle,
        setSelectedVehicle,
        isLoading,
        error,
        lastUpdateTime,
        refreshVehicles,
        // Additional utilities
        getVehicleById: (id) => vehicles.find(v => v.id === id),
        getOnlineVehicles: () => vehicles.filter(v => v.isOnline),
        getMovingVehicles: () => vehicles.filter(v => v.isMoving),
        // Stats
        stats: {
            total: vehicles.length,
            online: vehicles.filter(v => v.isOnline).length,
            moving: vehicles.filter(v => v.isMoving).length,
            parked: vehicles.filter(v => v.isOnline && !v.isMoving).length,
            offline: vehicles.filter(v => !v.isOnline).length
        }
    };
};

export default useGpsData;