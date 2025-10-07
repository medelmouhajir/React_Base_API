// src/pages/Reservations/Details/ReservationDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import reservationService from '../../../services/reservationService';
import invoiceService from '../../../services/invoiceService';
import './ReservationDetails.css';

// Component imports
import HeroSection from './Componentss/HeroSection';
import TabNavigation from './Componentss/TabNavigation';
import OverviewTab from './Componentss/OverviewTab';
import CustomerTab from './Componentss/CustomerTab';
import PaymentsTab from './Componentss/PaymentsTab';
import HistoryTab from './Componentss/HistoryTab';
import FloatingActionButton from './Componentss/FloatingActionButton';
import StickyHeader from './Componentss/StickyHeader';

// Modal imports
import EditDatesModal from './Modals/EditDatesModal';
import RemoveReservationModal from './Modals/RemoveReservationModal';
import DeliverCarModal from './Modals/DeliverCarModal';
import ReturnCarModal from './Modals/ReturnCarModal';
import GenerateInvoiceModal from './Modals/GenerateInvoiceModal';
import AddPaymentModal from './Modals/AddPaymentModal';
import SelectCarModal from './Modals/SelectCarModal';
import CustomerModal from './Modals/CustomerModal';
import EditPricesModal from './Modals/EditPricesModal';

const ReservationDetails = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    // State management
    const [reservation, setReservation] = useState(null);
    const [invoice, setInvoice] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isScrolled, setIsScrolled] = useState(false);
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
    const [customerAction, setCustomerAction] = useState('edit');
    const [showEditPricesModal, setShowEditPricesModal] = useState(false);

    // Fetch reservation data
    useEffect(() => {
        const fetchReservationData = async () => {
            setLoading(true);
            try {
                const reservationData = await reservationService.getById(id);
                setReservation(reservationData);

                let invoiceData = null;
                try {
                    invoiceData = await invoiceService.getByReservationId(id);
                    setInvoice(invoiceData);
                    if (invoiceData) {
                        setPayments(invoiceData.payments || []);
                    }
                } catch (invoiceError) {
                    if (invoiceError.response?.status !== 404) {
                        console.error('Error loading invoice:', invoiceError);
                    }
                }
            } catch (err) {
                console.error('Error loading reservation:', err);
                setError(t('reservation.details.errorLoading', 'Error loading reservation details'));
            } finally {
                setLoading(false);
            }
        };

        fetchReservationData();
    }, [id, t]);

    // Scroll detection for sticky header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Modal submit handlers
    const handleEditDatesSubmit = async (data) => {
        try {
            await reservationService.updateDates(id, data);
            const updatedReservation = await reservationService.getById(id);
            setReservation(updatedReservation);
            setShowEditDatesModal(false);
        } catch (err) {
            console.error('Error updating dates:', err);
            alert(t('reservation.editDates.error', 'Error updating dates'));
        }
    };

    const handleDeliverCarSubmit = async (data) => {
        try {
            await reservationService.deliverCar(id, data);
            const updatedReservation = await reservationService.getById(id);
            setReservation(updatedReservation);
            setShowDeliverCarModal(false);
        } catch (err) {
            console.error('Error delivering car:', err);
            alert(t('reservation.deliverCar.error', 'Error delivering car'));
        }
    };

    const handleReturnCarSubmit = async (data) => {
        try {
            await reservationService.returnCar(id, data);
            const updatedReservation = await reservationService.getById(id);
            setReservation(updatedReservation);
            setShowReturnCarModal(false);
        } catch (err) {
            console.error('Error returning car:', err);
            alert(t('reservation.returnCar.error', 'Error returning car'));
        }
    };

    const handleGenerateInvoiceSubmit = async (data) => {
        try {
            const newInvoice = await invoiceService.create({ ...data, reservationId: id });
            setInvoice(newInvoice);
            setShowGenerateInvoiceModal(false);
        } catch (err) {
            console.error('Error generating invoice:', err);
            alert(t('invoice.generate.error', 'Error generating invoice'));
        }
    };

    const handleAddPaymentSubmit = async (data) => {
        try {
            await invoiceService.addPayment(invoice.id, data);
            const updatedInvoice = await invoiceService.getByReservationId(id);
            setInvoice(updatedInvoice);
            setPayments(updatedInvoice.payments || []);
            setShowAddPaymentModal(false);
        } catch (err) {
            console.error('Error adding payment:', err);
            alert(t('payment.add.error', 'Error adding payment'));
        }
    };

    const handleEditCarSubmit = async (carId) => {
        try {
            await reservationService.updateCar(id, { carId });
            const updatedReservation = await reservationService.getById(id);
            setReservation(updatedReservation);
            setShowSelectCarModal(false);
        } catch (err) {
            console.error('Error updating car:', err);
            alert(t('reservation.editCar.error', 'Error updating car'));
        }
    };

    const handleEditPricesSubmit = async (data) => {
        try {
            await reservationService.updatePrices(id, data);
            const updatedReservation = await reservationService.getById(id);
            setReservation(updatedReservation);
            setShowEditPricesModal(false);
        } catch (err) {
            console.error('Error updating prices:', err);
            alert(t('reservation.editPrices.error', 'Error updating prices'));
        }
    };

    const handleEditCustomerSubmit = async (customerId, data) => {
        // Implementation for editing customer
        setShowCustomerModal(false);
    };

    const handleAddCustomerSubmit = async (customerId) => {
        // Implementation for adding customer
        setShowCustomerModal(false);
    };

    const handleRemoveCustomerSubmit = async (customerId) => {
        // Implementation for removing customer
        setShowCustomerModal(false);
    };

    const handleRemoveReservation = async () => {
        try {
            await reservationService.delete(id);
            navigate('/reservations');
        } catch (err) {
            console.error('Error removing reservation:', err);
            alert(t('reservation.remove.error', 'Error removing reservation'));
        }
    };

    const getPrimaryAction = () => {
        if (!reservation) return null;

        const status = reservation.status?.toLowerCase();

        if (status === 'reserved') {
            return {
                label: t('reservation.actions.deliverCar', 'Deliver Car'),
                onClick: () => setShowDeliverCarModal(true),
                icon: '🚗',
                variant: 'success'
            };
        } else if (status === 'ongoing') {
            return {
                label: t('reservation.actions.returnCar', 'Return Car'),
                onClick: () => setShowReturnCarModal(true),
                icon: '✓',
                variant: 'primary'
            };
        }

        return null;
    };

    if (loading) {
        return (
            <div className="reservation-loading">
                <div className="loading-spinner"></div>
                <p>{t('common.loading', 'Loading...')}</p>
            </div>
        );
    }

    if (error || !reservation) {
        return (
            <div className="reservation-error">
                <p>{error || t('reservation.details.notFound', 'Reservation not found')}</p>
            </div>
        );
    }

    const primaryAction = getPrimaryAction();

    return (
        <div className="reservation-details-container">
            <StickyHeader
                reservation={reservation}
                isVisible={isScrolled}
                primaryAction={primaryAction}
            />

            <HeroSection
                reservation={reservation}
                invoice={invoice}
                primaryAction={primaryAction}
            />

            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                customerCount={reservation.customers?.length || 0}
                paymentCount={payments.length}
            />

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <OverviewTab
                        reservation={reservation}
                        invoice={invoice}
                        onEditDates={() => setShowEditDatesModal(true)}
                        onEditCar={() => setShowSelectCarModal(true)}
                        onEditPrices={() => setShowEditPricesModal(true)}
                        onGenerateInvoice={() => setShowGenerateInvoiceModal(true)}
                    />
                )}

                {activeTab === 'customers' && (
                    <CustomerTab
                        reservation={reservation}
                        onAddCustomer={() => {
                            setCustomerAction('add');
                            setShowCustomerModal(true);
                        }}
                        onEditCustomer={(customer) => {
                            setSelectedCustomer(customer);
                            setCustomerAction('edit');
                            setShowCustomerModal(true);
                        }}
                        onRemoveCustomer={(customer) => {
                            setSelectedCustomer(customer);
                            setCustomerAction('remove');
                            setShowCustomerModal(true);
                        }}
                    />
                )}

                {activeTab === 'payments' && (
                    <PaymentsTab
                        invoice={invoice}
                        payments={payments}
                        onAddPayment={() => setShowAddPaymentModal(true)}
                        onGenerateInvoice={() => setShowGenerateInvoiceModal(true)}
                    />
                )}

                {activeTab === 'history' && (
                    <HistoryTab reservation={reservation} />
                )}
            </div>

            {primaryAction && (
                <FloatingActionButton action={primaryAction} />
            )}

            {/* Modals */}
            {showEditDatesModal && (
                <EditDatesModal
                    reservation={reservation}
                    onClose={() => setShowEditDatesModal(false)}
                    onSubmit={handleEditDatesSubmit}
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

            {showEditPricesModal && (
                <EditPricesModal
                    reservation={reservation}
                    onClose={() => setShowEditPricesModal(false)}
                    onSubmit={handleEditPricesSubmit}
                />
            )}

            {showRemoveModal && (
                <RemoveReservationModal
                    reservation={reservation}
                    onClose={() => setShowRemoveModal(false)}
                    onConfirm={handleRemoveReservation}
                />
            )}
        </div>
    );
};

export default ReservationDetails;