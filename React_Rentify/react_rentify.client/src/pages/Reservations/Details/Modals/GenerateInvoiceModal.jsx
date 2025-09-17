// src/pages/Reservation/Details/Modals/GenerateInvoiceModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import './ModalStyles.css';

const GenerateInvoiceModal = ({ reservation, onClose, onSubmit }) => {
    const { t } = useTranslation();

    // Calculate default values
    const calculateTotal = () => {
        return reservation.finalPrice ?? reservation.agreedPrice ?? 0;
    };

    const [formData, setFormData] = useState({
        amount: calculateTotal(),
        currency: 'MAD',
        paymentMethod: 'Cash',
        issuedAt: new Date().toISOString().split('T')[0],
        isPaid: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            amount: parseFloat(formData.amount),
            issuedAt: new Date(formData.issuedAt).toISOString()
        });
    };

    return (
        <Modal title={t('invoice.generate.title')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-section">
                    <h3>{t('invoice.generate.reservationDetails')}</h3>
                    <div className="reservation-summary">
                        <div className="summary-row">
                            <span className="summary-label">{t('reservation.fields.car')}:</span>
                            <span className="summary-value">
                                {reservation.car?.car_Model?.car_Manufacturer?.name} {reservation.car?.car_Model?.name} ({reservation.car?.licensePlate})
                            </span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">{t('reservation.fields.period')}:</span>
                            <span className="summary-value">
                                {new Date(reservation.startDate).toLocaleDateString()} → {new Date(reservation.endDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">{t('reservation.fields.customer')}:</span>
                            <span className="summary-value">
                                {reservation.customers?.map(c => c.fullName).join(', ')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="amount">{t('invoice.fields.amount')}</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="currency">{t('invoice.fields.currency')}</label>
                    <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        required
                    >
                        <option value="MAD">MAD</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="paymentMethod">{t('invoice.fields.paymentMethod')}</label>
                    <select
                        id="paymentMethod"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        required
                    >
                        <option value="Cash">{t('payment.methods.cash')}</option>
                        <option value="Card">{t('payment.methods.card')}</option>
                        <option value="Bank Transfer">{t('payment.methods.bankTransfer')}</option>
                        <option value="PayPal">PayPal</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="issuedAt">{t('invoice.fields.issuedAt')}</label>
                    <input
                        type="date"
                        id="issuedAt"
                        name="issuedAt"
                        value={formData.issuedAt}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group checkbox">
                    <input
                        type="checkbox"
                        id="isPaid"
                        name="isPaid"
                        checked={formData.isPaid}
                        onChange={handleChange}
                    />
                    <label htmlFor="isPaid">{t('invoice.fields.markAsPaid')}</label>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn-submit">
                        {t('invoice.generate.submit')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default GenerateInvoiceModal;