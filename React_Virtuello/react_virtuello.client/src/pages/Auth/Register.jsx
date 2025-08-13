import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Register = () => {
    const { t } = useTranslation();
    const { register, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'User',
        acceptTerms: false
    });

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

    // Redirect if already logged in
    useEffect(() => {
        if (user && !authLoading) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, location]);

    // Clear messages when form data changes
    useEffect(() => {
        if (generalError) {
            setGeneralError('');
        }

        // Clear field-specific errors when user starts typing
        Object.keys(errors).forEach(field => {
            if (errors[field] && formData[field]) {
                setErrors(prev => ({ ...prev, [field]: '' }));
            }
        });
    }, [formData]);

    // Password strength checker
    useEffect(() => {
        if (formData.password) {
            const strength = calculatePasswordStrength(formData.password);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength({ score: 0, feedback: '' });
        }
    }, [formData.password]);

    // Calculate password strength
    const calculatePasswordStrength = (password) => {
        let score = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) score += 1;
        else feedback.push(t('auth.validation.passwordLength'));

        // Uppercase check
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push(t('auth.validation.passwordUppercase'));

        // Lowercase check
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push(t('auth.validation.passwordLowercase'));

        // Number check
        if (/\d/.test(password)) score += 1;
        else feedback.push(t('auth.validation.passwordNumber'));

        // Special character check
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        else feedback.push(t('auth.validation.passwordSpecial'));

        const strengthLevels = [
            { text: t('auth.validation.passwordVeryWeak'), color: '#dc2626' },
            { text: t('auth.validation.passwordWeak'), color: '#ea580c' },
            { text: t('auth.validation.passwordFair'), color: '#f59e0b' },
            { text: t('auth.validation.passwordGood'), color: '#65a30d' },
            { text: t('auth.validation.passwordStrong'), color: '#16a34a' }
        ];

        return {
            score,
            feedback: feedback.join(', '),
            text: strengthLevels[score]?.text || '',
            color: strengthLevels[score]?.color || '#dc2626'
        };
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Form validation
    const validateForm = () => {
        const newErrors = {};

        // Full name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = t('auth.validation.fullNameRequired');
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = t('auth.validation.fullNameMinLength');
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = t('auth.validation.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('auth.validation.emailInvalid');
        }

        // Phone number validation (optional but format check if provided)
        if (formData.phoneNumber && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = t('auth.validation.phoneInvalid');
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = t('auth.validation.passwordRequired');
        } else if (formData.password.length < 8) {
            newErrors.password = t('auth.validation.passwordMinLength');
        } else if (passwordStrength.score < 3) {
            newErrors.password = t('auth.validation.passwordTooWeak');
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('auth.validation.passwordMismatch');
        }

        // Terms acceptance validation
        if (!formData.acceptTerms) {
            newErrors.acceptTerms = t('auth.validation.acceptTermsRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setGeneralError('');

        try {
            const userData = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                phoneNumber: formData.phoneNumber.trim() || null,
                password: formData.password,
                role: formData.role
            };

            const result = await register(userData);

            if (result.success) {
                // Redirect to login with success message
                navigate('/login', {
                    replace: true,
                    state: {
                        message: t('auth.register.success'),
                        from: location.state?.from
                    }
                });
            } else {
                setGeneralError(result.error || t('auth.register.failed'));
            }
        } catch (error) {
            console.error('Registration error:', error);
            setGeneralError(t('auth.register.failed'));
        } finally {
            setLoading(false);
        }
    };

    // Handle Google registration
    const handleGoogleRegister = () => {
        // Redirect to Google OAuth endpoint
        window.location.href = `${import.meta.env.VITE_API_URL}/api/GoogleAuth/signin`;
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    // Handle keyboard navigation for password toggles
    const handlePasswordToggleKeyDown = (e, toggleFunction) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFunction();
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">V</div>
                    <h1 className="auth-title">{t('auth.register.title')}</h1>
                    <p className="auth-subtitle">{t('auth.register.subtitle')}</p>
                </div>

                {/* General Error */}
                {generalError && (
                    <div className="error-message shake">
                        {generalError}
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {/* Full Name Field */}
                    <div className="form-group">
                        <label htmlFor="fullName" className="form-label required">
                            {t('auth.fields.fullName')}
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={`form-input ${errors.fullName ? 'error' : ''}`}
                            placeholder={t('auth.placeholders.fullName')}
                            required
                            autoComplete="name"
                            autoFocus
                            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                        />
                        {errors.fullName && (
                            <div id="fullName-error" className="error-message" role="alert">
                                {errors.fullName}
                            </div>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="form-group">
                        <label htmlFor="email" className="form-label required">
                            {t('auth.fields.email')}
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder={t('auth.placeholders.email')}
                            required
                            autoComplete="email"
                            aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                            <div id="email-error" className="error-message" role="alert">
                                {errors.email}
                            </div>
                        )}
                    </div>

                    {/* Phone Number Field */}
                    <div className="form-group">
                        <label htmlFor="phoneNumber" className="form-label">
                            {t('auth.fields.phoneNumber')} ({t('auth.optional')})
                        </label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                            placeholder={t('auth.placeholders.phoneNumber')}
                            autoComplete="tel"
                            aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
                        />
                        {errors.phoneNumber && (
                            <div id="phoneNumber-error" className="error-message" role="alert">
                                {errors.phoneNumber}
                            </div>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label htmlFor="password" className="form-label required">
                            {t('auth.fields.password')}
                        </label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`form-input ${errors.password ? 'error' : ''}`}
                                placeholder={t('auth.placeholders.password')}
                                required
                                autoComplete="new-password"
                                aria-describedby={`${errors.password ? 'password-error' : ''} password-strength`}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                                onKeyDown={(e) => handlePasswordToggleKeyDown(e, togglePasswordVisibility)}
                                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                tabIndex={0}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div id="password-strength" className="password-strength">
                                <div
                                    className="password-strength-bar"
                                    style={{
                                        width: `${(passwordStrength.score / 5) * 100}%`,
                                        backgroundColor: passwordStrength.color,
                                        height: '4px',
                                        borderRadius: '2px',
                                        transition: 'all 0.3s ease',
                                        marginTop: '0.5rem'
                                    }}
                                />
                                <div
                                    className="password-strength-text"
                                    style={{
                                        color: passwordStrength.color,
                                        fontSize: '0.75rem',
                                        marginTop: '0.25rem'
                                    }}
                                >
                                    {passwordStrength.text}
                                </div>
                                {passwordStrength.feedback && (
                                    <div
                                        className="password-feedback"
                                        style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.75rem',
                                            marginTop: '0.25rem'
                                        }}
                                    >
                                        {passwordStrength.feedback}
                                    </div>
                                )}
                            </div>
                        )}

                        {errors.password && (
                            <div id="password-error" className="error-message" role="alert">
                                {errors.password}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label required">
                            {t('auth.fields.confirmPassword')}
                        </label>
                        <div className="password-input-container">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                                placeholder={t('auth.placeholders.confirmPassword')}
                                required
                                autoComplete="new-password"
                                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={toggleConfirmPasswordVisibility}
                                onKeyDown={(e) => handlePasswordToggleKeyDown(e, toggleConfirmPasswordVisibility)}
                                aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                tabIndex={0}
                            >
                                {showConfirmPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <div id="confirmPassword-error" className="error-message" role="alert">
                                {errors.confirmPassword}
                            </div>
                        )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="acceptTerms"
                                checked={formData.acceptTerms}
                                onChange={handleChange}
                                className="checkbox-input"
                                required
                                aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
                            />
                            <span className="checkbox-text">
                                {t('auth.register.acceptTerms')}{' '}
                                <Link to="/terms" className="auth-link" target="_blank">
                                    {t('auth.register.termsOfService')}
                                </Link>{' '}
                                {t('auth.and')}{' '}
                                <Link to="/privacy" className="auth-link" target="_blank">
                                    {t('auth.register.privacyPolicy')}
                                </Link>
                            </span>
                        </label>
                        {errors.acceptTerms && (
                            <div id="acceptTerms-error" className="error-message" role="alert">
                                {errors.acceptTerms}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                        disabled={loading || authLoading}
                        aria-describedby="register-status"
                    >
                        {loading ? '' : t('auth.register.submit')}
                    </button>

                    {/* Loading status for screen readers */}
                    {loading && (
                        <div id="register-status" className="sr-only" aria-live="polite">
                            {t('auth.register.loading')}
                        </div>
                    )}
                </form>

                {/* Divider */}
                <div className="auth-divider">{t('auth.or')}</div>

                {/* Google Registration */}
                <button
                    type="button"
                    onClick={handleGoogleRegister}
                    className="btn btn-google"
                    disabled={loading || authLoading}
                >
                    <svg className="google-icon" viewBox="0 0 24 24">
                        <path
                            fill="#4285f4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34a853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#fbbc05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#ea4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    {t('auth.register.google')}
                </button>

                {/* Footer */}
                <div className="auth-footer">
                    <p>
                        {t('auth.register.hasAccount')}{' '}
                        <Link
                            to="/login"
                            className="auth-link"
                            state={location.state}
                        >
                            {t('auth.register.signIn')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;