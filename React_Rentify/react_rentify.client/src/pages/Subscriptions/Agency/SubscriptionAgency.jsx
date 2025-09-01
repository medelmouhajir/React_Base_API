// src/pages/Subscriptions/Agency/SubscriptionAgency.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRtlDirection } from '../../../hooks/useRtlDirection';
import subscriptionService from '../../../services/subscriptionService';
import './SubscriptionAgency.css';

const SubscriptionAgency = () => {
    const { t } = useTranslation();
    const { id: agencyId } = useParams();
    useRtlDirection();

    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [currentUsage, setCurrentUsage] = useState(null);
    const [featureAccess, setFeatureAccess] = useState({});
    const [invoices, setInvoices] = useState([]);
    const [isOperating, setIsOperating] = useState(false);
    const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    // Load subscription data
    useEffect(() => {
        const loadSubscriptionData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [
                    subscriptionData,
                    plansData,
                    usageData,
                    featuresData,
                    invoicesData
                ] = await Promise.all([
                    subscriptionService.getCurrentSubscription(agencyId).catch(() => null),
                    subscriptionService.getAvailablePlans().catch(() => []),
                    subscriptionService.getCurrentUsage(agencyId).catch(() => null),
                    // Use hasFeatures method instead of getAllFeatureAccess
                    subscriptionService.hasFeatures(agencyId, [
                        'MaintenanceModule',
                        'ExpenseTracking',
                        'AdvancedReporting',
                        'APIAccess',
                        'GPSTracking'
                    ]).catch(() => { }),
                    // Use a simple empty array for invoices if method doesn't exist
                    Promise.resolve([])
                ]);

                setSubscription(subscriptionData);
                setAvailablePlans(plansData);
                setCurrentUsage(usageData);
                setFeatureAccess(featuresData);
                setInvoices(invoicesData);
            } catch (err) {
                console.error('❌ Error loading subscription data:', err);
                setError(t('subscriptions.agency.loadError'));
            } finally {
                setIsLoading(false);
            }
        };

        loadSubscriptionData();
    }, [agencyId, t]);

    // Subscribe to a plan
    const handleSubscribe = async (planId, startTrial = false) => {
        setIsOperating(true);
        try {
            await subscriptionService.createSubscription(agencyId, {
                planId,
                startTrial
            });
            // Reload data
            window.location.reload();
        } catch (err) {
            console.error('❌ Error subscribing to plan:', err);
            setError(t('subscriptions.agency.subscribeError'));
        } finally {
            setIsOperating(false);
        }
    };

    // Upgrade subscription
    const handleUpgrade = async () => {
        if (!selectedPlanId) return;

        setIsOperating(true);
        try {
            await subscriptionService.upgradeSubscription(agencyId, {
                newPlanId: selectedPlanId
            });
            setShowPlanUpgrade(false);
            setSelectedPlanId(null);
            // Reload data
            window.location.reload();
        } catch (err) {
            console.error('❌ Error upgrading subscription:', err);
            setError(t('subscriptions.agency.upgradeError'));
        } finally {
            setIsOperating(false);
        }
    };

    // Cancel subscription
    const handleCancel = async () => {
        if (!window.confirm(t('subscriptions.agency.confirmCancel'))) return;

        setIsOperating(true);
        try {
            await subscriptionService.cancelSubscription(agencyId);
            // Reload data
            window.location.reload();
        } catch (err) {
            console.error('❌ Error cancelling subscription:', err);
            setError(t('subscriptions.agency.cancelError'));
        } finally {
            setIsOperating(false);
        }
    };

    // Resume subscription
    const handleResume = async () => {
        setIsOperating(true);
        try {
            await subscriptionService.resumeSubscription(agencyId);
            // Reload data
            window.location.reload();
        } catch (err) {
            console.error('❌ Error resuming subscription:', err);
            setError(t('subscriptions.agency.resumeError'));
        } finally {
            setIsOperating(false);
        }
    };

    // Format currency
    const formatCurrency = (amount, currency = 'MAD') => {
        return new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'status-active';
            case 'trial': return 'status-trial';
            case 'cancelled': return 'status-cancelled';
            case 'suspended': return 'status-suspended';
            case 'expired': return 'status-expired';
            default: return 'status-unknown';
        }
    };

    if (isLoading) {
        return (
            <div className="subscription-agency-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="subscription-agency-container">
                <div className="error-state">
                    <div className="error-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3>{t('subscriptions.agency.errorTitle')}</h3>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={() => window.location.reload()}>
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="subscription-agency-container">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">{t('subscriptions.agency.title')}</h1>
                    <p className="page-subtitle">{t('subscriptions.agency.subtitle')}</p>
                </div>
            </div>

            {/* Current Subscription Status */}
            {subscription ? (
                <div className="subscription-overview-card">
                    <div className="card-header">
                        <h2 className="card-title">{t('subscriptions.agency.currentPlan')}</h2>
                        <span className={`status-badge ${getStatusBadgeClass(subscription.status)}`}>
                            {t(`subscriptions.status.${subscription.status?.toLowerCase()}`)}
                        </span>
                    </div>
                    <div className="card-content">
                        <div className="subscription-details">
                            <div className="detail-group">
                                <label className="detail-label">{t('subscriptions.agency.planName')}</label>
                                <span className="detail-value">{subscription.subscriptionPlan?.name}</span>
                            </div>
                            <div className="detail-group">
                                <label className="detail-label">{t('subscriptions.agency.price')}</label>
                                <span className="detail-value">
                                    {formatCurrency(subscription.currentPrice)}
                                    / {t(`subscriptions.billingCycle.${subscription.subscriptionPlan?.billingCycle === 1 ? 'monthly' : 'yearly'}`)}
                                </span>
                            </div>
                            <div className="detail-group">
                                <label className="detail-label">{t('subscriptions.agency.nextBilling')}</label>
                                <span className="detail-value">{formatDate(subscription.nextBillingDate)}</span>
                            </div>
                            {subscription.isTrialPeriod && (
                                <div className="detail-group trial-info">
                                    <label className="detail-label">{t('subscriptions.agency.trialEnds')}</label>
                                    <span className="detail-value trial-date">{formatDate(subscription.trialEndDate)}</span>
                                </div>
                            )}
                        </div>
                        <div className="subscription-actions">
                            {subscription.status === 'Active' && (
                                <>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setShowPlanUpgrade(true)}
                                        disabled={isOperating}
                                    >
                                        {t('subscriptions.agency.upgrade')}
                                    </button>
                                    <button
                                        className="btn-danger"
                                        onClick={handleCancel}
                                        disabled={isOperating}
                                    >
                                        {t('subscriptions.agency.cancel')}
                                    </button>
                                </>
                            )}
                            {subscription.status === 'Cancelled' && (
                                <button
                                    className="btn-primary"
                                    onClick={handleResume}
                                    disabled={isOperating}
                                >
                                    {t('subscriptions.agency.resume')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* No Subscription - Show Available Plans */
                <div className="no-subscription-state">
                    <div className="empty-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3>{t('subscriptions.agency.noSubscription')}</h3>
                    <p>{t('subscriptions.agency.noSubscriptionDescription')}</p>
                </div>
            )}

            {/* Available Plans */}
            {availablePlans.length > 0 && (
                <div className="plans-section">
                    <h2 className="section-title">
                        {subscription ? t('subscriptions.agency.availablePlans') : t('subscriptions.agency.choosePlan')}
                    </h2>
                    <div className="plans-grid">
                        {availablePlans.map((plan) => (
                            <div key={plan.id} className="plan-card">
                                <div className="plan-header">
                                    <h3 className="plan-name">{plan.name}</h3>
                                    <div className="plan-price">
                                        <span className="price-amount">{formatCurrency(plan.price)}</span>
                                        <span className="price-period">
                                            / {t(`subscriptions.billingCycle.${plan.billingCycle === 1 ? 'monthly' : 'yearly'}`)}
                                        </span>
                                    </div>
                                </div>
                                <div className="plan-content">
                                    {plan.description && (
                                        <p className="plan-description">{plan.description}</p>
                                    )}
                                    <div className="plan-features">
                                        <h4 className="features-title">{t('subscriptions.agency.features')}</h4>
                                        <ul className="features-list">
                                            <li>{t('subscriptions.agency.maxCars', { count: plan.maxCars })}</li>
                                            <li>{t('subscriptions.agency.maxUsers', { count: plan.maxUsers })}</li>
                                            <li>{t('subscriptions.agency.maxCustomers', { count: plan.maxCustomers })}</li>
                                            <li>{t('subscriptions.agency.maxReservations', { count: plan.maxReservations })}</li>
                                            {plan.hasMaintenanceModule && <li>{t('subscriptions.agency.maintenanceModule')}</li>}
                                            {plan.hasExpenseTracking && <li>{t('subscriptions.agency.expenseTracking')}</li>}
                                            {plan.hasAdvancedReporting && <li>{t('subscriptions.agency.advancedReporting')}</li>}
                                            {plan.hasAPIAccess && <li>{t('subscriptions.agency.apiAccess')}</li>}
                                            {plan.hasGPSTracking && <li>{t('subscriptions.agency.gpsTracking')}</li>}
                                        </ul>
                                    </div>
                                </div>
                                <div className="plan-actions">
                                    {!subscription ? (
                                        <div className="subscribe-buttons">
                                            <button
                                                className="btn-secondary"
                                                onClick={() => handleSubscribe(plan.id, true)}
                                                disabled={isOperating}
                                            >
                                                {t('subscriptions.agency.startTrial')}
                                            </button>
                                            <button
                                                className="btn-primary"
                                                onClick={() => handleSubscribe(plan.id, false)}
                                                disabled={isOperating}
                                            >
                                                {t('subscriptions.agency.subscribe')}
                                            </button>
                                        </div>
                                    ) : subscription.subscriptionPlan?.id !== plan.id && (
                                        <button
                                            className="btn-secondary"
                                            onClick={() => {
                                                setSelectedPlanId(plan.id);
                                                setShowPlanUpgrade(true);
                                            }}
                                            disabled={isOperating}
                                        >
                                            {t('subscriptions.agency.switchToPlan')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Usage Overview */}
            {subscription && currentUsage && (
                <div className="usage-overview-card">
                    <h2 className="card-title">{t('subscriptions.agency.currentUsage')}</h2>
                    <div className="usage-grid">
                        <div className="usage-item">
                            <label className="usage-label">{t('subscriptions.agency.carsUsed')}</label>
                            <div className="usage-bar">
                                <div className="usage-progress" style={{
                                    width: `${Math.min((currentUsage.carsCount / subscription.subscriptionPlan?.maxCars) * 100, 100)}%`
                                }}></div>
                            </div>
                            <span className="usage-text">
                                {currentUsage.carsCount} / {subscription.subscriptionPlan?.maxCars}
                            </span>
                        </div>
                        <div className="usage-item">
                            <label className="usage-label">{t('subscriptions.agency.usersUsed')}</label>
                            <div className="usage-bar">
                                <div className="usage-progress" style={{
                                    width: `${Math.min((currentUsage.usersCount / subscription.subscriptionPlan?.maxUsers) * 100, 100)}%`
                                }}></div>
                            </div>
                            <span className="usage-text">
                                {currentUsage.usersCount} / {subscription.subscriptionPlan?.maxUsers}
                            </span>
                        </div>
                        <div className="usage-item">
                            <label className="usage-label">{t('subscriptions.agency.customersUsed')}</label>
                            <div className="usage-bar">
                                <div className="usage-progress" style={{
                                    width: `${Math.min((currentUsage.customersCount / subscription.subscriptionPlan?.maxCustomers) * 100, 100)}%`
                                }}></div>
                            </div>
                            <span className="usage-text">
                                {currentUsage.customersCount} / {subscription.subscriptionPlan?.maxCustomers}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Invoices */}
            {invoices.length > 0 && (
                <div className="invoices-section">
                    <h2 className="section-title">{t('subscriptions.agency.recentInvoices')}</h2>
                    <div className="invoices-placeholder">
                        <div className="empty-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p>{t('subscriptions.agency.invoicesComingSoon')}</p>
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
            {showPlanUpgrade && (
                <div className="modal-overlay" onClick={() => setShowPlanUpgrade(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('subscriptions.agency.confirmUpgrade')}</h3>
                            <button className="modal-close" onClick={() => setShowPlanUpgrade(false)}>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>{t('subscriptions.agency.upgradeConfirmation')}</p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowPlanUpgrade(false)}
                                disabled={isOperating}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleUpgrade}
                                disabled={isOperating}
                            >
                                {isOperating ? t('common.processing') : t('subscriptions.agency.confirmUpgrade')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionAgency;