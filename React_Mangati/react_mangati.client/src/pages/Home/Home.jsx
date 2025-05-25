/* src/pages/Home/Home.jsx */
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import hero from '../../assets/hero.png'
import './Home.css';

const Home = () => {
    const { t } = useTranslation();

    useEffect(() => {
        document.title = `${t('home.pageTitle')} - Mangati`;
    }, [t]);

    return (
        <div className="home">

            <section className="home__hero">
                <div className="home__hero-content">
                    <h1 className="home__title">{t('home.title')}</h1>
                    <p className="home__subtitle">{t('home.subtitle')}</p>
                    <button className="home__cta">{t('home.cta')}</button>
                </div>
                <img
                    className="home__hero-image"
                    src={hero}
                    alt={t('home.heroImageAlt')}
                />
            </section>

            <section className="home__features">
                <h2 className="home__section-title">{t('home.features.title')}</h2>
                <div className="home__feature-list">
                    <div className="home__feature">
                        <img src="https://placehold.co/40x40" alt="" />
                        <h3>{t('home.features.generateManga.title')}</h3>
                        <p>{t('home.features.generateManga.description')}</p>
                    </div>
                    <div className="home__feature">
                        <img src="https://placehold.co/40x40" alt="" />
                        <h3>{t('home.features.aiGeneration.title')}</h3>
                        <p>{t('home.features.aiGeneration.description')}</p>
                    </div>
                    <div className="home__feature">
                        <img src="https://placehold.co/40x40" alt="" />
                        <h3>{t('home.features.export.title')}</h3>
                        <p>{t('home.features.export.description')}</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;