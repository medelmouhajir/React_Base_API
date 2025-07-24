// src/pages/filters/Filters.jsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import './Filters.css';

const Filters = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    // Simulate loading state for better UX
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const cards = [
        {
            key: 'manufacturer',
            title: t('filters.manufacturer.title'),
            description: t('filters.manufacturer.description'),
            route: '/filters/manufacturer',
            icon: '🏭',
            color: 'primary'
        },
        {
            key: 'models',
            title: t('filters.models.title'),
            description: t('filters.models.description'),
            route: '/filters/models',
            icon: '🚗',
            color: 'secondary'
        },
        {
            key: 'years',
            title: t('filters.years.title'),
            description: t('filters.years.description'),
            route: '/filters/caryear',
            icon: '📅',
            color: 'tertiary'
        },
    ];

    const handleNavigate = (route) => {
        navigate(route);
    };

    const handleKeyPress = (e, route) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNavigate(route);
        }
    };

    if (isLoading) {
        return (
            <div className="filters-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="filters-container">
            <header className="filters-header">
                <h1 className="filters-title">{t('filters.pageTitle')}</h1>
                <p className="filters-description">{t('filters.pageDescription')}</p>
            </header>

            <div className="filters-grid" role="grid">
                {cards.map((card) => (
                    <div
                        key={card.key}
                        className={`filter-card filter-card-${card.color}`}
                        onClick={() => handleNavigate(card.route)}
                        onKeyDown={(e) => handleKeyPress(e, card.route)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${card.title} - ${card.description}`}
                    >
                        <div className="card-icon" aria-hidden="true">
                            {card.icon}
                        </div>
                        <div className="card-content">
                            <h3 className="card-title">{card.title}</h3>
                            <p className="card-description">{card.description}</p>
                        </div>
                        <div className="card-arrow" aria-hidden="true">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="filters-footer">
                <div className="help-section">
                    <h4 className="help-title">{t('filters.helpTitle')}</h4>
                    <p className="help-text">{t('filters.helpText')}</p>
                </div>
            </footer>
        </div>
    );
};

export default Filters;