// src/pages/Gps/Home/components/MobileSheet/MobileBottomSheet.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Components
import VehiclePanel from '../VehiclePanel/VehiclePanel';
import RoutePanel from '../RoutePanel/RoutePanel';

// Styles
import './MobileBottomSheet.css';

const MobileBottomSheet = ({
    isOpen,
    onClose,
    vehicles,
    selectedVehicle,
    onVehicleSelect,
    filters,
    onFiltersChange,
    routeData,
    routeStats,
    dateRange,
    onDateRangeChange,
    isLoadingVehicles,
    isLoadingRoute,
    routeError
}) => {
    const { t } = useTranslation();
    const sheetRef = useRef(null);
    const [activeTab, setActiveTab] = useState('vehicles');
    const [sheetHeight, setSheetHeight] = useState('partial'); // partial, expanded, collapsed
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startHeight, setStartHeight] = useState(0);

    // Sheet height configurations
    const heightConfig = {
        collapsed: '60px',
        partial: '40vh',
        expanded: '85vh'
    };

    // Handle touch start
    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setStartY(touch.clientY);
        setStartHeight(sheetRef.current?.offsetHeight || 0);
    };

    // Handle touch move
    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const touch = e.touches[0];
        const deltaY = startY - touch.clientY;
        const newHeight = startHeight + deltaY;
        const viewportHeight = window.innerHeight;

        // Calculate percentage
        const heightPercent = (newHeight / viewportHeight) * 100;

        if (heightPercent > 85) {
            setSheetHeight('expanded');
        } else if (heightPercent > 25) {
            setSheetHeight('partial');
        } else {
            setSheetHeight('collapsed');
        }
    };

    // Handle touch end
    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (sheetHeight === 'collapsed') {
            setSheetHeight('partial');
        }
    };

    // Handle sheet toggle
    const toggleSheet = () => {
        if (sheetHeight === 'collapsed') {
            setSheetHeight('partial');
        } else {
            setSheetHeight('collapsed');
        }
    };

    // Auto-expand when vehicle is selected
    useEffect(() => {
        if (selectedVehicle && activeTab === 'vehicles') {
            setActiveTab('route');
            setSheetHeight('expanded');
        }
    }, [selectedVehicle]);

    if (!isOpen) return null;

    return (
        <div
            className={`mobile-bottom-sheet ${sheetHeight} ${isDragging ? 'dragging' : ''}`}
            ref={sheetRef}
            style={{ height: heightConfig[sheetHeight] }}
        >
            {/* Drag Handle */}
            <div
                className="sheet-handle"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={toggleSheet}
            >
                <div className="handle-bar" />
            </div>

            {/* Sheet Header */}
            <div className="sheet-header">
                <div className="sheet-tabs">
                    <button
                        className={`sheet-tab ${activeTab === 'vehicles' ? 'active' : ''}`}
                        onClick={() => handleTabChange('vehicles')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0v-6h-8m0 -5h3l3 3" />
                        </svg>
                        <span>{t('gps.vehicles', 'Vehicles')}</span>
                        <div className="tab-badge">{vehicles.length}</div>
                    </button>

                    <button
                        className={`sheet-tab ${activeTab === 'route' ? 'active' : ''}`}
                        onClick={() => handleTabChange('route')}
                        disabled={!selectedVehicle}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        <span>{t('gps.route.title', 'Route')}</span>
                        {routeData?.records?.length && (
                            <div className="tab-badge">{routeData.records.length}</div>
                        )}
                    </button>
                </div>

                {/* Sheet Actions */}
                <div className="sheet-actions">
                    {sheetHeight !== 'expanded' && (
                        <button
                            className="expand-btn"
                            onClick={() => setSheetHeight('expanded')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="17,11 12,6 7,11" />
                                <polyline points="17,18 12,13 7,18" />
                            </svg>
                        </button>
                    )}

                    <button className="close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Sheet Content */}
            <div className="sheet-content">
                {activeTab === 'vehicles' && (
                    <VehiclePanel
                        vehicles={vehicles}
                        selectedVehicle={selectedVehicle}
                        onVehicleSelect={onVehicleSelect}
                        filters={filters}
                        onFiltersChange={onFiltersChange}
                        isLoading={isLoadingVehicles}
                        isMobile={true}
                    />
                )}

                {activeTab === 'route' && (
                    <RoutePanel
                        selectedVehicle={selectedVehicle}
                        routeData={routeData}
                        routeStats={routeStats}
                        dateRange={dateRange}
                        onDateRangeChange={onDateRangeChange}
                        isLoading={isLoadingRoute}
                        error={routeError}
                        onClose={() => setActiveTab('vehicles')}
                        isMobile={true}
                    />
                )}
            </div>

            {/* Quick Stats Bar (only show when collapsed) */}
            {sheetHeight === 'collapsed' && (
                <div className="quick-stats-bar">
                    <div className="quick-stat">
                        <span className="stat-value">{vehicles.length}</span>
                        <span className="stat-label">{t('gps.vehicles', 'Vehicles')}</span>
                    </div>
                    <div className="quick-stat">
                        <span className="stat-value">{vehicles.filter(v => v.isOnline).length}</span>
                        <span className="stat-label">{t('gps.online', 'Online')}</span>
                    </div>
                    <div className="quick-stat">
                        <span className="stat-value">{vehicles.filter(v => v.isMoving).length}</span>
                        <span className="stat-label">{t('gps.moving', 'Moving')}</span>
                    </div>
                    {selectedVehicle && (
                        <div className="selected-vehicle-indicator">
                            <div className="vehicle-icon">🚗</div>
                            <div className="vehicle-info">
                                <div className="vehicle-plate">{selectedVehicle.licensePlate}</div>
                                <div className="vehicle-status">
                                    {selectedVehicle.isMoving ?
                                        `${Math.round(selectedVehicle.lastSpeed || 0)} km/h` :
                                        t('gps.parked', 'Parked')
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileBottomSheet;