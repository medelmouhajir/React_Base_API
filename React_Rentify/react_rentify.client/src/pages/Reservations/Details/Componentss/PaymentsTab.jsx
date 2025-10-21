// src/pages/Reservations/Details/components/PaymentsTab.jsx
import { useTranslation } from 'react-i18next';

const PaymentsTab = ({ invoice, payments, onAddPayment, onGenerateInvoice }) => {
    const { t } = useTranslation();

    const getPaymentMethodIcon = (method) => {
        const methodLower = method?.toLowerCase();
        if (methodLower === 'cash') return '💵';
        if (methodLower === 'card' || methodLower === 'credit_card') return '💳';
        if (methodLower === 'bank_transfer') return '🏦';
        if (methodLower === 'check') return '📝';
        return '💰';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (!invoice) {
        return (
            <div className="payments-tab">
                <div className="empty-state">
                    <span className="empty-icon">📄</span>
                    <p>{t('reservation.invoice.notGenerated', 'No invoice generated yet')}</p>
                    <p className="empty-description">
                        {t('invoice.generateDescription', 'Generate an invoice to start tracking payments')}
                    </p>
                    <button className="btn-success" onClick={onGenerateInvoice}>
                        {t('invoice.list.new', 'Generate Invoice')}
                    </button>
                </div>
            </div>
        );
    }

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const paymentProgress = invoice.amount > 0 && Array.isArray(payments)
        ? (totalPaid / invoice.amount) * 100
        : 0;


    return (
        <div className="payments-tab">
            {/* Invoice Summary Card */}
            <div className="invoice-summary-card">
                <div className="summary-header">
                    <h3 className="summary-title">{t('invoice.summary.title', 'Payment Summary')}</h3>
                    <span className={`status-pill ${invoice.isPaid ? 'paid' : 'unpaid'}`}>
                        {invoice.isPaid ? t('invoice.status.paid', 'Paid') : t('invoice.status.unpaid', 'Unpaid')}
                    </span>
                </div>

                <div className="payment-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${paymentProgress}%` }}
                        >
                            <span className="progress-text">{paymentProgress.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                <div className="payment-amounts">
                    <div className="amount-item total">
                        <span className="amount-label">{t('invoice.fields.totalAmount', 'Total Amount')}</span>
                        <span className="amount-value">
                            {invoice.amount?.toFixed(2)} {t('common.currency', 'DH')}
                        </span>
                    </div>

                    <div className="amount-item paid">
                        <span className="amount-label">{t('invoice.fields.amountPaid', 'Amount Paid')}</span>
                        <span className="amount-value success">
                            {totalPaid.toFixed(2)} {t('common.currency', 'DH')}
                        </span>
                    </div>

                    <div className="amount-item remaining">
                        <span className="amount-label">{t('invoice.fields.remainingAmount', 'Remaining')}</span>
                        <span className={`amount-value ${invoice.remainingAmount > 0 ? 'warning' : 'success'}`}>
                            {(invoice.amount - totalPaid).toFixed(2)} {t('common.currency', 'DH')}
                        </span>
                    </div>
                </div>

                {(invoice.amount - totalPaid) > 0 && (
                    <button className="btn-success full-width" onClick={onAddPayment}>
                        <span className="btn-icon">+</span>
                        {t('payment.actions.addPayment', 'Add Payment')}
                    </button>
                )}
            </div>

            {/* Payments History */}
            <div className="payments-history-section">
                <h3 className="section-title">
                    {t('payment.details.paymentsTitle', 'Payment History')} ({payments?.length || 0})
                </h3>

                {payments && payments.length > 0 ? (
                    <div className="payments-list">
                        {payments.map((payment, index) => (
                            <div key={payment.id || index} className="payment-card">
                                <div className="payment-icon-wrapper">
                                    <span className="payment-icon">
                                        {getPaymentMethodIcon(payment.paymentMethod)}
                                    </span>
                                </div>

                                <div className="payment-info">
                                    <div className="payment-header">
                                        <span className="payment-method">
                                            {t(`payment.method.${payment.method?.toLowerCase()}`, payment.method)}
                                        </span>
                                        <span className="payment-amount">
                                            {payment.amount?.toFixed(2)} {t('common.currency', 'DH')}
                                        </span>
                                    </div>

                                    <div className="payment-meta">
                                        <span className="payment-date">
                                            📅 {formatDate(payment.paidAt || payment.createdAt)}
                                        </span>
                                        {payment.reference && (
                                            <span className="payment-reference">
                                                #{payment.reference}
                                            </span>
                                        )}
                                    </div>

                                    {payment.notes && (
                                        <div className="payment-notes">
                                            {payment.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state small">
                        <span className="empty-icon">💳</span>
                        <p>{t('payment.history.noPayments', 'No payments recorded yet')}</p>
                    </div>
                )}
            </div>

            {/* Invoice Details Accordion */}
            <details className="invoice-details-accordion">
                <summary className="accordion-summary">
                    <span>{t('invoice.details.title', 'Invoice Breakdown')}</span>
                    <span className="accordion-icon">▼</span>
                </summary>

                <div className="accordion-content">
                    <div className="detail-row">
                        <span className="detail-label">{t('invoice.fields.invoiceNumber', 'Invoice Number')}</span>
                        <span className="detail-value">#{invoice.invoiceNumber || invoice.id}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">{t('invoice.fields.issuedAt', 'Issue Date')}</span>
                        <span className="detail-value">{formatDate(invoice.issuedAt || invoice.createdAt)}</span>
                    </div>

                    <div className="divider"></div>

                    <div className="detail-row">
                        <span className="detail-label">{t('invoice.fields.amount', 'Subtotal')}</span>
                        <span className="detail-value">
                            {invoice.amount?.toFixed(2)} {t('common.currency', 'DH')}
                        </span>
                    </div>

                    {invoice.discount > 0 && (
                        <div className="detail-row">
                            <span className="detail-label">{t('invoice.fields.discount', 'Discount')}</span>
                            <span className="detail-value discount">
                                -{invoice.discount?.toFixed(2)} {t('common.currency', 'DH')}
                            </span>
                        </div>
                    )}

                    {invoice.tax > 0 && (
                        <div className="detail-row">
                            <span className="detail-label">{t('invoice.fields.tax', 'Tax')}</span>
                            <span className="detail-value">
                                {invoice.tax?.toFixed(2)} {t('common.currency', 'DH')}
                            </span>
                        </div>
                    )}

                    <div className="divider"></div>

                    <div className="detail-row total">
                        <span className="detail-label">{t('invoice.fields.totalAmount', 'Total')}</span>
                        <span className="detail-value">
                            {invoice.amount?.toFixed(2)} {t('common.currency', 'DH')}
                        </span>
                    </div>
                </div>
            </details>
        </div>
    );
};

export default PaymentsTab;