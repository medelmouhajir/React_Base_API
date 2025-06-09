// src/pages/Gps/Home/GpsHome.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import gpsService from '../../../services/gpsService';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import './GpsHome.css';

// Fix Leaflet’s default icon paths (Vite-friendly imports)
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const GpsHome = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const mapRef = useRef(null);

    const [cars, setCars] = useState([]);
    const [recordsByCar, setRecordsByCar] = useState({}); // { [carId]: [ { latitude, longitude, timestamp } ] }
    const [filterText, setFilterText] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showPanel, setShowPanel] = useState(!isMobile);

    // Fetch cars for this agency
    useEffect(() => {
        if (!agencyId) return;

        const fetchCars = async () => {
            try {
                const data = await carService.getByAgencyId(agencyId);
                setCars(data || []);
            } catch (err) {
                console.error('Error fetching cars:', err);
            }
        };

        fetchCars();
    }, [agencyId]);

    // Whenever cars change, fetch GPS records for each device serial
    useEffect(() => {
        if (!cars.length) return;

        const fetchAllRecords = async () => {
            const allRecords = {};
            await Promise.all(
                cars.map(async (car) => {
                    // We assume each `car` has a `gpsDeviceSerial` property.
                    // If your API returns a different field, adjust accordingly.
                    const serial = car.gpsDeviceSerial;
                    if (serial) {
                        try {
                            const recs = await gpsService.getRecordsByDevice(serial);
                            // recs should be an array: [{ latitude, longitude, timestamp }, ...]
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
            setShowPanel(!mobile);
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
    };

    // Decide tile layer URLs
    const lightTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const tileUrl = isDarkMode ? darkTiles : lightTiles;
    const attribution = isDarkMode
        ? '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        : '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>';

    return (
        <div className={`gps-home-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Toggle panel button on mobile */}
            {isMobile && (
                <button
                    className="panel-toggle-btn"
                    onClick={() => setShowPanel((prev) => !prev)}
                >
                    {showPanel ? '✕' : '☰'}
                </button>
            )}

            {/* Floating side panel */}
            {showPanel && (
                <div className="panel">
                    <div className="panel-header">
                        <h2>Cars ({filteredCars.length}/{cars.length})</h2>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Filter by model or plate..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                    <div className="panel-list">
                        {filteredCars.map((car) => {
                            const recs = recordsByCar[car.id] || [];
                            const lastPos = recs.length
                                ? [recs[recs.length - 1].latitude, recs[recs.length - 1].longitude]
                                : null;
                            return (
                                <div key={car.id} className="panel-item">
                                    <div>
                                        <strong>{car.model}</strong>
                                        <br />
                                        <span className="plate">{car.licensePlate}</span>
                                    </div>
                                    {lastPos ? (
                                        <button
                                            className="focus-btn"
                                            onClick={() => focusOnCar(car.id)}
                                        >
                                            Focus
                                        </button>
                                    ) : (
                                        <span className="no-data">No GPS</span>
                                    )}
                                </div>
                            );
                        })}
                        {!filteredCars.length && (
                            <div className="no-results">No cars match your filter.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Full-screen map */}
            <MapContainer
                className="map-container"
                center={[0, 0]}
                zoom={2}
                whenCreated={(mapInstance) => {
                    mapRef.current = mapInstance;
                }}
                scrollWheelZoom={true}
                attributionControl={true}
            >

                <TileLayer
                    url={tileUrl}
                    attribution={attribution}
                    subdomains={'abcd'.split('')}
                    maxZoom={19}
                />

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
                                pathOptions={{ color: car.color || '#3388ff', weight: 4, opacity: 0.7 }}
                            />
                            <Marker position={last}>
                                <Popup>
                                    <div className="popup-content">
                                        <strong>{car.model}</strong>
                                        <br />
                                        Plate: {car.licensePlate}
                                        <br />
                                        Last seen: {new Date(recs[recs.length - 1].timestamp).toLocaleString()}
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
