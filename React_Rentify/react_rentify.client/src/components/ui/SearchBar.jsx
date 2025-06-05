// src/components/ui/SearchBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import './ui.css';

const SearchBar = ({ className = '' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCategory, setSearchCategory] = useState('all');
    const [isFocused, setIsFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const searchRef = useRef(null);

    // Load recent searches from sessionStorage on mount
    useEffect(() => {
        try {
            const savedSearches = JSON.parse(sessionStorage.getItem('recentSearches')) || [];
            setRecentSearches(savedSearches);
        } catch (error) {
            console.error('Failed to load recent searches:', error);
        }
    }, []);

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search categories
    const categories = [
        { id: 'all', label: t('search.all') },
        { id: 'cars', label: t('search.cars') },
        { id: 'customers', label: t('search.customers') },
        { id: 'reservations', label: t('search.reservations') },
    ];

    // Handle search form submission
    const handleSearch = (e) => {
        e?.preventDefault();
        if (!searchTerm.trim()) return;

        // Save to recent searches (max 5)
        try {
            const updatedSearches = [
                { term: searchTerm, category: searchCategory, timestamp: Date.now() },
                ...recentSearches.filter(item => item.term !== searchTerm),
            ].slice(0, 5);

            setRecentSearches(updatedSearches);
            sessionStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        } catch (error) {
            console.error('Failed to save recent search:', error);
        }

        // Navigate to search results page with query params
        navigate(`/search?q=${encodeURIComponent(searchTerm)}&category=${searchCategory}`);
        setShowSuggestions(false);
    };

    // Handle selection of a recent search
    const handleSelectRecentSearch = (item) => {
        setSearchTerm(item.term);
        setSearchCategory(item.category);
        setShowSuggestions(false);
        setTimeout(() => {
            navigate(`/search?q=${encodeURIComponent(item.term)}&category=${item.category}`);
        }, 0);
    };

    // Clear recent searches
    const clearRecentSearches = (e) => {
        e.stopPropagation();
        setRecentSearches([]);
        sessionStorage.removeItem('recentSearches');
    };

    // Format relative time for recent searches
    const formatRelativeTime = (timestamp) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return t('time.justNow');
        if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('time.minutesAgo')}`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('time.hoursAgo')}`;
        return `${Math.floor(seconds / 86400)} ${t('time.daysAgo')}`;
    };

    return (
        <div className={`search-bar ${className}`} ref={searchRef}>
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>

                <input
                    type="search"
                    className={`search-input ${isDarkMode ? 'dark' : ''}`}
                    placeholder={t('search.placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                        setIsFocused(true);
                        setShowSuggestions(true);
                    }}
                    onBlur={() => setIsFocused(false)}
                    aria-label={t('search.searchLabel')}
                />

                <div className="search-category-wrapper">
                    <select
                        className={`form-select ${isDarkMode ? 'dark' : ''}`}
                        value={searchCategory}
                        onChange={(e) => setSearchCategory(e.target.value)}
                        aria-label={t('search.categoryLabel')}
                    >
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search button - visible only on mobile */}
                <button
                    type="submit"
                    className="search-button-mobile"
                    aria-label={t('search.searchButton')}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </button>
            </form>

            {showSuggestions && recentSearches.length > 0 && (
                <div className={`dropdown-content ${isDarkMode ? 'dark' : ''}`}>
                    <div className="suggestions-header">
                        <span className="font-medium">{t('search.recentSearches')}</span>
                        <button
                            className="clear-recent"
                            onClick={clearRecentSearches}
                        >
                            {t('search.clearAll')}
                        </button>
                    </div>
                    <ul className="suggestions-list">
                        {recentSearches.map((item, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    className={`dropdown-item ${isDarkMode ? 'dark' : ''}`}
                                    onClick={() => handleSelectRecentSearch(item)}
                                >
                                    <div className="suggestion-left">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span className={`suggestion-term ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {item.term}
                                        </span>
                                        <span className="suggestion-badge">
                                            {categories.find(cat => cat.id === item.category)?.label || item.category}
                                        </span>
                                    </div>
                                    <span className="suggestion-time">
                                        {formatRelativeTime(item.timestamp)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
