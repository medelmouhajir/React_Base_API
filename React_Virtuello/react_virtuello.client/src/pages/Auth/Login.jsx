import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = () => {
    const { t } = useTranslation();
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (user && !authLoading) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, location]);

    // Show success message if redirected from registration
    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
        }
    }, [location.state]);

    // Clear messages when form data changes
    useEffect(() => {
        if (generalError || successMessage) {
            setGeneralError('');
            setSuccessMessage('');
        }
        // Clear field-specific errors when user starts typing
        if (errors.email && formData.email) setErrors(prev => ({ ...prev, email: '' }));
        if (errors.password && formData.password) setErrors(prev => ({ ...prev, password: '' }));
    }, [formData]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Form validation
    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = t('auth.validation.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('auth.validation.emailInvalid');
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = t('auth.validation.passwordRequired');
        } else if (formData.password.length < 6) {
            newErrors.password = t('auth.validation.passwordMinLength');
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
            const result = await login(formData.email, formData.password);

            if (result.success) {
                // Redirect will be handled by useEffect when user state updates
                const from = location.state?.from?.pathname || '/dashboard';
                navigate(from, { replace: true });
            } else {
                setGeneralError(result.error || t('auth.login.failed'));
            }
        } catch (error) {
            console.error('Login error:', error);
            setGeneralError(t('auth.login.failed'));
        } finally {
            setLoading(false);
        }
    };

    // Handle Google login
    const handleGoogleLogin = () => {
        // Redirect to Google OAuth endpoint
        window.location.href = `${import.meta.env.VITE_API_URL}/api/GoogleAuth/signin`;
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Handle keyboard navigation for password toggle
    const handlePasswordToggleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePasswordVisibility();
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">V</div>
                    <h1 className="auth-title">{t('auth.login.title')}</h1>
                    <p className="auth-subtitle">{t('auth.login.subtitle')}</p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}

                {/* General Error */}
                {generalError && (
                    <div className="error-message shake">
                        {generalError}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
                            autoFocus
                            aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                            <div id="email-error" className="error-message" role="alert">
                                {errors.email}
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
                                autoComplete="current-password"
                                aria-describedby={errors.password ? 'password-error' : undefined}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                                onKeyDown={handlePasswordToggleKeyDown}
                                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                tabIndex={0}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {errors.password && (
                            <div id="password-error" className="error-message" role="alert">
                                {errors.password}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                        disabled={loading || authLoading}
                        aria-describedby="login-status"
                    >
                        {loading ? '' : t('auth.login.submit')}
                    </button>

                    {/* Loading status for screen readers */}
                    {loading && (
                        <div id="login-status" className="sr-only" aria-live="polite">
                            {t('auth.login.loading')}
                        </div>
                    )}
                </form>

                {/* Divider */}
                <div className="auth-divider">{t('auth.or')}</div>

                {/* Google Login */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
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
                    {t('auth.login.google')}
                </button>

                {/* Footer */}
                <div className="auth-footer">
                    <p>
                        {t('auth.login.noAccount')}{' '}
                        <Link
                            to="/register"
                            className="auth-link"
                            state={location.state}
                        >
                            {t('auth.login.signUp')}
                        </Link>
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                        <Link to="/forgot-password" className="auth-link">
                            {t('auth.login.forgotPassword')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login; 