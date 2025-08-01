// src/pages/Home/Home.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useUserData from '../../hooks/useUserData';
import serieService from '../../services/serieService';
import searchService from '../../services/searchService';
import './Home.css';

const Home = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { favorites, loadingFavorites, toggleFavorite } = useUserData();

    // State management
    const [allSeries, setAllSeries] = useState([]);
    const [recentSeries, setRecentSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('all');

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch all series and recent series
                const [allSeriesRes, recentRes] = await Promise.all([
                    serieService.getAll(),
                    searchService.getRecent(8)
                ]);

                setAllSeries(allSeriesRes || []);
                setRecentSeries(recentRes.data || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        document.title = `${t('home.pageTitle')} - Mangati`;
    }, [t]);

    // Handle favorite toggle
    const handleFavoriteToggle = async (serieId, event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!user) {
            navigate('/auth');
            return;
        }

        await toggleFavorite(serieId);
    };

    // Check if series is favorited
    const isFavorited = (serieId) => {
        return favorites.some(fav => fav.serieId === serieId);
    };

    // Render series card
    const renderSeriesCard = (serie, showFavoriteIcon = true) => (
        <Link
            key={serie.id}
            to={`/series/${serie.id}`}
            className="home__series-card"
        >
            <div className="home__series-image-container">
                <img
                    src={`${import.meta.env.VITE_API_URL}${serie.coverImageUrl}`}
                    alt={serie.title}
                    className="home__series-image"
                    onError={(e) => {
                        e.target.src = '/placeholder-cover.png';
                    }}
                />
                {showFavoriteIcon && user && (
                    <button
                        className={`home__favorite-btn ${isFavorited(serie.id) ? 'favorited' : ''}`}
                        onClick={(e) => handleFavoriteToggle(serie.id, e)}
                        aria-label={isFavorited(serie.id) ? t('series.removeFavorite') : t('series.addFavorite')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                )}
                <div className="home__series-status">
                    <span className={`status-badge status-${serie.status?.toLowerCase()}`}>
                        {t(`series.status.${serie.status?.toLowerCase()}`)}
                    </span>
                </div>
            </div>
            <div className="home__series-info">
                <h3 className="home__series-title">{serie.title}</h3>
                <p className="home__series-synopsis">
                    {serie.synopsis?.length > 100
                        ? `${serie.synopsis.substring(0, 100)}...`
                        : serie.synopsis || t('series.noSynopsis')
                    }
                </p>
                {serie.authorName && (
                    <p className="home__series-author">
                        {t('series.by')} {serie.authorName}
                    </p>
                )}
                <div className="home__series-meta">
                    {serie.chapterCount !== undefined && (
                        <span className="home__chapter-count">
                            {serie.chapterCount} {t('series.chapters')}
                        </span>
                    )}
                    {serie.tags && serie.tags.length > 0 && (
                        <div className="home__series-tags">
                            {serie.tags.slice(0, 3).map(tag => (
                                <span key={tag.tagId} className="home__tag">
                                    {t('tags.' + tag.name)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );

    // Loading skeleton
    const renderLoadingSkeleton = () => (
        <div className="home__loading">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="home__series-card skeleton">
                    <div className="home__series-image-container skeleton-image"></div>
                    <div className="home__series-info">
                        <div className="skeleton-text skeleton-title"></div>
                        <div className="skeleton-text skeleton-synopsis"></div>
                        <div className="skeleton-text skeleton-author"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="home__hero">
                <div className="home__hero-content">
                    <h1 className="home__hero-title">
                        {user ? t('home.welcomeBack') : t('home.welcome')}
                    </h1>
                    <p className="home__hero-subtitle">
                        {user ? t('home.exploreLibrary') : t('home.discoverManga')}
                    </p>
                    {!user && (
                        <div className="home__hero-actions">
                            <Link to="/auth" className="home__cta-button primary">
                                {t('auth.getStarted')}
                            </Link>
                            <Link to="/search" className="home__cta-button secondary">
                                {t('navigation.search')}
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Navigation Tabs */}
            <section className="home__navigation">
                <div className="home__nav-tabs">
                    <button
                        className={`home__nav-tab ${activeSection === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveSection('all')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        {t('home.allSeries')}
                    </button>

                    <button
                        className={`home__nav-tab ${activeSection === 'recent' ? 'active' : ''}`}
                        onClick={() => setActiveSection('recent')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                        </svg>
                        {t('home.recentSeries')}
                    </button>

                    {user && (
                        <button
                            className={`home__nav-tab ${activeSection === 'favorites' ? 'active' : ''}`}
                            onClick={() => setActiveSection('favorites')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {t('home.myFavorites')}
                            {favorites.length > 0 && (
                                <span className="home__tab-count">{favorites.length}</span>
                            )}
                        </button>
                    )}
                </div>
            </section>

            {/* Content Sections */}
            <main className="home__content">
                {loading ? (
                    renderLoadingSkeleton()
                ) : (
                    <>
                        {/* All Series */}
                        {activeSection === 'all' && (
                            <section className="home__section">
                                <div className="home__section-header">
                                    <h2 className="home__section-title">
                                        {t('home.allSeries')}
                                    </h2>
                                    <p className="home__section-subtitle">
                                        {t('home.allSeriesSubtitle')}
                                    </p>
                                </div>

                                {allSeries.length > 0 ? (
                                    <div className="home__series-grid">
                                        {allSeries.map(serie => renderSeriesCard(serie))}
                                    </div>
                                ) : (
                                    <div className="home__empty-state">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                        <h3>{t('home.noSeries')}</h3>
                                        <p>{t('home.noSeriesMessage')}</p>
                                        {user && (
                                            <Link to="/series/create" className="home__cta-button primary">
                                                {t('series.create')}
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Recent Series */}
                        {activeSection === 'recent' && (
                            <section className="home__section">
                                <div className="home__section-header">
                                    <h2 className="home__section-title">
                                        {t('home.recentSeries')}
                                    </h2>
                                    <p className="home__section-subtitle">
                                        {t('home.recentSeriesSubtitle')}
                                    </p>
                                </div>

                                {recentSeries.length > 0 ? (
                                    <div className="home__series-grid">
                                        {recentSeries.map(serie => renderSeriesCard(serie))}
                                    </div>
                                ) : (
                                    <div className="home__empty-state">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12,6 12,12 16,14" />
                                        </svg>
                                        <h3>{t('home.noRecentSeries')}</h3>
                                        <p>{t('home.noRecentSeriesMessage')}</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Favorites */}
                        {activeSection === 'favorites' && user && (
                            <section className="home__section">
                                <div className="home__section-header">
                                    <h2 className="home__section-title">
                                        {t('home.myFavorites')}
                                    </h2>
                                    <p className="home__section-subtitle">
                                        {t('home.myFavoritesSubtitle')}
                                    </p>
                                </div>

                                {loadingFavorites ? (
                                    renderLoadingSkeleton()
                                ) : favorites.length > 0 ? (
                                    <div className="home__series-grid">
                                        {favorites.map(favorite =>
                                            renderSeriesCard(favorite.serie, false)
                                        )}
                                    </div>
                                ) : (
                                    <div className="home__empty-state">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        <h3>{t('home.noFavorites')}</h3>
                                        <p>{t('home.noFavoritesMessage')}</p>
                                        <Link to="/search" className="home__cta-button secondary">
                                            {t('home.exploreSeries')}
                                        </Link>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>

        </div>
    );
};

export default Home;