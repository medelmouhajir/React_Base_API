// src/pages/Series/MySeries.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import serieService from '../../services/serieService';
import './MySeries.css';

const MySeries = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mySeries, setMySeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        fetchMySeries();
    }, []);

    const fetchMySeries = async () => {
        try {
            setLoading(true);
            const data = await serieService.getAll();
            // Filter series where the user is the author
            const userSeries = data.filter(serie => serie.authorId === user.id);
            setMySeries(userSeries);
        } catch (err) {
            console.error('Error fetching my series:', err);
            setError(t('mySeries.fetchError'));
            toast.error(t('mySeries.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSeries = () => {
        navigate('/series/create');
    };

    const handleDeleteSeries = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (window.confirm(t('mySeries.deleteConfirm'))) {
            try {
                await serieService.delete(id);
                toast.success(t('mySeries.deleteSuccess'));
                fetchMySeries();
            } catch (err) {
                console.error('Error deleting series:', err);
                toast.error(t('mySeries.deleteError'));
            }
        }
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const sortedSeries = [...mySeries].sort((a, b) => {
        if (sortBy === 'title') {
            return sortOrder === 'asc'
                ? a.title.localeCompare(b.title)
                : b.title.localeCompare(a.title);
        } else if (sortBy === 'status') {
            return sortOrder === 'asc'
                ? a.status.localeCompare(b.status)
                : b.status.localeCompare(a.status);
        } else { // createdAt
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
    });

    const getSortIcon = (field) => {
        if (sortBy !== field) return '↕';
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="my-series__loading">
                <div className="my-series__loading-spinner"></div>
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-series__error">
                <svg className="my-series__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h2>{t('common.error')}</h2>
                <p>{error}</p>
                <button className="my-series__retry-btn" onClick={fetchMySeries}>
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="my-series">
            <div className="my-series__header">
                <h1 className="my-series__title">{t('mySeries.title')}</h1>
                <div className="my-series__actions">
                    <div className="my-series__view-toggles">
                        <button
                            className={`my-series__view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            aria-label={t('mySeries.gridView')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                        </button>
                        <button
                            className={`my-series__view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            aria-label={t('mySeries.listView')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <button className="my-series__create-btn" onClick={handleCreateSeries}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        {t('mySeries.createNew')}
                    </button>
                </div>
            </div>

            {mySeries.length === 0 ? (
                <div className="my-series__empty">
                    <svg className="my-series__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <h2>{t('mySeries.noSeries')}</h2>
                    <p>{t('mySeries.createPrompt')}</p>
                    <button className="my-series__empty-create-btn" onClick={handleCreateSeries}>
                        {t('mySeries.startCreating')}
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="my-series__grid">
                    {sortedSeries.map(serie => (
                        <Link to={`/series/${serie.id}`} key={serie.id} className="my-series__card">
                            <div className="my-series__card-cover-wrapper">
                                {serie.coverImageUrl ? (
                                    <img
                                        src={'http://localhost:5229/' + serie.coverImageUrl}
                                        alt={serie.title}
                                        className="my-series__card-cover"
                                    />
                                ) : (
                                    <div className="my-series__card-cover-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <path d="M21 15l-5-5L5 21" />
                                        </svg>
                                    </div>
                                )}
                                <div className="my-series__card-actions">
                                    <Link
                                        to={`/series/${serie.id}/edit`}
                                        className="my-series__card-action my-series__card-action--edit"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </Link>
                                    <button
                                        className="my-series__card-action my-series__card-action--delete"
                                        onClick={(e) => handleDeleteSeries(serie.id, e)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="my-series__card-content">
                                <h3 className="my-series__card-title">{serie.title}</h3>
                                <p className="my-series__card-synopsis">{serie.synopsis}</p>
                                <div className="my-series__card-footer">
                                    <span className={`my-series__card-status my-series__card-status--${serie.status.toLowerCase()}`}>
                                        {t(`series.status.${serie.status.toLowerCase()}`)}
                                    </span>
                                    <span className="my-series__card-date">
                                        {formatDate(serie.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="my-series__list">
                    <div className="my-series__list-header">
                        <button
                            className="my-series__list-header-cell my-series__list-title-cell"
                            onClick={() => handleSortChange('title')}
                        >
                            {t('mySeries.columns.title')} {getSortIcon('title')}
                        </button>
                        <button
                            className="my-series__list-header-cell my-series__list-status-cell"
                            onClick={() => handleSortChange('status')}
                        >
                            {t('mySeries.columns.status')} {getSortIcon('status')}
                        </button>
                        <button
                            className="my-series__list-header-cell my-series__list-date-cell"
                            onClick={() => handleSortChange('createdAt')}
                        >
                            {t('mySeries.columns.created')} {getSortIcon('createdAt')}
                        </button>
                        <div className="my-series__list-header-cell my-series__list-actions-cell">
                            {t('mySeries.columns.actions')}
                        </div>
                    </div>

                    <div className="my-series__list-body">
                        {sortedSeries.map(serie => (
                            <div key={serie.id} className="my-series__list-row">
                                <div
                                    className="my-series__list-cell my-series__list-title-cell"
                                    onClick={() => navigate(`/series/${serie.id}`)}
                                >
                                    <div className="my-series__list-title-wrapper">
                                        {serie.coverImageUrl ? (
                                            <img
                                                src={'http://localhost:5229/' + serie.coverImageUrl}
                                                alt={serie.title}
                                                className="my-series__list-cover"
                                            />
                                        ) : (
                                            <div className="my-series__list-cover-placeholder">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <path d="M21 15l-5-5L5 21" />
                                                </svg>
                                            </div>
                                        )}
                                        <span className="my-series__list-title">{serie.title}</span>
                                    </div>
                                </div>
                                <div className="my-series__list-cell my-series__list-status-cell">
                                    <span className={`my-series__list-status my-series__list-status--${serie.status.toLowerCase()}`}>
                                        {t(`series.status.${serie.status.toLowerCase()}`)}
                                    </span>
                                </div>
                                <div className="my-series__list-cell my-series__list-date-cell">
                                    {formatDate(serie.createdAt)}
                                </div>
                                <div className="my-series__list-cell my-series__list-actions-cell">
                                    <div className="my-series__list-actions">
                                        <Link
                                            to={`/series/${serie.id}/edit`}
                                            className="my-series__list-action my-series__list-action--edit"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            <span className="my-series__list-action-text">{t('mySeries.edit')}</span>
                                        </Link>
                                        <button
                                            className="my-series__list-action my-series__list-action--delete"
                                            onClick={(e) => handleDeleteSeries(serie.id, e)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                <line x1="10" y1="11" x2="10" y2="17" />
                                                <line x1="14" y1="11" x2="14" y2="17" />
                                            </svg>
                                            <span className="my-series__list-action-text">{t('mySeries.delete')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySeries;