import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Modern Components
import ModernVehicleMarker from './../components/Markers/ModernVehicleMarker/ModernVehicleMarker';
import ModernRoutePolyline from './../components/Markers/ModernRoutePolyline/ModernRoutePolyline';
import MapControlsOverlay from './../components/Markers/MapControlsOverlay/MapControlsOverlay';
import VehicleClusterGroup from './../components/Markers/VehicleClusterGroup/VehicleClusterGroup';

// Utils
import { processRouteForSpeedColoring } from '../utils/modernRouteUtils';
import { calculateMapBounds, optimizeMarkerRendering } from '../utils/mapOptimization';

import './ModernMapContainer.css';

// Enhanced Leaflet Icons
L.Icon.Default.imagePath = '';
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/markers/modern-marker-2x.png',
    iconUrl: '/markers/modern-marker.png',
    shadowUrl: '/markers/modern-shadow.png',
});

// Map State Manager Component
const MapStateManager = ({
    mapState,
    routeData,
    followVehicle,
    selectedVehicle,
    isFullScreen,
    vehicles,
    onMapReady
}) => {
    const map = useMap();

    // Handle map ready
    useEffect(() => {
        if (map && onMapReady) {
            onMapReady(map);
        }
    }, [map, onMapReady]);

    // Handle map state changes
    useEffect(() => {
        if (mapState.center && mapState.zoom) {
            map.setView(mapState.center, mapState.zoom, {
                animate: true,
                duration: 0.5
            });
        }
    }, [map, mapState.center, mapState.zoom]);

    // Auto-fit bounds for route data
    useEffect(() => {
        if (routeData?.bounds && !followVehicle) {
            const bounds = calculateMapBounds(routeData);
            map.fitBounds(bounds, {
                padding: [20, 20],
                animate: true,
                duration: 0.8
            });
        }
    }, [map, routeData, followVehicle]);

    // Follow selected vehicle with smooth animation
    useEffect(() => {
        if (followVehicle && selectedVehicle?.lastLocation) {
            const { latitude, longitude } = selectedVehicle.lastLocation;
            map.flyTo([latitude, longitude], 16, {
                animate: true,
                duration: 1.2
            });
        }
    }, [map, followVehicle, selectedVehicle]);

    // Handle fullscreen mode
    useEffect(() => {
        if (isFullScreen) {
            map.invalidateSize();
            // Fit all vehicles in fullscreen mode
            if (vehicles?.length > 0) {
                const bounds = calculateMapBounds({ vehicles });
                map.fitBounds(bounds, {
                    padding: [40, 40],
                    animate: true
                });
            }
        }
    }, [map, isFullScreen, vehicles]);

    return null;
};

