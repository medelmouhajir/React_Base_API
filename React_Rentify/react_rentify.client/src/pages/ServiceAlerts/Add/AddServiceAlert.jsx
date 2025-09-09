// src/pages/ServiceAlerts/Add/AddServiceAlert.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import serviceAlertService from '../../../services/serviceAlertService';
import carService from '../../../services/carService';
import { useRtlDirection } from '../../../hooks/useRtlDirection';
import './AddServiceAlert.css';

const AddServiceAlert = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Use RTL direction hook
    useRtlDirection();

    // Get car ID from location state if navigated from car details
    const preSelectedCarId = location.state?.carId;

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Form state
    const [formData, setFormData] = useState({
        carId: preSelectedCarId || '',
        alertType: 1, // Default to OilChange
        dueDate: '',
        dueMileage: '',
        notes: ''
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [cars, setCars] = useState([]);
    const [errors, setErrors] = useState({});
    const [carsLoading, setCarsLoading] = useState(true);

    // Alert types mapping
    const alertTypes = [
        { value: 1, key: 'oilChange' },
        { value: 2, key: 'brakeInspection' },
        { value: 3, key: 'tireRotation' },
        { value: 4, key: 'fluidCheck' },
        { value: 5, key: 'drain' },
        { value: 10, key: 'other' }
    ];

    // Load cars on component mount
    useEffect(() => {
        loadCars();
    }, []);

    const loadCars = async () => {
        try {
            setCarsLoading(true);
            const data = user?.agencyId
                ? await carService.getByAgencyId(user.agencyId)
                : await carService.getAll();
            setCars(data || []);
        } catch (error) {
            console.error('Error loading cars:', error);
            setErrors({ general: t('alerts.add.errors.loadCars') });
        } finally {
            setCarsLoading(false);
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.carId) {
            newErrors.carId = t('alerts.add.validation.carRequired');
        }

        if (!formData.dueDate) {
            newErrors.dueDate = t('alerts.add.validation.dueDateRequired');
        } else {
            const selectedDate = new Date(formData.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.dueDate = t('alerts.add.validation.dueDateFuture');
            }
        }

        if (formData.dueMileage && (isNaN(formData.dueMileage) || parseInt(formData.dueMileage) < 0)) {
            newErrors.dueMileage = t('alerts.add.validation.dueMileageValid');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setErrors({});

            const submitData = {
                carId: formData.carId,
                alertType: parseInt(formData.alertType),
                dueDate: new Date(formData.dueDate).toISOString(),
                dueMileage: formData.dueMileage ? parseInt(formData.dueMileage) : null,
                notes: formData.notes.trim() || null
            };

            await serviceAlertService.create(submitData);

            // Show success message and navigate back
            navigate('/service-alerts', {
                state: {
                    message: t('alerts.add.success'),
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error creating service alert:', error);
            setErrors({
                general: error.response?.data?.message || t('alerts.add.errors.createFailed')
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        navigate('/service-alerts');
    };

    // Get selected car info
    const selectedCar = cars.find(car => car.id === formData.carId);

    return (
        <div className={`addServiceAlert-container ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header */}
            <div className="addServiceAlert-header">
                <div className="header-content">
                    <div className="header-nav">
                        <button
                            onClick={handleCancel}
                            className="back-button"
                            aria-label={t('common.back')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="header-info">
                            <h1 className="header-title">
                                {t('alerts.add.title')}
                            </h1>
                            <p className="header-subtitle">
                                {t('alerts.add.subtitle')}
                            </p>
                        </div>
                    </div>

                    {!isMobile && (
                        <div className="header-actions">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="cancel-button"
                                disabled={loading}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                form="addServiceAlertForm"
                                className="submit-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner" />
                                        {t('common.creating')}
                                    </>
                                ) : (
                                    t('alerts.add.create')
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Error message */}
            {errors.general && (
                <div className="addServiceAlert-error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {errors.general}
                </div>
            )}

            {/* Form */}
            <div className="addServiceAlert-form-container">
                <form id="addServiceAlertForm" onSubmit={handleSubmit} className="addServiceAlert-form">
                    {/* Car Selection */}
                    <div className="form-group">
                        <label htmlFor="carId" className="form-label">
                            {t('alerts.add.form.car')} <span className="required">*</span>
                        </label>
                        <div className="form-input-wrapper">
                            <select
                                id="carId"
                                name="carId"
                                value={formData.carId}
                                onChange={handleInputChange}
                                className={`form-select ${errors.carId ? 'error' : ''}`}
                                disabled={carsLoading}
                                required
                            >
                                <option value="">
                                    {carsLoading ? t('common.loading') : t('alerts.add.form.selectCar')}
                                </option>
                                {cars.map(car => (
                                    <option key={car.id} value={car.id}>
                                        {car.licensePlate} - {car.fields?.manufacturer} {car.fields?.model} ({car.fields?.year})
                                    </option>
                                ))}
                            </select>
                            <div className="select-arrow">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                        {errors.carId && <span className="form-error">{errors.carId}</span>}

                        {/* Car info display */}
                        {selectedCar && (
                            <div className="car-info-display">
                                <div className="car-info-item">
                                    <span className="car-info-label">{t('car.fields.licensePlate')}:</span>
                                    <span className="car-info-value">{selectedCar.licensePlate}</span>
                                </div>
                                <div className="car-info-item">
                                    <span className="car-info-label">{t('car.fields.manufacturer')}:</span>
                                    <span className="car-info-value">{selectedCar.fields?.manufacturer}</span>
                                </div>
                                <div className="car-info-item">
                                    <span className="car-info-label">{t('car.fields.model')}:</span>
                                    <span className="car-info-value">{selectedCar.fields?.model}</span>
                                </div>
                                <div className="car-info-item">
                                    <span className="car-info-label">{t('car.fields.year')}:</span>
                                    <span className="car-info-value">{selectedCar.fields?.year}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Alert Type */}
                    <div className="form-group">
                        <label htmlFor="alertType" className="form-label">
                            {t('alerts.add.form.alertType')} <span className="required">*</span>
                        </label>
                        <div className="form-input-wrapper">
                            <select
                                id="alertType"
                                name="alertType"
                                value={formData.alertType}
                                onChange={handleInputChange}
                                className="form-select"
                                required
                            >
                                {alertTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {t(`alerts.types.${type.key}`)}
                                    </option>
                                ))}
                            </select>
                            <div className="select-arrow">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="form-group">
                        <label htmlFor="dueDate" className="form-label">
                            {t('alerts.add.form.dueDate')} <span className="required">*</span>
                        </label>
                        <div className="form-input-wrapper">
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleInputChange}
                                className={`form-input ${errors.dueDate ? 'error' : ''}`}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                            <div className="input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                        </div>
                        {errors.dueDate && <span className="form-error">{errors.dueDate}</span>}
                    </div>

                    {/* Due Mileage (Optional) */}
                    <div className="form-group">
                        <label htmlFor="dueMileage" className="form-label">
                            {t('alerts.add.form.dueMileage')}
                            <span className="optional">({t('common.optional')})</span>
                        </label>
                        <div className="form-input-wrapper">
                            <input
                                type="number"
                                id="dueMileage"
                                name="dueMileage"
                                value={formData.dueMileage}
                                onChange={handleInputChange}
                                className={`form-input ${errors.dueMileage ? 'error' : ''}`}
                                placeholder={t('alerts.add.form.dueMileagePlaceholder')}
                                min="0"
                                step="1"
                            />
                            <div className="input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                            </div>
                        </div>
                        {errors.dueMileage && <span className="form-error">{errors.dueMileage}</span>}
                        <p className="form-help">{t('alerts.add.form.dueMileageHelp')}</p>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label htmlFor="notes" className="form-label">
                            {t('alerts.add.form.notes')}
                            <span className="optional">({t('common.optional')})</span>
                        </label>
                        <div className="form-input-wrapper">
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="form-textarea"
                                placeholder={t('alerts.add.form.notesPlaceholder')}
                                rows="4"
                                maxLength="500"
                            />
                        </div>
                        <div className="form-help-row">
                            <p className="form-help">{t('alerts.add.form.notesHelp')}</p>
                            <span className="char-count">
                                {formData.notes.length}/500
                            </span>
                        </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    {isMobile && (
                        <div className="mobile-actions">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="mobile-cancel-button"
                                disabled={loading}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="mobile-submit-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner" />
                                        {t('common.creating')}
                                    </>
                                ) : (
                                    t('alerts.add.create')
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AddServiceAlert;