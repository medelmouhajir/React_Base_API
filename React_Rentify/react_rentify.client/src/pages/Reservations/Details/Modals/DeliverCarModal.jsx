// src/pages/Reservation/Details/Modals/DeliverCarModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import './ModalStyles.css';

const DeliverCarModal = ({ reservation, onClose, onSubmit }) => {
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        odometerStart: reservation.car.currentKM || 0,
        fuelLevel: 'FULL',
        deliveryNotes: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        hasPreExistingDamage: false,
        damageDescription: '',
        depositAmount: reservation?.deposit || 0,
        depositPaymentMethod: 'Cash',
        additionalFees: 0,
        additionalFeesReason: ''
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
            odometerStart: parseInt(formData.odometerStart) || 0,
            depositAmount: parseFloat(formData.depositAmount) || 0,
            additionalFees: parseFloat(formData.additionalFees) || 0,
            deliveryDate: new Date(formData.deliveryDate).toISOString()
        });
    };

    return (
        <Modal title={t('reservation.deliverCar.title')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-section">
                    <h3>{t('reservation.deliverCar.carDetails')}</h3>
                    <div className="car-details">
                        <div className="summary-row">
                            <span className="summary-label">{t('car.fields.model')}:</span>
                            <span className="summary-value">
                                {reservation.car?.car_Model?.car_Manufacturer?.name} {reservation.car?.car_Model?.name}
                            </span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">{t('car.fields.licensePlate')}:</span>
                            <span className="summary-value">
                                {reservation.car?.licensePlate}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>{t('reservation.deliverCar.deliveryDetails')}</h3>

                    <div className="form-group">
                        <label htmlFor="deliveryDate">{t('reservation.fields.deliveryDate')}</label>
                        <input
                            type="date"
                            id="deliveryDate"
                            name="deliveryDate"
                            value={formData.deliveryDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="odometerStart">{t('car.fields.odometerStart')}</label>
                        <input
                            type="number"
                            id="odometerStart"
                            name="odometerStart"
                            value={formData.odometerStart}
                            onChange={handleChange}
                            min="0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="fuelLevel">{t('car.fields.fuelLevel')}</label>
                        <select
                            id="fuelLevel"
                            name="fuelLevel"
                            value={formData.fuelLevel}
                            onChange={handleChange}
                            required
                        >
                            <option value="FULL">100% - {t('car.fuelLevels.full')}</option>
                            <option value="THREE_QUARTERS">75% - {t('car.fuelLevels.threeQuarters')}</option>
                            <option value="HALF">50% - {t('car.fuelLevels.half')}</option>
                            <option value="QUARTER">25% - {t('car.fuelLevels.quarter')}</option>
                            <option value="EMPTY">0% - {t('car.fuelLevels.empty')}</option>
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h3>{t('reservation.deliverCar.conditionAndDeposit')}</h3>

                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="hasPreExistingDamage"
                            name="hasPreExistingDamage"
                            checked={formData.hasPreExistingDamage}
                            onChange={handleChange}
                        />
                        <label htmlFor="hasPreExistingDamage">{t('car.fields.hasPreExistingDamage')}</label>
                    </div>

                    {formData.hasPreExistingDamage && (
                        <div className="form-group">
                            <label htmlFor="damageDescription">{t('car.fields.damageDescription')}</label>
                            <textarea
                                id="damageDescription"
                                name="damageDescription"
                                value={formData.damageDescription}
                                onChange={handleChange}
                                rows="3"
                                required={formData.hasPreExistingDamage}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="depositAmount">{t('reservation.fields.depositAmount')}</label>
                        <input
                            type="number"
                            id="depositAmount"
                            name="depositAmount"
                            value={formData.depositAmount}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="depositPaymentMethod">{t('payment.method')}</label>
                        <select
                            id="depositPaymentMethod"
                            name="depositPaymentMethod"
                            value={formData.depositPaymentMethod}
                            onChange={handleChange}
                            required
                        >
                            <option value="Cash">{t('payment.methods.cash')}</option>
                            <option value="CreditCard">{t('payment.methods.creditCard')}</option>
                            <option value="BankTransfer">{t('payment.methods.bankTransfer')}</option>
                            <option value="Other">{t('payment.methods.other')}</option>
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h3>{t('reservation.deliverCar.additionalInfo')}</h3>

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
                                required={formData.additionalFees > 0}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="deliveryNotes">{t('reservation.fields.deliveryNotes')}</label>
                        <textarea
                            id="deliveryNotes"
                            name="deliveryNotes"
                            value={formData.deliveryNotes}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {t('reservation.deliverCar.submit')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DeliverCarModal;