const ModernMapContainer = ({
    vehicles = [],
    selectedVehicle,
    routeData,
    mapState,
    onMapStateChange,
    onVehicleSelect,
    isMobile = false,
    isFullScreen = false,
    className = '',
    onMapInteraction
}) => {
    const mapRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [followVehicle, setFollowVehicle] = useState(false);
    const [mapMode, setMapMode] = useState('satellite'); // satellite, streets, terrain
    const [showTraffic, setShowTraffic] = useState(false);
    const [showClusters, setShowClusters] = useState(true);
    const [mapInteractionState, setMapInteractionState] = useState('idle'); // idle, dragging, zooming
    const [lastInteraction, setLastInteraction] = useState(null);

    // Memoized processed data
    const processedVehicles = useMemo(() => {
        return optimizeMarkerRendering(vehicles, mapState.zoom);
    }, [vehicles, mapState.zoom]);

    const processedRoute = useMemo(() => {
        if (!routeData?.coordinates) return null;
        return processRouteForSpeedColoring(routeData);
    }, [routeData]);

    // Handle map ready callback
    const handleMapReady = useCallback((map) => {
        mapRef.current = map;
        setIsMapReady(true);

        // Ensure all interaction handlers stay enabled regardless of layout changes
        map.dragging?.enable();
        map.boxZoom?.enable();
        map.doubleClickZoom?.enable();
        map.keyboard?.enable();

        if (isMobile) {
            map.touchZoom?.enable();
            map.scrollWheelZoom?.disable();
            map.tap?.enable?.();
        } else {
            map.touchZoom?.disable();
            map.scrollWheelZoom?.enable();
            map.tap?.disable?.();
        }


        // Set up map event handlers
        map.on('moveend', () => {
            const center = map.getCenter();
            const zoom = map.getZoom();
            onMapStateChange?.({
                center: [center.lat, center.lng],
                zoom,
                bounds: map.getBounds()
            });
            setMapInteractionState('idle');
            onMapInteraction?.('drag-end');
        });

        map.on('movestart', () => {
            setMapInteractionState('dragging');
            setLastInteraction(Date.now());
            onMapInteraction?.('drag-start');
        });

        map.on('zoomstart', () => {
            setMapInteractionState('zooming');
            setLastInteraction(Date.now());
            onMapInteraction?.('zoom-start');
        });

        map.on('zoomend', () => {
            setMapInteractionState('idle');
            onMapInteraction?.('zoom-end');
        });

        // Mobile-specific touch handlers
        if (isMobile) {
            map.on('touchstart', () => {
                onMapInteraction?.('touch-start');
            });

            map.on('touchend', () => {
                onMapInteraction?.('touch-end');
            });
        }
    }, [onMapStateChange, onMapInteraction, isMobile]);


    useEffect(() => {
        if (!mapRef.current) return;

        const mapInstance = mapRef.current;
        mapInstance.dragging?.enable();
        mapInstance.boxZoom?.enable();
        mapInstance.doubleClickZoom?.enable();
        mapInstance.keyboard?.enable();

        if (isMobile) {
            mapInstance.touchZoom?.enable();
            mapInstance.scrollWheelZoom?.disable();
            mapInstance.tap?.enable?.();
        } else {
            mapInstance.touchZoom?.disable();
            mapInstance.scrollWheelZoom?.enable();
            mapInstance.tap?.disable?.();
        }
    }, [isMobile]);

    // Handle vehicle marker click
    const handleVehicleMarkerClick = useCallback((vehicle) => {
        onVehicleSelect?.(vehicle);
        setFollowVehicle(true);

        // Auto-disable follow mode after a few seconds
        setTimeout(() => {
            setFollowVehicle(false);
        }, 5000);
    }, [onVehicleSelect]);

    // Toggle map mode
    const handleMapModeToggle = useCallback(() => {
        const modes = ['satellite', 'streets', 'terrain'];
        const currentIndex = modes.indexOf(mapMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setMapMode(nextMode);
    }, [mapMode]);

    // Get tile layer URL based on mode
    const getTileLayerUrl = useCallback((mode) => {
        const urls = {
            satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
        };
        return urls[mode] || urls.satellite;
    }, []);

    // Map container classes
    const mapClasses = [
        'modern-map-container',
        className,
        isFullScreen ? 'fullscreen' : '',
        isMobile ? 'mobile' : 'desktop',
        mapInteractionState
    ].filter(Boolean).join(' ');

    return (
        <motion.div
            className={mapClasses}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            layout={!isFullScreen}
        >
            {/* Map Loading Overlay */}
            <AnimatePresence>
                {!isMapReady && (
                    <motion.div
                        className="map-loading-overlay"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="loading-content">
                            <div className="loading-spinner" />
                            <span>Loading Map...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leaflet Map */}
            <LeafletMap
                center={mapState.center || [33.5731, -7.5898]} // Default to Casablanca
                zoom={mapState.zoom || 12}
                className="leaflet-map"
                data-swipe-ignore="true"
                zoomControl={false}
                attributionControl={!isMobile}
                scrollWheelZoom={!isMobile}
                touchZoom={isMobile}
                doubleClickZoom={true}
                boxZoom={!isMobile}
                keyboard={!isMobile}
                dragging={true}
                tap={isMobile}
                worldCopyJump={true}
            >
                {/* Map State Manager */}
                <MapStateManager
                    mapState={mapState}
                    routeData={routeData}
                    followVehicle={followVehicle}
                    selectedVehicle={selectedVehicle}
                    isFullScreen={isFullScreen}
                    vehicles={vehicles}
                    onMapReady={handleMapReady}
                />

                {/* Tile Layer */}
                <TileLayer
                    url={getTileLayerUrl(mapMode)}
                    attribution={`&copy; ${mapMode === 'streets' ? 'OpenStreetMap' : 'Esri'} contributors`}
                    maxZoom={18}
                    minZoom={3}
                />

                {/* Traffic Layer */}
                {showTraffic && (
                    <TileLayer
                        url="https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=YOUR_API_KEY"
                        opacity={0.7}
                        zIndex={1000}
                    />
                )}

                {/* Vehicle Markers */}
                {showClusters && processedVehicles.length > 10 ? (
                    <VehicleClusterGroup
                        vehicles={processedVehicles}
                        selectedVehicle={selectedVehicle}
                        onVehicleClick={handleVehicleMarkerClick}
                        isMobile={isMobile}
                    />
                ) : (
                    processedVehicles.map((vehicle) => (
                        <ModernVehicleMarker
                            key={vehicle.id}
                            vehicle={vehicle}
                            isSelected={selectedVehicle?.id === vehicle.id}
                            onClick={() => handleVehicleMarkerClick(vehicle)}
                            isMobile={isMobile}
                            showDetails={!isMobile || selectedVehicle?.id === vehicle.id}
                        />
                    ))
                )}

                {/* Route Polyline */}
                {processedRoute && (
                    <ModernRoutePolyline
                        routeData={processedRoute}
                        selectedVehicle={selectedVehicle}
                        isVisible={!!selectedVehicle}
                        isMobile={isMobile}
                    />
                )}
            </LeafletMap>

            {/* Map Controls Overlay */}
            <MapControlsOverlay
                isVisible={isMapReady}
                isMobile={isMobile}
                isFullScreen={isFullScreen}
                mapMode={mapMode}
                followVehicle={followVehicle}
                showTraffic={showTraffic}
                showClusters={showClusters}
                onMapModeToggle={handleMapModeToggle}
                onFollowToggle={() => setFollowVehicle(!followVehicle)}
                onTrafficToggle={() => setShowTraffic(!showTraffic)}
                onClusterToggle={() => setShowClusters(!showClusters)}
                onRecenterMap={() => {
                    if (vehicles.length > 0) {
                        const bounds = calculateMapBounds({ vehicles });
                        mapRef.current?.fitBounds(bounds, { padding: [40, 40] });
                    }
                }}
                vehicleCount={vehicles.length}
                selectedVehicle={selectedVehicle}
            />

            {/* Mobile Gesture Hints */}
            {isMobile && !isFullScreen && (
                <motion.div
                    className="mobile-gesture-hints"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: mapInteractionState === 'idle' ? 0.7 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="gesture-hint pinch">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M8 12l-2-2 2-2M16 12l2-2-2-2M12 8v8" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span>Pinch to zoom</span>
                    </div>
                    {!selectedVehicle && (
                        <div className="gesture-hint tap">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="3" fill="currentColor" />
                                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="1" />
                            </svg>
                            <span>Tap vehicle to select</span>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Map Stats Overlay */}
            {isMapReady && !isFullScreen && (
                <motion.div
                    className="map-stats-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 1 }}
                >
                    <div className="map-stat">
                        <span className="stat-value">{vehicles.length}</span>
                        <span className="stat-label">Vehicles</span>
                    </div>
                    {selectedVehicle && (
                        <div className="map-stat selected">
                            <span className="stat-value">{selectedVehicle.plateNumber}</span>
                            <span className="stat-label">Selected</span>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};

export default ModernMapContainer;