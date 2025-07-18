// src/pages/auth/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Login.css';

const Login = () => {
    const { login, loginWithGoogle } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect path
    const from = location.state?.from?.pathname || '/dashboard';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { email, password } = formData;
            const result = await login(email, password);
            if (result.success) {
                toast.success(t('auth.loginSuccess'));
                navigate(from, { replace: true });
            } else {
                setError(result.error || t('auth.genericError'));
            }
        } catch (err) {
            setError(err.message || t('auth.genericError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        try {
            loginWithGoogle();
        } catch (err) {
            setError(err.message || t('auth.googleAuthError'));
        }
    };

    return (
        <div className={`login-page ${isDarkMode ? 'dark' : ''}`}>
            <div className="login-container">
                <div className="login-header">
                    <img src="/logo.png" alt="Rentify Logo" className="login-logo" />
                    <h2 className="login-title">{t('auth.welcomeBack')}</h2>
                    <p className="login-subtitle">{t('auth.loginToContinue')}</p>
                </div>

                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            {t('auth.email')}
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t('auth.emailPlaceholder')}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            {t('auth.password')}
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={t('auth.passwordPlaceholder')}
                            className="form-input"
                        />
                    </div>

                    <div className="form-utilities">
                        <label className="checkbox-label">
                            <input
                                id="rememberMe"
                                name="rememberMe"
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="form-checkbox"
                            />
                            <span className="checkbox-text">{t('auth.rememberMe')}</span>
                        </label>
                        <Link to="/forgot-password" className="forgot-link">
                            {t('auth.forgotPassword')}
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`button-primary ${isLoading ? 'disabled' : ''}`}
                    >
                        {isLoading ? (
                            <span className="spinner" />
                        ) : (
                            t('auth.login')
                        )}
                    </button>
                </form>

                {/*<div className="divider-wrapper">*/}
                {/*    <div className="divider-line"></div>*/}
                {/*    <span className="divider-text">{t('auth.orContinueWith')}</span>*/}
                {/*</div>*/}

                {/*<button*/}
                {/*    type="button"*/}
                {/*    onClick={handleGoogleLogin}*/}
                {/*    className="button-social"*/}
                {/*>*/}
                {/*    <img src="/google-icon.svg" alt="Google" className="social-icon" />*/}
                {/*    <span>{t('auth.continueWithGoogle')}</span>*/}
                {/*</button>*/}

            </div>
        </div>
    );
};

export default Login;
