// src/pages/Landing/LandingPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';
import logo from '../../assets/logo.svg';

const LandingPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            title: t('landing.features.discover.title', 'Discover Manga'),
            description: t(
                'landing.features.discover.description',
                'Explore a vast library of manga series across various genres.'
            ),
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
            ),
        },
        {
            title: t('landing.features.read.title', 'Read Anywhere'),
            description: t(
                'landing.features.read.description',
                'Enjoy your favorite manga on any device, anytime.'
            ),
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
            ),
        },
        {
            title: t('landing.features.create.title', 'Create Content'),
            description: t(
                'landing.features.create.description',
                'For writers and artists, publish your own manga series with our creation tools.'
            ),
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                    <path d="M2 2l7.586 7.586"></path>
                    <circle cx="11" cy="11" r="2"></circle>
                </svg>
            ),
        },
    ];

    const handleLoginClick = () => {
        navigate('/auth');
    };

    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="landing-container">
                    <div className="landing-header__logo">
                        <img src={logo} alt="Mangati" />
                        <span>Mangati</span>
                    </div>
                    <div className="landing-header__actions">
                        <Link to="/auth?mode=login" className="landing-button landing-button--secondary">
                            {t('landing.login', 'Login')}
                        </Link>
                        <Link to="/auth?mode=register" className="landing-button landing-button--primary">
                            {t('landing.getStarted', 'Get Started')}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-container">
                    <div className="landing-hero__content">
                        <h1 className="landing-hero__title">
                            {t('landing.hero.title', 'Your Ultimate Manga Experience')}
                        </h1>
                        <p className="landing-hero__subtitle">
                            {t(
                                'landing.hero.subtitle',
                                'Discover, read, and create manga all in one platform.'
                            )}
                        </p>
                        <div className="landing-hero__actions">
                            <button
                                className="landing-button landing-button--primary landing-button--large"
                                onClick={handleLoginClick}
                            >
                                {t('landing.hero.cta', 'Start Reading Now')}
                            </button>
                            <a href="#features" className="landing-button landing-button--secondary landing-button--large">
                                {t('landing.hero.learnMore', 'Learn More')}
                            </a>
                        </div>
                    </div>
                    <div className="landing-hero__image">
                        <div className="landing-hero__graphic"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">
                        {t('landing.features.title', 'Experience Manga Like Never Before')}
                    </h2>
                    <div className="landing-features__content">
                        <div className="landing-features__tabs">
                            {features.map((feature, index) => (
                                <button
                                    key={index}
                                    className={`landing-features__tab ${activeFeature === index ? 'landing-features__tab--active' : ''
                                        }`}
                                    onClick={() => setActiveFeature(index)}
                                >
                                    <div className="landing-features__tab-icon">{feature.icon}</div>
                                    <div className="landing-features__tab-text">
                                        <h3>{feature.title}</h3>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="landing-features__detail">
                            <h3 className="landing-features__detail-title">{features[activeFeature].title}</h3>
                            <p className="landing-features__detail-description">
                                {features[activeFeature].description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-cta">
                <div className="landing-container">
                    <div className="landing-cta__content">
                        <h2 className="landing-cta__title">
                            {t('landing.cta.title', 'Ready to Start Your Manga Journey?')}
                        </h2>
                        <p className="landing-cta__description">
                            {t(
                                'landing.cta.description',
                                'Join thousands of readers and creators on Mangati today.'
                            )}
                        </p>
                        <div className="landing-cta__actions">
                            <Link to="/auth?mode=register" className="landing-button landing-button--primary landing-button--large">
                                {t('landing.cta.button', 'Create Free Account')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="landing-footer__content">
                        <div className="landing-footer__logo">
                            <img src={logo} alt="Mangati" />
                            <span>Mangati</span>
                        </div>
                        <div className="landing-footer__links">
                            <div className="landing-footer__links-group">
                                <h3>{t('landing.footer.about', 'About')}</h3>
                                <ul>
                                    <li><a href="#">{t('landing.footer.aboutUs', 'About Us')}</a></li>
                                    <li><a href="#">{t('landing.footer.contact', 'Contact')}</a></li>
                                    <li><a href="#">{t('landing.footer.careers', 'Careers')}</a></li>
                                </ul>
                            </div>
                            <div className="landing-footer__links-group">
                                <h3>{t('landing.footer.legal', 'Legal')}</h3>
                                <ul>
                                    <li><a href="#">{t('landing.footer.terms', 'Terms of Service')}</a></li>
                                    <li><a href="#">{t('landing.footer.privacy', 'Privacy Policy')}</a></li>
                                    <li><a href="#">{t('landing.footer.cookies', 'Cookie Policy')}</a></li>
                                </ul>
                            </div>
                            <div className="landing-footer__links-group">
                                <h3>{t('landing.footer.support', 'Support')}</h3>
                                <ul>
                                    <li><a href="#">{t('landing.footer.help', 'Help Center')}</a></li>
                                    <li><a href="#">{t('landing.footer.faq', 'FAQ')}</a></li>
                                    <li><a href="#">{t('landing.footer.community', 'Community')}</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="landing-footer__bottom">
                        <p className="landing-footer__copyright">
                            &copy; {new Date().getFullYear()} Mangati. {t('landing.footer.rightsReserved', 'All rights reserved.')}
                        </p>
                        <div className="landing-footer__social">
                            <a href="#" aria-label="Twitter">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                </svg>
                            </a>
                            <a href="#" aria-label="Facebook">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                </svg>
                            </a>
                            <a href="#" aria-label="Instagram">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;