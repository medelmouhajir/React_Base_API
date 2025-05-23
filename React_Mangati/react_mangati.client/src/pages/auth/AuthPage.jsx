import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './AuthPage.css';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);

    const switchToRegister = () => setIsLogin(false);
    const switchToLogin = () => setIsLogin(true);

    const handleAuthSuccess = (user) => {
        // Redirect to dashboard or intended page
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectPath;
        } else {
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="auth-page">
            {/* Background decoration */}
            <div className="auth-page__background">
                <div className="auth-page__circle auth-page__circle--1"></div>
                <div className="auth-page__circle auth-page__circle--2"></div>
                <div className="auth-page__circle auth-page__circle--3"></div>
            </div>

            {/* Main content */}
            <div className="auth-page__container">
                {/* Left side - Branding */}
                <div className="auth-page__branding">
                    <div className="auth-page__brand-content">
                        <div className="auth-page__brand-logo">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        <h1 className="auth-page__brand-title">Mangati</h1>
                        <p className="auth-page__brand-subtitle">
                            Project Management & Collaboration Platform
                        </p>

                        <div className="auth-page__features">
                            <div className="auth-page__feature">
                                <div className="auth-page__feature-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Task Management</h3>
                                    <p>Organize and track your project tasks efficiently</p>
                                </div>
                            </div>

                            <div className="auth-page__feature">
                                <div className="auth-page__feature-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                                        <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Team Collaboration</h3>
                                    <p>Work seamlessly with your team members</p>
                                </div>
                            </div>

                            <div className="auth-page__feature">
                                <div className="auth-page__feature-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Analytics & Reports</h3>
                                    <p>Get insights into your project performance</p>
                                </div>
                            </div>
                        </div>

                        <div className="auth-page__testimonial">
                            <blockquote>
                                "Mangati has transformed how we manage our projects.
                                The intuitive interface and powerful features make
                                collaboration effortless."
                            </blockquote>
                            <cite>
                                <div className="auth-page__testimonial-avatar">
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&auto=format"
                                        alt="Ahmed Benali"
                                    />
                                </div>
                                <div>
                                    <strong>Ahmed Benali</strong>
                                    <span>CTO, WAN Solutions</span>
                                </div>
                            </cite>
                        </div>
                    </div>
                </div>

                {/* Right side - Authentication Form */}
                <div className="auth-page__form-container">
                    <div className="auth-page__form-wrapper">
                        {/* Tab switcher */}
                        <div className="auth-page__tabs">
                            <button
                                className={`auth-page__tab ${isLogin ? 'auth-page__tab--active' : ''}`}
                                onClick={switchToLogin}
                            >
                                Sign In
                            </button>
                            <button
                                className={`auth-page__tab ${!isLogin ? 'auth-page__tab--active' : ''}`}
                                onClick={switchToRegister}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form content */}
                        <div className="auth-page__form-content">
                            {isLogin ? (
                                <Login
                                    onSwitchToRegister={switchToRegister}
                                    onLoginSuccess={handleAuthSuccess}
                                />
                            ) : (
                                <Register
                                    onSwitchToLogin={switchToLogin}
                                    onRegisterSuccess={handleAuthSuccess}
                                />
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="auth-page__footer">
                        <div className="auth-page__footer-links">
                            <a href="/privacy" className="auth-page__footer-link">Privacy Policy</a>
                            <a href="/terms" className="auth-page__footer-link">Terms of Service</a>
                            <a href="/help" className="auth-page__footer-link">Help & Support</a>
                        </div>
                        <p className="auth-page__footer-text">
                            © 2024 Mangati by WAN Solutions. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;