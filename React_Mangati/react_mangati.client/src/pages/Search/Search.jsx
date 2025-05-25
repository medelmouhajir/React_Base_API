// src/pages/Search/Search.jsx
import { useEffect, useState } from 'react';
import filtersService from '../../services/filtersService';
import apiClient from '../../services/apiClient';
import './Search.css';

const Search = () => {
    const [query, setQuery] = useState('');
    const [languages, setLanguages] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [results, setResults] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [langRes, tagRes] = await Promise.all([
                    filtersService.getLanguages(),
                    filtersService.getTags()
                ]);
                setLanguages(langRes.data);
                setTags(tagRes.data);
            } catch {
                // handle error
            } finally {
                setLoadingFilters(false);
            }
        };
        loadFilters();
    }, []);

    const handleSearch = async () => {
        setLoadingResults(true);
        try {
            const res = await apiClient.get('/search', {
                params: {
                    q: query,
                    languageId: selectedLanguage,
                    tagIds: selectedTags.join(',')
                }
            });
            setResults(res.data);
        } catch {
            // mock data if error / for demo
            setResults([
                { id: 1, title: 'Mock Manga A', synopsis: 'Demo synopsis A.' },
                { id: 2, title: 'Mock Manga B', synopsis: 'Demo synopsis B.' }
            ]);
        } finally {
            setLoadingResults(false);
        }
    };

    return (
        <div className="search-container">
            <div className="results-area">
                {loadingResults ? (
                    <div className="loading">Searching...</div>
                ) : results.length > 0 ? (
                    results.map(item => (
                        <div key={item.id} className="result-card">
                            <h3>{item.title}</h3>
                            <p>{item.synopsis}</p>
                        </div>
                    ))
                ) : (
                    <div className="no-results">No results yet.</div>
                )}
            </div>

            <aside className="search-sidebar">
                <h2>Search</h2>
                <div className="filter-group">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Keywords..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button className="btn-search" onClick={handleSearch}>
                        Go
                    </button>
                </div>

                {!loadingFilters && (
                    <>
                        <div className="filter-group">
                            <label>Language</label>
                            <select
                                value={selectedLanguage}
                                onChange={e => setSelectedLanguage(e.target.value)}
                            >
                                <option value="">All</option>
                                {languages.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Tags</label>
                            <div className="tags-list">
                                {tags.map(t => (
                                    <button
                                        key={t.tagId}
                                        className={`tag-btn ${selectedTags.includes(t.tagId) ? 'active' : ''
                                            }`}
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
                    </>
                )}
            </aside>
        </div>
    );
};

export default Search;
