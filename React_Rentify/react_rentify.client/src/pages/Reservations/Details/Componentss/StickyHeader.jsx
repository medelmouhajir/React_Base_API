// src/pages/Reservations/Details/components/StickyHeader.jsx
import { useTranslation } from 'react-i18next';

const StickyHeader = ({ reservation, isVisible, primaryAction }) => {
    const { t } = useTranslation();

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'reserved') return 'status-reserved';
        if (statusLower === 'delivered') return 'status-delivered';
        if (statusLower === 'returned') return 'status-returned';
        if (statusLower === 'cancelled') return 'status-cancelled';
        return 'status-default';
    };

    return (
        <div className={`sticky-header ${isVisible ? 'visible' : ''}`}>
            <div className="sticky-header-content">
                <div className="sticky-header-info">
                    <span className={`status-badge-mini ${getStatusColor(reservation.status)}`}>
                        {t(`reservation.status.${reservation.status?.toLowerCase()}`, reservation.status)}
                    </span>
                    <span className="license-plate-mini">
                        {reservation.car?.licensePlate || t('common.noLicensePlate', 'N/A')}
                    </span>
                </div>

                {primaryAction && (
                    <button
                        className={`sticky-action-btn btn-${primaryAction.variant}`}
                        onClick={primaryAction.onClick}
                    >
                        <span className="btn-icon">{primaryAction.icon}</span>
                        <span className="btn-label">{primaryAction.label}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default StickyHeader;