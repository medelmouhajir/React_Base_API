// src/pages/Subscriptions/List/SubscriptionsList.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useRtlDirection } from '../../../hooks/useRtlDirection';
import subscriptionService from '../../../services/subscriptionService';
import Loading from '../../../components/Loading/Loading';
import './SubscriptionsList.css';

const SubscriptionsList = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    useRtlDirection();

    // State
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        billingCycle: 1, // Monthly
        maxCars: '',
        maxUsers: '',
        maxCustomers: '',
        maxReservations: '',
        hasMaintenanceModule: false,
        hasExpenseTracking: false,
        hasAdvancedReporting: false,
        hasAPIAccess: false,
        hasGPSTracking: false
    });

    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await subscriptionService.getAvailablePlans();
            setPlans(data);
        } catch (err) {
            console.error('Error fetching subscription plans:', err);
            setError(t('subscriptions.list.fetchError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredPlans = plans.filter((plan) =>
        plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            billingCycle: 1,
            maxCars: '',
            maxUsers: '',
            maxCustomers: '',
            maxReservations: '',
            hasMaintenanceModule: false,
            hasExpenseTracking: false,
            hasAdvancedReporting: false,
            hasAPIAccess: false,
            hasGPSTracking: false
        });
        setEditingPlan(null);
    };

    const handleAddNew = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (plan) => {
        setFormData({
            name: plan.name || '',
            description: plan.description || '',
            price: plan.price?.toString() || '',
            billingCycle: plan.billingCycle || 1,
            maxCars: plan.maxCars?.toString() || '',
            maxUsers: plan.maxUsers?.toString() || '',
            maxCustomers: plan.maxCustomers?.toString() || '',
            maxReservations: plan.maxReservations?.toString() || '',
            hasMaintenanceModule: plan.hasMaintenanceModule || false,
            hasExpenseTracking: plan.hasExpenseTracking || false,
            hasAdvancedReporting: plan.hasAdvancedReporting || false,
            hasAPIAccess: plan.hasAPIAccess || false,
            hasGPSTracking: plan.hasGPSTracking || false
        });
        setEditingPlan(plan);
        setShowModal(true);
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setActionLoading({ submit: true });

            const payload = {
                name: formData.name,
                description: formData.description || null,
                price: parseFloat(formData.price),
                billingCycle: parseInt(formData.billingCycle),
                maxCars: parseInt(formData.maxCars) || 0,
                maxUsers: parseInt(formData.maxUsers) || 0,
                maxCustomers: parseInt(formData.maxCustomers) || 0,
                maxReservations: parseInt(formData.maxReservations) || 0,
                hasMaintenanceModule: formData.hasMaintenanceModule,
                hasExpenseTracking: formData.hasExpenseTracking,
                hasAdvancedReporting: formData.hasAdvancedReporting,
                hasAPIAccess: formData.hasAPIAccess,
                hasGPSTracking: formData.hasGPSTracking
            };

            if (editingPlan) {
                await subscriptionService.updatePlan(editingPlan.id, payload);
            } else {
                await subscriptionService.createPlan(payload);
            }

            await fetchPlans();
            setShowModal(false);
            resetForm();
        } catch (err) {
            console.error('Error saving plan:', err);
            setError(editingPlan ? t('subscriptions.updateError') : t('subscriptions.createError'));
        } finally {
            setActionLoading({ submit: false });
        }
    };

    const handleDelete = async (planId) => {
        try {
            setActionLoading({ [`delete_${planId}`]: true });
            await subscriptionService.deletePlan(planId);
            await fetchPlans();
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting plan:', err);
            setError(t('subscriptions.deleteError'));
        } finally {
            setActionLoading({ [`delete_${planId}`]: false });
        }
    };

    const formatPrice = (price, billingCycle) => {
        const currency = t('common.currency');
        const cycle = billingCycle === 1 ? t('subscriptions.monthly') : t('subscriptions.yearly');
        return `${currency}${price}/${cycle}`;
    };

    const getBillingCycleText = (cycle) => {
        return cycle === 1 ? t('subscriptions.monthly') : t('subscriptions.yearly');
    };

    const getFeaturesList = (plan) => {
        const features = [];
        if (plan.hasMaintenanceModule) features.push(t('subscriptions.features.maintenance'));
        if (plan.hasExpenseTracking) features.push(t('subscriptions.features.expenses'));
        if (plan.hasAdvancedReporting) features.push(t('subscriptions.features.reporting'));
        if (plan.hasAPIAccess) features.push(t('subscriptions.features.api'));
        if (plan.hasGPSTracking) features.push(t('subscriptions.features.gps'));
        return features;
    };

    if (isLoading) {
        return (
            <div className="sl-loading-wrapper">
                <Loading type="spinner" />
                <p className="sl-loading-text">{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sl-error-wrapper">
                <div className="sl-error-message">{error}</div>
                <button className="sl-retry-btn" onClick={fetchPlans}>
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className={`subscriptions-list-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="sl-header">
                <h1 className="sl-title">{t('subscriptions.list.title')}</h1>
                {isAdmin && (
                    <button
                        className="sl-btn-add"
                        onClick={handleAddNew}
                    >
                        <svg className="sl-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {t('subscriptions.add')}
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="sl-search-section">
                <div className="sl-search-wrapper">
                    <svg className="sl-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder={t('subscriptions.searchPlaceholder')}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="sl-search-input"
                    />
                </div>
            </div>

            {/* Plans Grid */}
            <div className="sl-plans-grid">
                {filteredPlans.map((plan) => (
                    <div key={plan.id} className={`sl-plan-card ${!plan.isActive ? 'inactive' : ''}`}>
                        <div className="sl-plan-header">
                            <div className="sl-plan-title-section">
                                <h3 className="sl-plan-name">{plan.name}</h3>
                                <div className="sl-plan-price">{formatPrice(plan.price, plan.billingCycle)}</div>
                            </div>
                            {isAdmin && (
                                <div className="sl-plan-actions">
                                    <button
                                        className="sl-action-btn sl-btn-edit"
                                        onClick={() => handleEdit(plan)}
                                        title={t('common.edit')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="sl-action-btn sl-btn-delete"
                                        onClick={() => setShowDeleteConfirm(plan)}
                                        title={t('common.delete')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {plan.description && (
                            <p className="sl-plan-description">{plan.description}</p>
                        )}

                        <div className="sl-plan-limits">
                            <div className="sl-limit-item">
                                <span className="sl-limit-label">{t('subscriptions.limits.cars')}</span>
                                <span className="sl-limit-value">{plan.maxCars || t('common.unlimited')}</span>
                            </div>
                            <div className="sl-limit-item">
                                <span className="sl-limit-label">{t('subscriptions.limits.users')}</span>
                                <span className="sl-limit-value">{plan.maxUsers || t('common.unlimited')}</span>
                            </div>
                            <div className="sl-limit-item">
                                <span className="sl-limit-label">{t('subscriptions.limits.customers')}</span>
                                <span className="sl-limit-value">{plan.maxCustomers || t('common.unlimited')}</span>
                            </div>
                            <div className="sl-limit-item">
                                <span className="sl-limit-label">{t('subscriptions.limits.reservations')}</span>
                                <span className="sl-limit-value">{plan.maxReservations || t('common.unlimited')}</span>
                            </div>
                        </div>

                        {getFeaturesList(plan).length > 0 && (
                            <div className="sl-plan-features">
                                <h4 className="sl-features-title">{t('subscriptions.features.title')}</h4>
                                <ul className="sl-features-list">
                                    {getFeaturesList(plan).map((feature, index) => (
                                        <li key={index} className="sl-feature-item">
                                            <svg className="sl-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="sl-plan-footer">
                            <div className="sl-plan-meta">
                                <span className={`sl-status ${plan.isActive ? 'active' : 'inactive'}`}>
                                    {plan.isActive ? t('common.active') : t('common.inactive')}
                                </span>
                                <span className="sl-billing-cycle">{getBillingCycleText(plan.billingCycle)}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredPlans.length === 0 && (
                    <div className="sl-no-results">
                        <svg className="sl-no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <p className="sl-no-results-text">
                            {searchTerm ? t('subscriptions.noSearchResults') : t('subscriptions.noPlansFound')}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit */}
            {showModal && isAdmin && (
                <div className="sl-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="sl-modal" onClick={e => e.stopPropagation()}>
                        <div className="sl-modal-header">
                            <h2 className="sl-modal-title">
                                {editingPlan ? t('subscriptions.editPlan') : t('subscriptions.addPlan')}
                            </h2>
                            <button
                                className="sl-modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="sl-form">
                            <div className="sl-form-grid">
                                {/* Basic Information */}
                                <div className="sl-form-section">
                                    <h3 className="sl-section-title">{t('subscriptions.form.basicInfo')}</h3>

                                    <div className="sl-form-group">
                                        <label className="sl-form-label">{t('subscriptions.form.name')}</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleFormChange('name', e.target.value)}
                                            className="sl-form-input"
                                            required
                                        />
                                    </div>

                                    <div className="sl-form-group">
                                        <label className="sl-form-label">{t('subscriptions.form.description')}</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleFormChange('description', e.target.value)}
                                            className="sl-form-textarea"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="sl-form-row">
                                        <div className="sl-form-group">
                                            <label className="sl-form-label">{t('subscriptions.form.price')}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => handleFormChange('price', e.target.value)}
                                                className="sl-form-input"
                                                required
                                            />
                                        </div>

                                        <div className="sl-form-group">
                                            <label className="sl-form-label">{t('subscriptions.form.billingCycle')}</label>
                                            <select
                                                value={formData.billingCycle}
                                                onChange={(e) => handleFormChange('billingCycle', parseInt(e.target.value))}
                                                className="sl-form-select"
                                            >
                                                <option value={1}>{t('subscriptions.monthly')}</option>
                                                <option value={12}>{t('subscriptions.yearly')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Limits */}
                                <div className="sl-form-section">
                                    <h3 className="sl-section-title">{t('subscriptions.form.limits')}</h3>

                                    <div className="sl-form-row">
                                        <div className="sl-form-group">
                                            <label className="sl-form-label">{t('subscriptions.limits.cars')}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.maxCars}
                                                onChange={(e) => handleFormChange('maxCars', e.target.value)}
                                                className="sl-form-input"
                                            />
                                        </div>

                                        <div className="sl-form-group">
                                            <label className="sl-form-label">{t('subscriptions.limits.users')}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.maxUsers}
                                                onChange={(e) => handleFormChange('maxUsers', e.target.value)}
                                                className="sl-form-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="sl-form-row">
                                        <div className="sl-form-group">
                                            <label className="sl-form-label">{t('subscriptions.limits.customers')}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.maxCustomers}
                                                onChange={(e) => handleFormChange('maxCustomers', e.target.value)}
                                                className="sl-form-input"
                                            />
                                        </div>

                                        <div className="sl-form-group">
                                            <label className="sl-form-label">{t('subscriptions.limits.reservations')}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.maxReservations}
                                                onChange={(e) => handleFormChange('maxReservations', e.target.value)}
                                                className="sl-form-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="sl-form-section">
                                    <h3 className="sl-section-title">{t('subscriptions.form.features')}</h3>

                                    <div className="sl-features-grid">
                                        <div className="sl-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="maintenance"
                                                checked={formData.hasMaintenanceModule}
                                                onChange={(e) => handleFormChange('hasMaintenanceModule', e.target.checked)}
                                            />
                                            <label htmlFor="maintenance">{t('subscriptions.features.maintenance')}</label>
                                        </div>

                                        <div className="sl-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="expenses"
                                                checked={formData.hasExpenseTracking}
                                                onChange={(e) => handleFormChange('hasExpenseTracking', e.target.checked)}
                                            />
                                            <label htmlFor="expenses">{t('subscriptions.features.expenses')}</label>
                                        </div>

                                        <div className="sl-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="reporting"
                                                checked={formData.hasAdvancedReporting}
                                                onChange={(e) => handleFormChange('hasAdvancedReporting', e.target.checked)}
                                            />
                                            <label htmlFor="reporting">{t('subscriptions.features.reporting')}</label>
                                        </div>

                                        <div className="sl-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="api"
                                                checked={formData.hasAPIAccess}
                                                onChange={(e) => handleFormChange('hasAPIAccess', e.target.checked)}
                                            />
                                            <label htmlFor="api">{t('subscriptions.features.api')}</label>
                                        </div>

                                        <div className="sl-form-checkbox">
                                            <input
                                                type="checkbox"
                                                id="gps"
                                                checked={formData.hasGPSTracking}
                                                onChange={(e) => handleFormChange('hasGPSTracking', e.target.checked)}
                                            />
                                            <label htmlFor="gps">{t('subscriptions.features.gps')}</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="sl-modal-actions">
                                <button
                                    type="button"
                                    className="sl-btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    disabled={actionLoading.submit}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="sl-btn-primary"
                                    disabled={actionLoading.submit}
                                >
                                    {actionLoading.submit && (
                                        <div className="sl-btn-spinner" />
                                    )}
                                    {editingPlan ? t('common.update') : t('common.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="sl-modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="sl-modal sl-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="sl-modal-header">
                            <h2 className="sl-modal-title">{t('common.confirmDelete')}</h2>
                        </div>

                        <div className="sl-modal-body">
                            <p>{t('subscriptions.confirmDeletePlan', { name: showDeleteConfirm.name })}</p>
                        </div>

                        <div className="sl-modal-actions">
                            <button
                                type="button"
                                className="sl-btn-secondary"
                                onClick={() => setShowDeleteConfirm(null)}
                                disabled={actionLoading[`delete_${showDeleteConfirm.id}`]}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                className="sl-btn-danger"
                                onClick={() => handleDelete(showDeleteConfirm.id)}
                                disabled={actionLoading[`delete_${showDeleteConfirm.id}`]}
                            >
                                {actionLoading[`delete_${showDeleteConfirm.id}`] && (
                                    <div className="sl-btn-spinner" />
                                )}
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionsList;