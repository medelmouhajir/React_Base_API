import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
    const { t } = useTranslation();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check if theme is stored in localStorage
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Set initial theme state
        if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
            setIsDark(true);
            document.documentElement.classList.add('dark-mode');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark-mode');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            // Switch to light mode
            document.documentElement.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        } else {
            // Switch to dark mode
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        }
        setIsDark(!isDark);
    };

    return (
        <button
            className={`theme-toggle ${className} ${isDark ? 'theme-toggle--dark' : 'theme-toggle--light'}`}
            onClick={toggleTheme}
            aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
            title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
        >
            {isDark ? (
                <svg className="theme-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            ) : (
                <svg className="theme-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            )}
        </button>
    );
};

export default ThemeToggle;