// src/pages/Gps/Home/components/MapContainer/MapContainer.jsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

// Components
import VehicleMarker from '../Markers/VehicleMarker';
import SpeedColoredPolyline from '../Markers/SpeedColoredPolyline';
import MapControls from './MapControls';

// Utils
import { processRouteForSpeedColoring } from '../../utils/routeUtils';

// Styles
import './MapContainer.css';

// Fix Leaflet default icons
L.Icon.Default.imagePath = '';
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/markers/marker-sm.png',
    iconUrl: '/markers/marker-md.png',
    shadowUrl: '/markers/marker-shadow.png',
});

// Map updater component to handle external state changes
const MapUpdater = ({ mapState, routeData, followVehicle, selectedVehicle }) => {
    const map = useMap();

    useEffect(() => {
        if (mapState.center && mapState.zoom) {
            map.setView(mapState.center, mapState.zoom);
        }
    }, [map, mapState.center, mapState.zoom]);

    // Auto-fit bounds when route data changes
    useEffect(() => {
        if (routeData?.bounds && !followVehicle) {
            const bounds = L.latLngBounds([
                [routeData.bounds.south, routeData.bounds.west],
                [routeData.bounds.north, routeData.bounds.east]
            ]);

            // Add padding around the bounds
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [map, routeData, followVehicle]);

    // Follow selected vehicle
    useEffect(() => {
        if (followVehicle && selectedVehicle?.lastLocation) {
            const { latitude, longitude } = selectedVehicle.lastLocation;
            map.setView([latitude, longitude], 16, { animate: true });
        }
    }, [map, followVehicle, selectedVehicle]);

    return null;
};

const MapContainer = ({
    vehicles = [],
    selectedVehicle,
    routeData,
    mapState,
    onMapStateChange,
    onVehicleSelect,
    isMobile = false
}) => {
    const mapRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [followVehicle, setFollowVehicle] = useState(false);
    const [mapMode, setMapMode] = useState('vehicles'); // 'vehicles' or 'route'

    // Tile layer configuration
    const tileConfig = {
        light: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
    };

    const [currentTileLayer, setCurrentTileLayer] = useState('light');
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Process speed-colored route segments
    const speedSegments = routeData?.records ?
        processRouteForSpeedColoring(routeData.records) : [];

    // Handle map events
    const handleMapReady = useCallback(() => {
        setIsMapReady(true);

        if (mapRef.current) {
            const map = mapRef.current;

            // Add map event listeners
            map.on('moveend', () => {
                const center = map.getCenter();
                const zoom = map.getZoom();
                onMapStateChange?.({
                    center: [center.lat, center.lng],
                    zoom,
                    followVehicle: false
                });
                setFollowVehicle(false);
            });

            map.on('zoomend', () => {
                const zoom = map.getZoom();
                onMapStateChange?.(prev => ({ ...prev, zoom }));
            });
        }
    }, [onMapStateChange]);

    // Toggle follow vehicle mode
    const handleToggleFollow = useCallback(() => {
        if (!selectedVehicle?.lastLocation) return;

        setFollowVehicle(!followVehicle);

        if (!followVehicle) {
            const { latitude, longitude } = selectedVehicle.lastLocation;
            onMapStateChange?.({
                center: [latitude, longitude],
                zoom: 16,
                followVehicle: true
            });
        }
    }, [followVehicle, selectedVehicle, onMapStateChange]);

    // Center map on all vehicles
    const handleCenterAllVehicles = useCallback(() => {
        if (!vehicles.length || !mapRef.current) return;

        const validVehicles = vehicles.filter(v => v.lastLocation);
        if (validVehicles.length === 0) return;

        const bounds = L.latLngBounds(
            validVehicles.map(v => [v.lastLocation.latitude, v.lastLocation.longitude])
        );

        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        setFollowVehicle(false);
    }, [vehicles]);

    // Center map on route
    const handleCenterRoute = useCallback(() => {
        if (!routeData?.bounds || !mapRef.current) return;

        const bounds = L.latLngBounds([
            [routeData.bounds.south, routeData.bounds.west],
            [routeData.bounds.north, routeData.bounds.east]
        ]);

        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        setFollowVehicle(false);
    }, [routeData]);

    // Handle vehicle marker click
    const handleVehicleClick = useCallback((vehicle) => {
        onVehicleSelect?.(vehicle);

        // Center map on selected vehicle
        if (vehicle.lastLocation) {
            onMapStateChange?.({
                center: [vehicle.lastLocation.latitude, vehicle.lastLocation.longitude],
                zoom: Math.max(mapState.zoom || 10, 14),
                followVehicle: false
            });
        }
    }, [onVehicleSelect, onMapStateChange, mapState.zoom]);

    // Update tile layer based on theme
    useEffect(() => {
        setCurrentTileLayer(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    return (
        <div className={`map-container-wrapper ${isMobile ? 'mobile' : ''}`}>

            {/* Map Controls */}
            <MapControls
                onToggleFollow={handleToggleFollow}
                onCenterAll={handleCenterAllVehicles}
                onCenterRoute={handleCenterRoute}
                onToggleTileLayer={() => {
                    const layers = Object.keys(tileConfig);
                    const currentIndex = layers.indexOf(currentTileLayer);
                    const nextIndex = (currentIndex + 1) % layers.length;
                    setCurrentTileLayer(layers[nextIndex]);
                }}
                followVehicle={followVehicle}
                hasRoute={!!routeData}
                hasVehicles={vehicles.length > 0}
                selectedVehicle={selectedVehicle}
                isMobile={isMobile}
                mapMode={mapMode}
                onMapModeChange={setMapMode}
            />

            {/* Leaflet Map */}
            <LeafletMap
                ref={mapRef}
                center={mapState.center || [33.5731, -7.5898]}
                zoom={mapState.zoom || 6}
                style={{ height: '100%', width: '100%' }}
                zoomControl={!isMobile} // Hide default zoom controls on mobile
                attributionControl={!isMobile}
                whenReady={handleMapReady}
                className={`leaflet-map ${currentTileLayer}`}
            >
                {/* Tile Layer */}
                <TileLayer
                    key={currentTileLayer}
                    url={tileConfig[currentTileLayer].url}
                    attribution={tileConfig[currentTileLayer].attribution}
                    maxZoom={18}
                    minZoom={2}
                />

                {/* Map Updater */}
                <MapUpdater
                    mapState={mapState}
                    routeData={routeData}
                    followVehicle={followVehicle}
                    selectedVehicle={selectedVehicle}
                />

                {/* Vehicle Markers */}
                {mapMode === 'vehicles' && vehicles.map(vehicle => (
                    vehicle.lastLocation && (
                        <VehicleMarker
                            key={vehicle.id}
                            vehicle={vehicle}
                            isSelected={selectedVehicle?.id === vehicle.id}
                            onClick={() => handleVehicleClick(vehicle)}
                            followMode={followVehicle && selectedVehicle?.id === vehicle.id}
                        />
                    )
                ))}

                {/* Speed-colored Route */}
                {mapMode === 'route' && speedSegments.length > 0 && (
                    <>
                        {speedSegments.map((segment, index) => (
                            <SpeedColoredPolyline
                                key={`speed-segment-${index}`}
                                segment={segment}
                                zoom={mapState.zoom || 10}
                            />
                        ))}
                    </>
                )}

                {/* Selected Vehicle Route (always visible when selected) */}
                {selectedVehicle && speedSegments.length > 0 && mapMode === 'vehicles' && (
                    <>
                        {speedSegments.map((segment, index) => (
                            <SpeedColoredPolyline
                                key={`selected-route-${index}`}
                                segment={segment}
                                zoom={mapState.zoom || 10}
                                opacity={0.6} // Slightly transparent when not in route mode
                            />
                        ))}
                    </>
                )}
            </LeafletMap>

            {/* Map Loading Overlay */}
            {!isMapReady && (
                <div className="map-loading-overlay">
                    <div className="map-loading-spinner"></div>
                    <p>Loading map...</p>
                </div>
            )}

            {/* Vehicle Count Badge */}
            {vehicles.length > 0 && !selectedVehicle && (
                <div className="vehicle-count-badge">
                    <span className="count">{vehicles.length}</span>
                    <span className="label">vehicles</span>
                </div>
            )}

            {/* Route Info Badge */}
            {routeData && (
                <div className="route-info-badge">
                    <div className="route-stat">
                        <span className="value">{Math.round(routeData.totalDistance || 0)} km</span>
                        <span className="label">distance</span>
                    </div>
                    <div className="route-stat">
                        <span className="value">{speedSegments.length}</span>
                        <span className="label">segments</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapContainer;