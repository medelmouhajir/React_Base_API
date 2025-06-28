// src/pages/Reservation/Details/Modals/SelectCarModal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import reservationService from '../../../../services/reservationService';
import './ModalStyles.css';

const SelectCarModal = ({ currentCarId, startDate, endDate, onClose, onSelect }) => {
    const { t } = useTranslation();

    const [availableCars, setAvailableCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCarId, setSelectedCarId] = useState(currentCarId);
    const [filters, setFilters] = useState({
        manufacturer: '',
        model: '',
        category: '',
        features: []
    });

    // Fetch available cars
    useEffect(() => {
        const fetchCars = async () => {
            try {
                setLoading(true);
                const cars = await reservationService.getAvailableCars(startDate, endDate, currentCarId);
                setAvailableCars(cars);
            } catch (err) {
                console.error('Error fetching available cars:', err);
                setError(t('reservation.selectCar.errorLoading'));
            } finally {
                setLoading(false);
            }
        };

        fetchCars();
    }, [startDate, endDate, currentCarId, t]);

    // Generate unique filter options from available cars
    const getFilterOptions = () => {
        const manufacturers = [...new Set(availableCars.map(car => car.car_Model?.car_Manufacturer?.name).filter(Boolean))];
        const models = [...new Set(availableCars.map(car => car.car_Model?.name).filter(Boolean))];
        const categories = [...new Set(availableCars.map(car => car.category).filter(Boolean))];

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
            features: [...allFeatures]
        };
    };

    const filterOptions = getFilterOptions();

    // Apply filters to cars
    const filteredCars = availableCars.filter(car => {
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

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    const handleFeatureToggle = (feature) => {
        const newFeatures = [...filters.features];
        if (newFeatures.includes(feature)) {
            // Remove feature
            const index = newFeatures.indexOf(feature);
            newFeatures.splice(index, 1);
        } else {
            // Add feature
            newFeatures.push(feature);
        }

        setFilters({
            ...filters,
            features: newFeatures
        });
    };

    const handleCarSelect = (carId) => {
        setSelectedCarId(carId);
    };

    const handleSubmit = () => {
        if (selectedCarId) {
            onSelect(selectedCarId);
        }
    };

    return (
        <Modal title={t('reservation.selectCar.title')} onClose={onClose} size="large">
            {loading ? (
                <div className="loading-spinner">{t('common.loading')}</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="car-selection-container">
                    {/* Filters Section */}
                    <div className="car-filters">
                        <h3>{t('reservation.selectCar.filters')}</h3>

                        <div className="filter-group">
                            <label htmlFor="manufacturer">{t('car.fields.manufacturer')}</label>
                            <select
                                id="manufacturer"
                                name="manufacturer"
                                value={filters.manufacturer}
                                onChange={handleFilterChange}
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
                            >
                                <option value="">{t('common.all')}</option>
                                {filterOptions.models.map(model => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="category">{t('car.fields.category')}</label>
                            <select
                                id="category"
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">{t('common.all')}</option>
                                {filterOptions.categories.map(category => (
                                    <option key={category} value={category}>
                                        {t(`car.categories.${category.toLowerCase()}`, category)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {filterOptions.features.length > 0 && (
                            <div className="filter-group features">
                                <label>{t('car.fields.features')}</label>
                                <div className="feature-toggles">
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

                    {/* Cars List */}
                    <div className="car-list">
                        <h3>
                            {t('reservation.selectCar.availableCars')}
                            <span className="cars-count">({filteredCars.length})</span>
                        </h3>

                        {filteredCars.length === 0 ? (
                            <div className="no-cars-message">
                                {t('reservation.selectCar.noCarsAvailable')}
                            </div>
                        ) : (
                            <div className="cars-grid">
                                {filteredCars.map(car => (
                                    <div
                                        key={car.id}
                                        className={`car-card ${selectedCarId === car.id ? 'selected' : ''}`}
                                        onClick={() => handleCarSelect(car.id)}
                                    >
                                        <div className="car-card-header">
                                            <h4>
                                                {car.car_Model?.car_Manufacturer?.name} {car.car_Model?.name}
                                            </h4>
                                            <span className="car-year">{car.year}</span>
                                        </div>

                                        <div className="car-details">
                                            <div className="car-detail">
                                                <span className="detail-label">{t('car.fields.licensePlate')}:</span>
                                                <span className="detail-value">{car.licensePlate}</span>
                                            </div>
                                            <div className="car-detail">
                                                <span className="detail-label">{t('car.fields.color')}:</span>
                                                <span className="detail-value">{car.color}</span>
                                            </div>
                                            <div className="car-detail">
                                                <span className="detail-label">{t('car.fields.pricePerDay')}:</span>
                                                <span className="detail-value price">{car.pricePerDay} MAD</span>
                                            </div>
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

                                        {selectedCarId === car.id && (
                                            <div className="selected-indicator">
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="modal-actions">
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

            <style jsx>{`
        .car-selection-container {
          display: flex;
          gap: 1.5rem;
          max-height: 70vh;
          overflow: hidden;
        }
        
        .car-filters {
          width: 30%;
          padding-right: 1rem;
          border-right: 1px solid var(--border-color, #eee);
          overflow-y: auto;
        }
        
        .car-list {
          width: 70%;
          overflow-y: auto;
        }
        
        .filter-group {
          margin-bottom: 1rem;
        }
        
        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .feature-toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .feature-toggle {
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          background-color: var(--neutral-light, #f5f5f5);
          font-size: 0.75rem;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s;
        }
        
        .feature-toggle.active {
          background-color: var(--primary, #1976d2);
          color: white;
        }
        
        .cars-count {
          font-size: 0.875rem;
          font-weight: 400;
          color: var(--text-secondary, #666);
          margin-left: 0.5rem;
        }
        
        .no-cars-message {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary, #666);
          font-style: italic;
        }
        
        .cars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        
        .car-card {
          border: 1px solid var(--border-color, #eee);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        
        .car-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }
        
        .car-card.selected {
          border-color: var(--primary, #1976d2);
          background-color: var(--primary-light, #e3f2fd);
        }
        
        .car-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .car-card h4 {
          font-size: 1rem;
          margin: 0;
        }
        
        .car-year {
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
        }
        
        .car-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .car-detail {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }
        
        .detail-label {
          color: var(--text-secondary, #666);
        }
        
        .detail-value {
          font-weight: 500;
        }
        
        .detail-value.price {
          color: var(--success, #43a047);
        }
        
        .car-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.75rem;
        }
        
        .feature-tag {
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          background-color: var(--neutral-light, #f5f5f5);
          font-size: 0.7rem;
        }
        
        .selected-indicator {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: var(--primary, #1976d2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
          .car-selection-container {
            flex-direction: column;
            max-height: none;
            overflow: visible;
          }
          
          .car-filters, .car-list {
            width: 100%;
            overflow-y: visible;
          }
          
          .car-filters {
            border-right: none;
            border-bottom: 1px solid var(--border-color, #eee);
            padding-right: 0;
            padding-bottom: 1rem;
            margin-bottom: 1rem;
          }
          
          .cars-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </Modal>
    );
};

export default SelectCarModal;