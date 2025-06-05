import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import reservationService from '../../../services/reservationService';
import carService from '../../../services/carService';
import customerService from '../../../services/customerService';
import './ReservationAdd.css';

const ReservationAdd = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        CarId: '',
        CustomerId: '',
        StartDate: '',
        EndDate: '',
        AgreedPrice: '',
        PickupLocation: '',
        DropoffLocation: '',
        Status: 'Reserved', // default
        AgencyId: agencyId || '',
    });

    const [cars, setCars] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!agencyId) return;

        const fetchOptions = async () => {
            try {
                const [carsData, customersData] = await Promise.all([
                    carService.getByAgencyId(agencyId),
                    customerService.getByAgencyId(agencyId),
                ]);
                setCars(carsData);
                setCustomers(customersData);
            } catch (err) {
                console.error('❌ Error fetching cars or customers:', err);
            }
        };

        fetchOptions();
    }, [agencyId]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? value : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                AgencyId: agencyId,
                CarId: formData.CarId,
                CustomerId: formData.CustomerId,
                StartDate: formData.StartDate
                    ? new Date(formData.StartDate).toISOString()
                    : null,
                EndDate: formData.EndDate
                    ? new Date(formData.EndDate).toISOString()
                    : null,
                Status: formData.Status,
                AgreedPrice: parseFloat(formData.AgreedPrice),
                PickupLocation: formData.PickupLocation,
                DropoffLocation: formData.DropoffLocation,
            };

            await reservationService.create(payload);
            navigate('/reservations');
        } catch (err) {
            console.error('❌ Error adding reservation:', err);
            setError(t('reservation.add.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/reservations');
    };

    return (
        <div className="reservationadd-container">
            <h1 className="reservationadd-title">{t('reservation.add.title')}</h1>

            {error && <div className="reservationadd-error">{error}</div>}

            <form
                className="reservationadd-form"
                onSubmit={handleSubmit}
                noValidate
            >
                {/* Car Select */}
                <div className="form-group">
                    <label htmlFor="CarId">{t('reservation.fields.car')}</label>
                    <select
                        id="CarId"
                        name="CarId"
                        value={formData.CarId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">{t('reservation.placeholders.selectCar')}</option>
                        {cars.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.licensePlate}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Customer Select */}
                <div className="form-group">
                    <label htmlFor="CustomerId">{t('reservation.fields.customer')}</label>
                    <select
                        id="CustomerId"
                        name="CustomerId"
                        value={formData.CustomerId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">{t('reservation.placeholders.selectCustomer')}</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.fullName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Start Date */}
                <div className="form-group">
                    <label htmlFor="StartDate">{t('reservation.fields.startDate')}</label>
                    <input
                        type="date"
                        id="StartDate"
                        name="StartDate"
                        value={formData.StartDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* End Date */}
                <div className="form-group">
                    <label htmlFor="EndDate">{t('reservation.fields.endDate')}</label>
                    <input
                        type="date"
                        id="EndDate"
                        name="EndDate"
                        value={formData.EndDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Agreed Price */}
                <div className="form-group">
                    <label htmlFor="AgreedPrice">{t('reservation.fields.agreedPrice')}</label>
                    <input
                        type="number"
                        step="0.01"
                        id="AgreedPrice"
                        name="AgreedPrice"
                        placeholder={t('reservation.placeholders.agreedPrice')}
                        value={formData.AgreedPrice}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Pickup Location */}
                <div className="form-group">
                    <label htmlFor="PickupLocation">
                        {t('reservation.fields.pickupLocation')}
                    </label>
                    <input
                        type="text"
                        id="PickupLocation"
                        name="PickupLocation"
                        placeholder={t('reservation.placeholders.pickupLocation')}
                        value={formData.PickupLocation}
                        onChange={handleChange}
                    />
                </div>

                {/* Dropoff Location */}
                <div className="form-group">
                    <label htmlFor="DropoffLocation">
                        {t('reservation.fields.dropoffLocation')}
                    </label>
                    <input
                        type="text"
                        id="DropoffLocation"
                        name="DropoffLocation"
                        placeholder={t('reservation.placeholders.dropoffLocation')}
                        value={formData.DropoffLocation}
                        onChange={handleChange}
                    />
                </div>

                {/* Status (optional) */}
                <div className="form-group">
                    <label htmlFor="Status">{t('reservation.fields.status')}</label>
                    <input
                        type="text"
                        id="Status"
                        name="Status"
                        placeholder={t('reservation.placeholders.status')}
                        value={formData.Status}
                        onChange={handleChange}
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
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? t('common.saving')
                            : t('common.save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReservationAdd;
