// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Loading from './Loading/Loading';

const ProtectedRoute = ({
    children,
    requiredRole = null,
    requiredRoles = [],
    fallback = null
}) => {
    const { user, loading } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const location = useLocation();

    const [showAccessDenied, setShowAccessDenied] = useState(false);

    // Set a delay for showing access denied message
    // This prevents flashing the message before redirect on role check
    useEffect(() => {
        if (!loading && user) {
            if (
                (requiredRole && user.role !== requiredRole) ||
                (requiredRoles.length > 0 && !requiredRoles.includes(user.role))
            ) {
                const timer = setTimeout(() => {
                    setShowAccessDenied(true);
                }, 500);

                return () => clearTimeout(timer);
            }
        }
    }, [loading, user, requiredRole, requiredRoles]);

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className="text-center">
                    <Loading type="pulse" />
                    <p className="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">
                        {t('auth.verifyingAccess')}
                    </p>
                </div>
            </div>
        );
    }

    // If user is not authenticated, redirect to login
    if (!user) {
        return fallback || <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role requirements
    if (requiredRole && user.role !== requiredRole) {
        if (showAccessDenied) {
            return (
                <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <div className="max-w-lg w-full mx-4 p-8 rounded-lg shadow-lg text-center bg-white dark:bg-gray-800">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300 mb-6">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{t('auth.accessDenied')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t('auth.insufficientPermissions')}
                        </p>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t('auth.requiredRole')}: <span className="font-medium">{requiredRole}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {t('auth.yourRole')}: <span className="font-medium">{user.role}</span>
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                                </svg>
                                {t('common.goBack')}
                            </button>
                            <a
                                href="/dashboard"
                                className={`inline-flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                                {t('navigation.dashboard')}
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        // Shows loading first until we're sure access is denied
        return (
            <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <Loading type="dots" />
            </div>
        );
    }

    // Check multiple roles requirement
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        if (showAccessDenied) {
            return (
                <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <div className="max-w-lg w-full mx-4 p-8 rounded-lg shadow-lg text-center bg-white dark:bg-gray-800">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300 mb-6">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{t('auth.accessDenied')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t('auth.insufficientPermissions')}
                        </p>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {t('auth.requiredRoles')}: <span className="font-medium">{requiredRoles.join(', ')}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {t('auth.yourRole')}: <span className="font-medium">{user.role}</span>
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                                </svg>
                                {t('common.goBack')}
                            </button>
                            <a
                                href="/dashboard"
                                className={`inline-flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                                {t('navigation.dashboard')}
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        // Shows loading first until we're sure access is denied
        return (
            <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <Loading type="dots" />
            </div>
        );
    }

    // User is authenticated and has required permissions
    return children;
};

// Role-specific components for convenience
export const AdminRoute = ({ children, fallback }) => (
    <ProtectedRoute requiredRole="Admin" fallback={fallback}>
        {children}
    </ProtectedRoute>
);

export const ManagerRoute = ({ children, fallback }) => (
    <ProtectedRoute requiredRoles={['Owner', 'Manager']} fallback={fallback}>
        {children}
    </ProtectedRoute>
);

export const OwnerRoute = ({ children, fallback }) => (
    <ProtectedRoute requiredRole="Owner" fallback={fallback}>
        {children}
    </ProtectedRoute>
);

export const CustomerRoute = ({ children, fallback }) => (
    <ProtectedRoute requiredRole="Customer" fallback={fallback}>
        {children}
    </ProtectedRoute>
);

export const StaffRoute = ({ children, fallback }) => (
    <ProtectedRoute requiredRoles={['Admin', 'Owner', 'Manager']} fallback={fallback}>
        {children}
    </ProtectedRoute>
);

export default ProtectedRoute;