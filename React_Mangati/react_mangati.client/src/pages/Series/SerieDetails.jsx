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
        toggleFavorite,
        getReadingProgress,
        getReadingProgressBySerie
    } = useUserData();

    const [serie, setSerie] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newChapter, setNewChapter] = useState({ title: '', number: 1 });
    const [isFavorite, setIsFavorite] = useState(false);
    const [readingProgress, setReadingProgress] = useState({});

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

                    // Get reading progress for all chapters
                    const progress = await getReadingProgressBySerie(id);
                    if (progress) {
                        // Create a map of chapterId -> progress
                        const progressMap = progress.reduce((map, item) => {
                            map[item.chapterId] = item;
                            return map;
                        }, {});
                        setReadingProgress(progressMap);
                    }
                }
            } catch (err) {
                console.error('Error fetching data', err);
                toast.error(t('series.details.error'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user, checkFavorite, getReadingProgressBySerie, t]);

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

    const getReadButton = (chapter) => {
        const progress = readingProgress[chapter.id];

        if (progress) {
            return (
                <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/viewer/${chapter.id}?page=${progress.lastReadPage}`)}
                >
                    {t('series.chapters.resumeReading')}
                </button>
            );
        } else {
            return (
                <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/viewer/${chapter.id}`)}
                >
                    {t('series.chapters.startReading')}
                </button>
            );
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
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/series')}
                >
                    {t('common.backToList')}
                </button>
            </div>
        );
    }

    const isAuthor = user && user.id === serie.authorId;
    console.log('hhhhhhh');
    console.log(user);
    console.log(serie);
    return (
        <div className="serie-details">
            <div className="serie-header">
                <div className="serie-cover-container">
                    <img
                        className="serie-cover"
                        src={`${import.meta.env.VITE_API_URL}${serie.coverImageUrl}`}
                        alt={serie.title}
                    />

                    {!isAuthor && user && (
                        <button
                            className={`favorite-btn ${isFavorite ? 'favorite-btn--active' : ''}`}
                            onClick={handleFavoriteToggle}
                            aria-label={isFavorite ? t('series.unfavorite') : t('series.favorite')}
                        >
                            <svg viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span>{isFavorite ? t('series.unfavorite') : t('series.favorite')}</span>
                        </button>
                    )}
                </div>

                <div className="serie-meta">
                    <h1>{serie.title}</h1>

                    <div className="serie-info">
                        {serie.authorName && (
                            <div className="serie-author">
                                <span className="info-label">{t('series.fields.author')}:</span>
                                <span className="info-value">{serie.authorName}</span>
                            </div>
                        )}

                        <div className="serie-created">
                            <span className="info-label">{t('series.fields.created')}:</span>
                            <span className="info-value">
                                {new Date(serie.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="serie-status-container">
                            <span className="info-label">{t('series.fields.status')}:</span>
                            <span className={`status ${serie.status?.toLowerCase()}`}>
                                {t(`series.status.${serie.status?.toLowerCase()}`)}
                            </span>
                        </div>
                    </div>

                    <div className="serie-synopsis">
                        <h3>{t('series.fields.synopsis')}</h3>
                        <p>{serie.synopsis || t('series.details.noSynopsis')}</p>
                    </div>

                    {isAuthor && (
                        <div className="serie-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate(`/series/edit/${id}`)}
                            >
                                {t('series.edit')}
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={() => setShowModal(true)}
                            >
                                {t('series.chapters.add')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="chapter-section">
                <h2>{t('series.chapters.title')}</h2>

                {chapters.length === 0 ? (
                    <div className="no-chapters">
                        <p>{t('series.chapters.empty')}</p>
                        {isAuthor && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowModal(true)}
                            >
                                {t('series.chapters.createFirst')}
                            </button>
                        )}
                    </div>
                ) : (
                    <ul className="chapter-list">
                        {chapters.map((chapter) => (
                            <li key={chapter.id} className="chapter-item">
                                <div className="chapter-info">
                                    <div className="chapter-title">
                                        <span className="chapter-number">#{chapter.number}</span>
                                        <h3>{chapter.title}</h3>
                                    </div>
                                    <span className="chapter-date">
                                        {new Date(chapter.uploadedAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="chapter-actions">
                                    {isAuthor ? (
                                        <>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => navigate(`/viewer/${chapter.id}`)}
                                            >
                                                {t('series.chapters.view')}
                                            </button>
                                            <button
                                                className="btn btn-info"
                                                onClick={() => navigate(`/series/${id}/chapters/${chapter.id}/edit`)}
                                            >
                                                {t('series.chapters.edit')}
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleRemoveChapter(chapter.id)}
                                            >
                                                {t('series.chapters.delete')}
                                            </button>
                                        </>
                                    ) : (
                                        getReadButton(chapter)
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>{t('series.chapters.newChapter')}</h3>
                        <div className="modal-form">
                            <div className="form-group">
                                <label htmlFor="title">{t('series.chapters.titleField')}</label>
                                <input
                                    id="title"
                                    type="text"
                                    name="title"
                                    placeholder={t('series.chapters.titlePlaceholder')}
                                    value={newChapter.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="number">{t('series.chapters.numberField')}</label>
                                <input
                                    id="number"
                                    type="number"
                                    name="number"
                                    placeholder={t('series.chapters.numberPlaceholder')}
                                    value={newChapter.number}
                                    onChange={handleInputChange}
                                    min="1"
                                    required
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
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SerieDetails;