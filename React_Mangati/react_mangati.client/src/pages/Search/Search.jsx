// src/pages/Search/Search.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import filtersService from '../../services/filtersService';
import searchService from '../../services/searchService';
import './Search.css';

const Search = () => {
    const { t } = useTranslation();
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5229';

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [langRes, tagRes] = await Promise.all([
                    filtersService.getLanguages(),
                    filtersService.getTags()
                ]);
                setLanguages(langRes.data);
                setTags(tagRes.data);
            } catch (error) {
                console.error('Error loading filters:', error);
                toast.error(t('search.errorLoadingFilters'));
            } finally {
                setLoadingFilters(false);
            }
        };

        const loadTrending = async () => {
            try {
                const res = await searchService.getTrending(6);
                setTrending(res.data);
            } catch (error) {
                console.error('Error loading trending series:', error);
            } finally {
                setLoadingTrending(false);
            }
        };

        loadFilters();
        loadTrending();
    }, [t]);

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

    return (
        <div className="search-container">
            <div className="search-content">
                <div className="search-header">
                    <h1>{t('search.title')}</h1>
                    <p>{t('search.subtitle')}</p>
                </div>

                <div className="search-filters">
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
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            {t('search.buttonSearch')}
                        </button>
                        {(query || selectedLanguage || selectedTags.length > 0) && (
                            <button className="btn-clear" onClick={clearSearch}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="clear-icon">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                {t('search.buttonClear')}
                            </button>
                        )}
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
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-panel">
                                <h3>{t('search.filterTags')}</h3>
                                <div className="tags-list">
                                    {tags.map(t => (
                                        <button
                                            key={t.tagId}
                                            className={`tag-btn ${selectedTags.includes(t.tagId) ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedTags(prev =>
                                                    prev.includes(t.tagId)
                                                        ? prev.filter(x => x !== t.tagId)
                                                        : [...prev, t.tagId]
                                                );
                                            }}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="results-section">
                    {loadingResults ? (
                        <div className="loading-results">
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
                                    {results.map(item => (
                                        <Link to={`/series/${item.id}`} key={item.id} className="result-card">
                                            {item.coverImageUrl && (
                                                <div className="result-image">
                                                    <img
                                                        src={`${apiUrl}${item.coverImageUrl}`}
                                                        alt={item.title}
                                                    />
                                                </div>
                                            )}
                                            <div className="result-content">
                                                <h3 className="result-title">{item.title}</h3>
                                                <div className="result-meta">
                                                    <span className={`result-status status-${item.status.toLowerCase()}`}>
                                                        {t(`series.status.${item.status.toLowerCase()}`)}
                                                    </span>
                                                    {item.authorName && (
                                                        <span className="result-author">{item.authorName}</span>
                                                    )}
                                                </div>
                                                {item.synopsis && (
                                                    <p className="result-synopsis">{item.synopsis}</p>
                                                )}
                                                {item.tags && item.tags.length > 0 && (
                                                    <div className="result-tags">
                                                        {item.tags.slice(0, 3).map(tag => (
                                                            <span key={tag.tagId} className="result-tag">{tag.name}</span>
                                                        ))}
                                                        {item.tags.length > 3 && (
                                                            <span className="result-tag-more">+{item.tags.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="no-results">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="no-results-icon">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                <h2>{t('search.noResults')}</h2>
                                <p>{t('search.tryAdjustingFilters')}</p>
                            </div>
                        )
                    ) : (
                        <>
                            <div className="search-prompt">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-prompt-icon">
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
                                        {trending.map(item => (
                                            <Link to={`/series/${item.id}`} key={item.id} className="trending-card">
                                                {item.coverImageUrl && (
                                                    <div className="trending-image">
                                                        <img
                                                            src={`${apiUrl}${item.coverImageUrl}`}
                                                            alt={item.title}
                                                        />
                                                    </div>
                                                )}
                                                <div className="trending-content">
                                                    <h3 className="trending-item-title">{item.title}</h3>
                                                    <div className="trending-meta">
                                                        <span className={`trending-status status-${item.status.toLowerCase()}`}>
                                                            {t(`series.status.${item.status.toLowerCase()}`)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;