// src/pages/Home/Home.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

// import images and icons
import hero from '../../assets/hero.png'; 
import icon1 from '../../assets/1-1.png';
import icon2 from '../../assets/1-2.png';
import icon3 from '../../assets/1-3.png';
import Workflow1 from '../../assets/2-1.png';
import Workflow2 from '../../assets/2-2.png';
import Workflow3 from '../../assets/2-3.png';



const Home = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState({
        hero: false,
        features: false,
        workflow: false,
        cta: false
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
        document.title = `${t('home.pageTitle')} - Mangati`;
    }, [t]);

    return (
        <div className="home">
            {/* Hero Section */}
            <section className={`home__hero animate-on-scroll ${isVisible.hero ? 'visible' : ''}`} data-section="hero">
                <div className="home__hero-content">
                    <h1 className="home__title">{t('home.title')}</h1>
                    <p className="home__subtitle">{t('home.subtitle')}</p>

                    <div className="home__cta-group">
                        <Link to={user ? "/series/create" : "/auth"} className="home__cta-button primary">
                            {t('home.ctaPrimary')}
                        </Link>
                        <a href="#features" className="home__cta-button secondary">
                            {t('home.ctaSecondary')}
                        </a>
                    </div>
                </div>
                <div className="home__hero-image-container">
                    <img
                        className="home__hero-image"
                        src={hero}
                        alt={t('home.heroImageAlt')}
                    />
                    <div className="home__hero-shape"></div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className={`home__features animate-on-scroll ${isVisible.features ? 'visible' : ''}`} data-section="features">
                <div className="home__section-header">
                    <h2 className="home__section-title">{t('home.features.title')}</h2>
                    <p className="home__section-subtitle">{t('home.features.subtitle')}</p>
                </div>

                <div className="home__feature-grid">
                    <div className="home__feature-card">
                        <div className="home__feature-icon">
                            <img src={icon1} alt="AI generation icon" />
                        </div>
                        <h3>{t('home.features.aiGeneration.title')}</h3>
                        <p>{t('home.features.aiGeneration.description')}</p>
                    </div>

                    <div className="home__feature-card">
                        <div className="home__feature-icon">
                            <img src={icon2} alt="Storytelling tools icon" />
                        </div>
                        <h3>{t('home.features.storytelling.title')}</h3>
                        <p>{t('home.features.storytelling.description')}</p>
                    </div>

                    <div className="home__feature-card">
                        <div className="home__feature-icon">
                            <img src={icon3} alt="Export options icon" />
                        </div>
                        <h3>{t('home.features.export.title')}</h3>
                        <p>{t('home.features.export.description')}</p>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section className={`home__workflow animate-on-scroll ${isVisible.workflow ? 'visible' : ''}`} data-section="workflow">
                <div className="home__section-header">
                    <h2 className="home__section-title">{t('home.workflow.title')}</h2>
                    <p className="home__section-subtitle">{t('home.workflow.subtitle')}</p>
                </div>

                <div className="home__workflow-steps">
                    <div className="home__workflow-step">
                        <div className="home__workflow-number">1</div>
                        <div className="home__workflow-content">
                            <h3>{t('home.workflow.step1.title')}</h3>
                            <p>{t('home.workflow.step1.description')}</p>
                        </div>
                        <img
                            src={Workflow1}
                            alt="Write your story illustration"
                            className="home__workflow-image"
                        />
                    </div>

                    <div className="home__workflow-step reverse">
                        <div className="home__workflow-number">2</div>
                        <div className="home__workflow-content">
                            <h3>{t('home.workflow.step2.title')}</h3>
                            <p>{t('home.workflow.step2.description')}</p>
                        </div>
                        <img
                            src={Workflow2}
                            alt="AI generates illustrations"
                            className="home__workflow-image"
                        />
                    </div>

                    <div className="home__workflow-step">
                        <div className="home__workflow-number">3</div>
                        <div className="home__workflow-content">
                            <h3>{t('home.workflow.step3.title')}</h3>
                            <p>{t('home.workflow.step3.description')}</p>
                        </div>
                        <img
                            src={Workflow3}
                            alt="Publish and share your manga"
                            className="home__workflow-image"
                        />
                    </div>
                </div>
            </section>

            {/* Call to action */}
            <section className={`home__cta-section animate-on-scroll ${isVisible.cta ? 'visible' : ''}`} data-section="cta">
                <div className="home__cta-container">
                    <h2>{t('home.cta.title')}</h2>
                    <p>{t('home.cta.description')}</p>
                    <Link to={user ? "/series/create" : "/auth"} className="home__cta-button primary large">
                        {t('home.cta.buttonText')}
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;