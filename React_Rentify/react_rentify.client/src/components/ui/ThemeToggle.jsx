// src/components/ui/ThemeToggle.jsx
import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
    const { theme, isDarkMode, toggleTheme, setThemeMode } = useTheme();
    const { t } = useTranslation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

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

    // Support for keyboard navigation and accessibility
    useEffect(() => {
        function handleKeyDown(e) {
            if (!dropdownOpen) return;

            if (e.key === 'Escape') {
                setDropdownOpen(false);
                buttonRef.current?.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [dropdownOpen]);

    // Add ripple effect for touch devices
    const addRippleEffect = (e) => {
        // Skip if not touch device
        if (window.matchMedia('(hover: hover)').matches) return;

        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.className = 'theme-option-ripple';

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    };

    // Theme options with translations
    const themeOptions = [
        {
            id: THEMES.LIGHT,
            label: t('theme.light'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            ),
        },
        {
            id: THEMES.DARK,
            label: t('theme.dark'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            ),
        },
        {
            id: THEMES.SYSTEM,
            label: t('theme.system'),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
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
                ref={buttonRef}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="theme-toggle"
                aria-label={t('theme.toggleTheme')}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                title={t('theme.toggleTheme')}
            >
                <span className="theme-toggle-icon">
                    {currentTheme.icon}
                </span>
            </button>

            {dropdownOpen && (
                <div className="theme-dropdown" role="menu" aria-orientation="vertical">
                    {themeOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            role="menuitem"
                            className={`theme-option ${theme === option.id ? 'theme-option-active' : ''}`}
                            onClick={(e) => {
                                setThemeMode(option.id);
                                setDropdownOpen(false);
                                addRippleEffect(e);
                            }}
                            onTouchStart={addRippleEffect}
                        >
                            <span className="theme-option-icon">{option.icon}</span>
                            <span className="theme-option-label">{option.label}</span>
                            {theme === option.id && (
                                <span className="theme-option-check">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ThemeToggle;