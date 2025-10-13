// src/pages/Gps/Home/components/MobileSheet/MobileBottomSheet.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    const contentRef = useRef(null);
    const [activeTab, setActiveTab] = useState('vehicles');
    const [sheetState, setSheetState] = useState('peek'); // peek, partial, expanded
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [velocity, setVelocity] = useState(0);
    const [lastMoveTime, setLastMoveTime] = useState(0);

    // Enhanced snap points with better mobile UX
    const snapPoints = {
        peek: 84, // Just showing handle and tabs
        partial: Math.min(window.innerHeight * 0.4, 400), // 40% of screen or 400px max
        expanded: window.innerHeight * 0.9 - (window.safeAreaInsets?.top || 0)
    };

    // Optimized touch handlers with momentum and velocity tracking
    const handleTouchStart = useCallback((e) => {
        if (!e.target.closest('.sheet-handle, .sheet-header')) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        setIsDragging(true);
        setStartY(touch.clientY);
        setCurrentY(touch.clientY);
        setVelocity(0);
        setLastMoveTime(Date.now());

        // Disable body scroll when dragging
        document.body.style.overflow = 'hidden';
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const now = Date.now();
        const timeDelta = now - lastMoveTime;
        const yDelta = touch.clientY - currentY;
        
        // Calculate velocity for momentum-based snapping
        if (timeDelta > 0) {
            setVelocity(yDelta / timeDelta);
        }
        
        setCurrentY(touch.clientY);
        setLastMoveTime(now);

        // Update sheet position with resistance at boundaries
        const deltaY = touch.clientY - startY;
        const currentHeight = snapPoints[sheetState];
        const newHeight = Math.max(snapPoints.peek, Math.min(snapPoints.expanded, currentHeight - deltaY));
        
        // Apply rubber band effect at boundaries
        let adjustedHeight = newHeight;
        if (newHeight <= snapPoints.peek) {
            const excess = snapPoints.peek - newHeight;
            adjustedHeight = snapPoints.peek - excess * 0.3; // Rubber band resistance
        } else if (newHeight >= snapPoints.expanded) {
            const excess = newHeight - snapPoints.expanded;
            adjustedHeight = snapPoints.expanded + excess * 0.3;
        }

        if (sheetRef.current) {
            sheetRef.current.style.height = `${adjustedHeight}px`;
            sheetRef.current.style.transform = 'translateY(0)';
        }
    }, [isDragging, startY, currentY, lastMoveTime, sheetState, snapPoints]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);
        document.body.style.overflow = '';

        const deltaY = currentY - startY;
        const currentHeight = sheetRef.current?.offsetHeight || snapPoints[sheetState];
        
        // Determine next state based on gesture direction, velocity, and current position
        let nextState = sheetState;
        
        // Strong velocity-based decisions
        if (Math.abs(velocity) > 0.5) {
            if (velocity > 0) { // Swiping down
                if (sheetState === 'expanded') nextState = 'partial';
                else if (sheetState === 'partial') nextState = 'peek';
                else if (velocity > 1.5) onClose(); // Fast swipe down closes
            } else { // Swiping up
                if (sheetState === 'peek') nextState = 'partial';
                else if (sheetState === 'partial') nextState = 'expanded';
            }
        } else {
            // Position-based decisions for slow drags
            if (deltaY > 100) { // Dragged down significantly
                if (sheetState === 'expanded') nextState = 'partial';
                else if (sheetState === 'partial') nextState = 'peek';
                else onClose();
            } else if (deltaY < -100) { // Dragged up significantly
                if (sheetState === 'peek') nextState = 'partial';
                else if (sheetState === 'partial') nextState = 'expanded';
            }
        }

        // Smooth transition to next state
        setSheetState(nextState);
        
        // Reset any transform applied during drag
        if (sheetRef.current) {
            sheetRef.current.style.height = '';
            sheetRef.current.style.transform = '';
        }
    }, [isDragging, currentY, startY, velocity, sheetState, onClose, snapPoints]);

    // Enhanced tab handling with smart state management
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        
        // Auto-expand for content-heavy tabs
        if (tab === 'route' && selectedVehicle) {
            setSheetState('expanded');
        } else if (sheetState === 'peek') {
            setSheetState('partial');
        }

        // Smooth scroll to top when switching tabs
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [selectedVehicle, sheetState]);

    // Auto-expand when vehicle is selected
    useEffect(() => {
        if (selectedVehicle && activeTab === 'vehicles') {
            setActiveTab('route');
            setSheetState('expanded');
        }
    }, [selectedVehicle, activeTab]);

    // Prevent background scroll when sheet is expanded
    useEffect(() => {
        if (sheetState === 'expanded') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [sheetState]);

    // Handle keyboard events for accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Enhanced backdrop with blur */}
            {sheetState === 'expanded' && (
                <div 
                    className="sheet-backdrop enhanced-backdrop"
                    onClick={onClose}
                    style={{ opacity: sheetState === 'expanded' ? 1 : 0 }}
                />
            )}

            <div
                className={`mobile-bottom-sheet modern ${sheetState} ${isDragging ? 'dragging' : ''}`}
                ref={sheetRef}
                style={{ 
                    height: snapPoints[sheetState],
                    touchAction: 'none' // Prevent default touch behaviors
                }}
            >
                {/* Enhanced drag handle */}
                <div
                    className="sheet-handle enhanced-handle"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="handle-bar" />
                    <div className="handle-indicator">
                        {sheetState === 'peek' && (
                            <span className="handle-hint">
                                {t('gps.mobile.swipeUp', 'Swipe up for more')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Enhanced header with better touch targets */}
                <div className="sheet-header modern-header">
                    <div className="sheet-tabs enhanced-tabs">
                        <button
                            className={`sheet-tab modern-tab ${activeTab === 'vehicles' ? 'active' : ''}`}
                            onClick={() => handleTabChange('vehicles')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0v-6h-8m0 -5h3l3 3" />
                            </svg>
                            <span>{t('gps.vehicles', 'Vehicles')}</span>
                            <div className="tab-badge modern-badge">{vehicles.length}</div>
                        </button>

                        <button
                            className={`sheet-tab modern-tab ${activeTab === 'route' ? 'active' : ''}`}
                            onClick={() => handleTabChange('route')}
                            disabled={!selectedVehicle}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                            <span>{t('gps.route.title', 'Route')}</span>
                            {routeData?.records?.length && (
                                <div className="tab-badge modern-badge">{routeData.records.length}</div>
                            )}
                        </button>
                    </div>

                    {/* Enhanced sheet actions */}
                    <div className="sheet-actions modern-actions">
                        {sheetState !== 'expanded' && (
                            <button
                                className="expand-btn modern-btn"
                                onClick={() => setSheetState('expanded')}
                                aria-label={t('gps.mobile.expand', 'Expand')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="17,11 12,6 7,11" />
                                    <polyline points="17,18 12,13 7,18" />
                                </svg>
                            </button>
                        )}

                        <button 
                            className="close-btn modern-btn" 
                            onClick={onClose}
                            aria-label={t('gps.mobile.close', 'Close')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Enhanced scrollable content */}
                <div 
                    className="sheet-content enhanced-content"
                    ref={contentRef}
                    style={{ 
                        maxHeight: snapPoints[sheetState] - 140, // Account for header
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch' // iOS momentum scrolling
                    }}
                >
                    {/* Quick stats for peek state */}
                    {vehicles.length > 0 && (
                        <div className="quick-stats-bar enhanced-stats">
                            <div className="quick-stat online">
                                <div className="quick-stat-value">
                                    {vehicles.filter(v => v.status === 'online').length}
                                </div>
                                <div className="quick-stat-label">{t('gps.online', 'Online')}</div>
                            </div>
                            <div className="quick-stat moving">
                                <div className="quick-stat-value">
                                    {vehicles.filter(v => v.status === 'moving').length}
                                </div>
                                <div className="quick-stat-label">{t('gps.moving', 'Moving')}</div>
                            </div>
                            <div className="quick-stat offline">
                                <div className="quick-stat-value">
                                    {vehicles.filter(v => v.status === 'offline').length}
                                </div>
                                <div className="quick-stat-label">{t('gps.offline', 'Offline')}</div>
                            </div>
                        </div>
                    )}

                    {/* Tab content */}
                    {activeTab === 'vehicles' && (
                        <div className="tab-content vehicles-content">
                            <VehiclePanel
                                vehicles={vehicles}
                                selectedVehicle={selectedVehicle}
                                onVehicleSelect={onVehicleSelect}
                                filters={filters}
                                onFiltersChange={onFiltersChange}
                                isLoading={isLoadingVehicles}
                                isMobile={true}
                            />
                        </div>
                    )}

                    {activeTab === 'route' && (
                        <div className="tab-content route-content">
                            <RoutePanel
                                selectedVehicle={selectedVehicle}
                                routeData={routeData}
                                routeStats={routeStats}
                                dateRange={dateRange}
                                onDateRangeChange={onDateRangeChange}
                                isLoading={isLoadingRoute}
                                error={routeError}
                                isMobile={true}
                            />
                        </div>
                    )}

                    {/* Selected vehicle indicator for peek state */}
                    {selectedVehicle && sheetState === 'peek' && (
                        <div className="selected-vehicle-indicator modern-indicator">
                            <div className="vehicle-icon">
                                {selectedVehicle.status === 'moving' ? '🚗' : 
                                 selectedVehicle.status === 'online' ? '🟢' : '⭕'}
                            </div>
                            <div className="vehicle-info">
                                <div className="vehicle-plate">{selectedVehicle.licensePlate}</div>
                                <div className="vehicle-status">
                                    {selectedVehicle.status === 'moving' ? 
                                        `${Math.round(selectedVehicle.lastSpeed || 0)} km/h` :
                                        t('gps.parked', 'Parked')
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MobileBottomSheet;