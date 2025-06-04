// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

const NotFound = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [isAnimating, setIsAnimating] = useState(true);

    // Determine where to send the user based on authentication status
    const homePath = user ? '/dashboard' : '/';

    // Animation effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-md w-full text-center">
                <div className={`text-primary-600 transition-all duration-1000 ${isAnimating ? 'transform scale-110' : ''}`}>
                    <svg className={`w-32 h-32 mx-auto transition-transform duration-700 ${isAnimating ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                </div>

                <div className={`transition-all duration-700 ${isAnimating ? 'opacity-0 transform translate-y-10' : 'opacity-100 transform translate-y-0'}`}>
                    <h1 className="mt-8 text-8xl font-extrabold tracking-tight text-primary-600">
                        404
                    </h1>

                    <p className="mt-6 text-2xl font-bold">
                        {t('notFound.title')}
                    </p>

                    <p className={`mt-3 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('notFound.description')}
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link
                            to={homePath}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                            {t('notFound.goHome')}
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className={`inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md shadow-sm transition-colors ${isDarkMode
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                            {t('notFound.goBack')}
                        </button>
                    </div>
                </div>

                {/* Hidden easter egg that appears on hover */}
                <div className={`mt-16 opacity-30 hover:opacity-100 transition-opacity text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <p className="italic">"{t('notFound.easterEgg')}"</p>
                </div>
            </div>
        </div>
    );
};

export default NotFound;