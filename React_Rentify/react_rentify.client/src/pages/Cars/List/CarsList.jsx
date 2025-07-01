// src/pages/Cars/List/CarsList.jsx
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import carFiltersService from '../../../services/carFiltersService';
import './CarsList.css';

const CarsList = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;
    const navigate = useNavigate();

    // State variables
    const [cars, setCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [models, setModels] = useState([]);
    const [years, setYears] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterModel, setFilterModel] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterAvailability, setFilterAvailability] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

    // Check window size for responsive design
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modelsData, yearsData] = await Promise.all([
                    carFiltersService.getCarModels(),
                    carFiltersService.getCarYears(),
                ]);
                setModels(modelsData);
                setYears(yearsData);

                const carsData = await carService.getByAgencyId(agencyId);
                setCars(carsData);
                setFilteredCars(carsData);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError(t('car.list.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };

        if (agencyId) {
            fetchData();
        }
    }, [agencyId, t]);

    // Apply filters
    const applyFilters = useCallback(() => {
        let result = [...cars];

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter((car) => {
                const modelMatch = car.model?.toLowerCase().includes(searchLower);
                const licensePlateMatch = car.licensePlate?.toLowerCase().includes(searchLower);
                const colorMatch = car.color?.toLowerCase().includes(searchLower);
                return modelMatch || licensePlateMatch || colorMatch;
            });
        }

        if (filterModel) {
            result = result.filter((car) => car.car_ModelId === filterModel);
        }

        if (filterYear) {
            result = result.filter((car) => car.car_YearId === parseInt(filterYear));
        }

        if (filterAvailability !== '') {
            const isAvailable = filterAvailability === 'true';
            result = result.filter((car) => car.isAvailable === isAvailable);
        }

        setFilteredCars(result);
    }, [cars, searchTerm, filterModel, filterYear, filterAvailability]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Reset filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterModel('');
        setFilterYear('');
        setFilterAvailability('');
        setFilteredCars(cars);
    };

    // Navigation handlers
    const handleAddCar = () => navigate('/cars/add');
    const handleViewDetails = (id) => navigate(`/cars/details/${id}`);
    const handleEditCar = (id) => navigate(`/cars/${id}/edit`);

    const handleRemoveCar = async (id) => {
        if (window.confirm(t('car.list.confirmDelete'))) {
            try {
                await carService.delete(id);
                setCars((prevCars) => prevCars.filter((car) => car.id !== id));
                setFilteredCars((prevCars) => prevCars.filter((car) => car.id !== id));
            } catch (err) {
                console.error(`❌ Error deleting car with ID ${id}:`, err);
                alert(t('car.list.deleteError'));
            }
        }
    };

    // Find model name by ID
    const getModelName = (modelId) => {
        const model = models.find((m) => m.id === modelId);
        return model ? model.name : '';
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`cars-list-container ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="cl-loading">
                    <div className="cl-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`cars-list-container ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="cl-error">
                    <p>{error}</p>
                    <button
                        className="cl-retry-btn"
                        onClick={() => window.location.reload()}
                    >
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`cars-list-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header */}
            <div className="cl-header">
                <h1 className="cl-title">{t('car.list.title')}</h1>
                <button className="btn-add" onClick={handleAddCar}>
                    {t('car.list.addCar')}
                </button>
            </div>

            {/* Filters */}
            <div className="cl-filters-wrapper">
                <div className="cl-filters">
                    <input
                        type="text"
                        className="cl-search-input"
                        placeholder={t('car.list.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <select
                        className="cl-select"
                        value={filterModel}
                        onChange={(e) => setFilterModel(e.target.value)}
                    >
                        <option value="">{t('car.list.allModels')}</option>
                        {models.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="cl-select"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                    >
                        <option value="">{t('car.list.allYears')}</option>
                        {years.map((year) => (
                            <option key={year.id} value={year.id}>
                                {year.yearValue}
                            </option>
                        ))}
                    </select>

                    <select
                        className="cl-select"
                        value={filterAvailability}
                        onChange={(e) => setFilterAvailability(e.target.value)}
                    >
                        <option value="">{t('car.list.allAvailability')}</option>
                        <option value="true">{t('car.list.available')}</option>
                        <option value="false">{t('car.list.unavailable')}</option>
                    </select>

                    {(searchTerm || filterModel || filterYear || filterAvailability !== '') && (
                        <button
                            className="cl-reset-btn"
                            onClick={handleResetFilters}
                            aria-label={t('car.list.resetFilters')}
                        >
                            {t('car.list.reset')}
                        </button>
                    )}
                </div>

                <div className="cl-results-count">
                    {filteredCars.length} {t('car.list.carsFound')}
                </div>
            </div>

            {/* Table view (desktop) */}
            <div className="cl-table-wrapper">
                <table className="cl-data-table">
                    <thead>
                        <tr>
                            <th>{t('car.list.model')}</th>
                            <th>{t('car.list.year')}</th>
                            <th>{t('car.list.licensePlate')}</th>
                            <th>{t('car.list.color')}</th>
                            <th>{t('car.list.dailyRate')}</th>
                            <th>{t('car.list.availability')}</th>
                            <th>{t('car.list.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCars.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="cl-no-data">
                                    {t('car.list.noCarsFound')}
                                </td>
                            </tr>
                        ) : (
                            filteredCars.map((car) => (
                                <tr key={car.id}>
                                    <td>{getModelName(car.car_ModelId)}</td>
                                    <td>
                                        {years.find((y) => y.id === car.car_YearId)?.yearValue || ''}
                                    </td>
                                    <td>{car.licensePlate}</td>
                                    <td>
                                        <div className="color-dot" style={{ backgroundColor: car.color }}></div>
                                        {car.color}
                                    </td>
                                    <td>{car.dailyRate.toFixed(2)}</td>
                                    <td>
                                        <span
                                            className={`availability-badge ${car.isAvailable ? 'avail-true' : 'avail-false'
                                                }`}
                                        >
                                            {car.isAvailable
                                                ? t('car.list.available')
                                                : t('car.list.unavailable')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="cl-actions-cell">
                                            <button
                                                className="cl-action-btn btn-details"
                                                onClick={() => handleViewDetails(car.id)}
                                            >
                                                {t('common.details')}
                                            </button>
                                            <button
                                                className="cl-action-btn btn-edit"
                                                onClick={() => handleEditCar(car.id)}
                                            >
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                className="cl-action-btn btn-remove"
                                                onClick={() => handleRemoveCar(car.id)}
                                            >
                                                {t('common.remove')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Card view (mobile) */}
            <div className="cl-cards-wrapper">
                {filteredCars.length === 0 ? (
                    <div className="cl-no-data-mobile">
                        {t('car.list.noCarsFound')}
                    </div>
                ) : (
                    filteredCars.map((car) => (
                        <div key={car.id} className="cl-card">
                            <div className="cl-card-header">
                                <div className="cl-card-title">
                                    <h3>{getModelName(car.car_ModelId)}</h3>
                                    <span className="cl-card-year">
                                        {years.find((y) => y.id === car.car_YearId)?.value || ''}
                                    </span>
                                </div>
                                <span
                                    className={`availability-badge ${car.isAvailable ? 'avail-true' : 'avail-false'
                                        }`}
                                >
                                    {car.isAvailable
                                        ? t('car.list.available')
                                        : t('car.list.unavailable')}
                                </span>
                            </div>

                            <div className="cl-card-content">
                                <p>
                                    <span className="card-label">{t('car.list.licensePlate')}:</span> {car.licensePlate}
                                </p>
                                <p>
                                    <span className="card-label">{t('car.list.color')}:</span>
                                    <span className="color-value">
                                        <span className="color-dot" style={{ backgroundColor: car.color }}></span>
                                        {car.color}
                                    </span>
                                </p>
                                <p>
                                    <span className="card-label">{t('car.list.dailyRate')}:</span> {car.dailyRate.toFixed(2)}
                                </p>
                            </div>

                            <div className="cl-card-actions">
                                <button
                                    className="cl-card-btn btn-details"
                                    onClick={() => handleViewDetails(car.id)}
                                >
                                    {t('common.details')}
                                </button>
                                <button
                                    className="cl-card-btn btn-edit"
                                    onClick={() => handleEditCar(car.id)}
                                >
                                    {t('common.edit')}
                                </button>
                                <button
                                    className="cl-card-btn btn-remove"
                                    onClick={() => handleRemoveCar(car.id)}
                                >
                                    {t('common.remove')}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CarsList;