// src/pages/Reservation/Details/ReservationDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import reservationService from '../../../services/reservationService';
import invoiceService from '../../../services/invoiceService';
import './ReservationDetails.css';

// Components for modals
import EditDatesModal from './Modals/EditDatesModal';
import RemoveReservationModal from './Modals/RemoveReservationModal';
import DeliverCarModal from './Modals/DeliverCarModal';
import ReturnCarModal from './Modals/ReturnCarModal';
import GenerateInvoiceModal from './Modals/GenerateInvoiceModal';
import AddPaymentModal from './Modals/AddPaymentModal';
import SelectCarModal from './Modals/SelectCarModal';
import CustomerModal from './Modals/CustomerModal';

const ReservationDetails = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    // State variables
    const [reservation, setReservation] = useState(null);
    const [invoice, setInvoice] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Modal states
    const [showEditDatesModal, setShowEditDatesModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showDeliverCarModal, setShowDeliverCarModal] = useState(false);
    const [showReturnCarModal, setShowReturnCarModal] = useState(false);
    const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
    const [showSelectCarModal, setShowSelectCarModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerAction, setCustomerAction] = useState('edit'); // edit, add, remove

    // Fetch reservation data
    useEffect(() => {
        const fetchReservationData = async () => {
            setLoading(true);
            try {
                // 1. Load reservation
                const reservationData = await reservationService.getById(id);
                setReservation(reservationData);

                // 2. Try loading the invoice, but swallow 404
                let invoiceData = null;
                try {
                    invoiceData = await invoiceService.getByReservationId(id);
                    setInvoice(invoiceData);
                    // 3. If you got payments back, set them
                    if (invoiceData.payments) {
                        setPayments(invoiceData.payments);
                    }
                } catch (invErr) {
                    // If it's a 404, just leave invoiceData = null
                    if (invErr.response?.status === 404) {
                        console.log(`No invoice for reservation ${id}`);
                        setInvoice(null);
                        setPayments([]);       // or leave previous state / empty array
                    } else {
                        // Some other error — rethrow so your outer catch handles it
                        throw invErr;
                    }
                }
            } catch (err) {
                // Reservation load failure or non-404 invoice error
                console.error('Error fetching reservation or invoice:', err);
                setError('Failed to load reservation details');
            } finally {
                setLoading(false);
            }
        };

        fetchReservationData();
    }, [id]);

    // Handle modal submissions
    const handleEditDatesSubmit = async (dates) => {
        try {
            await reservationService.updateReservationDates(id, dates);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowEditDatesModal(false);
        } catch (err) {
            console.error('Error updating reservation dates:', err);
        }
    };

    const handleRemoveReservationSubmit = async () => {
        try {
            await reservationService.deleteReservation(id);
            navigate('/reservations');
        } catch (err) {
            console.error('Error removing reservation:', err);
        }
    };

    const handleDeliverCarSubmit = async (data) => {
        try {
            await reservationService.deliverCar(id, data);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowDeliverCarModal(false);
        } catch (err) {
            console.error('Error delivering car:', err);
        }
    };

    const handleReturnCarSubmit = async (data) => {
        try {
            await reservationService.returnCar(id, data);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowReturnCarModal(false);
        } catch (err) {
            console.error('Error returning car:', err);
        }
    };

    const handleGenerateInvoiceSubmit = async (invoiceData) => {
        try {
            const newInvoice = await invoiceService.create({
                ...invoiceData,
                reservationId: id
            });
            setInvoice(newInvoice);

            // Refresh reservation data to get the updated invoiceId
            const updated = await reservationService.getById(id);
            setReservation(updated);

            setShowGenerateInvoiceModal(false);
        } catch (err) {
            console.error('Error generating invoice:', err);
        }
    };

    const handleAddPaymentSubmit = async (paymentData) => {
        try {
            await invoiceService.addPayment(invoice.id , {
                ...paymentData,
                invoiceId: invoice.id
            });

            // Refresh invoice and payments data
            const updatedInvoice = await invoiceService.getById(invoice.id);
            setInvoice(updatedInvoice);

            if (updatedInvoice.payments) {
                setPayments(updatedInvoice.payments);
            }

            setShowAddPaymentModal(false);
        } catch (err) {
            console.error('Error adding payment:', err);
        }
    };

    const handleEditCarSubmit = async (carId) => {
        try {
            await reservationService.updateReservationCar(id, carId);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowSelectCarModal(false);
        } catch (err) {
            console.error('Error updating car:', err);
        }
    };

    // Customer modal handlers
    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerAction('edit');
        setShowCustomerModal(true);
    };

    const handleAddCustomer = () => {
        setCustomerAction('add');
        setShowCustomerModal(true);
    };

    const handleRemoveCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerAction('remove');
        setShowCustomerModal(true);
    };

    const handleEditCustomerSubmit = async (customerData) => {
        try {
            await reservationService.updateCustomer(id, selectedCustomer.id, customerData);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowCustomerModal(false);
        } catch (err) {
            console.error('Error updating customer:', err);
        }
    };

    const handleAddCustomerSubmit = async (customerId) => {
        try {
            await reservationService.addCustomerToReservation(id, customerId.id);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowCustomerModal(false);
        } catch (err) {
            console.error('Error adding customer:', err);
        }
    };

    const handleRemoveCustomerSubmit = async () => {
        try {
            await reservationService.removeCustomerFromReservation(id, selectedCustomer.id);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowCustomerModal(false);
        } catch (err) {
            console.error('Error removing customer:', err);
        }
    };

    if (loading) {
        return <div className="reservation-loading">{t('common.loading')}</div>;
    }

    if (error) {
        return <div className="reservation-error">{error}</div>;
    }

    if (!reservation) {
        return <div className="reservation-error">{t('reservation.notFound')}</div>;
    }

    const isActive = reservation.status != 'Completed' && reservation.status != 'Cancelled';
    const isDelivered = reservation.status != 'Reserved';
    const isReturned = isDelivered && reservation.status != 'Ongoing';
    const canDeliver = isActive && !isDelivered;
    const canReturn = isDelivered && !isReturned;
    const canEdit = isActive && !isReturned;
    const canRemove = !isDelivered && !isReturned;
    const hasInvoice = invoice != null;

    // Calculate remaining amount if invoice exists
    const calculateRemainingAmount = () => {
        if (!invoice) return 0;

        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        return invoice.amount - totalPaid;
    };

    const remainingAmount = calculateRemainingAmount();

    return (
        <div className="reservation-details">
            {/* Header Section */}
            <section className="reservation-header">
                <h1>{t('reservation.details.title')}</h1>
                <div className="car-info">
                    <h2>
                        {reservation.car?.car_Model?.car_Manufacturer?.name} {reservation.car?.car_Model?.name}
                        <span className="matricule">{reservation.car?.licensePlate}</span>
                    </h2>

                    <div className="customer-tags">
                        {reservation.customers?.map(customer => (
                            <Link
                                key={customer.id}
                                to={`/customers/${customer.id}`}
                                className="customer-tag"
                            >
                                {customer.fullName}
                            </Link>
                        ))}
                    </div>

                    <div className="reservation-period">
                        <span>{t('reservation.fields.period')}:</span>
                        <time dateTime={reservation.startDate}>
                            {new Date(reservation.startDate).toLocaleDateString()}
                        </time>
                        <span>→</span>
                        <time dateTime={reservation.endDate}>
                            {new Date(reservation.endDate).toLocaleDateString()}
                        </time>
                    </div>

                    <div className="reservation-status-container">
                        {isDelivered && (
                            <div className="status-item delivered">
                                <span className="status-icon">✓</span>
                                <span className="status-label">{t('reservation.status.delivered')}</span>
                                <time dateTime={reservation.actualStartTime}>
                                    {new Date(reservation.actualStartTime).toLocaleDateString()}
                                </time>
                            </div>
                        )}

                        {isReturned && (
                            <div className="status-item returned">
                                <span className="status-icon">✓</span>
                                <span className="status-label">{t('reservation.status.returned')}</span>
                                <time dateTime={reservation.actualEndTime}>
                                    {new Date(reservation.actualEndTime).toLocaleDateString()}
                                </time>
                            </div>
                        )}

                        {!isActive && !isReturned && (
                            <div className="status-item expired">
                                <span className="status-icon">!</span>
                                <span className="status-label">{t('reservation.status.expired')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Actions Section */}
            <section className="reservation-actions">
                <div className="action-buttons">
                    {/* Primary Actions Group */}
                    <div className="action-group primary-actions">
                        {canDeliver && (
                            <button
                                className="action-btn deliver"
                                onClick={() => setShowDeliverCarModal(true)}
                            >
                                <span className="action-icon">🚗</span>
                                {t('reservation.actions.deliver')}
                            </button>
                        )}

                        {canReturn && (
                            <button
                                className="action-btn return"
                                onClick={() => setShowReturnCarModal(true)}
                            >
                                <span className="action-icon">🔄</span>
                                {t('reservation.actions.return')}
                            </button>
                        )}

                        {!hasInvoice && (
                            <button
                                className="action-btn generate-invoice"
                                onClick={() => setShowGenerateInvoiceModal(true)}
                            >
                                <span className="action-icon">📄</span>
                                {t('reservation.actions.generateInvoice')}
                            </button>
                        )}

                        <Link
                            to={`/reservations/${id}/contract`}
                            className="action-btn contract"
                        >
                            <span className="action-icon">📝</span>
                            {t('reservation.actions.viewContract')}
                        </Link>
                    </div>

                    {/* Edit Actions Group */}
                    <div className="action-group edit-actions">
                        {canEdit && (
                            <>
                                <button
                                    className="action-btn edit-dates"
                                    onClick={() => setShowEditDatesModal(true)}
                                >
                                    <span className="action-icon">📅</span>
                                    {t('reservation.actions.editDates')}
                                </button>

                                <button
                                    className="action-btn edit-car"
                                    onClick={() => setShowSelectCarModal(true)}
                                >
                                    <span className="action-icon">🚘</span>
                                    {t('reservation.actions.changeCar')}
                                </button>
                            </>
                        )}

                        {canRemove && (
                            <button
                                className="action-btn remove"
                                onClick={() => setShowRemoveModal(true)}
                            >
                                <span className="action-icon">🗑️</span>
                                {t('reservation.actions.remove')}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Customer Section */}
            <section className="customer-section">
                <div className="section-header">
                    <h2>{t('reservation.customers.title')}</h2>
                    <button
                        className="add-customer-btn"
                        onClick={handleAddCustomer}
                    >
                        <span className="btn-icon">+</span>
                        {t('reservation.customers.add')}
                    </button>
                </div>

                <div className="customer-cards">
                    {reservation.customers?.map(customer => (
                        <div key={customer.id} className="customer-card">
                            <h3>{customer.fullName}</h3>

                            <div className="customer-details">
                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.email')}:</span>
                                    <span className="detail-value">{customer.email || '-'}</span>
                                </div>

                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.phone')}:</span>
                                    <span className="detail-value">{customer.phoneNumber || '-'}</span>
                                </div>

                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.licenseNumber')}:</span>
                                    <span className="detail-value">{customer.licenseNumber || '-'}</span>
                                </div>

                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.nationalId')}:</span>
                                    <span className="detail-value">{customer.nationalId || '-'}</span>
                                </div>
                            </div>

                            <div className="customer-card-actions">
                                <button
                                    className="edit-customer-btn"
                                    onClick={() => handleEditCustomer(customer)}
                                >
                                    {t('common.edit')}
                                </button>

                                <button
                                    className="remove-customer-btn"
                                    onClick={() => handleRemoveCustomer(customer)}
                                >
                                    {t('common.remove')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Invoice Section */}
            <section className="invoice-section">
                <h2>{t('reservation.invoice.title')}</h2>

                {hasInvoice ? (
                    <div className="invoice-details">
                        <div className="invoice-header">
                            <div className="invoice-id">
                                <span className="invoice-label">{t('invoice.fields.number')}:</span>
                                <span className="invoice-value">{invoice.invoiceNumber || invoice.id}</span>
                            </div>

                            <div className="invoice-date">
                                <span className="invoice-label">{t('invoice.fields.issuedAt')}:</span>
                                <span className="invoice-value">
                                    {new Date(invoice.issuedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="invoice-summary">
                            <div className="summary-item">
                                <span className="summary-label">{t('invoice.fields.amount')}:</span>
                                <span className="summary-value amount">
                                    {invoice.amount.toLocaleString()} {invoice.currency}
                                </span>
                            </div>

                            <div className="summary-item">
                                <span className="summary-label">{t('invoice.fields.paidAmount')}:</span>
                                <span className="summary-value paid">
                                    {(invoice.amount - remainingAmount).toLocaleString()} {invoice.currency}
                                </span>
                            </div>

                            <div className="summary-item">
                                <span className="summary-label">{t('invoice.fields.remaining')}:</span>
                                <span className={`summary-value remaining ${remainingAmount <= 0 ? 'paid-full' : ''}`}>
                                    {remainingAmount.toLocaleString()} {invoice.currency}
                                </span>
                            </div>
                        </div>

                        <div className="invoice-actions">
                            <Link
                                to={`/invoices/${invoice.id}`}
                                className="view-invoice-btn"
                            >
                                {t('invoice.actions.view')}
                            </Link>

                            <button
                                className="print-invoice-btn"
                                onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')}
                            >
                                {t('invoice.actions.print')}
                            </button>

                            {remainingAmount > 0 && (
                                <button
                                    className="add-payment-btn"
                                    onClick={() => setShowAddPaymentModal(true)}
                                >
                                    {t('invoice.actions.addPayment')}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="no-invoice">
                        <p>{t('reservation.invoice.notGenerated')}</p>
                        <button
                            className="generate-invoice-btn"
                            onClick={() => setShowGenerateInvoiceModal(true)}
                        >
                            {t('reservation.actions.generateInvoice')}
                        </button>
                    </div>
                )}
            </section>

            {/* Payments Section */}
            {hasInvoice && payments.length > 0 && (
                <section className="payments-section">
                    <div className="section-header">
                        <h2>{t('reservation.payments.title')}</h2>

                        {remainingAmount > 0 && (
                            <button
                                className="add-payment-btn"
                                onClick={() => setShowAddPaymentModal(true)}
                            >
                                {t('invoice.actions.addPayment')}
                            </button>
                        )}
                    </div>

                    <div className="payment-list">
                        {payments.map(payment => (
                            <div key={payment.id} className="payment-item">
                                <div className="payment-info">
                                    <span className="payment-date">
                                        {new Date(payment.paidAt).toLocaleDateString()}
                                    </span>
                                    <span className="payment-method">{payment.method}</span>
                                </div>
                                <span className="payment-amount">
                                    {payment.amount.toLocaleString()} {invoice.currency}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Modals */}
            {showEditDatesModal && (
                <EditDatesModal
                    reservation={reservation}
                    onClose={() => setShowEditDatesModal(false)}
                    onSubmit={handleEditDatesSubmit}
                />
            )}

            {showRemoveModal && (
                <RemoveReservationModal
                    onClose={() => setShowRemoveModal(false)}
                    onConfirm={handleRemoveReservationSubmit}
                />
            )}

            {showDeliverCarModal && (
                <DeliverCarModal
                    reservation={reservation}
                    onClose={() => setShowDeliverCarModal(false)}
                    onSubmit={handleDeliverCarSubmit}
                />
            )}

            {showReturnCarModal && (
                <ReturnCarModal
                    reservation={reservation}
                    onClose={() => setShowReturnCarModal(false)}
                    onSubmit={handleReturnCarSubmit}
                />
            )}

            {showGenerateInvoiceModal && (
                <GenerateInvoiceModal
                    reservation={reservation}
                    onClose={() => setShowGenerateInvoiceModal(false)}
                    onSubmit={handleGenerateInvoiceSubmit}
                />
            )}

            {showAddPaymentModal && (
                <AddPaymentModal
                    invoice={invoice}
                    onClose={() => setShowAddPaymentModal(false)}
                    onSubmit={handleAddPaymentSubmit}
                />
            )}

            {showSelectCarModal && (
                <SelectCarModal
                    currentCarId={reservation.car?.id}
                    startDate={reservation.startDate}
                    endDate={reservation.endDate}
                    onClose={() => setShowSelectCarModal(false)}
                    onSelect={handleEditCarSubmit}
                />
            )}

            {showCustomerModal && (
                <CustomerModal
                    action={customerAction}
                    customer={selectedCustomer}
                    onClose={() => setShowCustomerModal(false)}
                    onEditSubmit={handleEditCustomerSubmit}
                    onAddSubmit={handleAddCustomerSubmit}
                    onRemoveSubmit={handleRemoveCustomerSubmit}
                />
            )}
        </div>
    );
};

export default ReservationDetails;