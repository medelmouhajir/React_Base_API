// src/pages/Gps/Home/GpsHome.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import gpsService from '../../../services/gpsService';

import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import './GpsHome.css';

// Fix Leaflet's default icon paths
L.Icon.Default.imagePath = '';
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/markers/marker-sm.png',
    iconUrl: '/markers/marker-md.png',
    shadowUrl: '/markers/marker-shadow.png',
});

const GpsHome = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const agencyId = user?.agencyId;

    const mapRef = useRef(null);

    // State management
    const [cars, setCars] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [selectedCarRecords, setSelectedCarRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);
    const [error, setError] = useState(null);
    const [showCarModal, setShowCarModal] = useState(false);
    const [mapCenter] = useState([33.5731, -7.5898]); // Default to Casablanca
    const [mapZoom] = useState(6);

    // Mobile and responsive states
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showFloatingCard, setShowFloatingCard] = useState(true);
    const [cardMinimized, setCardMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [cardTransformY, setCardTransformY] = useState(0);

    // Refs for dragging
    const cardRef = useRef(null);
    const headerRef = useRef(null);

    // Fetch cars for this agency on component mount
    useEffect(() => {
        if (!agencyId) return;

        const fetchCars = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await gpsService.getCarsByAgencyId(agencyId);
                setCars(data || []);

                // Auto-select first car if available
                if (data && data.length > 0) {
                    setSelectedCar(data[0]);
                }
            } catch (err) {
                console.error('Error fetching cars:', err);
                setError(t('gps.errors.fetchCars', 'Failed to load vehicles'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchCars();
    }, [agencyId, t]);

    // Fetch records for selected car only when selected
    useEffect(() => {
        if (!selectedCar?.deviceSerialNumber) {
            setSelectedCarRecords([]);
            return;
        }

        const fetchCarRecords = async () => {
            setIsLoadingRecords(true);
            try {
                const records = await gpsService.getRecordsByDevice(selectedCar.deviceSerialNumber);
                setSelectedCarRecords(records || []);

                console.warn(records);

                // Center map on latest position if records exist
                if (records && records.length > 0) {
                    const latest = records[records.length - 1];
                    const map = mapRef.current;
                    if (map) {
                        map.flyTo([latest.latitude, latest.longitude], 15, { duration: 1.5 });
                    }
                }
            } catch (err) {
                console.error(`Error fetching records for device ${selectedCar.deviceSerialNumber}:`, err);
                setSelectedCarRecords([]);
            } finally {
                setIsLoadingRecords(false);
            }
        };

        fetchCarRecords();
    }, [selectedCar]);

    // Handle window resize for mobile optimization
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setCardMinimized(false);
                setCardTransformY(0);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mobile drag handling for card
    useEffect(() => {
        if (!isMobile || !headerRef.current) return;

        const handleTouchStart = (e) => {
            setIsDragging(true);
            setDragStartY(e.touches[0].clientY);
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const currentY = e.touches[0].clientY;
            const deltaY = currentY - dragStartY;

            // Only allow dragging down when expanded or up when minimized
            if ((!cardMinimized && deltaY > 0) || (cardMinimized && deltaY < 0)) {
                setCardTransformY(deltaY);
            }
        };

        const handleTouchEnd = () => {
            if (!isDragging) return;
            setIsDragging(false);

            // Determine if should minimize or expand based on drag distance
            const threshold = 100;
            if (Math.abs(cardTransformY) > threshold) {
                if (cardTransformY > 0 && !cardMinimized) {
                    // Dragged down, minimize
                    setCardMinimized(true);
                } else if (cardTransformY < 0 && cardMinimized) {
                    // Dragged up, expand
                    setCardMinimized(false);
                }
            }

            setCardTransformY(0);
        };

        const headerElement = headerRef.current;
        headerElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            headerElement.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobile, isDragging, dragStartY, cardTransformY, cardMinimized]);

    // Handle car selection
    const handleCarSelect = (car) => {
        setSelectedCar(car);
        setShowCarModal(false);
    };

    // Navigation handlers
    const handleGoHome = () => {
        window.location.href = '/dashboard'; // Adjust to your home route
    };

    // Map interaction handlers
    const handleZoomIn = () => {
        const map = mapRef.current;
        if (map) map.zoomIn();
    };

    const handleZoomOut = () => {
        const map = mapRef.current;
        if (map) map.zoomOut();
    };

    const handleCenterOnCar = () => {
        if (!selectedCarRecords.length) return;

        const latest = selectedCarRecords[selectedCarRecords.length - 1];
        const map = mapRef.current;
        if (map) {
            map.flyTo([latest.latitude, latest.longitude], 18, { duration: 1.5 });
        }
    };



    // Car control actions
    const handleStartEngine = async () => {
        if (!selectedCar) return;
        try {
            // TODO: Implement API call for engine start
            console.log('Starting engine for car:', selectedCar.id);
            // await carControlService.startEngine(selectedCar.id);
            // Show success message
        } catch (error) {
            console.error('Failed to start engine:', error);
        }
    };

    const handleStopEngine = async () => {
        if (!selectedCar) return;
        try {
            // TODO: Implement API call for engine stop
            console.log('Stopping engine for car:', selectedCar.id);
            // await carControlService.stopEngine(selectedCar.id);
            // Show success message
        } catch (error) {
            console.error('Failed to stop engine:', error);
        }
    };

    const handleActivateHorn = async () => {
        if (!selectedCar) return;
        try {
            // TODO: Implement API call for horn activation
            console.log('Activating horn for car:', selectedCar.id);
            // await carControlService.activateHorn(selectedCar.id);
            // Show success message
        } catch (error) {
            console.error('Failed to activate horn:', error);
        }
    };

    const handleLockCar = async () => {
        if (!selectedCar) return;
        try {
            // TODO: Implement API call for car lock
            console.log('Locking car:', selectedCar.id);
            // await carControlService.lockCar(selectedCar.id);
            // Show success message
        } catch (error) {
            console.error('Failed to lock car:', error);
        }
    };

    const handleUnlockCar = async () => {
        if (!selectedCar) return;
        try {
            // TODO: Implement API call for car unlock
            console.log('Unlocking car:', selectedCar.id);
            // await carControlService.unlockCar(selectedCar.id);
            // Show success message
        } catch (error) {
            console.error('Failed to unlock car:', error);
        }
    };

    // Card visibility handlers
    const handleToggleCard = () => {
        if (isMobile) {
            setCardMinimized(!cardMinimized);
        } else {
            setShowFloatingCard(!showFloatingCard);
        }
    };

    const handleShowCard = () => {
        setShowFloatingCard(true);
        setCardMinimized(false);
    };

    // Get car status based on last location timestamp
    const getCarStatus = (car) => {
        if (!selectedCarRecords.length) return 'unknown';

        const latest = selectedCarRecords[selectedCarRecords.length - 1];
        const now = new Date();
        const lastSeen = new Date(latest.timestamp);
        const diffMinutes = (now - lastSeen) / (1000 * 60);

        if (diffMinutes < 5) return 'online';
        if (diffMinutes < 60) return 'idle';
        return 'offline';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return '#10b981';
            case 'idle': return '#f59e0b';
            case 'offline': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'online': return t('gps.status.online', 'Online');
            case 'idle': return t('gps.status.idle', 'Idle');
            case 'offline': return t('gps.status.offline', 'Offline');
            default: return t('gps.status.unknown', 'Unknown');
        }
    };

    // Tile layer configuration
    const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = isDarkMode
        ? '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors';

    // Render polyline for selected car's path
    const renderCarPath = () => {
        if (!selectedCarRecords || selectedCarRecords.length === 0) {
            console.log('No records to display polyline');
            return null;
        }

        // Sort records by timestamp (oldest first)
        const sortedRecords = [...selectedCarRecords].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Create positions array, ensuring proper number conversion
        const positions = sortedRecords
            .map(record => {
                const lat = parseFloat(record.latitude);
                const lng = parseFloat(record.longitude);
                return [lat, lng];
            })
            .filter(([lat, lng]) => {
                const isValid = !isNaN(lat) &&
                    !isNaN(lng) &&
                    Math.abs(lat) <= 90 &&
                    Math.abs(lng) <= 180 &&
                    (lat !== 0 || lng !== 0);
                return isValid;
            });

        // Remove duplicate consecutive points
        const uniquePositions = positions.filter((pos, index) => {
            if (index === 0) return true;
            const prevPos = positions[index - 1];
            return pos[0] !== prevPos[0] || pos[1] !== prevPos[1];
        });

        console.log('Polyline positions:', uniquePositions);

        if (uniquePositions.length < 2) {
            console.warn('Not enough unique positions for polyline');
            return null;
        }

        const polylineKey = `polyline-${selectedCar?.id}-${uniquePositions.length}`;

        return (
            <Polyline
                key={polylineKey}
                positions={uniquePositions}
                pathOptions={{
                    color: '#3b82f6',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: null,
                    lineCap: 'round',
                    lineJoin: 'round'
                }}
            />
        );
    };

    const renderPathPoints = () => {
        if (!selectedCarRecords || selectedCarRecords.length === 0) return null;

        // Sort records by timestamp (oldest first)
        const sortedRecords = [...selectedCarRecords].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Don't show a circle for the last point (it will have the marker)
        const pathPoints = sortedRecords.slice(0, -1);

        return pathPoints.map((record, index) => {
            const lat = parseFloat(record.latitude);
            const lng = parseFloat(record.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            // Determine circle color based on speed or status
            let circleColor = '#3b82f6'; // Default blue

            if (!record.ignitionOn) {
                circleColor = '#6b7280'; // Gray for stopped
            } else if (record.speedKmh > 50) {
                circleColor = '#ef4444'; // Red for high speed
            } else if (record.speedKmh > 30) {
                circleColor = '#f59e0b'; // Orange for medium speed
            } else if (record.speedKmh > 0) {
                circleColor = '#10b981'; // Green for low speed
            } else {
                circleColor = '#6b7280'; // Gray for stationary
            }

            return (
                <CircleMarker
                    key={`point-${record.id}`}
                    center={[lat, lng]}
                    radius={6}
                    pathOptions={{
                        fillColor: circleColor,
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }}
                >
                    <Popup>
                        <div className="popup-content">
                            <div style={{ fontSize: '0.875rem' }}>
                                <strong>Point {index + 1}</strong><br />
                                <div style={{ marginTop: '0.5rem' }}>
                                    <strong>Time:</strong> {new Date(record.timestamp).toLocaleTimeString()}<br />
                                    <strong>Date:</strong> {new Date(record.timestamp).toLocaleDateString()}<br />
                                    <strong>Speed:</strong> {record.speedKmh?.toFixed(1)} km/h<br />
                                    <strong>Heading:</strong> {record.heading}°<br />
                                    <strong>Altitude:</strong> {record.altitude?.toFixed(1)} m<br />
                                    <strong>Ignition:</strong> {record.ignitionOn ? '✅ ON' : '❌ OFF'}<br />
                                    {record.statusFlags && (
                                        <>
                                            <strong>Event:</strong> {
                                                record.statusFlags.match(/EventName=([^;]+)/)?.[1] || 'N/A'
                                            }
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Popup>
                </CircleMarker>
            );
        });
    };


    useEffect(() => {
        if (selectedCarRecords && selectedCarRecords.length > 0) {
            console.group('GPS Records Debug');
            console.log('Selected car:', selectedCar);
            console.log('Total records:', selectedCarRecords.length);

            // Check for unique positions
            const uniqueCoords = new Set();
            selectedCarRecords.forEach(record => {
                const coordKey = `${record.latitude},${record.longitude}`;
                uniqueCoords.add(coordKey);
            });

            console.log('Unique coordinate pairs:', uniqueCoords.size);
            console.log('Coordinates:', Array.from(uniqueCoords));

            // Check if coordinates are changing
            const latitudes = selectedCarRecords.map(r => parseFloat(r.latitude));
            const longitudes = selectedCarRecords.map(r => parseFloat(r.longitude));

            console.log('Latitude range:', Math.min(...latitudes), 'to', Math.max(...latitudes));
            console.log('Longitude range:', Math.min(...longitudes), 'to', Math.max(...longitudes));

            console.groupEnd();
        }
    }, [selectedCarRecords, selectedCar]);


    // Render marker for selected car's current position
    const renderCarMarker = () => {
        if (!selectedCarRecords || selectedCarRecords.length === 0) return null;

        // Get the most recent record
        const sortedRecords = [...selectedCarRecords].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        const latest = sortedRecords[0];

        const lat = parseFloat(latest.latitude);
        const lng = parseFloat(latest.longitude);

        if (isNaN(lat) || isNaN(lng)) return null;

        // Create custom icon for the car's current position
        const carIcon = L.divIcon({
            html: `
            <div style="
                background-color: ${latest.ignitionOn ? '#10b981' : '#ef4444'};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
            ">
                <div style="
                    position: absolute;
                    top: -8px;
                    left: 50%;
                    transform: translateX(-50%) rotate(${latest.heading || 0}deg);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-bottom: 12px solid ${latest.ignitionOn ? '#10b981' : '#ef4444'};
                "></div>
            </div>
        `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            className: 'car-current-position'
        });

        return (
            <Marker
                position={[lat, lng]}
                icon={carIcon}
            >
                <Popup>
                    <div className="popup-content">
                        <div className="popup-header">
                            <strong>{selectedCar.model}</strong>
                            <span className="popup-plate" style={{
                                marginLeft: '0.5rem',
                                padding: '0.125rem 0.5rem',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem'
                            }}>
                                {selectedCar.licensePlate}
                            </span>
                        </div>
                        <div className="popup-details" style={{ marginTop: '0.75rem' }}>
                            <p><strong>Current Status</strong></p>
                            <div style={{ marginTop: '0.5rem' }}>
                                <strong>Speed:</strong> {latest.speedKmh?.toFixed(1) || '0'} km/h<br />
                                <strong>Heading:</strong> {latest.heading || 0}°<br />
                                <strong>Altitude:</strong> {latest.altitude?.toFixed(1) || '0'} m<br />
                                <strong>Ignition:</strong> {
                                    latest.ignitionOn
                                        ? <span style={{ color: '#10b981' }}>✅ ON</span>
                                        : <span style={{ color: '#ef4444' }}>❌ OFF</span>
                                }<br />
                                <strong>Last Update:</strong> {new Date(latest.timestamp).toLocaleString()}<br />
                                <strong>Satellites:</strong> {
                                    latest.statusFlags?.match(/Satellites=(\d+)/)?.[1] || 'N/A'
                                }<br />
                                {latest.statusFlags && (
                                    <>
                                        <strong>Last Event:</strong> {
                                            latest.statusFlags.match(/EventName=([^;]+)/)?.[1] || 'N/A'
                                        }
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Popup>
            </Marker>
        );
    };

    if (isLoading) {
        return (
            <div className={`gps-home-container full-page ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('gps.loading', 'Loading vehicles...')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`gps-home-container full-page ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    >
                        {t('common.retry', 'Try Again')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`gps-home-container full-page ${isDarkMode ? 'dark' : ''}`}>
            {/* Main Map Container */}
            <div className="map-container">

                <MapContainer
                    ref={mapRef}
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    zoomControl={false}
                >
                    <TileLayer
                        url={tileUrl}
                        attribution={attribution}
                    />

                    {/* Render in this order for proper layering */}
                    {selectedCar && selectedCarRecords.length > 0 && (
                        <>
                            {/* 1. Polyline (bottom layer) */}
                            {renderCarPath()}

                            {/* 2. Path points (middle layer) */}
                            {renderPathPoints()}

                            {/* 3. Current position marker (top layer) */}
                            {renderCarMarker()}
                        </>
                    )}
                </MapContainer>

            </div>

            {/* Custom Map Controls */}
            <div className="map-controls">
                {/* Go to Home Button */}
                <button
                    className="control-btn home-btn"
                    onClick={handleGoHome}
                    title={t('common.goHome', 'Go to Home')}
                >
                    🏠
                </button>

                {/* Zoom Controls */}
                <div className="zoom-controls">
                    <button
                        className="control-btn zoom-in"
                        onClick={handleZoomIn}
                        title={t('gps.zoomIn', 'Zoom In')}
                    >
                        +
                    </button>
                    <button
                        className="control-btn zoom-out"
                        onClick={handleZoomOut}
                        title={t('gps.zoomOut', 'Zoom Out')}
                    >
                        −
                    </button>
                </div>

                {selectedCarRecords.length > 0 && (
                    <button
                        className="control-btn center-btn"
                        onClick={handleCenterOnCar}
                        title={t('gps.centerOnVehicle', 'Center on Vehicle')}
                    >
                        🎯
                    </button>
                )}

                {/* Toggle floating card on mobile or show card when hidden */}
                {(isMobile || !showFloatingCard) && (
                    <button
                        className="control-btn toggle-card-btn"
                        onClick={isMobile ? handleToggleCard : handleShowCard}
                        title={t('gps.toggleInfo', 'Toggle Info')}
                    >
                        {(isMobile && cardMinimized) || (!isMobile && !showFloatingCard) ? '📍' : '🗂️'}
                    </button>
                )}
            </div>

            {/* Floating Car Info Card */}
            {selectedCar && showFloatingCard && (
                <div
                    ref={cardRef}
                    className={`floating-card ${isMobile ? 'mobile' : ''} ${cardMinimized ? 'minimized' : ''}`}
                    style={{
                        transform: isMobile && isDragging ? `translateY(${cardTransformY}px)` : undefined
                    }}
                >
                    <div
                        ref={headerRef}
                        className={`card-header ${isMobile ? 'draggable' : ''}`}
                    >
                        <div className="car-info">
                            <h3 className="car-title">{selectedCar.model}</h3>
                            <span className="car-plate">{selectedCar.licensePlate}</span>
                        </div>

                        <div className="card-actions">
                            <button
                                className="action-btn change-car"
                                onClick={() => setShowCarModal(true)}
                                title={t('gps.changeVehicle', 'Change Vehicle')}
                            >
                                🚗
                            </button>

                            {!isMobile && (
                                <button
                                    className="action-btn close-card"
                                    onClick={() => setShowFloatingCard(false)}
                                    title={t('common.close', 'Close')}
                                >
                                    ✕
                                </button>
                            )}

                            {isMobile && (
                                <button
                                    className="action-btn minimize-card"
                                    onClick={() => setCardMinimized(!cardMinimized)}
                                    title={cardMinimized ? t('common.expand', 'Expand') : t('common.minimize', 'Minimize')}
                                >
                                    {cardMinimized ? '▲' : '▼'}
                                </button>
                            )}
                        </div>

                        {/* Mobile drag indicator */}
                        {isMobile && (
                            <div className="drag-indicator"></div>
                        )}
                    </div>

                    {!cardMinimized && (
                        <div className="card-content">
                            {isLoadingRecords ? (
                                <div className="loading-records">
                                    <div className="loading-spinner-sm"></div>
                                    <span>{t('gps.loadingLocation', 'Loading location...')}</span>
                                </div>
                            ) : selectedCarRecords.length > 0 ? (
                                <>
                                    <div className="car-details">
                                        <div className="status-row">
                                            <div
                                                className="status-indicator"
                                                style={{ backgroundColor: getStatusColor(getCarStatus(selectedCar)) }}
                                            ></div>
                                            <span className="status-text">{getStatusText(getCarStatus(selectedCar))}</span>
                                        </div>

                                        <div className="detail-row">
                                            <span className="label">{t('gps.speed', 'Speed')}:</span>
                                            <span className="value">
                                                {selectedCarRecords[selectedCarRecords.length - 1]?.speedKmh?.toFixed(1) || '0'} km/h
                                            </span>
                                        </div>

                                        <div className="detail-row">
                                            <span className="label">{t('gps.lastUpdate', 'Last Update')}:</span>
                                            <span className="value">
                                                {new Date(selectedCarRecords[selectedCarRecords.length - 1]?.timestamp).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="detail-row">
                                            <span className="label">{t('gps.totalPoints', 'Total Points')}:</span>
                                            <span className="value">{selectedCarRecords.length}</span>
                                        </div>
                                    </div>

                                    {/* Car Control Actions */}
                                    <div className="car-actions-section">
                                        <h4 className="actions-title">{t('gps.carActions', 'Car Actions')}</h4>
                                        <div className="action-buttons">
                                            <div className="action-row">
                                                <button
                                                    className="action-btn-full start-engine"
                                                    onClick={handleStartEngine}
                                                    title={t('gps.actions.startEngine', 'Start Engine')}
                                                >
                                                    <span className="btn-icon">🔥</span>
                                                    <span>{t('gps.actions.startEngine', 'Start Engine')}</span>
                                                </button>
                                                <button
                                                    className="action-btn-full stop-engine"
                                                    onClick={handleStopEngine}
                                                    title={t('gps.actions.stopEngine', 'Stop Engine')}
                                                >
                                                    <span className="btn-icon">⏹️</span>
                                                    <span>{t('gps.actions.stopEngine', 'Stop Engine')}</span>
                                                </button>
                                            </div>

                                            <div className="action-row">
                                                <button
                                                    className="action-btn-full activate-horn"
                                                    onClick={handleActivateHorn}
                                                    title={t('gps.actions.activateHorn', 'Activate Horn')}
                                                >
                                                    <span className="btn-icon">📯</span>
                                                    <span>{t('gps.actions.horn', 'Horn')}</span>
                                                </button>
                                                <button
                                                    className="action-btn-full lock-car"
                                                    onClick={handleLockCar}
                                                    title={t('gps.actions.lockCar', 'Lock Car')}
                                                >
                                                    <span className="btn-icon">🔒</span>
                                                    <span>{t('gps.actions.lock', 'Lock')}</span>
                                                </button>
                                            </div>

                                            <button
                                                className="action-btn-full unlock-car"
                                                onClick={handleUnlockCar}
                                                title={t('gps.actions.unlockCar', 'Unlock Car')}
                                            >
                                                <span className="btn-icon">🔓</span>
                                                <span>{t('gps.actions.unlock', 'Unlock Car')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="no-data">
                                    <p>{t('gps.noLocationData', 'No location data available for this vehicle.')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Car Selection Modal */}
            {showCarModal && (
                <div className="modal-overlay" onClick={() => setShowCarModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('gps.selectVehicle', 'Select Vehicle')}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowCarModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {cars.length === 0 ? (
                                <p className="no-cars">{t('gps.noVehicles', 'No vehicles available.')}</p>
                            ) : (
                                <div className="cars-list">
                                    {cars.map((car) => (
                                        <div
                                            key={car.id}
                                            className={`car-option ${selectedCar?.id === car.id ? 'selected' : ''}`}
                                            onClick={() => handleCarSelect(car)}
                                        >
                                            <div className="car-option-info">
                                                <span className="car-option-model">{car.model}</span>
                                                <span className="car-option-plate">{car.licensePlate}</span>
                                            </div>

                                            <div className="car-option-meta">
                                                {car.deviceSerialNumber && (
                                                    <span className="device-serial">
                                                        {t('gps.device', 'Device')}: {car.deviceSerialNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GpsHome;