
// src/components/ui/LanguageSelector.jsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

const LanguageSelector = ({ className = '' }) => {
    const { i18n } = useTranslation();
    const { isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Available languages
    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'ar', name: 'العربية', flag: '🇲🇦' },
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

    // Change language handler
    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center p-2.5 rounded-lg text-sm font-medium ${isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                aria-expanded={isOpen}
            >
                <span className="mr-1">{currentLanguage.flag}</span>
                <span className="sr-only">{currentLanguage.name}</span>
            </button>

            {isOpen && (
                <div className={`absolute z-10 mt-2 w-48 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } border`}>
                    <ul className="py-1">
                        {languages.map(language => (
                            <li key={language.code}>
                                <button
                                    type="button"
                                    onClick={() => changeLanguage(language.code)}
                                    className={`block w-full text-left px-4 py-2 text-sm ${isDarkMode
                                        ? 'text-gray-300 hover:bg-gray-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        } ${i18n.language === language.code ? 'font-semibold' : ''}`}
                                >
                                    <span className="mr-2">{language.flag}</span>
                                    {language.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;