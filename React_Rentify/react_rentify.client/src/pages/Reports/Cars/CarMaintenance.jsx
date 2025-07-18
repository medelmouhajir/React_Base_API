// src/pages/Reports/Cars/CarMaintenance.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import carService from '../../../services/carService';
import maintenanceService from '../../../services/maintenanceService';
import carFiltersService from '../../../services/carFiltersService';
import './CarMaintenance.css';

const CarMaintenance = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    // Data states
    const [cars, setCars] = useState([]);
    const [maintenances, setMaintenances] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [models, setModels] = useState([]);
    const [filteredData, setFilteredData] = useState([]);

    // Filter states
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
        endDate: new Date().toISOString().split('T')[0] // Today
    });
    const [selectedCar, setSelectedCar] = useState('');
    const [selectedManufacturer, setSelectedManufacturer] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, completed, pending
    const [costRange, setCostRange] = useState({ min: '', max: '' });

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('summary'); // summary, detailed, analytics
    const [sortConfig, setSortConfig] = useState({ key: 'scheduledDate', direction: 'desc' });
    const [showFilters, setShowFilters] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalMaintenance: 0,
        completedMaintenance: 0,
        pendingMaintenance: 0,
        totalCost: 0,
        averageCost: 0,
        mostExpensiveMaintenance: 0,
        carsNeedingMaintenance: 0
    });

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (agencyId) {
                    const [carsData, maintenanceData, manufacturersData, modelsData] = await Promise.all([
                        carService.getByAgencyId(agencyId),
                        maintenanceService.getByAgencyId(agencyId),
                        carFiltersService.getManufacturers(),
                        carFiltersService.getCarModels()
                    ]);

                    // Filter maintenance records for cars belonging to this agency
                    const agencyMaintenances = maintenanceData.filter(maintenance =>
                        carsData.some(car => car.id === maintenance.carId)
                    );

                    setCars(carsData);
                    setMaintenances(agencyMaintenances);
                    setManufacturers(manufacturersData);
                    setModels(modelsData);
                }
            } catch (err) {
                console.error('❌ Error fetching maintenance data:', err);
                setError(t('reports.cars.maintenance.error') || 'Error loading maintenance data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [agencyId, t]);

    // Process and filter data
    useEffect(() => {
        if (!cars.length || !maintenances.length) return;

        let filtered = maintenances.map(maintenance => {
            const car = cars.find(c => c.id === maintenance.carId);
            const manufacturer = manufacturers.find(m => m.id === car?.manufacturerId);
            const model = models.find(m => m.id === car?.modelId);

            return {
                ...maintenance,
                car,
                manufacturerName: manufacturer?.name || 'Unknown',
                modelName: model?.name || 'Unknown',
                licensePlate: car?.licensePlate || 'N/A'
            };
        });

        // Apply filters
        if (dateRange.startDate) {
            filtered = filtered.filter(item =>
                new Date(item.scheduledDate) >= new Date(dateRange.startDate)
            );
        }

        if (dateRange.endDate) {
            filtered = filtered.filter(item =>
                new Date(item.scheduledDate) <= new Date(dateRange.endDate)
            );
        }

        if (selectedCar) {
            filtered = filtered.filter(item => item.carId === selectedCar);
        }

        if (selectedManufacturer) {
            filtered = filtered.filter(item => item.car?.manufacturerId === selectedManufacturer);
        }

        if (selectedModel) {
            filtered = filtered.filter(item => item.car?.modelId === selectedModel);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(item =>
                statusFilter === 'completed' ? item.isCompleted : !item.isCompleted
            );
        }

        if (costRange.min) {
            filtered = filtered.filter(item => parseFloat(item.cost || 0) >= parseFloat(costRange.min));
        }

        if (costRange.max) {
            filtered = filtered.filter(item => parseFloat(item.cost || 0) <= parseFloat(costRange.max));
        }

        // Sort data
        filtered.sort((a, b) => {
            const { key, direction } = sortConfig;
            let aValue = a[key];
            let bValue = b[key];

            if (key === 'cost') {
                aValue = parseFloat(aValue || 0);
                bValue = parseFloat(bValue || 0);
            } else if (key === 'scheduledDate' || key === 'completedDate') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredData(filtered);

        // Calculate stats
        const completed = filtered.filter(item => item.isCompleted);
        const pending = filtered.filter(item => !item.isCompleted);
        const totalCost = filtered.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0);
        const carsWithMaintenance = new Set(filtered.map(item => item.carId)).size;

        setStats({
            totalMaintenance: filtered.length,
            completedMaintenance: completed.length,
            pendingMaintenance: pending.length,
            totalCost,
            averageCost: filtered.length > 0 ? totalCost / filtered.length : 0,
            mostExpensiveMaintenance: Math.max(...filtered.map(item => parseFloat(item.cost || 0)), 0),
            carsNeedingMaintenance: carsWithMaintenance
        });
    }, [cars, maintenances, manufacturers, models, dateRange, selectedCar, selectedManufacturer, selectedModel, statusFilter, costRange, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleExport = () => {
        // Create CSV data
        const csvData = filteredData.map(item => ({
            'Car': `${item.manufacturerName} ${item.modelName}`,
            'License Plate': item.licensePlate,
            'Scheduled Date': new Date(item.scheduledDate).toLocaleDateString(),
            'Description': item.description,
            'Cost': `$${parseFloat(item.cost || 0).toFixed(2)}`,
            'Status': item.isCompleted ? 'Completed' : 'Pending',
            'Completed Date': item.completedDate ? new Date(item.completedDate).toLocaleDateString() : 'N/A',
            'Remarks': item.remarks || 'N/A'
        }));

        const csvContent = [
            Object.keys(csvData[0] || {}).join(','),
            ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `car-maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className={`car-maintenance-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('reports.cars.maintenance.loading') || 'Loading maintenance data...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`car-maintenance-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>{t('reports.cars.maintenance.errorTitle') || 'Error Loading Data'}</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-button">
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`car-maintenance-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="maintenance-header">
                <div className="header-content">
                    <button
                        onClick={() => navigate('/reports')}
                        className="back-button"
                        aria-label="Back to reports"
                    >
                        ←
                    </button>
                    <div className="header-info">
                        <h1 className="maintenance-title">
                            {t('reports.cars.maintenance.title') || 'Car Maintenance Report'}
                        </h1>
                        <p className="maintenance-description">
                            {t('reports.cars.maintenance.description') || 'Comprehensive maintenance tracking and analytics for your fleet'}
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`filter-toggle ${showFilters ? 'active' : ''}`}
                    >
                        🔍 {t('common.filters') || 'Filters'}
                    </button>
                    <button onClick={handleExport} className="export-button">
                        📊 {t('common.export') || 'Export'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="filters-section">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>{t('common.dateRange') || 'Date Range'}</label>
                            <div className="date-range">
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>{t('cars.car') || 'Car'}</label>
                            <select
                                value={selectedCar}
                                onChange={(e) => setSelectedCar(e.target.value)}
                            >
                                <option value="">{t('common.all') || 'All Cars'}</option>
                                {cars.map(car => (
                                    <option key={car.id} value={car.id}>
                                        {car.licensePlate} - {manufacturers.find(m => m.id === car.manufacturerId)?.name} {models.find(m => m.id === car.modelId)?.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>{t('cars.fields.manufacturer') || 'Manufacturer'}</label>
                            <select
                                value={selectedManufacturer}
                                onChange={(e) => setSelectedManufacturer(e.target.value)}
                            >
                                <option value="">{t('common.all') || 'All Manufacturers'}</option>
                                {manufacturers.map(manufacturer => (
                                    <option key={manufacturer.id} value={manufacturer.id}>
                                        {manufacturer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>{t('maintenance.status.title') || 'Status'}</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">{t('common.all') || 'All'}</option>
                                <option value="completed">{t('maintenance.completed') || 'Completed'}</option>
                                <option value="pending">{t('maintenance.pending') || 'Pending'}</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>{t('maintenance.costRange') || 'Cost Range'}</label>
                            <div className="cost-range">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={costRange.min}
                                    onChange={(e) => setCostRange(prev => ({ ...prev, min: e.target.value }))}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={costRange.max}
                                    onChange={(e) => setCostRange(prev => ({ ...prev, max: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-section">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🔧</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.totalMaintenance}</div>
                            <div className="stat-label">{t('maintenance.total') || 'Total Maintenance'}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.completedMaintenance}</div>
                            <div className="stat-label">{t('maintenance.completed') || 'Completed'}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.pendingMaintenance}</div>
                            <div className="stat-label">{t('maintenance.pending') || 'Pending'}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <div className="stat-value">${stats.totalCost.toFixed(2)}</div>
                            <div className="stat-label">{t('maintenance.totalCost') || 'Total Cost'}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <div className="stat-value">${stats.averageCost.toFixed(2)}</div>
                            <div className="stat-label">{t('maintenance.averageCost') || 'Average Cost'}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🚗</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.carsNeedingMaintenance}</div>
                            <div className="stat-label">{t('maintenance.carsInvolved') || 'Cars Involved'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="view-tabs">
                <button
                    className={`tab-button ${viewMode === 'summary' ? 'active' : ''}`}
                    onClick={() => setViewMode('summary')}
                >
                    {t('common.summary') || 'Summary'}
                </button>
                <button
                    className={`tab-button ${viewMode === 'detailed' ? 'active' : ''}`}
                    onClick={() => setViewMode('detailed')}
                >
                    {t('common.detailed') || 'Detailed'}
                </button>
            </div>

            {/* Content */}
            <div className="content-section">
                {viewMode === 'summary' ? (
                    <div className="summary-view">
                        <div className="summary-cards">
                            {filteredData.slice(0, 10).map(item => (
                                <div key={item.id} className="maintenance-card">
                                    <div className="card-header">
                                        <div className="car-info">
                                            <strong>{item.manufacturerName} {item.modelName}</strong>
                                            <span className="license-plate">{item.licensePlate}</span>
                                        </div>
                                        <div className={`status-badge ${item.isCompleted ? 'completed' : 'pending'}`}>
                                            {item.isCompleted ? (t('maintenance.completed') || 'Completed') : (t('maintenance.pending') || 'Pending')}
                                        </div>
                                    </div>
                                    <div className="card-content">
                                        <p className="maintenance-description">{item.description}</p>
                                        <div className="maintenance-details">
                                            <span className="maintenance-date">
                                                📅 {new Date(item.scheduledDate).toLocaleDateString()}
                                            </span>
                                            <span className="maintenance-cost">
                                                💰 ${parseFloat(item.cost || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredData.length > 10 && (
                            <div className="view-more">
                                <p>{filteredData.length - 10} {t('common.moreItems') || 'more items available'}</p>
                                <button onClick={() => setViewMode('detailed')} className="view-all-button">
                                    {t('common.viewAll') || 'View All'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="detailed-view">
                        <div className="table-container">
                            <table className="maintenance-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('licensePlate')} className="sortable">
                                            {t('cars.fields.licensePlate') || 'License Plate'}
                                            {sortConfig.key === 'licensePlate' && (
                                                <span className={`sort-arrow ${sortConfig.direction}`}>
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                        <th onClick={() => handleSort('manufacturerName')} className="sortable">
                                            {t('cars.car') || 'Car'}
                                            {sortConfig.key === 'manufacturerName' && (
                                                <span className={`sort-arrow ${sortConfig.direction}`}>
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                        <th onClick={() => handleSort('scheduledDate')} className="sortable">
                                            {t('maintenance.scheduledDate') || 'Scheduled Date'}
                                            {sortConfig.key === 'scheduledDate' && (
                                                <span className={`sort-arrow ${sortConfig.direction}`}>
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                        <th>{t('maintenance.description') || 'Description'}</th>
                                        <th onClick={() => handleSort('cost')} className="sortable">
                                            {t('maintenance.cost') || 'Cost'}
                                            {sortConfig.key === 'cost' && (
                                                <span className={`sort-arrow ${sortConfig.direction}`}>
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                        <th onClick={() => handleSort('isCompleted')} className="sortable">
                                            {t('maintenance.status.title') || 'Status'}
                                            {sortConfig.key === 'isCompleted' && (
                                                <span className={`sort-arrow ${sortConfig.direction}`}>
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                        <th>{t('maintenance.completedDate') || 'Completed Date'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map(item => (
                                        <tr key={item.id}>
                                            <td className="license-plate-cell">{item.licensePlate}</td>
                                            <td className="car-cell">
                                                <div className="car-info">
                                                    <strong>{item.manufacturerName}</strong>
                                                    <span>{item.modelName}</span>
                                                </div>
                                            </td>
                                            <td className="date-cell">
                                                {new Date(item.scheduledDate).toLocaleDateString()}
                                            </td>
                                            <td className="description-cell">
                                                <div className="description-content" title={item.description}>
                                                    {item.description}
                                                </div>
                                            </td>
                                            <td className="cost-cell">
                                                ${parseFloat(item.cost || 0).toFixed(2)}
                                            </td>
                                            <td className="status-cell">
                                                <span className={`status-badge ${item.isCompleted ? 'completed' : 'pending'}`}>
                                                    {item.isCompleted ?
                                                        (t('maintenance.completed') || 'Completed') :
                                                        (t('maintenance.pending') || 'Pending')
                                                    }
                                                </span>
                                            </td>
                                            <td className="date-cell">
                                                {item.completedDate ?
                                                    new Date(item.completedDate).toLocaleDateString() :
                                                    '-'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredData.length === 0 && (
                                <div className="no-data">
                                    <div className="no-data-icon">📊</div>
                                    <h3>{t('maintenance.noData') || 'No Maintenance Records Found'}</h3>
                                    <p>{t('maintenance.noDataDescription') || 'Try adjusting your filters or date range'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarMaintenance;