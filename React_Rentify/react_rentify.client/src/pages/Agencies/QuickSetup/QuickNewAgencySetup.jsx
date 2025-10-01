// src/pages/Agencies/QuickSetup/QuickNewAgencySetup.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { agencyQuickSetupService } from '../../../services/agencyQuickSetupService';
import subscriptionService from '../../../services/subscriptionService';
import './QuickNewAgencySetup.css';

const QuickNewAgencySetup = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);

    const [formData, setFormData] = useState({
        // Agency Information
        agencyName: '',
        agencyAddress: '',
        agencyEmail: '',
        agencyPhoneOne: '',
        agencyPhoneTwo: '',
        subscriptionPlanId: '',
        
        // Owner Information
        ownerFullName: '',
        ownerPassword: '',
        confirmPassword: ''
    });

    const [validationErrors, setValidationErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Fetch subscription plans on mount
    useEffect(() => {
        fetchSubscriptionPlans();
    }, []);

    const fetchSubscriptionPlans = async () => {
        try {
            const plans = await subscriptionService.getAvailablePlans();
            setSubscriptionPlans(plans);
            if (plans.length > 0) {
                setFormData(prev => ({ ...prev, subscriptionPlanId: plans[0].id }));
            }
        } catch (err) {
            console.error('Error fetching subscription plans:', err);
            setError(t('agencies.quickSetup.errors.loadPlans'));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Update password strength
        if (name === 'ownerPassword') {
            updatePasswordStrength(value);
        }
    };

    const updatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        setPasswordStrength(strength);
    };

    const validateStep = (step) => {
        const errors = {};

        if (step === 1) {
            // Agency Information Validation
            if (!formData.agencyName.trim()) {
                errors.agencyName = t('agencies.quickSetup.validation.agencyNameRequired');
            }
            if (!formData.agencyAddress.trim()) {
                errors.agencyAddress = t('agencies.quickSetup.validation.agencyAddressRequired');
            }
            if (!formData.agencyEmail.trim()) {
                errors.agencyEmail = t('agencies.quickSetup.validation.agencyEmailRequired');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.agencyEmail)) {
                errors.agencyEmail = t('agencies.quickSetup.validation.invalidEmail');
            }
            if (!formData.agencyPhoneOne.trim()) {
                errors.agencyPhoneOne = t('agencies.quickSetup.validation.phoneRequired');
            }
            if (!formData.subscriptionPlanId) {
                errors.subscriptionPlanId = t('agencies.quickSetup.validation.planRequired');
            }
        }

        if (step === 2) {
            // Owner Information Validation
            if (!formData.ownerFullName.trim()) {
                errors.ownerFullName = t('agencies.quickSetup.validation.ownerNameRequired');
            }
            if (!formData.ownerPassword) {
                errors.ownerPassword = t('agencies.quickSetup.validation.passwordRequired');
            } else if (formData.ownerPassword.length < 6) {
                errors.ownerPassword = t('agencies.quickSetup.validation.passwordTooShort');
            }
            if (formData.ownerPassword !== formData.confirmPassword) {
                errors.confirmPassword = t('agencies.quickSetup.validation.passwordMismatch');
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            setError(null);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateStep(2)) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const setupData = {
                agencyName: formData.agencyName,
                agencyAddress: formData.agencyAddress,
                agencyEmail: formData.agencyEmail,
                agencyPhoneOne: formData.agencyPhoneOne,
                agencyPhoneTwo: formData.agencyPhoneTwo || null,
                subscriptionPlanId: formData.subscriptionPlanId,
                ownerFullName: formData.ownerFullName,
                ownerPassword: formData.ownerPassword
            };

            const response = await agencyQuickSetupService.createAgencyWithSetup(setupData);
            
            setSuccess(true);
            
            // Redirect after short delay
            //setTimeout(() => {
            //    navigate('/admin/agencies', { 
            //        state: { 
            //            message: t('agencies.quickSetup.success.created'),
            //            agencyId: response.agencyId 
            //        }
            //    });
            //}, 2000);

        } catch (err) {
            console.error('Error creating agency:', err);
            
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 409) {
                setError(t('agencies.quickSetup.errors.emailExists'));
            } else {
                setError(t('agencies.quickSetup.errors.createFailed'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrengthLabel = () => {
        const labels = [
            t('agencies.quickSetup.password.veryWeak'),
            t('agencies.quickSetup.password.weak'),
            t('agencies.quickSetup.password.fair'),
            t('agencies.quickSetup.password.good'),
            t('agencies.quickSetup.password.strong')
        ];
        return labels[passwordStrength] || labels[0];
    };

    const getPasswordStrengthColor = () => {
        const colors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];
        return colors[passwordStrength] || colors[0];
    };

    if (success) {
        return (
            <div className={`quick-setup-container ${isDarkMode ? 'dark' : ''}`}>
                <div className="success-message">
                    <div className="success-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2>{t('agencies.quickSetup.success.title')}</h2>
                    <p>{t('agencies.quickSetup.success.message')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`quick-setup-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="quick-setup-card">
                <div className="quick-setup-header">
                    <h1 className="quick-setup-title">
                        {t('agencies.quickSetup.title')}
                    </h1>
                    <p className="quick-setup-subtitle">
                        {t('agencies.quickSetup.subtitle')}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="progress-steps">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">{t('agencies.quickSetup.steps.agencyInfo')}</div>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">{t('agencies.quickSetup.steps.ownerInfo')}</div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-banner">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="quick-setup-form">
                    {/* Step 1: Agency Information */}
                    {currentStep === 1 && (
                        <div className="form-step">
                            <h3 className="step-title">{t('agencies.quickSetup.steps.agencyInfo')}</h3>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="agencyName" className="form-label required">
                                        {t('agencies.quickSetup.fields.agencyName')}
                                    </label>
                                    <input
                                        type="text"
                                        id="agencyName"
                                        name="agencyName"
                                        value={formData.agencyName}
                                        onChange={handleInputChange}
                                        className={`form-input ${validationErrors.agencyName ? 'error' : ''}`}
                                        placeholder={t('agencies.quickSetup.placeholders.agencyName')}
                                    />
                                    {validationErrors.agencyName && (
                                        <span className="error-text">{validationErrors.agencyName}</span>
                                    )}
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="agencyAddress" className="form-label required">
                                        {t('agencies.quickSetup.fields.agencyAddress')}
                                    </label>
                                    <input
                                        type="text"
                                        id="agencyAddress"
                                        name="agencyAddress"
                                        value={formData.agencyAddress}
                                        onChange={handleInputChange}
                                        className={`form-input ${validationErrors.agencyAddress ? 'error' : ''}`}
                                        placeholder={t('agencies.quickSetup.placeholders.agencyAddress')}
                                    />
                                    {validationErrors.agencyAddress && (
                                        <span className="error-text">{validationErrors.agencyAddress}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="agencyEmail" className="form-label required">
                                        {t('agencies.quickSetup.fields.agencyEmail')}
                                    </label>
                                    <input
                                        type="email"
                                        id="agencyEmail"
                                        name="agencyEmail"
                                        value={formData.agencyEmail}
                                        onChange={handleInputChange}
                                        className={`form-input ${validationErrors.agencyEmail ? 'error' : ''}`}
                                        placeholder={t('agencies.quickSetup.placeholders.agencyEmail')}
                                    />
                                    {validationErrors.agencyEmail && (
                                        <span className="error-text">{validationErrors.agencyEmail}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="agencyPhoneOne" className="form-label required">
                                        {t('agencies.quickSetup.fields.primaryPhone')}
                                    </label>
                                    <input
                                        type="tel"
                                        id="agencyPhoneOne"
                                        name="agencyPhoneOne"
                                        value={formData.agencyPhoneOne}
                                        onChange={handleInputChange}
                                        className={`form-input ${validationErrors.agencyPhoneOne ? 'error' : ''}`}
                                        placeholder={t('agencies.quickSetup.placeholders.phone')}
                                    />
                                    {validationErrors.agencyPhoneOne && (
                                        <span className="error-text">{validationErrors.agencyPhoneOne}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="agencyPhoneTwo" className="form-label">
                                        {t('agencies.quickSetup.fields.secondaryPhone')}
                                    </label>
                                    <input
                                        type="tel"
                                        id="agencyPhoneTwo"
                                        name="agencyPhoneTwo"
                                        value={formData.agencyPhoneTwo}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder={t('agencies.quickSetup.placeholders.phoneOptional')}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="subscriptionPlanId" className="form-label required">
                                        {t('agencies.quickSetup.fields.subscriptionPlan')}
                                    </label>
                                    <select
                                        id="subscriptionPlanId"
                                        name="subscriptionPlanId"
                                        value={formData.subscriptionPlanId}
                                        onChange={handleInputChange}
                                        className={`form-select ${validationErrors.subscriptionPlanId ? 'error' : ''}`}
                                    >
                                        <option value="">{t('agencies.quickSetup.placeholders.selectPlan')}</option>
                                        {subscriptionPlans.map(plan => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} - {plan.price} {t('agencies.quickSetup.perMonth')}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.subscriptionPlanId && (
                                        <span className="error-text">{validationErrors.subscriptionPlanId}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Owner Information */}
                    {currentStep === 2 && (
                        <div className="form-step">
                            <h3 className="step-title">{t('agencies.quickSetup.steps.ownerInfo')}</h3>

                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="ownerFullName" className="form-label required">
                                        {t('agencies.quickSetup.fields.ownerName')}
                                    </label>
                                    <input
                                        type="text"
                                        id="ownerFullName"
                                        name="ownerFullName"
                                        value={formData.ownerFullName}
                                        onChange={handleInputChange}
                                        className={`form-input ${validationErrors.ownerFullName ? 'error' : ''}`}
                                        placeholder={t('agencies.quickSetup.placeholders.ownerName')}
                                    />
                                    {validationErrors.ownerFullName && (
                                        <span className="error-text">{validationErrors.ownerFullName}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="ownerPassword" className="form-label required">
                                        {t('agencies.quickSetup.fields.password')}
                                    </label>
                                    <input
                                        type="password"
                                        id="ownerPassword"
                                        name="ownerPassword"
                                        value={formData.ownerPassword}
                                        onChange={handleInputChange}
                                        className={`form-input ${validationErrors.ownerPassword ? 'error' : ''}`}
                                        placeholder={t('agencies.quickSetup.placeholders.password')}
                                    />
                                    {formData.ownerPassword && (
                                        <div className="password-strength">
                                            <div className="strength-bar">
                                                <div 
                                                    className="strength-fill"
                                                    style={{
                                                        width: `${(passwordStrength / 5) * 100}%`,
                                                        backgroundColor: getPasswordStrengthColor()
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="strength-label" style={{ color: getPasswordStrengthColor() }}>
                                                {getPasswordStrengthLabel()}
                                            </span>
                                        </div>
                                    )}
                                    {validationErrors.ownerPassword && (
                                        <span className="error-text">{validationErrors.ownerPassword}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword" className="form-label required">
                                        {t('agencies.quickSetup.fields.confirmPassword')}
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                                        placeholder={t('agencies.quickSetup.placeholders.confirmPassword')}
                                    />
                                    {validationErrors.confirmPassword && (
                                        <span className="error-text">{validationErrors.confirmPassword}</span>
                                    )}
                                </div>
                            </div>

                            <div className="info-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                </svg>
                                <p>{t('agencies.quickSetup.ownerNote')}</p>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="form-actions">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="btn btn-secondary"
                                disabled={isLoading}
                            >
                                {t('agencies.quickSetup.buttons.back')}
                            </button>
                        )}
                        
                        <div className="flex-spacer"></div>

                        {currentStep < 2 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="btn btn-primary"
                            >
                                {t('agencies.quickSetup.buttons.next')}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="btn btn-success"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        {t('agencies.quickSetup.buttons.creating')}
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t('agencies.quickSetup.buttons.create')}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickNewAgencySetup;