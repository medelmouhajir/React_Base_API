// src/pages/Reservation/Details/Modals/EditPricesModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import './ModalStyles.css';

const EditPricesModal = ({ reservation, onClose, onSubmit }) => {
    const { t } = useTranslation();

    // Calculate default values
    const calculateDays = () => {
        const startDate = new Date(reservation.startDate);
        const endDate = new Date(reservation.endDate);
        return Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    };

    const [formData, setFormData] = useState({
        agreedPrice: reservation.agreedPrice || 0,
        finalPrice: reservation.finalPrice || reservation.agreedPrice || 0,
        pricePerDay: Math.round((reservation.agreedPrice || 0) / calculateDays()),
        additionalFees: 0,
        additionalFeesReason: '',
        discount: 0,
        discountReason: ''
    });

    const days = calculateDays();

    const handleChange = (e) => {
        const { name, value } = e.target;
        const numericValue = parseFloat(value) || 0;

        let updatedFormData = {
            ...formData,
            [name]: value
        };

        // Auto-calculate agreedPrice when pricePerDay changes
        if (name === 'pricePerDay') {
            updatedFormData.agreedPrice = numericValue * days;
            updatedFormData.finalPrice = updatedFormData.agreedPrice +
                (parseFloat(formData.additionalFees) || 0) -
                (parseFloat(formData.discount) || 0);
        }

        // Auto-calculate finalPrice when agreedPrice, additionalFees, or discount changes
        if (name === 'agreedPrice' || name === 'additionalFees' || name === 'discount') {
            const agreedPrice = name === 'agreedPrice' ? numericValue : parseFloat(formData.agreedPrice) || 0;
            const additionalFees = name === 'additionalFees' ? numericValue : parseFloat(formData.additionalFees) || 0;
            const discount = name === 'discount' ? numericValue : parseFloat(formData.discount) || 0;

            updatedFormData.finalPrice = agreedPrice + additionalFees - discount;

            if (name === 'agreedPrice') {
                updatedFormData.pricePerDay = Math.round(numericValue / days);
            }
        }

        setFormData(updatedFormData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const priceData = {
            agreedPrice: parseFloat(formData.agreedPrice),
            finalPrice: parseFloat(formData.finalPrice),
            additionalFees: parseFloat(formData.additionalFees) || 0,
            additionalFeesReason: formData.additionalFeesReason,
            discount: parseFloat(formData.discount) || 0,
            discountReason: formData.discountReason
        };

        onSubmit(priceData);
    };

    return (
        <Modal title={t('reservation.editPrices.title')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-section">
                    <h3>{t('reservation.editPrices.reservationInfo')}</h3>
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
                            <span className="summary-label">{t('reservation.fields.days')}:</span>
                            <span className="summary-value">{days} {t('reservation.fields.daysUnit')}</span>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>{t('reservation.editPrices.basePricing')}</h3>

                    <div className="form-group">
                        <label htmlFor="pricePerDay">{t('reservation.fields.pricePerDay')}</label>
                        <input
                            type="number"
                            id="pricePerDay"
                            name="pricePerDay"
                            value={formData.pricePerDay}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                        />
                        <small className="input-hint">
                            {t('reservation.editPrices.pricePerDayHint', { days })}
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="agreedPrice">{t('reservation.fields.agreedPrice')}</label>
                        <input
                            type="number"
                            id="agreedPrice"
                            name="agreedPrice"
                            value={formData.agreedPrice}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                        />
                        <small className="input-hint">
                            {t('reservation.editPrices.agreedPriceHint')}
                        </small>
                    </div>
                </div>

                <div className="form-section">
                    <h3>{t('reservation.editPrices.adjustments')}</h3>

                    <div className="form-group">
                        <label htmlFor="additionalFees">{t('reservation.fields.additionalFees')}</label>
                        <input
                            type="number"
                            id="additionalFees"
                            name="additionalFees"
                            value={formData.additionalFees}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {formData.additionalFees > 0 && (
                        <div className="form-group">
                            <label htmlFor="additionalFeesReason">{t('reservation.fields.additionalFeesReason')}</label>
                            <textarea
                                id="additionalFeesReason"
                                name="additionalFeesReason"
                                value={formData.additionalFeesReason}
                                onChange={handleChange}
                                rows="2"
                                placeholder={t('reservation.editPrices.additionalFeesPlaceholder')}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="discount">{t('reservation.fields.discount')}</label>
                        <input
                            type="number"
                            id="discount"
                            name="discount"
                            value={formData.discount}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {formData.discount > 0 && (
                        <div className="form-group">
                            <label htmlFor="discountReason">{t('reservation.fields.discountReason')}</label>
                            <textarea
                                id="discountReason"
                                name="discountReason"
                                value={formData.discountReason}
                                onChange={handleChange}
                                rows="2"
                                placeholder={t('reservation.editPrices.discountPlaceholder')}
                            />
                        </div>
                    )}
                </div>

                <div className="form-section pricing-summary">
                    <h3>{t('reservation.editPrices.finalPricing')}</h3>
                    <div className="pricing-breakdown">
                        <div className="pricing-row">
                            <span className="pricing-label">{t('reservation.fields.baseAmount')}:</span>
                            <span className="pricing-value">{parseFloat(formData.agreedPrice || 0).toFixed(2)} MAD</span>
                        </div>
                        {formData.additionalFees > 0 && (
                            <div className="pricing-row additional">
                                <span className="pricing-label">+ {t('reservation.fields.additionalFees')}:</span>
                                <span className="pricing-value">+{parseFloat(formData.additionalFees || 0).toFixed(2)} MAD</span>
                            </div>
                        )}
                        {formData.discount > 0 && (
                            <div className="pricing-row discount">
                                <span className="pricing-label">- {t('reservation.fields.discount')}:</span>
                                <span className="pricing-value">-{parseFloat(formData.discount || 0).toFixed(2)} MAD</span>
                            </div>
                        )}
                        <div className="pricing-row total">
                            <span className="pricing-label">{t('reservation.fields.finalPrice')}:</span>
                            <span className="pricing-value">{parseFloat(formData.finalPrice || 0).toFixed(2)} MAD</span>
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn-submit">
                        {t('reservation.editPrices.submit')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditPricesModal;