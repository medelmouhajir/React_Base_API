// src/pages/Favorites/Favorites.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useUserData from '../../hooks/useUserData';
import './Favorites.css';

const Favorites = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { favorites, loadingFavorites, removeFavorite, loadFavorites } = useUserData();
    const [searchQuery, setSearchQuery] = useState('');
    const [isRemoving, setIsRemoving] = useState({});

    // Filter favorites based on search query
    const filteredFavorites = useMemo(() => {
        if (!searchQuery.trim()) return favorites;

        const query = searchQuery.toLowerCase().trim();
        return favorites.filter(favorite =>
            favorite.serie.title.toLowerCase().includes(query) ||
            (favorite.serie.synopsis && favorite.serie.synopsis.toLowerCase().includes(query))
        );
    }, [favorites, searchQuery]);

    // Handle removing a series from favorites
    const handleRemove = async (e, serieId) => {
        e.stopPropagation(); // Prevent navigating to details

        setIsRemoving(prev => ({ ...prev, [serieId]: true }));

        try {
            await removeFavorite(serieId);
            // No need to manually update the state as removeFavorite already updates it
        } catch (error) {
            console.error('Failed to remove from favorites:', error);
            toast.error(t('favorites.removeError'));
        } finally {
            setIsRemoving(prev => ({ ...prev, [serieId]: false }));
        }
    };

    // Navigate to serie details
    const goToSerieDetails = (serieId) => {
        navigate(`/series/${serieId}`);
    };

    // Get status label
    const getStatusLabel = (status) => {
        return t(`series.status.${status}`);
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(navigator.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    return (
        <div className="favorites-page">
            <div className="favorites-header">
                <h1 className="favorites-title">{t('favorites.title', 'My Favorites')}</h1>
                <div className="favorites-search">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder={t('favorites.searchPlaceholder', 'Search your favorites...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        {searchQuery && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loadingFavorites ? (
                <div className="favorites-loading">
                    <div className="favorites-loader"></div>
                    <p>{t('favorites.loading', 'Loading your favorites...')}</p>
                </div>
            ) : favorites.length === 0 ? (
                <div className="favorites-empty">
                    <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h2>{t('favorites.empty.title', 'No favorites yet')}</h2>
                    <p>{t('favorites.empty.message', 'Start exploring series and add them to your favorites')}</p>
                    <button
                        className="explore-btn"
                        onClick={() => navigate('/series')}
                    >
                        {t('favorites.explore', 'Explore Series')}
                    </button>
                </div>
            ) : filteredFavorites.length === 0 ? (
                <div className="favorites-no-results">
                    <svg className="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2>{t('favorites.noResults.title', 'No matching results')}</h2>
                    <p>{t('favorites.noResults.message', 'Try adjusting your search terms')}</p>
                    <button
                        className="clear-search-btn"
                        onClick={() => setSearchQuery('')}
                    >
                        {t('favorites.clearSearch', 'Clear Search')}
                    </button>
                </div>
            ) : (
                <div className="favorites-grid">
                    {filteredFavorites.map((favorite) => (
                        <div
                            className="favorite-card"
                            key={favorite.id}
                            onClick={() => goToSerieDetails(favorite.serie.id)}
                        >
                            <div className="favorite-cover-container">
                                {favorite.serie.coverImageUrl && (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}${favorite.serie.coverImageUrl}`}
                                        alt={favorite.serie.title}
                                        className="favorite-cover"
                                    />
                                )}
                                <div className="favorite-actions">
                                    <button
                                        className="remove-btn"
                                        onClick={(e) => handleRemove(e, favorite.serie.id)}
                                        disabled={isRemoving[favorite.serie.id]}
                                        aria-label={t('favorites.remove', 'Remove from favorites')}
                                    >
                                        {isRemoving[favorite.serie.id] ? (
                                            <div className="button-loader"></div>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <span className={`status-badge status-${favorite.serie.status}`}>
                                    {getStatusLabel(favorite.serie.status)}
                                </span>
                            </div>
                            <div className="favorite-info">
                                <h3 className="favorite-title">{favorite.serie.title}</h3>
                                {favorite.serie.synopsis && (
                                    <p className="favorite-synopsis">{favorite.serie.synopsis}</p>
                                )}
                                <div className="favorite-meta">
                                    <span className="favorite-added-date">
                                        {t('favorites.addedOn', 'Added on')} {formatDate(favorite.addedAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;