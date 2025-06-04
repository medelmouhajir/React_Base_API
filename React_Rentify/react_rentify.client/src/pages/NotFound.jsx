// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const { user } = useAuth();

    // Determine where to send the user based on authentication status
    const homePath = user ? '/dashboard' : '/';

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-md w-full text-center">
                <div className="text-primary-600">
                    <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                </div>

                <h1 className="mt-4 text-6xl font-extrabold tracking-tight">
                    404
                </h1>

                <p className="mt-4 text-xl font-medium">
                    {t('notFound.title')}
                </p>

                <p className={`mt-2 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('notFound.description')}
                </p>

                <div className="mt-8 flex justify-center space-x-4">
                    <Link
                        to={homePath}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {t('notFound.goHome')}
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className={`inline-flex items-center px-4 py-2 border text-base font-medium rounded-md shadow-sm ${isDarkMode
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {t('notFound.goBack')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;