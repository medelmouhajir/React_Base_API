import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../../../services/apiClient';

const DEFAULT_QUERY = {
    page: 1,
    pageSize: 10,
    isAcknowledged: false
};

const useSpeedingAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [query, setQuery] = useState(DEFAULT_QUERY);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAlerts = useCallback(async (activeQuery = query) => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            Object.entries(activeQuery).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value);
                }
            });

            const [alertsResponse, statsResponse] = await Promise.all([
                apiClient.get(`/SpeedingAlerts?${params.toString()}`),
                apiClient.get('/SpeedingAlerts/stats')
            ]);

            setAlerts(alertsResponse.data.alerts || alertsResponse.data || []);
            setStats(statsResponse.data || null);
        } catch (err) {
            console.error('Failed to load speeding alerts', err);
            setError('Failed to load speeding alerts');
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    const acknowledgeAlert = useCallback(async (alertId, notes = '') => {
        try {
            await apiClient.put(`/SpeedingAlerts/${alertId}/acknowledge`, {
                acknowledgedBy: localStorage.getItem('username') || 'Manager',
                notes
            });
            fetchAlerts();
        } catch (err) {
            console.error('Failed to acknowledge alert', err);
            throw err;
        }
    }, [fetchAlerts]);

    useEffect(() => {
        fetchAlerts(query);
    }, [fetchAlerts, query]);

    return {
        alerts,
        stats,
        isLoading,
        error,
        refresh: () => fetchAlerts(query),
        setQuery,
        acknowledgeAlert
    };
};

export default useSpeedingAlerts;