// src/components/ui/LanguageSelector.jsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import '../ui/ui.css';

const LanguageSelector = ({ className = '' }) => {
    const { i18n, t } = useTranslation();
    const { isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Available languages with more detailed information
    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧', native: 'English', direction: 'ltr' },
        { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'Français', direction: 'ltr' },
        { code: 'ar', name: 'العربية', flag: '🇲🇦', native: 'العربية', direction: 'rtl' },
    ];

    // Current language
    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Change language handler with document direction update
    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang.code);
        document.documentElement.dir = lang.direction;
        setIsOpen(false);

        // Store language preference
        try {
            localStorage.setItem('language', lang.code);
        } catch (error) {
            console.error('Failed to save language preference:', error);
        }
    };

    return (
        <div className={`language-selector relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center p-2.5 rounded-lg text-sm font-medium ${isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                aria-expanded={isOpen}
                title={t('language.selectLanguage')}
            >
                <span className="flex items-center">
                    <span className="text-xl mr-1">{currentLanguage.flag}</span>
                    <span className="sr-only">{currentLanguage.name}</span>
                </span>
            </button>

            {isOpen && (
                <div className="language-menu">
                    {languages.map(language => (
                        <button
                            key={language.code}
                            type="button"
                            onClick={() => changeLanguage(language)}
                            className={`language-item ${i18n.language === language.code ? 'active' : ''}`}
                            dir={language.direction}
                        >
                            <span className="text-xl">{language.flag}</span>
                            <span className="flex flex-col items-start">
                                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{language.name}</span>
                                <span className="text-xs text-gray-500">{language.native !== language.name ? language.native : ''}</span>
                            </span>
                            {i18n.language === language.code && (
                                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            )}
                        </button>
                    ))}

                    {/* Language information */}
                    <div className={`px-3 py-2 text-xs border-t ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                        {t('language.changeInfo')}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;