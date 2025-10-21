// src/pages/Reservations/Details/components/HeroSection.jsx
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const HeroSection = ({ reservation, invoice, primaryAction }) => {
    const { t } = useTranslation();

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'reserved') return 'status-reserved';
        if (statusLower === 'ongoing') return 'status-delivered';
        if (statusLower === 'completed') return 'status-returned';
        if (statusLower === 'cancelled') return 'status-cancelled';
        return 'status-default';
    };

    const calculateDaysRemaining = () => {
        const today = new Date();
        const endDate = new Date(reservation.endDate);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const calculatePaymentProgress = () => {
        if (!invoice || !invoice.totalAmount) return 0;
        return (invoice.amountPaid / invoice.totalAmount) * 100;
    };

    const daysRemaining = calculateDaysRemaining();
    const paymentProgress = calculatePaymentProgress();

    const totalPaid = invoice && Array.isArray(invoice.payments)
        ? invoice.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        : 0;

    const apiUrl = import.meta.env.VITE_API_URL;

    return (
        <div className="hero-reservation-section">
            {/* Status Timeline */}
            <div className="status-timeline">
                <div className={`timeline-step ${['reserved', 'ongoing', 'completed'].includes(reservation.status?.toLowerCase()) ? 'completed' : ''}`}>
                    <div className="step-indicator">
                        <span className="step-icon">📋</span>
                    </div>
                    <span className="step-label">{t('reservation.status.reserved', 'Reserved')}</span>
                </div>

                <div className="timeline-connector"></div>

                <div className={`timeline-step ${['ongoing', 'completed'].includes(reservation.status?.toLowerCase()) ? 'completed' : ''}`}>
                    <div className="step-indicator">
                        <span className="step-icon">🚗</span>
                    </div>
                    <span className="step-label">{t('reservation.status.delivered', 'Delivered')}</span>
                </div>

                <div className="timeline-connector"></div>

                <div className={`timeline-step ${reservation.status?.toLowerCase() === 'completed' ? 'completed' : ''}`}>
                    <div className="step-indicator">
                        <span className="step-icon">✓</span>
                    </div>
                    <span className="step-label">{t('reservation.status.returned', 'Returned')}</span>
                </div>
            </div>

            {/* Car Card with Image */}
            <div className="hero-car-card">
                <div className="car-image-container">
                    {reservation.car?.imageUrl ? (
                        <img
                            src={apiUrl + reservation.car.imageUrl.path}
                            alt={`${reservation.car.car_Model?.car_Manufacturer?.name} ${reservation.car.car_Model?.name}`}
                            className="car-image"
                        />
                    ) : (
                        <div className="car-image-placeholder">
                            <span className="car-placeholder-icon">🚗</span>
                        </div>
                    )}

                    <div className="car-overlay">
                        <div className="license-plate-badge">
                            {reservation.car?.licensePlate || t('common.noLicensePlate', 'N/A')}
                        </div>

                        <div className={`status-badge ${getStatusColor(reservation.status)}`}>
                            {t(`reservation.status.${reservation.status?.toLowerCase()}`, reservation.status)}
                        </div>
                    </div>
                </div>

                <div className="car-details">
                    <h1 className="car-title">
                        {reservation.car?.car_Model?.car_Manufacturer?.name} {reservation.car?.car_Model?.name}
                    </h1>

                    <div className="car-info-grid">
                        <div className="info-item">
                            <span className="info-label">{t('reservation.fields.startDate', 'Start Date')}</span>
                            <span className="info-value">{new Date(reservation.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">{t('reservation.fields.endDate', 'End Date')}</span>
                            <span className="info-value">{new Date(reservation.endDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">📅</div>
                    <div className="metric-content">
                        <span className="metric-label">{t('reservation.fields.daysRemaining', 'Days Remaining')}</span>
                        <span className={`metric-value ${daysRemaining < 0 ? 'overdue' : ''}`}>
                            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} ${t('reservation.metrics.overdue', 'overdue')}` : daysRemaining}
                        </span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">💰</div>
                    <div className="metric-content">
                        <span className="metric-label">{t('invoice.fields.totalAmount', 'Total Price')}</span>
                        <span className="metric-value">
                            {invoice?.finalPrice?.toFixed(2) || reservation.agreedPrice?.toFixed(2) || '0.00'} {t('common.currency', 'DH')}
                        </span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">✓</div>
                    <div className="metric-content">
                        <span className="metric-label">{t('invoice.fields.paidAmount', 'Amount Paid')}</span>
                        <span className="metric-value payment-status">
                            {totalPaid.toFixed(2) || '0.00'} {t('common.currency', 'DH')}
                        </span>
                        {invoice && (
                            <div className="payment-progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${paymentProgress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Customers Quick Link */}
            {reservation.customers && reservation.customers.length > 0 && (
                <div className="customers-quick-link">
                    <span className="quick-link-label">{t('reservation.fields.customers', 'Customers')}:</span>
                    <div className="customer-tags">
                        {reservation.customers.map((customer) => (
                            <Link
                                key={customer.id}
                                to={`/customers/${customer.id}`}
                                className="customer-tag"
                            >
                                {customer.fullName}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroSection;