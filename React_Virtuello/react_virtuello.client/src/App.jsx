import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext'; // Import the AuthProvider
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

    // Show loading spinner while initializing
    if (isLoading) {
        return (
            <div className="app-loading" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}>
                <div>Loading Virtuello...</div>
            </div>
        );
    }

    return (
        <div className="App" data-theme={theme}>
            <Router>
                {/* Wrap everything with AuthProvider */}
                <AuthProvider>
                    {/* Theme Toggle - Floating Button */}
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle"
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            zIndex: 'var(--z-tooltip)',
                            padding: '8px',
                            border: 'none',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-lg)',
                            fontSize: '18px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--transition-fast)'
                        }}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
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
                </AuthProvider>
            </Router>
        </div>
    );
}

export default App;