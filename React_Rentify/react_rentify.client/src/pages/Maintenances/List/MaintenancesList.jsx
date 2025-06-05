import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import maintenanceService from '../../../services/maintenanceService';
import carService from '../../../services/carService';
import './MaintenancesList.css';

const MaintenancesList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    const [maintenances, setMaintenances] = useState([]);
    const [filteredMaintenances, setFilteredMaintenances] = useState([]);
    const [cars, setCars] = useState([]);
    const [filters, setFilters] = useState({ carId: '', date: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false); // For collapsible on mobile

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
    const handleDelete = async (id) => {
        if (!window.confirm(t('maintenance.list.confirmDelete') || 'Are you sure you want to delete this record?')) return;
        try {
            await maintenanceService.delete(id);
            setMaintenances(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('❌ Error deleting maintenance record:', err);
            alert(t('maintenance.list.deleteError') || 'Error deleting maintenance record.');
        }
    };
    const handleEdit = (id) => navigate(`/maintenances/${id}/edit`);
    const handleDetails = (id) => navigate(`/maintenances/${id}`);
    const handleAdd = () => navigate('/maintenances/add');
    const toggleFilters = () => setShowFilters(prev => !prev);

    return (
        <div className="maintList-container">
            {/* HEADER ROW */}
            <div className="header-row">
                <h1 className="maintList-title">
                    {t('maintenance.list.title') || 'Maintenance Records'}
                </h1>
                <button
                    className="btn-primary add-button"
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
            </button>

            {/* FILTERS SECTION */}
            <div className={`filters-container ${showFilters ? 'expanded' : ''}`}>
                <div className="filters-grid">
                    <div className="filter-group">
                        <label htmlFor="carFilter">
                            {t('maintenance.list.filter.car') || 'Filter by Car'}
                        </label>
                        <select
                            id="carFilter"
                            name="carId"
                            value={filters.carId}
                            onChange={handleFilterChange}
                        >
                            <option value="">
                                {t('maintenance.list.filter.allCars') || 'All Cars'}
                            </option>
                            {cars.map(car => (
                                <option key={car.id} value={car.id}>
                                    {car.licensePlate || car.LicensePlate}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="dateFilter">
                            {t('maintenance.list.filter.date') || 'Filter by Date'}
                        </label>
                        <input
                            type="date"
                            id="dateFilter"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-actions">
                        <button className="btn-secondary clear-filters" onClick={clearFilters}>
                            {t('maintenance.list.filter.clear') || 'Clear Filters'}
                        </button>
                    </div>
                </div>
            </div>

            {/* LOADING STATE */}
            {isLoading ? (
                <div className="loading">{t('common.loading') || 'Loading...'}</div>
            ) : (
                <>
                    {/* RESPONSIVE LIST: Table for desktop, Cards for mobile */}
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
                                        <tr key={record.id}>
                                            <td>{record.carLicensePlate || record.CarLicensePlate}</td>
                                            <td>{record.scheduledDate.slice(0, 10)}</td>
                                            <td className="desc-cell">
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
                                                {record.isCompleted
                                                    ? t('common.yes') || 'Yes'
                                                    : t('common.no') || 'No'}
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="btn-secondary small-btn"
                                                    onClick={() => handleDetails(record.id)}
                                                    aria-label={t('common.details') || 'Details'}
                                                >
                                                    {t('common.details') || 'Details'}
                                                </button>
                                                <button
                                                    className="btn-secondary small-btn"
                                                    onClick={() => handleEdit(record.id)}
                                                    aria-label={t('common.edit') || 'Edit'}
                                                >
                                                    {t('common.edit') || 'Edit'}
                                                </button>
                                                <button
                                                    className="btn-secondary small-btn delete-btn"
                                                    onClick={() => handleDelete(record.id)}
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

                    {/* CARD LIST FOR MOBILE */}
                    <div className="mobile-cards">
                        {filteredMaintenances.length === 0 ? (
                            <div className="no-data-mobile">
                                {t('maintenance.list.noRecords') || 'No records found.'}
                            </div>
                        ) : (
                            filteredMaintenances.map(record => (
                                <div className="card" key={record.id}>
                                    <div className="card-row">
                                        <div>
                                            <span className="card-label">
                                                {t('maintenance.list.table.car') || 'Car'}:
                                            </span>{' '}
                                            {record.carLicensePlate || record.CarLicensePlate}
                                        </div>
                                        <div>
                                            <span className="card-label">
                                                {t('maintenance.list.table.scheduledDate') || 'Date'}:
                                            </span>{' '}
                                            {record.scheduledDate.slice(0, 10)}
                                        </div>
                                    </div>
                                    <div className="card-row">
                                        <div>
                                            <span className="card-label">
                                                {t('maintenance.list.table.description') || 'Description'}:
                                            </span>{' '}
                                            {record.description.length > 60
                                                ? record.description.slice(0, 60) + '…'
                                                : record.description}
                                        </div>
                                    </div>
                                    <div className="card-row">
                                        <div>
                                            <span className="card-label">
                                                {t('maintenance.list.table.cost') || 'Cost'}:
                                            </span>{' '}
                                            {record.cost !== null ? `${record.cost.toFixed(2)}` : '-'}
                                        </div>
                                        <div>
                                            <span className="card-label">
                                                {t('maintenance.list.table.isCompleted') || 'Completed'}:
                                            </span>{' '}
                                            {record.isCompleted
                                                ? t('common.yes') || 'Yes'
                                                : t('common.no') || 'No'}
                                        </div>
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="btn-secondary small-btn"
                                            onClick={() => handleDetails(record.id)}
                                        >
                                            {t('common.details') || 'Details'}
                                        </button>
                                        <button
                                            className="btn-secondary small-btn"
                                            onClick={() => handleEdit(record.id)}
                                        >
                                            {t('common.edit') || 'Edit'}
                                        </button>
                                        <button
                                            className="btn-secondary small-btn delete-btn"
                                            onClick={() => handleDelete(record.id)}
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
