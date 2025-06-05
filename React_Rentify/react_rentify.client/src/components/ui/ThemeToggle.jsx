// src/components/ui/ThemeToggle.jsx
import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import '../ui/ui.css';

const ThemeToggle = ({ className = '' }) => {
    const { theme, isDarkMode, toggleTheme, setThemeMode } = useTheme();
    const { t } = useTranslation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Theme options with translations
    const themeOptions = [
        {
            id: THEMES.LIGHT,
            label: t('theme.light'),
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        fillRule="evenodd"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
        {
            id: THEMES.DARK,
            label: t('theme.dark'),
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            ),
        },
        {
            id: THEMES.SYSTEM,
            label: t('theme.system'),
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
    ];

    // Get current theme option
    const currentTheme = themeOptions.find((option) => option.id === theme) || themeOptions[0];

    return (
        <div className={`theme-toggle-wrapper ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`theme-toggle ${isDarkMode ? 'dark' : ''}`}
                aria-label={t('theme.toggleTheme')}
                title={t('theme.toggleTheme')}
            >
                <span className="theme-toggle-icon">
                    {isDarkMode ? currentTheme.icon : currentTheme.icon}
                </span>
            </button>

            {dropdownOpen && (
                <div className={`dropdown-content ${isDarkMode ? 'dark' : ''}`}>
                    <div className="py-1">
                        {themeOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                className={`dropdown-item ${theme === option.id
                                        ? `font-semibold ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`
                                        : ''
                                    }`}
                                onClick={() => {
                                    setThemeMode(option.id);
                                    setDropdownOpen(false);
                                }}
                            >
                                <span className="inline-block w-5 h-5 mr-2">{option.icon}</span>
                                {option.label}
                                {theme === option.id && (
                                    <svg
                                        className="w-4 h-4 ml-auto"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
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
                </div>
            )}
        </div>
    );
};

export default ThemeToggle;
