import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppRoutes from './routes/AppRoutes';
import './App.css';
import './styles/variables.css';
import './styles/global.css';
import './i18n/config.js';

function App() {
    const { i18n } = useTranslation();
    const [theme, setTheme] = useState('light');
    const [isLoading, setIsLoading] = useState(true);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('virtuello-theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        const initialTheme = savedTheme || systemTheme;
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);

        // Set loading to false after theme is initialized
        setIsLoading(false);
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (!localStorage.getItem('virtuello-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                setTheme(newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Theme toggle function
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('virtuello-theme', newTheme);
    };

    // Language change handler
    const changeLanguage = (language) => {
        i18n.changeLanguage(language);
        localStorage.setItem('virtuello-language', language);

        // Update document direction for RTL languages
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    };

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeydown = (event) => {
            // Ctrl/Cmd + Shift + T to toggle theme
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
                event.preventDefault();
                toggleTheme();
            }

            // Ctrl/Cmd + / for help/shortcuts (future feature)
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                console.log('Keyboard shortcuts:', {
                    'Ctrl/Cmd + Shift + T': 'Toggle theme',
                    'Ctrl/Cmd + /': 'Show shortcuts',
                    'Escape': 'Close modals/sidebars'
                });
            }
        };

        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, [theme]);

    // Set initial language direction
    useEffect(() => {
        const currentLanguage = i18n.language;
        document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLanguage;
    }, [i18n.language]);

    // Global error boundary fallback
    const ErrorFallback = ({ error }) => (
        <div className="error-fallback" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <h1 style={{ color: 'var(--error)', marginBottom: '1rem' }}>
                Something went wrong
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {error.message}
            </p>
            <button
                onClick={() => window.location.reload()}
                className="btn-primary"
            >
                Reload Page
            </button>
        </div>
    );

    // Loading screen
    if (isLoading) {
        return (
            <div className="app-loading" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}>
                <div className="spinner" style={{ marginBottom: '1rem' }}></div>
                <div>Loading Virtuello...</div>
            </div>
        );
    }

    return (
        <div className="app" data-theme={theme}>
            <Router>
                {/* Global Theme Toggle - Floating Button */}
                <button
                    onClick={toggleTheme}
                    className="theme-toggle-btn"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 'var(--z-tooltip)',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: '1px solid var(--border-primary)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-lg)',
                        transition: 'all var(--transition-fast)'
                    }}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                {/* Language Toggle - Floating Button */}
                <div
                    className="language-toggle"
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '80px',
                        zIndex: 'var(--z-tooltip)',
                        display: 'flex',
                        gap: '4px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '4px',
                        boxShadow: 'var(--shadow-lg)'
                    }}
                >
                    {['en', 'fr', 'ar'].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => changeLanguage(lang)}
                            className={`lang-btn ${i18n.language === lang ? 'active' : ''}`}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: i18n.language === lang ? 'var(--primary-600)' : 'transparent',
                                color: i18n.language === lang ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            {lang.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Main App Routes */}
                <main className="app-main">
                    <AppRoutes />
                </main>

                {/* Global Footer - Optional */}
                <footer
                    className="app-footer"
                    style={{
                        position: 'fixed',
                        bottom: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        zIndex: 'var(--z-dropdown)',
                        pointerEvents: 'none'
                    }}
                >
                    © 2024 WAN Solutions - Virtuello
                </footer>
            </Router>
        </div>
    );
}

export default App;