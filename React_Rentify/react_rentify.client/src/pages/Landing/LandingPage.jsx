// src/pages/Landing/LandingPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import './LandingPage.css';

const LandingPage = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const [activeFeature, setActiveFeature] = useState(0);
    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const benefitsRef = useRef(null);
    const pricingRef = useRef(null);
    const contactRef = useRef(null);

    // Animation on scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.animate-on-scroll').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // Feature carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to section when hash changes
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash === '#features' && featuresRef.current) {
                featuresRef.current.scrollIntoView({ behavior: 'smooth' });
            } else if (hash === '#benefits' && benefitsRef.current) {
                benefitsRef.current.scrollIntoView({ behavior: 'smooth' });
            } else if (hash === '#pricing' && pricingRef.current) {
                pricingRef.current.scrollIntoView({ behavior: 'smooth' });
            } else if (hash === '#contact' && contactRef.current) {
                contactRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        // Handle initial hash on page load
        if (window.location.hash) {
            setTimeout(handleHashChange, 500);
        }
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Mock data for features
    const features = [
        {
            id: 1,
            title: t('landing.featureFleetTitle'),
            description: t('landing.featureFleetDesc'),
            icon: (
                <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
            ),
        },
        {
            id: 2,
            title: t('landing.featureGpsTitle'),
            description: t('landing.featureGpsDesc'),
            icon: (
                <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
            ),
        },
        {
            id: 3,
            title: t('landing.featureCustomerTitle'),
            description: t('landing.featureCustomerDesc'),
            icon: (
                <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
            ),
        },
        {
            id: 4,
            title: t('landing.featureReportsTitle'),
            description: t('landing.featureReportsDesc'),
            icon: (
                <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
            ),
        },
    ];

    // Mock data for benefits
    const benefits = [
        {
            id: 1,
            title: t('landing.benefitTimeTitle'),
            description: t('landing.benefitTimeDesc'),
            icon: (
                <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            ),
        },
        {
            id: 2,
            title: t('landing.benefitCostTitle'),
            description: t('landing.benefitCostDesc'),
            icon: (
                <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            ),
        },
        {
            id: 3,
            title: t('landing.benefitInsightsTitle'),
            description: t('landing.benefitInsightsDesc'),
            icon: (
                <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
            ),
        },
    ];

    // Mock data for pricing plans
    const pricingPlans = [
        {
            id: 'basic',
            name: t('landing.pricingBasicName'),
            price: '99',
            currency: t('landing.pricingCurrency'),
            period: t('landing.pricingPeriod'),
            description: t('landing.pricingBasicDesc'),
            features: [
                t('landing.pricingBasicFeature1'),
                t('landing.pricingBasicFeature2'),
                t('landing.pricingBasicFeature3'),
                t('landing.pricingBasicFeature4'),
            ],
            cta: t('landing.pricingBasicCta'),
            popular: false,
        },
        {
            id: 'pro',
            name: t('landing.pricingProName'),
            price: '199',
            currency: t('landing.pricingCurrency'),
            period: t('landing.pricingPeriod'),
            description: t('landing.pricingProDesc'),
            features: [
                t('landing.pricingProFeature1'),
                t('landing.pricingProFeature2'),
                t('landing.pricingProFeature3'),
                t('landing.pricingProFeature4'),
                t('landing.pricingProFeature5'),
            ],
            cta: t('landing.pricingProCta'),
            popular: true,
        },
        {
            id: 'enterprise',
            name: t('landing.pricingEnterpriseName'),
            price: '399',
            currency: t('landing.pricingCurrency'),
            period: t('landing.pricingPeriod'),
            description: t('landing.pricingEnterpriseDesc'),
            features: [
                t('landing.pricingEnterpriseFeature1'),
                t('landing.pricingEnterpriseFeature2'),
                t('landing.pricingEnterpriseFeature3'),
                t('landing.pricingEnterpriseFeature4'),
                t('landing.pricingEnterpriseFeature5'),
                t('landing.pricingEnterpriseFeature6'),
            ],
            cta: t('landing.pricingEnterpriseCta'),
            popular: false,
        },
    ];

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section" ref={heroRef}>
                <div className="hero-content">
                    <h1 className="hero-title animate-on-scroll">{t('landing.heroTitle')}</h1>
                    <p className="hero-subtitle animate-on-scroll">{t('landing.heroSubtitle')}</p>
                    <div className="hero-cta animate-on-scroll">
                        <Link to="/login" className="cta-button primary">
                            {t('auth.login')}
                        </Link>
                        <a href="#features" className="cta-button secondary">
                            {t('landing.heroLearnMore')}
                        </a>
                    </div>
                </div>
                <div className="hero-image animate-on-scroll">
                    <div className="hero-image-container">
                        <img
                            src="/dashboard.png"
                            alt="Rentify Dashboard Preview"
                            className="dashboard-preview"
                        />
                        <div className="blob-shape"></div>
                    </div>
                </div>
                <div className="hero-scroll-indicator">
                    <a href="#features">
                        <span className="scroll-text">{t('landing.scrollDown')}</span>
                        <span className="scroll-arrow">↓</span>
                    </a>
                </div>
            </section>

            {/* Trusted by companies */}
            <section className="trusted-section">
                <h3 className="trusted-title animate-on-scroll">{t('landing.trustedBy')}</h3>
                <div className="trusted-logos">
                    <div className="trusted-logo animate-on-scroll">
                        <img className="company-logo" width="120" height="70" src="/companies/kc-cars-logo.png"/>
                    </div>
                    <div className="trusted-logo animate-on-scroll">
                        <img className="company-logo" width="120" height="70" src="/companies/kc-cars-logo.png" />
                    </div>
                    <div className="trusted-logo animate-on-scroll">
                        <img className="company-logo" width="120" height="70" src="/companies/kc-cars-logo.png" />
                    </div>
                    <div className="trusted-logo animate-on-scroll">
                        <img className="company-logo" width="120" height="70" src="/companies/kc-cars-logo.png" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section" id="features" ref={featuresRef}>
                <div className="section-header animate-on-scroll">
                    <h2 className="section-title">{t('landing.featuresTitle')}</h2>
                    <p className="section-description">{t('landing.featuresDescription')}</p>
                </div>

                <div className="features-container">
                    <div className="features-tabs">
                        {features.map((feature, index) => (
                            <button
                                key={feature.id}
                                className={`feature-tab animate-on-scroll ${activeFeature === index ? 'active' : ''}`}
                                onClick={() => setActiveFeature(index)}
                            >
                                {feature.icon}
                                <span>{feature.title}</span>
                            </button>
                        ))}
                    </div>

                    <div className="feature-details animate-on-scroll">
                        <div className="feature-content">
                            <h3 className="feature-title">{features[activeFeature].title}</h3>
                            <p className="feature-description">{features[activeFeature].description}</p>
                            <Link to="/register" className="feature-cta">
                                {t('landing.featuresCta')}
                                <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                        <div className="feature-showcase">
                            <div className={`feature-image feature-image-${activeFeature}`}>
                                <img
                                    src={`/assets/feature-${activeFeature + 1}.png`}
                                    alt={features[activeFeature].title}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/assets/feature-placeholder.png';
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits-section" id="benefits" ref={benefitsRef}>
                <div className="section-header animate-on-scroll">
                    <h2 className="section-title">{t('landing.benefitsTitle')}</h2>
                    <p className="section-description">{t('landing.benefitsDescription')}</p>
                </div>

                <div className="benefits-container">
                    {benefits.map((benefit) => (
                        <div key={benefit.id} className="benefit-card animate-on-scroll">
                            <div className="benefit-icon-container">{benefit.icon}</div>
                            <h3 className="benefit-title">{benefit.title}</h3>
                            <p className="benefit-description">{benefit.description}</p>
                        </div>
                    ))}
                </div>

                <div className="benefits-cta animate-on-scroll">
                    <Link to="/register" className="cta-button primary">
                        {t('landing.benefitsCta')}
                    </Link>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
                <div className="section-header animate-on-scroll">
                    <h2 className="section-title">{t('landing.testimonialsTitle')}</h2>
                    <p className="section-description">{t('landing.testimonialsDescription')}</p>
                </div>

                <div className="testimonials-container animate-on-scroll">
                    <div className="testimonial-card">
                        <div className="testimonial-rating">★★★★★</div>
                        <p className="testimonial-text">{t('landing.testimonial1')}</p>
                        <div className="testimonial-author">
                            <img
                                src="https://placehold.co/100"
                                alt="Testimonial Author"
                                className="testimonial-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/avatar-placeholder.png';
                                }}
                            />
                            <div className="testimonial-info">
                                <h4 className="testimonial-name">Ahmed Hassan</h4>
                                <p className="testimonial-role">{t('landing.testimonialRole1')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-rating">★★★★★</div>
                        <p className="testimonial-text">{t('landing.testimonial2')}</p>
                        <div className="testimonial-author">
                            <img
                                src="https://placehold.co/100"
                                alt="Testimonial Author"
                                className="testimonial-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/avatar-placeholder.png';
                                }}
                            />
                            <div className="testimonial-info">
                                <h4 className="testimonial-name">Fatima Zahra</h4>
                                <p className="testimonial-role">{t('landing.testimonialRole2')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-rating">★★★★★</div>
                        <p className="testimonial-text">{t('landing.testimonial3')}</p>
                        <div className="testimonial-author">
                            <img
                                src="https://placehold.co/100"
                                alt="Testimonial Author"
                                className="testimonial-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/avatar-placeholder.png';
                                }}
                            />
                            <div className="testimonial-info">
                                <h4 className="testimonial-name">Karim Benali</h4>
                                <p className="testimonial-role">{t('landing.testimonialRole3')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section" id="pricing" ref={pricingRef}>
                <div className="section-header animate-on-scroll">
                    <h2 className="section-title">{t('landing.pricingTitle')}</h2>
                    <p className="section-description">{t('landing.pricingDescription')}</p>
                </div>

                <div className="pricing-container">
                    {pricingPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`pricing-card animate-on-scroll ${plan.popular ? 'popular' : ''}`}
                        >
                            {plan.popular && (
                                <div className="pricing-popular-badge">{t('landing.pricingPopular')}</div>
                            )}
                            <h3 className="pricing-name">{plan.name}</h3>
                            <div className="pricing-price">
                                <span className="currency">{plan.currency}</span>
                                <span className="amount">{plan.price}</span>
                                <span className="period">/{plan.period}</span>
                            </div>
                            <p className="pricing-description">{plan.description}</p>
                            <ul className="pricing-features">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="pricing-feature">
                                        <svg className="feature-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/register"
                                className={`pricing-cta ${plan.popular ? 'primary' : 'secondary'}`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="pricing-note animate-on-scroll">
                    <p>{t('landing.pricingNote')}</p>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="cta-section">
                <div className="cta-container animate-on-scroll">
                    <h2 className="cta-title">{t('landing.ctaTitle')}</h2>
                    <p className="cta-description">{t('landing.ctaDescription')}</p>
                    <div className="cta-buttons">
                        <Link to="/register" className="cta-button primary">
                            {t('landing.ctaButtonPrimary')}
                        </Link>
                        <Link to="/login" className="cta-button secondary">
                            {t('landing.ctaButtonSecondary')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section" id="contact" ref={contactRef}>
                <div className="section-header animate-on-scroll">
                    <h2 className="section-title">{t('landing.contactTitle')}</h2>
                    <p className="section-description">{t('landing.contactDescription')}</p>
                </div>

                <div className="contact-container">
                    <div className="contact-form-container animate-on-scroll">
                        <form className="contact-form">
                            <div className="form-group">
                                <label htmlFor="name">{t('landing.contactName')}</label>
                                <input type="text" id="name" name="name" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">{t('landing.contactEmail')}</label>
                                <input type="email" id="email" name="email" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="subject">{t('landing.contactSubject')}</label>
                                <input type="text" id="subject" name="subject" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="message">{t('landing.contactMessage')}</label>
                                <textarea id="message" name="message" rows="5" required></textarea>
                            </div>
                            <button type="submit" className="contact-submit">
                                {t('landing.contactSubmit')}
                            </button>
                        </form>
                    </div>

                    <div className="contact-info animate-on-scroll">
                        <div className="contact-card">
                            <div className="contact-card-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <h3 className="contact-card-title">{t('landing.contactPhoneTitle')}</h3>
                            <p className="contact-card-text">+212 522 123 456</p>
                            <p className="contact-card-text">+212 661 789 012</p>
                        </div>

                        <div className="contact-card">
                            <div className="contact-card-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="contact-card-title">{t('landing.contactEmailTitle')}</h3>
                            <p className="contact-card-text">info@rentify.ma</p>
                            <p className="contact-card-text">support@rentify.ma</p>
                        </div>

                        <div className="contact-card">
                            <div className="contact-card-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="contact-card-title">{t('landing.contactAddressTitle')}</h3>
                            <p className="contact-card-text">{t('landing.contactAddressLine1')}</p>
                            <p className="contact-card-text">{t('landing.contactAddressLine2')}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;