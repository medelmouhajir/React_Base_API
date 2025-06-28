// src/pages/Reservation/Details/Modals/AddPaymentModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import './ModalStyles.css';

const AddPaymentModal = ({ invoice, onClose, onSubmit }) => {
    const { t } = useTranslation();

    // Calculate remaining balance
    const calculateRemainingBalance = () => {
        const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        return Math.max(0, invoice.amount - totalPaid).toFixed(2);
    };

    const [formData, setFormData] = useState({
        amount: calculateRemainingBalance(),
        method: 'Cash',
        transactionId: '',
        paidAt: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            amount: parseFloat(formData.amount),
            paidAt: new Date(formData.paidAt).toISOString()
        });
    };

    return (
        <Modal title={t('payment.add.title')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-section">
                    <h3>{t('payment.add.invoiceDetails')}</h3>
                    <div className="invoice-summary">
                        <div className="summary-row">
                            <span className="summary-label">{t('invoice.fields.invoiceNumber')}:</span>
                            <span className="summary-value">#{invoice.id.substring(0, 8)}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">{t('invoice.fields.totalAmount')}:</span>
                            <span className="summary-value">{invoice.amount.toFixed(2)} {invoice.currency}</span>
                        </div>
                        <div className="summary-row highlight">
                            <span className="summary-label">{t('invoice.fields.remainingBalance')}:</span>
                            <span className="summary-value">{calculateRemainingBalance()} {invoice.currency}</span>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="amount">{t('payment.fields.amount')}</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        min="0"
                        max={calculateRemainingBalance()}
                        step="0.01"
                        required
                    />
                    <small className="input-hint">{t('payment.add.amountHint')}</small>
                </div>

                <div className="form-group">
                    <label htmlFor="method">{t('payment.fields.method')}</label>
                    <select
                        id="method"
                        name="method"
                        value={formData.method}
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
                    <label htmlFor="transactionId">{t('payment.fields.transactionId')}</label>
                    <input
                        type="text"
                        id="transactionId"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleChange}
                        placeholder={t('payment.add.transactionIdPlaceholder')}
                    />
                    <small className="input-hint">{t('payment.add.transactionIdHint')}</small>
                </div>

                <div className="form-group">
                    <label htmlFor="paidAt">{t('payment.fields.paidAt')}</label>
                    <input
                        type="date"
                        id="paidAt"
                        name="paidAt"
                        value={formData.paidAt}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn-submit">
                        {t('payment.add.submit')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddPaymentModal;