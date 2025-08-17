// =============================================================================
// MAP MARKER MANAGER COMPONENT - Manages business/event markers and clustering
// =============================================================================
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import BusinessMarker from '../Markers/BusinessMarker';
import EventMarker from '../Markers/EventMarker';
import MarkerCluster from '../Markers/MarkerCluster';
import { markerUtils } from '../../utils/markerUtils';
import { geoUtils } from '../../utils/geoUtils';
import { MAP_CONFIG } from '../../utils/mapConstants';

const MapMarkerManager = ({
    businesses = [],
    events = [],
    userLocation,
    selectedMarker,
    hoveredMarker,
    onBusinessClick,
    onBusinessHover,
    onEventClick,
    onEventHover,
    onMarkerSelect,
    onMarkerHover,
    clustering = true,
    zoom = 12,
    bounds,
    maxMarkersBeforeClustering = 50,
    clusterRadius = 50,
    apiBaseUrl = ''
}) => {
    const { t } = useTranslation();
    const [visibleMarkers, setVisibleMarkers] = useState([]);
    const [markersLoaded, setMarkersLoaded] = useState(false);

    // Filter items within current viewport
    const viewportItems = useMemo(() => {
        if (!bounds) return { businesses, events };

        const visibleBusinesses = businesses.filter(business =>
            geoUtils.isPointInBounds(
                { lat: business.latitude, lng: business.longitude },
                bounds
            )
        );

        const visibleEvents = events.filter(event =>
            geoUtils.isPointInBounds(
                { lat: event.latitude, lng: event.longitude },
                bounds
            )
        );

        return {
            businesses: visibleBusinesses,
            events: visibleEvents
        };
    }, [businesses, events, bounds]);

    // Combine all items for clustering calculation
    const allItems = useMemo(() => {
        const businessItems = viewportItems.businesses.map(business => ({
            ...business,
            type: 'business',
            position: [parseFloat(business.latitude), parseFloat(business.longitude)]
        }));

        const eventItems = viewportItems.events.map(event => ({
            ...event,
            type: 'event',
            position: [parseFloat(event.latitude), parseFloat(event.longitude)]
        }));

        return [...businessItems, ...eventItems];
    }, [viewportItems]);

    // Determine if clustering should be active
    const shouldCluster = useMemo(() => {
        return clustering &&
            zoom < MAP_CONFIG.MAX_ZOOM_FOR_CLUSTERING &&
            allItems.length > maxMarkersBeforeClustering;
    }, [clustering, zoom, allItems.length, maxMarkersBeforeClustering]);

    // Create clusters if needed
    const clusters = useMemo(() => {
        if (!shouldCluster) {
            return allItems.map(item => ({
                type: 'single',
                item,
                position: item.position,
                id: `${item.type}-${item.id}`
            }));
        }

        // Use the existing MarkerCluster logic
        const mapCenter = bounds ? [
            (bounds.north + bounds.south) / 2,
            (bounds.east + bounds.west) / 2
        ] : MAP_CONFIG.DEFAULT_CENTER;

        return createClusters(allItems, mapCenter, zoom, clusterRadius);
    }, [allItems, shouldCluster, bounds, zoom, clusterRadius]);

    // Create clusters manually (simplified version)
    const createClusters = (items, center, zoomLevel, radius) => {
        if (zoomLevel >= MAP_CONFIG.MAX_ZOOM_FOR_CLUSTERING || items.length <= 1) {
            return items.map(item => ({
                type: 'single',
                item,
                position: item.position,
                id: `${item.type}-${item.id}`
            }));
        }

        const clustered = [];
        const processed = new Set();
        const radiusInDegrees = radius / (111320 * Math.cos(center[0] * Math.PI / 180));

        items.forEach((item, index) => {
            if (processed.has(index)) return;

            const itemLat = item.position[0];
            const itemLng = item.position[1];
            const cluster = {
                type: 'cluster',
                items: [item],
                businesses: item.type === 'business' ? [item] : [],
                events: item.type === 'event' ? [item] : [],
                position: [itemLat, itemLng],
                bounds: {
                    north: itemLat,
                    south: itemLat,
                    east: itemLng,
                    west: itemLng
                }
            };

            processed.add(index);

            // Find nearby items to cluster
            items.forEach((otherItem, otherIndex) => {
                if (processed.has(otherIndex)) return;

                const otherLat = otherItem.position[0];
                const otherLng = otherItem.position[1];
                const distance = Math.sqrt(
                    Math.pow(itemLat - otherLat, 2) + Math.pow(itemLng - otherLng, 2)
                );

                if (distance <= radiusInDegrees) {
                    cluster.items.push(otherItem);
                    if (otherItem.type === 'business') cluster.businesses.push(otherItem);
                    if (otherItem.type === 'event') cluster.events.push(otherItem);

                    // Update bounds
                    cluster.bounds.north = Math.max(cluster.bounds.north, otherLat);
                    cluster.bounds.south = Math.min(cluster.bounds.south, otherLat);
                    cluster.bounds.east = Math.max(cluster.bounds.east, otherLng);
                    cluster.bounds.west = Math.min(cluster.bounds.west, otherLng);

                    processed.add(otherIndex);
                }
            });

            // Calculate cluster center
            const centerLat = cluster.items.reduce((sum, item) => sum + item.position[0], 0) / cluster.items.length;
            const centerLng = cluster.items.reduce((sum, item) => sum + item.position[1], 0) / cluster.items.length;
            cluster.position = [centerLat, centerLng];
            cluster.id = `cluster-${cluster.items.map(item => `${item.type}-${item.id}`).join('-')}`;

            // If only one item, make it a single marker
            if (cluster.items.length === 1) {
                clustered.push({
                    type: 'single',
                    item: cluster.items[0],
                    position: cluster.items[0].position,
                    id: `${cluster.items[0].type}-${cluster.items[0].id}`
                });
            } else {
                clustered.push(cluster);
            }
        });

        return clustered;
    };

    // Optimize markers for current zoom level
    const optimizedClusters = useMemo(() => {
        return markerUtils.optimizeMarkersForZoom(clusters, zoom, bounds);
    }, [clusters, zoom, bounds]);

    // Staggered marker loading animation
    useEffect(() => {
        setMarkersLoaded(false);
        const timer = setTimeout(() => {
            setMarkersLoaded(true);
        }, 100);

        return () => clearTimeout(timer);
    }, [optimizedClusters]);

    // Handle business marker interactions
    const handleBusinessMarkerClick = useCallback((businessId, businessData) => {
        onBusinessClick?.(businessId, businessData);
        onMarkerSelect?.(businessId, businessData, 'business');
    }, [onBusinessClick, onMarkerSelect]);

    const handleBusinessMarkerHover = useCallback((businessId, businessData) => {
        onBusinessHover?.(businessId, businessData);
        onMarkerHover?.(businessId, businessData, 'business');
    }, [onBusinessHover, onMarkerHover]);

    // Handle event marker interactions
    const handleEventMarkerClick = useCallback((eventId, eventData) => {
        onEventClick?.(eventId, eventData);
        onMarkerSelect?.(eventId, eventData, 'event');
    }, [onEventClick, onMarkerSelect]);

    const handleEventMarkerHover = useCallback((eventId, eventData) => {
        onEventHover?.(eventId, eventData);
        onMarkerHover?.(eventId, eventData, 'event');
    }, [onEventHover, onMarkerHover]);

    // Handle cluster interactions
    const handleClusterClick = useCallback((clusterId, clusterData) => {
        // Zoom into cluster bounds
        if (clusterData.bounds && bounds) {
            const expandedBounds = geoUtils.expandBounds(clusterData.bounds, 0.1);
            onMarkerSelect?.(clusterId, { bounds: expandedBounds }, 'cluster');
        }
    }, [onMarkerSelect, bounds]);

    // User location marker
    const userLocationMarker = useMemo(() => {
        if (!userLocation || !markersLoaded) return null;

        const userMarker = markerUtils.createUserLocationMarker(
            userLocation,
            false,
            false,
            userLocation.accuracy
        );

        return (
            <Marker
                key="user-location"
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                    className: 'user-location-marker',
                    html: `
                        <div class="user-location-marker__dot">
                            <div class="user-location-marker__pulse"></div>
                        </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })}
                zIndexOffset={1001}
            />
        );
    }, [userLocation, markersLoaded]);

    // Render markers with staggered animation
    const renderMarkers = useMemo(() => {
        if (!markersLoaded) return [];

        return optimizedClusters.map((cluster, index) => {
            const animationDelay = Math.min(index * 50, 1000); // Max 1 second delay

            if (cluster.type === 'single') {
                const { item } = cluster;
                const isSelected = selectedMarker?.id === `${item.type}-${item.id}`;
                const isHovered = hoveredMarker?.id === `${item.type}-${item.id}`;

                if (item.type === 'business') {
                    return (
                        <BusinessMarker
                            key={`business-${item.id}`}
                            business={item}
                            isSelected={isSelected}
                            isHovered={isHovered}
                            onSelect={() => handleBusinessMarkerClick(item.id, item)}
                            onHover={() => handleBusinessMarkerHover(item.id, item)}
                            apiBaseUrl={apiBaseUrl}
                            zoomLevel={zoom}
                            animationDelay={animationDelay}
                        />
                    );
                } else if (item.type === 'event') {
                    return (
                        <EventMarker
                            key={`event-${item.id}`}
                            event={item}
                            isSelected={isSelected}
                            isHovered={isHovered}
                            onSelect={() => handleEventMarkerClick(item.id, item)}
                            onHover={() => handleEventMarkerHover(item.id, item)}
                            apiBaseUrl={apiBaseUrl}
                            zoomLevel={zoom}
                            animationDelay={animationDelay}
                        />
                    );
                }
            } else if (cluster.type === 'cluster') {
                return (
                    <MarkerCluster
                        key={cluster.id}
                        items={cluster.items}
                        center={cluster.position}
                        zoomLevel={zoom}
                        onClusterClick={() => handleClusterClick(cluster.id, cluster)}
                        onItemSelect={(itemId, itemData, itemType) => {
                            if (itemType === 'business') {
                                handleBusinessMarkerClick(itemId, itemData);
                            } else {
                                handleEventMarkerClick(itemId, itemData);
                            }
                        }}
                        apiBaseUrl={apiBaseUrl}
                        animationDelay={animationDelay}
                    />
                );
            }

            return null;
        });
    }, [
        optimizedClusters,
        markersLoaded,
        selectedMarker,
        hoveredMarker,
        zoom,
        apiBaseUrl,
        handleBusinessMarkerClick,
        handleBusinessMarkerHover,
        handleEventMarkerClick,
        handleEventMarkerHover,
        handleClusterClick
    ]);

    // Update visible markers count for performance monitoring
    useEffect(() => {
        setVisibleMarkers(renderMarkers.length);
    }, [renderMarkers.length]);

    // Performance warning for too many markers
    useEffect(() => {
        if (allItems.length > 200 && !shouldCluster) {
            console.warn(`MapMarkerManager: Rendering ${allItems.length} markers without clustering may impact performance`);
        }
    }, [allItems.length, shouldCluster]);

    return (
        <>
            {/* User Location Marker */}
            {userLocationMarker}

            {/* Business and Event Markers */}
            {renderMarkers}

            {/* Debug Info (Development only) */}
            {process.env.NODE_ENV === 'development' && (
                <div
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        zIndex: 1000,
                        pointerEvents: 'none'
                    }}
                >
                    <div>Zoom: {zoom}</div>
                    <div>Total Items: {allItems.length}</div>
                    <div>Visible Markers: {visibleMarkers}</div>
                    <div>Clustering: {shouldCluster ? 'ON' : 'OFF'}</div>
                    <div>Businesses: {viewportItems.businesses.length}</div>
                    <div>Events: {viewportItems.events.length}</div>
                </div>
            )}
        </>
    );
};

export default MapMarkerManager;