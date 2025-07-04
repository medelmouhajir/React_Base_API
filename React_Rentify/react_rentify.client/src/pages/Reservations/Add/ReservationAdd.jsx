// src/pages/Reservations/Add/ReservationAdd.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import reservationService from '../../../services/reservationService';
import carService from '../../../services/carService';
import customerService from '../../../services/customerService';
import carFiltersService from '../../../services/carFiltersService';
import './ReservationAdd.css';

const ReservationAdd = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
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

    // Car selection filters
    const [cars, setCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [carSearchTerm, setCarSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');

    // Advanced car selection
    const [manufacturers, setManufacturers] = useState([]);
    const [models, setModels] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedManufacturer, setSelectedManufacturer] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [filteredModels, setFilteredModels] = useState([]);

    // Mobile optimization
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showAdvancedCarSearch, setShowAdvancedCarSearch] = useState(false);
    const [showSelectedCustomers, setShowSelectedCustomers] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch data from API
    useEffect(() => {
        if (!agencyId) return;

        const fetchOptions = async () => {
            try {
                const [carsData, customersData, manufacturersData, modelsData, yearsData] = await Promise.all([
                    carService.getByAgencyId(agencyId),
                    customerService.getByAgencyId(agencyId),
                    carFiltersService.getManufacturers(),
                    carFiltersService.getCarModels(),
                    carFiltersService.getCarYears()
                ]);
                setCars(carsData);
                setFilteredCars(carsData);
                setCustomers(customersData);
                setManufacturers(manufacturersData);
                setModels(modelsData);
                setYears(yearsData);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError(t('reservation.add.fetchError'));
            }
        };

        fetchOptions();
    }, [agencyId, t]);

    // Filter models when manufacturer changes
    useEffect(() => {
        if (selectedManufacturer) {
            const filtered = models.filter(
                model => model.manufacturerId === selectedManufacturer
            );
            setFilteredModels(filtered);
            setSelectedModel(''); // Reset model selection
        } else {
            setFilteredModels([]);
        }
    }, [selectedManufacturer, models]);

    // Filter cars based on search and filters
    useEffect(() => {
        if (!cars.length) return;

        let filtered = [...cars];

        // Text search
        if (carSearchTerm.trim()) {
            const searchLower = carSearchTerm.toLowerCase().trim();
            filtered = filtered.filter(car => {
                const licensePlate = car.licensePlate?.toLowerCase() || '';
                const model = car.car_Model?.name?.toLowerCase() || '';
                const manufacturer = car.car_Model?.car_Manufacturer?.name?.toLowerCase() || '';

                return licensePlate.includes(searchLower) ||
                    model.includes(searchLower) ||
                    manufacturer.includes(searchLower);
            });
        }

        // Manufacturer filter
        //if (selectedManufacturer) {
        //    filtered = filtered.filter(car =>
        //        car.car_Model?.car_Manufacturer?.id === selectedManufacturer
        //    );
        //}

        // Model filter
        if (selectedModel) {
            filtered = filtered.filter(car =>
                car.car_ModelId === selectedModel
            );
        }

        // Year filter
        if (selectedYear) {
            filtered = filtered.filter(car =>
                car.car_YearId === selectedYear
            );
        }

        setFilteredCars(filtered);
    }, [cars, carSearchTerm, selectedManufacturer, selectedModel, selectedYear]);

    // Filter available customers based on search
    const filteredCustomers = useMemo(() => {
        if (!customers.length) return [];

        // Get customers who aren't already selected
        const availableCustomers = customers.filter(
            customer => !selectedCustomers.some(sc => sc.id === customer.id)
        );

        if (!customerSearchTerm.trim()) return availableCustomers;

        const searchLower = customerSearchTerm.toLowerCase().trim();
        return availableCustomers.filter(customer => {
            const fullName = customer.fullName?.toLowerCase() || '';
            const phone = customer.phoneNumber?.toLowerCase() || '';
            const email = customer.email?.toLowerCase() || '';

            return fullName.includes(searchLower) ||
                phone.includes(searchLower) ||
                email.includes(searchLower);
        });
    }, [customers, selectedCustomers, customerSearchTerm]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value,
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

    const resetCarFilters = () => {
        setCarSearchTerm('');
        setSelectedManufacturer('');
        setSelectedModel('');
        setSelectedYear('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate at least one customer is selected
        if (selectedCustomers.length === 0) {
            setError(t('reservation.add.errorNoCustomers'));
            return;
        }

        // Validate car is selected
        if (!formData.CarId) {
            setError(t('reservation.add.errorNoCar'));
            return;
        }

        // Validate dates
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
                CustomersId: selectedCustomers.map(c => c.id), // Send array of customer IDs
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

    return (
        <div className={`reservationadd-container ${isDarkMode ? 'dark' : 'light'}`}>
            <h1 className="reservationadd-title">{t('reservation.add.title')}</h1>

            {error && <div className="reservationadd-error" role="alert">{error}</div>}

            <form
                className="reservationadd-form"
                onSubmit={handleSubmit}
                noValidate
            >
                {/* Car Selection Section */}
                <div className="car-selection-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('reservation.fields.car')}</h2>
                        <button
                            type="button"
                            className="toggle-advanced-search"
                            onClick={() => setShowAdvancedCarSearch(!showAdvancedCarSearch)}
                            aria-expanded={showAdvancedCarSearch}
                        >
                            {showAdvancedCarSearch ? t('common.simpleSearch') : t('common.advancedSearch')}
                        </button>
                    </div>

                    {/* Quick Car Search */}
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder={t('car.search.placeholder')}
                                value={carSearchTerm}
                                onChange={(e) => setCarSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            {carSearchTerm && (
                                <button
                                    type="button"
                                    className="clear-search"
                                    onClick={() => setCarSearchTerm('')}
                                    aria-label={t('common.clear')}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Advanced Car Search */}
                    {showAdvancedCarSearch && (
                        <div className="advanced-search-container">
                            <div className="advanced-search-row">
                                {/* Manufacturer Select */}
                                <div className="form-group">
                                    <label htmlFor="manufacturer">{t('car.fields.manufacturer')}</label>
                                    <select
                                        id="manufacturer"
                                        value={selectedManufacturer}
                                        onChange={(e) => setSelectedManufacturer(e.target.value)}
                                    >
                                        <option value="">{t('car.placeholders.selectManufacturer')}</option>
                                        {manufacturers.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Model Select */}
                                <div className="form-group">
                                    <label htmlFor="model">{t('car.fields.model')}</label>
                                    <select
                                        id="model"
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        disabled={!selectedManufacturer}
                                    >
                                        <option value="">{t('car.placeholders.selectModel')}</option>
                                        {filteredModels.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Year Select */}
                                <div className="form-group">
                                    <label htmlFor="year">{t('car.fields.year')}</label>
                                    <select
                                        id="year"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        <option value="">{t('car.placeholders.selectYear')}</option>
                                        {years.map((y) => (
                                            <option key={y.id} value={y.id}>
                                                {y.yearValue}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="filter-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={resetCarFilters}
                                >
                                    {t('common.resetFilters')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Cars List */}
                    {filteredCars.length > 0 ? (
                        <div className="cars-grid">
                            {filteredCars.map((car) => (
                                <div
                                    key={car.id}
                                    className={`car-card ${formData.CarId === car.id ? 'selected' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, CarId: car.id }))}
                                >
                                    <div className="car-card-header">
                                        <span className="license-plate">{car.licensePlate}</span>
                                        <span className={`availability-badge ${car.isAvailable ? 'available' : 'unavailable'}`}>
                                            {car.isAvailable ? t('car.available') : t('car.unavailable')}
                                        </span>
                                    </div>
                                    <div className="car-card-body">
                                        <div className="car-info">
                                            <span className="car-model">
                                                {car.car_Model?.car_Manufacturer?.name} {car.car_Model?.name}
                                            </span>
                                            <span className="car-year">{car.car_Year?.year}</span>
                                        </div>
                                        <div className="car-price">
                                            <span className="price-label">{t('car.fields.dailyRate')}:</span>
                                            <span className="price-value">{car.dailyRate}</span>
                                        </div>
                                    </div>
                                    <div className="car-card-footer">
                                        <button
                                            type="button"
                                            className="btn-select-car"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData(prev => ({ ...prev, CarId: car.id }));
                                            }}
                                        >
                                            {formData.CarId === car.id ? t('common.selected') : t('common.select')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-cars-message">
                            {carSearchTerm || selectedManufacturer || selectedModel || selectedYear
                                ? t('car.search.noResults')
                                : t('car.search.noCars')}
                        </div>
                    )}
                </div>

                {/* Date Selection */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="StartDate">{t('reservation.fields.startDate')}</label>
                        <input
                            id="StartDate"
                            name="StartDate"
                            type="date"
                            value={formData.StartDate}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="EndDate">{t('reservation.fields.endDate')}</label>
                        <input
                            id="EndDate"
                            name="EndDate"
                            type="date"
                            value={formData.EndDate}
                            onChange={handleChange}
                            required
                            min={formData.StartDate || new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                {/* Price & Status */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="AgreedPrice">{t('reservation.fields.agreedPrice')}</label>
                        <input
                            id="AgreedPrice"
                            name="AgreedPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.AgreedPrice}
                            onChange={handleChange}
                            placeholder={t('reservation.placeholders.price')}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="Status">{t('reservation.fields.status')}</label>
                        <select
                            id="Status"
                            name="Status"
                            value={formData.Status}
                            onChange={handleChange}
                        >
                            <option value="Reserved">{t('reservation.status.reserved')}</option>
                            <option value="Confirmed">{t('reservation.status.confirmed')}</option>
                            <option value="Ongoing">{t('reservation.status.ongoing')}</option>
                            <option value="Completed">{t('reservation.status.completed')}</option>
                            <option value="Cancelled">{t('reservation.status.cancelled')}</option>
                        </select>
                    </div>
                </div>

                {/* Location */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="PickupLocation">{t('reservation.fields.pickupLocation')}</label>
                        <input
                            id="PickupLocation"
                            name="PickupLocation"
                            type="text"
                            value={formData.PickupLocation}
                            onChange={handleChange}
                            placeholder={t('reservation.placeholders.pickupLocation')}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="DropoffLocation">{t('reservation.fields.dropoffLocation')}</label>
                        <input
                            id="DropoffLocation"
                            name="DropoffLocation"
                            type="text"
                            value={formData.DropoffLocation}
                            onChange={handleChange}
                            placeholder={t('reservation.placeholders.dropoffLocation')}
                        />
                    </div>
                </div>

                {/* Customers Section */}
                <div className="customers-section">
                    <div className="section-header">
                        <h2 className="section-title">{t('reservation.fields.customers')}</h2>
                        {isMobileView && (
                            <button
                                type="button"
                                className="toggle-section"
                                onClick={() => setShowSelectedCustomers(!showSelectedCustomers)}
                                aria-expanded={showSelectedCustomers}
                            >
                                {showSelectedCustomers ? t('common.hide') : t('common.show')}
                            </button>
                        )}
                    </div>

                    {/* Search & Add Customer */}
                    <div className="add-customer-container">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder={t('customer.search.placeholder')}
                                value={customerSearchTerm}
                                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            {customerSearchTerm && (
                                <button
                                    type="button"
                                    className="clear-search"
                                    onClick={() => setCustomerSearchTerm('')}
                                    aria-label={t('common.clear')}
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="customer-selector-container">
                            <select
                                id="customerToAdd"
                                value={customerToAdd}
                                onChange={(e) => setCustomerToAdd(e.target.value)}
                                className="customer-selector"
                            >
                                <option value="">{t('reservation.placeholders.selectCustomer')}</option>
                                {filteredCustomers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.fullName} {c.phoneNumber ? `- ${c.phoneNumber}` : ''}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleAddCustomer}
                                className="btn-add-customer"
                                disabled={!customerToAdd}
                            >
                                {t('reservation.actions.addCustomer')}
                            </button>
                        </div>
                    </div>

                    {/* Selected Customers List */}
                    {(!isMobileView || showSelectedCustomers) && (
                        <>
                            {selectedCustomers.length > 0 ? (
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
                            ) : (
                                <div className="no-customers-message">
                                    {t('reservation.noCustomersSelected')}
                                </div>
                            )}
                        </>
                    )}
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
        </div>
    );
};

export default ReservationAdd;