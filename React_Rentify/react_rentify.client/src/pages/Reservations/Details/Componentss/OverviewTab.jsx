// src/pages/Reservations/Details/components/OverviewTab.jsx
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const OverviewTab = ({ reservation, invoice, onEditDates, onEditCar, onEditPrices, onGenerateInvoice }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="overview-tab">
            {/* Dates & Car Section */}
            <div className="overview-card">
                <div className="card-header">
                    <h3 className="card-title">{t('reservation.overview.datesAndCar', 'Dates & Car')}</h3>
                    <button className="btn-icon" onClick={onEditDates}>
                        ✎
                    </button>
                </div>

                <div className="card-content">
                    <div className="detail-row">
                        <span className="detail-label">{t('reservation.fields.startDate', 'Start Date')}</span>
                        <span className="detail-value">{new Date(reservation.startDate).toLocaleDateString()}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">{t('reservation.fields.endDate', 'End Date')}</span>
                        <span className="detail-value">{new Date(reservation.endDate).toLocaleDateString()}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">{t('reservation.fields.duration', 'Duration')}</span>
                        <span className="detail-value">
                            {Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24))} {t('common.days', 'days')}
                        </span>
                    </div>

                    <div className="divider"></div>

                    <div className="detail-row">
                        <span className="detail-label">{t('car.fields.model', 'Model')}</span>
                        <span className="detail-value">
                            {reservation.car?.car_Model?.manufacturer?.name} {reservation.car?.car_Model?.name}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">{t('car.fields.licensePlate', 'License Plate')}</span>
                        <span className="detail-value">{reservation.car?.licensePlate}</span>
                    </div>

                    <button className="btn-secondary" onClick={onEditCar}>
                        {t('reservation.actions.changeCar', 'Change Car')}
                    </button>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="overview-card">
                <div className="card-header">
                    <h3 className="card-title">{t('reservation.overview.pricing', 'Pricing')}</h3>
                    <button className="btn-icon" onClick={onEditPrices}>
                        ✎
                    </button>
                </div>

                <div className="card-content">
                    <div className="detail-row">
                        <span className="detail-label">{t('reservation.pricing.dailyRate', 'Daily Rate')}</span>
                        <span className="detail-value">
                            {reservation.dailyPrice?.toFixed(2) || '0.00'} {t('common.currency', 'DH')}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">{t('reservation.pricing.subtotal', 'Subtotal')}</span>
                        <span className="detail-value">
                            {reservation.subTotalPrice?.toFixed(2) || '0.00'} {t('common.currency', 'DH')}
                        </span>
                    </div>

                    {reservation.discount > 0 && (
                        <div className="detail-row discount">
                            <span className="detail-label">{t('reservation.pricing.discount', 'Discount')}</span>
                            <span className="detail-value discount-value">
                                -{reservation.discount?.toFixed(2)} {t('common.currency', 'DH')}
                            </span>
                        </div>
                    )}

                    <div className="divider"></div>

                    <div className="detail-row total">
                        <span className="detail-label">{t('reservation.pricing.totalPrice', 'Total Price')}</span>
                        <span className="detail-value total-value">
                            {reservation.totalPrice?.toFixed(2) || '0.00'} {t('common.currency', 'DH')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Invoice Section */}
            <div className="overview-card">
                <div className="card-header">
                    <h3 className="card-title">{t('invoice.title', 'Invoice')}</h3>
                </div>

                <div className="card-content">
                    {invoice ? (
                        <>
                            <div className="invoice-summary">
                                <div className="invoice-status">
                                    <span className={`status-pill ${invoice.isPaid ? 'paid' : 'unpaid'}`}>
                                        {invoice.isPaid ? t('invoice.status.paid', 'Paid') : t('invoice.status.unpaid', 'Unpaid')}
                                    </span>
                                </div>

                                <div className="payment-breakdown">
                                    <div className="detail-row">
                                        <span className="detail-label">{t('invoice.fields.totalAmount', 'Total Amount')}</span>
                                        <span className="detail-value">
                                            {invoice.amount?.toFixed(2)} {t('common.currency', 'DH')}
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">{t('invoice.fields.amountPaid', 'Amount Paid')}</span>
                                        <span className="detail-value success">
                                            {invoice.amountPaid?.toFixed(2)} {t('common.currency', 'DH')}
                                        </span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">{t('invoice.fields.remainingAmount', 'Remaining')}</span>
                                        <span className="detail-value warning">
                                            {invoice.remainingAmount?.toFixed(2)} {t('common.currency', 'DH')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={() => navigate(`/reservations/${reservation.id}/contract`)}
                            >
                                {t('reservation.actions.viewContract', 'View Contract')}
                            </button>
                        </>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">📄</span>
                            <p>{t('invoice.notGenerated', 'No invoice generated yet')}</p>
                            <button className="btn-success" onClick={onGenerateInvoice}>
                                {t('invoice.actions.generate', 'Generate Invoice')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Info */}
            {reservation.notes && (
                <div className="overview-card">
                    <div className="card-header">
                        <h3 className="card-title">{t('reservation.fields.notes', 'Notes')}</h3>
                    </div>
                    <div className="card-content">
                        <p className="notes-text">{reservation.notes}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewTab;