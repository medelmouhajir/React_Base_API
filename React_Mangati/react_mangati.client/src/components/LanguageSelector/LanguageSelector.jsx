// src/components/LanguageSelector/LanguageSelector.jsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector = ({ variant = 'default' }) => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        {
            code: 'en',
            name: t('language.english'),
            nativeName: 'English',
            flag: '🇺🇸'
        },
        {
            code: 'fr',
            name: t('language.french'),
            nativeName: 'Français',
            flag: '🇫🇷'
        },
        {
            code: 'ar',
            name: t('language.arabic'),
            nativeName: 'العربية',
            flag: '🇲🇦'
        }
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleLanguageChange = async (languageCode) => {
        try {
            await i18n.changeLanguage(languageCode);

            // Update document direction for RTL languages
            if (languageCode === 'ar') {
                document.documentElement.dir = 'rtl';
                document.documentElement.lang = 'ar';
            } else {
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = languageCode;
            }

            setIsOpen(false);
        } catch (error) {
            console.error('Error changing language:', error);
        }
    };

    const getVariantClass = () => {
        switch (variant) {
            case 'header':
                return 'language-selector--header';
            case 'footer':
                return 'language-selector--footer';
            case 'auth':
                return 'language-selector--auth';
            default:
                return '';
        }
    };

    return (
        <div className={`language-selector ${getVariantClass()}`} ref={dropdownRef}>
            <button
                className="language-selector__button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label={t('language.selectLanguage')}
            >
                <span className="language-selector__flag">
                    {currentLanguage.flag}
                </span>
                <span className="language-selector__name">
                    {currentLanguage.nativeName}
                </span>
                <svg
                    className={`language-selector__arrow ${isOpen ? 'language-selector__arrow--open' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            </button>

            {isOpen && (
                <div className="language-selector__dropdown">
                    <div className="language-selector__dropdown-header">
                        {t('language.selectLanguage')}
                    </div>
                    {languages.map((language) => (
                        <button
                            key={language.code}
                            className={`language-selector__option ${language.code === i18n.language ? 'language-selector__option--active' : ''
                                }`}
                            onClick={() => handleLanguageChange(language.code)}
                        >
                            <span className="language-selector__option-flag">
                                {language.flag}
                            </span>
                            <div className="language-selector__option-text">
                                <span className="language-selector__option-native">
                                    {language.nativeName}
                                </span>
                                <span className="language-selector__option-translated">
                                    {language.name}
                                </span>
                            </div>
                            {language.code === i18n.language && (
                                <svg
                                    className="language-selector__check"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;