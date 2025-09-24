// src/pages/Invoices/Print/InvoicePrint.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import invoiceService from '../../../services/invoiceService';
import reservationService from '../../../services/reservationService';
import Loading from '../../../components/Loading/Loading';
import './InvoicePrint.css';

const safeNumber = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const InvoicePrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    const [invoice, setInvoice] = useState(null);
    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        document.body.classList.add('invoice-print-page');
        return () => {
            document.body.classList.remove('invoice-print-page');
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchInvoice = async () => {
            if (!id) {
                setError(t('invoice.print.missingId') || 'Missing invoice identifier.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const invoiceData = await invoiceService.getById(id);

                if (!isMounted) {
                    return;
                }

                setInvoice(invoiceData);

                if (invoiceData?.reservationId) {
                    try {
                        const reservationData = await reservationService.getById(invoiceData.reservationId);
                        if (isMounted) {
                            setReservation(reservationData);
                        }
                    } catch (reservationError) {
                        console.error('❌ Error fetching reservation for invoice print:', reservationError);
                        if (isMounted) {
                            setReservation(null);
                        }
                    }
                } else if (isMounted) {
                    setReservation(null);
                }
            } catch (fetchError) {
                console.error('❌ Error fetching invoice for print:', fetchError);
                if (!isMounted) {
                    return;
                }

                if (fetchError?.response?.status === 404) {
                    setError(t('invoice.print.notFound') || 'Invoice not found.');
                } else {
                    setError(t('invoice.print.loadError') || 'Unable to load invoice details.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchInvoice();

        return () => {
            isMounted = false;
        };
    }, [id, t]);

    useEffect(() => {
        if (!invoice) {
            return undefined;
        }

        const previousTitle = document.title;
        const baseTitle =
            t('invoice.print.documentTitle') ||
            t('invoice.details.title') ||
            t('invoice.list.title') ||
            'Invoice';
        const shortId = invoice.id ? String(invoice.id).slice(0, 8).toUpperCase() : '';
        document.title = shortId ? `${baseTitle} #${shortId}` : baseTitle;

        return () => {
            document.title = previousTitle;
        };
    }, [invoice, t]);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate('/invoices');
    };

    const handlePrint = () => {
        window.print();
    };

    const payments = useMemo(() => invoice?.payments || [], [invoice]);
    const totalAmount = safeNumber(invoice?.amount);
    const paidAmount = useMemo(
        () => payments.reduce((sum, payment) => sum + safeNumber(payment.amount), 0),
        [payments]
    );
    const balanceDue = Math.max(totalAmount - paidAmount, 0);
    const currency = invoice?.currency || 'MAD';

    const formatCurrency = (value) => {
        const numericValue = safeNumber(value);
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency
            }).format(numericValue);
        } catch (currencyError) {
            console.error('❌ Currency formatting error:', currencyError);
            return `${numericValue.toFixed(2)} ${currency}`;
        }
    };

    const formatDate = (value, withTime = false) => {
        if (!value) {
            return '--';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '--';
        }
        return withTime ? date.toLocaleString() : date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className={`invoiceprint-state ${isDarkMode ? 'dark-mode' : ''}`}>
                <Loading type="spinner" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`invoiceprint-state ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="invoiceprint-error-card">
                    <h2>{t('common.error') || 'Error'}</h2>
                    <p>{error}</p>
                    <button type="button" className="btn btn-primary" onClick={handleBack}>
                        {t('common.goBack') || 'Go back'}
                    </button>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className={`invoiceprint-state ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="invoiceprint-error-card">
                    <h2>{t('invoice.print.notFound') || 'Invoice not found.'}</h2>
                    <button type="button" className="btn btn-primary" onClick={handleBack}>
                        {t('common.goBack') || 'Go back'}
                    </button>
                </div>
            </div>
        );
    }

    const agency = reservation?.agency;
    const customerNames = reservation?.customers?.map((customer) => customer.fullName).join(', ');
    const primaryCustomer = customerNames || t('invoice.print.customerFallback') || 'Customer';
    const carInformation = reservation?.car
        ? `${reservation.car?.car_Model?.car_Manufacturer?.name || ''} ${reservation.car?.car_Model?.name || ''} (${reservation.car?.licensePlate || t('invoice.print.unknownPlate') || 'N/A'})`
        : t('invoice.print.vehicleFallback') || 'Vehicle information unavailable';

    return (
        <div className={`invoiceprint-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="invoiceprint-controls no-print">
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                    {t('common.goBack') || 'Go back'}
                </button>
                <button type="button" className="btn btn-primary" onClick={handlePrint}>
                    {t('common.print') || 'Print'}
                </button>
            </div>

            <article className="invoiceprint-document" aria-labelledby="invoiceprint-title">
                <header className="invoiceprint-header">
                    <div className="invoiceprint-agency">
                        {agency?.logoUrl && (
                            <img
                                src={`${apiBaseUrl}${agency.logoUrl}`}
                                alt={agency?.name || 'Agency logo'}
                                className="invoiceprint-agency-logo"
                                loading="lazy"
                            />
                        )}
                        <div>
                            <h1 id="invoiceprint-title">{t('invoice.print.title') || 'Invoice'}</h1>
                            <p className="invoiceprint-agency-name">{agency?.name || t('invoice.print.agencyFallback') || 'Agency'}</p>
                            {agency?.address && <p className="invoiceprint-agency-detail">{agency.address}</p>}
                            {(agency?.phoneOne || agency?.email) && (
                                <p className="invoiceprint-agency-detail">
                                    {agency?.phoneOne && <span>{agency.phoneOne}</span>}
                                    {agency?.phoneOne && agency?.email && <span> · </span>}
                                    {agency?.email && <span>{agency.email}</span>}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="invoiceprint-meta">
                        <div className="invoiceprint-meta-row">
                            <span>{t('invoice.fields.id') || 'Invoice ID'}</span>
                            <span className="invoiceprint-meta-value">{String(invoice.id)}</span>
                        </div>
                        <div className="invoiceprint-meta-row">
                            <span>{t('invoice.fields.issuedAt') || 'Issued on'}</span>
                            <span className="invoiceprint-meta-value">{formatDate(invoice.issuedAt, true)}</span>
                        </div>
                        <div className="invoiceprint-meta-row">
                            <span>{t('invoice.fields.paymentMethod') || 'Payment method'}</span>
                            <span className="invoiceprint-meta-value">{invoice.paymentMethod || t('invoice.print.paymentMethodFallback') || 'N/A'}</span>
                        </div>
                        <div className={`invoiceprint-status ${invoice.isPaid ? 'status-paid' : 'status-unpaid'}`}>
                            {invoice.isPaid
                                ? t('invoice.print.statusPaid') || t('common.paid') || 'Paid'
                                : t('invoice.print.statusUnpaid') || t('common.unpaid') || 'Unpaid'}
                        </div>
                    </div>
                </header>

                <section className="invoiceprint-info-grid">
                    <div className="invoiceprint-info-card">
                        <h2>{t('invoice.print.billTo') || 'Bill to'}</h2>
                        <p className="invoiceprint-info-value">{primaryCustomer}</p>
                        {reservation?.customer?.identityNumber && (
                            <p className="invoiceprint-info-subtle">{reservation.customer.identityNumber}</p>
                        )}
                        {reservation?.customers?.length > 1 && (
                            <p className="invoiceprint-info-subtle">
                                {t('invoice.print.additionalGuests', { count: reservation.customers.length - 1 }) ||
                                    `${reservation.customers.length - 1} additional guest(s)`}
                            </p>
                        )}
                    </div>

                    <div className="invoiceprint-info-card">
                        <h2>{t('invoice.print.reservationDetails') || 'Reservation details'}</h2>
                        <dl className="invoiceprint-definition-list">
                            <div>
                                <dt>{t('invoice.fields.reservation') || 'Reservation ID'}</dt>
                                <dd>{reservation?.id || String(invoice.reservationId)}</dd>
                            </div>
                            <div>
                                <dt>{t('invoice.print.vehicle') || 'Vehicle'}</dt>
                                <dd>{carInformation}</dd>
                            </div>
                            <div>
                                <dt>{t('invoice.print.period') || 'Rental period'}</dt>
                                <dd>
                                    {formatDate(reservation?.startDate)}
                                    <span className="invoiceprint-period-separator">→</span>
                                    {formatDate(reservation?.endDate)}
                                </dd>
                            </div>
                            {(reservation?.pickupLocation || reservation?.dropoffLocation) && (
                                <div>
                                    <dt>{t('invoice.print.locations') || 'Pickup / Drop-off'}</dt>
                                    <dd>
                                        {reservation?.pickupLocation || t('invoice.print.pickupFallback') || 'Pickup'}
                                        <span className="invoiceprint-period-separator">/</span>
                                        {reservation?.dropoffLocation || t('invoice.print.dropoffFallback') || 'Drop-off'}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </section>

                <section className="invoiceprint-summary">
                    <h2>{t('invoice.print.summary') || 'Invoice summary'}</h2>
                    <div className="invoiceprint-summary-grid">
                        <div className="invoiceprint-summary-item">
                            <span>{t('invoice.fields.amount') || 'Total amount'}</span>
                            <strong>{formatCurrency(totalAmount)}</strong>
                        </div>
                        <div className="invoiceprint-summary-item">
                            <span>{t('invoice.print.totalPaid') || 'Total paid'}</span>
                            <strong>{formatCurrency(paidAmount)}</strong>
                        </div>
                        <div className={`invoiceprint-summary-item balance ${balanceDue > 0 ? 'due' : 'settled'}`}>
                            <span>{t('invoice.print.balanceDue') || 'Balance due'}</span>
                            <strong>{formatCurrency(balanceDue)}</strong>
                        </div>
                    </div>
                </section>

                <section className="invoiceprint-payments">
                    <h2>{t('invoice.print.paymentsTitle') || 'Payment history'}</h2>
                    {payments.length === 0 ? (
                        <p className="invoiceprint-no-data">
                            {t('invoice.print.noPayments') || 'No payments have been recorded for this invoice yet.'}
                        </p>
                    ) : (
                        <div className="invoiceprint-table-wrapper">
                            <table className="invoiceprint-table">
                                <thead>
                                    <tr>
                                        <th>{t('payment.fields.paidAt') || 'Paid at'}</th>
                                        <th>{t('payment.fields.amount') || 'Amount'}</th>
                                        <th>{t('payment.fields.method') || 'Method'}</th>
                                        <th>{t('payment.fields.transactionId') || 'Reference'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{formatDate(payment.paidAt, true)}</td>
                                            <td>{formatCurrency(payment.amount)}</td>
                                            <td>{payment.method || t('invoice.print.paymentMethodFallback') || 'N/A'}</td>
                                            <td>{payment.transactionId || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <footer className="invoiceprint-footer">
                    <p>{t('invoice.print.thankYou') || 'Thank you for your business!'}</p>
                    {(agency?.phoneOne || agency?.email) && (
                        <p className="invoiceprint-footer-contact">
                            {t('invoice.print.contactUs') || 'Need assistance?'}
                            {agency?.phoneOne && <span> {agency.phoneOne}</span>}
                            {agency?.phoneOne && agency?.email && <span> · </span>}
                            {agency?.email && <span>{agency.email}</span>}
                        </p>
                    )}
                </footer>
            </article>
        </div>
    );
};

export default InvoicePrint;