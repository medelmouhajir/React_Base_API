// src/pages/Auth/ThanksPage/ThanksPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import './ThanksPage.css';

const ThanksPage = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [showContent, setShowContent] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(10);

    // Get ticket/demand info from navigation state if available
    const ticketInfo = location.state?.ticketInfo || null;
    const userName = location.state?.userName || ticketInfo?.name || '';

    useEffect(() => {
        // Animate content in after component mounts
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 200);

        return () => clearTimeout(timer);
    }, []);

    // Auto-redirect countdown
    useEffect(() => {
        if (redirectCountdown > 0) {
            const timer = setTimeout(() => {
                setRedirectCountdown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            // Navigate to home when countdown reaches 0
            navigate('/', { replace: true });
        }
    }, [redirectCountdown, navigate]);

    const handleGoHome = () => {
        navigate('/', { replace: true });
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className={`thanks-page ${isDarkMode ? 'dark' : ''}`}>
            <div className="thanks-container">
                {/* Success Animation */}
                <div className={`thanks-animation ${showContent ? 'show' : ''}`}>
                    <div className="success-circle">
                        <div className="success-icon">
                            <svg
                                className="checkmark"
                                viewBox="0 0 52 52"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    className="checkmark-circle"
                                    cx="26"
                                    cy="26"
                                    r="25"
                                    fill="none"
                                />
                                <path
                                    className="checkmark-check"
                                    fill="none"
                                    d="m14.1 27.2l7.1 7.2 16.7-16.8"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`thanks-content ${showContent ? 'show' : ''}`}>
                    {/* Thank you message */}
                    <div className="thanks-header">
                        <h1 className="thanks-title">
                            {t('thanks.title')}
                        </h1>
                        {userName && (
                            <p className="thanks-greeting">
                                {t('thanks.greeting', { name: userName })}
                            </p>
                        )}
                    </div>

                    {/* Main message */}
                    <div className="thanks-message">
                        <p className="thanks-description">
                            {t('thanks.description')}
                        </p>
                        
                        {ticketInfo && (
                            <div className="ticket-info">
                                <div className="ticket-reference">
                                    <span className="ticket-label">{t('thanks.ticketReference')}:</span>
                                    <span className="ticket-id">#{ticketInfo.id || 'PENDING'}</span>
                                </div>
                                {ticketInfo.object && (
                                    <div className="ticket-subject">
                                        <span className="ticket-label">{t('thanks.subject')}:</span>
                                        <span className="ticket-text">{ticketInfo.object}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Next steps */}
                    <div className="thanks-next-steps">
                        <h3 className="next-steps-title">
                            {t('thanks.nextSteps.title')}
                        </h3>
                        <ul className="next-steps-list">
                            <li className="next-step-item">
                                <div className="step-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 21H5V3H13V9H19V21Z"/>
                                    </svg>
                                </div>
                                <span>{t('thanks.nextSteps.step1')}</span>
                            </li>
                            <li className="next-step-item">
                                <div className="step-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                                    </svg>
                                </div>
                                <span>{t('thanks.nextSteps.step2')}</span>
                            </li>
                            <li className="next-step-item">
                                <div className="step-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                                    </svg>
                                </div>
                                <span>{t('thanks.nextSteps.step3')}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Contact info */}
                    <div className="thanks-contact">
                        <p className="contact-text">
                            {t('thanks.contactText')}
                        </p>
                        <div className="contact-details">
                            <div className="contact-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M20,8L12,13L4,8V6L12,11L20,6V8Z"/>
                                </svg>
                                <span>support@wansolutions.ma</span>
                            </div>
                            <div className="contact-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                                </svg>
                                <span>+212 6XX XXX XXX</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className={`thanks-actions ${showContent ? 'show' : ''}`}>
                    <button
                        type="button"
                        onClick={handleGoHome}
                        className="btn btn-primary"
                    >
                        {t('thanks.actions.goHome')}
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="btn btn-secondary"
                    >
                        {t('thanks.actions.goBack')}
                    </button>
                </div>

                {/* Auto-redirect notice */}
                <div className={`thanks-redirect ${showContent ? 'show' : ''}`}>
                    <p className="redirect-text">
                        {t('thanks.autoRedirect', { seconds: redirectCountdown })}
                    </p>
                </div>
            </div>

            {/* Background decoration */}
            <div className="thanks-background">
                <div className="bg-pattern"></div>
                <div className="bg-gradient"></div>
            </div>
        </div>
    );
};

export default ThanksPage;