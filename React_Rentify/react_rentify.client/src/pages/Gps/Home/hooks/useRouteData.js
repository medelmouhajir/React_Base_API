// src/pages/Gps/Home/hooks/useRouteData.js
import { useState, useCallback, useMemo } from 'react';
import gpsService from '../../../../services/gpsService';
import { calculateRouteStats, processRouteForSpeedColoring, detectStops } from '../utils/routeUtils';

const useRouteData = () => {
    const [routeData, setRouteData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Date range state
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setHours(0, 0, 0, 0)), // Today start
        end: new Date(new Date().setHours(23, 59, 59, 999)) // Today end
    });

    // Playback state for route animation
    const [playbackState, setPlaybackState] = useState({
        isPlaying: false,
        currentIndex: 0,
        playbackSpeed: 1, // 1x, 2x, 4x, etc.
        showAnimation: false
    });

    // Fetch route data for a specific vehicle and time range
    const fetchRouteData = useCallback(async (vehicleId, startDate, endDate) => {
        if (!vehicleId || !startDate || !endDate) return;

        try {
            setIsLoading(true);
            setError(null);

            // Fetch GPS records for the specified time range
            const records = await gpsService.getRecordsByCarAndDates(vehicleId, startDate.toISOString(), endDate.toISOString() , true);

            if (!records || records.length === 0) {
                setRouteData(null);
                return;
            }

            // Sort records by timestamp
            const sortedRecords = records.sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Process route data
            const processedRoute = {
                vehicleId,
                dateRange: { start: startDate, end: endDate },
                records: sortedRecords,
                // Process for speed-colored segments
                speedSegments: processRouteForSpeedColoring(sortedRecords),
                // Detect stops and important points
                stops: detectStops(sortedRecords),
                // Calculate route bounds for map fitting
                bounds: calculateBounds(sortedRecords),
                // Additional metadata
                metadata: {
                    totalRecords: sortedRecords.length,
                    firstRecord: sortedRecords[0],
                    lastRecord: sortedRecords[sortedRecords.length - 1],
                    timeSpan: new Date(sortedRecords[sortedRecords.length - 1].timestamp) -
                        new Date(sortedRecords[0].timestamp)
                }
            };

            setRouteData(processedRoute);

        } catch (err) {
            console.error('Error fetching route data:', err);
            setError('Failed to load route data. Please try again.');
            setRouteData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Calculate route statistics
    const routeStats = useMemo(() => {
        if (!routeData || !routeData.records) return null;

        return calculateRouteStats(routeData.records);
    }, [routeData]);

    // Get route data for specific time range (for timeline scrubbing)
    const getRouteSegment = useCallback((startTime, endTime) => {
        if (!routeData || !routeData.records) return null;

        return routeData.records.filter(record => {
            const recordTime = new Date(record.timestamp);
            return recordTime >= startTime && recordTime <= endTime;
        });
    }, [routeData]);

    // Playback controls
    const startPlayback = useCallback(() => {
        if (!routeData || !routeData.records) return;

        setPlaybackState(prev => ({
            ...prev,
            isPlaying: true,
            showAnimation: true,
            currentIndex: prev.currentIndex === routeData.records.length - 1 ? 0 : prev.currentIndex
        }));
    }, [routeData]);

    const pausePlayback = useCallback(() => {
        setPlaybackState(prev => ({
            ...prev,
            isPlaying: false
        }));
    }, []);

    const stopPlayback = useCallback(() => {
        setPlaybackState({
            isPlaying: false,
            currentIndex: 0,
            playbackSpeed: 1,
            showAnimation: false
        });
    }, []);

    const seekToPosition = useCallback((index) => {
        if (!routeData || index < 0 || index >= routeData.records.length) return;

        setPlaybackState(prev => ({
            ...prev,
            currentIndex: index
        }));
    }, [routeData]);

    const setPlaybackSpeed = useCallback((speed) => {
        setPlaybackState(prev => ({
            ...prev,
            playbackSpeed: speed
        }));
    }, []);

    // Date range presets
    const setDateRangePreset = useCallback((preset) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let start, end;

        switch (preset) {
            case 'today':
                start = new Date(today);
                end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
                break;

            case 'yesterday':
                start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                end = new Date(today.getTime() - 1);
                break;

            case 'last7days':
                start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
                break;

            case 'last30days':
                start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
                break;

            case 'thisWeek':
                const dayOfWeek = today.getDay();
                start = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
                end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
                break;

            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
                break;

            default:
                return;
        }

        setDateRange({ start, end });
    }, []);

    // Helper function to calculate bounds
    const calculateBounds = (records) => {
        if (!records || records.length === 0) return null;

        const latitudes = records.map(r => parseFloat(r.latitude)).filter(lat => !isNaN(lat));
        const longitudes = records.map(r => parseFloat(r.longitude)).filter(lng => !isNaN(lng));

        if (latitudes.length === 0 || longitudes.length === 0) return null;

        return {
            north: Math.max(...latitudes),
            south: Math.min(...latitudes),
            east: Math.max(...longitudes),
            west: Math.min(...longitudes),
            center: {
                lat: (Math.max(...latitudes) + Math.min(...latitudes)) / 2,
                lng: (Math.max(...longitudes) + Math.min(...longitudes)) / 2
            }
        };
    };

    // Get current playback position data
    const currentPlaybackData = useMemo(() => {
        if (!routeData || !playbackState.showAnimation ||
            playbackState.currentIndex >= routeData.records.length) {
            return null;
        }

        return {
            current: routeData.records[playbackState.currentIndex],
            previous: playbackState.currentIndex > 0 ?
                routeData.records[playbackState.currentIndex - 1] : null,
            next: playbackState.currentIndex < routeData.records.length - 1 ?
                routeData.records[playbackState.currentIndex + 1] : null,
            progress: (playbackState.currentIndex / (routeData.records.length - 1)) * 100
        };
    }, [routeData, playbackState]);

    // Clear route data
    const clearRouteData = useCallback(() => {
        setRouteData(null);
        setError(null);
        stopPlayback();
    }, [stopPlayback]);

    return {
        // Data
        routeData,
        routeStats,
        dateRange,
        playbackState,
        currentPlaybackData,

        // Loading and error states
        isLoading,
        error,

        // Actions
        fetchRouteData,
        setDateRange,
        setDateRangePreset,
        clearRouteData,
        getRouteSegment,

        // Playback controls
        startPlayback,
        pausePlayback,
        stopPlayback,
        seekToPosition,
        setPlaybackSpeed,

        // Utilities
        hasRouteData: !!routeData && routeData.records?.length > 0,
        routeBounds: routeData?.bounds,
        totalRecords: routeData?.records?.length || 0,

        // Date range presets
        dateRangePresets: [
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'last7days', label: 'Last 7 Days' },
            { key: 'thisWeek', label: 'This Week' },
            { key: 'thisMonth', label: 'This Month' },
            { key: 'last30days', label: 'Last 30 Days' }
        ]
    };
};

export default useRouteData;