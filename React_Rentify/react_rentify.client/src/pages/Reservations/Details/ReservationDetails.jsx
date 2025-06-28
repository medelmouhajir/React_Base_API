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
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Get reservation data
                const reservationData = await reservationService.getById(id);
                setReservation(reservationData);

                // Get invoice data if it exists
                try {
                    const invoiceData = await invoiceService.getByReservationId(id);
                    setInvoice(invoiceData);
                    setPayments(invoiceData.payments || []);
                } catch (invoiceError) {
                    // No invoice yet, this is normal for new reservations
                    console.log('No invoice found for this reservation');
                }
            } catch (err) {
                console.error('Error fetching reservation details:', err);
                setError(t('reservation.details.errorLoading'));
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, t]);

    // Handlers for primary actions
    const handleEditDates = () => setShowEditDatesModal(true);
    const handleRemoveReservation = () => setShowRemoveModal(true);
    const handleEditCar = () => setShowSelectCarModal(true);
    const handleGenerateInvoice = () => setShowGenerateInvoiceModal(true);
    const handleDeliverCar = () => setShowDeliverCarModal(true);
    const handleReturnCar = () => setShowReturnCarModal(true);
    const handleAddPayment = () => setShowAddPaymentModal(true);

    // Customer dropdown handlers
    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerAction('edit');
        setShowCustomerModal(true);
    };

    const handleAddCustomer = () => {
        setSelectedCustomer(null);
        setCustomerAction('add');
        setShowCustomerModal(true);
    };

    const handleRemoveCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerAction('remove');
        setShowCustomerModal(true);
    };

    // API action handlers
    const handleEditDatesSubmit = async (updatedDates) => {
        try {
            await reservationService.updateDates(id, updatedDates);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowEditDatesModal(false);
        } catch (err) {
            console.error('Error updating dates:', err);
            setError(t('reservation.details.updateError'));
        }
    };

    const handleRemoveReservationSubmit = async () => {
        try {
            await reservationService.remove(id);
            navigate('/reservations');
        } catch (err) {
            console.error('Error removing reservation:', err);
            setError(t('reservation.details.removeError'));
        }
    };

    const handleEditCarSubmit = async (carId) => {
        try {
            await reservationService.updateCar(id, carId);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowSelectCarModal(false);
        } catch (err) {
            console.error('Error updating car:', err);
            setError(t('reservation.details.updateCarError'));
        }
    };

    const handleGenerateInvoiceSubmit = async (invoiceData) => {
        try {
            const newInvoice = await invoiceService.create({
                ...invoiceData,
                reservationId: id
            });
            setInvoice(newInvoice);
            setPayments(newInvoice.payments || []);
            setShowGenerateInvoiceModal(false);
        } catch (err) {
            console.error('Error generating invoice:', err);
            setError(t('reservation.details.invoiceError'));
        }
    };

    const handleDeliverCarSubmit = async (deliveryDetails) => {
        try {
            await reservationService.deliverCar(id, deliveryDetails);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowDeliverCarModal(false);
        } catch (err) {
            console.error('Error delivering car:', err);
            setError(t('reservation.details.deliverError'));
        }
    };

    const handleReturnCarSubmit = async (returnDetails) => {
        try {
            await reservationService.returnCar(id, returnDetails);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowReturnCarModal(false);
        } catch (err) {
            console.error('Error returning car:', err);
            setError(t('reservation.details.returnError'));
        }
    };

    const handleAddPaymentSubmit = async (paymentData) => {
        try {
            await invoiceService.addPayment(invoice.id, paymentData);
            // Refresh invoice data
            const updatedInvoice = await invoiceService.getById(invoice.id);
            setInvoice(updatedInvoice);
            setPayments(updatedInvoice.payments || []);
            setShowAddPaymentModal(false);
        } catch (err) {
            console.error('Error adding payment:', err);
            setError(t('reservation.details.paymentError'));
        }
    };

    const handleEditCustomerSubmit = async (updatedCustomer) => {
        try {
            await reservationService.updateCustomer(id, updatedCustomer.id, updatedCustomer);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowCustomerModal(false);
        } catch (err) {
            console.error('Error updating customer:', err);
            setError(t('reservation.details.customerUpdateError'));
        }
    };

    const handleAddCustomerSubmit = async (newCustomer) => {
        try {
            await reservationService.addCustomer(id, newCustomer.id);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowCustomerModal(false);
        } catch (err) {
            console.error('Error adding customer:', err);
            setError(t('reservation.details.customerAddError'));
        }
    };

    const handleRemoveCustomerSubmit = async () => {
        try {
            await reservationService.removeCustomer(id, selectedCustomer.id);
            // Refresh reservation data
            const updated = await reservationService.getById(id);
            setReservation(updated);
            setShowCustomerModal(false);
        } catch (err) {
            console.error('Error removing customer:', err);
            setError(t('reservation.details.customerRemoveError'));
        }
    };

    // Loading state
    if (loading) {
        return <div className="reservation-loading">{t('reservation.details.loading')}</div>;
    }

    // Error state
    if (error) {
        return <div className="reservation-error">{error}</div>;
    }

    // Not found state
    if (!reservation) {
        return <div className="reservation-error">{t('reservation.details.notFound')}</div>;
    }

    // Calculate if actions should be available
    const canGenerateInvoice = reservation.status === 'RESERVATION' && !invoice;
    const canEditDates = true; // Always allow date editing
    const canRemove = reservation.status === 'RESERVATION' && !reservation.isDelivered;
    const canEditCar = true; // Always allow car editing
    const canDeliver = !reservation.isDelivered && reservation.car?.status === 'PARKED';
    const canReturn = reservation.isDelivered && !reservation.isReturned && reservation.car?.status === 'OUT';
    const canAddPayment = invoice && !invoice.isPaid;
    const canEditCustomer = reservation.customers && reservation.customers.length > 0;
    const canRemoveCustomer = reservation.customers && reservation.customers.length >= 2;

    // Calculate payment status
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalDue = invoice ? invoice.amount : 0;
    const remainingBalance = totalDue - totalPaid;
    const paymentStatus = invoice ?
        (invoice.isPaid ? 'PAID' : (totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID')) : 'NO_INVOICE';

    return (
        <div className="reservation-details">
            {/* Header Section */}
            <section className="reservation-header">
                <h1>{t('reservation.details.title')}</h1>

                {/* Car info */}
                <div className="car-info">
                    <h2>
                        {reservation.car?.car_Model?.car_Manufacturer?.name} {reservation.car?.car_Model?.name}
                        <span className="matricule">({reservation.car?.licensePlate})</span>
                    </h2>

                    {/* Customer tags */}
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

                    {/* Reservation period */}
                    <div className="reservation-period">
                        <span>{t('reservation.details.period')}:</span>
                        <time dateTime={reservation.startDate}>
                            {new Date(reservation.startDate).toLocaleDateString()}
                        </time>
                        <span>→</span>
                        <time dateTime={reservation.endDate}>
                            {new Date(reservation.endDate).toLocaleDateString()}
                        </time>
                    </div>
                </div>
            </section>

            {/* Actions Section */}
            <section className="reservation-actions">
                <div className="primary-actions">
                    {canEditDates && (
                        <button
                            className="action-btn edit-dates"
                            onClick={handleEditDates}
                        >
                            {t('reservation.actions.editDates')}
                        </button>
                    )}

                    {canRemove && (
                        <button
                            className="action-btn remove"
                            onClick={handleRemoveReservation}
                        >
                            {t('reservation.actions.remove')}
                        </button>
                    )}

                    {canEditCar && (
                        <button
                            className="action-btn edit-car"
                            onClick={handleEditCar}
                        >
                            {t('reservation.actions.editCar')}
                        </button>
                    )}

                    {canGenerateInvoice && (
                        <button
                            className="action-btn generate-invoice"
                            onClick={handleGenerateInvoice}
                        >
                            {t('reservation.actions.generateInvoice')}
                        </button>
                    )}

                    {canDeliver && (
                        <button
                            className="action-btn deliver"
                            onClick={handleDeliverCar}
                        >
                            {t('reservation.actions.deliverCar')}
                        </button>
                    )}

                    {canReturn && (
                        <button
                            className="action-btn return"
                            onClick={handleReturnCar}
                        >
                            {t('reservation.actions.returnCar')}
                        </button>
                    )}

                    {/* Dropdown for customer actions */}
                    <div className="dropdown">
                        <button className="dropdown-toggle">
                            {t('reservation.actions.customers')}
                        </button>
                        <div className="dropdown-menu">
                            {canEditCustomer && (
                                <button
                                    className="dropdown-item"
                                    onClick={() => handleEditCustomer(reservation.customers[0])}
                                >
                                    {t('reservation.actions.editCustomer')}
                                </button>
                            )}
                            <button
                                className="dropdown-item"
                                onClick={handleAddCustomer}
                            >
                                {t('reservation.actions.addCustomer')}
                            </button>
                            {canRemoveCustomer && (
                                <button
                                    className="dropdown-item"
                                    onClick={() => handleRemoveCustomer(reservation.customers[0])}
                                >
                                    {t('reservation.actions.removeCustomer')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Contract button */}
                    <Link
                        to={`/reservations/${id}/contract`}
                        className="action-btn contract"
                    >
                        {t('reservation.actions.contract')}
                    </Link>
                </div>
            </section>

            {/* Customer Cards Section */}
            <section className="customer-section">
                <h2>{t('reservation.details.customersTitle')}</h2>
                <div className="customer-cards">
                    {reservation.customers?.map(customer => (
                        <div key={customer.id} className="customer-card">
                            <h3>{customer.fullName}</h3>
                            <div className="customer-details">
                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.email')}:</span>
                                    <span className="detail-value">{customer.email}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.phoneNumber')}:</span>
                                    <span className="detail-value">{customer.phoneNumber}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.address')}:</span>
                                    <span className="detail-value">{customer.address}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.nationalId')}:</span>
                                    <span className="detail-value">{customer.nationalId || '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('customer.fields.licenseNumber')}:</span>
                                    <span className="detail-value">{customer.licenseNumber || '—'}</span>
                                </div>
                            </div>
                            <button
                                className="edit-customer-btn"
                                onClick={() => handleEditCustomer(customer)}
                            >
                                {t('common.edit')}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Invoice Section */}
            {invoice ? (
                <section className="invoice-section">
                    <h2>{t('reservation.details.invoiceTitle')}</h2>
                    <div className="invoice-card">
                        <div className="invoice-header">
                            <span className="invoice-number">#{invoice.id.substring(0, 8)}</span>
                            <span className={`invoice-status ${paymentStatus.toLowerCase()}`}>
                                {t(`invoice.status.${paymentStatus.toLowerCase()}`)}
                            </span>
                        </div>

                        <div className="invoice-details">
                            <div className="detail-row">
                                <span className="detail-label">{t('invoice.fields.issuedAt')}:</span>
                                <span className="detail-value">
                                    {new Date(invoice.issuedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">{t('invoice.fields.amount')}:</span>
                                <span className="detail-value amount">
                                    {invoice.amount.toFixed(2)} {invoice.currency}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">{t('invoice.fields.paymentMethod')}:</span>
                                <span className="detail-value">{invoice.paymentMethod}</span>
                            </div>
                            <div className="detail-row highlight">
                                <span className="detail-label">{t('invoice.fields.remainingBalance')}:</span>
                                <span className="detail-value remaining">
                                    {remainingBalance.toFixed(2)} {invoice.currency}
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
                            <Link
                                to={`/invoices/${invoice.id}/edit`}
                                className="edit-invoice-btn"
                            >
                                {t('common.edit')}
                            </Link>
                            <button
                                className="print-invoice-btn"
                                onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')}
                            >
                                {t('invoice.actions.print')}
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="no-invoice">
                    <p>{t('reservation.details.noInvoice')}</p>
                    {canGenerateInvoice && (
                        <button
                            className="generate-invoice-btn"
                            onClick={handleGenerateInvoice}
                        >
                            {t('reservation.actions.generateInvoice')}
                        </button>
                    )}
                </section>
            )}

            {/* Payments Section */}
            {invoice && (
                <section className="payments-section">
                    <div className="section-header">
                        <h2>{t('reservation.details.paymentsTitle')}</h2>
                        {canAddPayment && (
                            <button
                                className="add-payment-btn"
                                onClick={handleAddPayment}
                            >
                                {t('reservation.actions.addPayment')}
                            </button>
                        )}
                    </div>

                    {payments.length === 0 ? (
                        <p className="no-payments">{t('reservation.details.noPayments')}</p>
                    ) : (
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
                                        {payment.amount.toFixed(2)} {invoice.currency}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
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