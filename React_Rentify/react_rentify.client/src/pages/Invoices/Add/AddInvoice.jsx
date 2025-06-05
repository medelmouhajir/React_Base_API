// /src/pages/Invoices/Add/AddInvoice.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import invoiceService from '../../../services/invoiceService';
import reservationService from '../../../services/reservationService';
import './AddInvoice.css';

const AddInvoice = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const agencyId = user?.agencyId;

    const [formData, setFormData] = useState({
        ReservationId: '',
        IssuedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        Amount: '',
        IsPaid: false,
        Currency: 'MAD',
        PaymentMethod: '',
    });

    const [reservations, setReservations] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load reservations for this agency
        const fetchReservations = async () => {
            try {
                if (agencyId) {
                    const data = await reservationService.getByAgencyId(agencyId);
                    setReservations(data);
                }
            } catch (err) {
                console.error('❌ Error fetching reservations:', err);
            }
        };
        fetchReservations();
    }, [agencyId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            setError(t('invoice.add.error') || 'Error creating invoice.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/invoices');
    };

    return (
        <div className="addinvoice-container">
            <h1 className="addinvoice-title">{t('invoice.add.title') || 'Add Invoice'}</h1>

            {error && <div className="addinvoice-error">{error}</div>}

            <form className="addinvoice-form" onSubmit={handleSubmit} noValidate>
                {/* Reservation Select */}
                <div className="form-group">
                    <label htmlFor="ReservationId">{t('invoice.fields.reservation') || 'Reservation'}</label>
                    <select
                        id="ReservationId"
                        name="ReservationId"
                        value={formData.ReservationId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">{t('invoice.placeholders.selectReservation') || 'Select reservation'}</option>
                        {reservations.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.id}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Issued At */}
                <div className="form-group">
                    <label htmlFor="IssuedAt">{t('invoice.fields.issuedAt') || 'Issued At'}</label>
                    <input
                        type="datetime-local"
                        id="IssuedAt"
                        name="IssuedAt"
                        value={formData.IssuedAt}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Amount */}
                <div className="form-group">
                    <label htmlFor="Amount">{t('invoice.fields.amount') || 'Amount'}</label>
                    <input
                        type="number"
                        step="0.01"
                        id="Amount"
                        name="Amount"
                        placeholder={t('invoice.placeholders.amount') || 'Enter amount'}
                        value={formData.Amount}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Currency */}
                <div className="form-group">
                    <label htmlFor="Currency">{t('invoice.fields.currency') || 'Currency'}</label>
                    <input
                        type="text"
                        id="Currency"
                        name="Currency"
                        placeholder={t('invoice.placeholders.currency') || 'e.g. MAD'}
                        value={formData.Currency}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Payment Method */}
                <div className="form-group">
                    <label htmlFor="PaymentMethod">{t('invoice.fields.paymentMethod') || 'Payment Method'}</label>
                    <input
                        type="text"
                        id="PaymentMethod"
                        name="PaymentMethod"
                        placeholder={t('invoice.placeholders.paymentMethod') || 'e.g. Credit Card'}
                        value={formData.PaymentMethod}
                        onChange={handleChange}
                    />
                </div>

                {/* Is Paid Checkbox */}
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="IsPaid"
                        name="IsPaid"
                        checked={formData.IsPaid}
                        onChange={handleChange}
                    />
                    <label htmlFor="IsPaid">{t('invoice.fields.isPaid') || 'Paid'}</label>
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
                        {isSubmitting ? t('common.saving') || 'Saving...' : t('common.save') || 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddInvoice;
