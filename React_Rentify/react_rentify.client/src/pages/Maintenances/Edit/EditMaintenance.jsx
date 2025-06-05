import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import maintenanceService from '../../../services/maintenanceService';
import carService from '../../../services/carService';
import './EditMaintenance.css';

const EditMaintenance = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams(); // maintenance record ID
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
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch list of cars and existing maintenance record
        const fetchData = async () => {
            try {
                if (agencyId) {
                    const carsData = await carService.getByAgencyId(agencyId);
                    setCars(carsData);
                }
                const record = await maintenanceService.getById(id);
                setFormData({
                    CarId: record.carId || '',
                    ScheduledDate: record.scheduledDate
                        ? record.scheduledDate.split('T')[0]
                        : '',
                    Description: record.description || '',
                    Cost: record.cost != null ? record.cost.toString() : '',
                    IsCompleted: record.isCompleted || false,
                    CompletedDate: record.completedDate
                        ? record.completedDate.split('T')[0]
                        : '',
                    Remarks: record.remarks || ''
                });
            } catch (err) {
                console.error('❌ Error fetching maintenance record:', err);
                setError(t('maintenance.edit.fetchError') || 'Error loading data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [agencyId, id, t]);

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
                id,
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

            await maintenanceService.update(id, payload);
            navigate('/maintenances');
        } catch (err) {
            console.error('❌ Error updating maintenance record:', err);
            setError(t('maintenance.edit.error') || 'Error updating record.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/maintenances');
    };

    if (isLoading) {
        return (
            <div className="editMaintenance-loading">
                {t('common.loading') || 'Loading...'}
            </div>
        );
    }

    return (
        <div className="editMaintenance-container">
            <h1 className="editMaintenance-title">
                {t('maintenance.edit.title') || 'Edit Maintenance'}
            </h1>

            {error && <div className="editMaintenance-error">{error}</div>}

            <form className="editMaintenance-form" onSubmit={handleSubmit} noValidate>
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
                        <option value="">
                            {t('maintenance.placeholders.selectCar') || 'Select a car'}
                        </option>
                        {cars.map(car => (
                            <option key={car.id} value={car.id}>
                                {car.licensePlate || car.LicensePlate}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Scheduled Date */}
                <div className="form-group">
                    <label htmlFor="ScheduledDate">
                        {t('maintenance.fields.scheduledDate') || 'Scheduled Date'}
                    </label>
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
                    <label htmlFor="Description">
                        {t('maintenance.fields.description') || 'Description'}
                    </label>
                    <textarea
                        id="Description"
                        name="Description"
                        placeholder={
                            t('maintenance.placeholders.description') ||
                            'Describe the maintenance task'
                        }
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
                    <label htmlFor="IsCompleted">
                        {t('maintenance.fields.isCompleted') || 'Completed'}
                    </label>
                </div>

                {/* Completed Date (shown only if completed) */}
                {formData.IsCompleted && (
                    <div className="form-group">
                        <label htmlFor="CompletedDate">
                            {t('maintenance.fields.completedDate') || 'Completed Date'}
                        </label>
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
                        placeholder={
                            t('maintenance.placeholders.remarks') ||
                            'Additional remarks (optional)'
                        }
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
                        {isSubmitting
                            ? t('common.saving') || 'Saving...'
                            : t('common.update') || 'Update'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditMaintenance;
