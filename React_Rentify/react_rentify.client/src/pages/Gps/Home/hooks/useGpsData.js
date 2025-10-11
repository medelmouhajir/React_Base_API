// src/pages/Gps/Home/hooks/useGpsData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import gpsService from '../../../../services/gpsService';

const getBatteryStatus = (voltage) => {
    if (voltage === null || voltage === undefined) return 'unknown';
    if (voltage > 12.5) return 'good';
    if (voltage > 11.8) return 'low';
    return 'critical';
};

const getSignalStrength = (signal) => {
    if (signal === null || signal === undefined) return 'unknown';
    if (signal > -70) return 'excellent';
    if (signal > -85) return 'good';
    if (signal > -100) return 'fair';
    return 'poor';
};

const formatVehicleUpdate = (vehicle, update) => {
    if (!update) return vehicle;

    const latitude = update.latitude ?? update.Latitude;
    const longitude = update.longitude ?? update.Longitude;
    const accuracy = update.accuracy ?? update.Accuracy ?? vehicle.lastLocation?.accuracy ?? null;
    const timestamp = update.timestamp ?? update.Timestamp ?? vehicle.timestamp;
    const speedValue = update.speedKmh ?? update.speed ?? update.SpeedKmh ?? update.Speed ?? vehicle.speedKmh ?? vehicle.speed ?? 0;
    const ignitionState = update.ignitionOn ?? update.IgnitionOn ?? vehicle.ignitionOn;
    const batteryVoltage = update.batteryVoltage ?? update.BatteryVoltage;
    const gsmSignal = update.gsmSignal ?? update.GsmSignal;

    return {
        ...vehicle,
        ...update,
        speedKmh: speedValue,
        lastLocation: (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null)
            ? {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                accuracy
            }
            : vehicle.lastLocation,
        isOnline: timestamp ? (new Date() - new Date(timestamp)) < 5 * 60 * 1000 : vehicle.isOnline,
        isMoving: speedValue > 0 && !!ignitionState,
        batteryStatus: batteryVoltage !== undefined && batteryVoltage !== null
            ? getBatteryStatus(batteryVoltage)
            : vehicle.batteryStatus,
        signalStrength: gsmSignal !== undefined && gsmSignal !== null
            ? getSignalStrength(gsmSignal)
            : vehicle.signalStrength
    };
};

