import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './AuthPage.css';
import { useTranslation } from 'react-i18next';

const AuthPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('login');

    const handleSwitchToRegister = () => {
        setActiveTab('register');
    };

    const handleSwitchToLogin = () => {
        setActiveTab('login');
    };

    const handleLoginSuccess = (user) => {
        // The AuthContext will handle the state update
        // and the App component will re-render to show the main content
        console.log('Login successful:', user);
    };

    const handleRegisterSuccess = (user) => {
        // The AuthContext will handle the state update
        // and the App component will re-render to show the main content
        console.log('Registration successful:', user);
    };

    return (
        <div className="auth-page">
            {/* Background Decoration */}
            <div className="auth-page__background">
                <div className="auth-page__circle auth-page__circle--1"></div>
                <div className="auth-page__circle auth-page__circle--2"></div>
                <div className="auth-page__circle auth-page__circle--3"></div>
            </div>

            <div className="auth-page__container">
                {/* Left Side - Branding */}
                <div className="auth-page__branding">
                    <div className="auth-page__brand-content">
                        <div className="auth-page__brand-logo">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        <h1 className="auth-page__brand-title">{t('app.title')}</h1>
                        <p className="auth-page__brand-subtitle">
                            {t('app.description')}
                        </p>

                        <div className="auth-page__features">
                            <div className="auth-page__feature">
                                <div className="auth-page__feature-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" />
                                        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>{t('home.features.aiGeneration.title')}</h3>
                                    <p>{t('home.features.aiGeneration.description')}</p>
                                </div>
                            </div>

                            <div className="auth-page__feature">
                                <div className="auth-page__feature-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>{t('home.features.storytelling.title')}</h3>
                                    <p>{t('home.features.storytelling.description')}</p>
                                </div>
                            </div>

                        </div>

                        <div className="auth-page__testimonial">
                            <blockquote>
                                " {t('home.subtitle')} "
                            </blockquote>
                            <cite>
                                <div className="auth-page__testimonial-avatar">
                                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format" alt="Ahmed Benali" />
                                </div>
                                <div>
                                    <strong>Mohamed Amin</strong>
                                    <span>CTO, WAN Solutions</span>
                                </div>
                            </cite>
                        </div>
                    </div>
                </div>

                {/* Right Side - Auth Form */}
                <div className="auth-page__form-container">
                    <div className="auth-page__form-wrapper">
                        {/* Tab Switcher */}
                        <div className="auth-page__tabs">
                            <button
                                className={`auth-page__tab ${activeTab === 'login' ? 'auth-page__tab--active' : ''}`}
                                onClick={() => setActiveTab('login')}
                            >
                                {t('auth.login.login', 'Sign in')}
                            </button>
                            <button
                                className={`auth-page__tab ${activeTab === 'register' ? 'auth-page__tab--active' : ''}`}
                                onClick={() => setActiveTab('register')}
                            >
                                {t('auth.register.register', 'Sign up')}
                            </button>
                        </div>

                        {/* Form Content */}
                        <div className="auth-page__form-content">
                            {activeTab === 'login' ? (
                                <Login
                                    onSwitchToRegister={handleSwitchToRegister}
                                    onLoginSuccess={handleLoginSuccess}
                                />
                            ) : (
                                <Register
                                    onSwitchToLogin={handleSwitchToLogin}
                                    onRegisterSuccess={handleRegisterSuccess}
                                />
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="auth-page__footer">
                        <p className="auth-page__footer-text">
                            � 2024 WAN Solutions. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;