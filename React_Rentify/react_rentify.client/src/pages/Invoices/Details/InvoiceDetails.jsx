// src/pages/Invoices/Details/InvoiceDetails.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import invoiceService from '../../../services/invoiceService';
import './InvoiceDetails.css';

const InvoiceDetails = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();

    const [invoice, setInvoice] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const data = await invoiceService.getById(id);
                setInvoice(data);
                setPayments(data.payments || []);
            } catch (err) {
                console.error('❌ Error fetching invoice:', err);
                setError(t('invoice.details.error') || 'Error loading invoice details.');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id, t]);

    const handleEdit = () => {
        navigate(`/invoices/edit/${id}`);
    };

    const handleRemove = async () => {
        const confirmDelete = window.confirm(t('invoice.details.confirmRemove') || 'Are you sure you want to delete this invoice?');
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

    const handleRemovePayment = async (paymentId) => {
        const confirmDelete = window.confirm(
            t('invoice.details.confirmRemovePayment') || 'Are you sure you want to remove this payment?'
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await invoiceService.removePayment(id, paymentId);
            setPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== paymentId));
            setError(null);
        } catch (err) {
            console.error('❌ Error removing payment:', err);
            setError(t('invoice.details.removePaymentError') || 'Failed to remove payment.');
        }
    };

    if (loading) {
        return (
            <div className="invoicedetails-loading">
                {t('invoice.details.loading') || 'Loading...'}
            </div>
        );
    }

    if (error) {
        return (
            <div className="invoicedetails-error">
                {error}
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="invoicedetails-error">
                {t('invoice.details.notFound') || 'Invoice not found.'}
            </div>
        );
    }

    return (
        <div className="invoicedetails-container">
            <div className="invoicedetails-header">
                <h1 className="invoicedetails-title">
                    {t('invoice.details.title') || 'Invoice Details'}
                </h1>
                <div className="invoicedetails-actions">
                    <button className="btn-secondary" onClick={handleEdit}>
                        {t('common.edit') || 'Edit'}
                    </button>
                    <button className="btn-remove" onClick={handleRemove}>
                        {t('common.remove') || 'Remove'}
                    </button>
                </div>
            </div>

            <div className="invoicedetails-info">
                <div className="info-row">
                    <span className="info-label">{t('invoice.fields.id') || 'Invoice ID'}:</span>
                    <span className="info-value">{invoice.id}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">{t('invoice.fields.reservation') || 'Reservation ID'}:</span>
                    <span className="info-value">{invoice.reservationId}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">{t('invoice.fields.issuedAt') || 'Issued At'}:</span>
                    <span className="info-value">
                        {new Date(invoice.issuedAt).toLocaleString()}
                    </span>
                </div>
                <div className="info-row">
                    <span className="info-label">{t('invoice.fields.amount') || 'Amount'}:</span>
                    <span className="info-value">{invoice.amount.toFixed(2)}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">{t('invoice.fields.isPaid') || 'Paid'}:</span>
                    <span className="info-value">
                        {invoice.isPaid ? (t('common.yes') || 'Yes') : (t('common.no') || 'No')}
                    </span>
                </div>
                <div className="info-row">
                    <span className="info-label">{t('invoice.fields.currency') || 'Currency'}:</span>
                    <span className="info-value">{invoice.currency}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">{t('invoice.fields.paymentMethod') || 'Payment Method'}:</span>
                    <span className="info-value">{invoice.paymentMethod}</span>
                </div>
            </div>

            <div className="invoicedetails-payments-header">
                <h2 className="payments-title">
                    {t('invoice.details.paymentsTitle') || 'Payments'}
                </h2>
                <button className="btn-add-payment" onClick={handleAddPayment}>
                    {t('invoice.details.addPayment') || 'Add Payment'}
                </button>
            </div>

            {payments.length === 0 ? (
                <div className="no-payments">
                    {t('invoice.details.noPayments') || 'No payments recorded.'}
                </div>
            ) : (
                <div className="payments-list">
                    {payments.map((p) => (
                        <div key={p.id} className="payment-card">
                            <div className="payment-row">
                                <span className="payment-label">{t('payment.fields.paidAt') || 'Paid At'}:</span>
                                <span className="payment-value">
                                    {new Date(p.paidAt).toLocaleString()}
                                </span>
                            </div>
                            <div className="payment-row">
                                <span className="payment-label">{t('payment.fields.amount') || 'Amount'}:</span>
                                <span className="payment-value">{p.amount.toFixed(2)}</span>
                            </div>
                            <div className="payment-row">
                                <span className="payment-label">{t('payment.fields.method') || 'Method'}:</span>
                                <span className="payment-value">{p.method}</span>
                            </div>
                            <div className="payment-row">
                                <span className="payment-label">{t('payment.fields.transactionId') || 'Transaction ID'}:</span>
                                <span className="payment-value">{p.transactionId}</span>
                            </div>
                            <div className="payment-actions">
                                <button
                                    type="button"
                                    className="btn-remove-payment"
                                    onClick={() => handleRemovePayment(p.id)}
                                >
                                    {t('invoice.details.removePayment') || t('common.remove') || 'Remove'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InvoiceDetails;
