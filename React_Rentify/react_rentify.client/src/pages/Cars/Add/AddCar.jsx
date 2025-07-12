// src/pages/Cars/Add/AddCar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import carFiltersService from '../../../services/carFiltersService';
import './AddCar.css';

const AddCar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        ManufacturerId: '',
        Car_ModelId: '',
        Car_YearId: '',
        LicensePlate: '',
        Color: '',
        IsAvailable: true,
        Status: '',
        DailyRate: '',
        HourlyRate: '',
        DeviceSerialNumber: '',
        IsTrackingActive: true,
        AgencyId: agencyId || '',
    });

    // States for UI
    const [manufacturers, setManufacturers] = useState([]);
    const [models, setModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [years, setYears] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState({});

    useEffect(() => {
        // Load car manufacturers, models and years
        const fetchFilters = async () => {
            try {
                const [manufacturersData, modelsData, yearsData] = await Promise.all([
                    carFiltersService.getManufacturers(),
                    carFiltersService.getCarModels(),
                    carFiltersService.getCarYears(),
                ]);
                setManufacturers(manufacturersData);
                setModels(modelsData);
                setYears(yearsData);
            } catch (err) {
                console.error('❌ Error fetching filters:', err);
                setError(t('car.add.filterError'));
            }
        };
        fetchFilters();
    }, [t]);

    // Filter models when manufacturer changes
    useEffect(() => {
        if (formData.ManufacturerId) {
            const filtered = models.filter(
                model => model.manufacturerId === formData.ManufacturerId
            );
            setFilteredModels(filtered);

            // Reset model selection if current selection doesn't belong to the selected manufacturer
            const currentModelBelongsToManufacturer = filtered.some(
                model => model.id === formData.Car_ModelId
            );

            if (!currentModelBelongsToManufacturer) {
                setFormData(prev => ({
                    ...prev,
                    Car_ModelId: '',
                }));
            }
        } else {
            setFilteredModels([]);
        }
    }, [formData.ManufacturerId, models]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Mark field as touched
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
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
        const requiredFields = ['ManufacturerId', 'Car_ModelId', 'Car_YearId', 'LicensePlate', 'DailyRate'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            setError(t('car.add.requiredFields'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                AgencyId: agencyId,
                DailyRate: parseFloat(formData.DailyRate),
                HourlyRate: formData.HourlyRate ? parseFloat(formData.HourlyRate) : null,
                Car_YearId: parseInt(formData.Car_YearId, 10),
            };
            await carService.create(payload);
            navigate('/cars');
        } catch (err) {
            console.error('❌ Error adding car:', err);
            setError(t('car.add.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/cars');
    };

    // Helper to check if a field is invalid
    const isFieldInvalid = (fieldName) => {
        if (!touched[fieldName]) return false;

        const requiredFields = ['ManufacturerId', 'Car_ModelId', 'Car_YearId', 'LicensePlate', 'DailyRate'];
        if (requiredFields.includes(fieldName) && !formData[fieldName]) {
            return true;
        }

        return false;
    };

    return (
        <div className={`addcar-container ${isDarkMode ? 'dark' : 'light'}`}>
            <h1 className="addcar-title">{t('car.list.addCar')}</h1>

            {error && <div className="addcar-error" role="alert">{error}</div>}

            <form className="addcar-form" onSubmit={handleSubmit} noValidate>
                {/* Manufacturer Select */}
                <div className={`form-group ${isFieldInvalid('ManufacturerId') ? 'form-group-error' : ''}`}>
                    <label htmlFor="ManufacturerId">{t('car.fields.manufacturer')}</label>
                    <select
                        id="ManufacturerId"
                        name="ManufacturerId"
                        value={formData.ManufacturerId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={isFieldInvalid('ManufacturerId') ? 'input-error' : ''}
                    >
                        <option value="">{t('car.placeholders.selectManufacturer')}</option>
                        {manufacturers.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                    {isFieldInvalid('ManufacturerId') && (
                        <div className="error-message">{t('car.validation.manufacturerRequired')}</div>
                    )}
                </div>

                {/* Model Select (dependent on manufacturer) */}
                <div className={`form-group ${isFieldInvalid('Car_ModelId') ? 'form-group-error' : ''}`}>
                    <label htmlFor="Car_ModelId">{t('car.fields.model')}</label>
                    <select
                        id="Car_ModelId"
                        name="Car_ModelId"
                        value={formData.Car_ModelId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        disabled={!formData.ManufacturerId}
                        className={isFieldInvalid('Car_ModelId') ? 'input-error' : ''}
                    >
                        <option value="">{t('car.placeholders.selectModel')}</option>
                        {filteredModels.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                    {isFieldInvalid('Car_ModelId') && (
                        <div className="error-message">{t('car.validation.modelRequired')}</div>
                    )}
                </div>

                {/* Year Select */}
                <div className={`form-group ${isFieldInvalid('Car_YearId') ? 'form-group-error' : ''}`}>
                    <label htmlFor="Car_YearId">{t('car.fields.year')}</label>
                    <select
                        id="Car_YearId"
                        name="Car_YearId"
                        value={formData.Car_YearId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={isFieldInvalid('Car_YearId') ? 'input-error' : ''}
                    >
                        <option value="">{t('car.placeholders.selectYear')}</option>
                        {years.map((y) => (
                            <option key={y.id} value={y.id}>
                                {y.yearValue}
                            </option>
                        ))}
                    </select>
                    {isFieldInvalid('Car_YearId') && (
                        <div className="error-message">{t('car.validation.yearRequired')}</div>
                    )}
                </div>

                {/* License Plate */}
                <div className={`form-group ${isFieldInvalid('LicensePlate') ? 'form-group-error' : ''}`}>
                    <label htmlFor="LicensePlate">{t('car.fields.licensePlate')}</label>
                    <input
                        type="text"
                        id="LicensePlate"
                        name="LicensePlate"
                        placeholder={t('car.placeholders.licensePlate')}
                        value={formData.LicensePlate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={isFieldInvalid('LicensePlate') ? 'input-error' : ''}
                    />
                    {isFieldInvalid('LicensePlate') && (
                        <div className="error-message">{t('car.validation.licensePlateRequired')}</div>
                    )}
                </div>

                {/* Color */}
                <div className="form-group">
                    <label htmlFor="Color">{t('car.fields.color')}</label>
                    <input
                        type="text"
                        id="Color"
                        name="Color"
                        placeholder={t('car.placeholders.color')}
                        value={formData.Color}
                        onChange={handleChange}
                    />
                </div>

                {/* Status */}
                <div className="form-group">
                    <label htmlFor="Status">{t('car.fields.status')}</label>
                    <input
                        type="text"
                        id="Status"
                        name="Status"
                        placeholder={t('car.placeholders.status')}
                        value={formData.Status}
                        onChange={handleChange}
                    />
                </div>

                {/* Daily Rate */}
                <div className={`form-group ${isFieldInvalid('DailyRate') ? 'form-group-error' : ''}`}>
                    <label htmlFor="DailyRate">{t('car.fields.dailyRate')}</label>
                    <div className="input-group">
                        <span className="input-prefix">$</span>
                        <input
                            type="number"
                            id="DailyRate"
                            name="DailyRate"
                            step="0.01"
                            min="0"
                            placeholder={t('car.placeholders.dailyRate')}
                            value={formData.DailyRate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            className={isFieldInvalid('DailyRate') ? 'input-error' : ''}
                        />
                    </div>
                    {isFieldInvalid('DailyRate') && (
                        <div className="error-message">{t('car.validation.dailyRateRequired')}</div>
                    )}
                </div>

                {/* Hourly Rate */}
                <div className="form-group">
                    <label htmlFor="HourlyRate">{t('car.fields.hourlyRate')}</label>
                    <div className="input-group">
                        <span className="input-prefix">$</span>
                        <input
                            type="number"
                            id="HourlyRate"
                            name="HourlyRate"
                            step="0.01"
                            min="0"
                            placeholder={t('car.placeholders.hourlyRate')}
                            value={formData.HourlyRate}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Availability Checkbox */}
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="IsAvailable"
                        name="IsAvailable"
                        checked={formData.IsAvailable}
                        onChange={handleChange}
                    />
                    <label htmlFor="IsAvailable">
                        {t('car.fields.isAvailable')}
                    </label>
                </div>

                {/* Device Serial Number */}
                <div className="form-group">
                    <label htmlFor="DeviceSerialNumber">
                        {t('car.fields.deviceSerialNumber')}
                    </label>
                    <input
                        type="text"
                        id="DeviceSerialNumber"
                        name="DeviceSerialNumber"
                        placeholder={t('car.placeholders.deviceSerialNumber')}
                        value={formData.DeviceSerialNumber}
                        onChange={handleChange}
                    />
                </div>

                {/* Tracking Active Checkbox */}
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="IsTrackingActive"
                        name="IsTrackingActive"
                        checked={formData.IsTrackingActive}
                        onChange={handleChange}
                    />
                    <label htmlFor="IsTrackingActive">
                        {t('car.fields.isTrackingActive')}
                    </label>
                </div>

                {/* Actions */}
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

export default AddCar;