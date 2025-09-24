// src/pages/Gps/Home/GpsHome.jsx
import React, { useState, useEffect, useRef } from 'react';
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
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle car selection
    const handleCarSelect = (car) => {
        setSelectedCar(car);
        setShowCarModal(false);
    };

    // Handle map interactions
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
        if (!selectedCarRecords.length) return null;

        const positions = selectedCarRecords.map(record => [record.latitude, record.longitude]);

        return (
            <Polyline
                positions={positions}
                pathOptions={{
                    color: selectedCar?.color || '#3b82f6',
                    weight: 4,
                    opacity: 0.8,
                }}
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
                    ref={mapRef}
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

                {/* Toggle floating card on mobile */}
                {isMobile && (
                    <button
                        className="control-btn toggle-card-btn"
                        onClick={() => setShowFloatingCard(!showFloatingCard)}
                        title={t('gps.toggleInfo', 'Toggle Info')}
                    >
                        {showFloatingCard ? '📍' : '🗂️'}
                    </button>
                )}
            </div>

            {/* Floating Car Info Card */}
            {selectedCar && showFloatingCard && (
                <div className={`floating-card ${isMobile ? 'mobile' : ''}`}>
                    <div className="card-header">
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
                        </div>
                    </div>

                    <div className="card-content">
                        {isLoadingRecords ? (
                            <div className="loading-records">
                                <div className="loading-spinner-sm"></div>
                                <span>{t('gps.loadingLocation', 'Loading location...')}</span>
                            </div>
                        ) : selectedCarRecords.length > 0 ? (
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
                        ) : (
                            <div className="no-data">
                                <p>{t('gps.noLocationData', 'No location data available for this vehicle.')}</p>
                            </div>
                        )}
                    </div>
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