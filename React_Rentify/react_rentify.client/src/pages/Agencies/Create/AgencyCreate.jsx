// src/pages/Agencies/Create/AgencyCreate.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import agencyService from '../../../services/agencyService';
import subscriptionService from '../../../services/subscriptionService';
import './AgencyCreate.css';

const AgencyCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        email: '',
        phoneOne: '',
        phoneTwo: '',
        subscriptionPlanId: '',
    });
    const [availablePlans, setAvailablePlans] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [error, setError] = useState(null);

    // Load available subscription plans
    useEffect(() => {
        const loadPlans = async () => {
            try {
                setIsLoadingPlans(true);
                const plans = await subscriptionService.getAvailablePlans();
                setAvailablePlans(plans.filter(plan => plan.isActive));
            } catch (err) {
                console.error('❌ Error loading subscription plans:', err);
                setError(t('agency.create.subscriptionLoadError'));
            } finally {
                setIsLoadingPlans(false);
            }
        };

        loadPlans();
    }, [t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePlanSelect = (planId) => {
        setFormData((prev) => ({
            ...prev,
            subscriptionPlanId: planId,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!formData.subscriptionPlanId) {
            setError(t('agency.create.subscriptionRequired'));
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                address: formData.address,
                email: formData.email || null,
                phoneOne: formData.phoneOne,
                phoneTwo: formData.phoneTwo || null,
                subscriptionPlanId: formData.subscriptionPlanId,
            };

            await agencyService.create(payload);
            navigate('/agencies');
        } catch (err) {
            console.error('❌ Error creating agency:', err);
            setError(t('agency.create.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/agencies');
    };

    const formatPrice = (price, billingCycle) => {
        const currency = '$'; // You can get this from your locale/settings
        const period = billingCycle === 1 ? t('subscriptions.monthly') : t('subscriptions.yearly');
        return `${currency}${price}/${period}`;
    };

    const getFeaturesList = (plan) => {
        const features = [];
        features.push(t('subscription.agency.maxCars', { count: plan.maxCars }));
        features.push(t('subscription.agency.maxUsers', { count: plan.maxUsers }));
        features.push(t('subscription.agency.maxCustomers', { count: plan.maxCustomers }));
        features.push(t('subscription.agency.maxReservations', { count: plan.maxReservations }));

        if (plan.hasMaintenanceModule) features.push(t('subscription.agency.maintenanceModule'));
        if (plan.hasExpenseTracking) features.push(t('subscription.agency.expenseTracking'));
        if (plan.hasAdvancedReporting) features.push(t('subscription.agency.advancedReporting'));
        if (plan.hasAPIAccess) features.push(t('subscription.agency.apiAccess'));
        if (plan.hasGPSTracking) features.push(t('subscription.agency.gpsTracking'));

        return features;
    };

    return (
        <div className="agency-create-container">
            <h1 className="page-title">{t('agency.create.title')}</h1>

            {error && <div className="error-message">{error}</div>}

            <form className="agency-form" onSubmit={handleSubmit} noValidate>
                {/* Basic Information Section */}
                <div className="form-section">
                    <h2 className="section-title">{t('agency.create.basicInfo')}</h2>

                    {/* Name Field */}
                    <div className="form-group">
                        <label htmlFor="name">{t('agency.fields.name')}</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder={t('agency.placeholders.name')}
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Address Field */}
                    <div className="form-group">
                        <label htmlFor="address">{t('agency.fields.address')}</label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            placeholder={t('agency.placeholders.address')}
                            value={formData.address}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Email Field */}
                    <div className="form-group">
                        <label htmlFor="email">{t('agency.fields.email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder={t('agency.placeholders.email')}
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Phone Fields */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phoneOne">{t('agency.fields.phoneOne')}</label>
                            <input
                                type="tel"
                                id="phoneOne"
                                name="phoneOne"
                                placeholder={t('agency.placeholders.phoneOne')}
                                value={formData.phoneOne}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneTwo">{t('agency.fields.phoneTwo')}</label>
                            <input
                                type="tel"
                                id="phoneTwo"
                                name="phoneTwo"
                                placeholder={t('agency.placeholders.phoneTwo')}
                                value={formData.phoneTwo}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Subscription Plan Selection */}
                <div className="form-section">
                    <h2 className="section-title">{t('agency.create.chooseSubscription')}</h2>

                    {isLoadingPlans ? (
                        <div className="plans-loading">
                            <p>{t('common.loading')}</p>
                        </div>
                    ) : availablePlans.length === 0 ? (
                        <div className="plans-error">
                            <p>{t('agency.create.noPlansAvailable')}</p>
                        </div>
                    ) : (
                        <div className="plans-grid">
                            {availablePlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`plan-card ${formData.subscriptionPlanId === plan.id ? 'selected' : ''}`}
                                    onClick={() => handlePlanSelect(plan.id)}
                                >
                                    <div className="plan-header">
                                        <div className="plan-info">
                                            <h3 className="plan-name">{plan.name}</h3>
                                            <div className="plan-price">
                                                {formatPrice(plan.price, plan.billingCycle)}
                                            </div>
                                        </div>
                                        <div className="plan-selector">
                                            <input
                                                type="radio"
                                                name="subscriptionPlan"
                                                value={plan.id}
                                                checked={formData.subscriptionPlanId === plan.id}
                                                onChange={() => handlePlanSelect(plan.id)}
                                                className="plan-radio"
                                            />
                                        </div>
                                    </div>

                                    {plan.description && (
                                        <p className="plan-description">{plan.description}</p>
                                    )}

                                    <div className="plan-features">
                                        <h4 className="features-title">{t('subscription.agency.features')}</h4>
                                        <ul className="features-list">
                                            {getFeaturesList(plan).map((feature, index) => (
                                                <li key={index} className="feature-item">
                                                    <span className="feature-icon">✓</span>
                                                    <span className="feature-text">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting || !formData.subscriptionPlanId}
                    >
                        {isSubmitting ? t('common.creating') : t('agency.create.createAgency')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AgencyCreate;