// src/pages/auth/Login.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = ({ onSwitchToRegister, onLoginSuccess }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { login, loading, error, clearError } = useAuth();

    useEffect(() => {
        // Clear any previous errors when component mounts
        clearError();
    }, [clearError]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (error) {
            clearError();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            return;
        }

        const result = await login(formData.email, formData.password);

        if (result.success) {
            // Handle successful login
            const redirectPath = localStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectPath;
            } else if (onLoginSuccess) {
                onLoginSuccess(result.user);
            } else {
                window.location.href = '/dashboard';
            }
        }
    };

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="auth-form">
            <div className="auth-form__header">
                <div className="auth-form__logo">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <h1 className="auth-form__title">{t('auth.login.title')}</h1>
                <p className="auth-form__subtitle">{t('auth.login.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form__form">
                {error && (
                    <div className="auth-form__error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
                            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="auth-form__field">
                    <label htmlFor="email" className="auth-form__label">
                        {t('auth.login.emailLabel')}
                    </label>
                    <div className="auth-form__input-wrapper">
                        <svg className="auth-form__input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" />
                            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="auth-form__input"
                            placeholder={t('auth.login.emailPlaceholder')}
                            required
                            autoComplete="email"
                        />
                    </div>
                </div>

                <div className="auth-form__field">
                    <label htmlFor="password" className="auth-form__label">
                        {t('auth.login.passwordLabel')}
                    </label>
                    <div className="auth-form__input-wrapper">
                        <svg className="auth-form__input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="auth-form__input auth-form__input--with-toggle"
                            placeholder={t('auth.login.passwordPlaceholder')}
                            required
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={togglePassword}
                            className="auth-form__password-toggle"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" />
                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="auth-form__options">
                    <label className="auth-form__checkbox">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="auth-form__checkbox-mark"></span>
                        {t('auth.login.rememberMe')}
                    </label>

                    <button
                        type="button"
                        className="auth-form__link"
                        onClick={() => {/* Handle forgot password */ }}
                    >
                        {t('auth.login.forgotPassword')}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading || !formData.email || !formData.password}
                    className="auth-form__submit"
                >
                    {loading ? (
                        <>
                            <div className="auth-form__spinner"></div>
                            {t('auth.login.signingIn')}
                        </>
                    ) : (
                        t('auth.login.signInButton')
                    )}
                </button>
            </form>

            <div className="auth-form__footer">
                <p>
                    {t('auth.login.noAccount')}{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="auth-form__link auth-form__link--primary"
                    >
                        {t('auth.login.createAccount')}
                    </button>
                </p>
            </div>

        </div>
    );
};

export default Login;