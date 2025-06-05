// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import './NotFound.css';

const NotFound = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [isAnimating, setIsAnimating] = useState(true);

    // Determine home path based on authentication
    const homePath = user ? '/dashboard' : '/';

    // Trigger initial animation for 1 second
    useEffect(() => {
        const timer = setTimeout(() => setIsAnimating(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`nf-container ${isDarkMode ? 'dark' : ''}`}>
            <div className="nf-content">
                {/* Animated Icon */}
                <div className={`nf-icon-wrapper ${isAnimating ? 'nf-icon-animating' : ''}`}>
                    <svg
                        className={`nf-icon ${isAnimating ? 'nf-icon-pulse' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>

                {/* Main Message */}
                <div className={`nf-text-wrapper ${isAnimating ? 'nf-text-hidden' : 'nf-text-show'}`}>
                    <h1 className="nf-heading">404</h1>
                    <p className="nf-title">{t('notFound.title')}</p>
                    <p className="nf-description">{t('notFound.description')}</p>

                    <div className="nf-buttons">
                        <Link to={homePath} className="nf-button-primary">
                            <svg className="nf-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {t('notFound.goHome')}
                        </Link>
                        <button onClick={() => window.history.back()} className="nf-button-secondary">
                            <svg className="nf-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('notFound.goBack')}
                        </button>
                    </div>
                </div>

                {/* Easter Egg (hidden until hover) */}
                <div className="nf-easter-egg">
                    <p className="nf-easter-text">“{t('notFound.easterEgg')}”</p>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
