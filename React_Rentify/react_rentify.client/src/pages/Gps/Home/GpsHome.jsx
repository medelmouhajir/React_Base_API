// src/pages/Gps/Home/GpsHome.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import gpsService from '../../../services/gpsService';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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



    const polylinePositions = useMemo(() => {
        if (!selectedCarRecords?.length) return [];

        const sorted = [...selectedCarRecords].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        return sorted
            .map(r => [Number(r.latitude), Number(r.longitude)])
            .filter(([lat, lng]) =>
                Number.isFinite(lat) && Number.isFinite(lng) &&
                lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
            );
    }, [selectedCarRecords]);

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
        if (!selectedCarRecords?.length) return null;

        // sort oldest → newest
        const sorted = [...selectedCarRecords].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // build [lat, lng] tuples, cast to numbers, and filter invalids
        const positions = sorted
            .map(r => [Number(r.latitude), Number(r.longitude)])
            .filter(([lat, lng]) =>
                Number.isFinite(lat) &&
                Number.isFinite(lng) &&
                lat !== 0 &&
                lng !== 0 &&
                Math.abs(lat) <= 90 &&
                Math.abs(lng) <= 180
            );

        if (positions.length < 2) return null;

        return (
            <Polyline
                key={`${selectedCar?.id || 'car'}:${polylinePositions.length}`}
                positions={polylinePositions}
                color={selectedCar?.color || '#3b82f6'}
                weight={4}
                opacity={0.9}
                dashArray="5,5"
            />
        );
    };


    // Render marker for selected car's current position
    const renderCarMarker = () => {
        if (!selectedCarRecords.length) return null;

        const latest = selectedCarRecords[selectedCarRecords.length - 1];
        const position = [latest.latitude, latest.longitude];

        return (
            <Marker position={position}>
                <Popup>
                    <div className="popup-content">
                        <div className="popup-header">
                            <strong>{selectedCar.model}</strong>
                            <span className="popup-plate">{selectedCar.licensePlate}</span>
                        </div>
                        <div className="popup-details">
                            <p><strong>{t('gps.speed', 'Speed')}:</strong> {latest.speedKmh?.toFixed(1) || '0'} km/h</p>
                            <p><strong>{t('gps.lastSeen', 'Last seen')}:</strong> {new Date(latest.timestamp).toLocaleString()}</p>
                            {latest.ignitionOn !== null && (
                                <p><strong>{t('gps.ignition', 'Ignition')}:</strong> {latest.ignitionOn ? t('gps.on', 'On') : t('gps.off', 'Off')}</p>
                            )}
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
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ width: '100%', height: '100%' }}
                    whenCreated={(map) => { mapRef.current = map; }}   // <— use this, not ref
                    zoomControl={false}
                >
                    <TileLayer
                        url={tileUrl}
                        attribution={attribution}
                        subdomains={['a', 'b', 'c']}
                        maxZoom={19}
                    />

                    {renderCarPath()}
                    {renderCarMarker()}
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