import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import BusinessMarker from '../BusinessMarker/BusinessMarker';
import EventMarker from '../EventMarker/EventMarker';
import { mapUtils } from '../../utils/mapUtils';
import 'leaflet/dist/leaflet.css';
import './MapContainer.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map event handler component
const MapEventHandler = ({ onMapClick, onMapLoad, onBoundsChange }) => {
    const map = useMap();

    useMapEvents({
        click: (e) => {
            if (onMapClick) {
                onMapClick(e.latlng, e);
            }
        },
        moveend: () => {
            if (onBoundsChange) {
                const bounds = map.getBounds();
                onBoundsChange({
                    north: bounds.getNorth(),
                    south: bounds.getSouth(),
                    east: bounds.getEast(),
                    west: bounds.getWest()
                });
            }
        },
        zoomend: () => {
            if (onBoundsChange) {
                const bounds = map.getBounds();
                onBoundsChange({
                    north: bounds.getNorth(),
                    south: bounds.getSouth(),
                    east: bounds.getEast(),
                    west: bounds.getWest()
                });
            }
        }
    });

    useEffect(() => {
        if (onMapLoad) {
            onMapLoad(map);
        }
    }, [map, onMapLoad]);

    return null;
};

// Map center controller component
const MapCenterController = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center && Array.isArray(center) && center.length === 2) {
            map.setView(center, zoom || map.getZoom());
        }
    }, [map, center, zoom]);

    return null;
};

// Main MapContainer component
const MapContainer = ({
    // Map configuration
    center = mapUtils.DEFAULT_CONFIG.center,
    zoom = mapUtils.DEFAULT_CONFIG.zoom,
    className = '',
    style = {},

    // Data
    businesses = [],
    events = [],

    // Filtering
    filteredBusinesses = [],
    filteredEvents = [],

    // Tile layer
    tileLayer = 'openStreetMap',

    // Event handlers
    onMapClick,
    onMapLoad,
    onBoundsChange,
    onMarkerClick,

    // Selected items
    selectedBusiness = null,
    selectedEvent = null,

    // Configuration
    showBusinesses = true,
    showEvents = true,
    clustering = false,

    // API configuration
    apiBaseUrl = ''
}) => {
    const { t } = useTranslation();
    const mapRef = useRef();
    const [loading, setLoading] = useState(true);
    const [mapInstance, setMapInstance] = useState(null);

    // Get tile layer configuration
    const tileLayerConfig = mapUtils.TILE_LAYERS[tileLayer] || mapUtils.TILE_LAYERS.openStreetMap;
    const { url: tileLayerUrl, attribution: tileLayerAttribution } = tileLayerConfig;

    // Handle map load
    const handleMapLoad = useCallback((map) => {
        setMapInstance(map);
        setLoading(false);
        if (onMapLoad) {
            onMapLoad(map);
        }
    }, [onMapLoad]);

    // Handle map click
    const handleMapClick = useCallback((latlng, event) => {
        if (onMapClick) {
            onMapClick(latlng, event);
        }
    }, [onMapClick]);

    // Handle bounds change
    const handleBoundsChange = useCallback((bounds) => {
        if (onBoundsChange) {
            onBoundsChange(bounds);
        }
    }, [onBoundsChange]);

    // Handle marker click
    const handleMarkerClick = useCallback((item, type, event) => {
        if (onMarkerClick) {
            onMarkerClick(item, type, event);
        }
    }, [onMarkerClick]);

    // Fit map to show all markers
    const fitToMarkers = useCallback(() => {
        if (!mapInstance) return;

        const allItems = [
            ...(showBusinesses ? (filteredBusinesses.length > 0 ? filteredBusinesses : businesses) : []),
            ...(showEvents ? (filteredEvents.length > 0 ? filteredEvents : events) : [])
        ];

        const bounds = mapUtils.calculateBounds(allItems);
        if (bounds) {
            const leafletBounds = mapUtils.boundsToLeafletBounds(bounds);
            mapInstance.fitBounds(leafletBounds, { padding: [20, 20] });
        }
    }, [mapInstance, businesses, events, filteredBusinesses, filteredEvents, showBusinesses, showEvents]);

    // Auto-fit when data changes
    useEffect(() => {
        if (mapInstance && (businesses.length > 0 || events.length > 0)) {
            // Small delay to ensure markers are rendered
            setTimeout(fitToMarkers, 100);
        }
    }, [mapInstance, businesses.length, events.length, fitToMarkers]);

    // Determine which data to show
    const displayBusinesses = showBusinesses ? (filteredBusinesses.length > 0 ? filteredBusinesses : businesses) : [];
    const displayEvents = showEvents ? (filteredEvents.length > 0 ? filteredEvents : events) : [];

    return (
        <div className={`map-container ${className}`} style={style}>
            {loading && (
                <div className="map-container__loading">
                    <div className="map-container__loading-content">
                        <div className="map-container__loading-spinner">
                            <div className="spinner"></div>
                        </div>
                        <div className="map-container__loading-text">
                            {t('map.loading', 'Loading map...')}
                        </div>
                    </div>
                </div>
            )}

            <LeafletMapContainer
                ref={mapRef}
                center={center}
                zoom={zoom}
                className="map-container__leaflet"
                {...mapUtils.DEFAULT_CONFIG}
            >
                {/* Tile Layer */}
                <TileLayer
                    url={tileLayerUrl}
                    attribution={tileLayerAttribution}
                />

                {/* Map Event Handler */}
                <MapEventHandler
                    onMapClick={handleMapClick}
                    onMapLoad={handleMapLoad}
                    onBoundsChange={handleBoundsChange}
                />

                {/* Map Center Controller */}
                <MapCenterController
                    center={center}
                    zoom={zoom}
                />

                {/* Business Markers */}
                {showBusinesses && displayBusinesses.map((business) => (
                    <BusinessMarker
                        key={`business-${business.id}`}
                        business={business}
                        onMarkerClick={(item, event) => handleMarkerClick(item, 'business', event)}
                        isSelected={selectedBusiness?.id === business.id}
                        apiBaseUrl={apiBaseUrl}
                    />
                ))}

                {/* Event Markers */}
                {showEvents && displayEvents.map((event) => (
                    <EventMarker
                        key={`event-${event.id}`}
                        event={event}
                        onMarkerClick={(item, event) => handleMarkerClick(item, 'event', event)}
                        isSelected={selectedEvent?.id === event.id}
                        apiBaseUrl={apiBaseUrl}
                    />
                ))}
            </LeafletMapContainer>

            {/* Map Controls */}
            <div className="map-container__controls">
                <button
                    className="map-control-button"
                    onClick={fitToMarkers}
                    title={t('map.fitToMarkers', 'Fit to markers')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,3V5H5V9H3V5A2,2 0 0,1 5,3M15,3H19A2,2 0 0,1 21,5V9H19V5H15M15,19H19V15H21V19A2,2 0 0,1 19,21H15M9,19V21H5A2,2 0 0,1 3,19V15H5V19" />
                    </svg>
                </button>

                {/* Layer toggles */}
                <div className="map-layer-controls">
                    <button
                        className={`map-layer-toggle ${showBusinesses ? 'active' : ''}`}
                        onClick={() => {/* This should be handled by parent component */ }}
                        title={t('map.toggleBusinesses', 'Toggle businesses')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L13.09 4.26L16 5L13.09 5.74L12 8L10.91 5.74L8 5L10.91 4.26L12 2M12 15L13.09 17.26L16 18L13.09 18.74L12 21L10.91 18.74L8 18L10.91 17.26L12 15Z" />
                        </svg>
                        <span>{displayBusinesses.length}</span>
                    </button>

                    <button
                        className={`map-layer-toggle ${showEvents ? 'active' : ''}`}
                        onClick={() => {/* This should be handled by parent component */ }}
                        title={t('map.toggleEvents', 'Toggle events')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                        </svg>
                        <span>{displayEvents.length}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapContainer;