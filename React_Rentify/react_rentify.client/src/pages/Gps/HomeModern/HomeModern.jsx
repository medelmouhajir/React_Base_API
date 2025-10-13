import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

import { useGpsData, useRouteData, useMobileResponsive } from '../Home/hooks';

import MapContainer from '../Home/components/MapContainer/MapContainer';
import VehiclePanel from '../Home/components/VehiclePanel/VehiclePanel';
import RoutePanel from '../Home/components/RoutePanel/RoutePanel';

import SummaryBar from './components/SummaryBar';
import VehicleCarousel from './components/VehicleCarousel';
import AlertDrawer from './components/AlertDrawer';

import ModernLayout from './layout/ModernLayout';
import useModernLayout from './hooks/useModernLayout';
import useSpeedingAlerts from './hooks/useSpeedingAlerts';

import './HomeModern.css';

const DEFAULT_FILTERS = {
    status: 'all',
    search: '',
    selectedTypes: []
};

const HomeModern = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const agencyId = user?.agencyId;

    const { isMobile, isTablet } = useMobileResponsive();

    const {
        vehicles,
        selectedVehicle,
        setSelectedVehicle,
        isLoading: isLoadingVehicles,
        error: vehiclesError,
        lastUpdateTime,
        refreshVehicles,
        stats: vehicleStats
    } = useGpsData(agencyId);

    const {
        routeData,
        routeStats,
        dateRange,
        setDateRange,
        isLoadingRoute,
        error: routeError,
        fetchRouteData
    } = useRouteData();

    const {
        isDrawerOpen,
        toggleDrawer,
        closeDrawerForMobile,
        mapState,
        setMapState,
        focusVehicleOnMap
    } = useModernLayout({ isMobile });

    const {
        alerts,
        stats: alertStats,
        acknowledgeAlert,
        refresh: refreshAlerts,
        isLoading: isLoadingAlerts,
        error: alertsError
    } = useSpeedingAlerts();

    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [isAlertDrawerOpen, setAlertDrawerOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('gps:view', 'modern');
    }, []);

    useEffect(() => {
        if (!selectedVehicle || !dateRange.start || !dateRange.end) return;
        fetchRouteData(selectedVehicle.id, dateRange.start, dateRange.end);
    }, [selectedVehicle, dateRange, fetchRouteData]);

    const filteredVehicles = useMemo(() => {
        if (!vehicles?.length) return [];

        return vehicles.filter(vehicle => {
            if (
                filters.search &&
                !vehicle.model.toLowerCase().includes(filters.search.toLowerCase()) &&
                !vehicle.licensePlate.toLowerCase().includes(filters.search.toLowerCase())
            ) {
                return false;
            }

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
    }, [vehicles, filters]);

    const handleVehicleSelect = useCallback((vehicle) => {
        setSelectedVehicle(vehicle);
        focusVehicleOnMap(vehicle);
        if (isMobile) {
            closeDrawerForMobile();
        }
    }, [setSelectedVehicle, focusVehicleOnMap, closeDrawerForMobile, isMobile]);

    const handleMapStateChange = useCallback((nextState) => {
        setMapState(prev => {
            if (typeof nextState === 'function') {
                return nextState(prev);
            }

            return {
                ...prev,
                ...nextState
            };
        });
    }, [setMapState]);

    const handleFiltersChange = useCallback((nextFilters) => {
        setFilters(prev => ({ ...prev, ...nextFilters }));
    }, []);

    const handleToggleLegacy = useCallback(() => {
        localStorage.setItem('gps:view', 'legacy');
        navigate('/gps');
    }, [navigate]);

    const summaryStats = useMemo(() => ({
        vehicles: vehicleStats,
        route: routeStats,
        alerts: {
            count: alerts?.length || 0,
            unacknowledged: alerts?.filter(alert => !alert.isAcknowledged).length || 0
        }
    }), [vehicleStats, routeStats, alerts]);

    if (isLoadingVehicles) {
        return (
            <div className={`home-modern-shell ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="legacy-modern-toggle">
                    <button type="button" className="btn btn-outline" onClick={handleToggleLegacy}>
                        {t('gps.switchLegacy', 'Switch to legacy dashboard')}
                    </button>
                </div>
                <div className="home-modern-loading">
                    <div className="loading-spinner" />
                    <p>{t('gps.loading', 'Loading vehicles...')}</p>
                </div>
            </div>
        );
    }

    if (vehiclesError) {
        return (
            <div className={`home-modern-shell ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="legacy-modern-toggle">
                    <button type="button" className="btn btn-outline" onClick={handleToggleLegacy}>
                        {t('gps.switchLegacy', 'Switch to legacy dashboard')}
                    </button>
                </div>
                <div className="home-modern-error">
                    <p>{vehiclesError}</p>
                    <button type="button" className="btn btn-primary" onClick={refreshVehicles}>
                        {t('common.retry', 'Try Again')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ModernLayout
            isDarkMode={isDarkMode}
            isMobile={isMobile}
            isTablet={isTablet}
            isDrawerOpen={isDrawerOpen}
            onToggleDrawer={toggleDrawer}
            summarySlot={(
                <SummaryBar
                    stats={summaryStats}
                    lastUpdate={lastUpdateTime}
                    isMobile={isMobile}
                    onRefresh={refreshVehicles}
                    onToggleDrawer={toggleDrawer}
                    isDrawerOpen={isDrawerOpen}
                    onOpenAlerts={() => setAlertDrawerOpen(true)}
                    onSwitchLegacy={handleToggleLegacy}
                />
            )}
            mapSlot={(
                <MapContainer
                    vehicles={filteredVehicles}
                    selectedVehicle={selectedVehicle}
                    routeData={routeData}
                    mapState={mapState}
                    onMapStateChange={handleMapStateChange}
                    onVehicleSelect={handleVehicleSelect}
                    isMobile={isMobile}
                />
            )}
            drawerSlot={(
                <div className="home-modern-drawer-panels">
                    <VehiclePanel
                        vehicles={filteredVehicles}
                        selectedVehicle={selectedVehicle}
                        onVehicleSelect={handleVehicleSelect}
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        isLoading={isLoadingVehicles}
                        isMobile={isMobile}
                    />
                    <RoutePanel
                        selectedVehicle={selectedVehicle}
                        routeData={routeData}
                        routeStats={routeStats}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        isLoading={isLoadingRoute}
                        error={routeError}
                        onClose={() => {
                            if (isMobile) {
                                closeDrawerForMobile();
                            } else {
                                toggleDrawer();
                            }
                        }}
                        isMobile={isMobile}
                    />
                </div>
            )}
            mobileCarouselSlot={isMobile ? (
                <VehicleCarousel
                    vehicles={filteredVehicles}
                    selectedVehicle={selectedVehicle}
                    onVehicleSelect={handleVehicleSelect}
                    onRefresh={refreshVehicles}
                />
            ) : null}
            alertDrawerSlot={(
                <AlertDrawer
                    isOpen={isAlertDrawerOpen}
                    onClose={() => setAlertDrawerOpen(false)}
                    alerts={alerts}
                    stats={alertStats}
                    isLoading={isLoadingAlerts}
                    error={alertsError}
                    onRefresh={refreshAlerts}
                    onAcknowledge={acknowledgeAlert}
                />
            )}
        />
    );
};

export default HomeModern;