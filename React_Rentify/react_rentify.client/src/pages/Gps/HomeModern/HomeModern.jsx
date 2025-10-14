import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useGpsData, useRouteData, useMobileResponsive } from '../Home/hooks';

// Components
import ModernMapContainer from './MapContainer/ModernMapContainer';
import ModernVehiclePanel from './components/ModernVehiclePanel/ModernVehiclePanel';
import ModernRoutePanel from './components/ModernRoutePanel/ModernRoutePanel';

// Modern Components
import EnhancedSummaryBar from './components/EnhancedSummaryBar/EnhancedSummaryBar';
import MobileBottomNav from './components/MobileBottomNav/MobileBottomNav';
import VehicleCarousel from './components/VehicleCarousel/VehicleCarousel';
import AlertDrawer from './components/AlertDrawer/AlertDrawer';
import FloatingActionButton from './components/FloatingActionButton/FloatingActionButton';
import QuickActionsPanel from './components/QuickActionsPanel/QuickActionsPanel';

// Layout
import ModernLayout from './layout/ModernLayout';

// Hooks
import {useModernLayout} from './hooks/useModernLayout';
import useSpeedingAlerts from './hooks/useSpeedingAlerts';
import useSwipeGestures from './hooks/useSwipeGestures';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useScrollLock from './hooks/useScrollLock';

