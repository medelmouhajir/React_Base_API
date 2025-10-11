// src/pages/Invoices/Details/InvoiceDetails.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import invoiceService from '../../../services/invoiceService';
import reservationService from '../../../services/reservationService';
import './InvoiceDetails.css';

const InvoiceDetails = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();

    const [invoice, setInvoice] = useState(null);
    const [reservation, setReservation] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoiceData = async () => {
            try {
                setLoading(true);

                // Fetch invoice data
                const invoiceData = await invoiceService.getById(id);
                setInvoice(invoiceData);
                setPayments(invoiceData.payments || []);

                // Fetch reservation data if invoice has a reservation
                if (invoiceData.reservationId) {
                    try {
                        const reservationData = await reservationService.getById(invoiceData.reservationId);
                        setReservation(reservationData);
                    } catch (reservationError) {
                        console.warn('⚠️ Could not fetch reservation data:', reservationError);
                        // Continue without reservation data
                    }
                }
            } catch (err) {
                console.error('❌ Error fetching invoice:', err);
                setError(t('invoice.details.error') || 'Error loading invoice details.');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoiceData();
    }, [id, t]);

    const handleEdit = () => {
        navigate(`/invoices/edit/${id}`);
    };

    const handleRemove = async () => {
        const confirmDelete = window.confirm(
            t('invoice.details.confirmRemove') || 'Are you sure you want to delete this invoice?'
        );
        if (!confirmDelete) return;

        try {
            await invoiceService.delete(id);
            navigate('/invoices');
        } catch (err) {
            console.error('❌ Error deleting invoice:', err);
            setError(t('invoice.details.removeError') || 'Failed to delete invoice.');
        }
    };

    const handleAddPayment = () => {
        navigate(`/invoices/${id}/add-payment`);
    };

    const handlePrint = () => {
        navigate(`/invoices/${id}/print`);
    };

    const handleRemovePayment = async (paymentId) => {
        const confirmDelete = window.confirm(
            t('invoice.details.confirmRemovePayment') || 'Are you sure you want to remove this payment?'
        );

        if (!confirmDelete) return;

        try {
            await invoiceService.removePayment(id, paymentId);
            setPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
            setError(null);
        } catch (err) {
            console.error('❌ Error removing payment:', err);
            setError(t('invoice.details.removePaymentError') || 'Failed to remove payment.');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'reserved': return 'status-reserved';
            case 'ongoing': return 'status-ongoing';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-unknown';
        }
    };

    if (loading) {
        return (
            <div className="invoice-details-loading">
                <div className="loading-spinner"></div>
                <p>{t('invoice.details.loading') || 'Loading invoice details...'}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="invoice-details-error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={() => navigate('/invoices')} className="btn-back">
                    {t('common.back') || 'Back to Invoices'}
                </button>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="invoice-details-error">
                <div className="error-icon">📄</div>
                <p>{t('invoice.details.notFound') || 'Invoice not found.'}</p>
                <button onClick={() => navigate('/invoices')} className="btn-back">
                    {t('common.back') || 'Back to Invoices'}
                </button>
            </div>
        );
    }

    return (
        <div className="invoice-details-container">
            {/* Header Section */}
            <div className="invoice-details-header">
                <div className="header-content">
                    <div className="title-section">
                        <h1 className="page-title">
                            {t('invoice.details.title') || 'Invoice Details'}
                        </h1>
                        <div className="invoice-meta">
                            <span className="invoice-id">#{invoice.id.split('-')[0]}</span>
                            <div className={`payment-status ${invoice.isPaid ? 'paid' : 'unpaid'}`}>
                                {invoice.isPaid ? '✓ Paid' : '⏳ Unpaid'}
                            </div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-action btn-edit" onClick={handleEdit}>
                            <span className="btn-icon">✏️</span>
                            {t('common.edit') || 'Edit'}
                        </button>
                        <button className="btn-action btn-print" onClick={handlePrint}>
                            <span className="btn-icon">🖨️</span>
                            {t('common.print') || 'Print'}
                        </button>
                        <button className="btn-action btn-delete" onClick={handleRemove}>
                            <span className="btn-icon">🗑️</span>
                            {t('common.remove') || 'Remove'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="invoice-details-grid">
                {/* Invoice Information Card */}
                <div className="details-card invoice-info-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <span className="card-icon">📋</span>
                            {t('invoice.sections.details') || 'Invoice Information'}
                        </h2>
                    </div>
                    <div className="card-content">
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">{t('invoice.fields.issuedAt') || 'Issued Date'}</span>
                                <span className="info-value">{formatDate(invoice.issuedAt)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">{t('invoice.fields.amount') || 'Amount'}</span>
                                <span className="info-value amount">{formatCurrency(invoice.amount)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">{t('invoice.fields.currency') || 'Currency'}</span>
                                <span className="info-value">{invoice.currency || 'MAD'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">{t('invoice.fields.paymentMethod') || 'Payment Method'}</span>
                                <span className="info-value">{invoice.paymentMethod || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reservation Details Card */}
                {reservation && (
                    <div className="details-card reservation-info-card">
                        <div className="card-header">
                            <h2 className="card-title">
                                <span className="card-icon">🚗</span>
                                {t('invoice.sections.reservation') || 'Reservation Details'}
                            </h2>
                            <div className={`reservation-status ${getStatusColor(reservation.status)}`}>
                                {reservation.status}
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="reservation-summary">
                                <div className="car-info">
                                    <div className="car-details">
                                        <h3 className="car-model">{reservation.car.car_Model.name}</h3>
                                        <p className="car-plate">{reservation.car.licensePlate}</p>
                                    </div>
                                </div>
                                <div className="reservation-dates">
                                    <div className="date-range">
                                        <div className="date-item">
                                            <span className="date-label">{t('invoice.filters.from') }</span>
                                            <span className="date-value">{formatDate(reservation.startDate)}</span>
                                        </div>
                                        <div className="date-separator">→</div>
                                        <div className="date-item">
                                            <span className="date-label">{t('invoice.filters.to')}</span>
                                            <span className="date-value">{formatDate(reservation.endDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="reservation-pricing">
                                <div className="price-item">
                                    <span className="price-label">{t('reservation.fields.agreedPrice')}</span>
                                    <span className="price-value">{formatCurrency(reservation.agreedPrice)}</span>
                                </div>
                                {reservation.finalPrice && (
                                    <div className="price-item">
                                        <span className="price-label">{t('reservation.fields.finalPrice')}</span>
                                        <span className="price-value final">{formatCurrency(reservation.finalPrice)}</span>
                                    </div>
                                )}
                            </div>

                            {(reservation.pickupLocation || reservation.dropoffLocation) && (
                                <div className="location-info">
                                    {reservation.pickupLocation && (
                                        <div className="location-item">
                                            <span className="location-label">📍 {t('reservation.fields.pickupLocation')}</span>
                                            <span className="location-value">{reservation.pickupLocation}</span>
                                        </div>
                                    )}
                                    {reservation.dropoffLocation && (
                                        <div className="location-item">
                                            <span className="location-label">📍 {t('reservation.fields.dropoffLocation')}</span>
                                            <span className="location-value">{reservation.dropoffLocation}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Customers List Card */}
                {reservation?.customers && reservation.customers.length > 0 && (
                    <div className="details-card customers-card">
                        <div className="card-header">
                            <h2 className="card-title">
                                <span className="card-icon">👥</span>
                                {t('reservation.fields.customers')  || 'Customers'} ({reservation.customers.length})
                            </h2>
                        </div>
                        <div className="card-content">
                            <div className="customers-list">
                                {reservation.customers.map((customer, index) => (
                                    <div key={customer.id || index} className="customer-item">
                                        <div className="customer-avatar">
                                            {customer.fullName?.charAt(0) || '👤'}
                                        </div>
                                        <div className="customer-details">
                                            <h4 className="customer-name">{customer.fullName || 'N/A'}</h4>
                                            <div className="customer-contact">
                                                {customer.phoneNumber && (
                                                    <span className="contact-item">
                                                        📞 {customer.phoneNumber}
                                                    </span>
                                                )}
                                                {customer.email && (
                                                    <span className="contact-item">
                                                        📧 {customer.email}
                                                    </span>
                                                )}
                                            </div>
                                            {customer.address && (
                                                <p className="customer-address">
                                                    📍 {customer.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payments Section */}
                <div className="details-card payments-card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <span className="card-icon">💳</span>
                            {t('invoice.sections.payment') || 'Payments'} ({payments.length})
                        </h2>
                        <button className="btn-add-payment" onClick={handleAddPayment}>
                            <span className="btn-icon">➕</span>
                            {t('invoice.details.addPayment') || 'Add Payment'}
                        </button>
                    </div>
                    <div className="card-content">
                        {payments.length === 0 ? (
                            <div className="no-payments">
                                <div className="empty-state">
                                    <span className="empty-icon">💰</span>
                                    <p>{t('payments.noPayments') || 'No payments recorded yet.'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="payments-list">
                                {payments.map((payment) => (
                                    <div key={payment.id} className="payment-item">
                                        <div className="payment-details">
                                            <div className="payment-header">
                                                <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                                                <span className="payment-date">{formatDate(payment.paidAt)}</span>
                                            </div>
                                            <div className="payment-meta">
                                                <span className="payment-method">{t('payment.methods.' + payment.method.toLowerCase()) || 'N/A'}</span>
                                                {payment.notes && (
                                                    <span className="payment-notes">{payment.notes}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="btn-remove-payment"
                                            onClick={() => handleRemovePayment(payment.id)}
                                            title={t('common.remove') || 'Remove payment'}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;