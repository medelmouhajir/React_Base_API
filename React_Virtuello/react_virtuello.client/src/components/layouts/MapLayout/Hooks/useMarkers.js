/**
 * useMarkers Hook - Map Markers Management
 * Manages business and event markers, clustering, filtering, and interactions
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster'; // Add this import for clustering
import 'leaflet.markercluster/dist/MarkerCluster.css'; // Add CSS
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'; // Add default styles
import { CLUSTER_CONFIG, LAYER_CONFIG, PERFORMANCE_CONFIG } from '../Config/mapConfig';
import { createMarkerIcon, createClusterIcon } from '../Utils/markerIcons';

/**
 * Custom hook for managing map markers
 * @param {Object} map - Leaflet map instance
 * @param {Object} options - Hook configuration options
 * @returns {Object} Markers management utilities and state
 */
export const useMarkers = (map, options = {}) => {
    const {
        enableClustering = true,
        clusterOptions = CLUSTER_CONFIG,
        layerConfig = LAYER_CONFIG,
        onMarkerClick = null,
        onMarkerHover = null,
        onClusterClick = null,
        filterConfig = {},
        maxMarkers = PERFORMANCE_CONFIG.maxMarkersPerLayer
    } = options;

    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [markers, setMarkers] = useState({
        businesses: [],
        events: [],
        routes: [],
        custom: []
    });

    const [filteredMarkers, setFilteredMarkers] = useState({
        businesses: [],
        events: [],
        routes: [],
        custom: []
    });

    const [markerLayers, setMarkerLayers] = useState({});
    const [clusterGroups, setClusterGroups] = useState({});
    const [activeFilters, setActiveFilters] = useState({});
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [hoveredMarker, setHoveredMarker] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Refs for layer management
    const layerGroupsRef = useRef({});
    const markerRefsRef = useRef({});

    // =============================================================================
    // MARKER CREATION UTILITIES
    // =============================================================================

    /**
     * Create marker for business
     * @param {Object} business - Business data
     * @returns {Object} Marker configuration
     */
    const createBusinessMarker = useCallback((business) => {
        const icon = createMarkerIcon('business', {
            status: business.status,
            rating: business.rating,
            hasLogo: !!business.logoImage
        });

        return {
            id: business.id,
            type: 'business',
            position: [business.latitude, business.longitude],
            icon,
            data: business,
            popup: {
                content: `
                    <div class="marker-popup business-popup">
                        <div class="popup-header">
                            ${business.logoImage ?
                        `<img src="${business.logoImage}" alt="${business.name}" class="business-logo" />` :
                        '<div class="business-logo-placeholder"></div>'
                    }
                            <div class="business-info">
                                <h3>${business.name}</h3>
                                <div class="business-rating">
                                    ${business.rating ? `⭐ ${business.rating.toFixed(1)}` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="popup-content">
                            <p class="business-address">${business.address}</p>
                            ${business.phone ? `<p class="business-phone">📞 ${business.phone}</p>` : ''}
                            <div class="popup-actions">
                                <button class="btn-view-details" onclick="window.viewBusinessDetails('${business.id}')">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                `,
                options: {
                    maxWidth: 300,
                    className: 'custom-popup business-popup'
                }
            },
            tooltip: {
                content: business.name,
                options: {
                    permanent: false,
                    direction: 'top'
                }
            }
        };
    }, []);

    /**
     * Create marker for event
     * @param {Object} event - Event data
     * @returns {Object} Marker configuration
     */
    const createEventMarker = useCallback((event) => {
        const icon = createMarkerIcon('event', {
            status: event.status,
            type: event.type,
            startDate: event.startDate
        });

        return {
            id: event.id,
            type: 'event',
            position: [event.latitude, event.longitude],
            icon,
            data: event,
            popup: {
                content: `
                    <div class="marker-popup event-popup">
                        <div class="popup-header">
                            <h3>${event.title}</h3>
                            <span class="event-status event-${event.status}">${event.status}</span>
                        </div>
                        <div class="popup-content">
                            <p class="event-date">📅 ${new Date(event.startDate).toLocaleDateString()}</p>
                            <p class="event-location">📍 ${event.address}</p>
                            ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                            <div class="popup-actions">
                                <button class="btn-view-details" onclick="window.viewEventDetails('${event.id}')">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                `,
                options: {
                    maxWidth: 300,
                    className: 'custom-popup event-popup'
                }
            },
            tooltip: {
                content: event.title,
                options: {
                    permanent: false,
                    direction: 'top'
                }
            }
        };
    }, []);

    /**
     * Create custom marker
     * @param {Object} customData - Custom marker data
     * @returns {Object} Marker configuration
     */
    const createCustomMarker = useCallback((customData) => {
        const icon = createMarkerIcon(customData.markerType || 'location', {
            ...customData.iconOptions
        });

        return {
            id: customData.id,
            type: 'custom',
            position: [customData.latitude, customData.longitude],
            icon,
            data: customData,
            popup: customData.popup,
            tooltip: customData.tooltip
        };
    }, []);

    // =============================================================================
    // CLUSTER MANAGEMENT
    // =============================================================================

    /**
     * Create cluster group for marker type
     * @param {string} type - Marker type
     * @returns {Object} Cluster group configuration
     */
    const createClusterGroup = useCallback((type) => {
        if (!enableClustering) return null;

        const options = {
            ...clusterOptions,
            iconCreateFunction: (cluster) => createClusterIcon(cluster, type),
            maxClusterRadius: clusterOptions.maxClusterRadius || 50,
            disableClusteringAtZoom: clusterOptions.disableClusteringAtZoom || 16
        };

        return options;
    }, [enableClustering, clusterOptions]);

    // =============================================================================
    // FILTERING
    // =============================================================================

    /**
     * Apply filters to markers
     * @param {Array} markersToFilter - Markers to filter
     * @param {Object} filters - Filter configuration
     * @returns {Array} Filtered markers
     */
    const applyFilters = useMemo(() => {
        return (markersToFilter, filters) => {
            if (!filters || Object.keys(filters).length === 0) {
                return markersToFilter;
            }

            return markersToFilter.filter(marker => {
                const { data } = marker;

                // Text search filter
                if (filters.search) {
                    const searchTerm = filters.search.toLowerCase();
                    const searchableText = [
                        data.name,
                        data.title,
                        data.address,
                        data.description
                    ].filter(Boolean).join(' ').toLowerCase();

                    if (!searchableText.includes(searchTerm)) {
                        return false;
                    }
                }

                // Status filter
                if (filters.status && filters.status.length > 0) {
                    if (!filters.status.includes(data.status)) {
                        return false;
                    }
                }

                // Rating filter (for businesses)
                if (filters.minRating && marker.type === 'business') {
                    if (!data.rating || data.rating < filters.minRating) {
                        return false;
                    }
                }

                // Date range filter (for events)
                if (marker.type === 'event') {
                    if (filters.startDate || filters.endDate) {
                        const eventDate = new Date(data.startDate);
                        if (filters.startDate && eventDate < new Date(filters.startDate)) {
                            return false;
                        }
                        if (filters.endDate && eventDate > new Date(filters.endDate)) {
                            return false;
                        }
                    }

                    // Categories filter
                    if (filters.categories && filters.categories.length > 0) {
                        if (!data.categories || !data.categories.some(cat => filters.categories.includes(cat))) {
                            return false;
                        }
                    }
                }

                return true;
            });
        };
    }, []);

    /**
     * Calculate distance between two points
     * @param {number} lat1 - First point latitude
     * @param {number} lng1 - First point longitude
     * @param {number} lat2 - Second point latitude
     * @param {number} lng2 - Second point longitude
     * @returns {number} Distance in kilometers
     */
    const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // =============================================================================
    // MARKER LAYER MANAGEMENT
    // =============================================================================

    /**
     * Add markers to map
     * @param {Array} markersToAdd - Markers to add
     * @param {string} layerType - Layer type
     */
    const addMarkersToMap = useCallback((markersToAdd, layerType) => {
        if (!map || !markersToAdd.length) return;

        try {
            // Create or get layer group
            let layerGroup = layerGroupsRef.current[layerType];

            if (!layerGroup) {
                if (enableClustering && layerConfig[layerType]?.enabled) {
                    // Create cluster group - this should now work with the import
                    const clusterOptions = createClusterGroup(layerType);
                    layerGroup = L.markerClusterGroup(clusterOptions);
                } else {
                    // Create regular layer group
                    layerGroup = L.layerGroup();
                }

                layerGroupsRef.current[layerType] = layerGroup;
                layerGroup.addTo(map);
            } else {
                // Clear existing markers
                layerGroup.clearLayers();
            }

            // Add markers to layer with unique keys
            markersToAdd.forEach((markerConfig, index) => {
                const marker = L.marker(markerConfig.position, {
                    icon: markerConfig.icon,
                    title: markerConfig.data.name
                });

                // Add popup if configured
                if (markerConfig.popup) {
                    marker.bindPopup(markerConfig.popup.content, markerConfig.popup.options);
                }

                // Add tooltip if configured
                if (markerConfig.tooltip) {
                    marker.bindTooltip(markerConfig.tooltip.content, markerConfig.tooltip.options);
                }

                // Add event listeners
                marker.on('click', (e) => {
                    setSelectedMarker(markerConfig);
                    if (onMarkerClick) {
                        onMarkerClick(markerConfig, e);
                    }
                });

                marker.on('mouseover', (e) => {
                    setHoveredMarker(markerConfig);
                    if (onMarkerHover) {
                        onMarkerHover(markerConfig, e);
                    }
                });

                marker.on('mouseout', () => {
                    setHoveredMarker(null);
                });

                // Store marker reference with unique key
                if (!markerRefsRef.current[layerType]) {
                    markerRefsRef.current[layerType] = {};
                }
                const uniqueKey = `${markerConfig.id}-${index}`;
                markerRefsRef.current[layerType][uniqueKey] = marker;

                // Add to layer group
                layerGroup.addLayer(marker);
            });

            // Update layer state
            setMarkerLayers(prev => ({
                ...prev,
                [layerType]: layerGroup
            }));

        } catch (error) {
            console.error(`[useMarkers] Error adding ${layerType} markers:`, error);
        }
    }, [map, enableClustering, layerConfig, createClusterGroup, onMarkerClick, onMarkerHover]);

    /**
     * Remove markers from map
     * @param {string} layerType - Layer type to remove
     */
    const removeMarkersFromMap = useCallback((layerType) => {
        const layerGroup = layerGroupsRef.current[layerType];
        if (layerGroup && map) {
            map.removeLayer(layerGroup);
            delete layerGroupsRef.current[layerType];
            delete markerRefsRef.current[layerType];

            setMarkerLayers(prev => {
                const newLayers = { ...prev };
                delete newLayers[layerType];
                return newLayers;
            });
        }
    }, [map]);

    /**
     * Toggle layer visibility
     * @param {string} layerType - Layer type to toggle
     * @param {boolean} visible - Visibility state
     */
    const toggleLayer = useCallback((layerType, visible) => {
        const layerGroup = layerGroupsRef.current[layerType];
        if (!layerGroup || !map) return;

        if (visible) {
            if (!map.hasLayer(layerGroup)) {
                map.addLayer(layerGroup);
            }
        } else {
            if (map.hasLayer(layerGroup)) {
                map.removeLayer(layerGroup);
            }
        }
    }, [map]);

    // =============================================================================
    // DATA MANAGEMENT
    // =============================================================================

    /**
     * Update business markers
     * @param {Array} businesses - Business data array
     */
    const updateBusinessMarkers = useCallback((businesses) => {
        setIsLoading(true);
        try {
            const businessMarkers = businesses.slice(0, maxMarkers).map(createBusinessMarker);

            setMarkers(prev => ({
                ...prev,
                businesses: businessMarkers
            }));
        } catch (error) {
            console.error('[useMarkers] Error updating business markers:', error);
        } finally {
            setIsLoading(false);
        }
    }, [maxMarkers, createBusinessMarker]);

    /**
     * Update event markers
     * @param {Array} events - Event data array
     */
    const updateEventMarkers = useCallback((events) => {
        setIsLoading(true);
        try {
            const eventMarkers = events.slice(0, maxMarkers).map(createEventMarker);

            setMarkers(prev => ({
                ...prev,
                events: eventMarkers
            }));
        } catch (error) {
            console.error('[useMarkers] Error updating event markers:', error);
        } finally {
            setIsLoading(false);
        }
    }, [maxMarkers, createEventMarker]);

    /**
     * Add custom markers
     * @param {Array} customMarkers - Custom marker data array
     * @param {string} layerKey - Custom layer key
     */
    const addCustomMarkers = useCallback((customMarkers, layerKey = 'custom') => {
        setIsLoading(true);
        try {
            const customMarkerConfigs = customMarkers.map((customData, index) => ({
                ...createCustomMarker(customData),
                // Ensure unique IDs to prevent duplicate keys
                id: `${layerKey}-${customData.id || index}`
            }));

            setMarkers(prev => ({
                ...prev,
                [layerKey]: customMarkerConfigs
            }));
        } catch (error) {
            console.error('[useMarkers] Error adding custom markers:', error);
        } finally {
            setIsLoading(false);
        }
    }, [createCustomMarker]);

    /**
     * Remove marker by ID
     * @param {string} markerId - Marker ID to remove
     * @param {string} layerType - Layer type
     */
    const removeMarker = useCallback((markerId, layerType) => {
        setMarkers(prev => ({
            ...prev,
            [layerType]: prev[layerType].filter(marker => marker.id !== markerId)
        }));

        // Remove from map reference
        if (markerRefsRef.current[layerType] && markerRefsRef.current[layerType][markerId]) {
            const marker = markerRefsRef.current[layerType][markerId];
            const layerGroup = layerGroupsRef.current[layerType];
            if (layerGroup && marker) {
                layerGroup.removeLayer(marker);
            }
            delete markerRefsRef.current[layerType][markerId];
        }
    }, []);

    /**
     * Clear all markers from layer
     * @param {string} layerType - Layer type to clear
     */
    const clearMarkers = useCallback((layerType) => {
        setMarkers(prev => ({
            ...prev,
            [layerType]: []
        }));

        removeMarkersFromMap(layerType);
    }, [removeMarkersFromMap]);

    // =============================================================================
    // EFFECTS
    // =============================================================================

    // Apply filters when markers or activeFilters change
    useEffect(() => {
        const filtered = {};

        Object.entries(markers).forEach(([layerType, markersArray]) => {
            const layerFilters = activeFilters[layerType] || activeFilters.global || {};
            filtered[layerType] = applyFilters(markersArray, layerFilters);
        });

        setFilteredMarkers(filtered);
    }, [markers, activeFilters]);

    // Update map when filtered markers change
    useEffect(() => {
        Object.entries(filteredMarkers).forEach(([layerType, markersArray]) => {
            if (markersArray.length > 0) {
                addMarkersToMap(markersArray, layerType);
            } else {
                removeMarkersFromMap(layerType);
            }
        });
    }, [filteredMarkers]);

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    /**
     * Get marker by ID
     * @param {string} markerId - Marker ID
     * @param {string} layerType - Layer type
     * @returns {Object|null} Marker configuration
     */
    const getMarkerById = useCallback((markerId, layerType) => {
        const layerMarkers = markers[layerType] || [];
        return layerMarkers.find(marker => marker.id === markerId) || null;
    }, [markers]);

    /**
     * Get markers within bounds
     * @param {Object} bounds - Map bounds
     * @param {string} layerType - Layer type (optional)
     * @returns {Array} Markers within bounds
     */
    const getMarkersInBounds = useCallback((bounds, layerType = null) => {
        const checkBounds = (marker) => {
            const [lat, lng] = marker.position;
            return lat >= bounds.south && lat <= bounds.north &&
                lng >= bounds.west && lng <= bounds.east;
        };

        if (layerType) {
            return (filteredMarkers[layerType] || []).filter(checkBounds);
        }

        const allMarkers = [];
        Object.values(filteredMarkers).forEach(layerMarkers => {
            allMarkers.push(...layerMarkers.filter(checkBounds));
        });

        return allMarkers;
    }, [filteredMarkers]);

    /**
     * Get marker statistics
     * @returns {Object} Marker statistics
     */
    const getMarkerStats = useMemo(() => {
        const stats = {
            total: 0,
            visible: 0,
            filtered: 0,
            byType: {}
        };

        Object.entries(markers).forEach(([type, markersArray]) => {
            const filteredCount = filteredMarkers[type]?.length || 0;

            const typeStats = {
                total: markersArray.length,
                visible: filteredCount,
                filtered: markersArray.length - filteredCount
            };

            stats.byType[type] = typeStats;
            stats.total += typeStats.total;
            stats.visible += typeStats.visible;
            stats.filtered += typeStats.filtered;
        });

        return stats;
    }, [markers, filteredMarkers]);

    // =============================================================================
    // CLEANUP
    // =============================================================================

    useEffect(() => {
        return () => {
            // Clean up all layer groups
            Object.values(layerGroupsRef.current).forEach(layerGroup => {
                if (map && layerGroup) {
                    map.removeLayer(layerGroup);
                }
            });
        };
    }, [map]);

    // =============================================================================
    // RETURN HOOK INTERFACE
    // =============================================================================

    return {
        // Marker data
        markers,
        filteredMarkers,
        markerLayers,
        clusterGroups,

        // Selection state
        selectedMarker,
        hoveredMarker,

        // Loading state
        isLoading,

        // Filter management
        activeFilters,
        setActiveFilters,

        // Marker operations
        updateBusinessMarkers,
        updateEventMarkers,
        addCustomMarkers,
        removeMarker,
        clearMarkers,

        // Layer management
        toggleLayer,
        removeMarkersFromMap,

        // Utility methods
        getMarkerById,
        getMarkersInBounds,
        getMarkerStats,

        // Manual triggers
        refreshMarkers: () => {
            Object.entries(filteredMarkers).forEach(([layerType, markersArray]) => {
                if (markersArray.length > 0) {
                    addMarkersToMap(markersArray, layerType);
                }
            });
        }
    };
};

export default useMarkers;