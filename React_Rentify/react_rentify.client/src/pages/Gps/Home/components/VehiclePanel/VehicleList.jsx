// src/pages/Gps/Home/components/VehiclePanel/VehicleList.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import VehicleCard from './VehicleCard';

import './VehicleList.css';

const VehicleList = ({
    vehicles = [],
    selectedVehicle,
    onVehicleSelect,
    filters = {},
    isLoading = false,
    isMobile = false,
    showVirtualization = false
}) => {
    const { t } = useTranslation();

    // Filter and sort vehicles
    const filteredAndSortedVehicles = useMemo(() => {
        let filtered = [...vehicles];

        // Apply status filter
        if (filters.status && filters.status !== 'all') {
            switch (filters.status) {
                case 'online':
                    filtered = filtered.filter(v => v.isOnline);
                    break;
                case 'offline':
                    filtered = filtered.filter(v => !v.isOnline);
                    break;
                case 'moving':
                    filtered = filtered.filter(v => v.isMoving);
                    break;
                case 'parked':
                    filtered = filtered.filter(v => v.isOnline && !v.isMoving);
                    break;
            }
        }

        // Apply search filter
        if (filters.search && filters.search.trim()) {
            const searchLower = filters.search.toLowerCase().trim();
            filtered = filtered.filter(vehicle =>
                vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
                vehicle.model?.toLowerCase().includes(searchLower) ||
                vehicle.deviceSerialNumber?.toLowerCase().includes(searchLower)
            );
        }

        // Apply vehicle type filter
        if (filters.selectedTypes && filters.selectedTypes.length > 0) {
            filtered = filtered.filter(vehicle =>
                filters.selectedTypes.includes(vehicle.vehicleType?.toLowerCase())
            );
        }

        // Sort vehicles: online first, then by status, then by license plate
        return filtered.sort((a, b) => {
            // Online vehicles first
            if (a.isOnline !== b.isOnline) {
                return b.isOnline - a.isOnline;
            }

            // Moving vehicles first (among online)
            if (a.isOnline && b.isOnline && a.isMoving !== b.isMoving) {
                return b.isMoving - a.isMoving;
            }

            // Then by license plate
            return (a.licensePlate || '').localeCompare(b.licensePlate || '');
        });
    }, [vehicles, filters]);

    // Group vehicles by status for better organization
    const groupedVehicles = useMemo(() => {
        const groups = {
            online: filteredAndSortedVehicles.filter(v => v.isOnline),
            offline: filteredAndSortedVehicles.filter(v => !v.isOnline)
        };

        // Further group online vehicles
        groups.moving = groups.online.filter(v => v.isMoving);
        groups.parked = groups.online.filter(v => !v.isMoving);

        return groups;
    }, [filteredAndSortedVehicles]);

    // Loading state
    if (isLoading) {
        return (
            <div className="vehicle-list loading">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="vehicle-card skeleton">
                        <div className="skeleton-content">
                            <div className="skeleton-line w-60"></div>
                            <div className="skeleton-line w-40"></div>
                            <div className="skeleton-line w-80"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty state
    if (filteredAndSortedVehicles.length === 0) {
        return (
            <div className="vehicle-list empty">
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                            <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0v-6h-8m0 -5h3l3 3" />
                        </svg>
                    </div>
                    {vehicles.length === 0 ? (
                        <>
                            <h3>{t('gps.noVehicles', 'No Vehicles Found')}</h3>
                            <p>{t('gps.noVehiclesDesc', 'No vehicles are configured for GPS tracking.')}</p>
                        </>
                    ) : (
                        <>
                            <h3>{t('gps.noMatchingVehicles', 'No Matching Vehicles')}</h3>
                            <p>{t('gps.tryDifferentFilters', 'Try adjusting your search or filter criteria.')}</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Show grouped view for better organization when not on mobile
    if (!isMobile && filteredAndSortedVehicles.length > 10) {
        return (
            <div className="vehicle-list grouped">
                {/* Moving Vehicles */}
                {groupedVehicles.moving.length > 0 && (
                    <div className="vehicle-group">
                        <div className="group-header">
                            <div className="group-status moving">
                                <div className="status-indicator"></div>
                                {t('gps.status.moving', 'Moving')}
                            </div>
                            <div className="group-count">{groupedVehicles.moving.length}</div>
                        </div>
                        <div className="group-vehicles">
                            {groupedVehicles.moving.map(vehicle => (
                                <VehicleCard
                                    key={vehicle.id}
                                    vehicle={vehicle}
                                    isSelected={selectedVehicle?.id === vehicle.id}
                                    onClick={() => onVehicleSelect(vehicle)}
                                    showQuickActions={!isMobile}
                                    compact={isMobile}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Parked Vehicles */}
                {groupedVehicles.parked.length > 0 && (
                    <div className="vehicle-group">
                        <div className="group-header">
                            <div className="group-status parked">
                                <div className="status-indicator"></div>
                                {t('gps.status.parked', 'Parked')}
                            </div>
                            <div className="group-count">{groupedVehicles.parked.length}</div>
                        </div>
                        <div className="group-vehicles">
                            {groupedVehicles.parked.map(vehicle => (
                                <VehicleCard
                                    key={vehicle.id}
                                    vehicle={vehicle}
                                    isSelected={selectedVehicle?.id === vehicle.id}
                                    onClick={() => onVehicleSelect(vehicle)}
                                    showQuickActions={!isMobile}
                                    compact={isMobile}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Offline Vehicles */}
                {groupedVehicles.offline.length > 0 && (
                    <div className="vehicle-group">
                        <div className="group-header">
                            <div className="group-status offline">
                                <div className="status-indicator"></div>
                                {t('gps.status.offline', 'Offline')}
                            </div>
                            <div className="group-count">{groupedVehicles.offline.length}</div>
                        </div>
                        <div className="group-vehicles">
                            {groupedVehicles.offline.map(vehicle => (
                                <VehicleCard
                                    key={vehicle.id}
                                    vehicle={vehicle}
                                    isSelected={selectedVehicle?.id === vehicle.id}
                                    onClick={() => onVehicleSelect(vehicle)}
                                    showQuickActions={!isMobile}
                                    compact={isMobile}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Simple list view for mobile or smaller lists
    return (
        <div className={`vehicle-list simple ${isMobile ? 'mobile' : ''}`}>
            {filteredAndSortedVehicles.map(vehicle => (
                <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    isSelected={selectedVehicle?.id === vehicle.id}
                    onClick={() => onVehicleSelect(vehicle)}
                    showQuickActions={!isMobile}
                    compact={isMobile}
                />
            ))}
        </div>
    );
};

export default VehicleList;