// src/pages/Gps/Home/GpsHome.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

// Components
import MapContainer from './components/MapContainer/MapContainer';
import VehiclePanel from './components/VehiclePanel/VehiclePanel';
import RoutePanel from './components/RoutePanel/RoutePanel';
import MobileBottomSheet from './components/MobileSheet/MobileBottomSheet';

// Hooks
import useGpsData from './hooks/useGpsData';
import useRouteData from './hooks/useRouteData';
import useMobileResponsive from './hooks/useMobileResponsive';

// Styles
import './GpsHome.css';

const GpsHome = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const agencyId = user?.agencyId;

    // Responsive hook
    const { isMobile, isTablet } = useMobileResponsive();

    // GPS data hook
    const {
        vehicles,
        selectedVehicle,
        setSelectedVehicle,
        isLoading: isLoadingVehicles,
        error: vehiclesError,
        refreshVehicles
    } = useGpsData(agencyId);

    // Route data hook
    const {
        routeData,
        routeStats,
        dateRange,
        setDateRange,
        isLoadingRoute,
        error: routeError,
        fetchRouteData
    } = useRouteData();

    // UI State
    const [filters, setFilters] = useState({
        status: 'all', // all, online, offline, moving, parked
        search: '',
        selectedTypes: []
    });

    const [mapState, setMapState] = useState({
        center: [33.5731, -7.5898], // Casablanca default
        zoom: 6,
        followVehicle: false
    });

    const [panelState, setPanelState] = useState({
        vehiclePanelVisible: !isMobile,
        routePanelVisible: false,
        mobileSheetOpen: isMobile, // Auto-open on mobile
        mobileSheetState: 'peek' // Start in peek state
    });

    // Effects
    useEffect(() => {
        if (selectedVehicle && dateRange.start && dateRange.end) {
            fetchRouteData(selectedVehicle.id, dateRange.start, dateRange.end);
        }
    }, [selectedVehicle, dateRange, fetchRouteData]);

    // Handle vehicle selection
    const handleVehicleSelect = (vehicle) => {
        console.log('Vehicle selected:', vehicle);
        setSelectedVehicle(vehicle);

        // Center map on vehicle's last known location
        if (vehicle.lastLocation) {
            setMapState(prev => ({
                ...prev,
                center: [vehicle.lastLocation.latitude, vehicle.lastLocation.longitude],
                zoom: 15,
                followVehicle: true // Auto-follow selected vehicle
            }));
        }

        // Enhanced mobile behavior
        if (isMobile) {
            setPanelState(prev => ({
                ...prev,
                mobileSheetOpen: true,
                mobileSheetState: 'expanded' // Expand to show route details
            }));
        } else {
            // Desktop behavior
            setPanelState(prev => ({
                ...prev,
                routePanelVisible: true
            }));
        }
    };

    const handleMobileSheetClose = useCallback(() => {
        setPanelState(prev => ({
            ...prev,
            mobileSheetOpen: false,
            mobileSheetState: 'peek'
        }));

        // Optional: Clear selected vehicle when closing
        // setSelectedVehicle(null);
    }, []);

    useEffect(() => {
        if (!isMobile) return;

        const handleBackButton = (e) => {
            if (panelState.mobileSheetOpen && panelState.mobileSheetState === 'expanded') {
                e.preventDefault();
                setPanelState(prev => ({
                    ...prev,
                    mobileSheetState: 'partial'
                }));
            } else if (panelState.mobileSheetOpen) {
                e.preventDefault();
                handleMobileSheetClose();
            }
        };

        window.addEventListener('popstate', handleBackButton);
        return () => window.removeEventListener('popstate', handleBackButton);
    }, [isMobile, panelState.mobileSheetOpen, panelState.mobileSheetState, handleMobileSheetClose]);

    const containerClasses = [
        'gps-home-container',
        isDarkMode ? 'dark' : '',
        isMobile ? 'mobile' : '',
        isTablet ? 'tablet' : '',
        panelState.mobileSheetOpen && panelState.mobileSheetState === 'expanded' ? 'sheet-expanded' : ''
    ].filter(Boolean).join(' ');


    // Handle route date range change
    const handleDateRangeChange = (newDateRange) => {
        setDateRange(newDateRange);
    };

    // Filter vehicles based on current filters
    const filteredVehicles = vehicles.filter(vehicle => {
        // Search filter
        if (filters.search && !vehicle.model.toLowerCase().includes(filters.search.toLowerCase()) &&
            !vehicle.licensePlate.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }

        // Status filter
        if (filters.status !== 'all') {
            switch (filters.status) {
                case 'online':
                    return vehicle.isOnline;
                case 'offline':
                    return !vehicle.isOnline;
                case 'moving':
                    return vehicle.isOnline && vehicle.isMoving;
                case 'parked':
                    return vehicle.isOnline && !vehicle.isMoving;
                default:
                    return true;
            }
        }

        return true;
    });

    // Loading and error states
    if (isLoadingVehicles) {
        return (
            <div className={`gps-home-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('gps.loading', 'Loading vehicles...')}</p>
                </div>
            </div>
        );
    }

    if (vehiclesError) {
        return (
            <div className={`gps-home-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p>{vehiclesError}</p>
                    <button className="btn btn-primary" onClick={refreshVehicles}>
                        {t('common.retry', 'Try Again')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>

            {/* Header */}
            <div className="gps-header">
                <div className="header-title">
                    <h1>{t('gps.title', 'GPS Tracking')}</h1>
                    <div className="vehicle-count">
                        {filteredVehicles.length} {t('gps.vehicles', 'vehicles')}
                    </div>
                </div>

                {!isMobile && (
                    <div className="header-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setPanelState(prev => ({
                                ...prev,
                                vehiclePanelVisible: !prev.vehiclePanelVisible
                            }))}
                        >
                            {panelState.vehiclePanelVisible ? t('common.hide', 'Hide') : t('common.show', 'Show')} {t('gps.vehicles', 'Vehicles')}
                        </button>

                        <button className="btn btn-primary" onClick={refreshVehicles}>
                            {t('common.refresh', 'Refresh')}
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="gps-main-content">

                {/* Desktop: Left Panel - Vehicles */}
                {!isMobile && panelState.vehiclePanelVisible && (
                    <VehiclePanel
                        vehicles={filteredVehicles}
                        selectedVehicle={selectedVehicle}
                        onVehicleSelect={handleVehicleSelect}
                        filters={filters}
                        onFiltersChange={setFilters}
                        isLoading={isLoadingVehicles}
                        isMobile = {isMobile}
                    />
                )}

                {/* Map Container - Center */}
                <div className="map-section">
                    <MapContainer
                        vehicles={filteredVehicles}
                        selectedVehicle={selectedVehicle}
                        routeData={routeData}
                        mapState={mapState}
                        onMapStateChange={setMapState}
                        onVehicleSelect={handleVehicleSelect}
                        isMobile={isMobile}
                    />
                </div>

                {/* Desktop: Right Panel - Route Timeline */}
                {!isMobile && selectedVehicle && panelState.routePanelVisible && (
                    <RoutePanel
                        selectedVehicle={selectedVehicle}
                        routeData={routeData}
                        routeStats={routeStats}
                        dateRange={dateRange}
                        onDateRangeChange={handleDateRangeChange}
                        isLoading={isLoadingRoute}
                        error={routeError}
                        onClose={() => setPanelState(prev => ({ ...prev, routePanelVisible: false }))}
                    />
                )}
            </div>

            {/* Mobile: Bottom Sheet */}
            {isMobile && (
                <MobileBottomSheet
                    isOpen={panelState.mobileSheetOpen}
                    onToggle={(open) => setPanelState(prev => ({ ...prev, mobileSheetOpen: open }))}
                    vehicles={filteredVehicles}
                    selectedVehicle={selectedVehicle}
                    onVehicleSelect={handleVehicleSelect}
                    routeData={routeData}
                    routeStats={routeStats}
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    filters={filters}
                    onFiltersChange={setFilters}
                    isLoadingRoute={isLoadingRoute}
                />
            )}

            {/* Mobile: Floating Action Button */}
            {isMobile && !panelState.mobileSheetOpen && (
                <button
                    className="mobile-fab"
                    onClick={() => setPanelState(prev => ({ ...prev, mobileSheetOpen: true }))}
                >
                    <span className="fab-icon">🚗</span>
                    <span className="fab-count">{filteredVehicles.length}</span>
                </button>
            )}
        </div>
    );
};

export default GpsHome;