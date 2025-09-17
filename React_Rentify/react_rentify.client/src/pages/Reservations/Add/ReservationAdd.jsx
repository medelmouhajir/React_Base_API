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

    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    const [formData, setFormData] = useState({
        CarId: '',
        StartDate: '',
        EndDate: '',
        AgreedPrice: '',
        DailyPrice: '',
        PickupLocation: '',
        DropoffLocation: '',
        Status: 'Reserved', // Default status, not changeable by user
        AgencyId: agencyId || '',
    });

    // State management
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [customerToAdd, setCustomerToAdd] = useState('');
    const [cars, setCars] = useState([]);
    const [availableCars, setAvailableCars] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Search states
    const [carSearchTerm, setCarSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [showAllCars, setShowAllCars] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);

    // Calculate number of days and total price
    const numberOfDays = useMemo(() => {
        if (!formData.StartDate || !formData.EndDate) return 0;
        const start = new Date(formData.StartDate);
        const end = new Date(formData.EndDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, [formData.StartDate, formData.EndDate]);

    // Auto-calculate agreed price when daily price or dates change
    useEffect(() => {
        if (formData.DailyPrice && numberOfDays > 0) {
            const calculatedPrice = parseFloat(formData.DailyPrice) * numberOfDays;
            setFormData(prev => ({ ...prev, AgreedPrice: calculatedPrice.toString() }));
        }
    }, [formData.DailyPrice, numberOfDays]);

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
                console.log('✅ Car pre-selected from URL:', foundCar.fields?.manufacturer + ' ' + foundCar.fields?.model + ' - ' + foundCar.licensePlate);
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

    // Load available cars when dates change
    useEffect(() => {
        const loadAvailableCars = async () => {
            if (!formData.StartDate || !formData.EndDate || !agencyId) return;

            try {
                const response = await carService.getByAgencyIdAndDates(
                    agencyId,
                    formData.StartDate,
                    formData.EndDate
                );
                setAvailableCars(response || []);
            } catch (err) {
                console.error('❌ Error loading available cars:', err);
                setError(t('reservation.add.errorLoadingCars'));
            }
        };

        loadAvailableCars();
    }, [formData.StartDate, formData.EndDate, agencyId, t]);

    // Filtered cars for selection based on search term and availability
    const filteredCars = useMemo(() => {
        const carsToFilter = showAllCars ? cars : availableCars;

        if (!carSearchTerm) return carsToFilter;

        return carsToFilter.filter(car => {
            const manufacturer = car.fields?.manufacturer || '';
            const model = car.fields?.model || '';
            const licensePlate = car.licensePlate || '';

            return (
                manufacturer.toLowerCase().includes(carSearchTerm.toLowerCase()) ||
                model.toLowerCase().includes(carSearchTerm.toLowerCase()) ||
                licensePlate.toLowerCase().includes(carSearchTerm.toLowerCase())
            );
        });
    }, [cars, availableCars, carSearchTerm, showAllCars]);

    // Filtered customers for selection
    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm) return customers;

        return customers.filter(customer =>
            customer.fullName?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            customer.phoneNumber?.toLowerCase().includes(customerSearchTerm.toLowerCase())
        );
    }, [customers, customerSearchTerm]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['AgreedPrice', 'DailyPrice'].includes(name)
                ? (value === '' ? '' : parseFloat(value) || value)
                : value,
        }));
    };

    const handleCarSelect = (car) => {
        setSelectedCar(car);
        setFormData(prev => ({ ...prev, CarId: car.id }));
        // Set daily rate if available
        if (car.dailyRate) {
            setFormData(prev => ({ ...prev, DailyPrice: car.dailyRate.toString() }));
        }
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

    const handleNextStep = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
            setError(null);
        }
    };

    const handlePreviousStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError(null);
    };

    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1:
                if (!formData.StartDate || !formData.EndDate) {
                    setError(t('reservation.add.errorNoDates'));
                    return false;
                }
                if (new Date(formData.StartDate) >= new Date(formData.EndDate)) {
                    setError('End date must be after start date');
                    return false;
                }
                break;
            case 2:
                if (!formData.CarId) {
                    setError(t('reservation.add.errorNoCar'));
                    return false;
                }
                break;
            case 3:
                if (selectedCustomers.length === 0) {
                    setError(t('reservation.add.errorNoCustomers'));
                    return false;
                }
                break;
            case 4:
                if (!formData.AgreedPrice || parseFloat(formData.AgreedPrice) <= 0) {
                    setError('Please enter a valid agreed price');
                    return false;
                }
                if (!formData.PickupLocation) {
                    setError('Please enter a pickup location');
                    return false;
                }
                if (!formData.DropoffLocation) {
                    setError('Please enter a dropoff location');
                    return false;
                }
                break;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Only submit if we're on the last step
        if (currentStep !== totalSteps) {
            handleNextStep();
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
                Status: formData.Status, // Always "Reserved"
                AgreedPrice: parseFloat(formData.AgreedPrice) || 0,
                PickupLocation: formData.PickupLocation,
                DropoffLocation: formData.DropoffLocation,
            };

            var response = await reservationService.create(payload);
            navigate('/reservations/' + response.id);
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

    // Render step progress indicator
    const renderStepProgress = () => (
        <div className="step-progress">
            {Array.from({ length: totalSteps }, (_, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                    <div
                        key={stepNumber}
                        className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                        <div className="step-circle">
                            {isCompleted ? '✓' : stepNumber}
                        </div>
                        <div className="step-label">
                            {stepNumber === 1 && t('reservation.fields.period')}
                            {stepNumber === 2 && t('reservation.fields.car')}
                            {stepNumber === 3 && t('reservation.fields.customer')}
                            {stepNumber === 4 && t('subscriptions.form.price')}
                            {stepNumber === 5 && t('reservation.summary')}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="form-section">
                        <h2 className="section-title">{t('reservation.fields.period')}</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">
                                    {t('reservation.fields.startDate')} *
                                </label>
                                <input
                                    type="date"
                                    name="StartDate"
                                    value={formData.StartDate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    {t('reservation.fields.endDate')} *
                                </label>
                                <input
                                    type="date"
                                    name="EndDate"
                                    value={formData.EndDate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>
                        {numberOfDays > 0 && (
                            <div className="date-info">
                                <p>{t('reservation.fields.period')}: {numberOfDays} {t('reservation.fields.daysUnit')}</p>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="form-section">
                        <h2 className="section-title">{t('reservation.selectCar.title') }</h2>

                        {selectedCar ? (
                            <div className="selected-car-display">
                                <div className="car-info">
                                    <h3>
                                        {selectedCar.fields?.manufacturer} {selectedCar.fields?.model}
                                        {selectedCar.fields?.year && ` (${selectedCar.fields.year})`}
                                    </h3>
                                    <p>{t('car.list.licensePlate')}: {selectedCar.licensePlate}</p>
                                    <p>{t('car.fields.color')}: {selectedCar.color}</p>
                                    <p>{t('car.fields.status')}: {selectedCar.status}</p>
                                    {selectedCar.dailyRate && (
                                        <p>{t('car.fields.dailyRate')}: {selectedCar.dailyRate}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCar(null)}
                                    className="btn-secondary"
                                >
                                    {t('common.change')}
                                </button>
                            </div>
                        ) : (
                            <div className="car-selection-area">
                                <div className="search-controls">
                                    <input
                                        type="text"
                                        placeholder={t('reservation.selectCar.searchPlaceholder') }
                                        value={carSearchTerm}
                                        onChange={(e) => setCarSearchTerm(e.target.value)}
                                        className="form-input"
                                    />
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={showAllCars}
                                            onChange={(e) => setShowAllCars(e.target.checked)}
                                        />
                                        {t('reservation.showAllCars')}
                                    </label>
                                </div>

                                <div className="cars-list">
                                    {filteredCars.length > 0 ? (
                                        filteredCars.map(car => {
                                            const isAvailable = showAllCars ? availableCars.some(ac => ac.id === car.id) : true;

                                            return (
                                                <div
                                                    key={car.id}
                                                    className={`car-item ${!isAvailable ? 'unavailable' : ''}`}
                                                    onClick={() => handleCarSelect(car)}
                                                >
                                                    <div className="car-info">
                                                        <h4>
                                                            {car.fields?.manufacturer} {car.fields?.model}
                                                            {car.fields?.year && ` (${car.fields.year})`}
                                                        </h4>
                                                        <p>{t('car.list.licensePlate')}: {car.licensePlate} | {t('car.list.color')}: {car.color}</p>
                                                        {car.dailyRate && <p>{t('reservation.fields.pricePerDay')}: {car.dailyRate}</p>}
                                                    </div>
                                                    <div className="car-status">
                                                        {!isAvailable && (
                                                            <span className="unavailable-badge">{t('car.list.unavailable')}</span>
                                                        )}
                                                        <span className={`status-badge ${car.status?.toLowerCase()}`}>
                                                            {t('car.status.' + car.status?.toLowerCase())}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-cars-message">
                                            {carSearchTerm
                                                ? t('reservation.selectCar.noCarsFound')
                                                : showAllCars
                                                    ? t('reservation.selectCar.noCarsFound')
                                                    : 'No cars available for selected dates'
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="form-section">
                        <h2 className="section-title">{t('reservation.customers.title')}</h2>

                        <div className="customer-reservation-selection">
                            <div className="customer-reservation-search">
                                <input
                                    type="text"
                                    placeholder={t('reservation.add.searchCustomers')}
                                    value={customerSearchTerm}
                                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="customers-reservation-grid">
                                {filteredCustomers
                                    .filter(customer => !selectedCustomers.some(sc => sc.id === customer.id))
                                    .map(customer => (
                                        <div
                                            key={customer.id}
                                            className={`customer-reservation-card ${customer.isBlacklisted ? 'blacklisted' : ''}`}
                                            onClick={() => {
                                                setSelectedCustomers(prev => [...prev, customer]);
                                            }}
                                        >
                                            <div className="customer-reservation-info">
                                                <h4 style={{ color: customer.isBlacklisted ? 'red' : 'inherit' }}>
                                                    {customer.fullName}
                                                    {customer.isBlacklisted && (
                                                        <span className="blacklist-badge">{t('customer.list.blacklisted')}</span>
                                                    )}
                                                </h4>
                                                <p>{customer.email}</p>
                                                <p>{customer.phoneNumber}</p>
                                                {customer.licenseNumber && (
                                                    <p>{t('customer.fields.licenseNumber')}: {customer.licenseNumber}</p>
                                                )}
                                            </div>
                                            <div className="customer-select-indicator">
                                                <span className="select-icon">+</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            <div className="selected-customers">
                                <h3>{t('reservation.selectedCustomers')} ({selectedCustomers.length})</h3>
                                {selectedCustomers.length > 0 ? (
                                    <div className="selected-customers-list">
                                        {selectedCustomers.map(customer => (
                                            <div
                                                key={customer.id}
                                                className={`selected-customer-item ${customer.isBlacklisted ? 'blacklisted' : ''}`}
                                            >
                                                <div className="customer-reservation-info">
                                                    <h4 style={{ color: customer.isBlacklisted ? 'red' : 'inherit' }}>
                                                        {customer.fullName}
                                                        {customer.isBlacklisted && (
                                                            <span className="blacklist-badge">{t('customer.list.blacklisted')}</span>
                                                        )}
                                                    </h4>
                                                    <p>{customer.email}</p>
                                                    <p>{customer.phoneNumber}</p>
                                                    {customer.licenseNumber && (
                                                        <p>{t('customer.fields.licenseNumber')}: {customer.licenseNumber}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCustomer(customer.id)}
                                                    className="btn-remove"
                                                >
                                                    {t('common.remove')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-customers-message">{t('reservation.noCustomersSelected')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="form-section">
                        <h2 className="section-title">{t('subscriptions.form.price')}</h2>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">{t('reservation.fields.pricePerDay')} *</label>
                                <input
                                    type="number"
                                    name="DailyPrice"
                                    value={formData.DailyPrice}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    {t('reservation.fields.agreedPrice')} ({numberOfDays} {t('reservation.fields.daysUnit')}) *
                                </label>
                                <input
                                    type="number"
                                    name="AgreedPrice"
                                    value={formData.AgreedPrice}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        {formData.DailyPrice && numberOfDays > 0 && (
                            <div className="price-calculation">
                                <p>
                                    Calculation: {formData.DailyPrice} × {numberOfDays} days =
                                    {(parseFloat(formData.DailyPrice) * numberOfDays).toFixed(2)}
                                </p>
                            </div>
                        )}

                        <h2 className="section-title">{t('reservation.add.locations')}</h2>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">{t('reservation.fields.pickupLocation')} *</label>
                                <input
                                    type="text"
                                    name="PickupLocation"
                                    value={formData.PickupLocation}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Office"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('reservation.fields.dropoffLocation')} *</label>
                                <input
                                    type="text"
                                    name="DropoffLocation"
                                    value={formData.DropoffLocation}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Office"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="form-section">
                        <h2 className="section-title">{t('reservation.summary')}</h2>

                        <div className="summary-section">
                            <div className="summary-group">
                                <h3>{t('reservation.fields.period')}</h3>
                                <p>{t('reservation.fields.startDate')}: {new Date(formData.StartDate).toLocaleDateString()}</p>
                                <p>{t('reservation.fields.endDate')}: {new Date(formData.EndDate).toLocaleDateString()}</p>
                                <p>{numberOfDays} {t('reservation.fields.daysUnit')}</p>
                            </div>

                            <div className="summary-group">
                                <h3>{t('reservation.fields.car')}</h3>
                                <p>
                                    {selectedCar?.fields?.manufacturer} {selectedCar?.fields?.model}
                                    {selectedCar?.fields?.year && ` (${selectedCar.fields.year})`}
                                </p>
                                <p>{t('car.fields.licensePlate')}: {selectedCar?.licensePlate}</p>
                                <p>{t('car.fields.color')}: {selectedCar?.color}</p>
                            </div>

                            <div className="summary-group">
                                <h3>{t('reservation.fields.customers')} ({selectedCustomers.length})</h3>
                                {selectedCustomers.map(customer => (
                                    <p
                                        key={customer.id}
                                        style={{ color: customer.isBlacklisted ? 'red' : 'inherit' }}
                                    >
                                        {customer.fullName}
                                        {customer.isBlacklisted && ' (BLACKLISTED)'}
                                    </p>
                                ))}
                            </div>

                            <div className="summary-group">
                                <h3>{t('reservation.price')}</h3>
                                <p>{t('car.fields.dailyRate')}: {formData.DailyPrice} {t('common.currency')}</p>
                                <p>{t('reservation.fields.finalPrice')}: {formData.AgreedPrice} {t('common.currency')}</p>
                            </div>

                            <div className="summary-group">
                                <h3>{t('reservation.add.locations')}</h3>
                                <p>{t('reservation.fields.pickupLocation')}: {formData.PickupLocation}</p>
                                <p>{t('reservation.fields.dropoffLocation')}: {formData.DropoffLocation}</p>
                            </div>

                            <div className="summary-group">
                                <h3>{t('common.status')}</h3>
                                <p>{t('reservation.status.' + formData.Status.toLowerCase())}</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
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

            {renderStepProgress()}

            {error && (
                <div className="reservationadd-error">
                    {error}
                </div>
            )}

            <form
                onSubmit={currentStep === totalSteps ? handleSubmit : (e) => e.preventDefault()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentStep !== totalSteps) {
                        e.preventDefault();
                    }
                }}
                className="reservationadd-form">

                {renderStepContent()}

                <div className="form-actions">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handlePreviousStep}
                            className="btn-secondary"
                            disabled={isSubmitting}
                        >
                            {t('common.previous')}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleCancel}
                        className="btn-secondary"
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>

                    {currentStep < totalSteps ? (
                        <button
                            type="button"
                            onClick={handleNextStep}
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {t('common.next')}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e)}
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t('common.submitting') : t('common.save')}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ReservationAdd;