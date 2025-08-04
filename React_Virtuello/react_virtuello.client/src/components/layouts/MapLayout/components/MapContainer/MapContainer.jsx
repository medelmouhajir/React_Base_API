import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapContainer.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different types
const createCustomIcon = (type, color = '#0ea5e9') => {
    const iconHtml = `
        <div class="custom-marker custom-marker--${type}" style="--marker-color: ${color}">
            <div class="custom-marker__icon">
                ${getIconSvg(type)}
            </div>
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-wrapper',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const getIconSvg = (type) => {
    const icons = {
        business: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7V10C2 16 12 22 12 22S22 16 22 10V7L12 2Z"/></svg>',
        restaurant: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.1 13.34L10.5 11L8.1 8.66C7.61 8.17 7.61 7.37 8.1 6.88C8.59 6.39 9.39 6.39 9.88 6.88L12.22 9.22L14.56 6.88C15.05 6.39 15.85 6.39 16.34 6.88C16.83 7.37 16.83 8.17 16.34 8.66L13.95 11L16.34 13.34C16.83 13.83 16.83 14.63 16.34 15.12C15.85 15.61 15.05 15.61 14.56 15.12L12.22 12.78L9.88 15.12C9.39 15.61 8.59 15.61 8.1 15.12C7.61 14.63 7.61 13.83 8.1 13.34Z"/></svg>',
        hotel: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 13C8.66 13 10 11.66 10 10S8.66 7 7 7 4 8.34 4 10 5.34 13 7 13M19 7H11V10H19V7M19 11H4V18H6V16H18V18H20V11H19Z"/></svg>',
        cafe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21V19H20V21H2M20 8V5H18V8H20M20 3A2 2 0 0 1 22 5V8A2 2 0 0 1 20 10H18V13A4 4 0 0 1 14 17H8A4 4 0 0 1 4 13V3H20M16 5H6V13A2 2 0 0 0 8 15H14A2 2 0 0 0 16 13V5Z"/></svg>',
        tour: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 7.59V6.3C15 5.96 14.82 5.65 14.53 5.47L12.4 4.2C12.17 4.05 11.87 4.05 11.64 4.2L9.5 5.47C9.18 5.65 9 5.96 9 6.3V7.59L3 7V9L9 9.4V10.5C8.39 10.81 8 11.42 8 12.09V14.91C8 15.58 8.39 16.19 9 16.5V21H11V16H13V21H15V16.5C15.61 16.19 16 15.58 16 14.91V12.09C16 11.42 15.61 10.81 15 10.5V9.4L21 9Z"/></svg>',
        selected: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2M12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z"/></svg>',
        default: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2Z"/></svg>'
    };

    return icons[type] || icons.default;
};

// Map event handler component
const MapEventHandler = ({ onMapClick, onMapLoad }) => {
    const map = useMap();

    useMapEvents({
        click: onMapClick,
        load: () => {
            if (onMapLoad) {
                onMapLoad(map);
            }
        }
    });

    return null;
};

// Map center controller component
const MapCenterController = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center && center.length === 2) {
            map.setView(center, zoom || map.getZoom());
        }
    }, [map, center, zoom]);

    return null;
};

const MapContainer = ({
    center = [34.0522, -6.7736], // Fes, Morocco
    zoom = 13,
    markers = [],
    routes = [],
    businesses = [],
    selectedLocation = null,
    onMapClick,
    onLocationSelect,
    onMapLoad,
    className = '',
    showControls = true,
    showScale = true,
    enableScrollWheelZoom = true,
    enableDoubleClickZoom = true,
    maxZoom = 18,
    minZoom = 3,
    tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}) => {
    const { t } = useTranslation();
    const [mapInstance, setMapInstance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleMapClick = useCallback((event) => {
        if (onMapClick) {
            onMapClick(event);
        }
    }, [onMapClick]);

    const handleMapLoad = useCallback((map) => {
        setMapInstance(map);
        setIsLoading(false);
        if (onMapLoad) {
            onMapLoad(map);
        }
    }, [onMapLoad]);

    const handleMarkerClick = useCallback((item, type) => {
        if (onLocationSelect) {
            onLocationSelect({
                lat: item.latitude || item.lat,
                lng: item.longitude || item.lng,
                name: item.name,
                id: item.id,
                type: type,
                data: item
            });
        }
    }, [onLocationSelect]);

    return (
        <div className={`map-container ${className}`}>
            {/* Loading Overlay */}
            {isLoading && (
                <div className="map-container__loading">
                    <div className="map-container__loading-content">
                        <div className="spinner" aria-label={t('common.loading')}></div>
                        <div className="map-container__loading-text">
                            {t('map.loading')}
                        </div>
                    </div>
                </div>
            )}

            {/* Leaflet Map */}
            <LeafletMapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={enableScrollWheelZoom}
                doubleClickZoom={enableDoubleClickZoom}
                zoomControl={showControls}
                attributionControl={false}
                maxZoom={maxZoom}
                minZoom={minZoom}
                className="map-container__leaflet"
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
                />

                {/* Map Center Controller */}
                <MapCenterController
                    center={center}
                    zoom={zoom}
                />

                {/* Business Markers */}
                {businesses.map((business) => (
                    <Marker
                        key={`business-${business.id}`}
                        position={[business.latitude, business.longitude]}
                        icon={createCustomIcon('business', '#0ea5e9')}
                        eventHandlers={{
                            click: () => handleMarkerClick(business, 'business')
                        }}
                    >
                        <Popup>
                            <div className="map-popup">
                                <div className="map-popup__header">
                                    <h3 className="map-popup__title">{business.name}</h3>
                                </div>
                                {business.description && (
                                    <div className="map-popup__content">
                                        <p>{business.description}</p>
                                    </div>
                                )}
                                {(business.phone || business.email) && (
                                    <div className="map-popup__contact">
                                        {business.phone && (
                                            <div className="map-popup__contact-item">
                                                <span className="map-popup__contact-label">
                                                    {t('common.phone')}:
                                                </span>
                                                <a href={`tel:${business.phone}`}>
                                                    {business.phone}
                                                </a>
                                            </div>
                                        )}
                                        {business.email && (
                                            <div className="map-popup__contact-item">
                                                <span className="map-popup__contact-label">
                                                    {t('common.email')}:
                                                </span>
                                                <a href={`mailto:${business.email}`}>
                                                    {business.email}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Custom Markers */}
                {markers.map((marker, index) => (
                    <Marker
                        key={`marker-${marker.id || index}`}
                        position={[marker.lat, marker.lng]}
                        icon={createCustomIcon(marker.type || 'default', marker.color)}
                        eventHandlers={{
                            click: () => handleMarkerClick(marker, marker.type || 'marker')
                        }}
                    >
                        {marker.popup && (
                            <Popup>
                                <div className="map-popup">
                                    <div className="map-popup__header">
                                        <h3 className="map-popup__title">{marker.name}</h3>
                                    </div>
                                    <div className="map-popup__content">
                                        {typeof marker.popup === 'string' ? (
                                            <p>{marker.popup}</p>
                                        ) : (
                                            marker.popup
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))}

                {/* Selected Location Marker */}
                {selectedLocation && (
                    <Marker
                        position={[selectedLocation.lat, selectedLocation.lng]}
                        icon={createCustomIcon('selected', '#ef4444')}
                    >
                        <Popup>
                            <div className="map-popup">
                                <div className="map-popup__header">
                                    <h3 className="map-popup__title">
                                        {selectedLocation.name}
                                    </h3>
                                </div>
                                <div className="map-popup__content">
                                    <div className="map-popup__coordinates">
                                        {t('map.coordinates')}: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                    </div>
                                    {selectedLocation.address && (
                                        <div className="map-popup__address">
                                            {selectedLocation.address}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Routes */}
                {routes.map((route, index) => (
                    <Polyline
                        key={`route-${route.id || index}`}
                        positions={route.coordinates}
                        color={route.color || '#0ea5e9'}
                        weight={route.weight || 4}
                        opacity={route.opacity || 0.8}
                        dashArray={route.dashed ? '10, 10' : undefined}
                    />
                ))}
            </LeafletMapContainer>

            {/* Map Controls */}
            {showControls && (
                <div className="map-container__controls">
                    {showScale && (
                        <div className="map-container__scale">
                            <div className="map-container__scale-bar"></div>
                        </div>
                    )}
                </div>
            )}

            {/* Attribution */}
            <div className="map-container__attribution">
                <div dangerouslySetInnerHTML={{ __html: tileLayerAttribution }} />
            </div>
        </div>
    );
};

export default MapContainer;