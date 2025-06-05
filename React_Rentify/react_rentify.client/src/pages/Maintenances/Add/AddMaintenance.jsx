import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import maintenanceService from '../../../services/maintenanceService';
import carService from '../../../services/carService';
import './AddMaintenance.css';

const AddMaintenance = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        CarId: '',
        ScheduledDate: '',
        Description: '',
        Cost: '',
        IsCompleted: false,
        CompletedDate: '',
        Remarks: ''
    });
    const [cars, setCars] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch cars for this agency
        const fetchCars = async () => {
            try {
                if (agencyId) {
                    const carsData = await carService.getByAgencyId(agencyId);
                    setCars(carsData);
                }
            } catch (err) {
                console.error('❌ Error fetching cars:', err);
            }
        };
        fetchCars();
    }, [agencyId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                Remarks: formData.Remarks.trim()
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

    return (
        <div className="addMaintenance-container">
            <h1 className="addMaintenance-title">{t('maintenance.add.title') || 'Add Maintenance'}</h1>

            {error && <div className="addMaintenance-error">{error}</div>}

            <form className="addMaintenance-form" onSubmit={handleSubmit} noValidate>
                {/* Car Select */}
                <div className="form-group">
                    <label htmlFor="CarId">{t('maintenance.fields.car') || 'Car'}</label>
                    <select
                        id="CarId"
                        name="CarId"
                        value={formData.CarId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">{t('maintenance.placeholders.selectCar') || 'Select a car'}</option>
                        {cars.map(car => (
                            <option key={car.id} value={car.id}>
                                {car.licensePlate || car.LicensePlate}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Scheduled Date */}
                <div className="form-group">
                    <label htmlFor="ScheduledDate">{t('maintenance.fields.scheduledDate') || 'Scheduled Date'}</label>
                    <input
                        type="date"
                        id="ScheduledDate"
                        name="ScheduledDate"
                        value={formData.ScheduledDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Description */}
                <div className="form-group">
                    <label htmlFor="Description">{t('maintenance.fields.description') || 'Description'}</label>
                    <textarea
                        id="Description"
                        name="Description"
                        placeholder={t('maintenance.placeholders.description') || 'Describe the maintenance task'}
                        value={formData.Description}
                        onChange={handleChange}
                        rows="3"
                        required
                    />
                </div>

                {/* Cost */}
                <div className="form-group">
                    <label htmlFor="Cost">{t('maintenance.fields.cost') || 'Cost'}</label>
                    <input
                        type="number"
                        step="0.01"
                        id="Cost"
                        name="Cost"
                        placeholder={t('maintenance.placeholders.cost') || 'Enter cost'}
                        value={formData.Cost}
                        onChange={handleChange}
                    />
                </div>

                {/* Completed Checkbox */}
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="IsCompleted"
                        name="IsCompleted"
                        checked={formData.IsCompleted}
                        onChange={handleChange}
                    />
                    <label htmlFor="IsCompleted">{t('maintenance.fields.isCompleted') || 'Completed'}</label>
                </div>

                {/* Completed Date (shown only if completed) */}
                {formData.IsCompleted && (
                    <div className="form-group">
                        <label htmlFor="CompletedDate">{t('maintenance.fields.completedDate') || 'Completed Date'}</label>
                        <input
                            type="date"
                            id="CompletedDate"
                            name="CompletedDate"
                            value={formData.CompletedDate}
                            onChange={handleChange}
                            required={formData.IsCompleted}
                        />
                    </div>
                )}

                {/* Remarks */}
                <div className="form-group">
                    <label htmlFor="Remarks">{t('maintenance.fields.remarks') || 'Remarks'}</label>
                    <textarea
                        id="Remarks"
                        name="Remarks"
                        placeholder={t('maintenance.placeholders.remarks') || 'Additional remarks (optional)'}
                        value={formData.Remarks}
                        onChange={handleChange}
                        rows="2"
                    />
                </div>

                {/* Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMaintenance;
