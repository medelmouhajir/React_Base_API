// src/pages/Gps/Home/components/VehiclePanel/VehiclePanel.jsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Components
import VehicleCard from './VehicleCard';
import VehicleFilters from './VehicleFilters';

import './VehiclePanel.css';

const VehiclePanel = ({
    vehicles,
    selectedVehicle,
    onVehicleSelect,
    filters,
    onFiltersChange,
    isLoading
}) => {
    const { t } = useTranslation();
    const [isMinimized, setIsMinimized] = useState(false);

    // Calculate vehicle statistics
    const vehicleStats = useMemo(() => {
        const stats = {
            total: vehicles.length,
            online: 0,
            offline: 0,
            moving: 0,
            parked: 0
        };

        vehicles.forEach(vehicle => {
            if (vehicle.isOnline) {
                stats.online++;
                if (vehicle.isMoving) {
                    stats.moving++;
                } else {
                    stats.parked++;
                }
            } else {
                stats.offline++;
            }
        });

        return stats;
    }, [vehicles]);

    // Group vehicles by status for better organization
    const groupedVehicles = useMemo(() => {
        const groups = {
            moving: [],
            parked: [],
            offline: []
        };

        vehicles.forEach(vehicle => {
            if (!vehicle.isOnline) {
                groups.offline.push(vehicle);
            } else if (vehicle.isMoving) {
                groups.moving.push(vehicle);
            } else {
                groups.parked.push(vehicle);
            }
        });

        // Sort each group by last update time (most recent first)
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) =>
                new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0)
            );
        });

        return groups;
    }, [vehicles]);

    if (isLoading) {
        return (
            <div className="vehicle-panel loading">
                <div className="panel-header">
                    <h3>{t('gps.vehicles', 'Vehicles')}</h3>
                </div>
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>{t('gps.loadingVehicles', 'Loading vehicles...')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`vehicle-panel ${isMinimized ? 'minimized' : ''}`}>

            {/* Panel Header */}
            <div className="panel-header">
                <div className="header-content">
                    <h3>{t('gps.vehicles', 'Vehicles')}</h3>
                    <div className="vehicle-count-summary">
                        <span className="total-count">{vehicleStats.total}</span>
                        <span className="count-label">{t('common.total', 'total')}</span>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="minimize-btn"
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? t('common.expand', 'Expand') : t('common.minimize', 'Minimize')}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ transform: isMinimized ? 'rotate(180deg)' : 'none' }}
                        >
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Vehicle Statistics */}
                    <div className="vehicle-stats">
                        <div className="stat-item online">
                            <div className="stat-value">{vehicleStats.online}</div>
                            <div className="stat-label">{t('gps.status.online', 'Online')}</div>
                        </div>
                        <div className="stat-item moving">
                            <div className="stat-value">{vehicleStats.moving}</div>
                            <div className="stat-label">{t('gps.status.moving', 'Moving')}</div>
                        </div>
                        <div className="stat-item parked">
                            <div className="stat-value">{vehicleStats.parked}</div>
                            <div className="stat-label">{t('gps.status.parked', 'Parked')}</div>
                        </div>
                        <div className="stat-item offline">
                            <div className="stat-value">{vehicleStats.offline}</div>
                            <div className="stat-label">{t('gps.status.offline', 'Offline')}</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <VehicleFilters
                        filters={filters}
                        onFiltersChange={onFiltersChange}
                        vehicleStats={vehicleStats}
                    />

                    {/* Vehicle List */}
                    <div className="vehicle-list">
                        {vehicles.length === 0 ? (
                            <div className="no-vehicles">
                                <div className="no-vehicles-icon">🚗</div>
                                <p>{t('gps.noVehicles', 'No vehicles found')}</p>
                                <small>{t('gps.noVehiclesDesc', 'Add vehicles with GPS devices to track them here.')}</small>
                            </div>
                        ) : (
                            <>
                                {/* Moving Vehicles Section */}
                                {groupedVehicles.moving.length > 0 && (
                                    <div className="vehicle-group">
                                        <div className="group-header moving">
                                            <div className="group-indicator"></div>
                                            <h4>{t('gps.status.moving', 'Moving')} ({groupedVehicles.moving.length})</h4>
                                        </div>
                                        <div className="group-vehicles">
                                            {groupedVehicles.moving.map(vehicle => (
                                                <VehicleCard
                                                    key={vehicle.id}
                                                    vehicle={vehicle}
                                                    isSelected={selectedVehicle?.id === vehicle.id}
                                                    onSelect={() => onVehicleSelect(vehicle)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Parked Vehicles Section */}
                                {groupedVehicles.parked.length > 0 && (
                                    <div className="vehicle-group">
                                        <div className="group-header parked">
                                            <div className="group-indicator"></div>
                                            <h4>{t('gps.status.parked', 'Parked')} ({groupedVehicles.parked.length})</h4>
                                        </div>
                                        <div className="group-vehicles">
                                            {groupedVehicles.parked.map(vehicle => (
                                                <VehicleCard
                                                    key={vehicle.id}
                                                    vehicle={vehicle}
                                                    isSelected={selectedVehicle?.id === vehicle.id}
                                                    onSelect={() => onVehicleSelect(vehicle)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Offline Vehicles Section */}
                                {groupedVehicles.offline.length > 0 && (
                                    <div className="vehicle-group">
                                        <div className="group-header offline">
                                            <div className="group-indicator"></div>
                                            <h4>{t('gps.status.offline', 'Offline')} ({groupedVehicles.offline.length})</h4>
                                        </div>
                                        <div className="group-vehicles">
                                            {groupedVehicles.offline.map(vehicle => (
                                                <VehicleCard
                                                    key={vehicle.id}
                                                    vehicle={vehicle}
                                                    isSelected={selectedVehicle?.id === vehicle.id}
                                                    onSelect={() => onVehicleSelect(vehicle)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default VehiclePanel;