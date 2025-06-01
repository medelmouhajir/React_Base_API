// src/pages/Series/SeriesList.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import serieService from '../../services/serieService';
import './SeriesList.css';

const SeriesList = () => {
    const { t } = useTranslation();
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <h1>{t('series.list.title')}</h1>
            {loading ? (
                <p>{t('common.loading')}</p>
            ) : series.length === 0 ? (
                <p>{t('series.list.empty')}</p>
            ) : (
                <div className="series-grid">
                    {series.map((serie) => (
                        <div className="serie-card" key={serie.id}>
                            {serie.coverImageUrl && (
                                <img
                                    src={`${import.meta.env.VITE_API_URL}${serie.coverImageUrl}`}
                                    alt={serie.title}
                                    className="serie-cover"
                                />
                            )}
                            <div className="serie-info">
                                <h2>{serie.title}</h2>
                                <p>{serie.synopsis}</p>
                                <span className={`status ${serie.status.toLowerCase()}`}>
                                    {t(`series.status.${serie.status.toLowerCase()}`)}
                                </span>
                                <Link to={`/series/${serie.id}`} className="details-link">
                                    {t('series.list.viewDetails')}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SeriesList;
