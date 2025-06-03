import { useEffect, useState } from 'react';
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
    const [selectedSerie, setSelectedSerie] = useState(null);
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

    const handleSerieClick = (serie) => {
        setSelectedSerie(serie);
    };

    const closeModal = () => {
        setSelectedSerie(null);
    };

    const isFavorite = (serieId) => {
        return favorites.some(fav => fav.serieId === serieId);
    };

    const toggleFavorite = async (serieId) => {
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
                                onChange={e => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <button className="btn-search" onClick={handleSearch}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <span className="btn-text">{t('search.buttonSearch')}</span>
                            </button>
                            {(query || selectedLanguage || selectedTags.length > 0) && (
                                <button className="btn-clear" onClick={clearSearch}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    <span className="btn-text">{t('search.buttonClear')}</span>
                                </button>
                            )}
                        </div>
                        <button
                            className="filters-toggle"
                            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                            aria-label={filtersCollapsed ? 'Show filters' : 'Hide filters'}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
                                <path d="M3 12h18m-18 6h18M3 6h18" />
                            </svg>
                            <span className="filters-toggle-text">
                                {filtersCollapsed ? t('search.showFilters') : t('search.hideFilters')}
                            </span>
                        </button>
                    </div>

                    {!loadingFilters && (
                        <div className="filter-panels">
                            <div className="filter-panel">
                                <h3>{t('search.filterLanguage')}</h3>
                                <select
                                    value={selectedLanguage}
                                    onChange={e => setSelectedLanguage(e.target.value)}
                                    className="language-select"
                                >
                                    <option value="">{t('search.allLanguages')}</option>
                                    {languages.map(l => (
                                        <option key={l.id} value={l.id}>{t('languages.' + l.name)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-panel">
                                <h3>{t('search.filterTags')}</h3>
                                <div className="tags-list">
                                    {tags.map(tag => (
                                        <button
                                            key={tag.tagId}
                                            className={`tag-btn ${selectedTags.includes(tag.tagId) ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedTags(prev =>
                                                    prev.includes(tag.tagId)
                                                        ? prev.filter(x => x !== tag.tagId)
                                                        : [...prev, tag.tagId]
                                                );
                                            }}
                                        >
                                            {t('tags.' + tag.name)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="results-section">
                    {loadingResults ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>{t('search.searching')}</p>
                        </div>
                    ) : searched ? (
                        results.length > 0 ? (
                            <>
                                <div className="results-header">
                                    <h2>{t('search.resultsFound', { count: results.length })}</h2>
                                </div>
                                <div className="results-grid">
                                    {results.map(serie => (
                                        <div
                                            key={serie.id}
                                            className="serie-card"
                                            onClick={() => handleSerieClick(serie)}
                                        >
                                            <div className="serie-card-image">
                                                <img
                                                    src={serie.coverImageUrl ? `${apiUrl}${serie.coverImageUrl}` : '/placeholder.jpg'}
                                                    alt={serie.title}
                                                    loading="lazy"
                                                />
                                                <div className="serie-card-overlay">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="view-icon">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <h3 className="serie-card-title">{serie.title}</h3>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="empty-icon">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                <h2>{t('search.noResults')}</h2>
                                <p>{t('search.tryAdjustingFilters')}</p>
                            </div>
                        )
                    ) : (
                        <>
                            <div className="empty-state">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="empty-icon">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <h2>{t('search.startSearching')}</h2>
                                <p>{t('search.useFilters')}</p>
                            </div>

                            {!loadingTrending && trending.length > 0 && (
                                <div className="trending-section">
                                    <h2 className="trending-title">{t('search.trending')}</h2>
                                    <div className="trending-grid">
                                        {trending.map(serie => (
                                            <div
                                                key={serie.id}
                                                className="serie-card"
                                                onClick={() => handleSerieClick(serie)}
                                            >
                                                <div className="serie-card-image">
                                                    <img
                                                        src={serie.coverImageUrl ? `${apiUrl}${serie.coverImageUrl}` : '/placeholder.jpg'}
                                                        alt={serie.title}
                                                        loading="lazy"
                                                    />
                                                    <div className="serie-card-overlay">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="view-icon">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <h3 className="serie-card-title">{serie.title}</h3>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Serie Details Modal */}
            {selectedSerie && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="modal-body">
                            <div className="modal-image">
                                <img
                                    src={selectedSerie.coverImageUrl ? `${apiUrl}${selectedSerie.coverImageUrl}` : '/placeholder.jpg'}
                                    alt={selectedSerie.title}
                                />
                            </div>

                            <div className="modal-info">
                                <h2 className="modal-title">{selectedSerie.title}</h2>

                                <div className="modal-meta">
                                    <span className={`modal-status status-${selectedSerie.status?.toLowerCase()}`}>
                                        {t(`series.status.${selectedSerie.status?.toLowerCase()}`)}
                                    </span>
                                    {selectedSerie.authorName && (
                                        <span className="modal-author">{selectedSerie.authorName}</span>
                                    )}
                                </div>

                                {selectedSerie.synopsis && (
                                    <div className="modal-synopsis">
                                        <h3>{t('series.fields.synopsis')}</h3>
                                        <p>{selectedSerie.synopsis}</p>
                                    </div>
                                )}

                                {selectedSerie.tags && selectedSerie.tags.length > 0 && (
                                    <div className="modal-tags">
                                        <h3>{t('series.fields.tags')}</h3>
                                        <div className="modal-tags-list">
                                            {selectedSerie.tags.map(tag => (
                                                <span key={tag.tagId} className="modal-tag">{t('tags.' + tag.name)}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button
                                        className={`btn-favorite ${isFavorite(selectedSerie.id) ? 'active' : ''}`}
                                        onClick={() => toggleFavorite(selectedSerie.id)}
                                        disabled={loadingFavorite}
                                    >
                                        <svg viewBox="0 0 24 24" fill={isFavorite(selectedSerie.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        {isFavorite(selectedSerie.id) ? t('favorites.remove') : t('favorites.add')}
                                    </button>

                                    <a href={`/series/${selectedSerie.id}`} className="btn-view">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                        {t('series.list.viewDetails')}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;