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
    const [filters, setFilters] = useState({ carId: '', date: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [touchStartX, setTouchStartX] = useState(null);
    const [activeCard, setActiveCard] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (agencyId) {
                    const [carsData, maintData] = await Promise.all([
                        carService.getByAgencyId(agencyId),
                        maintenanceService.getAll()
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

    // Apply filters whenever filters change or data updates
    useEffect(() => {
        let result = [...maintenances];

        if (filters.carId) {
            result = result.filter(m => m.carId === filters.carId);
        }
        if (filters.date) {
            result = result.filter(m => m.scheduledDate.slice(0, 10) === filters.date);
        }
        setFilteredMaintenances(result);
    }, [filters, maintenances]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ carId: '', date: '' });
    };

    const handleDelete = async (id, e) => {
        // Prevent event bubbling to parent elements
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

    const handleTouchMove = (e) => {
        // No implementation needed here - just using for demonstration
        // In a real swipe implementation, you would track movement here
    };

    const handleTouchEnd = (e) => {
        if (!touchStartX) return;

        const touchEndX = e.changedTouches[0].clientX;
        const difference = touchStartX - touchEndX;

        // Reset touch tracking
        setTouchStartX(null);

        // If swipe distance is significant, perform action
        // (not implementing actual swipe actions in this version)
        if (Math.abs(difference) > 100) {
            // Example: difference > 0 means swipe left (could trigger delete)
            // difference < 0 means swipe right (could trigger edit)
            // Commented out for safety:
            // if (difference > 0 && activeCard) handleDelete(activeCard);
            // else if (difference < 0 && activeCard) handleEdit(activeCard);
        }

        setActiveCard(null);
    };

    // Format date for better display
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className={`maintList-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* HEADER ROW */}
            <div className="header-row">
                <h1 className="maintList-title">
                    {t('maintenance.list.title') || 'Maintenance Records'}
                </h1>
                <button
                    className="add-button"
                    onClick={handleAdd}
                    aria-label={t('maintenance.list.addButton') || 'Add Maintenance'}
                >
                    + {t('maintenance.list.addButton') || 'Add Maintenance'}
                </button>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="maintList-error" role="alert">
                    {error}
                </div>
            )}

            {/* COLLAPSIBLE FILTERS TOGGLE (visible only on narrow screens) */}
            <button
                className={`filters-toggle ${showFilters ? 'open' : ''}`}
                onClick={toggleFilters}
                aria-expanded={showFilters}
            >
                {showFilters
                    ? t('maintenance.list.filter.hide') || 'Hide Filters'
                    : t('maintenance.list.filter.show') || 'Show Filters'}
                <span className="toggle-icon">{showFilters ? '▲' : '▼'}</span>
            </button>

            {/* FILTERS SECTION */}
            <div className={`filters-container ${showFilters ? 'expanded' : ''}`}>
                <div className="filters-grid">
                    <div className="filter-group">
                        <label htmlFor="carId">
                            {t('maintenance.list.filter.car') || 'Car'}
                        </label>
                        <select
                            id="carId"
                            name="carId"
                            value={filters.carId}
                            onChange={handleFilterChange}
                        >
                            <option value="">
                                {t('maintenance.list.filter.allCars') || 'All Cars'}
                            </option>
                            {cars.map(car => (
                                <option key={car.id} value={car.id}>
                                    {car.licensePlate} - {car.model}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="date">
                            {t('maintenance.list.filter.date') || 'Date'}
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="filter-actions">
                        <button className="clear-filters" onClick={clearFilters}>
                            {t('maintenance.list.filter.clear') || 'Clear Filters'}
                        </button>
                    </div>
                </div>
            </div>

            {/* LOADING STATE */}
            {isLoading ? (
                <div className="loading" role="status">
                    <div className="loading-spinner"></div>
                    <span>{t('common.loading') || 'Loading...'}</span>
                </div>
            ) : (
                <>
                    {/* DESKTOP TABLE VIEW */}
                    <div className="desktop-table">
                        <table className="maintList-table">
                            <thead>
                                <tr>
                                    <th>{t('maintenance.list.table.car') || 'Car'}</th>
                                    <th>{t('maintenance.list.table.scheduledDate') || 'Date'}</th>
                                    <th>{t('maintenance.list.table.description') || 'Description'}</th>
                                    <th>{t('maintenance.list.table.cost') || 'Cost'}</th>
                                    <th>{t('maintenance.list.table.isCompleted') || 'Completed'}</th>
                                    <th>{t('maintenance.list.table.actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMaintenances.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="no-data">
                                            {t('maintenance.list.noRecords') || 'No records found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMaintenances.map(record => (
                                        <tr key={record.id} onClick={(e) => handleDetails(record.id, e)}>
                                            <td>{record.carLicensePlate || record.CarLicensePlate}</td>
                                            <td>{formatDate(record.scheduledDate)}</td>
                                            <td className="desc-cell" title={record.description}>
                                                {record.description.length > 40
                                                    ? record.description.slice(0, 40) + '…'
                                                    : record.description}
                                            </td>
                                            <td>
                                                {record.cost !== null
                                                    ? `${record.cost.toFixed(2)}`
                                                    : '-'}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${record.isCompleted ? 'completed' : 'pending'}`}>
                                                    {record.isCompleted
                                                        ? t('common.yes') || 'Yes'
                                                        : t('common.no') || 'No'}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="small-btn"
                                                    onClick={(e) => handleEdit(record.id, e)}
                                                    aria-label={t('common.edit') || 'Edit'}
                                                >
                                                    {t('common.edit') || 'Edit'}
                                                </button>
                                                <button
                                                    className="small-btn delete-btn"
                                                    onClick={(e) => handleDelete(record.id, e)}
                                                    aria-label={t('common.remove') || 'Remove'}
                                                >
                                                    {t('common.remove') || 'Remove'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="mobile-cards">
                        {filteredMaintenances.length === 0 ? (
                            <div className="no-data-mobile">
                                {t('maintenance.list.noRecords') || 'No records found.'}
                            </div>
                        ) : (
                            filteredMaintenances.map(record => (
                                <div
                                    key={record.id}
                                    className="card"
                                    onClick={(e) => handleDetails(record.id, e)}
                                    onTouchStart={(e) => handleTouchStart(e, record.id)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    <div className="card-header">
                                        <span className="card-title">{record.carLicensePlate || record.CarLicensePlate}</span>
                                        <span className={`status-badge ${record.isCompleted ? 'completed' : 'pending'}`}>
                                            {record.isCompleted
                                                ? t('common.completed') || 'Completed'
                                                : t('common.pending') || 'Pending'}
                                        </span>
                                    </div>

                                    <div className="card-row">
                                        <div>
                                            <span className="card-label">
                                                {t('maintenance.list.table.scheduledDate') || 'Date'}:
                                            </span>
                                            {formatDate(record.scheduledDate)}
                                        </div>
                                        <div>
                                            <span className="card-label">
                                                {t('maintenance.list.table.cost') || 'Cost'}:
                                            </span>
                                            {record.cost !== null ? `${record.cost.toFixed(2)}` : '-'}
                                        </div>
                                    </div>

                                    <div className="card-description">
                                        <span className="card-label">
                                            {t('maintenance.list.table.description') || 'Description'}:
                                        </span>
                                        {record.description}
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="small-btn"
                                            onClick={(e) => handleEdit(record.id, e)}
                                            aria-label={t('common.edit') || 'Edit'}
                                        >
                                            {t('common.edit') || 'Edit'}
                                        </button>
                                        <button
                                            className="small-btn delete-btn"
                                            onClick={(e) => handleDelete(record.id, e)}
                                            aria-label={t('common.remove') || 'Remove'}
                                        >
                                            {t('common.remove') || 'Remove'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MaintenancesList;