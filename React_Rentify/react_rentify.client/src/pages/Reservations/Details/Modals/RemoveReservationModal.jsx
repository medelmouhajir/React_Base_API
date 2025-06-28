// src/pages/Reservation/Details/Modals/RemoveReservationModal.jsx
import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modals/Modal';
import './ModalStyles.css';

const RemoveReservationModal = ({ onClose, onConfirm }) => {
    const { t } = useTranslation();

    return (
        <Modal title={t('reservation.remove.title')} onClose={onClose}>
            <div className="modal-content">
                <div className="warning-message">
                    <i className="warning-icon">⚠️</i>
                    <p>{t('reservation.remove.warning')}</p>
                </div>

                <p>{t('reservation.remove.confirmText')}</p>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn-delete"
                        onClick={onConfirm}
                    >
                        {t('reservation.remove.confirm')}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .modal-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        
        .warning-message {
          display: flex;
          align-items: center;
          gap: 1rem;
          background-color: var(--danger-light, #ffebee);
          padding: 1rem;
          border-radius: 8px;
          color: var(--danger, #e53935);
        }
        
        .warning-icon {
          font-size: 1.5rem;
        }
        
        .btn-delete {
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          background-color: var(--danger, #e53935);
          border: none;
          color: white;
          transition: all 0.2s ease;
        }
        
        .btn-delete:hover {
          background-color: var(--danger-dark, #c62828);
        }
      `}</style>
        </Modal>
    );
};

export default RemoveReservationModal;