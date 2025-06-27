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
        StartDate: '',
        EndDate: '',
        AgreedPrice: '',
        PickupLocation: '',
        DropoffLocation: '',
        Status: 'Reserved', // default
        AgencyId: agencyId || '',
    });

    // Store selected customers in a separate array
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [customerToAdd, setCustomerToAdd] = useState('');

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

    const handleAddCustomer = () => {
        if (!customerToAdd) return;
        
        // Don't add if already selected
        if (selectedCustomers.some(c => c.id === customerToAdd)) {
            return;
        }
        
        const customer = customers.find(c => c.id === customerToAdd);
        if (customer) {
            setSelectedCustomers(prev => [...prev, customer]);
            setCustomerToAdd(''); // Reset the selector
        }
    };

    const handleRemoveCustomer = (customerId) => {
        setSelectedCustomers(prev => prev.filter(c => c.id !== customerId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate at least one customer is selected
        if (selectedCustomers.length === 0) {
            setError(t('reservation.add.errorNoCustomers'));
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                AgencyId: agencyId,
                CarId: formData.CarId,
                CustomersId: selectedCustomers.map(c => c.id), // Send array of customer IDs
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

    // Get available customers (those not already selected)
    const getAvailableCustomers = () => {
        return customers.filter(
            customer => !selectedCustomers.some(sc => sc.id === customer.id)
        );
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

                {/* Multiple Customers Section */}
                <div className="form-group customers-section">
                    <div className="customers-header">
                        <label className="customers-title">{t('reservation.fields.customers')}</label>
                    </div>
                    
                    {/* Customers List */}
                    {selectedCustomers.length > 0 ? (
                        <div className="customers-list">
                            {selectedCustomers.map(customer => (
                                <div key={customer.id} className="customer-item">
                                    <div className="customer-info">
                                        <div className="customer-name">{customer.fullName}</div>
                                        <div className="customer-details">
                                            {customer.email} • {customer.phoneNumber}
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="remove-customer"
                                        onClick={() => handleRemoveCustomer(customer.id)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-customers">
                            {t('reservation.add.noCustomersSelected')}
                        </div>
                    )}
                    
                    {/* Add Customer Control */}
                    <div className="add-customer-wrapper">
                        <select
                            className="add-customer-select"
                            value={customerToAdd}
                            onChange={(e) => setCustomerToAdd(e.target.value)}
                        >
                            <option value="">{t('reservation.placeholders.selectCustomer')}</option>
                            {getAvailableCustomers().map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.fullName}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="add-customer-btn"
                            onClick={handleAddCustomer}
                            disabled={!customerToAdd}
                        >
                            {t('common.add')}
                        </button>
                    </div>
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
                        id="AgreedPrice"
                        name="AgreedPrice"
                        value={formData.AgreedPrice}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                    />
                </div>

                {/* Pickup Location */}
                <div className="form-group">
                    <label htmlFor="PickupLocation">{t('reservation.fields.pickupLocation')}</label>
                    <input
                        type="text"
                        id="PickupLocation"
                        name="PickupLocation"
                        value={formData.PickupLocation}
                        onChange={handleChange}
                    />
                </div>

                {/* Dropoff Location */}
                <div className="form-group">
                    <label htmlFor="DropoffLocation">{t('reservation.fields.dropoffLocation')}</label>
                    <input
                        type="text"
                        id="DropoffLocation"
                        name="DropoffLocation"
                        value={formData.DropoffLocation}
                        onChange={handleChange}
                    />
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancel}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting || selectedCustomers.length === 0}
                    >
                        {isSubmitting
                            ? t('common.submitting')
                            : t('common.save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReservationAdd;