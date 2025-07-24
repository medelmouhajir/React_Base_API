import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import maintenanceService from '../../../services/maintenanceService';
import carService from '../../../services/carService';
import './MaintenancesList.css';

const MaintenancesList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [maintenances, setMaintenances] = useState([]);
    const [filteredMaintenances, setFilteredMaintenances] = useState([]);
    const [cars, setCars] = useState([]);
    const [filters, setFilters] = useState({ carId: '', date: '', status: '', search: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [touchStartX, setTouchStartX] = useState(null);
    const [activeCard, setActiveCard] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    const [sortBy, setSortBy] = useState('scheduledDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Handle resize for responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setViewMode('cards');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (agencyId) {
                    const [carsData, maintData] = await Promise.all([
                        carService.getByAgencyId(agencyId),
                        maintenanceService.getByAgencyId(agencyId)
                    ]);

                    // Only show records for cars belonging to this agency
                    const ownMaintenances = maintData.filter(m =>
                        carsData.some(car => car.id === m.carId)
                    );

                    setCars(carsData);
                    setMaintenances(ownMaintenances);
                    setFilteredMaintenances(ownMaintenances);
                }
            } catch (err) {
                console.error('❌ Error fetching maintenances or cars:', err);
                setError(t('maintenance.list.error') || 'Error loading maintenance records.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [agencyId, t]);

    // Apply filters and sorting whenever filters change or data updates
    useEffect(() => {
        let result = [...maintenances];

        // Apply filters
        if (filters.carId) {
            result = result.filter(m => m.carId === filters.carId);
        }
        if (filters.date) {
            result = result.filter(m => m.scheduledDate.slice(0, 10) === filters.date);
        }
        if (filters.status) {
            result = result.filter(m => {
                if (filters.status === 'completed') return m.isCompleted;
                if (filters.status === 'pending') return !m.isCompleted;
                if (filters.status === 'overdue') {
                    return !m.isCompleted && new Date(m.scheduledDate) < new Date();
                }
                return true;
            });
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(m =>
                m.description?.toLowerCase().includes(searchLower) ||
                m.remarks?.toLowerCase().includes(searchLower) ||
                cars.find(car => car.id === m.carId)?.licensePlate?.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'scheduledDate':
                    aVal = new Date(a.scheduledDate);
                    bVal = new Date(b.scheduledDate);
                    break;
                case 'cost':
                    aVal = a.cost || 0;
                    bVal = b.cost || 0;
                    break;
                case 'status':
                    aVal = a.isCompleted ? 1 : 0;
                    bVal = b.isCompleted ? 1 : 0;
                    break;
                case 'description':
                    aVal = a.description || '';
                    bVal = b.description || '';
                    break;
                default:
                    aVal = a[sortBy];
                    bVal = b[sortBy];
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        setFilteredMaintenances(result);
    }, [filters, maintenances, sortBy, sortOrder, cars]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ carId: '', date: '', status: '', search: '' });
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();

        if (!window.confirm(t('maintenance.list.confirmDelete') || 'Are you sure you want to delete this record?'))
            return;

        try {
            await maintenanceService.delete(id);
            setMaintenances(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('❌ Error deleting maintenance record:', err);
            alert(t('maintenance.list.deleteError') || 'Error deleting maintenance record.');
        }
    };

    const handleEdit = (id, e) => {
        e?.stopPropagation();
        navigate(`/maintenances/${id}/edit`);
    };

    const handleDetails = (id, e) => {
        e?.stopPropagation();
        navigate(`/maintenances/${id}`);
    };

    const handleAdd = () => navigate('/maintenances/add');
    const toggleFilters = () => setShowFilters(prev => !prev);

    // Touch event handlers for swipe actions on mobile
    const handleTouchStart = (e, id) => {
        setTouchStartX(e.touches[0].clientX);
        setActiveCard(id);
    };

    const handleTouchEnd = (e, id) => {
        if (!touchStartX) return;

        const touchEndX = e.changedTouches[0].clientX;
        const difference = touchStartX - touchEndX;

        setTouchStartX(null);
        setActiveCard(null);

        // Swipe threshold
        if (Math.abs(difference) > 100) {
            if (difference > 0) {
                // Swipe left - show delete option
                handleDelete(id, e);
            } else {
                // Swipe right - navigate to edit
                handleEdit(id, e);
            }
        }
    };

    // Format date for better display
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get car info by ID
    const getCarInfo = (carId) => {
        const car = cars.find(c => c.id === carId);
        return car ? `${car.fields.manufacturer} ${car.fields.model} (${car.licensePlate})` : 'Unknown Car';
    };

    // Get maintenance status
    const getMaintenanceStatus = (maintenance) => {
        if (maintenance.isCompleted) return 'completed';
        if (new Date(maintenance.scheduledDate) < new Date()) return 'overdue';
        return 'pending';
    };

    // Get status display info
    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed':
                return { text: t('maintenance.status.completed') || 'Completed', class: 'status-completed' };
            case 'overdue':
                return { text: t('maintenance.status.overdue') || 'Overdue', class: 'status-overdue' };
            case 'pending':
                return { text: t('maintenance.status.pending') || 'Pending', class: 'status-pending' };
            default:
                return { text: status, class: 'status-default' };
        }
    };

    if (isLoading) {
        return (
            <div className={`maintList-container ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="maintList-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`maintList-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* HEADER */}
            <div className="maintList-header">
                <div className="header-content">
                    <h1 className="maintList-title">
                        {t('maintenance.list.title') || 'Maintenance Records'}
                    </h1>
                    <div className="header-actions">
                        {!isMobile && (
                            <div className="view-toggle">
                                <button
                                    className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                                    onClick={() => setViewMode('cards')}
                                    aria-label="Card view"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="3" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="3" width="7" height="7" rx="1" />
                                        <rect x="3" y="14" width="7" height="7" rx="1" />
                                        <rect x="14" y="14" width="7" height="7" rx="1" />
                                    </svg>
                                </button>
                                <button
                                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                    onClick={() => setViewMode('table')}
                                    aria-label="Table view"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18" />
                                        <path d="M3 12h18" />
                                        <path d="M3 18h18" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <button
                            className="add-button"
                            onClick={handleAdd}
                            aria-label={t('maintenance.list.addButton') || 'Add Maintenance'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {!isMobile && (t('maintenance.list.addButton') || 'Add Maintenance')}
                        </button>
                    </div>
                </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="maintList-error" role="alert">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* FILTERS TOGGLE */}
            <button
                className={`filters-toggle ${showFilters ? 'open' : ''}`}
                onClick={toggleFilters}
                aria-expanded={showFilters}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
                </svg>
                {showFilters
                    ? t('maintenance.list.filter.hide') || 'Hide Filters'
                    : t('maintenance.list.filter.show') || 'Show Filters'}
                <span className="toggle-icon">{showFilters ? '▲' : '▼'}</span>
            </button>

            {/* FILTERS SECTION */}
            <div className={`filters-container ${showFilters ? 'expanded' : 'collapsed'}`}>
                <div className="filters-grid">
                    <div className="filter-group">
                        <label htmlFor="search">{t('common.search') || 'Search'}</label>
                        <input
                            type="text"
                            id="search"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder={t('maintenance.list.filter.searchPlaceholder') || 'Search description, remarks, or license plate...'}
                        />
                    </div>

                    <div className="filter-group">
                        <label htmlFor="carId">{t('maintenance.list.filter.car') || 'Car'}</label>
                        <select
                            id="carId"
                            name="carId"
                            value={filters.carId}
                            onChange={handleFilterChange}
                        >
                            <option value="">{t('maintenance.list.filter.allCars') || 'All Cars'}</option>
                            {cars.map(car => (
                                <option key={car.id} value={car.id}>
                                    {car.manufacturer} {car.model} ({car.licensePlate})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="status">{t('common.status') || 'Status'}</label>
                        <select
                            id="status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">{t('maintenance.list.filter.allStatuses') || 'All Statuses'}</option>
                            <option value="pending">{t('maintenance.status.pending') || 'Pending'}</option>
                            <option value="completed">{t('maintenance.status.completed') || 'Completed'}</option>
                            <option value="overdue">{t('maintenance.status.overdue') || 'Overdue'}</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="date">{t('maintenance.list.filter.date') || 'Scheduled Date'}</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>

                <div className="filters-actions">
                    <button className="clear-filters-btn" onClick={clearFilters}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        {t('maintenance.list.filter.clear') || 'Clear'}
                    </button>
                </div>
            </div>

            {/* RESULTS COUNT AND SORT */}
            <div className="results-header">
                <div className="results-count">
                    {filteredMaintenances.length} {t('maintenance.list.recordsFound') || 'records found'}
                </div>

                <div className="sort-controls">
                    <label>{t('common.sortBy') || 'Sort by:'}</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="scheduledDate">{t('maintenance.scheduledDate') || 'Scheduled Date'}</option>
                        <option value="cost">{t('maintenance.cost') || 'Cost'}</option>
                        <option value="status">{t('common.status') || 'Status'}</option>
                        <option value="description">{t('maintenance.description') || 'Description'}</option>
                    </select>

                    <button
                        className="sort-order-btn"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {sortOrder === 'asc' ? (
                                <path d="M7 14l5-5 5 5" />
                            ) : (
                                <path d="M7 10l5 5 5-5" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            {filteredMaintenances.length === 0 ? (
                <div className="maintList-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="7.5,4.21 12,6.81 16.5,4.21" />
                        <polyline points="7.5,19.79 7.5,14.6 3,12" />
                        <polyline points="21,12 16.5,14.6 16.5,19.79" />
                    </svg>
                    <h3>{t('maintenance.list.noRecords') || 'No maintenance records found'}</h3>
                    <p>{t('maintenance.list.noRecordsDescription') || 'Create your first maintenance record to get started.'}</p>
                    <button className="add-button" onClick={handleAdd}>
                        {t('maintenance.list.addFirst') || 'Add First Record'}
                    </button>
                </div>
            ) : (
                <div className={`maintList-content view-${viewMode}`}>
                    {viewMode === 'cards' ? (
                        // CARDS VIEW
                        <div className="maintenance-cards">
                            {filteredMaintenances.map(maintenance => {
                                const status = getMaintenanceStatus(maintenance);
                                const statusInfo = getStatusInfo(status);

                                return (
                                    <div
                                        key={maintenance.id}
                                        className={`maintenance-card ${status} ${activeCard === maintenance.id ? 'swiping' : ''}`}
                                        onClick={(e) => handleDetails(maintenance.id, e)}
                                        onTouchStart={(e) => handleTouchStart(e, maintenance.id)}
                                        onTouchEnd={(e) => handleTouchEnd(e, maintenance.id)}
                                    >
                                        <div className="card-header">
                                            <div className="card-title">
                                                <h3>{maintenance.description || t('maintenance.noDescription') || 'No description'}</h3>
                                                <span className={`status-badge ${statusInfo.class}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </div>
                                            <div className="card-actions">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={(e) => handleEdit(maintenance.id, e)}
                                                    aria-label="Edit"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={(e) => handleDelete(maintenance.id, e)}
                                                    aria-label="Delete"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 6h18" />
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="card-content">
                                            <div className="card-field">
                                                <span className="field-label">{t('maintenance.car') || 'Car'}:</span>
                                                <span className="field-value">{getCarInfo(maintenance.carId)}</span>
                                            </div>

                                            <div className="card-field">
                                                <span className="field-label">{t('maintenance.scheduledDate') || 'Scheduled'}:</span>
                                                <span className="field-value">{formatDate(maintenance.scheduledDate)}</span>
                                            </div>

                                            {maintenance.cost && (
                                                <div className="card-field">
                                                    <span className="field-label">{t('maintenance.cost') || 'Cost'}:</span>
                                                    <span className="field-value cost">{formatCurrency(maintenance.cost)}</span>
                                                </div>
                                            )}

                                            {maintenance.completedDate && (
                                                <div className="card-field">
                                                    <span className="field-label">{t('maintenance.completedDate') || 'Completed'}:</span>
                                                    <span className="field-value">{formatDate(maintenance.completedDate)}</span>
                                                </div>
                                            )}

                                            {maintenance.remarks && (
                                                <div className="card-field remarks">
                                                    <span className="field-label">{t('maintenance.remarks') || 'Remarks'}:</span>
                                                    <span className="field-value">{maintenance.remarks}</span>
                                                </div>
                                            )}
                                        </div>

                                        {isMobile && (
                                            <div className="mobile-hint">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                                <span>Swipe left to delete, right to edit</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // TABLE VIEW
                        <div className="table-wrapper">
                            <table className="maintenance-table">
                                <thead>
                                    <tr>
                                        <th
                                            className={`sortable ${sortBy === 'description' ? `sorted-${sortOrder}` : ''}`}
                                            onClick={() => handleSort('description')}
                                        >
                                            {t('maintenance.description') || 'Description'}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M7 14l5-5 5 5" />
                                            </svg>
                                        </th>
                                        <th>{t('maintenance.car') || 'Car'}</th>
                                        <th
                                            className={`sortable ${sortBy === 'scheduledDate' ? `sorted-${sortOrder}` : ''}`}
                                            onClick={() => handleSort('scheduledDate')}
                                        >
                                            {t('maintenance.scheduledDate') || 'Scheduled'}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M7 14l5-5 5 5" />
                                            </svg>
                                        </th>
                                        <th
                                            className={`sortable ${sortBy === 'cost' ? `sorted-${sortOrder}` : ''}`}
                                            onClick={() => handleSort('cost')}
                                        >
                                            {t('maintenance.cost') || 'Cost'}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M7 14l5-5 5 5" />
                                            </svg>
                                        </th>
                                        <th
                                            className={`sortable ${sortBy === 'status' ? `sorted-${sortOrder}` : ''}`}
                                            onClick={() => handleSort('status')}
                                        >
                                            {t('common.status') || 'Status'}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M7 14l5-5 5 5" />
                                            </svg>
                                        </th>
                                        <th>{t('common.actions') || 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMaintenances.map(maintenance => {
                                        const status = getMaintenanceStatus(maintenance);
                                        const statusInfo = getStatusInfo(status);

                                        return (
                                            <tr
                                                key={maintenance.id}
                                                className="maintenance-row"
                                                onClick={() => handleDetails(maintenance.id)}
                                            >
                                                <td className="description-cell">
                                                    <div className="description-content">
                                                        <span className="description-text">
                                                            {maintenance.description || t('maintenance.noDescription') || 'No description'}
                                                        </span>
                                                        {maintenance.remarks && (
                                                            <span className="remarks-preview">
                                                                {maintenance.remarks.substring(0, 50)}
                                                                {maintenance.remarks.length > 50 && '...'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="car-cell">
                                                    {getCarInfo(maintenance.carId)}
                                                </td>
                                                <td className="date-cell">
                                                    {formatDate(maintenance.scheduledDate)}
                                                </td>
                                                <td className="cost-cell">
                                                    {formatCurrency(maintenance.cost)}
                                                </td>
                                                <td className="status-cell">
                                                    <span className={`status-badge ${statusInfo.class}`}>
                                                        {statusInfo.text}
                                                    </span>
                                                </td>
                                                <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                    <div className="table-actions">
                                                        <button
                                                            className="action-btn edit-btn"
                                                            onClick={(e) => handleEdit(maintenance.id, e)}
                                                            aria-label="Edit"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="action-btn delete-btn"
                                                            onClick={(e) => handleDelete(maintenance.id, e)}
                                                            aria-label="Delete"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 6h18" />
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MaintenancesList;