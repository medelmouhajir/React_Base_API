// src/pages/Reservation/Details/Modals/SelectCarModal.jsx
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import reservationService from '../../../../services/reservationService';
import './SelectCarModal.css';

const SelectCarModal = ({ currentCarId, startDate, endDate, onClose, onSelect }) => {
    const { t } = useTranslation();

    const [availableCars, setAvailableCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCarId, setSelectedCarId] = useState(currentCarId);

    // Filter state
    const [filters, setFilters] = useState({
        manufacturer: '',
        model: '',
        category: '',
        features: [],
        search: '',
        priceRange: [0, 10000],  // Default price range
        year: '',
        transmission: '',
        sortBy: 'recommended'
    });

    // Fetch available cars
    useEffect(() => {
        const fetchCars = async () => {
            try {
                setLoading(true);
                const cars = await reservationService.getAvailableCars(startDate, endDate, currentCarId);
                setAvailableCars(cars);

                // Set max price range based on data
                if (cars.length > 0) {
                    const maxPrice = Math.max(...cars.map(car => car.dailyRate || 0));
                    setFilters(prev => ({
                        ...prev,
                        priceRange: [0, maxPrice + 100] // Add buffer to max price
                    }));
                }
            } catch (err) {
                console.error('Error fetching available cars:', err);
                setError(t('reservation.selectCar.errorLoading'));
            } finally {
                setLoading(false);
            }
        };

        fetchCars();
    }, [startDate, endDate, currentCarId, t]);

    // Generate filter options from available cars
    const filterOptions = useMemo(() => {
        const manufacturers = [...new Set(availableCars.map(car => car.car_Model?.car_Manufacturer?.name).filter(Boolean))];
        const models = [...new Set(availableCars.map(car => car.car_Model?.name).filter(Boolean))];
        const categories = [...new Set(availableCars.map(car => car.category).filter(Boolean))];
        const years = [...new Set(availableCars.map(car => car.year).filter(Boolean))].sort((a, b) => b - a);
        const transmissions = [...new Set(availableCars.map(car => car.transmission).filter(Boolean))];

        // Extract all unique features
        const allFeatures = new Set();
        availableCars.forEach(car => {
            if (car.features) {
                car.features.split(',').forEach(feature => {
                    const trimmed = feature.trim();
                    if (trimmed) allFeatures.add(trimmed);
                });
            }
        });

        return {
            manufacturers,
            models,
            categories,
            features: [...allFeatures],
            years,
            transmissions
        };
    }, [availableCars]);

    // Apply filters to cars
    const filteredCars = useMemo(() => {
        return availableCars.filter(car => {
            // Text search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const manufacturerName = car.car_Model?.car_Manufacturer?.name?.toLowerCase() || '';
                const modelName = car.car_Model?.name?.toLowerCase() || '';
                const licensePlate = car.licensePlate?.toLowerCase() || '';

                if (!manufacturerName.includes(searchTerm) &&
                    !modelName.includes(searchTerm) &&
                    !licensePlate.includes(searchTerm)) {
                    return false;
                }
            }

            // Manufacturer filter
            if (filters.manufacturer && car.car_Model?.car_Manufacturer?.name !== filters.manufacturer) {
                return false;
            }

            // Model filter
            if (filters.model && car.car_Model?.name !== filters.model) {
                return false;
            }

            // Category filter
            if (filters.category && car.category !== filters.category) {
                return false;
            }

            // Year filter
            if (filters.year && car.year !== parseInt(filters.year)) {
                return false;
            }

            // Transmission filter
            if (filters.transmission && car.transmission !== filters.transmission) {
                return false;
            }

            // Price range filter
            if (car.dailyRate < filters.priceRange[0] || car.dailyRate > filters.priceRange[1]) {
                return false;
            }

            // Features filter
            if (filters.features.length > 0 && car.features) {
                const carFeatures = car.features.split(',').map(f => f.trim());
                for (const feature of filters.features) {
                    if (!carFeatures.includes(feature)) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [availableCars, filters]);

    // Sort cars based on selected sort criteria
    const sortedCars = useMemo(() => {
        const sorted = [...filteredCars];

        switch (filters.sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => (a.dailyRate || 0) - (b.dailyRate || 0));
            case 'price-high':
                return sorted.sort((a, b) => (b.dailyRate || 0) - (a.dailyRate || 0));
            case 'year-new':
                return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
            case 'year-old':
                return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
            case 'recommended':
            default:
                // Default sort - puts current car first, then sorts by similarity to current car
                return sorted.sort((a, b) => {
                    // Current car always comes first
                    if (a.id === currentCarId) return -1;
                    if (b.id === currentCarId) return 1;

                    // Then sort by manufacturer & model similarity to current car
                    const currentCar = availableCars.find(c => c.id === currentCarId);
                    if (currentCar) {
                        const currentManufacturer = currentCar.car_Model?.car_Manufacturer?.name;
                        const currentModel = currentCar.car_Model?.name;

                        const aManufacturer = a.car_Model?.car_Manufacturer?.name;
                        const bManufacturer = b.car_Model?.car_Manufacturer?.name;

                        // Same manufacturer as current car comes first
                        if (aManufacturer === currentManufacturer && bManufacturer !== currentManufacturer) return -1;
                        if (bManufacturer === currentManufacturer && aManufacturer !== currentManufacturer) return 1;

                        // Same model comes first
                        const aModel = a.car_Model?.name;
                        const bModel = b.car_Model?.name;
                        if (aModel === currentModel && bModel !== currentModel) return -1;
                        if (bModel === currentModel && aModel !== currentModel) return 1;
                    }

                    // Finally sort by price (low to high)
                    return (a.dailyRate || 0) - (b.dailyRate || 0);
                });
        }
    }, [filteredCars, filters.sortBy, currentCarId, availableCars]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearchChange = (e) => {
        setFilters(prev => ({
            ...prev,
            search: e.target.value
        }));
    };

    const handleFeatureToggle = (feature) => {
        setFilters(prev => {
            const newFeatures = [...prev.features];
            if (newFeatures.includes(feature)) {
                // Remove feature
                return {
                    ...prev,
                    features: newFeatures.filter(f => f !== feature)
                };
            } else {
                // Add feature
                return {
                    ...prev,
                    features: [...newFeatures, feature]
                };
            }
        });
    };

    const handlePriceRangeChange = (e) => {
        const { name, value } = e.target;
        const index = name === 'minPrice' ? 0 : 1;

        setFilters(prev => {
            const newRange = [...prev.priceRange];
            newRange[index] = parseInt(value) || 0;
            return {
                ...prev,
                priceRange: newRange
            };
        });
    };

    const handleCarSelect = (carId) => {
        setSelectedCarId(carId);
    };

    const handleSubmit = () => {
        if (selectedCarId && selectedCarId !== currentCarId) {
            onSelect(selectedCarId);
        } else {
            onClose();
        }
    };

    const resetFilters = () => {
        setFilters({
            manufacturer: '',
            model: '',
            category: '',
            features: [],
            search: '',
            priceRange: [0, Math.max(...availableCars.map(car => car.dailyRate || 0)) + 100],
            year: '',
            transmission: '',
            sortBy: 'recommended'
        });
    };

    return (
        <Modal title={t('reservation.selectCar.title')} size="large" onClose={onClose} fullHeight={true}>
            <div className="select-car-container">
                {loading ? (
                    <div className="select-car-loading">
                        <div className="loading-spinner"></div>
                        <p>{t('common.loading')}</p>
                    </div>
                ) : error ? (
                    <div className="select-car-error">
                        <p>{error}</p>
                        <button className="btn-retry" onClick={() => window.location.reload()}>
                            {t('common.retry')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="select-car-toolbar">
                            <div className="search-select-car-container">
                                <input
                                    type="text"
                                    className="search-select-car-input"
                                    placeholder={t('reservation.selectCar.searchPlaceholder')}
                                    value={filters.search}
                                    onChange={handleSearchChange}
                                />
                                <span className="search-select-car-icon">🔍</span>
                            </div>
                            <div className="sort-container">
                                <label htmlFor="sortBy">{t('reservation.selectCar.sortBy')}</label>
                                <select
                                    id="sortBy"
                                    name="sortBy"
                                    value={filters.sortBy}
                                    onChange={handleFilterChange}
                                    className="sort-select"
                                >
                                    <option value="recommended">{t('reservation.selectCar.sortRecommended')}</option>
                                    <option value="price-low">{t('reservation.selectCar.sortPriceLow')}</option>
                                    <option value="price-high">{t('reservation.selectCar.sortPriceHigh')}</option>
                                    <option value="year-new">{t('reservation.selectCar.sortYearNew')}</option>
                                    <option value="year-old">{t('reservation.selectCar.sortYearOld')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="select-car-content">
                            {/* Filters Section */}
                            <div className="filters-section">
                                <div className="filters-header">
                                    <h3>{t('reservation.selectCar.filters')}</h3>
                                    <button
                                        className="reset-filters-btn"
                                        onClick={resetFilters}
                                        disabled={!filters.manufacturer && !filters.model && !filters.category &&
                                            filters.features.length === 0 && !filters.year && !filters.transmission}
                                    >
                                        {t('common.reset')}
                                    </button>
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="manufacturer">{t('car.fields.manufacturer')}</label>
                                    <select
                                        id="manufacturer"
                                        name="manufacturer"
                                        value={filters.manufacturer}
                                        onChange={handleFilterChange}
                                        className="filter-select"
                                    >
                                        <option value="">{t('common.all')}</option>
                                        {filterOptions.manufacturers.map(manufacturer => (
                                            <option key={manufacturer} value={manufacturer}>
                                                {manufacturer}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="model">{t('car.fields.model')}</label>
                                    <select
                                        id="model"
                                        name="model"
                                        value={filters.model}
                                        onChange={handleFilterChange}
                                        className="filter-select"
                                        disabled={!filters.manufacturer}
                                    >
                                        <option value="">{t('common.all')}</option>
                                        {filterOptions.models
                                            .filter(model => !filters.manufacturer ||
                                                availableCars.some(car =>
                                                    car.car_Model?.name === model &&
                                                    car.car_Model?.car_Manufacturer?.name === filters.manufacturer
                                                )
                                            )
                                            .map(model => (
                                                <option key={model} value={model}>
                                                    {model}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="category">{t('car.fields.category')}</label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                        className="filter-select"
                                    >
                                        <option value="">{t('common.all')}</option>
                                        {filterOptions.categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="year">{t('car.fields.year')}</label>
                                    <select
                                        id="year"
                                        name="year"
                                        value={filters.year}
                                        onChange={handleFilterChange}
                                        className="filter-select"
                                    >
                                        <option value="">{t('common.all')}</option>
                                        {filterOptions.years.map(year => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="transmission">{t('car.fields.transmission')}</label>
                                    <select
                                        id="transmission"
                                        name="transmission"
                                        value={filters.transmission}
                                        onChange={handleFilterChange}
                                        className="filter-select"
                                    >
                                        <option value="">{t('common.all')}</option>
                                        {filterOptions.transmissions.map(transmission => (
                                            <option key={transmission} value={transmission}>
                                                {transmission}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group price-range">
                                    <label>{t('car.fields.priceRange')}</label>
                                    <div className="price-inputs">
                                        <input
                                            type="number"
                                            name="minPrice"
                                            value={filters.priceRange[0]}
                                            onChange={handlePriceRangeChange}
                                            className="price-input"
                                            min="0"
                                            placeholder="Min"
                                        />
                                        <span className="price-separator">-</span>
                                        <input
                                            type="number"
                                            name="maxPrice"
                                            value={filters.priceRange[1]}
                                            onChange={handlePriceRangeChange}
                                            className="price-input"
                                            min="0"
                                            placeholder="Max"
                                        />
                                    </div>
                                </div>

                                {filterOptions.features.length > 0 && (
                                    <div className="filter-group features-filter">
                                        <label>{t('car.fields.features')}</label>
                                        <div className="features-list">
                                            {filterOptions.features.map(feature => (
                                                <div
                                                    key={feature}
                                                    className={`feature-toggle ${filters.features.includes(feature) ? 'active' : ''}`}
                                                    onClick={() => handleFeatureToggle(feature)}
                                                >
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cars List Section */}
                            <div className="cars-section">
                                <div className="cars-header">
                                    <h3>{t('reservation.selectCar.availableCars')}</h3>
                                    <span className="cars-count">
                                        {sortedCars.length} {t('reservation.selectCar.carsFound')}
                                    </span>
                                </div>

                                {sortedCars.length === 0 ? (
                                    <div className="no-cars-message">
                                        <p>{t('reservation.selectCar.noCarsFound')}</p>
                                        <button className="btn-reset-filters" onClick={resetFilters}>
                                            {t('reservation.selectCar.resetFilters')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="cars-grid">
                                        {sortedCars.map(car => (
                                            <div
                                                key={car.id}
                                                className={`car-card ${selectedCarId === car.id ? 'selected' : ''} ${car.id === currentCarId ? 'current' : ''}`}
                                                onClick={() => handleCarSelect(car.id)}
                                            >
                                                <div className="car-card-header">
                                                    <h4>
                                                        {car.car_Model?.car_Manufacturer?.name} {car.car_Model?.name}
                                                    </h4>
                                                    <span className="car-year">{car.year}</span>
                                                </div>

                                                <div className="car-card-content">
                                                    <div className="car-price">
                                                        <span className="price-value">
                                                            {car.dailyRate?.toLocaleString() || '-'} MAD
                                                        </span>
                                                        <span className="price-label">
                                                            {t('car.fields.dailyRate')}
                                                        </span>
                                                    </div>

                                                    <div className="car-details">
                                                        <div className="car-detail">
                                                            <span className="detail-label">{t('car.fields.licensePlate')}:</span>
                                                            <span className="detail-value">{car.licensePlate}</span>
                                                        </div>
                                                        <div className="car-detail">
                                                            <span className="detail-label">{t('car.fields.transmission')}:</span>
                                                            <span className="detail-value">{car.transmission}</span>
                                                        </div>
                                                        {car.fuelType && (
                                                            <div className="car-detail">
                                                                <span className="detail-label">{t('car.fields.fuelType')}:</span>
                                                                <span className="detail-value">{car.fuelType}</span>
                                                            </div>
                                                        )}
                                                        {car.category && (
                                                            <div className="car-detail">
                                                                <span className="detail-label">{t('car.fields.category')}:</span>
                                                                <span className="detail-value">{car.category}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {car.features && (
                                                        <div className="car-features">
                                                            {car.features.split(',').map(feature => (
                                                                <span key={feature.trim()} className="feature-tag">
                                                                    {feature.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {car.id === currentCarId && (
                                                    <div className="current-indicator">
                                                        {t('reservation.selectCar.currentCar')}
                                                    </div>
                                                )}

                                                {selectedCarId === car.id && (
                                                    <div className="selected-indicator">
                                                        <span className="checkmark">✓</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="select-car-actions">
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                className="btn-submit"
                                onClick={handleSubmit}
                                disabled={!selectedCarId || selectedCarId === currentCarId}
                            >
                                {t('reservation.selectCar.submit')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SelectCarModal;