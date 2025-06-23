// src/pages/Landing/LandingPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';
import logo from '../../assets/logo.svg';

const LandingPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(0);
    const [isVisible, setIsVisible] = useState({
        hero: false,
        features: false,
        testimonials: false,
        cta: false,
        footer: false
    });

    // Handle intersection observer for animation on scroll
    useEffect(() => {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        };

        const handleIntersection = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(prev => ({ ...prev, [entry.target.dataset.section]: true }));
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);

        const sections = document.querySelectorAll('.animate-on-scroll');
        sections.forEach(section => observer.observe(section));

        return () => sections.forEach(section => observer.disconnect());
    }, []);

    useEffect(() => {
        document.title = `${t('landing.pageTitle', 'Welcome')} - Mangati`;
    }, [t]);

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

    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="landing-container">
                    <Link to="/" className="landing-header__logo">
                        <img src={logo} alt="Mangati" />
                        <span>Mangati</span>
                    </Link>
                    <div className="landing-header__actions">
                        <Link to="/auth" className="landing-button landing-button--secondary">
                            {t('auth.login.title', 'Login')}
                        </Link>
                        <Link to="/auth?signup=true" className="landing-button landing-button--primary">
                            {t('auth.register.title', 'Sign Up')}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className={`landing-hero animate-on-scroll ${isVisible.hero ? 'visible' : ''}`} data-section="hero">
                <div className="landing-container">
                    <div className="landing-hero__content">
                        <h1 className="landing-hero__title">{t('landing.hero.title', 'Discover, Read, and Create Manga')}</h1>
                        <p className="landing-hero__subtitle">
                            {t('landing.hero.subtitle', 'Join our community of manga enthusiasts to discover new series, read your favorites, and even create your own stories.')}
                        </p>
                        <div className="landing-hero__actions">
                            <Link to="/auth?signup=true" className="landing-button landing-button--primary landing-button--large">
                                {t('landing.hero.cta', 'Get Started')}
                            </Link>
                            <Link to="/auth" className="landing-button landing-button--secondary landing-button--large">
                                {t('landing.hero.secondary', 'Learn More')}
                            </Link>
                        </div>
                    </div>
                    <div className="landing-hero__image">
                        <div className="landing-hero__graphic"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={`landing-features animate-on-scroll ${isVisible.features ? 'visible' : ''}`} data-section="features">
                <div className="landing-container">
                    <div className="landing-section-header">
                        <h2 className="landing-section-title">{t('landing.features.title', 'What We Offer')}</h2>
                        <p className="landing-section-subtitle">
                            {t('landing.features.subtitle', 'Everything you need to enjoy and create manga, all in one platform.')}
                        </p>
                    </div>

                    <div className="landing-features__content">
                        <div className="landing-features__tabs">
                            {features.map((feature, index) => (
                                <button
                                    key={index}
                                    className={`landing-features__tab ${index === activeFeature ? 'active' : ''}`}
                                    onClick={() => setActiveFeature(index)}
                                >
                                    <div className="landing-features__tab-icon">{feature.icon}</div>
                                    <h3>{feature.title}</h3>
                                </button>
                            ))}
                        </div>

                        <div className="landing-features__detail">
                            <h3>{features[activeFeature].title}</h3>
                            <p>{features[activeFeature].description}</p>
                            <div className="landing-features__detail-icon">{features[activeFeature].icon}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={`landing-cta animate-on-scroll ${isVisible.cta ? 'visible' : ''}`} data-section="cta">
                <div className="landing-container">
                    <div className="landing-cta__content">
                        <h2 className="landing-cta__title">{t('landing.cta.title', 'Ready to Start Your Manga Journey?')}</h2>
                        <p className="landing-cta__subtitle">
                            {t('landing.cta.subtitle', 'Join thousands of manga fans and creators on our platform.')}
                        </p>
                        <Link to="/auth?signup=true" className="landing-button landing-button--primary landing-button--large">
                            {t('landing.cta.button', 'Sign Up Now')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={`landing-footer animate-on-scroll ${isVisible.footer ? 'visible' : ''}`} data-section="footer">
                <div className="landing-container">
                    <div className="landing-footer__content">
                        <div className="landing-footer__logo">
                            <img src={logo} alt="Mangati" />
                            <span>Mangati</span>
                            <p>{t('landing.footer.tagline', 'Your ultimate manga platform.')}</p>
                        </div>

                        <div className="landing-footer__links">
                            <div className="landing-footer__links-group">
                                <h3>{t('landing.footer.company', 'Company')}</h3>
                                <ul>
                                    <li><a href="#">{t('landing.footer.about', 'About')}</a></li>
                                    <li><a href="#">{t('landing.footer.careers', 'Careers')}</a></li>
                                    <li><a href="#">{t('landing.footer.press', 'Press')}</a></li>
                                </ul>
                            </div>

                            <div className="landing-footer__links-group">
                                <h3>{t('landing.footer.resources', 'Resources')}</h3>
                                <ul>
                                    <li><a href="#">{t('landing.footer.blog', 'Blog')}</a></li>
                                    <li><a href="#">{t('landing.footer.help', 'Help Center')}</a></li>
                                    <li><a href="#">{t('landing.footer.contact', 'Contact')}</a></li>
                                </ul>
                            </div>

                            <div className="landing-footer__links-group">
                                <h3>{t('landing.footer.legal', 'Legal')}</h3>
                                <ul>
                                    <li><a href="#">{t('landing.footer.terms', 'Terms')}</a></li>
                                    <li><a href="#">{t('landing.footer.privacy', 'Privacy')}</a></li>
                                    <li><a href="#">{t('landing.footer.cookies', 'Cookies')}</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="landing-footer__bottom">
                        <p className="landing-footer__copyright">
                            © {new Date().getFullYear()} Mangati. {t('landing.footer.rightsReserved', 'All rights reserved.')}
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