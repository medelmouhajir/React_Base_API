// src/pages/Series/SeriesList.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import serieService from '../../services/serieService';
import './SeriesList.css';

const SeriesList = () => {
    const { t } = useTranslation();
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const data = await serieService.getAll();
                setSeries(data);
            } catch (error) {
                toast.error(t('series.list.error'));
                console.error('Error loading series:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSeries();
    }, [t]);

    return (
        <div className="series-list">
            <h1 className="series-list__title">{t('series.list.title')}</h1>

            {loading ? (
                <div className="series-list__loading">
                    <div className="series-list__spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            ) : series.length === 0 ? (
                <div className="series-list__empty">
                    <p>{t('series.list.empty')}</p>
                </div>
            ) : (
                <div className="series-grid">
                    {series.map((serie) => (
                        <div className="serie-card" key={serie.id} onClick={() => navigate(`/series/${serie.id}`)} role="button" tabIndex="0">
                            <div className="serie-card__image-container">
                                {serie.coverImageUrl ? (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}${serie.coverImageUrl}`}
                                        alt={serie.title}
                                        className="serie-card__image"
                                    />
                                ) : (
                                    <div className="serie-card__no-image">
                                        <svg className="serie-card__placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                                            <line x1="7" y1="2" x2="7" y2="22"></line>
                                            <line x1="17" y1="2" x2="17" y2="22"></line>
                                            <line x1="2" y1="12" x2="22" y2="12"></line>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="serie-card__content">
                                <h2 className="serie-card__title">{serie.title}</h2>
                                <p className="serie-card__synopsis">{serie.synopsis}</p>
                                <div className="serie-card__footer">
                                    <span className={`serie-card__status serie-card__status--${serie.status.toLowerCase()}`}>
                                        {t(`series.status.${serie.status.toLowerCase()}`)}
                                    </span>
                                    <div className="serie-card__link">
                                        {t('series.list.viewDetails')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SeriesList;