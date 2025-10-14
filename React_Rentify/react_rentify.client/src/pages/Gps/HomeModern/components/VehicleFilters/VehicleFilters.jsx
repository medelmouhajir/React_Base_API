import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Styles
import './VehicleFilters.css';


const VehicleFilters = ({
    filters = { status: 'all', search: '', selectedTypes: [] },
    onFiltersChange,
    vehicles = [],
    stats = {},
    isMobile = false
}) => {
    const { t } = useTranslation();

    // Extract unique vehicle types from vehicles
    const vehicleTypes = useMemo(() => {
        const types = [...new Set(vehicles.map(v => v.vehicleType).filter(Boolean))];
        return types.sort();
    }, [vehicles]);

    const statusOptions = [
        {
            key: 'all',
            label: t('gps.modern.filters.all', 'All'),
            count: stats.total || 0,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            color: 'default'
        },
        {
            key: 'online',
            label: t('gps.modern.filters.online', 'Online'),
            count: stats.online || 0,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            color: 'success'
        },
        {
            key: 'offline',
            label: t('gps.modern.filters.offline', 'Offline'),
            count: stats.offline || 0,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5" />
                    <path d="M3 3l18 18M9 9l6 6" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            color: 'gray'
        },
        {
            key: 'moving',
            label: t('gps.modern.filters.moving', 'Moving'),
            count: stats.moving || 0,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 3l3.5 7h-7l3.5-7z" fill="currentColor" />
                    <circle cx="12" cy="17" r="4" fill="currentColor" />
                </svg>
            ),
            color: 'primary'
        },
        {
            key: 'idle',
            label: t('gps.modern.filters.idle', 'Idle'),
            count: stats.idle || 0,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="1" />
                </svg>
            ),
            color: 'warning'
        },
        {
            key: 'alerts',
            label: t('gps.modern.filters.alerts', 'With Alerts'),
            count: stats.alerts || 0,
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
                </svg>
            ),
            color: 'danger'
        }
    ];

    const handleStatusChange = (status) => {
        onFiltersChange?.({
            ...filters,
            status
        });
    };

    const handleTypeToggle = (vehicleType) => {
        const currentTypes = filters.selectedTypes || [];
        const newTypes = currentTypes.includes(vehicleType)
            ? currentTypes.filter(t => t !== vehicleType)
            : [...currentTypes, vehicleType];

        onFiltersChange?.({
            ...filters,
            selectedTypes: newTypes
        });
    };

    const handleClearAll = () => {
        onFiltersChange?.({
            status: 'all',
            search: '',
            selectedTypes: []
        });
    };

    const hasActiveFilters = filters.status !== 'all' ||
        (filters.selectedTypes?.length > 0) ||
        filters.search;

    return (
        <motion.div
            className={`vehicle-filters ${isMobile ? 'mobile' : 'desktop'}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Status Filters */}
            <div className="filter-group">
                <div className="filter-header">
                    <h3 className="filter-label">
                        {t('gps.modern.filters.status', 'Status')}
                    </h3>
                    {hasActiveFilters && (
                        <motion.button
                            className="clear-filters-btn"
                            onClick={handleClearAll}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            {t('common.clear', 'Clear')}
                        </motion.button>
                    )}
                </div>

                <div className="filter-options status-filters">
                    {statusOptions.map((option) => (
                        <motion.button
                            key={option.key}
                            className={`filter-option status-${option.key} ${filters.status === option.key ? 'active' : ''
                                } ${option.color}`}
                            onClick={() => handleStatusChange(option.key)}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="option-icon">
                                {option.icon}
                            </div>
                            <div className="option-content">
                                <span className="option-label">{option.label}</span>
                                <span className="option-count">{option.count}</span>
                            </div>

                            {/* Active indicator */}
                            <AnimatePresence>
                                {filters.status === option.key && (
                                    <motion.div
                                        className="active-indicator"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Vehicle Type Filters */}
            {vehicleTypes.length > 0 && (
                <div className="filter-group">
                    <h3 className="filter-label">
                        {t('gps.modern.filters.vehicleType', 'Vehicle Type')}
                    </h3>

                    <div className="filter-options type-filters">
                        {vehicleTypes.map((type) => {
                            const isSelected = filters.selectedTypes?.includes(type);
                            const typeCount = vehicles.filter(v => v.vehicleType === type).length;

                            return (
                                <motion.button
                                    key={type}
                                    className={`filter-option type-option ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleTypeToggle(type)}
                                    whileTap={{ scale: 0.95 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="option-content">
                                        <span className="option-label">
                                            {t(`gps.modern.vehicleTypes.${type.toLowerCase()}`, type)}
                                        </span>
                                        <span className="option-count">{typeCount}</span>
                                    </div>

                                    <div className="checkbox-indicator">
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    className="checkbox-check"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filter Summary */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        className="filter-summary"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="summary-content">
                            <div className="summary-text">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" fill="currentColor" />
                                </svg>
                                <span>
                                    {t('gps.modern.filters.activeFilters', 'Active filters')}
                                    {filters.status !== 'all' && (
                                        <span className="filter-tag status">
                                            {statusOptions.find(o => o.key === filters.status)?.label}
                                        </span>
                                    )}
                                    {filters.selectedTypes?.map(type => (
                                        <span key={type} className="filter-tag type">
                                            {type}
                                        </span>
                                    ))}
                                    {filters.search && (
                                        <span className="filter-tag search">
                                            "{filters.search}"
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Actions */}
            <div className="filter-actions">
                <div className="filter-info">
                    <span className="results-count">
                        {stats.filtered !== undefined ?
                            t('gps.modern.filters.showing', '{{count}} vehicles shown', { count: stats.filtered }) :
                            t('gps.modern.filters.total', '{{count}} total vehicles', { count: stats.total || 0 })
                        }
                    </span>
                </div>

                {hasActiveFilters && (
                    <motion.button
                        className="reset-filters-btn"
                        onClick={handleClearAll}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M4 12a8 8 0 018-8V2l3 3-3 3V6a6 6 0 100 12 6 6 0 006-6h2a8 8 0 01-16 0z" fill="currentColor" />
                        </svg>
                        {t('gps.modern.filters.resetAll', 'Reset All')}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default VehicleFilters;