// Styles
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

    // Container ref for swipe gestures
    const containerRef = useRef(null);

    const agencyId = user?.agencyId;
    const { isMobile, isTablet, screenSize } = useMobileResponsive();

    // GPS Data Hook
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

    // Date Range State (initialize before useRouteData)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date()
    });

    // Route Data Hook
    const {
        routeData,
        routeStats,
        isLoading: isLoadingRoute,
        error: routeError
    } = useRouteData(selectedVehicle?.id, dateRange, {
        enabled: !!selectedVehicle?.id  // Fixed: Enable only when a vehicle is selected
    });

    // Alerts Hook
    const {
        alerts,
        stats: alertStats,
        isLoading: isLoadingAlerts,
        error: alertsError,
        refreshAlerts,
        acknowledgeAlert
    } = useSpeedingAlerts(agencyId);

    // Layout State
    const {
        isDrawerOpen,
        toggleDrawer,
        closeDrawerForMobile,
        drawerMode,
        setDrawerMode
    } = useModernLayout({ isMobile, isTablet });

    // UI State
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [mapState, setMapState] = useState({ center: null, zoom: 12 });
    const [isAlertDrawerOpen, setAlertDrawerOpen] = useState(false);
    const [activePanel, setActivePanel] = useState('vehicles'); // vehicles, routes, alerts
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);

    // Enhanced Mobile Features
    const [isFullScreenMap, setIsFullScreenMap] = useState(false);
    const [bottomNavHeight, setBottomNavHeight] = useState(80);

    // Swipe Gestures for Mobile
    useSwipeGestures(containerRef, {
        onSwipeLeft: () => {
            if (isMobile && !isDrawerOpen) {
                toggleDrawer();
            }
        },
        onSwipeRight: () => {
            if (isMobile && isDrawerOpen) {
                closeDrawerForMobile();
            }
        },
        onSwipeUp: () => {
            if (isMobile && activePanel === 'vehicles' && vehicles.length > 0) {
                setActivePanel('routes');
            }
        },
        onSwipeDown: () => {
            if (isMobile && isFullScreenMap) {
                setIsFullScreenMap(false);
            }
        },
        ignoreSelectors: [
            '.leaflet-container',
            '.leaflet-pane',
            '.leaflet-control',
            '.leaflet-top',
            '.leaflet-bottom',
            '.leaflet-interactive',
            '.modern-map-container'
        ]
    });

    // Keyboard Shortcuts
    useKeyboardShortcuts({
        'Escape': () => {
            if (isAlertDrawerOpen) setAlertDrawerOpen(false);
            else if (isDrawerOpen) toggleDrawer();
            else if (quickActionsOpen) setQuickActionsOpen(false);
        },
        'f': () => setIsFullScreenMap(!isFullScreenMap),
        'r': () => refreshVehicles(),
        'a': () => setAlertDrawerOpen(true),
        '1': () => setActivePanel('vehicles'),
        '2': () => setActivePanel('routes'),
        '3': () => setActivePanel('alerts')
    });

    useScrollLock(isMobile && isDrawerOpen);

    // Computed Values
    const filteredVehicles = useMemo(() => {
        if (!vehicles?.length) return [];

        let filtered = vehicles;

        if (filters.status !== 'all') {
            filtered = filtered.filter(v => {
                if (filters.status === 'online') return v.isOnline;
                if (filters.status === 'moving') return v.isMoving;
                if (filters.status === 'idle') return v.isOnline && !v.isMoving;
                if (filters.status === 'offline') return !v.isOnline;
                return true;
            });
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(v =>
                v.plateNumber?.toLowerCase().includes(searchTerm) ||
                v.deviceSerialNumber?.toLowerCase().includes(searchTerm) ||
                v.driverName?.toLowerCase().includes(searchTerm)
            );
        }

        return filtered;
    }, [vehicles, filters]);

    const summaryStats = useMemo(() => ({
        totalVehicles: vehicles?.length || 0,
        onlineVehicles: vehicles?.filter(v => v.isOnline).length || 0,
        movingVehicles: vehicles?.filter(v => v.isMoving).length || 0,
        activeAlerts: alertStats?.unacknowledgedAlerts || 0,
        totalDistance: routeStats?.totalDistance || 0
    }), [vehicles, alertStats, routeStats]);

    // Event Handlers
    const handleVehicleSelect = useCallback((vehicle) => {
        setSelectedVehicle(vehicle);
        if (isMobile) {
            setActivePanel('routes');
        }
    }, [setSelectedVehicle, isMobile]);

    const handleMapStateChange = useCallback((newMapState) => {
        setMapState(newMapState);
    }, []);

    const handleFiltersChange = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const handleToggleLegacy = useCallback(() => {
        localStorage.setItem('gps-view-preference', 'legacy');
        navigate('/gps');
    }, [navigate]);

    const handlePanelSwitch = useCallback((panel) => {
        setActivePanel(panel);
        if (isMobile && !isDrawerOpen) {
            toggleDrawer();
        }
    }, [isMobile, isDrawerOpen, toggleDrawer]);

    // Effects
    useEffect(() => {
        if (selectedVehicle && isMobile) {
            setActivePanel('routes');
        }
    }, [selectedVehicle, isMobile]);

    useEffect(() => {
        // Manage body scroll lock when drawer is open in mobile
        if (isMobile) {
            if (isDrawerOpen) {
                // Lock body scroll
                document.body.classList.add('drawer-open');
                document.documentElement.classList.add('drawer-open');
            } else {
                // Restore body scroll
                document.body.classList.remove('drawer-open');
                document.documentElement.classList.remove('drawer-open');
            }
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('drawer-open');
            document.documentElement.classList.remove('drawer-open');
        };
    }, [isDrawerOpen, isMobile]);

    // Loading State
    if (isLoadingVehicles) {
        return (
            <div className={`home-modern-container loading ${isDarkMode ? 'dark' : 'light'} ${isDrawerOpen && isMobile ? 'drawer-open' : ''}`}>
                <div className="home-modern-loading">
                    <div className="loading-spinner large" />
                    <h2>{t('gps.modern.loadingTitle', 'Loading GPS Dashboard')}</h2>
                    <p>{t('gps.modern.loadingSubtitle', 'Please wait while we fetch your vehicle data...')}</p>
                </div>
            </div>
        );
    }

    // Error State
    if (vehiclesError) {
        return (
            <div className={`home-modern-container error ${isDarkMode ? 'dark' : 'light'} ${isDrawerOpen && isMobile ? 'drawer-open' : ''}`}>
                <div className="legacy-modern-toggle">
                    <button type="button" className="btn btn-outline" onClick={handleToggleLegacy}>
                        {t('gps.switchLegacy', 'Switch to legacy dashboard')}
                    </button>
                </div>
                <div className="home-modern-error">
                    <h2>{t('common.error', 'Error')}</h2>
                    <p>{vehiclesError}</p>
                    <button type="button" className="btn btn-primary" onClick={refreshVehicles}>
                        {t('common.retry', 'Try Again')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`home-modern-container ${isDarkMode ? 'dark' : 'light'} ${screenSize} ${isDrawerOpen && isMobile ? 'drawer-open' : ''}`}
        >
            <ModernLayout
                isDarkMode={isDarkMode}
                isMobile={isMobile}
                isTablet={isTablet}
                screenSize={screenSize}
                isDrawerOpen={isDrawerOpen}
                isFullScreenMap={isFullScreenMap}
                activePanel={activePanel}
                onToggleDrawer={toggleDrawer}
                bottomNavHeight={bottomNavHeight}
                selectedVehicle={selectedVehicle}
                onPanelChange={handlePanelSwitch}

                // Summary Bar
                summarySlot={!isFullScreenMap && (
                    <EnhancedSummaryBar
                        stats={summaryStats}
                        lastUpdate={lastUpdateTime}
                        isMobile={isMobile}
                        onRefresh={refreshVehicles}
                        onToggleDrawer={toggleDrawer}
                        isDrawerOpen={isDrawerOpen}
                        onOpenAlerts={() => setAlertDrawerOpen(true)}
                        onSwitchLegacy={handleToggleLegacy}
                        onToggleFullScreen={() => setIsFullScreenMap(!isFullScreenMap)}
                        isFullScreen={isFullScreenMap}
                    />
                )}

                // Map Container
                mapSlot={(
                    <ModernMapContainer
                        vehicles={filteredVehicles}
                        selectedVehicle={selectedVehicle}
                        routeData={routeData}
                        mapState={mapState}
                        onMapStateChange={handleMapStateChange}
                        onVehicleSelect={handleVehicleSelect}
                        isMobile={isMobile}
                        isFullScreen={isFullScreenMap}
                        className={isFullScreenMap ? 'fullscreen' : ''}
                    />
                )}

                // Side Drawer Content
                drawerSlot={(
                    <div className="modern-drawer-panels">
                        {activePanel === 'vehicles' && (
                            <ModernVehiclePanel
                                vehicles={filteredVehicles}
                                selectedVehicle={selectedVehicle}
                                onVehicleSelect={handleVehicleSelect}
                                filters={filters}
                                onFiltersChange={handleFiltersChange}
                                isLoading={isLoadingVehicles}
                                isMobile={isMobile}
                            />
                        )}
                        {activePanel === 'routes' && selectedVehicle && (
                            <ModernRoutePanel
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
                                        setActivePanel('vehicles');
                                    }
                                }}
                                isMobile={isMobile}
                            />
                        )}
                    </div>
                )}

                // Mobile Bottom Navigation
                mobileNavigationSlot={isMobile && !isFullScreenMap && (
                    <MobileBottomNav
                        activePanel={activePanel}
                        onPanelChange={handlePanelSwitch}
                        alertsCount={summaryStats.activeAlerts}
                        vehiclesCount={summaryStats.totalVehicles}
                        selectedVehicle={selectedVehicle}
                        onToggleFullScreen={() => setIsFullScreenMap(true)}
                        height={bottomNavHeight}
                        onHeightChange={setBottomNavHeight}
                    />
                )}

                // Vehicle Carousel (Mobile)
                mobileCarouselSlot={isMobile && vehicles.length > 0 && !isFullScreenMap && (
                    <VehicleCarousel
                        vehicles={filteredVehicles}
                        selectedVehicle={selectedVehicle}
                        onVehicleSelect={handleVehicleSelect}
                        onRefresh={refreshVehicles}
                        isVisible={activePanel === 'vehicles' || !isDrawerOpen}
                    />
                )}

                // Floating Action Button (Mobile)
                floatingActionSlot={isMobile && (
                    <FloatingActionButton
                        isVisible={!isDrawerOpen && !isFullScreenMap}
                        onToggleQuickActions={() => setQuickActionsOpen(!quickActionsOpen)}
                        hasAlerts={summaryStats.activeAlerts > 0}
                    />
                )}

                // Quick Actions Panel
                quickActionsSlot={(
                    <QuickActionsPanel
                        isOpen={quickActionsOpen}
                        onClose={() => setQuickActionsOpen(false)}
                        onRefresh={refreshVehicles}
                        onOpenAlerts={() => {
                            setAlertDrawerOpen(true);
                            setQuickActionsOpen(false);
                        }}
                        onSwitchLegacy={handleToggleLegacy}
                        onToggleFullScreen={() => {
                            setIsFullScreenMap(!isFullScreenMap);
                            setQuickActionsOpen(false);
                        }}
                        isMobile={isMobile}
                    />
                )}

                // Alert Drawer
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
                        isMobile={isMobile}
                    />
                )}
            />
        </div>
    );
};

export default HomeModern;