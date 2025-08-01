import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import filtersService from '../../services/filtersService';
import searchService from '../../services/searchService';
import userDataService from '../../services/userDataService';
import { useAuth } from '../../contexts/AuthContext';
import './Search.css';

const Search = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [results, setResults] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const [searched, setSearched] = useState(false);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [loadingFavorite, setLoadingFavorite] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5229';

    useEffect(() => {
        const loadData = async () => {
            try {
                const [langRes, tagRes, favRes] = await Promise.all([
                    filtersService.getLanguages(),
                    filtersService.getTags(),
                    user ? userDataService.getFavorites() : Promise.resolve({ data: [] })
                ]);
                setLanguages(langRes.data);
                setTags(tagRes.data);
                setFavorites(favRes.data);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error(t('search.errorLoadingFilters'));
            } finally {
                setLoadingFilters(false);
            }
        };

        const loadTrending = async () => {
            try {
                const res = await searchService.getTrending(8);
                setTrending(res.data);
            } catch (error) {
                console.error('Error loading trending series:', error);
            } finally {
                setLoadingTrending(false);
            }
        };

        loadData();
        loadTrending();
    }, [t, user]);

    const handleSearch = async () => {
        setLoadingResults(true);
        setSearched(true);
        try {
            const response = await searchService.search({
                q: query,
                languageId: selectedLanguage || undefined,
                tagIds: selectedTags
            });
            setResults(response.data);
        } catch (error) {
            console.error('Error searching:', error);
            toast.error(t('search.errorSearching'));
            setResults([]);
        } finally {
            setLoadingResults(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSelectedLanguage('');
        setSelectedTags([]);
        setResults([]);
        setSearched(false);
    };

    const handleSerieClick = (serieId) => {
        navigate(`/series/${serieId}`);
    };

    const isFavorite = (serieId) => {
        return favorites.some(fav => fav.serieId === serieId);
    };

    const toggleFavorite = async (e, serieId) => {
        e.stopPropagation(); // Prevent navigation when clicking favorite button

        if (!user) {
            toast.warning(t('favorites.loginRequired'));
            return;
        }

        setLoadingFavorite(true);
        try {
            if (isFavorite(serieId)) {
                await userDataService.removeFavorite(serieId);
                setFavorites(prev => prev.filter(fav => fav.serieId !== serieId));
                toast.success(t('favorites.removed'));
            } else {
                await userDataService.addFavorite(serieId);
                setFavorites(prev => [...prev, { serieId }]);
                toast.success(t('favorites.added'));
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error(t('favorites.error'));
        } finally {
            setLoadingFavorite(false);
        }
    };

    const toggleTag = (tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const renderSerieCard = (serie, isFromTrending = false) => (
        <div
            key={serie.id}
            className="serie-card"
            onClick={() => handleSerieClick(serie.id)}
            role="button"
            tabIndex="0"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSerieClick(serie.id);
                }
            }}
        >
            <div className="serie-card-image">
                <img
                    src={serie.coverImageUrl ? `${apiUrl}${serie.coverImageUrl}` : '/placeholder.jpg'}
                    alt={serie.title}
                    loading="lazy"
                />
                {isFromTrending && (
                    <div className="trending-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" />
                        </svg>
                        {t('search.trending')}
                    </div>
                )}
                {user && (
                    <button
                        className={`favorite-btn ${isFavorite(serie.id) ? 'favorite-btn--active' : ''}`}
                        onClick={(e) => toggleFavorite(e, serie.id)}
                        disabled={loadingFavorite}
                        aria-label={isFavorite(serie.id) ? t('favorites.remove') : t('favorites.add')}
                    >
                        <svg viewBox="0 0 24 24" fill={isFavorite(serie.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="serie-card-content">
                <h3 className="serie-card-title">{serie.title}</h3>
                <div className="serie-card-meta">
                    <span className={`serie-status status-${serie.status?.toLowerCase()}`}>
                        {t(`series.status.${serie.status?.toLowerCase()}`)}
                    </span>
                    {serie.authorName && (
                        <span className="serie-author">{serie.authorName}</span>
                    )}
                </div>
                {serie.synopsis && (
                    <p className="serie-card-synopsis">{serie.synopsis}</p>
                )}
                {serie.tags && serie.tags.length > 0 && (
                    <div className="serie-card-tags">
                        {serie.tags.slice(0, 3).map(tag => (
                            <span key={tag.tagId} className="serie-tag">{t('tags.' + tag.name)}</span>
                        ))}
                        {serie.tags.length > 3 && (
                            <span className="serie-tag-more">+{serie.tags.length - 3}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="search-container">
            <div className="search-content">
                <div className="search-header">
                    <h1>{t('search.title')}</h1>
                    <p>{t('search.subtitle')}</p>
                </div>

                <div className={`search-filters ${filtersCollapsed ? 'search-filters--collapsed' : ''}`}>
                    <div className="search-filters-header">
                        <div className="search-input-group">
                            <input
                                type="text"
                                className="search-input"
                                placeholder={t('search.placeholder')}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <button
                                className="btn-search"
                                onClick={handleSearch}
                                disabled={loadingResults}
                            >
                                {loadingResults ? (
                                    <div className="spinner"></div>
                                ) : (
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                )}
                                <span className="btn-text">{t('search.search')}</span>
                            </button>
                            <button className="btn-clear" onClick={clearSearch}>
                                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                <span className="btn-text">{t('search.clear')}</span>
                            </button>
                        </div>

                        <button
                            className="filters-toggle"
                            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                        >
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            <span className="filters-toggle-text">{t('search.filters')}</span>
                            <svg
                                className={`icon ${filtersCollapsed ? 'rotate-180' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </div>

                    {!loadingFilters && (
                        <div className="filter-panels">
                            <div className="filter-panel">
                                <h3>{t('search.language')}</h3>
                                <select
                                    className="language-select"
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                >
                                    <option value="">{t('search.allLanguages')}</option>
                                    {languages.map(lang => (
                                        <option key={lang.id} value={lang.id}>
                                            {t('languages.' + lang.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-panel">
                                <h3>{t('search.tags')}</h3>
                                <div className="tags-container">
                                    {tags.map(tag => (
                                        <button
                                            key={tag.id}
                                            className={`tag-button ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {t('tags.' + tag.name)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Results */}
                {searched && (
                    <div className="search-results">
                        <div className="results-header">
                            <h2>{t('search.results')}</h2>
                            <span className="results-count">
                                {results.length} {t('search.resultsFound')}
                            </span>
                        </div>

                        {loadingResults ? (
                            <div className="loading-state">
                                <div className="spinner large"></div>
                                <p>{t('search.searching')}</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="results-grid">
                                {results.map(serie => renderSerieCard(serie))}
                            </div>
                        ) : (
                            <div className="no-results">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                <h3>{t('search.noResults')}</h3>
                                <p>{t('search.noResultsSubtitle')}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Trending Section */}
                {!searched && (
                    <div className="trending-section">
                        <div className="trending-header">
                            <h2 className="trending-title">{t('search.trending')}</h2>
                            <p className="trending-subtitle">{t('search.trendingSubtitle')}</p>
                        </div>

                        {loadingTrending ? (
                            <div className="loading-state">
                                <div className="spinner large"></div>
                                <p>{t('search.loadingTrending')}</p>
                            </div>
                        ) : trending.length > 0 ? (
                            <div className="trending-grid">
                                {trending.map(serie => renderSerieCard(serie, true))}
                            </div>
                        ) : (
                            <div className="no-trending">
                                <p>{t('search.noTrending')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;