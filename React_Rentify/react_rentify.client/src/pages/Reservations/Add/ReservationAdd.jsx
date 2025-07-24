// src/pages/Reservations/Add/ReservationAdd.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import reservationService from '../../../services/reservationService';
import carService from '../../../services/carService';
import customerService from '../../../services/customerService';
import './ReservationAdd.css';

const ReservationAdd = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;
    const [searchParams] = useSearchParams();

    const [formData, setFormData] = useState({
        CarId: '',
        StartDate: '',
        EndDate: '',
        AgreedPrice: '',
        PickupLocation: '',
        DropoffLocation: '',
        Status: 'Reserved',
        AgencyId: agencyId || '',
    });

    // State management
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [customerToAdd, setCustomerToAdd] = useState('');
    const [cars, setCars] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Search states
    const [carSearchTerm, setCarSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [showCarModal, setShowCarModal] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [carsData, customersData] = await Promise.all([
                    carService.getByAgencyId(agencyId),
                    customerService.getByAgencyId(agencyId)
                ]);
                setCars(carsData || []);
                setCustomers(customersData || []);
            } catch (err) {
                console.error('❌ Error loading data:', err);
                setError(t('reservation.add.errorLoading'));
            } finally {
                setLoading(false);
            }
        };

        if (agencyId) {
            loadData();
        }
    }, [agencyId, t]);

    // Listen for URL parameters and set selected car/customers
    useEffect(() => {
        const carIdFromUrl = searchParams.get('carId');
        const customerIdFromUrl = searchParams.get('customerId');

        // Set selected car if carId parameter exists
        if (carIdFromUrl && cars.length > 0) {
            const foundCar = cars.find(car => car.id === carIdFromUrl);
            if (foundCar) {
                setSelectedCar(foundCar);
                setFormData(prev => ({
                    ...prev,
                    CarId: carIdFromUrl
                }));
                console.log('✅ Car pre-selected from URL:', foundCar.model + ' - ' + foundCar.licensePlate);
            }
        }

        // Add customer to selected customers if customerId parameter exists
        if (customerIdFromUrl && customers.length > 0) {
            const foundCustomer = customers.find(customer => customer.id === customerIdFromUrl);
            if (foundCustomer && !selectedCustomers.find(c => c.id === customerIdFromUrl)) {
                setSelectedCustomers(prev => [...prev, foundCustomer]);
                console.log('✅ Customer pre-selected from URL:', foundCustomer.fullName);
            }
        }
    }, [searchParams, cars, customers, selectedCustomers]);


    // Filter cars based on search term
    const filteredCars = useMemo(() => {
        if (!carSearchTerm.trim()) return cars;

        const searchLower = carSearchTerm.toLowerCase();
        return cars.filter(car =>
            car.licensePlate?.toLowerCase().includes(searchLower) ||
            car.fields.manufacturer?.toLowerCase().includes(searchLower) ||
            car.fields.model?.toLowerCase().includes(searchLower) ||
            car.fields.year?.toString().includes(searchLower)
        );
    }, [cars, carSearchTerm]);

    // Filter customers based on search term
    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm.trim()) return customers;

        const searchLower = customerSearchTerm.toLowerCase();
        return customers.filter(customer =>
            customer.fullName?.toLowerCase().includes(searchLower) ||
            customer.phone?.toLowerCase().includes(searchLower) ||
            customer.email?.toLowerCase().includes(searchLower)
        );
    }, [customers, customerSearchTerm]);

    // Available customers (not already selected)
    const availableCustomers = useMemo(() => {
        return filteredCustomers.filter(customer =>
            !selectedCustomers.some(selected => selected.id === customer.id)
        );
    }, [filteredCustomers, selectedCustomers]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'AgreedPrice'
                ? (value === '' ? '' : parseFloat(value) || value)
                : value,
        }));
    };

    const handleCarSelect = (car) => {
        setSelectedCar(car);
        setFormData(prev => ({ ...prev, CarId: car.id }));
        setShowCarModal(false);
    };

    const handleAddCustomer = () => {
        if (!customerToAdd) return;

        const customer = customers.find(c => c.id === customerToAdd);
        if (customer && !selectedCustomers.some(c => c.id === customerToAdd)) {
            setSelectedCustomers(prev => [...prev, customer]);
            setCustomerToAdd('');
        }
    };

    const handleRemoveCustomer = (customerId) => {
        setSelectedCustomers(prev => prev.filter(c => c.id !== customerId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedCustomers.length === 0) {
            setError(t('reservation.add.errorNoCustomers'));
            return;
        }

        if (!formData.CarId) {
            setError(t('reservation.add.errorNoCar'));
            return;
        }

        if (!formData.StartDate || !formData.EndDate) {
            setError(t('reservation.add.errorNoDates'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                AgencyId: agencyId,
                CarId: formData.CarId,
                CustomersId: selectedCustomers.map(c => c.id),
                StartDate: formData.StartDate
                    ? new Date(formData.StartDate).toISOString()
                    : null,
                EndDate: formData.EndDate
                    ? new Date(formData.EndDate).toISOString()
                    : null,
                Status: formData.Status,
                AgreedPrice: parseFloat(formData.AgreedPrice) || 0,
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

    if (loading) {
        return (
            <div className={`reservationadd-container ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="loading-message">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className={`reservationadd-container ${isDarkMode ? 'dark' : 'light'}`}>
            <h1 className="reservationadd-title">{t('reservation.add.title')}</h1>

            {error && (
                <div className="reservationadd-error">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="reservationadd-form">
                {/* Car Selection */}
                <div className="form-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('reservation.selectCar.title')}</h2>
                    </div>

                    <div className="car-selection-area">
                        {selectedCar ? (
                            <div className="selected-car-display">
                                <div className="selected-car-info">
                                    <div className="car-main-info">
                                        <span className="car-name">
                                            {selectedCar.fields.manufacturer} {selectedCar.fields.model} {selectedCar.fields.year}
                                        </span>
                                        <span className="car-license">{selectedCar.licensePlate}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCarModal(true)}
                                    className="btn-change-car"
                                >
                                    {t('common.change')}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowCarModal(true)}
                                className="btn-select-car"
                            >
                                {t('reservation.selectCar.title')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Date and Price Section */}
                <div className="form-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('reservation.details.title')}</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="StartDate" className="form-label">
                                {t('reservation.fields.startDate')} *
                            </label>
                            <input
                                type="datetime-local"
                                id="StartDate"
                                name="StartDate"
                                value={formData.StartDate}
                                onChange={handleInputChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="EndDate" className="form-label">
                                {t('reservation.fields.endDate')} *
                            </label>
                            <input
                                type="datetime-local"
                                id="EndDate"
                                name="EndDate"
                                value={formData.EndDate}
                                onChange={handleInputChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="AgreedPrice" className="form-label">
                                {t('reservation.fields.agreedPrice')}
                            </label>
                            <input
                                type="number"
                                id="AgreedPrice"
                                name="AgreedPrice"
                                value={formData.AgreedPrice}
                                onChange={handleInputChange}
                                className="form-input"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="Status" className="form-label">
                                {t('reservation.fields.status')}
                            </label>
                            <select
                                id="Status"
                                name="Status"
                                value={formData.Status}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="Reserved">{t('reservation.status.reserved')}</option>
                                <option value="Ongoing">{t('reservation.status.ongoing')}</option>
                                <option value="Completed">{t('reservation.status.completed')}</option>
                                <option value="Cancelled">{t('reservation.status.cancelled')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Location Section */}
                <div className="form-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('reservation.add.locations')}</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="PickupLocation" className="form-label">
                                {t('reservation.fields.pickupLocation')}
                            </label>
                            <input
                                type="text"
                                id="PickupLocation"
                                name="PickupLocation"
                                value={formData.PickupLocation}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder={t('reservation.fields.pickupLocation')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="DropoffLocation" className="form-label">
                                {t('reservation.fields.dropoffLocation')}
                            </label>
                            <input
                                type="text"
                                id="DropoffLocation"
                                name="DropoffLocation"
                                value={formData.DropoffLocation}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder={t('reservation.fields.dropoffLocation')}
                            />
                        </div>
                    </div>
                </div>

                {/* Customer Selection */}
                <div className="form-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('reservation.placeholders.selectCustomer')}</h2>
                    </div>

                    <div className="customer-selection-area">
                        <div className="customer-search-area">
                            <input
                                type="text"
                                placeholder={t('reservation.add.searchCustomers')}
                                value={customerSearchTerm}
                                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                className="form-input"
                            />

                            {availableCustomers.length > 0 && customerSearchTerm && (
                                <div className="customer-dropdown">
                                    {availableCustomers.slice(0, 5).map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="customer-dropdown-item"
                                            onClick={() => {
                                                setSelectedCustomers(prev => [...prev, customer]);
                                                setCustomerSearchTerm('');
                                            }}
                                        >
                                            <div className="customer-info">
                                                <span className="customer-name">{customer.fullName}</span>
                                                {customer.phoneNumber && (
                                                    <span className="customer-phone">{customer.phoneNumber}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedCustomers.length > 0 && (
                            <div className="customers-list">
                                {selectedCustomers.map((customer) => (
                                    <div key={customer.id} className="customer-item">
                                        <div className="customer-info">
                                            <span className="customer-name">{customer.fullName}</span>
                                            {customer.phoneNumber && (
                                                <span className="customer-phone">{customer.phoneNumber}</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCustomer(customer.id)}
                                            className="btn-remove-customer"
                                            aria-label={t('reservation.actions.removeCustomer')}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedCustomers.length === 0 && (
                            <div className="no-customers-message">
                                {t('reservation.noCustomersSelected')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="btn-secondary"
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('common.submitting') : t('common.save')}
                    </button>
                </div>
            </form>

            {/* Car Selection Modal */}
            {showCarModal && (
                <div className="modal-overlay" onClick={() => setShowCarModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('reservation.selectCar.title')}</h3>
                            <button
                                type="button"
                                onClick={() => setShowCarModal(false)}
                                className="modal-close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="car-search-area">
                                <input
                                    type="text"
                                    placeholder={t('reservation.selectCar.title')}
                                    value={carSearchTerm}
                                    onChange={(e) => setCarSearchTerm(e.target.value)}
                                    className="form-input"
                                    autoFocus
                                />
                            </div>

                            <div className="cars-list">
                                {filteredCars.length > 0 ? (
                                    filteredCars.map((car) => (
                                        <div
                                            key={car.id}
                                            className="car-item"
                                            onClick={() => handleCarSelect(car)}
                                        >
                                            <div className="car-info">
                                                <div className="car-main">
                                                    <span className="car-name">
                                                        {car.fields.manufacturer} {car.fields.model} {car.fields.year}
                                                    </span>
                                                    <span className="car-license">{car.licensePlate}</span>
                                                </div>
                                                {car.status && (
                                                    <span className={`car-status status-${car.status.toLowerCase()}`}>
                                                        {t('car.status.' + car.status.toLowerCase())}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-cars-message">
                                        {carSearchTerm
                                            ? t('reservation.add.noCarsFound')
                                            : t('reservation.add.noCarsAvailable')
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationAdd;