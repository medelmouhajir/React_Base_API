import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';

// Modern Components
import VehicleCard from './../VehicleCard/VehicleCard';
import VehicleFilters from './../VehicleFilters/VehicleFilters';
import VehicleSearch from './../VehicleSearch/VehicleSearch';
import EmptyState from './../EmptyState/EmptyState';

import './ModernVehiclePanel.css';

const ModernVehiclePanel = ({
    vehicles = [],
    selectedVehicle,
    onVehicleSelect,
    filters,
    onFiltersChange,
    isLoading = false,
    isMobile = false,
    onRefresh
}) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState('list'); // list, grid, compact
    const [sortBy, setSortBy] = useState('plateNumber'); // plateNumber, status, lastUpdate, distance
    const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');

    const parentRef = useRef();

    // Memoized filtered and sorted vehicles
    const processedVehicles = useMemo(() => {
        let result = [...vehicles];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(vehicle =>
                vehicle.plateNumber?.toLowerCase().includes(query) ||
                vehicle.deviceSerialNumber?.toLowerCase().includes(query) ||
                vehicle.driverName?.toLowerCase().includes(query) ||
                vehicle.lastLocation?.address?.toLowerCase().includes(query)
            );
        }

        // Apply status filters
        if (filters?.status && filters.status !== 'all') {
            result = result.filter(vehicle => {
                switch (filters.status) {
                    case 'online': return vehicle.isOnline;
                    case 'offline': return !vehicle.isOnline;
                    case 'moving': return vehicle.isMoving;
                    case 'idle': return vehicle.isOnline && !vehicle.isMoving;
                    case 'alerts': return vehicle.hasAlerts;
                    default: return true;
                }
            });
        }

        // Apply vehicle type filters
        if (filters?.selectedTypes?.length > 0) {
            result = result.filter(vehicle =>
                filters.selectedTypes.includes(vehicle.vehicleType)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'plateNumber':
                    aValue = a.plateNumber || a.deviceSerialNumber || '';
                    bValue = b.plateNumber || b.deviceSerialNumber || '';
                    break;
                case 'status':
                    aValue = a.isOnline ? (a.isMoving ? 3 : 2) : 1;
                    bValue = b.isOnline ? (b.isMoving ? 3 : 2) : 1;
                    break;
                case 'lastUpdate':
                    aValue = new Date(a.lastUpdate || 0).getTime();
                    bValue = new Date(b.lastUpdate || 0).getTime();
                    break;
                case 'distance':
                    aValue = a.totalDistance || 0;
                    bValue = b.totalDistance || 0;
                    break;
                default:
                    aValue = a.plateNumber || '';
                    bValue = b.plateNumber || '';
            }

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [vehicles, searchQuery, filters, sortBy, sortOrder]);

    // Virtual scrolling for performance
    const rowVirtualizer = useVirtualizer({
        count: processedVehicles.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => (viewMode === 'compact' ? 80 : viewMode === 'grid' ? 200 : 140),
        overscan: 5,
    });

    // Handle vehicle selection
    const handleVehicleSelect = useCallback((vehicle) => {
        onVehicleSelect?.(vehicle);
    }, [onVehicleSelect]);

    // Handle search
    const handleSearchChange = useCallback((query) => {
        setSearchQuery(query);
        onFiltersChange?.({ ...filters, search: query });
    }, [filters, onFiltersChange]);

    // Handle sort change
    const handleSortChange = useCallback((newSortBy) => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    }, [sortBy, sortOrder]);

    // Get vehicle stats
    const vehicleStats = useMemo(() => ({
        total: vehicles.length,
        online: vehicles.filter(v => v.isOnline).length,
        offline: vehicles.filter(v => !v.isOnline).length,
        moving: vehicles.filter(v => v.isMoving).length,
        idle: vehicles.filter(v => v.isOnline && !v.isMoving).length,
        alerts: vehicles.filter(v => v.hasAlerts).length,
        filtered: processedVehicles.length
    }), [vehicles, processedVehicles.length]);

    const panelClasses = [
        'modern-vehicle-panel',
        isMobile ? 'mobile' : 'desktop',
        viewMode,
        showFilters ? 'filters-open' : 'filters-closed'
    ].filter(Boolean).join(' ');

    return (
        <motion.div
            className={panelClasses}
            initial={{ opacity: 0, x: isMobile ? 100 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {/* Panel Header */}
            <div className="panel-header">
                <div className="header-top">
                    <div className="panel-title">
                        <h2>{t('gps.modern.vehicles', 'Vehicles')}</h2>
                        <span className="vehicle-count">
                            {processedVehicles.length} of {vehicles.length}
                        </span>
                    </div>

                    <div className="header-actions">
                        <motion.button
                            className="action-vehicule-panel-btn refresh"
                            onClick={onRefresh}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                        >
                            <motion.svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                animate={isLoading ? { rotate: 360 } : {}}
                                transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                            >
                                <path d="M4 12a8 8 0 018-8V2l3 3-3 3V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 01-16 0z" fill="currentColor" />
                            </motion.svg>
                        </motion.button>

                        <motion.button
                            className="action-vehicule-panel-btn filters"
                            onClick={() => setShowFilters(!showFilters)}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" fill="currentColor" />
                            </svg>
                        </motion.button>

                        <motion.button
                            className="action-vehicule-panel-btn view-mode"
                            onClick={() => {
                                const modes = ['list', 'grid', 'compact'];
                                const currentIndex = modes.indexOf(viewMode);
                                setViewMode(modes[(currentIndex + 1) % modes.length]);
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {viewMode === 'list' && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor" />
                                </svg>
                            )}
                            {viewMode === 'grid' && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" fill="currentColor" />
                                </svg>
                            )}
                            {viewMode === 'compact' && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 4h18v2H3V4zm0 4h18v2H3V8zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" fill="currentColor" />
                                </svg>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Search Bar */}
                <VehicleSearch
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={t('gps.modern.searchVehicles', 'Search vehicles...')}
                    isMobile={isMobile}
                />

                {/* Quick Stats */}
                <div className="quick-stats">
                    <div className="stat online">
                        <span className="value">{vehicleStats.online}</span>
                        <span className="label">Online</span>
                    </div>
                    <div className="stat moving">
                        <span className="value">{vehicleStats.moving}</span>
                        <span className="label">Moving</span>
                    </div>
                    <div className="stat alerts">
                        <span className="value">{vehicleStats.alerts}</span>
                        <span className="label">Alerts</span>
                    </div>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        className="filters-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <VehicleFilters
                            filters={filters}
                            onFiltersChange={onFiltersChange}
                            vehicles={vehicles}
                            stats={vehicleStats}
                            isMobile={isMobile}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sort Controls */}
            <div className="sort-controls">
                <span className="sort-label">{t('common.sortBy', 'Sort by')}:</span>
                <div className="sort-buttons">
                    {[
                        { key: 'plateNumber', label: 'Plate' },
                        { key: 'status', label: 'Status' },
                        { key: 'lastUpdate', label: 'Updated' },
                        { key: 'distance', label: 'Distance' }
                    ].map((option) => (
                        <motion.button
                            key={option.key}
                            className={`sort-btn ${sortBy === option.key ? 'active' : ''}`}
                            onClick={() => handleSortChange(option.key)}
                            whileTap={{ scale: 0.95 }}
                        >
                            {option.label}
                            {sortBy === option.key && (
                                <motion.svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    animate={{ rotate: sortOrder === 'asc' ? 0 : 180 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <path d="M7 14l5-5 5 5z" fill="currentColor" />
                                </motion.svg>
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Vehicle List */}
            <div className="vehicles-container">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <span>{t('gps.modern.loadingVehicles', 'Loading vehicles...')}</span>
                    </div>
                ) : processedVehicles.length === 0 ? (
                    <EmptyState
                        hasSearch={!!searchQuery}
                        hasFilters={filters?.status !== 'all' || filters?.selectedTypes?.length > 0}
                        onClear={() => {
                            setSearchQuery('');
                            onFiltersChange?.({ status: 'all', search: '', selectedTypes: [] });
                        }}
                    />
                ) : (
                    <div
                        ref={parentRef}
                        className={`vehicles-list ${viewMode}`}
                        style={{
                            height: '100%',
                            overflow: 'auto'
                        }}
                    >
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative'
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                const vehicle = processedVehicles[virtualItem.index];
                                return (
                                    <div
                                        key={virtualItem.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualItem.size}px`,
                                            transform: `translateY(${virtualItem.start}px)`
                                        }}
                                    >
                                        <VehicleCard
                                            vehicle={vehicle}
                                            isSelected={selectedVehicle?.id === vehicle.id}
                                            viewMode={viewMode}
                                            onClick={() => handleVehicleSelect(vehicle)}
                                            isMobile={isMobile}
                                            index={virtualItem.index}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Panel Footer */}
            <div className="panel-footer">
                <div className="footer-stats">
                    <span className="stat-text">
                        {processedVehicles.length} {t('gps.modern.vehiclesShown', 'vehicles shown')}
                    </span>
                    {processedVehicles.length !== vehicles.length && (
                        <span className="filter-indicator">
                            ({vehicles.length - processedVehicles.length} {t('gps.modern.filtered', 'filtered')})
                        </span>
                    )}
                </div>

                {selectedVehicle && (
                    <motion.div
                        className="selected-vehicle-indicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                    >
                        <div className="indicator-content">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2l3.09 6.26L22 9l-5.91 1.74L17 17l-4.91-2.26L7 17l.91-6.26L2 9l6.91-1.74L12 1z" fill="currentColor" />
                            </svg>
                            <span>{selectedVehicle.plateNumber || selectedVehicle.deviceSerialNumber}</span>
                        </div>
                        <button
                            className="clear-selection"
                            onClick={() => handleVehicleSelect(null)}
                            aria-label={t('gps.modern.clearSelection', 'Clear selection')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default ModernVehiclePanel;