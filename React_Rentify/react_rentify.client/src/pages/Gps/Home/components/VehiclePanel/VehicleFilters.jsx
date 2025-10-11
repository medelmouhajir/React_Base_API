// src/pages/Gps/Home/components/VehiclePanel/VehicleFilters.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const VehicleFilters = ({
    filters,
    onFiltersChange,
    vehicleStats,
    showAdvanced = false
}) => {
    const { t } = useTranslation();
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);

    const handleFilterChange = (key, value) => {
        onFiltersChange(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleTypeToggle = (type) => {
        const newTypes = filters.selectedTypes.includes(type)
            ? filters.selectedTypes.filter(t => t !== type)
            : [...filters.selectedTypes, type];

        handleFilterChange('selectedTypes', newTypes);
    };

    const clearAllFilters = () => {
        onFiltersChange({
            status: 'all',
            search: '',
            selectedTypes: []
        });
    };

    const hasActiveFilters = filters.status !== 'all' ||
        filters.search ||
        filters.selectedTypes.length > 0;

    return (
        <div className="vehicle-filters">
            {/* Search */}
            <div className="filter-group">
                <div className="search-input-wrapper">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t('gps.filters.search', 'Search vehicles...')}
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    {filters.search && (
                        <button
                            className="clear-search-btn"
                            onClick={() => handleFilterChange('search', '')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="filter-group">
                <div className="status-filter-tabs">
                    <button
                        className={`status-tab ${filters.status === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('status', 'all')}
                    >
                        <span className="tab-label">{t('gps.filters.all', 'All')}</span>
                        <span className="tab-count">{vehicleStats.total}</span>
                    </button>

                    <button
                        className={`status-tab ${filters.status === 'online' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('status', 'online')}
                    >
                        <span className="status-indicator online"></span>
                        <span className="tab-label">{t('gps.filters.online', 'Online')}</span>
                        <span className="tab-count">{vehicleStats.online}</span>
                    </button>

                    <button
                        className={`status-tab ${filters.status === 'moving' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('status', 'moving')}
                    >
                        <span className="status-indicator moving"></span>
                        <span className="tab-label">{t('gps.filters.moving', 'Moving')}</span>
                        <span className="tab-count">{vehicleStats.moving}</span>
                    </button>

                    <button
                        className={`status-tab ${filters.status === 'parked' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('status', 'parked')}
                    >
                        <span className="status-indicator parked"></span>
                        <span className="tab-label">{t('gps.filters.parked', 'Parked')}</span>
                        <span className="tab-count">{vehicleStats.parked}</span>
                    </button>

                    <button
                        className={`status-tab ${filters.status === 'offline' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('status', 'offline')}
                    >
                        <span className="status-indicator offline"></span>
                        <span className="tab-label">{t('gps.filters.offline', 'Offline')}</span>
                        <span className="tab-count">{vehicleStats.offline}</span>
                    </button>
                </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="filter-group">
                <button
                    className="advanced-toggle"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                    <svg
                        className={`chevron ${showAdvancedFilters ? 'expanded' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <polyline points="6,9 12,15 18,9" />
                    </svg>
                    {t('gps.filters.advanced', 'Advanced Filters')}
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div className="advanced-filters">
                    {/* Vehicle Types */}
                    <div className="filter-section">
                        <label className="filter-label">
                            {t('gps.filters.vehicleTypes', 'Vehicle Types')}
                        </label>
                        <div className="checkbox-group">
                            {['car', 'truck', 'motorcycle', 'bus', 'van'].map(type => (
                                <label key={type} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={filters.selectedTypes.includes(type)}
                                        onChange={() => handleTypeToggle(type)}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-label">
                                        {t(`gps.vehicleTypes.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
                <div className="filter-group">
                    <button className="clear-filters-btn" onClick={clearAllFilters}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                        </svg>
                        {t('gps.filters.clearAll', 'Clear All Filters')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default VehicleFilters;