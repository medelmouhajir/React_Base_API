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


                    {/* Main App Routes */}
                    <main className="app-main">
                        <AppRoutes />
                    </main>

                </AuthProvider>
            </Router>
        </div>
    );
}

export default App;