
// src/components/ui/SearchBar.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCategory, setSearchCategory] = useState('all');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();

    // Search categories
    const categories = [
        { id: 'all', label: t('search.all') },
        { id: 'cars', label: t('search.cars') },
        { id: 'customers', label: t('search.customers') },
        { id: 'reservations', label: t('search.reservations') },
    ];

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();

        if (!searchTerm.trim()) return;

        // Navigate to search results page with query params
        navigate(`/search?q=${encodeURIComponent(searchTerm)}&category=${searchCategory}`);

        // Clear input
        setSearchTerm('');
    };

    return (
        <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>

                <input
                    type="search"
                    className={`block w-full p-2.5 pl-10 pr-24 text-sm rounded-lg ${isDarkMode
                            ? 'bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-primary-500 focus:border-primary-500'
                            : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                    placeholder={t('search.placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    required
                />

                <div className="absolute inset-y-0 right-0 flex items-center">
                    <select
                        className={`h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            } focus:ring-0 focus:border-transparent`}
                        value={searchCategory}
                        onChange={(e) => setSearchCategory(e.target.value)}
                    >
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </form>
    );
};

export default SearchBar;