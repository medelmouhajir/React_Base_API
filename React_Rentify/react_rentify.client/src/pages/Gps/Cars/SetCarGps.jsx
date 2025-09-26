// src/pages/Gps/Cars/SetCarGps.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import gpsService from '../../../services/gpsService';
import './SetCarGps.css';

const SetCarGps = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    // State management
    const [cars, setCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCar, setSelectedCar] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [deviceInput, setDeviceInput] = useState('');
    const [trackingEnabled, setTrackingEnabled] = useState(false);

    // Fetch cars with GPS status
    useEffect(() => {
        const fetchCars = async () => {
            setIsLoading(true);
            setError(null);

            try {
                console.log('🚗 Fetching cars for all agencies:');
                const data = await gpsService.getCarsWithGps();
                console.log('✅ Cars fetched successfully:', data);
                setCars(data || []);
                setFilteredCars(data || []);
            } catch (err) {
                console.error('❌ Error fetching cars:', err);
                setError(t('gps.errors.fetchCars', 'Failed to load vehicles. Please try again.'));
                toast.error(t('gps.errors.fetchCars', 'Failed to load vehicles'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchCars();
    }, [t]);

    // Filter cars based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredCars(cars);
            return;
        }

        const filtered = cars.filter(car =>
            car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            car.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            car.deviceSerialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCars(filtered);
    }, [searchTerm, cars]);

    // Handle configure GPS for a car
    const handleConfigureGps = (car) => {
        setSelectedCar(car);
        setDeviceInput(car.deviceSerialNumber || '');
        setTrackingEnabled(car.isTrackingActive || false);
        setShowModal(true);
    };

    // Handle save GPS configuration
    const handleSaveConfig = async () => {
        if (!selectedCar) return;

        setModalLoading(true);

        try {
            const updateData = {
                deviceSerialNumber: deviceInput.trim() || null,
                isTrackingActive: trackingEnabled && deviceInput.trim()
            };

            console.log('🔧 Updating GPS config for car:', selectedCar.id, updateData);

            const updatedCar = await gpsService.updateCarGps(selectedCar.id, updateData);

            // Update the car in our local state
            setCars(prevCars =>
                prevCars.map(car =>
                    car.id === selectedCar.id
                        ? { ...car, ...updatedCar }
                        : car
                )
            );

            toast.success(t('gps.configUpdated', 'GPS configuration updated successfully'));
            setShowModal(false);

        } catch (err) {
            console.error('❌ Error updating GPS config:', err);
            toast.error(t('gps.errors.updateConfig', 'Failed to update GPS configuration'));
        } finally {
            setModalLoading(false);
        }
    };

    // Calculate statistics
    const stats = {
        total: cars.length,
        active: cars.filter(car => car.isTrackingActive && car.deviceSerialNumber).length,
        inactive: cars.filter(car => car.deviceSerialNumber && !car.isTrackingActive).length,
        noDevice: cars.filter(car => !car.deviceSerialNumber).length
    };

    // Get GPS status for display
    const getGpsStatus = (car) => {
        if (!car.deviceSerialNumber) return { status: 'no-device', label: t('gps.status.noDevice', 'No Device') };
        if (car.isTrackingActive) return { status: 'active', label: t('gps.status.active', 'Active') };
        return { status: 'inactive', label: t('gps.status.inactive', 'Inactive') };
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`set-car-gps-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{t('gps.loading', 'Loading vehicles...')}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`set-car-gps-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="page-header">
                    <div className="header-content">
                        <h1>{t('gps.setCarGps', 'GPS Configuration')}</h1>
                        <p className="header-subtitle">{t('gps.manageGpsDevices', 'Manage GPS devices for your vehicles')}</p>
                    </div>
                </div>

                <div className="loading-container">
                    <div style={{ textAlign: 'center', color: '#ef4444' }}>
                        <h3>⚠️ {t('common.error', 'Error')}</h3>
                        <p>{error}</p>
                        <button
                            className="config-btn"
                            onClick={() => window.location.reload()}
                        >
                            {t('common.retry', 'Try Again')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`set-car-gps-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>{t('gps.setCarGps', 'GPS Configuration')}</h1>
                    <p className="header-subtitle">{t('gps.manageGpsDevices', 'Manage GPS devices for your vehicles')}</p>
                </div>
            </div>

            {/* Search Section */}
            <div className="search-section">
                <div className="search-box">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t('gps.searchPlaceholder', 'Search by model, license plate, or device...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search-btn" onClick={clearSearch} title={t('common.clear', 'Clear')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0v-6h-8m0 -5h3l3 3" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">{t('gps.stats.totalVehicles', 'Total Vehicles')}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.active}</div>
                        <div className="stat-label">{t('gps.stats.activeTracking', 'Active Tracking')}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon inactive">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
                            <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.inactive}</div>
                        <div className="stat-label">{t('gps.stats.inactiveDevices', 'Inactive Devices')}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon total">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0v-6h-8m0 -5h3l3 3" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.noDevice}</div>
                        <div className="stat-label">{t('gps.stats.noDevice', 'No Device')}</div>
                    </div>
                </div>
            </div>

            {/* Cars Grid */}
            <div className="cars-grid">
                {filteredCars.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0v-6h-8m0 -5h3l3 3" />
                            </svg>
                        </div>
                        <h3>{t('gps.noVehiclesFound', 'No vehicles found')}</h3>
                        <p>{t('gps.noVehiclesMessage', 'No vehicles match your search criteria.')}</p>
                    </div>
                ) : (
                    filteredCars.map((car) => {
                        const gpsStatus = getGpsStatus(car);
                        return (
                            <div key={car.id} className="car-card">
                                <div className="car-header">
                                    <h3 className="car-model">{car.model}</h3>
                                    <span className={`gps-status ${gpsStatus.status}`}>
                                        {gpsStatus.label}
                                    </span>
                                </div>

                                <div className="car-details">
                                    <div className="detail-item">
                                        <span className="detail-label">{t('cars.licensePlate', 'License Plate')}</span>
                                        <span className="detail-value license-plate">{car.licensePlate}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">{t('gps.deviceSerial', 'Device Serial')}</span>
                                        <span className="detail-value">
                                            {car.deviceSerialNumber ? (
                                                <span className="device-serial">{car.deviceSerialNumber}</span>
                                            ) : (
                                                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                                                    {t('gps.noDevice', 'No device assigned')}
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-label">{t('gps.trackingStatus', 'Tracking')}</span>
                                        <span className="detail-value">
                                            {car.isTrackingActive ? (
                                                <span style={{ color: '#10b981' }}>✅ {t('common.enabled', 'Enabled')}</span>
                                            ) : (
                                                <span style={{ color: '#ef4444' }}>❌ {t('common.disabled', 'Disabled')}</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="car-actions">
                                    <button
                                        className="config-btn"
                                        onClick={() => handleConfigureGps(car)}
                                        title={t('gps.configureGps', 'Configure GPS')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        {t('gps.configure', 'Configure')}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Configuration Modal */}
            {showModal && selectedCar && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('gps.configureGpsFor', 'Configure GPS for')} {selectedCar.model}</h3>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowModal(false)}
                                title={t('common.close', 'Close')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">
                                    {t('gps.deviceSerial', 'Device Serial Number')}
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={deviceInput}
                                    onChange={(e) => setDeviceInput(e.target.value)}
                                    placeholder={t('gps.enterDeviceSerial', 'Enter device serial number')}
                                />
                                <p className="form-hint">
                                    {t('gps.deviceSerialHint', 'Leave empty to remove GPS device assignment')}
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={trackingEnabled && deviceInput.trim()}
                                        onChange={(e) => setTrackingEnabled(e.target.checked)}
                                        disabled={!deviceInput.trim()}
                                    />
                                    <span className="checkmark"></span>
                                    {t('gps.enableTracking', 'Enable GPS tracking')}
                                </label>
                                <p className="form-hint">
                                    {t('gps.trackingHint', 'Tracking can only be enabled if a device is assigned')}
                                </p>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowModal(false)}
                                disabled={modalLoading}
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSaveConfig}
                                disabled={modalLoading}
                            >
                                {modalLoading ? (
                                    <>
                                        <div className="loading-spinner-sm"></div>
                                        {t('common.saving', 'Saving...')}
                                    </>
                                ) : (
                                    t('common.save', 'Save')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SetCarGps;