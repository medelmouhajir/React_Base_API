import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../contexts/AuthContext';

export const useSignalR = () => {
    const { user } = useAuth();
    const [connection, setConnection] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Build SignalR connection
    useEffect(() => {
        if (!user) {
            // Cleanup if user logs out
            if (connection) {
                connection.stop();
                setConnection(null);
                setIsConnected(false);
            }
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5249';

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/hubs/notifications`, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    // Exponential backoff: 0s, 2s, 10s, 30s, then 60s
                    if (retryContext.previousRetryCount === 0) return 0;
                    if (retryContext.previousRetryCount === 1) return 2000;
                    if (retryContext.previousRetryCount === 2) return 10000;
                    if (retryContext.previousRetryCount === 3) return 30000;
                    return 60000;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Connection event handlers
        newConnection.onreconnecting((error) => {
            console.warn('🔄 SignalR reconnecting...', error);
            setIsConnected(false);
            setConnectionError('Reconnecting...');
        });

        newConnection.onreconnected((connectionId) => {
            console.log('✅ SignalR reconnected:', connectionId);
            setIsConnected(true);
            setConnectionError(null);
            reconnectAttempts.current = 0;
        });

        newConnection.onclose((error) => {
            console.error('❌ SignalR connection closed:', error);
            setIsConnected(false);

            if (reconnectAttempts.current < maxReconnectAttempts) {
                reconnectAttempts.current++;
                setTimeout(() => {
                    console.log(`🔄 Attempting manual reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
                    startConnection(newConnection);
                }, 5000);
            } else {
                setConnectionError('Connection lost. Please refresh the page.');
            }
        });

        setConnection(newConnection);

        // Start connection
        const startConnection = async (conn) => {
            try {
                await conn.start();
                console.log('✅ SignalR Connected:', conn.connectionId);
                setIsConnected(true);
                setConnectionError(null);
                reconnectAttempts.current = 0;
            } catch (error) {
                console.error('❌ SignalR connection failed:', error);
                setConnectionError('Failed to connect to notification service');
                setIsConnected(false);
            }
        };

        startConnection(newConnection);

        // Cleanup
        return () => {
            if (newConnection.state === signalR.HubConnectionState.Connected) {
                newConnection.stop();
            }
        };
    }, [user]);

    // Method to invoke server methods
    const invoke = useCallback(async (methodName, ...args) => {
        if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('Cannot invoke method - SignalR not connected');
            return;
        }

        try {
            return await connection.invoke(methodName, ...args);
        } catch (error) {
            console.error(`Error invoking ${methodName}:`, error);
            throw error;
        }
    }, [connection]);

    // Method to register event handlers
    const on = useCallback((eventName, handler) => {
        if (!connection) return () => { };

        connection.on(eventName, handler);

        // Return cleanup function
        return () => {
            connection.off(eventName, handler);
        };
    }, [connection]);

    return {
        connection,
        isConnected,
        connectionError,
        invoke,
        on
    };
};