const useGpsData = (agencyId) => {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Real-time updates
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const intervalRef = useRef(null);
    const signalRConnectionRef = useRef(null);
    const isSignalRConnectingRef = useRef(false);
    const shouldStartFallbackRef = useRef(true);
    const vehiclesRef = useRef([]);

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
                const onlineVehicles = vehiclesRef.current.filter(v => v.isOnline);

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

                    return formatVehicleUpdate(vehicle, update);
                }));

                setLastUpdateTime(new Date());

            } catch (error) {
                console.error('Real-time update failed:', error);
            }
        }, 30000); // Update every 30 seconds
    }, []);

    // Stop real-time updates
    const stopRealTimeUpdates = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const stopSignalRConnection = useCallback((connectionOverride, options = {}) => {
        const { startFallback = true } = options;
        const connectionToStop = connectionOverride ?? signalRConnectionRef.current;
        if (!connectionToStop) return;

        if (signalRConnectionRef.current === connectionToStop) {
            signalRConnectionRef.current = null;
        }

        isSignalRConnectingRef.current = false;
        shouldStartFallbackRef.current = startFallback;

        if (
            connectionToStop.state === signalR.HubConnectionState.Disconnected ||
            connectionToStop.state === signalR.HubConnectionState.Disconnecting
        ) {
            return;
        }

        connectionToStop.stop().catch((stopError) => {
            if (stopError?.name === 'AbortError') {
                console.info('GPS SignalR stop aborted: connection was already closing.');
            } else {
                console.warn('Failed to stop GPS SignalR connection:', stopError);
            }
        });
    }, []);

    // Handle vehicle alerts
    const handleVehicleAlert = useCallback((alertData) => {
        // This could integrate with a notification system
        console.log('Vehicle alert:', alertData);
        // You could dispatch to a global alert/notification context here
    }, []);

    // Update single vehicle in the list
    const updateSingleVehicle = useCallback((vehicleId, update) => {
        setVehicles(prev => prev.map(vehicle => {
            if (vehicle.id !== vehicleId) return vehicle;
            return formatVehicleUpdate(vehicle, update);
        }));
    }, []);

    // SignalR connection for real-time updates (preferred)
    const initializeSignalR = useCallback(() => {
        if (!agencyId || signalRConnectionRef.current || isSignalRConnectingRef.current) return;

        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('GPS real-time updates require an authenticated session');
            startRealTimeUpdates();
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5249';

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/hubs/gps`, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect([0, 2000, 10000, 30000, 60000])
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connection.on('InitialVehicleData', (initialUpdates = []) => {
            if (!Array.isArray(initialUpdates) || initialUpdates.length === 0) return;

            setVehicles(prev => prev.map(vehicle => {
                const payload = initialUpdates.find(update => update?.vehicleId === vehicle.id);
                if (!payload?.update) return vehicle;

                return formatVehicleUpdate(vehicle, payload.update);
            }));

            setLastUpdateTime(new Date());
        });

        connection.on('VehicleUpdate', (vehicleUpdate) => {
            if (!vehicleUpdate?.vehicleId) return;

            updateSingleVehicle(vehicleUpdate.vehicleId, vehicleUpdate.update);
            setLastUpdateTime(new Date());
        });

        connection.on('VehicleAlert', (alertData) => {
            handleVehicleAlert(alertData);
        });

        connection.on('Error', (message) => {
            console.error('GPS hub error:', message);
            setError(typeof message === 'string' ? message : 'Real-time updates encountered an error');
        });

        connection.onreconnecting((error) => {
            console.warn('GPS SignalR reconnecting...', error);
        });

        connection.onreconnected(async () => {
            console.log('GPS SignalR reconnected');
            try {
                await connection.invoke('JoinAgencyGroup', agencyId);
            } catch (err) {
                console.error('Failed to rejoin GPS agency group:', err);
            }
        });

        connection.onclose((error) => {
            console.warn('GPS SignalR connection closed:', error);
            if (signalRConnectionRef.current === connection) {
                signalRConnectionRef.current = null;
            }
            const shouldStartFallback = shouldStartFallbackRef.current;
            shouldStartFallbackRef.current = true;
            isSignalRConnectingRef.current = false;
            if (shouldStartFallback) {
                startRealTimeUpdates();
            }
        });

        signalRConnectionRef.current = connection;
        isSignalRConnectingRef.current = true;
        shouldStartFallbackRef.current = true;

        connection.start()
            .then(async () => {
                console.log('GPS SignalR connected');
                setError(null);
                stopRealTimeUpdates();
                await connection.invoke('JoinAgencyGroup', agencyId);
                isSignalRConnectingRef.current = false;
            })
            .catch((error) => {
                isSignalRConnectingRef.current = false;
                const isAbortError =
                    error?.name === 'AbortError' ||
                    (typeof error?.message === 'string' &&
                        error.message.toLowerCase().includes('stopped during negotiation'));

                if (isAbortError) {
                    console.info('GPS SignalR start was aborted before completion.');
                } else {
                    console.error('Failed to start GPS SignalR connection:', error);
                }

                stopSignalRConnection(connection, { startFallback: !isAbortError });

                if (!isAbortError) {
                    startRealTimeUpdates();
                }
            });
    }, [agencyId, handleVehicleAlert, startRealTimeUpdates, stopRealTimeUpdates, stopSignalRConnection, updateSingleVehicle]);

    // Refresh vehicles manually
    const refreshVehicles = useCallback(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    // Effects
    useEffect(() => {
        vehiclesRef.current = vehicles;
    }, [vehicles]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    useEffect(() => {
        if (!agencyId) return undefined;

        if (import.meta.env.VITE_API_URL) {
            initializeSignalR();
        } else {
            startRealTimeUpdates();
        }

        return () => {
            stopRealTimeUpdates();
            stopSignalRConnection(undefined, { startFallback: false });
        };
    }, [agencyId, initializeSignalR, startRealTimeUpdates, stopRealTimeUpdates, stopSignalRConnection]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRealTimeUpdates();
            stopSignalRConnection(undefined, { startFallback: false });
        };
    }, [stopRealTimeUpdates, stopSignalRConnection]);

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