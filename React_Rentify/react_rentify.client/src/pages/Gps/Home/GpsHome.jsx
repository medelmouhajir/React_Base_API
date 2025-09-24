// src/pages/Gps/Home/GpsHome.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import gpsService from '../../../services/gpsService';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import './GpsHome.css';

// Fix Leaflet's default icon paths (Vite-friendly imports)
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const GpsHome = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const agencyId = user?.agencyId;

    const mapRef = useRef(null);

    const [cars, setCars] = useState([]);
    const [recordsByCar, setRecordsByCar] = useState({}); // { [carId]: [ { latitude, longitude, timestamp } ] }
    const [filterText, setFilterText] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showPanel, setShowPanel] = useState(!isMobile);
    const [panelExpanded, setPanelExpanded] = useState(true);
    const [panelMinimized, setPanelMinimized] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch cars for this agency
    useEffect(() => {
        if (!agencyId) return;

        const fetchCars = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await gpsService.getCarsByAgencyId(agencyId);
                setCars(data || []);
            } catch (err) {
                console.error('Error fetching cars:', err);
                setError(t('gps.errors.fetchCars'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchCars();
    }, [agencyId, t]);

    // Whenever cars change, fetch GPS records for each device serial
    useEffect(() => {
        if (!cars.length) return;

        const fetchAllRecords = async () => {
            const allRecords = {};
            await Promise.all(
                cars.map(async (car) => {
                    const serial = car.gpsDeviceSerial;
                    if (serial) {
                        try {
                            const recs = await gpsService.getRecordsByDevice(serial);
                            allRecords[car.id] = recs || [];
                        } catch (err) {
                            console.error(`Error fetching records for device ${serial}:`, err);
                            allRecords[car.id] = [];
                        }
                    }
                })
            );
            setRecordsByCar(allRecords);
        };

        fetchAllRecords();
    }, [cars]);

    // Fit map bounds whenever records update
    useEffect(() => {
        const map = mapRef.current;
        if (map && Object.keys(recordsByCar).length) {
            const allLatLngs = [];
            Object.values(recordsByCar).forEach((points) => {
                points.forEach((pt) => {
                    allLatLngs.push([pt.latitude, pt.longitude]);
                });
            });
            if (allLatLngs.length) {
                map.fitBounds(allLatLngs, { padding: [50, 50] });
            }
        }
    }, [recordsByCar]);

    // Handle window resize to toggle panel on mobile
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setShowPanel(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filtered cars list based on filterText (by model or licensePlate)
    const filteredCars = cars.filter((car) => {
        const search = filterText.trim().toLowerCase();
        if (!search) return true;
        const modelMatch = car.model?.toLowerCase().includes(search);
        const plateMatch = car.licensePlate?.toLowerCase().includes(search);
        return modelMatch || plateMatch;
    });

    // Handler to fly map to a given car
    const focusOnCar = (carId) => {
        const map = mapRef.current;
        const points = recordsByCar[carId] || [];
        if (!map || !points.length) return;
        const last = points[points.length - 1];
        map.flyTo([last.latitude, last.longitude], 15, { duration: 1.5 });
        setSelectedCar(carId);
    };

    // Mock car action handlers
    const handleStartEngine = (carId) => {
        console.log('Starting engine for car:', carId);
        // TODO: Implement actual service call
    };

    const handleStopEngine = (carId) => {
        console.log('Stopping engine for car:', carId);
        // TODO: Implement actual service call
    };

    const handleLockCar = (carId) => {
        console.log('Locking car:', carId);
        // TODO: Implement actual service call
    };

    const handleUnlockCar = (carId) => {
        console.log('Unlocking car:', carId);
        // TODO: Implement actual service call
    };

    const handleHornBeep = (carId) => {
        console.log('Beeping horn for car:', carId);
        // TODO: Implement actual service call
    };

    const handleGetLocation = (carId) => {
        console.log('Getting location for car:', carId);
        focusOnCar(carId);
    };

    // Toggle panel visibility (mobile)
    const togglePanel = () => {
        setShowPanel(prev => !prev);
    };

    // Toggle panel expanded/collapsed state
    const togglePanelExpanded = () => {
        if (panelMinimized) {
            setPanelMinimized(false);
            setPanelExpanded(true);
        } else {
            setPanelExpanded(prev => !prev);
        }
    };

    // Minimize panel to just the header
    const minimizePanel = () => {
        setPanelMinimized(true);
        setPanelExpanded(false);
    };

    // Decide tile layer URLs for transparent map
    const lightTiles = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const tileUrl = isDarkMode ? darkTiles : lightTiles;
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    if (isLoading) {
        return (
            <div className={`gps-home-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`gps-home-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Mobile panel toggle button */}
            {isMobile && (
                <button
                    className="panel-toggle-btn"
                    onClick={togglePanel}
                    title={showPanel ? t('gps.hidePanel') : t('gps.showPanel')}
                >
                    {showPanel ? '✕' : '☰'}
                </button>
            )}

            {/* Floating side panel */}
            {showPanel && (
                <div className={`panel ${panelMinimized ? 'minimized' : ''} ${panelExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="panel-header">
                        <div className="panel-title-row">
                            <h2>{t('gps.carsTitle')} ({filteredCars.length}/{cars.length})</h2>
                            <div className="panel-controls">
                                <button
                                    className="panel-control-btn"
                                    onClick={togglePanelExpanded}
                                    title={panelExpanded ? t('gps.collapsePanel') : t('gps.expandPanel')}
                                >
                                    {panelMinimized ? '▲' : panelExpanded ? '▼' : '▲'}
                                </button>
                                <button
                                    className="panel-control-btn"
                                    onClick={minimizePanel}
                                    title={t('gps.minimizePanel')}
                                >
                                    −
                                </button>
                                {!isMobile && (
                                    <button
                                        className="panel-control-btn"
                                        onClick={() => setShowPanel(false)}
                                        title={t('gps.closePanel')}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {(panelExpanded && !panelMinimized) && (
                            <input
                                type="text"
                                className="filter-input"
                                placeholder={t('gps.filterPlaceholder')}
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        )}
                    </div>

                    {(panelExpanded && !panelMinimized) && (
                        <div className="panel-content">
                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <div className="panel-list">
                                {filteredCars.map((car) => {
                                    const recs = recordsByCar[car.id] || [];
                                    const lastPos = recs.length
                                        ? [recs[recs.length - 1].latitude, recs[recs.length - 1].longitude]
                                        : null;
                                    const isSelected = selectedCar === car.id;

                                    return (
                                        <div key={car.id} className={`panel-item ${isSelected ? 'selected' : ''}`}>
                                            <div className="car-info">
                                                <div className="car-main-info">
                                                    <strong>{car.model}</strong>
                                                    <span className="plate">{car.licensePlate}</span>
                                                </div>

                                                {lastPos && (
                                                    <div className="car-status">
                                                        <span className="status-indicator online"></span>
                                                        <span className="status-text">{t('gps.online')}</span>
                                                        <span className="last-seen">
                                                            {t('gps.lastSeen')}: {new Date(recs[recs.length - 1].timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                )}

                                                {!lastPos && (
                                                    <div className="car-status">
                                                        <span className="status-indicator offline"></span>
                                                        <span className="status-text">{t('gps.offline')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="car-actions">
                                                {lastPos ? (
                                                    <>
                                                        <button
                                                            className="action-btn primary"
                                                            onClick={() => focusOnCar(car.id)}
                                                            title={t('gps.focusOnMap')}
                                                        >
                                                            📍
                                                        </button>
                                                        <div className="action-group">
                                                            <button
                                                                className="action-btn secondary"
                                                                onClick={() => handleStartEngine(car.id)}
                                                                title={t('gps.startEngine')}
                                                            >
                                                                🔥
                                                            </button>
                                                            <button
                                                                className="action-btn secondary"
                                                                onClick={() => handleLockCar(car.id)}
                                                                title={t('gps.lockCar')}
                                                            >
                                                                🔒
                                                            </button>
                                                            <button
                                                                className="action-btn secondary"
                                                                onClick={() => handleHornBeep(car.id)}
                                                                title={t('gps.hornBeep')}
                                                            >
                                                                📢
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="no-data">{t('gps.noGpsData')}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {!filteredCars.length && (
                                    <div className="no-results">{t('gps.noMatchingCars')}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Full-screen map with custom zoom controls */}
            <MapContainer
                className="map-container"
                center={[33.5731, -7.5898]} // Casablanca coordinates as default
                zoom={12}
                whenCreated={(mapInstance) => {
                    mapRef.current = mapInstance;
                }}
                scrollWheelZoom={true}
                attributionControl={true}
                zoomControl={false} // Disable default zoom control
            >
                {/* Transparent tile layer */}
                <TileLayer
                    url={tileUrl}
                    attribution={attribution}
                    subdomains={'abcd'.split('')}
                    maxZoom={19}
                    opacity={0.8} // Make map slightly transparent
                />

                {/* Custom zoom controls positioned at bottom right */}
                <div className="custom-zoom-controls">
                    <button
                        className="zoom-btn zoom-in"
                        onClick={() => mapRef.current?.zoomIn()}
                        title={t('gps.zoomIn')}
                    >
                        +
                    </button>
                    <button
                        className="zoom-btn zoom-out"
                        onClick={() => mapRef.current?.zoomOut()}
                        title={t('gps.zoomOut')}
                    >
                        −
                    </button>
                </div>

                {/* Render car markers and paths */}
                {filteredCars.map((car) => {
                    const recs = recordsByCar[car.id] || [];
                    if (!recs.length) return null;

                    // Build polyline positions
                    const positions = recs.map((pt) => [pt.latitude, pt.longitude]);
                    const last = positions[positions.length - 1];

                    return (
                        <React.Fragment key={car.id}>
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color: car.color || '#3388ff',
                                    weight: 4,
                                    opacity: 0.7,
                                    className: selectedCar === car.id ? 'selected-path' : ''
                                }}
                            />
                            <Marker position={last}>
                                <Popup>
                                    <div className="popup-content">
                                        <div className="popup-header">
                                            <strong>{car.model}</strong>
                                            <span className="popup-plate">{car.licensePlate}</span>
                                        </div>
                                        <div className="popup-details">
                                            <p>{t('gps.lastSeen')}: {new Date(recs[recs.length - 1].timestamp).toLocaleString()}</p>
                                            <div className="popup-actions">
                                                <button
                                                    className="popup-btn"
                                                    onClick={() => handleGetLocation(car.id)}
                                                >
                                                    {t('gps.centerMap')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default GpsHome;