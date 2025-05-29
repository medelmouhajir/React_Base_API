import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import GoogleLoginButton from '../../components/Google/GoogleLoginButton';
import './Auth.css';

const Register = ({ onSwitchToLogin, onRegisterSuccess }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'User'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [acceptTerms, setAcceptTerms] = useState(false);

    const { register, loading, error, clearError } = useAuth();

    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Check password strength when password changes
        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }

        // Clear error when user starts typing
        if (error) {
            clearError();
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const getPasswordStrengthLabel = () => {
        switch (passwordStrength) {
            case 0:
            case 1: return t('auth.passwordStrength.veryWeak');
            case 2: return t('auth.passwordStrength.weak');
            case 3: return t('auth.passwordStrength.fair');
            case 4: return t('auth.passwordStrength.good');
            case 5: return t('auth.passwordStrength.strong');
            default: return '';
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0:
            case 1: return '#ef4444';
            case 2: return '#f97316';
            case 3: return '#eab308';
            case 4: return '#22c55e';
            case 5: return '#16a34a';
            default: return '#e5e7eb';
        }
    };

    const validateForm = () => {
        if (!formData.firstName.trim()) return 'First name is required';
        if (!formData.lastName.trim()) return 'Last name is required';
        if (!formData.email.trim()) return 'Email is required';
        if (!formData.password) return 'Password is required';
        if (formData.password !== formData.confirmPassword) return t('auth.errors.passwordMismatch');
        if (passwordStrength < 3) return t('auth.errors.weakPassword');
        if (!acceptTerms) return 'You must accept the terms and conditions';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            // You might want to show this error in the UI
            console.error(validationError);
            return;
        }

        const result = await register({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phoneNumber: formData.phoneNumber.trim() || null,
            password: formData.password,
            role: formData.role
        });

        if (result.success) {
            if (onRegisterSuccess) {
                onRegisterSuccess(result.user);
            } else {
                window.location.href = '/dashboard';
            }
        }
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
                <h1 className="auth-form__title">
                    {t('auth.register.title', 'or continue with email')}</h1>
                <p className="auth-form__subtitle">
                    {t('auth.register.subtitle', 'or continue with email')}
                </p>
            </div>

            {/* Google Sign-Up Button */}
            <GoogleLoginButton />

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

                <div className="auth-form__row">
                    <div className="auth-form__field">
                        <label htmlFor="firstName" className="auth-form__label">
                            {t('auth.register.firstNameLabel', 'or continue with email')}
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="auth-form__input"
                            placeholder={t('auth.register.firstNamePlaceholder', 'or continue with email')}
                            required
                            autoComplete="given-name"
                        />
                    </div>

                    <div className="auth-form__field">
                        <label htmlFor="lastName" className="auth-form__label">
                            {t('auth.register.lastNameLabel', 'or continue with email')}
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="auth-form__input"
                            placeholder={t('auth.register.lastNamePlaceholder', 'or continue with email')}
                            required
                            autoComplete="family-name"
                        />
                    </div>
                </div>

                <div className="auth-form__field">
                    <label htmlFor="email" className="auth-form__label">
                        {t('auth.register.emailLabel', 'or continue with email')}
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
                            placeholder={t('auth.register.emailPlaceholder', 'or continue with email')}
                            required
                            autoComplete="email"
                        />
                    </div>
                </div>

                <div className="auth-form__field">
                    <label htmlFor="phoneNumber" className="auth-form__label">
                        {t('auth.register.phoneLabel', 'or continue with email')} <span className="auth-form__optional">(Optional)</span>
                    </label>
                    <div className="auth-form__input-wrapper">
                        <svg className="auth-form__input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="auth-form__input"
                            placeholder={t('auth.register.phonePlaceholder', 'or continue with email')}
                            autoComplete="tel"
                        />
                    </div>
                </div>

                <div className="auth-form__field">
                    <label htmlFor="role" className="auth-form__label">
                        {t('auth.register.roleLabel', 'or continue with email')}
                    </label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="auth-form__select"
                    >
                        <option value="WRITER">{t('roles.Writer')}</option>
                        <option value="READER">{t('roles.Reader')}</option>
                    </select>
                </div>

                <div className="auth-form__field">
                    <label htmlFor="password" className="auth-form__label">
                        {t('auth.register.passwordLabel', 'or continue with email')}
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
                            placeholder={t('auth.register.passwordPlaceholder', 'or continue with email')}
                            required
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="auth-form__password-toggle"
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

                    {formData.password && (
                        <div className="auth-form__password-strength">
                            <div className="auth-form__strength-bar">
                                <div
                                    className="auth-form__strength-fill"
                                    style={{
                                        width: `${(passwordStrength / 5) * 100}%`,
                                        backgroundColor: getPasswordStrengthColor()
                                    }}
                                ></div>
                            </div>
                            <span
                                className="auth-form__strength-label"
                                style={{ color: getPasswordStrengthColor() }}
                            >
                                {getPasswordStrengthLabel()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="auth-form__field">
                    <label htmlFor="confirmPassword" className="auth-form__label">
                        {t('auth.register.confirmPasswordLabel', 'or continue with email')}
                    </label>
                    <div className="auth-form__input-wrapper">
                        <svg className="auth-form__input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="auth-form__input auth-form__input--with-toggle"
                            placeholder={t('auth.register.confirmPasswordPlaceholder', 'or continue with email')}
                            required
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="auth-form__password-toggle"
                        >
                            {showConfirmPassword ? (
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

                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="auth-form__field-error">
                            {t('auth.errors.passwordMismatch', 'or continue with email')}
                        </div>
                    )}
                </div>

                <label className="auth-form__checkbox auth-form__terms">
                    <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        required
                    />
                    <span className="auth-form__checkbox-mark"></span>
                    {t('auth.register.termsAndConditions', 'or continue with email')}
                </label>

                <button
                    type="submit"
                    disabled={loading || !acceptTerms}
                    className="auth-form__submit"
                >
                    {loading ? (
                        <>
                            <div className="auth-form__spinner"></div>
                            {t('auth.register.creatingAccount', 'or continue with email')}
                        </>
                    ) : (
                        t('auth.register.createAccountButton')
                    )}
                </button>
            </form>

            <div className="auth-form__footer">
                <p>
                    {t('auth.register.alreadyHaveAccount', 'or continue with email')} {' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="auth-form__link auth-form__link--primary"
                    >
                        {t('auth.register.signIn', 'or continue with email')}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;