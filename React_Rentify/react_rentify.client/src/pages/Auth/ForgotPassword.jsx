// src/pages/auth/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';

const ForgotPassword = () => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setError(t('auth.emailRequired'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // In a real application, this would call your auth service
            // await authService.resetPassword(email);

            // For demo purposes, simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setIsSubmitted(true);
            toast.success(t('auth.resetLinkSent'));
        } catch (error) {
            setError(error.message || t('auth.genericError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className={`max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
                <div className="text-center">
                    <img
                        className="mx-auto h-12 w-auto"
                        src="/logo.png"
                        alt="Rentify Logo"
                    />
                    <h2 className="mt-6 text-3xl font-extrabold">
                        {t('auth.resetPassword')}
                    </h2>
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isSubmitted
                            ? t('auth.checkYourEmail')
                            : t('auth.enterYourEmail')}
                    </p>
                </div>

                {/* Error alert */}
                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {!isSubmitted ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor="email"
                                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                {t('auth.email')}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                                    }`}
                                placeholder={t('auth.emailPlaceholder')}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    t('auth.sendResetLink')
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-6 space-y-6">
                        <div className={`p-4 rounded-md ${isDarkMode ? 'bg-green-900' : 'bg-green-50'}`}>
                            <div className="flex">
                                <div className={`flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-400'}`}>
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
                                        {t('auth.resetLinkSent')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setIsSubmitted(false);
                                setEmail('');
                            }}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                        >
                            {t('auth.tryAnotherEmail')}
                        </button>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('auth.rememberPassword')}
                        <Link
                            to="/login"
                            className="ml-1 font-medium text-primary-600 hover:text-primary-500"
                        >
                            {t('auth.login')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;