// src/pages/Reservation/Details/Modals/ReturnCarModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import './ModalStyles.css';

const ReturnCarModal = ({ reservation, onClose, onSubmit }) => {
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        odometerEnd: reservation.odometerStart || 0,
        fuelLevel: 'FULL',
        returnNotes: '',
        returnDate: new Date().toISOString().split('T')[0],
        hasDamage: false,
        damageDescription: '',
        additionalCharges: 0,
        additionalChargesReason: ''
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
            odometerEnd: parseInt(formData.odometerEnd) || 0,
            additionalCharges: parseFloat(formData.additionalCharges) || 0,
            returnDate: new Date(formData.returnDate).toISOString()
        });
    };

    // Calculate kilometers driven if we have starting odometer
    const calculateDistance = () => {
        if (reservation.odometerStart && formData.odometerEnd) {
            const start = parseInt(reservation.odometerStart) || 0;
            const end = parseInt(formData.odometerEnd) || 0;
            return Math.max(0, end - start);
        }
        return null;
    };

    const distanceDriven = calculateDistance();

    return (
        <Modal title={t('reservation.returnCar.title')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-section">
                    <h3>{t('reservation.returnCar.carDetails')}</h3>
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
                        {reservation.odometerStart && (
                            <div className="summary-row">
                                <span className="summary-label">{t('reservation.fields.odometerStart')}:</span>
                                <span className="summary-value">
                                    {reservation.odometerStart} km
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="odometerEnd">{t('reservation.fields.odometerEnd')}</label>
                    <input
                        type="number"
                        id="odometerEnd"
                        name="odometerEnd"
                        value={formData.odometerEnd}
                        onChange={handleChange}
                        min={reservation.odometerStart || 0}
                        required
                        placeholder={t('reservation.returnCar.odometerPlaceholder')}
                    />
                    {distanceDriven !== null && (
                        <div className="distance-summary">
                            <span>{t('reservation.returnCar.distanceDriven')}:</span>
                            <span className="distance-value">{distanceDriven} km</span>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="fuelLevel">{t('reservation.fields.fuelLevel')}</label>
                    <select
                        id="fuelLevel"
                        name="fuelLevel"
                        value={formData.fuelLevel}
                        onChange={handleChange}
                        required
                    >
                        <option value="FULL">{t('car.fuelLevel.full')}</option>
                        <option value="THREE_QUARTERS">{t('car.fuelLevel.threeQuarters')}</option>
                        <option value="HALF">{t('car.fuelLevel.half')}</option>
                        <option value="QUARTER">{t('car.fuelLevel.quarter')}</option>
                        <option value="EMPTY">{t('car.fuelLevel.empty')}</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="returnDate">{t('reservation.fields.returnDate')}</label>
                    <input
                        type="date"
                        id="returnDate"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group checkbox">
                    <input
                        type="checkbox"
                        id="hasDamage"
                        name="hasDamage"
                        checked={formData.hasDamage}
                        onChange={handleChange}
                    />
                    <label htmlFor="hasDamage">{t('reservation.returnCar.hasDamage')}</label>
                </div>

                {formData.hasDamage && (
                    <div className="form-group">
                        <label htmlFor="damageDescription">{t('reservation.fields.damageDescription')}</label>
                        <textarea
                            id="damageDescription"
                            name="damageDescription"
                            value={formData.damageDescription}
                            onChange={handleChange}
                            rows="3"
                            required={formData.hasDamage}
                            placeholder={t('reservation.returnCar.damagePlaceholder')}
                        ></textarea>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="additionalCharges">{t('reservation.fields.additionalCharges')}</label>
                    <input
                        type="number"
                        id="additionalCharges"
                        name="additionalCharges"
                        value={formData.additionalCharges}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    />
                </div>

                {formData.additionalCharges > 0 && (
                    <div className="form-group">
                        <label htmlFor="additionalChargesReason">{t('reservation.fields.additionalChargesReason')}</label>
                        <input
                            type="text"
                            id="additionalChargesReason"
                            name="additionalChargesReason"
                            value={formData.additionalChargesReason}
                            onChange={handleChange}
                            required={formData.additionalCharges > 0}
                            placeholder={t('reservation.returnCar.chargesReasonPlaceholder')}
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="returnNotes">{t('reservation.fields.returnNotes')}</label>
                    <textarea
                        id="returnNotes"
                        name="returnNotes"
                        value={formData.returnNotes}
                        onChange={handleChange}
                        rows="3"
                        placeholder={t('reservation.returnCar.notesPlaceholder')}
                    ></textarea>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn-submit">
                        {t('reservation.returnCar.submit')}
                    </button>
                </div>
            </form>

            <style jsx>{`
        .distance-summary {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: var(--highlight-bg, #f5f5f5);
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .distance-value {
          font-weight: 600;
        }
        
        textarea {
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid var(--border-color, #ddd);
          font-size: 0.875rem;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
        }
        
        textarea:focus {
          outline: none;
          border-color: var(--primary, #1976d2);
          box-shadow: 0 0 0 2px var(--primary-light, #e3f2fd);
        }
      `}</style>
        </Modal>
    );
};

export default ReturnCarModal;