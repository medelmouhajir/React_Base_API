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
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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

    // Handle map state changes with improved mobile support
    useEffect(() => {
        if (!map) return;

        const handleMoveEnd = () => {
            const center = map.getCenter();
            const zoom = map.getZoom();
            onMapReady?.({
                center: [center.lat, center.lng],
                zoom,
                bounds: map.getBounds()
            });
        };

        map.on('moveend', handleMoveEnd);
        map.on('zoomend', handleMoveEnd);

        return () => {
            map.off('moveend', handleMoveEnd);
            map.off('zoomend', handleMoveEnd);
        };
    }, [map, onMapReady]);

    // Follow vehicle effect
    useEffect(() => {
        if (!map || !followVehicle || !selectedVehicle) return;

        const { latitude, longitude } = selectedVehicle;
        if (latitude && longitude) {
            map.setView([latitude, longitude], Math.max(map.getZoom(), 16), {
                animate: true,
                duration: 1
            });
        }
    }, [map, followVehicle, selectedVehicle]);

    return null;
};

// Main Component
const ModernMapContainer = ({
    vehicles = [],
    selectedVehicle,
    routeData,
    mapState,
    onMapStateChange,
    onVehicleSelect,
    isMobile = false,
    isFullScreen = false,
    onToggleFullScreen,
    className = '',
    onMapInteraction
}) => {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [followVehicle, setFollowVehicle] = useState(false);
    const [mapMode, setMapMode] = useState('satellite');
    const [showTraffic, setShowTraffic] = useState(false);
    const [showClusters, setShowClusters] = useState(true);
    const [mapInteractionState, setMapInteractionState] = useState('idle');

    // Memoized processed data
    const processedVehicles = useMemo(() => {
        return optimizeMarkerRendering(vehicles, mapState.zoom);
    }, [vehicles, mapState.zoom]);

    // In ModernMapContainer.jsx, replace the processedRoute useMemo:
    const processedRoute = useMemo(() => {
        // Handle both old format (array) and new format (object with records)
        const records = Array.isArray(routeData)
            ? routeData
            : routeData?.records || routeData?.coordinates;

        if (!records || records.length === 0) return null;

        return processRouteForSpeedColoring(records);
    }, [routeData]);

    // CRITICAL FIX: Enhanced map ready handler with proper mobile touch setup
    const handleMapReady = useCallback((mapInstance) => {
        // Get the actual Leaflet map instance
        const map = mapInstance?.leafletElement || mapInstance;

        if (!map || mapRef.current === map) return;

        mapRef.current = map;
        setIsMapReady(true);

        console.log('Map ready, setting up interactions...', { isMobile, map });

        // CRITICAL: Clear any existing handlers first
        map.off();

        // CRITICAL: Ensure proper mobile touch handling
        if (isMobile) {
            // Enable mobile-specific interactions
            map.touchZoom?.enable();
            map.tap?.enable();
            map.dragging?.enable();

            // Disable desktop-only interactions
            map.scrollWheelZoom?.disable();
            map.boxZoom?.disable();
            map.keyboard?.disable();

            // CRITICAL: Set proper touch handling options
            if (map.dragging) {
                map.dragging._draggable._inertia = true;
                map.dragging._draggable._inertiaDeceleration = 3000;
                map.dragging._draggable._inertiaMaxSpeed = Infinity;
            }

        } else {
            // Desktop setup
            map.scrollWheelZoom?.enable();
            map.boxZoom?.enable();
            map.keyboard?.enable();
            map.dragging?.enable();
            map.touchZoom?.disable();
            map.tap?.disable();
        }

        // CRITICAL: Simplified event handlers to avoid conflicts
        let moveTimeout;
        const handleMapInteraction = (type) => {
            setMapInteractionState(type);
            onMapInteraction?.(type);

            // Clear any existing timeout
            if (moveTimeout) {
                clearTimeout(moveTimeout);
            }

            // Set idle state after interaction ends
            moveTimeout = setTimeout(() => {
                setMapInteractionState('idle');
            }, 150);
        };

        // Simplified event binding
        map.on('movestart', () => handleMapInteraction('dragging'));
        map.on('zoomstart', () => handleMapInteraction('zooming'));
        map.on('moveend', () => {
            const center = map.getCenter();
            const zoom = map.getZoom();
            onMapStateChange?.({
                center: [center.lat, center.lng],
                zoom,
                bounds: map.getBounds()
            });
            handleMapInteraction('idle');
        });
        map.on('zoomend', () => handleMapInteraction('idle'));

        // CRITICAL: Mobile-specific event optimization
        if (isMobile) {
            // Reduce event frequency for better performance
            let touchMoveCount = 0;
            map.on('touchstart', () => {
                touchMoveCount = 0;
                handleMapInteraction('touch-start');
            });

            map.on('touchmove', () => {
                touchMoveCount++;
                // Only trigger every 3rd move event to reduce load
                if (touchMoveCount % 3 === 0) {
                    handleMapInteraction('touch-move');
                }
            });

            map.on('touchend', () => {
                handleMapInteraction('touch-end');
            });
        }

        console.log('Map interactions setup complete:', {
            dragging: map.dragging?.enabled(),
            touchZoom: map.touchZoom?.enabled(),
            tap: map.tap?.enabled(),
            isMobile
        });

        return () => {
            if (moveTimeout) {
                clearTimeout(moveTimeout);
            }
        };
    }, [onMapStateChange, onMapInteraction, isMobile]);

    // Alternative map ready setup using MapStateManager
    const handleMapReadyFromManager = useCallback((map) => {
        if (map && !isMapReady) {
            handleMapReady(map);
        }
    }, [handleMapReady, isMapReady]);

    // CRITICAL: Reset interaction handlers when mobile state changes
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        // Re-initialize map with correct mobile settings
        handleMapReady(map);
    }, [isMobile, handleMapReady]);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        let resizeTimeout;

        // Function to handle map resize with debouncing
        const handleMapResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (map && map.invalidateSize) {
                    console.log('Invalidating map size due to container resize');
                    // Invalidate map size to force tile reload and proper sizing
                    map.invalidateSize({
                        pan: false,  // Don't pan the map
                        animate: false  // Don't animate the resize for better performance
                    });
                }
            }, 150); // Debounce resize events
        };

        // Create ResizeObserver to watch container size changes
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    handleMapResize();
                }
            }
        });

        // Watch the container element for size changes
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Also listen for these specific events that trigger layout changes
        const handleLayoutChange = () => {
            handleMapResize();
        };

        // Listen for drawer state changes via custom events or direct triggers
        const handleDrawerToggle = () => {
            // Wait for CSS transition to complete before invalidating
            setTimeout(handleMapResize, 350); // Match CSS transition duration
        };

        // Listen for fullscreen changes
        const handleFullscreenChange = () => {
            // Wait for animation to complete
            setTimeout(handleMapResize, 350);
        };

        // Add event listeners for layout changes
        window.addEventListener('resize', handleLayoutChange);

        // Cleanup
        return () => {
            clearTimeout(resizeTimeout);
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleLayoutChange);
        };
    }, [isMapReady, containerRef]); // Dependencies: map readiness and container ref

    // ADDITIONAL FIX: React to prop changes that affect layout
    useEffect(() => {
        if (!mapRef.current || !isMapReady) return;

        // Delay to allow CSS transitions to complete
        const timer = setTimeout(() => {
            if (mapRef.current && mapRef.current.invalidateSize) {
                console.log('Invalidating map size due to prop changes:', { isFullScreen, className });
                mapRef.current.invalidateSize({
                    pan: false,
                    animate: false
                });
            }
        }, 350); // Match transition duration from CSS

        return () => clearTimeout(timer);
    }, [isFullScreen, className, isMapReady]);

    // Handle vehicle marker click
    const handleVehicleMarkerClick = useCallback((vehicle) => {
        onVehicleSelect?.(vehicle);
        setFollowVehicle(true);

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

    // CRITICAL: Optimized map container classes
    const mapClasses = [
        'modern-map-container',
        className,
        isFullScreen ? 'fullscreen' : '',
        isMobile ? 'mobile' : 'desktop',
        mapInteractionState
    ].filter(Boolean).join(' ');

    return (
        <motion.div
            ref={containerRef}
            className={mapClasses}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            layout={false} // CRITICAL: Disable layout to prevent interference
            data-swipe-ignore="true" // Keep this for carousel integration
            style={{
                // CRITICAL: Ensure touch events pass through
                touchAction: 'none' // Let Leaflet handle all touch actions
            }}
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

            {/* CRITICAL: Leaflet Map with optimized props */}
            <LeafletMap
                center={mapState.center || [33.5731, -7.5898]}
                zoom={mapState.zoom || 12}
                className="leaflet-map"
                data-swipe-ignore="true"
                zoomControl={false}
                attributionControl={!isMobile}
                // CRITICAL: Let the handleMapReady function control these
                scrollWheelZoom={false} // Will be enabled in handleMapReady
                touchZoom={false} // Will be enabled in handleMapReady
                doubleClickZoom={true}
                boxZoom={false} // Will be enabled in handleMapReady for desktop
                keyboard={false} // Will be enabled in handleMapReady for desktop
                dragging={true} // Always enable, let Leaflet manage touch vs mouse
                tap={false} // Will be enabled in handleMapReady for mobile
                worldCopyJump={true}
                // CRITICAL: Use ref instead of whenCreated
                ref={(map) => {
                    if (map && !isMapReady) {
                        handleMapReady(map);
                    }
                }}
            >
                {/* Map State Manager */}
                <MapStateManager
                    mapState={mapState}
                    routeData={routeData}
                    followVehicle={followVehicle}
                    selectedVehicle={selectedVehicle}
                    isFullScreen={isFullScreen}
                    vehicles={vehicles}
                    onMapReady={handleMapReadyFromManager}
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
                        showClusters={!selectedVehicle}
                        isMobile={isMobile}
                    />
                ) : (
                    processedVehicles.map((vehicle) => (
                        <ModernVehicleMarker
                            key={vehicle.id}
                            vehicle={vehicle}
                            isSelected={selectedVehicle?.id === vehicle.id}
                            onClick={handleVehicleMarkerClick}
                            showLabel={!isMobile}
                        />
                    ))
                )}

                {/* Route Polyline */}
                {processedRoute && (
                    <ModernRoutePolyline
                        processedRouteData={processedRoute}
                        selectedVehicle={selectedVehicle}
                        isActive={!!selectedVehicle}
                        isMobile={isMobile}
                    />
                )}
            </LeafletMap>

            {/* Map Controls Overlay */}
            <MapControlsOverlay
                isVisible={isMapReady}
                isMobile={isMobile}
                isFullScreen={isFullScreen}
                onToggleFullScreen={onToggleFullScreen}
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

            {/* Mobile Gesture Hints - Only show initially */}
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