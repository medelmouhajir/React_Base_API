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
    const [manufacturers, setManufacturers] = useState([]);
    const [models, setModels] = useState([]);
    const [years, setYears] = useState([]);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterManufacturer, setFilterManufacturer] = useState('');
    const [filterModel, setFilterModel] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterAvailability, setFilterAvailability] = useState('');
    const [filterColor, setFilterColor] = useState('');

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [currentSort, setCurrentSort] = useState({ field: '', direction: '' });
    const [showFilters, setShowFilters] = useState(false);

    // Track unique colors for filtering
    const [availableColors, setAvailableColors] = useState([]);

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
                setIsLoading(true);
                setError(null);

                // Fetch all filter data in parallel
                const [carsData, manufacturersData, modelsData, yearsData] = await Promise.all([
                    carService.getByAgencyId(agencyId),
                    carFiltersService.getManufacturers(),
                    carFiltersService.getCarModels(),
                    carFiltersService.getCarYears(),
                ]);

                setCars(carsData);
                setFilteredCars(carsData);
                setManufacturers(manufacturersData);
                setModels(modelsData);
                setYears(yearsData);

                // Extract unique colors for color filter
                const uniqueColors = [...new Set(carsData
                    .map(car => car.color)
                    .filter(Boolean)
                    .map(color => color.trim())
                    .filter(color => color !== '')
                )];
                setAvailableColors(uniqueColors);

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

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setFilterManufacturer('');
        setFilterModel('');
        setFilterYear('');
        setFilterAvailability('');
        setFilterColor('');
    };

    // Get filtered models based on manufacturer selection
    const getFilteredModels = useCallback(() => {
        if (filterManufacturer) {
            return models.filter(model =>
                model.manufacturerId === filterManufacturer
            );
        }
        return models;
    }, [models, filterManufacturer]);

    // Apply filters
    const applyFilters = useCallback(() => {
        let result = [...cars];

        // Text search filter (case insensitive)
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter((car) => {
                // Get manufacturer name through car model relationship
                const manufacturerName = car.car_Model?.car_Manufacturer?.name?.toLowerCase() || '';
                const modelName = car.car_Model?.name?.toLowerCase() || '';
                const licensePlateMatch = car.licensePlate?.toLowerCase().includes(searchLower);
                const colorMatch = car.color?.toLowerCase().includes(searchLower);

                return manufacturerName.includes(searchLower) ||
                    modelName.includes(searchLower) ||
                    licensePlateMatch ||
                    colorMatch;
            });
        }

        // Manufacturer filter
        if (filterManufacturer) {
            result = result.filter(car => {
                const modelInfo = models.find(m => m.id === car.car_ModelId);
                return modelInfo?.manufacturerId === filterManufacturer;
            });
        }

        // Model filter
        if (filterModel) {
            result = result.filter(car => car.car_ModelId === filterModel);
        }

        // Year filter
        if (filterYear) {
            result = result.filter(car => car.car_YearId === filterYear);
        }

        // Availability filter
        if (filterAvailability !== '') {
            const isAvailable = filterAvailability === 'true';
            result = result.filter(car => car.isAvailable === isAvailable);
        }

        // Color filter
        if (filterColor) {
            result = result.filter(car =>
                car.color?.toLowerCase() === filterColor.toLowerCase()
            );
        }

        // Apply current sort
        if (currentSort.field) {
            result = sortCars(result, currentSort.field, currentSort.direction);
        }

        setFilteredCars(result);
    }, [
        cars,
        searchTerm,
        filterManufacturer,
        filterModel,
        filterYear,
        filterAvailability,
        filterColor,
        currentSort,
        models
    ]);

    // Update filtered cars when filters change
    useEffect(() => {
        applyFilters();
    }, [
        applyFilters
    ]);

    // Handle manufacturer filter change to update model options
    useEffect(() => {
        // If manufacturer filter changes, reset model filter
        setFilterModel('');
    }, [filterManufacturer]);

    // Sort cars by field
    const sortCars = (carsToSort, field, direction) => {
        return [...carsToSort].sort((a, b) => {
            let valueA, valueB;

            // Get appropriate values based on field
            switch (field) {
                case 'model':
                    const modelA = models.find(m => m.id === a.car_ModelId);
                    const modelB = models.find(m => m.id === b.car_ModelId);
                    valueA = modelA?.name || '';
                    valueB = modelB?.name || '';
                    break;
                case 'manufacturer':
                    const modelInfoA = models.find(m => m.id === a.car_ModelId);
                    const modelInfoB = models.find(m => m.id === b.car_ModelId);
                    const manufacturerA = manufacturers.find(m => m.id === modelInfoA?.manufacturerId);
                    const manufacturerB = manufacturers.find(m => m.id === modelInfoB?.manufacturerId);
                    valueA = manufacturerA?.name || '';
                    valueB = manufacturerB?.name || '';
                    break;
                case 'year':
                    const yearA = years.find(y => y.id === a.car_YearId);
                    const yearB = years.find(y => y.id === b.car_YearId);
                    valueA = yearA?.yearValue || 0;
                    valueB = yearB?.yearValue || 0;
                    break;
                case 'dailyRate':
                    valueA = a.dailyRate || 0;
                    valueB = b.dailyRate || 0;
                    break;
                case 'licensePlate':
                    valueA = a.licensePlate || '';
                    valueB = b.licensePlate || '';
                    break;
                case 'color':
                    valueA = a.color || '';
                    valueB = b.color || '';
                    break;
                case 'availability':
                    valueA = a.isAvailable ? 1 : 0;
                    valueB = b.isAvailable ? 1 : 0;
                    break;
                default:
                    valueA = a[field] || '';
                    valueB = b[field] || '';
            }

            // Determine sort order
            if (direction === 'asc') {
                return typeof valueA === 'string'
                    ? valueA.localeCompare(valueB)
                    : valueA - valueB;
            } else {
                return typeof valueA === 'string'
                    ? valueB.localeCompare(valueA)
                    : valueB - valueA;
            }
        });
    };

    // Handle sort change
    const handleSort = (field) => {
        let direction = 'asc';

        if (currentSort.field === field) {
            // Toggle direction if same field
            direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        }

        setCurrentSort({ field, direction });

        // Apply sort immediately
        const sortedCars = sortCars(filteredCars, field, direction);
        setFilteredCars(sortedCars);
    };

    // Navigate to add car page
    const handleAddCar = () => {
        navigate('/cars/add');
    };

    // Navigate to edit car page
    const handleEditCar = (id) => {
        navigate(`/cars/${id}`);
    };

    // Handle car deletion
    const handleDeleteCar = async (id) => {
        if (window.confirm(t('car.list.confirmDelete'))) {
            try {
                await carService.delete(id);
                // Remove car from state
                setCars(prevCars => prevCars.filter(car => car.id !== id));
                setFilteredCars(prevCars => prevCars.filter(car => car.id !== id));
            } catch (err) {
                console.error('❌ Error deleting car:', err);
                setError(t('car.list.deleteError'));
            }
        }
    };

    // Toggle car availability
    const handleToggleAvailability = async (id, currentAvailability) => {
        try {
            await carService.updateAvailability(id, !currentAvailability);

            // Update car in state
            const updateCar = (carList) => carList.map(car =>
                car.id === id ? { ...car, isAvailable: !currentAvailability } : car
            );

            setCars(updateCar);
            setFilteredCars(updateCar);
        } catch (err) {
            console.error('❌ Error updating availability:', err);
            setError(t('car.list.updateError'));
        }
    };

    // Render loading state
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

    // Render error state
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

    // Render car card for mobile view
    const renderCarCard = (car) => {
        const model = models.find(m => m.id === car.car_ModelId);
        const modelName = model?.name || t('car.unknown');

        const manufacturerId = model?.manufacturerId;
        const manufacturer = manufacturers.find(m => m.id === manufacturerId);
        const manufacturerName = manufacturer?.name || t('car.unknown');

        const year = years.find(y => y.id === car.car_YearId);
        const yearValue = year?.yearValue || t('car.unknown');

        return (
            <div
                key={car.id}
                className="car-card"
                onClick={() => handleEditCar(car.id)}
            >
                <div className="car-card-header">
                    <h3 className="car-name">{manufacturerName} {modelName}</h3>
                    <span className={`status ${car.isAvailable ? 'available' : 'unavailable'}`}>
                        {car.isAvailable ? t('car.available') : t('car.unavailable')}
                    </span>
                </div>

                <div className="car-info">
                    <div className="info-item">
                        <span className="info-label">{t('car.year')}:</span>
                        <span className="info-value">{yearValue}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">{t('car.licensePlate')}:</span>
                        <span className="info-value">{car.licensePlate}</span>
                    </div>
                    {car.color && (
                        <div className="info-item">
                            <span className="info-label">{t('car.color')}:</span>
                            <span className="info-value">
                                <span
                                    className="color-dot"
                                    style={{ backgroundColor: car.color }}
                                ></span>
                                {car.color}
                            </span>
                        </div>
                    )}
                    <div className="info-item">
                        <span className="info-label">{t('car.dailyRate')}:</span>
                        <span className="info-value">${car.dailyRate}</span>
                    </div>
                </div>

                <div className="car-card-actions">
                    <button
                        className="btn-delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCar(car.id);
                        }}
                    >
                        {t('common.delete')}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={`cars-list-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header */}
            <div className="cl-header">
                <h1 className="cl-title">{t('car.list.title')}</h1>
                <button className="btn-add" onClick={handleAddCar}>
                    {t('car.list.addCar')}
                </button>
            </div>

            {/* Search and filter toggle */}
            <div className="cl-search-bar">
                <div className="cl-search-wrapper">
                    <input
                        type="text"
                        className="cl-search-input"
                        placeholder={t('car.list.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        className="cl-filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                        aria-expanded={showFilters}
                    >
                        <span className="filter-icon">⚙️</span>
                        <span className="filter-text">{t('reservation.selectCar.filters')}</span>
                    </button>
                </div>

                {/* Mobile Filter Panel */}
                <div className={`cl-filters-panel ${showFilters ? 'show' : ''}`}>
                    <div className="cl-filters-grid">
                        <div className="filter-group">
                            <label htmlFor="manufacturer-filter">{t('car.fields.manufacturer')}</label>
                            <select
                                id="manufacturer-filter"
                                className="cl-select"
                                value={filterManufacturer}
                                onChange={(e) => setFilterManufacturer(e.target.value)}
                            >
                                <option value="">{t('car.list.allManufacturers')}</option>
                                {manufacturers.map((manufacturer) => (
                                    <option key={manufacturer.id} value={manufacturer.id}>
                                        {manufacturer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="model-filter">{t('car.fields.model')}</label>
                            <select
                                id="model-filter"
                                className="cl-select"
                                value={filterModel}
                                onChange={(e) => setFilterModel(e.target.value)}
                                disabled={!filterManufacturer}
                            >
                                <option value="">{t('car.list.allModels')}</option>
                                {getFilteredModels().map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="year-filter">{t('car.fields.year')}</label>
                            <select
                                id="year-filter"
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
                        </div>

                        <div className="filter-group">
                            <label htmlFor="availability-filter">{t('car.list.availability')}</label>
                            <select
                                id="availability-filter"
                                className="cl-select"
                                value={filterAvailability}
                                onChange={(e) => setFilterAvailability(e.target.value)}
                            >
                                <option value="">{t('car.list.allAvailability')}</option>
                                <option value="true">{t('car.available')}</option>
                                <option value="false">{t('car.unavailable')}</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="color-filter">{t('car.fields.color')}</label>
                            <select
                                id="color-filter"
                                className="cl-select"
                                value={filterColor}
                                onChange={(e) => setFilterColor(e.target.value)}
                            >
                                <option value="">{t('car.list.allColors')}</option>
                                {availableColors.map((color) => (
                                    <option key={color} value={color}>
                                        {color}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="cl-filter-actions">
                        <button
                            className="btn-clear-filters"
                            onClick={clearFilters}
                        >
                            {t('common.clear')}
                        </button>
                        <button
                            className="btn-close-filters"
                            onClick={() => setShowFilters(false)}
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="cl-results-count">
                {t('car.list.title :', { count: filteredCars.length, total: cars.length })}
            </div>

            {/* Car list */}
            {filteredCars.length === 0 ? (
                <div className="cl-no-results">
                    <p>{t('car.list.noResults')}</p>
                    {(searchTerm || filterManufacturer || filterModel || filterYear || filterAvailability || filterColor) && (
                        <button
                            className="btn-clear-filters"
                            onClick={clearFilters}
                        >
                            {t('car.list.clearFilters')}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Mobile view - card based */}
                    <div className="mobile-view">
                        <div className="car-cards">
                            {filteredCars.map(car => renderCarCard(car))}
                        </div>
                    </div>

                    {/* Desktop view - table based */}
                    <div className="desktop-view">
                        <table className="cl-table">
                            <thead>
                                <tr>
                                    <th
                                        className={currentSort.field === 'manufacturer' ? `sorted-${currentSort.direction}` : ''}
                                        onClick={() => handleSort('manufacturer')}
                                    >
                                        {t('car.fields.manufacturer')}
                                    </th>
                                    <th
                                        className={currentSort.field === 'model' ? `sorted-${currentSort.direction}` : ''}
                                        onClick={() => handleSort('model')}
                                    >
                                        {t('car.fields.model')}
                                    </th>
                                    <th
                                        className={currentSort.field === 'year' ? `sorted-${currentSort.direction}` : ''}
                                        onClick={() => handleSort('year')}
                                    >
                                        {t('car.fields.year')}
                                    </th>
                                    <th
                                        className={currentSort.field === 'licensePlate' ? `sorted-${currentSort.direction}` : ''}
                                        onClick={() => handleSort('licensePlate')}
                                    >
                                        {t('car.fields.licensePlate')}
                                    </th>
                                    <th
                                        className={currentSort.field === 'color' ? `sorted-${currentSort.direction}` : ''}
                                        onClick={() => handleSort('color')}
                                    >
                                        {t('car.fields.color')}
                                    </th>
                                    <th
                                        className={currentSort.field === 'dailyRate' ? `sorted-${currentSort.direction}` : ''}
                                        onClick={() => handleSort('dailyRate')}
                                    >
                                        {t('car.fields.dailyRate')}
                                    </th>
                                    <th
                                        className={currentSort.field === 'availability' ? `sorted-${currentSort.direction}` : ''}
                                        onClick={() => handleSort('availability')}
                                    >
                                        {t('car.fields.availability')}
                                    </th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCars.map((car) => {
                                    const model = models.find(m => m.id === car.car_ModelId);
                                    const modelName = model?.name || t('car.unknown');

                                    const manufacturerId = model?.manufacturerId;
                                    const manufacturer = manufacturers.find(m => m.id === manufacturerId);
                                    const manufacturerName = manufacturer?.name || t('car.unknown');

                                    const year = years.find(y => y.id === car.car_YearId);
                                    const yearValue = year?.yearValue || t('car.unknown');

                                    return (
                                        <tr
                                            key={car.id}
                                            onClick={() => handleEditCar(car.id)}
                                        >
                                            <td>{manufacturerName}</td>
                                            <td>{modelName}</td>
                                            <td>{yearValue}</td>
                                            <td>{car.licensePlate}</td>
                                            <td>
                                                {car.color && (
                                                    <>
                                                        <span
                                                            className="color-dot"
                                                            style={{ backgroundColor: car.color }}
                                                        ></span>
                                                        {car.color}
                                                    </>
                                                )}
                                            </td>
                                            <td>{car.dailyRate}</td>
                                            <td>
                                                <span className={`status ${car.isAvailable ? 'available' : 'unavailable'}`}>
                                                    {car.isAvailable ? t('car.available') : t('car.unavailable')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cl-actions">
                                                    {/*<button*/}
                                                    {/*    className="btn-toggle-availability table-action"*/}
                                                    {/*    onClick={(e) => {*/}
                                                    {/*        e.stopPropagation();*/}
                                                    {/*        handleToggleAvailability(car.id, car.isAvailable);*/}
                                                    {/*    }}*/}
                                                    {/*    title={car.isAvailable ? t('car.makeUnavailable') : t('car.makeAvailable')}*/}
                                                    {/*>*/}
                                                    {/*    {car.isAvailable ? '🔴' : '🟢'}*/}
                                                    {/*</button>*/}
                                                    <button
                                                        className="btn-delete table-action"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCar(car.id);
                                                        }}
                                                        title={t('common.delete')}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default CarsList;