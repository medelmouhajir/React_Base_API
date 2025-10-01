// src/pages/Invoices/AddPayment/AddPayment.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import invoiceService from '../../../services/invoiceService';
import './AddPayment.css';

const AddPayment = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams(); // Invoice ID
    const { isDarkMode } = useTheme();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Form state matching CreatePaymentDto
    const [formData, setFormData] = useState({
        paidAt: new Date().toISOString().slice(0, 16), // datetime-local format
        amount: '',
        method: 'Cash',
        transactionId: ''
    });

    const [validationErrors, setValidationErrors] = useState({});

    // Payment methods
    const paymentMethods = ['Cash', 'Card', 'Transfer', 'Check', 'Mobile', 'Other'];

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const data = await invoiceService.getById(id);
                setInvoice(data);

                // Calculate remaining balance
                const totalPaid = (data.payments || []).reduce((sum, p) => sum + p.amount, 0);
                const remaining = data.amount - totalPaid;

                // Pre-fill amount with remaining balance
                if (remaining > 0) {
                    setFormData(prev => ({
                        ...prev,
                        amount: remaining.toFixed(2)
                    }));
                }
            } catch (err) {
                console.error('❌ Error fetching invoice:', err);
                setError(t('payment.add.fetchError') || 'Failed to load invoice details.');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = t('payment.validation.amount') || 'Amount must be greater than 0';
        }

        if (!formData.method) {
            errors.method = t('payment.validation.method') || 'Payment method is required';
        }

        if (!formData.paidAt) {
            errors.paidAt = t('payment.validation.paidAt') || 'Payment date is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Prepare DTO matching CreatePaymentDto
            const paymentDto = {
                paidAt: new Date(formData.paidAt).toISOString(),
                amount: parseFloat(formData.amount),
                method: formData.method,
                transactionId: formData.transactionId || ''
            };

            await invoiceService.addPayment(id, paymentDto);

            // Success - navigate back to invoice details
            navigate(`/invoices/${id}`);
        } catch (err) {
            console.error('❌ Error adding payment:', err);
            setError(
                err.response?.data?.message ||
                t('payment.add.submitError') ||
                'Failed to add payment. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate(`/invoices/${id}`);
    };

    const calculateBalanceDue = () => {
        if (!invoice) return 0;
        const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + p.amount, 0);
        return Math.max(invoice.amount - totalPaid, 0);
    };

    const formatCurrency = (value) => {
        const currency = invoice?.currency || 'MAD';
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency
            }).format(value || 0);
        } catch {
            return `${(value || 0).toFixed(2)} ${currency}`;
        }
    };

    if (loading) {
        return (
            <div className={`addpayment-container ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error && !invoice) {
        return (
            <div className={`addpayment-container ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="error-state">
                    <p className="error-message">{error}</p>
                    <button onClick={() => navigate('/invoices')} className="btn-secondary">
                        {t('common.back') || 'Back to Invoices'}
                    </button>
                </div>
            </div>
        );
    }

    const balanceDue = calculateBalanceDue();

    return (
        <div className={`addpayment-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="addpayment-header">
                <h1 className="addpayment-title">
                    {t('payment.add.title') || 'Add Payment'}
                </h1>
                <p className="addpayment-subtitle">
                    {t('payment.add.subtitle') || 'Record a new payment for this invoice'}
                </p>
            </div>

            {/* Invoice Summary */}
            <div className="invoice-summary">
                <div className="summary-header">
                    <h2 className="summary-title">
                        {t('payment.add.invoiceSummary') || 'Invoice Summary'}
                    </h2>
                </div>
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="summary-label">
                            {t('invoice.fields.id') || 'Invoice ID'}:
                        </span>
                        <span className="summary-value">
                            #{invoice?.id?.slice(0, 8).toUpperCase()}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">
                            {t('invoice.fields.amount') || 'Total Amount'}:
                        </span>
                        <span className="summary-value">
                            {formatCurrency(invoice?.amount)}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">
                            {t('payment.add.paidAmount') || 'Paid Amount'}:
                        </span>
                        <span className="summary-value">
                            {formatCurrency(invoice?.amount - balanceDue)}
                        </span>
                    </div>
                    <div className="summary-item highlight">
                        <span className="summary-label">
                            {t('payment.add.balanceDue') || 'Balance Due'}:
                        </span>
                        <span className="summary-value balance-due">
                            {formatCurrency(balanceDue)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="addpayment-form">
                <div className="form-section">
                    <h3 className="section-title">
                        {t('payment.add.paymentDetails') || 'Payment Details'}
                    </h3>

                    <div className="form-grid">
                        {/* Payment Date */}
                        <div className="form-group">
                            <label htmlFor="paidAt" className="form-label required">
                                {t('payment.fields.paidAt') || 'Payment Date'}
                            </label>
                            <input
                                type="datetime-local"
                                id="paidAt"
                                name="paidAt"
                                value={formData.paidAt}
                                onChange={handleChange}
                                className={`form-input ${validationErrors.paidAt ? 'input-error' : ''}`}
                                disabled={submitting}
                                required
                            />
                            {validationErrors.paidAt && (
                                <span className="error-text">{validationErrors.paidAt}</span>
                            )}
                        </div>

                        {/* Payment Amount */}
                        <div className="form-group">
                            <label htmlFor="amount" className="form-label required">
                                {t('payment.fields.amount') || 'Amount'}
                            </label>
                            <div className="amount-input-wrapper">
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className={`form-input amount-input ${validationErrors.amount ? 'input-error' : ''}`}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0.01"
                                    disabled={submitting}
                                    required
                                />
                                <span className="currency-label">
                                    {invoice?.currency || 'MAD'}
                                </span>
                            </div>
                            {validationErrors.amount && (
                                <span className="error-text">{validationErrors.amount}</span>
                            )}
                            {balanceDue > 0 && (
                                <span className="input-hint">
                                    {t('payment.add.balanceDueHint') || 'Remaining balance'}: {formatCurrency(balanceDue)}
                                </span>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="form-group">
                            <label htmlFor="method" className="form-label required">
                                {t('payment.fields.method') || 'Payment Method'}
                            </label>
                            <select
                                id="method"
                                name="method"
                                value={formData.method}
                                onChange={handleChange}
                                className={`form-select ${validationErrors.method ? 'input-error' : ''}`}
                                disabled={submitting}
                                required
                            >
                                {paymentMethods.map(method => (
                                    <option key={method} value={method}>
                                        {t(`payment.methods.${method.toLowerCase()}`) || method}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.method && (
                                <span className="error-text">{validationErrors.method}</span>
                            )}
                        </div>

                        {/* Transaction ID */}
                        <div className="form-group">
                            <label htmlFor="transactionId" className="form-label">
                                {t('payment.fields.transactionId') || 'Transaction ID / Reference'}
                            </label>
                            <input
                                type="text"
                                id="transactionId"
                                name="transactionId"
                                value={formData.transactionId}
                                onChange={handleChange}
                                className="form-input"
                                placeholder={t('payment.fields.transactionIdPlaceholder') || 'Optional'}
                                disabled={submitting}
                            />
                            <span className="input-hint">
                                {t('payment.add.transactionIdHint') || 'Check number, transfer ID, or transaction reference'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="btn-secondary"
                        disabled={submitting}
                    >
                        <span className="btn-icon">✕</span>
                        {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting || balanceDue === 0}
                    >
                        {submitting ? (
                            <>
                                <span className="btn-spinner"></span>
                                {t('common.saving') || 'Saving...'}
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">✓</span>
                                {t('payment.add.submit') || 'Add Payment'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {balanceDue === 0 && (
                <div className="info-banner">
                    <span className="info-icon">ℹ️</span>
                    <span>
                        {t('payment.add.fullyPaid') || 'This invoice has been fully paid.'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default AddPayment;