// src/components/ui/LanguageSelector.jsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import './LanguageSelector.css';

const LanguageSelector = ({ className = '' }) => {
    const { i18n, t } = useTranslation();
    const { isDarkMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Available languages with detailed information
    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧', native: 'English', direction: 'ltr' },
        { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'Français', direction: 'ltr' },
        { code: 'ar', name: 'العربية', flag: '🇲🇦', native: 'العربية', direction: 'rtl' },
    ];

    // Get current language
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
        <div className={`language-selector ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`language-selector-toggle ${isDarkMode ? 'dark' : ''}`}
                aria-expanded={isOpen}
                title={t('language.selectLanguage')}
            >
                <span className="language-flag" aria-hidden="true">{currentLanguage.flag}</span>
                <span className="sr-only">{t('language.selectLanguage')}</span>
            </button>

            {isOpen && (
                <div className={`language-dropdown ${isDarkMode ? 'dark' : ''}`}>
                    <div className="language-dropdown-header">
                        <span className="language-dropdown-title">{t('language.selectLanguage')}</span>
                    </div>

                    <div className="language-dropdown-content">
                        {languages.map((language) => (
                            <button
                                key={language.code}
                                type="button"
                                onClick={() => changeLanguage(language)}
                                className={`language-item ${i18n.language === language.code ? 'active' : ''}`}
                                dir={language.direction}
                            >
                                <span className="language-flag">{language.flag}</span>
                                <div className="language-details">
                                    <span className="language-name">{language.name}</span>
                                    {language.native !== language.name && (
                                        <span className="language-native">{language.native}</span>
                                    )}
                                </div>

                                {i18n.language === language.code && (
                                    <svg
                                        className="language-check"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="language-dropdown-footer">
                        <span className="language-info">{t('language.changeInfo')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;