import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import useUserData from '../../hooks/useUserData';
import serieService from '../../services/serieService';
import chapterService from '../../services/chapterService';
import './SerieDetails.css';

const SerieDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const {
        checkFavorite,
        toggleFavorite
    } = useUserData();

    const [serie, setSerie] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newChapter, setNewChapter] = useState({ title: '', number: 1 });
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const serieRes = await serieService.getById(id);
                const chapterRes = await chapterService.getBySerieId(id);

                setSerie(serieRes);
                setChapters(chapterRes.data.sort((a, b) => a.number - b.number));

                // Set new chapter number based on max existing number
                const maxNumber = Math.max(...chapterRes.data.map(ch => ch.number), 0);
                setNewChapter((prev) => ({ ...prev, number: maxNumber + 1 }));

                // Check if serie is in favorites
                if (user) {
                    const favoriteStatus = await checkFavorite(id);
                    setIsFavorite(favoriteStatus);
                }
            } catch (err) {
                console.error('Error fetching data', err);
                toast.error(t('series.details.error'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user, checkFavorite, t]);

    const handleAddChapter = async () => {
        try {
            if (!newChapter.title.trim()) {
                toast.error(t('series.chapters.titleRequired'));
                return;
            }

            await chapterService.create({
                ...newChapter,
                serieId: id,
                uploadedAt: new Date().toISOString(),
            });

            setShowModal(false);
            toast.success(t('series.chapters.createSuccess'));

            // Refresh chapters list
            const chapterRes = await chapterService.getBySerieId(id);
            setChapters(chapterRes.data.sort((a, b) => a.number - b.number));
        } catch (err) {
            console.error('Failed to create chapter', err);
            toast.error(t('series.chapters.createError'));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewChapter({ ...newChapter, [name]: value });
    };

    const handleRemoveChapter = async (chapterId) => {
        if (window.confirm(t('series.chapters.confirmDelete'))) {
            try {
                await chapterService.delete(chapterId);
                setChapters(chapters.filter(ch => ch.id !== chapterId));
                toast.success(t('series.chapters.deleteSuccess'));
            } catch (err) {
                console.error('Failed to delete chapter', err);
                toast.error(t('series.chapters.deleteError'));
            }
        }
    };

    const handleFavoriteToggle = async () => {
        const result = await toggleFavorite(id);
        if (result) {
            setIsFavorite(!isFavorite);
        }
    };

    const handleStartReading = () => {
        if (chapters.length > 0) {
            const firstChapter = chapters[0];
            navigate(`/viewer/${firstChapter.id}`);
        }
    };

    if (loading) {
        return (
            <div className="serie-details-loading">
                <div className="loading-spinner"></div>
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    if (!serie) {
        return (
            <div className="serie-details-error">
                <h2>{t('series.details.notFound')}</h2>
                <p>{t('series.details.notFoundDesc')}</p>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/series')}
                >
                    {t('common.goBack')}
                </button>
            </div>
        );
    }

    return (
        <div className="serie-details">
            {/* Serie Header */}
            <div className="serie-header">
                <div className="serie-cover-container">
                    <img
                        src={`${import.meta.env.VITE_API_URL}${serie.coverImageUrl}`}
                        alt={serie.title}
                        className="serie-cover"
                        onError={(e) => {
                            e.target.src = '/placeholder-cover.jpg';
                        }}
                    />
                    {user && (
                        <button
                            className={`favorite-btn ${isFavorite ? 'favorite-btn--active' : ''}`}
                            onClick={handleFavoriteToggle}
                            aria-label={isFavorite ? t('series.removeFavorite') : t('series.addFavorite')}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill={isFavorite ? "currentColor" : "none"}
                                stroke="currentColor"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="serie-meta">
                    <h1>{serie.title}</h1>

                    <div className="serie-info">
                        <div className="serie-author">
                            <span className="info-label">{t('series.fields.author')}:</span>
                            <span className="info-value">{serie.authorName}</span>
                        </div>

                        <div className="serie-created">
                            <span className="info-label">{t('series.fields.created')}:</span>
                            <span className="info-value">
                                {new Date(serie.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="serie-status-container">
                            <span className="info-label">{t('series.fields.title')}:</span>
                            <span className={`status ${serie.status?.toLowerCase()}`}>
                                {t(`series.status.${serie.status?.toLowerCase()}`)}
                            </span>
                        </div>
                    </div>

                    {serie.synopsis && (
                        <div className="serie-synopsis">
                            <h3>{t('series.fields.synopsis')}</h3>
                            <p>{serie.synopsis}</p>
                        </div>
                    )}

                    <div className="serie-actions">
                        {user && user.id === serie.userId && (
                            <>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/series/edit/${id}`)}
                                >
                                    {t('series.edit')}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(true)}
                                >
                                    {t('series.chapters.add')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Chapters Section */}
            <div className="chapter-section">
                <h2>
                    {t('series.chapters.title')} ({chapters.length})
                </h2>

                {chapters.length === 0 ? (
                    <div className="no-chapters">
                        <svg width="4rem" height="4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10,9 9,9 8,9" />
                        </svg>
                        <h3>{t('series.chapters.noChapters')}</h3>
                        <p>{t('series.chapters.noChaptersDesc')}</p>
                    </div>
                ) : (
                    <div className="chapter-list">
                        {chapters.map((chapter) => (
                            <div key={chapter.id} className="chapter-item">
                                <div className="chapter-info">
                                    <h3 className="chapter-title">
                                        {chapter.title}
                                    </h3>
                                    <div className="chapter-meta">
                                        <span className="chapter-date">
                                            {new Date(chapter.uploadedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="chapter-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => navigate(`/viewer/${chapter.id}`)}
                                    >
                                        {t('series.chapters.startReading')}
                                    </button>

                                    {user && user.id === serie.userId && (
                                        <>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => navigate(`/chapters/edit/${chapter.id}`)}
                                            >
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleRemoveChapter(chapter.id)}
                                            >
                                                {t('common.delete')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button - Start Reading */}
            {chapters.length > 0 && (
                <button
                    className="float-read-btn"
                    onClick={handleStartReading}
                    aria-label={t('series.chapters.startReading')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polygon points="5,3 19,12 5,21 5,3" />
                    </svg>
                    <span className="float-read-text">{t('series.chapters.startReading')}</span>
                </button>
            )}

            {/* Add Chapter Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('series.chapters.add')}</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                                aria-label={t('common.close')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>{t('series.chapters.title')}</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={newChapter.title}
                                    onChange={handleInputChange}
                                    placeholder={t('series.chapters.titlePlaceholder')}
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('series.chapters.number')}</label>
                                <input
                                    type="number"
                                    name="number"
                                    value={newChapter.number}
                                    onChange={handleInputChange}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="modal-buttons">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowModal(false)}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddChapter}
                            >
                                {t('series.chapters.create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SerieDetails;