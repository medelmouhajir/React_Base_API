// src/pages/Cars/Edit/EditCar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import carService from '../../../services/carService';
import carFiltersService from '../../../services/carFiltersService';
import './EditCar.css';

const EditCar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
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
        id: '',
    });
    const [models, setModels] = useState([]);
    const [years, setYears] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [carData, modelsData, yearsData] = await Promise.all([
                    carService.getById(id),
                    carFiltersService.getCarModels(),
                    carFiltersService.getCarYears(),
                ]);

                setFormData({
                    id: carData.id,
                    Car_ModelId: carData.car_ModelId,
                    Car_YearId: carData.car_YearId.toString(),
                    LicensePlate: carData.licensePlate,
                    Color: carData.color,
                    IsAvailable: carData.isAvailable,
                    Status: carData.status,
                    DailyRate: carData.dailyRate.toString(),
                    HourlyRate: carData.hourlyRate ? carData.hourlyRate.toString() : '',
                    DeviceSerialNumber: carData.deviceSerialNumber || '',
                    IsTrackingActive: carData.isTrackingActive,
                    AgencyId: carData.agencyId,
                });
                setModels(modelsData);
                setYears(yearsData);
            } catch (err) {
                console.error('❌ Error fetching car or filters:', err);
                setError(t('car.edit.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, t]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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

    if (isLoading) {
        return (
            <div className="editcar-loading-wrapper">
                <div className="editcar-spinner" />
            </div>
        );
    }

    if (error) {
        return <div className="editcar-error">{error}</div>;
    }

    return (
        <div className="editcar-container">
            <h1 className="editcar-title">{t('car.edit.title')}</h1>

            <form className="editcar-form" onSubmit={handleSubmit} noValidate>
                {/* Model Select */}
                <div className="form-group">
                    <label htmlFor="Car_ModelId">{t('car.fields.model')}</label>
                    <select
                        id="Car_ModelId"
                        name="Car_ModelId"
                        value={formData.Car_ModelId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">{t('car.placeholders.selectModel')}</option>
                        {models.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Year Select */}
                <div className="form-group">
                    <label htmlFor="Car_YearId">{t('car.fields.year')}</label>
                    <select
                        id="Car_YearId"
                        name="Car_YearId"
                        value={formData.Car_YearId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">{t('car.placeholders.selectYear')}</option>
                        {years.map((y) => (
                            <option key={y.id} value={y.id}>
                                {y.yearValue}
                            </option>
                        ))}
                    </select>
                </div>

                {/* License Plate */}
                <div className="form-group">
                    <label htmlFor="LicensePlate">{t('car.fields.licensePlate')}</label>
                    <input
                        type="text"
                        id="LicensePlate"
                        name="LicensePlate"
                        placeholder={t('car.placeholders.licensePlate')}
                        value={formData.LicensePlate}
                        onChange={handleChange}
                        required
                    />
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

                {/* Available Checkbox */}
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="IsAvailable"
                        name="IsAvailable"
                        checked={formData.IsAvailable}
                        onChange={handleChange}
                    />
                    <label htmlFor="IsAvailable">{t('car.fields.isAvailable')}</label>
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
                <div className="form-group">
                    <label htmlFor="DailyRate">{t('car.fields.dailyRate')}</label>
                    <input
                        type="number"
                        step="0.01"
                        id="DailyRate"
                        name="DailyRate"
                        placeholder={t('car.placeholders.dailyRate')}
                        value={formData.DailyRate}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Hourly Rate */}
                <div className="form-group">
                    <label htmlFor="HourlyRate">{t('car.fields.hourlyRate')}</label>
                    <input
                        type="number"
                        step="0.01"
                        id="HourlyRate"
                        name="HourlyRate"
                        placeholder={t('car.placeholders.hourlyRate')}
                        value={formData.HourlyRate}
                        onChange={handleChange}
                    />
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
