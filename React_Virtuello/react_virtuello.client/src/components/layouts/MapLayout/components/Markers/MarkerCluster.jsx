import React, { useMemo, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import './MarkerCluster.css';

const MarkerCluster = ({
    items = [],
    center,
    zoomLevel = 10,
    onClusterClick,
    onItemSelect,
    maxZoomForClustering = 16,
    clusterRadius = 50,
    apiBaseUrl = ''
}) => {
    const { t } = useTranslation();

    // Calculate clusters based on zoom level and proximity
    const clusters = useMemo(() => {
        if (zoomLevel >= maxZoomForClustering || items.length <= 1) {
            // Don't cluster at high zoom levels or with few items
            return items.map(item => ({
                type: 'single',
                item,
                position: [parseFloat(item.latitude), parseFloat(item.longitude)],
                id: item.id
            }));
        }

        const clustered = [];
        const processed = new Set();
        const radiusInDegrees = clusterRadius / (111320 * Math.cos(center[0] * Math.PI / 180));

        items.forEach((item, index) => {
            if (processed.has(index)) return;

            const itemLat = parseFloat(item.latitude);
            const itemLng = parseFloat(item.longitude);
            const cluster = {
                type: 'cluster',
                items: [item],
                businesses: item.name ? [item] : [],
                events: item.eventCategory ? [item] : [],
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

                const otherLat = parseFloat(otherItem.latitude);
                const otherLng = parseFloat(otherItem.longitude);
                const distance = Math.sqrt(
                    Math.pow(itemLat - otherLat, 2) + Math.pow(itemLng - otherLng, 2)
                );

                if (distance <= radiusInDegrees) {
                    cluster.items.push(otherItem);
                    if (otherItem.name) cluster.businesses.push(otherItem);
                    if (otherItem.eventCategory) cluster.events.push(otherItem);

                    // Update bounds
                    cluster.bounds.north = Math.max(cluster.bounds.north, otherLat);
                    cluster.bounds.south = Math.min(cluster.bounds.south, otherLat);
                    cluster.bounds.east = Math.max(cluster.bounds.east, otherLng);
                    cluster.bounds.west = Math.min(cluster.bounds.west, otherLng);

                    processed.add(otherIndex);
                }
            });

            // Calculate cluster center
            const centerLat = cluster.items.reduce((sum, item) => sum + parseFloat(item.latitude), 0) / cluster.items.length;
            const centerLng = cluster.items.reduce((sum, item) => sum + parseFloat(item.longitude), 0) / cluster.items.length;
            cluster.position = [centerLat, centerLng];
            cluster.id = `cluster-${centerLat}-${centerLng}`;

            // If only one item, treat as single marker
            if (cluster.items.length === 1) {
                clustered.push({
                    type: 'single',
                    item: cluster.items[0],
                    position: cluster.position,
                    id: cluster.items[0].id
                });
            } else {
                clustered.push(cluster);
            }
        });

        return clustered;
    }, [items, center, zoomLevel, maxZoomForClustering, clusterRadius]);

    // Create cluster icon
    const createClusterIcon = useCallback((cluster) => {
        const count = cluster.items.length;
        const businessCount = cluster.businesses.length;
        const eventCount = cluster.events.length;

        // Determine size based on count
        let size = 40;
        if (count > 100) size = 70;
        else if (count > 50) size = 60;
        else if (count > 10) size = 50;

        // Determine primary color based on content
        let primaryColor = '#6C5CE7';
        if (businessCount > eventCount) primaryColor = '#0984E3';
        else if (eventCount > businessCount) primaryColor = '#E17055';

        const svgIcon = `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="cluster-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                    <linearGradient id="cluster-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0.8" />
                    </linearGradient>
                </defs>
                
                <!-- Outer ring -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" 
                        fill="url(#cluster-gradient)" 
                        stroke="white" 
                        stroke-width="3" 
                        filter="url(#cluster-shadow)"
                        class="cluster-outer"/>
                
                <!-- Inner circle -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" 
                        fill="white" 
                        opacity="0.9"/>
                
                <!-- Count text -->
                <text x="${size / 2}" y="${size / 2 + 4}" 
                      text-anchor="middle" 
                      font-family="'Google Sans', 'Roboto', sans-serif"
                      font-size="${size > 50 ? '14' : '12'}" 
                      font-weight="600" 
                      fill="${primaryColor}">
                    ${count > 999 ? '999+' : count}
                </text>
                
                <!-- Type indicators -->
                ${businessCount > 0 && eventCount > 0 ? `
                    <g transform="translate(${size / 2}, ${size / 2 + 12})">
                        <circle cx="-6" cy="0" r="3" fill="#0984E3" opacity="0.8"/>
                        <circle cx="6" cy="0" r="3" fill="#E17055" opacity="0.8"/>
                    </g>
                ` : ''}
            </svg>
        `;

        return L.divIcon({
            html: svgIcon,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2],
            className: 'marker-cluster-icon'
        });
    }, []);

    // Handle cluster click
    const handleClusterClick = useCallback((e, cluster) => {
        e.originalEvent?.stopPropagation();

        if (onClusterClick) {
            onClusterClick(cluster);
        } else {
            // Default behavior: zoom to fit cluster bounds
            const map = e.target._map;
            if (map && cluster.bounds) {
                const bounds = L.latLngBounds([
                    [cluster.bounds.south, cluster.bounds.west],
                    [cluster.bounds.north, cluster.bounds.east]
                ]);
                map.fitBounds(bounds, { padding: [20, 20] });
            }
        }
    }, [onClusterClick]);

    // Render cluster popup content
    const renderClusterPopup = (cluster) => {
        const businessCount = cluster.businesses.length;
        const eventCount = cluster.events.length;

        return (
            <div className="cluster-popup">
                <div className="cluster-popup__header">
                    <h3 className="cluster-popup__title">
                        {t('map.cluster_title', { count: cluster.items.length })}
                    </h3>
                    <div className="cluster-popup__summary">
                        {businessCount > 0 && (
                            <span className="cluster-popup__count cluster-popup__count--business">
                                {businessCount} {t('map.businesses')}
                            </span>
                        )}
                        {eventCount > 0 && (
                            <span className="cluster-popup__count cluster-popup__count--event">
                                {eventCount} {t('map.events')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="cluster-popup__content">
                    {/* Show sample items */}
                    <div className="cluster-popup__samples">
                        {cluster.items.slice(0, 5).map((item, index) => (
                            <div
                                key={item.id}
                                className="cluster-popup__item"
                                onClick={() => onItemSelect?.(item)}
                            >
                                <div className="cluster-popup__item-icon">
                                    {item.name ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5S13.38,11.5 12,11.5z" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="cluster-popup__item-content">
                                    <div className="cluster-popup__item-name">
                                        {item.name}
                                    </div>
                                    {item.eventCategory && (
                                        <div className="cluster-popup__item-category">
                                            {item.eventCategory.name}
                                        </div>
                                    )}
                                    {item.address && (
                                        <div className="cluster-popup__item-address">
                                            {item.address.substring(0, 40)}
                                            {item.address.length > 40 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {cluster.items.length > 5 && (
                            <div className="cluster-popup__more">
                                +{cluster.items.length - 5} {t('map.more_items')}
                            </div>
                        )}
                    </div>

                    <div className="cluster-popup__actions">
                        <button
                            className="cluster-popup__action"
                            onClick={() => handleClusterClick({
                                target: { _map: window.map },
                                originalEvent: { stopPropagation: () => { } }
                            }, cluster)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5,14H20.5L15.5,9V14M4,3H18A2,2 0 0,1 20,5V19A2,2 0 0,1 18,21H4A2,2 0 0,1 2,19V5A2,2 0 0,1 4,3M4,7V19H18V7H4Z" />
                            </svg>
                            {t('map.zoom_to_area')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {clusters.map((cluster) => {
                if (cluster.type === 'single') {
                    // Return null here - single items will be handled by BusinessMarker/EventMarker
                    return null;
                }

                return (
                    <Marker
                        key={cluster.id}
                        position={cluster.position}
                        icon={createClusterIcon(cluster)}
                        eventHandlers={{
                            click: (e) => handleClusterClick(e, cluster)
                        }}
                    >
                        <Popup
                            closeOnClick={false}
                            closeButton={true}
                            className="cluster-popup-container"
                            maxWidth={350}
                            minWidth={300}
                        >
                            {renderClusterPopup(cluster)}
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

export default MarkerCluster;