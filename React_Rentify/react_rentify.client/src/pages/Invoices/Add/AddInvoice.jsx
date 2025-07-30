// src/pages/Invoices/Add/AddInvoice.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import invoiceService from '../../../services/invoiceService';
import reservationService from '../../../services/reservationService';
import customerService from '../../../services/customerService';
import carService from '../../../services/carService';
import './AddInvoice.css';

const AddInvoice = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        ReservationId: '',
        IssuedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        Amount: '',
        IsPaid: false,
        Currency: 'MAD',
        PaymentMethod: '',
    });

    // State for data and UI
    const [reservations, setReservations] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cars, setCars] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Search and filter states
    const [reservationSearch, setReservationSearch] = useState('');
    const [showReservationDetails, setShowReservationDetails] = useState(false);

    // Load all necessary data
    useEffect(() => {
        const fetchAllData = async () => {
            if (!agencyId) return;

            setIsLoading(true);
            try {
                const [reservationsData, customersData, carsData] = await Promise.all([
                    reservationService.getByAgencyId(agencyId),
                    customerService.getByAgencyId(agencyId),
                    carService.getByAgencyId(agencyId),
                ]);

                setReservations(reservationsData || []);
                setCustomers(customersData || []);
                setCars(carsData || []);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError(t('invoice.add.fetchError') || 'Failed to load required data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [agencyId, t]);

    // Enhanced reservation filtering with search
    const filteredReservations = useMemo(() => {
        if (!reservationSearch.trim()) return reservations;

        const searchLower = reservationSearch.toLowerCase();
        return reservations.filter(reservation => {
            const car = cars.find(c => c.id === reservation.carId);
            const customerNames = reservation.customers?.map(rc =>
                rc?.fullName || ''
            ).join(' ') || '';

            return (
                reservation.id.toLowerCase().includes(searchLower) ||
                reservation.status?.toLowerCase().includes(searchLower) ||
                reservation.pickupLocation?.toLowerCase().includes(searchLower) ||
                reservation.dropoffLocation?.toLowerCase().includes(searchLower) ||
                customerNames.toLowerCase().includes(searchLower) ||
                car?.make?.toLowerCase().includes(searchLower) ||
                car?.model?.toLowerCase().includes(searchLower) ||
                car?.licensePlate?.toLowerCase().includes(searchLower)
            );
        });
    }, [reservations, reservationSearch, cars, customers]);

    // Get selected reservation details
    const selectedReservation = useMemo(() => {
        if (!formData.ReservationId) return null;
        return reservations.find(r => r.id === formData.ReservationId);
    }, [formData.ReservationId, reservations]);

    // Get reservation display info
    const getReservationDisplayInfo = (reservation) => {
        const car = cars.find(c => c.id === reservation.carId);
        const customerNames = reservation.customers?.map(rc => {
            return rc?.fullName || 'Unknown Customer';
        }).join(', ') || 'No customers';

        return {
            car: car ? `${car.fields.manufacturer} ${car.fields.model} (${car.licensePlate})` : 'Unknown Car',
            customers: customerNames,
            period: `${new Date(reservation.startDate).toLocaleDateString()} - ${new Date(reservation.endDate).toLocaleDateString()}`,
            status: reservation.status,
            agreedPrice: reservation.agreedPrice
        };
    };

    // Auto-calculate amount based on selected reservation
    useEffect(() => {
        if (selectedReservation && !formData.Amount) {
            const amount = selectedReservation.finalPrice || selectedReservation.agreedPrice || '';
            setFormData(prev => ({
                ...prev,
                Amount: amount.toString()
            }));
        }
    }, [selectedReservation, formData.Amount]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleReservationSelect = (reservationId) => {
        setFormData(prev => ({
            ...prev,
            ReservationId: reservationId
        }));
        setReservationSearch('');
        setShowReservationDetails(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.ReservationId) {
            setError(t('invoice.add.selectReservationError') || 'Please select a reservation');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                ReservationId: formData.ReservationId,
                IssuedAt: new Date(formData.IssuedAt),
                Amount: parseFloat(formData.Amount),
                IsPaid: formData.IsPaid,
                Currency: formData.Currency,
                PaymentMethod: formData.PaymentMethod,
            };

            await invoiceService.create(payload);
            navigate('/invoices');
        } catch (err) {
            console.error('❌ Error creating invoice:', err);
            setError(t('invoice.add.error') || 'Error creating invoice. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/invoices');
    };

    if (isLoading) {
        return (
            <div className={`addinvoice-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="loading-message">
                    {t('common.loading') || 'Loading...'}
                </div>
            </div>
        );
    }

    return (
        <div className={`addinvoice-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="addinvoice-header">
                <h1 className="addinvoice-title">
                    {t('invoice.add.title') || 'Create New Invoice'}
                </h1>
                <p className="addinvoice-subtitle">
                    {t('invoice.add.subtitle') || 'Generate an invoice for a completed reservation'}
                </p>
            </div>

            {error && (
                <div className="addinvoice-error">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            <form className="addinvoice-form" onSubmit={handleSubmit} noValidate>
                {/* Reservation Selection Section */}
                <div className="form-section">
                    <h3 className="section-title">
                        {t('invoice.sections.reservation') || 'Reservation Details'}
                    </h3>

                    {/* Reservation Search */}
                    <div className="form-group">
                        <label htmlFor="reservationSearch" className="form-label">
                            {t('invoice.fields.searchReservation') || 'Search Reservation'}
                        </label>
                        <div className="search-container-invoices">
                            <input
                                type="text"
                                id="reservationSearch"
                                className="search-input-invoices"
                                placeholder={t('invoice.placeholders.searchReservation') || 'Search by ID, customer, car, or location...'}
                                value={reservationSearch}
                                onChange={(e) => setReservationSearch(e.target.value)}
                            />
                            <span className="search-icon-invoices">🔍</span>
                        </div>
                    </div>

                    {/* Reservation Dropdown */}
                    <div className="form-group">
                        <label htmlFor="ReservationId" className="form-label required">
                            {t('invoice.fields.reservation') || 'Select Reservation'}
                        </label>
                        <select
                            id="ReservationId"
                            name="ReservationId"
                            value={formData.ReservationId}
                            onChange={(e) => handleReservationSelect(e.target.value)}
                            className="form-select"
                            required
                        >
                            <option value="">
                                {t('invoice.placeholders.selectReservation') || 'Choose a reservation...'}
                            </option>
                            {filteredReservations.map((reservation) => {
                                const info = getReservationDisplayInfo(reservation);
                                return (
                                    <option key={reservation.id} value={reservation.id}>
                                        {`${reservation.id.slice(0, 8)}... - ${info.car} - ${info.customers}`}
                                    </option>
                                );
                            })}
                        </select>
                        {filteredReservations.length === 0 && reservationSearch && (
                            <div className="no-results">
                                {t('invoice.noReservationsFound') || 'No reservations found matching your search'}
                            </div>
                        )}
                    </div>

                    {/* Selected Reservation Details */}
                    {selectedReservation && showReservationDetails && (
                        <div className="reservation-details">
                            <h4 className="details-title">
                                {t('invoice.selectedReservation') || 'Selected Reservation'}
                            </h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">
                                        {t('reservation.fields.car') || 'Car'}:
                                    </span>
                                    <span className="detail-value">
                                        {getReservationDisplayInfo(selectedReservation).car}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        {t('reservation.fields.customers') || 'Customers'}:
                                    </span>
                                    <span className="detail-value">
                                        {getReservationDisplayInfo(selectedReservation).customers}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        {t('reservation.fields.period') || 'Period'}:
                                    </span>
                                    <span className="detail-value">
                                        {getReservationDisplayInfo(selectedReservation).period}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        {t('reservation.fields.status') || 'Status'}:
                                    </span>
                                    <span className={`detail-value status-${selectedReservation.status?.toLowerCase()}`}>
                                        {selectedReservation.status}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        {t('reservation.fields.agreedPrice') || 'Agreed Price'}:
                                    </span>
                                    <span className="detail-value">
                                        {selectedReservation.agreedPrice ? `${selectedReservation.agreedPrice} MAD` : 'Not set'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Invoice Details Section */}
                <div className="form-section">
                    <h3 className="section-title">
                        {t('invoice.sections.details') || 'Invoice Details'}
                    </h3>

                    <div className="form-grid">
                        {/* Issued At */}
                        <div className="form-group">
                            <label htmlFor="IssuedAt" className="form-label required">
                                {t('invoice.fields.issuedAt') || 'Issue Date & Time'}
                            </label>
                            <input
                                type="datetime-local"
                                id="IssuedAt"
                                name="IssuedAt"
                                value={formData.IssuedAt}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        {/* Amount */}
                        <div className="form-group">
                            <label htmlFor="Amount" className="form-label required">
                                {t('invoice.fields.amount') || 'Amount'}
                            </label>
                            <div className="amount-input-container">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    id="Amount"
                                    name="Amount"
                                    placeholder={t('invoice.placeholders.amount') || '0.00'}
                                    value={formData.Amount}
                                    onChange={handleChange}
                                    className="form-input amount-input"
                                    required
                                />
                                <span className="currency-suffix">{formData.Currency}</span>
                            </div>
                        </div>

                        {/* Currency */}
                        <div className="form-group">
                            <label htmlFor="Currency" className="form-label">
                                {t('invoice.fields.currency') || 'Currency'}
                            </label>
                            <select
                                id="Currency"
                                name="Currency"
                                value={formData.Currency}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="MAD">MAD - Moroccan Dirham</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="GBP">GBP - British Pound</option>
                            </select>
                        </div>

                        {/* Payment Method */}
                        <div className="form-group">
                            <label htmlFor="PaymentMethod" className="form-label">
                                {t('invoice.fields.paymentMethod') || 'Payment Method'}
                            </label>
                            <select
                                id="PaymentMethod"
                                name="PaymentMethod"
                                value={formData.PaymentMethod}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="">
                                    {t('invoice.placeholders.selectPaymentMethod') || 'Select payment method...'}
                                </option>
                                <option value="Cash">Cash</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Debit Card">Debit Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Check">Check</option>
                                <option value="Mobile Payment">Mobile Payment</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Payment Status Section */}
                <div className="form-section">
                    <h3 className="section-title">
                        {t('invoice.sections.payment') || 'Payment Status'}
                    </h3>

                    <div className="form-group checkbox-group">
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                id="IsPaid"
                                name="IsPaid"
                                checked={formData.IsPaid}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                            <label htmlFor="IsPaid" className="checkbox-label">
                                <span className="checkbox-text">
                                    {t('invoice.fields.isPaid') || 'Mark as paid'}
                                </span>
                                <span className="checkbox-description">
                                    {t('invoice.fields.isPaidDescription') || 'Check this if payment has been received'}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        <span className="btn-icon">↩️</span>
                        {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting || !formData.ReservationId}
                    >
                        <span className="btn-icon">
                            {isSubmitting ? '⏳' : '💾'}
                        </span>
                        {isSubmitting
                            ? (t('common.creating') || 'Creating...')
                            : (t('common.createInvoice') || 'Create Invoice')
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddInvoice;