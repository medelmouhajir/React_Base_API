// src/pages/filters/Filters.jsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Filters.css';

const Filters = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const cards = [
        {
            key: 'manufacturer',
            title: t('filters.manufacturer.title'),
            route: '/filters/manufacturer',
        },
        {
            key: 'models',
            title: t('filters.models.title'),
            route: '/filters/models',
        },
        {
            key: 'years',
            title: t('filters.years.title'),
            route: '/filters/caryear',
        },
    ];

    const handleNavigate = (route) => {
        navigate(route);
    };

    return (
        <div className="filters-container">
            <h1 className="filters-title">{t('filters.pageTitle')}</h1>
            <div className="filters-grid">
                {cards.map((card) => (
                    <div
                        key={card.key}
                        className="filter-card"
                        onClick={() => handleNavigate(card.route)}
                    >
                        <div className="card-content">
                            <p className="card-text">{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Filters;
