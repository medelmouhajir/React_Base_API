import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import maintenanceService from '../../../services/maintenanceService';
import carService from '../../../services/carService';
import carFiltersService from '../../../services/carFiltersService';
import './AddMaintenance.css';

const AddMaintenance = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;
    const datePickerRef = useRef(null);

    // Form data state
    const [formData, setFormData] = useState({
        CarId: '',
        ScheduledDate: new Date().toISOString().split('T')[0],
        Description: '',
        Cost: '',
        IsCompleted: false,
        CompletedDate: '',
        Remarks: ''
    });

    // Filter states for advanced car selection
    const [cars, setCars] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [models, setModels] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({
        manufacturerId: '',
        modelId: ''
    });

    // UI states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [touched, setTouched] = useState({});

    // Handle resize for responsive layout
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch cars and filter data
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!agencyId) return;

                // Fetch cars and filters in parallel
                const [carsData, manufacturersData, modelsData] = await Promise.all([
                    carService.getByAgencyId(agencyId),
                    carFiltersService.getManufacturers(),
                    carFiltersService.getCarModels()
                ]);

                setCars(carsData);
                setFilteredCars(carsData);
                setManufacturers(manufacturersData);
                setModels(modelsData);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError(t('maintenance.add.fetchError') || 'Error loading data');
            }
        };

        fetchData();
    }, [agencyId, t]);

    // Filter cars based on selected criteria
    useEffect(() => {
        let filtered = [...cars];

        // Apply manufacturer filter
        if (selectedFilters.manufacturerId) {
            // Get all models for the selected manufacturer
            const manufacturerModels = models.filter(
                model => model.manufacturerId === selectedFilters.manufacturerId
            ).map(model => model.id);

            // Filter cars by those models
            filtered = filtered.filter(car => {
                const carModel = car.car_Model || {};
                return manufacturerModels.includes(carModel.id);
            });
        }

        // Apply model filter
        if (selectedFilters.modelId) {
            filtered = filtered.filter(car => {
                const carModel = car.car_Model || {};
                return carModel.id === selectedFilters.modelId;
            });
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(car => {
                const licensePlate = car.licensePlate?.toLowerCase() || '';
                const manufacturer = car.car_Model?.manufacturer?.name?.toLowerCase() || '';
                const model = car.car_Model?.name?.toLowerCase() || '';
                return licensePlate.includes(query) ||
                    manufacturer.includes(query) ||
                    model.includes(query);
            });
        }

        setFilteredCars(filtered);
    }, [cars, selectedFilters, searchQuery, models]);

    // Reset model filter when manufacturer changes
    useEffect(() => {
        if (selectedFilters.manufacturerId && selectedFilters.modelId) {
            // Check if selected model belongs to selected manufacturer
            const modelBelongsToManufacturer = models.some(
                model => model.id === selectedFilters.modelId && model.manufacturerId === selectedFilters.manufacturerId
            );

            if (!modelBelongsToManufacturer) {
                setSelectedFilters(prev => ({
                    ...prev,
                    modelId: ''
                }));
            }
        }
    }, [selectedFilters.manufacturerId, selectedFilters.modelId, models]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Mark field as touched
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setSelectedFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    };

    const isFieldInvalid = (fieldName) => {
        if (!touched[fieldName]) return false;

        const requiredFields = ['CarId', 'ScheduledDate', 'Description'];
        if (requiredFields.includes(fieldName) && !formData[fieldName]) {
            return true;
        }

        if (fieldName === 'Cost' && formData.Cost && isNaN(parseFloat(formData.Cost))) {
            return true;
        }

        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched for validation
        const allFields = Object.keys(formData).reduce((acc, field) => {
            acc[field] = true;
            return acc;
        }, {});
        setTouched(allFields);

        // Validate required fields
        const requiredFields = ['CarId', 'ScheduledDate', 'Description'];
        const missingRequired = requiredFields.filter(field => !formData[field]);

        if (missingRequired.length > 0) {
            setError(t('maintenance.add.requiredFields'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                CarId: formData.CarId,
                ScheduledDate: formData.ScheduledDate,
                Description: formData.Description.trim(),
                Cost: formData.Cost ? parseFloat(formData.Cost) : null,
                IsCompleted: formData.IsCompleted,
                CompletedDate: formData.IsCompleted && formData.CompletedDate
                    ? formData.CompletedDate
                    : null,
                Remarks: formData.Remarks ? formData.Remarks.trim() : ''
            };

            await maintenanceService.create(payload);
            navigate('/maintenances');
        } catch (err) {
            console.error('❌ Error adding maintenance record:', err);
            setError(t('maintenance.add.error') || 'Error creating maintenance record.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/maintenances');
    };

    const focusDatePicker = () => {
        if (datePickerRef.current) {
            datePickerRef.current.focus();
        }
    };

    // Generate filtered model options based on selected manufacturer
    const filteredModels = selectedFilters.manufacturerId
        ? models.filter(model => model.manufacturerId === selectedFilters.manufacturerId)
        : models;

    return (
        <div className={`addMaintenance-container ${isDarkMode ? 'dark' : 'light'}`}>
            <h1 className="addMaintenance-title">{t('maintenance.add.title')}</h1>

            {error && (
                <div className="addMaintenance-error" role="alert">
                    {error}
                </div>
            )}

            <form className="addMaintenance-form" onSubmit={handleSubmit} noValidate>
                {/* Car Selection Section */}
                <div className="form-section">
                    <h2 className="section-title">{t('maintenance.add.selectCar')}</h2>

                    {/* Car Search and Filters */}
                    <div className="car-selection-controls">
                        <div className="search-filter-container">
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder={t('maintenance.add.searchCar')}
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="search-input"
                                    aria-label={t('maintenance.add.searchCar')}
                                />
                                <span className="search-icon">🔍</span>
                            </div>

                            <div className="filters-container">
                                <select
                                    name="manufacturerId"
                                    value={selectedFilters.manufacturerId}
                                    onChange={handleFilterChange}
                                    className="filter-select"
                                    aria-label={t('car.fields.manufacturer')}
                                >
                                    <option value="">{t('car.placeholders.selectManufacturer')}</option>
                                    {manufacturers.map(manufacturer => (
                                        <option key={manufacturer.id} value={manufacturer.id}>
                                            {manufacturer.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    name="modelId"
                                    value={selectedFilters.modelId}
                                    onChange={handleFilterChange}
                                    className="filter-select"
                                    disabled={!selectedFilters.manufacturerId}
                                    aria-label={t('car.fields.model')}
                                >
                                    <option value="">{t('car.placeholders.selectModel')}</option>
                                    {filteredModels.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Car Grid Selection */}
                    <div className={`car-grid ${isFieldInvalid('CarId') ? 'has-error' : ''}`}>
                        {filteredCars.length > 0 ? (
                            filteredCars.map(car => (
                                <div
                                    key={car.id}
                                    className={`car-card ${formData.CarId === car.id ? 'selected' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, CarId: car.id }))}
                                    tabIndex="0"
                                    role="radio"
                                    aria-checked={formData.CarId === car.id}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setFormData(prev => ({ ...prev, CarId: car.id }));
                                        }
                                    }}
                                >
                                    <div className="car-card-header">
                                        <span className="car-license-plate">{car.licensePlate}</span>
                                        <span className={`car-status ${car.status.toLowerCase()}`}>
                                            {car.status}
                                        </span>
                                    </div>
                                    <div className="car-card-body">
                                        <div className="car-info">
                                            <span className="car-model">
                                                {car.car_Model?.manufacturer?.name} {car.car_Model?.name}
                                            </span>
                                            <span className="car-year">{car.car_Year?.yearValue}</span>
                                        </div>
                                        <div className="car-color">
                                            <span
                                                className="color-dot"
                                                style={{ backgroundColor: car.color }}
                                                aria-label={`Color: ${car.color}`}
                                            ></span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-cars-found">
                                {t('maintenance.add.noCarsFound')}
                            </div>
                        )}
                    </div>
                    {isFieldInvalid('CarId') && (
                        <div className="error-message">{t('maintenance.validation.carRequired')}</div>
                    )}
                </div>

                {/* Maintenance Details Section */}
                <div className="form-section">
                    <h2 className="section-title">{t('maintenance.add.detailsTitle')}</h2>

                    <div className="form-row">
                        {/* Scheduled Date */}
                        <div className={`form-group ${isFieldInvalid('ScheduledDate') ? 'has-error' : ''}`}>
                            <label htmlFor="ScheduledDate">{t('maintenance.fields.scheduledDate')}</label>
                            <div className="date-input-container">
                                <input
                                    type="date"
                                    id="ScheduledDate"
                                    name="ScheduledDate"
                                    value={formData.ScheduledDate}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    ref={datePickerRef}
                                />
                                <button
                                    type="button"
                                    className="calendar-icon"
                                    onClick={focusDatePicker}
                                    aria-label={t('common.openCalendar')}
                                >
                                    📅
                                </button>
                            </div>
                            {isFieldInvalid('ScheduledDate') && (
                                <div className="error-message">{t('maintenance.validation.scheduledDateRequired')}</div>
                            )}
                        </div>

                        {/* Cost */}
                        <div className={`form-group ${isFieldInvalid('Cost') ? 'has-error' : ''}`}>
                            <label htmlFor="Cost">{t('maintenance.fields.cost')}</label>
                            <div className="currency-input-container">
                                <span className="currency-symbol">$</span>
                                <input
                                    type="number"
                                    id="Cost"
                                    name="Cost"
                                    value={formData.Cost}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    step="0.01"
                                    min="0"
                                    placeholder={t('maintenance.placeholders.cost')}
                                />
                            </div>
                            {isFieldInvalid('Cost') && (
                                <div className="error-message">{t('maintenance.validation.costInvalid')}</div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className={`form-group ${isFieldInvalid('Description') ? 'has-error' : ''}`}>
                        <label htmlFor="Description">{t('maintenance.fields.description')}</label>
                        <textarea
                            id="Description"
                            name="Description"
                            value={formData.Description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            rows={3}
                            required
                            placeholder={t('maintenance.placeholders.description')}
                        ></textarea>
                        {isFieldInvalid('Description') && (
                            <div className="error-message">{t('maintenance.validation.descriptionRequired')}</div>
                        )}
                    </div>

                    {/* Completion Status */}
                    <div className="form-group checkbox-group">
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                id="IsCompleted"
                                name="IsCompleted"
                                checked={formData.IsCompleted}
                                onChange={handleChange}
                            />
                            <label htmlFor="IsCompleted" className="checkbox-label">
                                {t('maintenance.fields.isCompleted')}
                            </label>
                        </div>
                    </div>

                    {/* Completed Date - Only shown if IsCompleted is checked */}
                    {formData.IsCompleted && (
                        <div className={`form-group ${isFieldInvalid('CompletedDate') ? 'has-error' : ''}`}>
                            <label htmlFor="CompletedDate">{t('maintenance.fields.completedDate')}</label>
                            <input
                                type="date"
                                id="CompletedDate"
                                name="CompletedDate"
                                value={formData.CompletedDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {isFieldInvalid('CompletedDate') && (
                                <div className="error-message">{t('maintenance.validation.completedDateRequired')}</div>
                            )}
                        </div>
                    )}

                    {/* Remarks */}
                    <div className="form-group">
                        <label htmlFor="Remarks">{t('maintenance.fields.remarks')}</label>
                        <textarea
                            id="Remarks"
                            name="Remarks"
                            value={formData.Remarks}
                            onChange={handleChange}
                            rows={2}
                            placeholder={t('maintenance.placeholders.remarks')}
                        ></textarea>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMaintenance;