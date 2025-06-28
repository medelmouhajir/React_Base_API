// src/pages/Reservation/Details/Modals/EditDatesModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import './ModalStyles.css';

const EditDatesModal = ({ reservation, onClose, onSubmit }) => {
    const { t } = useTranslation();

    const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        startDate: formatDateForInput(reservation.startDate),
        endDate: formatDateForInput(reservation.endDate)
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

        // Validate dates (end date must be after start date)
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end <= start) {
            alert(t('reservation.editDates.endDateError'));
            return;
        }

        onSubmit({
            startDate: formData.startDate,
            endDate: formData.endDate
        });
    };

    return (
        <Modal title={t('reservation.editDates.title')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-section">
                    <h3>{t('reservation.editDates.currentPeriod')}</h3>
                    <div className="current-dates">
                        <div className="summary-row">
                            <span className="summary-label">{t('reservation.fields.startDate')}:</span>
                            <span className="summary-value">
                                {new Date(reservation.startDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">{t('reservation.fields.endDate')}:</span>
                            <span className="summary-value">
                                {new Date(reservation.endDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="startDate">{t('reservation.fields.newStartDate')}</label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="endDate">{t('reservation.fields.newEndDate')}</label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate}
                        required
                    />
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn-submit">
                        {t('reservation.editDates.submit')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditDatesModal;