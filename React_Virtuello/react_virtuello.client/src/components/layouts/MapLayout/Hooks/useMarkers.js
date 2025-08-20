/**
 * useMarkers Hook - Map Markers Management
 * Manages business and event markers, clustering, filtering, and interactions
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
                            ${business.logoImage ? `<img src="${business.logoImage}" alt="${business.name}" class="popup-logo" />` : ''}
                            <h3>${business.name}</h3>
                            ${business.rating ? `<div class="rating">${'★'.repeat(Math.floor(business.rating))}</div>` : ''}
                        </div>
                        <div class="popup-content">
                            <p>${business.description || ''}</p>
                            <div class="popup-details">
                                <span class="address">${business.address || ''}</span>
                                ${business.phone ? `<span class="phone">${business.phone}</span>` : ''}
                            </div>
                        </div>
                        <div class="popup-actions">
                            <button onclick="window.openBusinessDetails('${business.id}')" class="btn-primary">
                                View Details
                            </button>
                        </div>
                    </div>
                `,
                options: {
                    maxWidth: 300,
                    className: 'custom-popup business-popup'
                }
            },
            tooltip: {
                content: `<strong>${business.name}</strong><br/>${business.address || ''}`,
                options: {
                    permanent: false,
                    direction: 'top',
                    className: 'custom-tooltip'
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
            isUpcoming: new Date(event.startDate) > new Date()
        });

        const startDate = new Date(event.startDate).toLocaleDateString();

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
                            ${event.coverImage ? `<img src="${event.coverImage}" alt="${event.name}" class="popup-cover" />` : ''}
                            <h3>${event.name}</h3>
                            <span class="event-type ${event.type.toLowerCase()}">${event.type}</span>
                        </div>
                        <div class="popup-content">
                            <p>${event.description || ''}</p>
                            <div class="popup-details">
                                <span class="date">📅 ${startDate}</span>
                                <span class="address">📍 ${event.address || ''}</span>
                                <span class="status status-${event.status.toLowerCase()}">${event.status}</span>
                            </div>
                        </div>
                        <div class="popup-actions">
                            <button onclick="window.openEventDetails('${event.id}')" class="btn-primary">
                                View Details
                            </button>
                        </div>
                    </div>
                `,
                options: {
                    maxWidth: 300,
                    className: 'custom-popup event-popup'
                }
            },
            tooltip: {
                content: `<strong>${event.name}</strong><br/>${startDate}`,
                options: {
                    permanent: false,
                    direction: 'top',
                    className: 'custom-tooltip'
                }
            }
        };
    }, []);

    /**
     * Create custom marker
     * @param {Object} markerData - Custom marker data
     * @returns {Object} Marker configuration
     */
    const createCustomMarker = useCallback((markerData) => {
        const icon = createMarkerIcon('custom', markerData.iconOptions || {});

        return {
            id: markerData.id,
            type: 'custom',
            position: [markerData.latitude, markerData.longitude],
            icon,
            data: markerData,
            popup: markerData.popup,
            tooltip: markerData.tooltip
        };
    }, []);

    // =============================================================================
    // FILTERING UTILITIES
    // =============================================================================

    /**
     * Apply filters to markers
     * @param {Array} markersArray - Array of markers to filter
     * @param {Object} filters - Filter configuration
     * @param {string} type - Marker type ('business' | 'event')
     * @returns {Array} Filtered markers
     */
    const applyFilters = useCallback((markersArray, filters, type) => {
        if (!filters || Object.keys(filters).length === 0) {
            return markersArray;
        }

        return markersArray.filter(marker => {
            const data = marker.data;

            // Status filter
            if (filters.status && !filters.status.includes(data.status)) {
                return false;
            }

            // Search text filter
            if (filters.search) {
                const searchText = filters.search.toLowerCase();
                const searchableText = `${data.name} ${data.description || ''} ${data.address || ''}`.toLowerCase();
                if (!searchableText.includes(searchText)) {
                    return false;
                }
            }

            // Distance filter
            if (filters.center && filters.distance) {
                const distance = calculateDistance(
                    filters.center.lat, filters.center.lng,
                    data.latitude, data.longitude
                );
                if (distance > filters.distance) {
                    return false;
                }
            }

            // Type-specific filters
            if (type === 'business') {
                // Tags filter
                if (filters.tags && filters.tags.length > 0) {
                    if (!data.tags || !data.tags.some(tag => filters.tags.includes(tag))) {
                        return false;
                    }
                }

                // Rating filter
                if (filters.minRating && data.rating < filters.minRating) {
                    return false;
                }
            }

            if (type === 'event') {
                // Event type filter
                if (filters.eventType && !filters.eventType.includes(data.type)) {
                    return false;
                }

                // Date range filter
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
                    // Create cluster group
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

            // Add markers to layer
            markersToAdd.forEach(markerConfig => {
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

                // Store marker reference
                if (!markerRefsRef.current[layerType]) {
                    markerRefsRef.current[layerType] = {};
                }
                markerRefsRef.current[layerType][markerConfig.id] = marker;

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
            const businessMarkers = businesses
                .slice(0, maxMarkers)
                .map(createBusinessMarker);

            setMarkers(prev => ({
                ...prev,
                businesses: businessMarkers
            }));
        } catch (error) {
            console.error('[useMarkers] Error updating business markers:', error);
        } finally {
            setIsLoading(false);
        }
    }, [createBusinessMarker, maxMarkers]);

    /**
     * Update event markers
     * @param {Array} events - Event data array
     */
    const updateEventMarkers = useCallback((events) => {
        setIsLoading(true);

        try {
            const eventMarkers = events
                .slice(0, maxMarkers)
                .map(createEventMarker);

            setMarkers(prev => ({
                ...prev,
                events: eventMarkers
            }));
        } catch (error) {
            console.error('[useMarkers] Error updating event markers:', error);
        } finally {
            setIsLoading(false);
        }
    }, [createEventMarker, maxMarkers]);

    /**
     * Add custom markers
     * @param {Array} customMarkers - Custom marker data array
     */
    const addCustomMarkers = useCallback((customMarkers) => {
        try {
            const customMarkerConfigs = customMarkers.map(createCustomMarker);

            setMarkers(prev => ({
                ...prev,
                custom: [...prev.custom, ...customMarkerConfigs]
            }));
        } catch (error) {
            console.error('[useMarkers] Error adding custom markers:', error);
        }
    }, [createCustomMarker]);

    /**
     * Remove specific marker
     * @param {string} markerId - Marker ID to remove
     * @param {string} layerType - Layer type
     */
    const removeMarker = useCallback((markerId, layerType) => {
        setMarkers(prev => ({
            ...prev,
            [layerType]: prev[layerType].filter(marker => marker.id !== markerId)
        }));

        // Remove from map
        const markerRef = markerRefsRef.current[layerType]?.[markerId];
        const layerGroup = layerGroupsRef.current[layerType];

        if (markerRef && layerGroup) {
            layerGroup.removeLayer(markerRef);
            delete markerRefsRef.current[layerType][markerId];
        }
    }, []);

    /**
     * Clear all markers
     * @param {string} layerType - Optional layer type to clear (clears all if not specified)
     */
    const clearMarkers = useCallback((layerType = null) => {
        if (layerType) {
            setMarkers(prev => ({
                ...prev,
                [layerType]: []
            }));
            removeMarkersFromMap(layerType);
        } else {
            setMarkers({
                businesses: [],
                events: [],
                routes: [],
                custom: []
            });

            Object.keys(layerGroupsRef.current).forEach(removeMarkersFromMap);
        }
    }, [removeMarkersFromMap]);

    // =============================================================================
    // FILTER EFFECTS
    // =============================================================================

    /**
     * Apply filters to all marker types
     */
    useEffect(() => {
        const newFilteredMarkers = {
            businesses: applyFilters(markers.businesses, activeFilters.businesses, 'business'),
            events: applyFilters(markers.events, activeFilters.events, 'event'),
            routes: markers.routes, // Routes typically don't need filtering
            custom: applyFilters(markers.custom, activeFilters.custom, 'custom')
        };

        setFilteredMarkers(newFilteredMarkers);
    }, [markers, activeFilters, applyFilters]);

    /**
     * Update map layers when filtered markers change
     */
    useEffect(() => {
        Object.entries(filteredMarkers).forEach(([layerType, markersArray]) => {
            if (layerConfig[layerType]?.enabled && markersArray.length > 0) {
                addMarkersToMap(markersArray, layerType);
            }
        });
    }, [filteredMarkers, layerConfig, addMarkersToMap]);

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
        return markers[layerType]?.find(marker => marker.id === markerId) || null;
    }, [markers]);

    /**
     * Get markers within bounds
     * @param {Object} bounds - Geographic bounds
     * @param {string} layerType - Layer type
     * @returns {Array} Markers within bounds
     */
    const getMarkersInBounds = useCallback((bounds, layerType = null) => {
        const checkBounds = (marker) => {
            const [lat, lng] = marker.position;
            return lat >= bounds.south && lat <= bounds.north &&
                lng >= bounds.west && lng <= bounds.east;
        };

        if (layerType) {
            return filteredMarkers[layerType]?.filter(checkBounds) || [];
        }

        // Return all markers within bounds
        return Object.values(filteredMarkers).flat().filter(checkBounds);
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
            const typeStats = {
                total: markersArray.length,
                visible: filteredMarkers[type]?.length || 0,
                filtered: markersArray.length - (filteredMarkers[type]?.length || 0)
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