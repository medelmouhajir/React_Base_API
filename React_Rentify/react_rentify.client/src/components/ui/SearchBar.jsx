// src/components/ui/SearchBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import '../ui/ui.css';

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

    // Load recent searches from localStorage on component mount
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
                ...recentSearches.filter(item => item.term !== searchTerm)
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

        // Navigate immediately
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
            <form onSubmit={handleSearch} className="relative">
                <div className="search-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>

                <input
                    type="search"
                    className={`search-input ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
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

                <div className="absolute inset-y-0 right-0 flex items-center">
                    <select
                        className={`h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} focus:ring-0 focus:border-transparent`}
                        value={searchCategory}
                        onChange={(e) => setSearchCategory(e.target.value)}
                        aria-label={t('search.categoryLabel')}
                    >
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search button - visible on mobile */}
                <button
                    type="submit"
                    className="absolute right-0 top-0 mr-10 md:hidden h-full px-2 bg-primary-600 text-white rounded-r-lg"
                    aria-label={t('search.searchButton')}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </button>
            </form>

            {/* Recent searches dropdown */}
            {showSuggestions && recentSearches.length > 0 && (
                <div className={`absolute z-50 w-full mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-md shadow-lg border overflow-hidden`}>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium">{t('search.recentSearches')}</h3>
                        <button
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={clearRecentSearches}
                        >
                            {t('search.clearAll')}
                        </button>
                    </div>
                    <ul>
                        {recentSearches.map((item, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 flex items-center justify-between ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                                    onClick={() => handleSelectRecentSearch(item)}
                                >
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.term}</span>
                                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                            {categories.find(cat => cat.id === item.category)?.label || item.category}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">{formatRelativeTime(item.timestamp)}</span>
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