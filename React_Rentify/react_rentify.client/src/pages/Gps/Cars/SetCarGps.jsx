// src/pages/Gps/Cars/SetCarGps.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { gpsService } from '../../../services/gpsService';
import { toast } from 'react-toastify';
import './SetCarGps.css';

const SetCarGps = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const agencyId = user?.agencyId;

    // State management
    const [cars, setCars] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Form states for GPS assignment
    const [deviceSerialNumber, setDeviceSerialNumber] = useState('');
    const [isTrackingActive, setIsTrackingActive] = useState(false);
    const [isNewDevice, setIsNewDevice] = useState(false);
    const [newDeviceModel, setNewDeviceModel] = useState('');

    // Load data on component mount
    useEffect(() => {
        if (agencyId) {
            loadData();
        }
    }, [agencyId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [carsData, devicesData] = await Promise.all([
                gpsService.getCarsByAgencyWithGps(agencyId),
                gpsService.getAllDevices()
            ]);

            setCars(carsData);
            setDevices(devicesData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error(t('gps.cars.loadError', 'Failed to load data'));
        } finally {
            setIsLoading(false);
        }
    };

    // Open modal for car GPS configuration
    const openConfigModal = (car) => {
        setSelectedCar(car);
        setDeviceSerialNumber(car.deviceSerialNumber || '');
        setIsTrackingActive(car.isTrackingActive || false);
        setShowModal(true);
    };

    // Close modal and reset form
    const closeModal = () => {
        setShowModal(false);
        setSelectedCar(null);
        setDeviceSerialNumber('');
        setIsTrackingActive(false);
        setIsNewDevice(false);
        setNewDeviceModel('');
    };

    // Handle GPS assignment/removal
    const handleGpsUpdate = async (e) => {
        e.preventDefault();
        if (!selectedCar) return;

        setIsSaving(true);
        try {
            // If removing GPS device
            if (!deviceSerialNumber.trim()) {
                await gpsService.updateCarGps(selectedCar.id, {
                    deviceSerialNumber: null,
                    isTrackingActive: false
                });
                toast.success(t('gps.cars.removeSuccess', 'GPS device removed successfully'));
            } else {
                // If adding/updating GPS device
                // Check if device exists or create new one
                if (isNewDevice && deviceSerialNumber.trim()) {
                    try {
                        await gpsService.addDevice({
                            deviceSerialNumber: deviceSerialNumber.trim(),
                            model: newDeviceModel || 'Unknown',
                            installCarPlate: selectedCar.licensePlate,
                            installedOn: new Date().toISOString(),
                            deactivatedOn: null
                        });
                    } catch (error) {
                        // Device might already exist, which is fine
                        console.log('Device creation warning:', error);
                    }
                }

                // Update car GPS settings
                await gpsService.updateCarGps(selectedCar.id, {
                    deviceSerialNumber: deviceSerialNumber.trim(),
                    isTrackingActive: isTrackingActive
                });

                toast.success(t('gps.cars.updateSuccess', 'GPS settings updated successfully'));
            }

            // Refresh data
            await loadData();
            closeModal();

        } catch (error) {
            console.error('Error updating GPS:', error);
            toast.error(t('gps.cars.updateError', 'Failed to update GPS settings'));
        } finally {
            setIsSaving(false);
        }
    };

    // Filter cars based on search term
    const filteredCars = cars.filter(car =>
        car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.deviceSerialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get GPS status for a car
    const getGpsStatus = (car) => {
        if (!car.deviceSerialNumber) {
            return { status: 'no-device', text: t('gps.cars.noDevice', 'No GPS') };
        }
        if (car.isTrackingActive) {
            return { status: 'active', text: t('gps.cars.active', 'Active') };
        }
        return { status: 'inactive', text: t('gps.cars.inactive', 'Inactive') };
    };

    if (isLoading) {
        return (
            <div className={`set-car-gps-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`set-car-gps-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>{t('gps.cars.title', 'GPS Management')}</h1>
                    <p className="header-subtitle">
                        {t('gps.cars.subtitle', 'Manage GPS devices for your vehicle fleet')}
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="search-section">
                <div className="search-box">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        placeholder={t('gps.cars.searchPlaceholder', 'Search cars by model, plate, or GPS device...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="clear-search-btn"
                            aria-label={t('common.clear', 'Clear')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">{cars.length}</span>
                        <span className="stat-label">{t('gps.cars.totalCars', 'Total Cars')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">
                            {cars.filter(car => car.deviceSerialNumber && car.isTrackingActive).length}
                        </span>
                        <span className="stat-label">{t('gps.cars.activeTracking', 'Active Tracking')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon inactive">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">
                            {cars.filter(car => !car.deviceSerialNumber).length}
                        </span>
                        <span className="stat-label">{t('gps.cars.noDevice', 'No GPS Device')}</span>
                    </div>
                </div>
            </div>

            {/* Cars Grid */}
            <div className="cars-grid">
                {filteredCars.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M9 12l2 2 4-4" />
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                        </div>
                        <h3>{t('gps.cars.noCarsFound', 'No cars found')}</h3>
                        <p>{t('gps.cars.noResultsText', 'Try adjusting your search criteria')}</p>
                    </div>
                ) : (
                    filteredCars.map((car) => {
                        const gpsStatus = getGpsStatus(car);
                        return (
                            <div key={car.id} className="car-card">
                                <div className="car-header">
                                    <h3 className="car-model">{car.model}</h3>
                                    <div className={`gps-status ${gpsStatus.status}`}>
                                        {gpsStatus.text}
                                    </div>
                                </div>

                                <div className="car-details">
                                    <div className="detail-item">
                                        <span className="detail-label">{t('cars.licensePlate', 'License Plate')}</span>
                                        <span className="detail-value license-plate">{car.licensePlate}</span>
                                    </div>

                                    {car.deviceSerialNumber && (
                                        <div className="detail-item">
                                            <span className="detail-label">{t('gps.device', 'GPS Device')}</span>
                                            <span className="detail-value device-serial">{car.deviceSerialNumber}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="car-actions">
                                    <button
                                        onClick={() => openConfigModal(car)}
                                        className="config-btn"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                        </svg>
                                        {t('gps.cars.configure', 'Configure GPS')}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal for GPS Configuration */}
            {showModal && selectedCar && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('gps.cars.configureTitle', 'Configure GPS for {{model}}', { model: selectedCar.model })}</h2>
                            <button onClick={closeModal} className="modal-close">×</button>
                        </div>

                        <form onSubmit={handleGpsUpdate} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">
                                    {t('gps.cars.deviceSerialNumber', 'GPS Device Serial Number')}
                                </label>
                                <div className="device-input-group">
                                    <input
                                        type="text"
                                        value={deviceSerialNumber}
                                        onChange={(e) => setDeviceSerialNumber(e.target.value)}
                                        placeholder={t('gps.cars.serialPlaceholder', 'Enter device serial number...')}
                                        className="form-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsNewDevice(!isNewDevice)}
                                        className={`new-device-toggle ${isNewDevice ? 'active' : ''}`}
                                    >
                                        {t('gps.cars.newDevice', 'New Device')}
                                    </button>
                                </div>
                                <small className="form-hint">
                                    {t('gps.cars.serialHint', 'Leave empty to remove GPS device from this car')}
                                </small>
                            </div>

                            {isNewDevice && deviceSerialNumber && (
                                <div className="form-group">
                                    <label className="form-label">
                                        {t('gps.cars.deviceModel', 'Device Model')}
                                    </label>
                                    <input
                                        type="text"
                                        value={newDeviceModel}
                                        onChange={(e) => setNewDeviceModel(e.target.value)}
                                        placeholder={t('gps.cars.modelPlaceholder', 'e.g., Teltonika FMB920')}
                                        className="form-input"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="isTrackingActive"
                                        checked={isTrackingActive}
                                        onChange={(e) => setIsTrackingActive(e.target.checked)}
                                        disabled={!deviceSerialNumber.trim()}
                                        className="form-checkbox"
                                    />
                                    <label htmlFor="isTrackingActive" className="checkbox-label">
                                        {t('gps.cars.enableTracking', 'Enable GPS tracking')}
                                    </label>
                                </div>
                                <small className="form-hint">
                                    {t('gps.cars.trackingHint', 'GPS device must be assigned to enable tracking')}
                                </small>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn btn-secondary"
                                    disabled={isSaving}
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="btn-spinner"></div>
                                            {t('common.saving', 'Saving...')}
                                        </>
                                    ) : (
                                        t('common.save', 'Save')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SetCarGps;