import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import aiStudioService from '../../../services/aiStudioService';
import studioAssetsService from '../../../services/studioAssetsService';
import './StudioHome.css';

const StudioHome = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [quickActions, setQuickActions] = useState([]);
    const [selectedSerie, setSelectedSerie] = useState(null);
    const observerRef = useRef();
    const image_base_url = import.meta.env.VITE_API_URL;

    // Handle serie selection
    const onSerieSelect = (serie) => {
        setSelectedSerie(serie);
        if (serie) {
            localStorage.setItem('studioSelectedSerie', JSON.stringify(serie));
        } else {
            localStorage.removeItem('studioSelectedSerie');
        }

        // Dispatch custom event to notify StudioLayout
        window.dispatchEvent(new CustomEvent('localStorageChange', {
            detail: { key: 'studioSelectedSerie', newValue: serie ? JSON.stringify(serie) : null }
        }));
    };

    // Load initial data
    useEffect(() => {
        loadInitialData();
        // Load from localStorage
        const storedSerie = localStorage.getItem('studioSelectedSerie');
        if (storedSerie) {
            try {
                setSelectedSerie(JSON.parse(storedSerie));
            } catch (error) {
                console.error('Error loading selected serie:', error);
                localStorage.removeItem('studioSelectedSerie');
            }
        }
    }, []);

    // Load quick actions when serie is selected
    useEffect(() => {
        if (selectedSerie) {
            loadQuickActions();
        }
    }, [selectedSerie]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const studioSeries = await aiStudioService.getStudioSeries();
            setSeries(studioSeries);
            setHasMore(false); // Since we're loading all series at once for now
        } catch (error) {
            console.error('Error loading studio data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadQuickActions = async () => {
        if (!selectedSerie) return;

        try {
            const [characters, scenes, uploads, generations] = await Promise.all([
                aiStudioService.getCharacters(selectedSerie.id).catch(() => []),
                studioAssetsService.getScenes(selectedSerie.id).catch(() => []),
                studioAssetsService.getUploads(selectedSerie.id).catch(() => []),
                studioAssetsService.getImagesGenerations(selectedSerie.id).catch(() => [])
            ]);

            setQuickActions([
                {
                    id: 'characters',
                    title: t('studio.home.characters'),
                    count: characters.length,
                    icon: 'users',
                    color: 'blue',
                    href: '/studio/characters'
                },
                {
                    id: 'scenes',
                    title: t('studio.home.scenes'),
                    count: scenes.length,
                    icon: 'map',
                    color: 'green',
                    href: '/studio/scenes'
                },
                {
                    id: 'uploads',
                    title: t('studio.home.uploads'),
                    count: uploads.length,
                    icon: 'upload',
                    color: 'purple',
                    href: '/studio/uploads'
                },
                {
                    id: 'generations',
                    title: t('studio.home.imageGenerations'),
                    count: generations.length,
                    icon: 'image',
                    color: 'orange',
                    href: '/studio/generations'
                }
            ]);
        } catch (error) {
            console.error('Error loading quick actions:', error);
        }
    };

    const loadMoreSeries = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        try {
            setLoadingMore(true);
            // Implement pagination if needed in the future
            // For now, we load all series at once
        } catch (error) {
            console.error('Error loading more series:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore]);

    // Infinite scroll observer
    const lastSerieElementRef = useCallback(node => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreSeries();
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, hasMore, loadMoreSeries]);

    const handleSerieSelect = (serie) => {
        onSerieSelect(serie);
    };

    const handleCreateNewSerie = () => {
        navigate('/series/create?studio=true');
    };

    const handleQuickActionClick = (action) => {
        if (selectedSerie) {
            navigate(action.href);
        }
    };

    const renderIcon = (iconName) => {
        const icons = {
            users: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            ),
            map: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2"></polygon>
                    <line x1="8" y1="2" x2="8" y2="18"></line>
                    <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
            ),
            upload: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
            ),
            image: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <path d="M21 15l-5-5L5 21"></path>
                    <path d="M16 2l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3L12 5h3z"></path>
                </svg>
            )
        };
        return icons[iconName] || icons.image;
    };

    if (loading) {
        return (
            <div className="studio-home__loading">
                <div className="studio-home__spinner"></div>
                <p>{t('studio.home.loading')}</p>
            </div>
        );
    }

    return (
        <div className="studio-home">
            {/* Header Section */}
            <div className="studio-home__header">
                <div className="studio-home__header-content">
                    <h1 className="studio-home__title">
                        {selectedSerie ? t('studio.home.welcomeBackWithSerie', { serie: selectedSerie.title }) : t('studio.home.welcome')}
                    </h1>
                    <p className="studio-home__subtitle">
                        {selectedSerie ? t('studio.home.manageYourSerieAssets') : t('studio.home.selectSerieToStart')}
                    </p>
                </div>
            </div>

            {/* Serie Selection Section */}
            {!selectedSerie && (
                <div className="studio-home__serie-selection">
                    <div className="studio-home__section-header">
                        <h2 className="studio-home__section-title">{t('studio.home.selectYourSerie')}</h2>
                        <button
                            className="studio-home__create-btn"
                            onClick={handleCreateNewSerie}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            {t('studio.home.createNewSerie')}
                        </button>
                    </div>

                    <div className="studio-home__series-grid">
                        {series.map((serie, index) => (
                            <div
                                key={serie.id}
                                ref={index === series.length - 1 ? lastSerieElementRef : null}
                                className="studio-home__serie-card"
                                onClick={() => handleSerieSelect(serie)}
                            >
                                {serie.coverImageUrl && (
                                    <div className="studio-home__serie-image">
                                        <img
                                            src={image_base_url + serie.coverImageUrl}
                                            alt={serie.title}
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                                <div className="studio-home__serie-info">
                                    <h3 className="studio-home__serie-title">{serie.title}</h3>
                                    <span className="studio-home__serie-status">{serie.status}</span>
                                </div>
                                <div className="studio-home__serie-select">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 11 12 14 22 4"></polyline>
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                    </svg>
                                    {t('studio.home.selectSerie')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {loadingMore && (
                        <div className="studio-home__loading-more">
                            <div className="studio-home__spinner studio-home__spinner--small"></div>
                            <p>{t('studio.home.loadingMore')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Selected Serie Management */}
            {selectedSerie && (
                <div className="studio-home__serie-management">
                    <div className="studio-home__selected-serie">
                        <div className="studio-home__selected-serie-info">
                            <div className="studio-home__selected-serie-image">
                                {selectedSerie.coverImageUrl ? (
                                    <img
                                        src={image_base_url + selectedSerie.coverImageUrl}
                                        alt={selectedSerie.title}
                                    />
                                ) : (
                                    <div className="studio-home__selected-serie-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <path d="M21 15l-5-5L5 21"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="studio-home__selected-serie-details">
                                <h2 className="studio-home__selected-serie-title">{selectedSerie.title}</h2>
                                <p className="studio-home__selected-serie-status">{selectedSerie.status}</p>
                                {selectedSerie.synopsis && (
                                    <p className="studio-home__selected-serie-synopsis">{selectedSerie.synopsis}</p>
                                )}
                            </div>
                        </div>
                        <button
                            className="studio-home__change-serie-btn"
                            onClick={() => onSerieSelect(null)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 3l4 8 5-5v11H5V9l3-6"></path>
                                <path d="M2 3h6v4"></path>
                                <path d="M22 3h-6v4"></path>
                            </svg>
                            {t('studio.home.changeSerie')}
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="studio-home__quick-actions">
                        <h3 className="studio-home__section-title">{t('studio.home.quickActions')}</h3>
                        <div className="studio-home__actions-grid">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                    className={`studio-home__action-card studio-home__action-card--${action.color}`}
                                    onClick={() => handleQuickActionClick(action)}
                                >
                                    <div className="studio-home__action-icon">
                                        {renderIcon(action.icon)}
                                    </div>
                                    <div className="studio-home__action-info">
                                        <h4 className="studio-home__action-title">{action.title}</h4>
                                        <span className="studio-home__action-count">
                                            {action.count} {action.count === 1 ? t('studio.home.item') : t('studio.home.items')}
                                        </span>
                                    </div>
                                    <div className="studio-home__action-arrow">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && series.length === 0 && (
                <div className="studio-home__empty-state">
                    <div className="studio-home__empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <path d="M21 15l-5-5L5 21"></path>
                        </svg>
                    </div>
                    <h3 className="studio-home__empty-title">{t('studio.home.noSeriesFound')}</h3>
                    <p className="studio-home__empty-description">{t('studio.home.createFirstSerie')}</p>
                    <button
                        className="studio-home__create-first-btn"
                        onClick={handleCreateNewSerie}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        {t('studio.home.getStarted')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudioHome;