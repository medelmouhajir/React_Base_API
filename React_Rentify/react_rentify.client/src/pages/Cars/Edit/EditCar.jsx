// src/pages/Cars/Edit/EditCar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import carService from '../../../services/carService';
import carFiltersService from '../../../services/carFiltersService';
import './EditCar.css'; // Reusing the AddCar styles

const EditCar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        id: '',
        ManufacturerId: '',
        Car_ModelId: '',
        Car_YearId: '',
        LicensePlate: '',
        Color: '',
        IsAvailable: false,
        Status: '',
        DailyRate: '',
        HourlyRate: '',
        DeviceSerialNumber: '',
        IsTrackingActive: false,
        AgencyId: agencyId || '',
    });

    // States for UI
    const [manufacturers, setManufacturers] = useState([]);
    const [models, setModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [years, setYears] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState({});
    const [currentModelManufacturerId, setCurrentModelManufacturerId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch car data and filter options in parallel
                const [carData, manufacturersData, modelsData, yearsData] = await Promise.all([
                    carService.getById(id),
                    carFiltersService.getManufacturers(),
                    carFiltersService.getCarModels(),
                    carFiltersService.getCarYears(),
                ]);

                // Find the manufacturer for this model
                const carModel = modelsData.find(model => model.id === carData.car_ModelId);
                const manufacturerId = carModel?.manufacturerId || '';
                setCurrentModelManufacturerId(manufacturerId);

                // Set form data with car details
                setFormData({
                    id: carData.id,
                    ManufacturerId: manufacturerId,
                    Car_ModelId: carData.car_ModelId,
                    Car_YearId: carData.car_YearId.toString(),
                    LicensePlate: carData.licensePlate,
                    Color: carData.color || '',
                    IsAvailable: carData.isAvailable,
                    Status: carData.status || '',
                    DailyRate: carData.dailyRate.toString(),
                    HourlyRate: carData.hourlyRate ? carData.hourlyRate.toString() : '',
                    DeviceSerialNumber: carData.deviceSerialNumber || '',
                    IsTrackingActive: carData.isTrackingActive,
                    AgencyId: carData.agencyId,
                });

                // Store the filter data
                setManufacturers(manufacturersData);
                setModels(modelsData);
                setYears(yearsData);

                // Filter models based on manufacturer
                if (manufacturerId) {
                    const filtered = modelsData.filter(
                        model => model.manufacturerId === manufacturerId
                    );
                    setFilteredModels(filtered);
                }
            } catch (err) {
                console.error('❌ Error fetching car or filters:', err);
                setError(t('car.edit.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, t]);

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
            setError(t('car.edit.requiredFields'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                id: formData.id,
                AgencyId: agencyId,
                Car_ModelId: formData.Car_ModelId,
                Car_YearId: parseInt(formData.Car_YearId, 10),
                LicensePlate: formData.LicensePlate,
                Color: formData.Color,
                IsAvailable: formData.IsAvailable,
                Status: formData.Status,
                DailyRate: parseFloat(formData.DailyRate),
                HourlyRate: formData.HourlyRate ? parseFloat(formData.HourlyRate) : null,
                DeviceSerialNumber: formData.DeviceSerialNumber,
                IsTrackingActive: formData.IsTrackingActive,
            };

            await carService.update(id, payload);
            navigate('/cars');
        } catch (err) {
            console.error('❌ Error updating car:', err);
            setError(t('car.edit.error'));
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

    if (isLoading) {
        return (
            <div className={`addcar-container ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`addcar-container ${isDarkMode ? 'dark' : 'light'}`}>
            <h1 className="addcar-title">{t('car.edit.title')}</h1>

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

export default EditCar;