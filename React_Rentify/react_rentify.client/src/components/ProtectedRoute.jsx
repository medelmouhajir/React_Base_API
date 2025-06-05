// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Loading from './Loading/Loading';
import './ProtectedRoute.css';

const ProtectedRoute = ({
    children,
    requiredRole = null,
    requiredRoles = [],
    fallback = null,
}) => {
    const { user, loading } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const location = useLocation();

    const [showAccessDenied, setShowAccessDenied] = useState(false);

    // Delay showing access denied until role check completes
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
            <div className={`pr-loading-wrapper ${isDarkMode ? 'dark' : ''}`}>
                <div className="pr-loading-content">
                    <Loading type="pulse" />
                    <p className="pr-verifying-text">
                        {t('auth.verifyingAccess')}
                    </p>
                </div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!user) {
        return fallback || <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Single-role check
    if (requiredRole && user.role !== requiredRole) {
        if (showAccessDenied) {
            return (
                <div className={`pr-denied-wrapper ${isDarkMode ? 'dark' : ''}`}>
                    <div className="pr-card">
                        <div className="pr-icon-circle">
                            <svg className="pr-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    fillRule="evenodd"
                                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <h2 className="pr-heading">{t('auth.accessDenied')}</h2>
                        <p className="pr-message">
                            {t('auth.insufficientPermissions')}
                        </p>
                        <div className="pr-info">
                            <p className="pr-info-line">
                                {t('auth.requiredRole')}: <span className="pr-info-value">{requiredRole}</span>
                            </p>
                            <p className="pr-info-line">
                                {t('auth.yourRole')}: <span className="pr-info-value">{user.role}</span>
                            </p>
                        </div>
                        <div className="pr-actions">
                            <button
                                onClick={() => window.history.back()}
                                className="pr-btn-primary"
                            >
                                <svg className="pr-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                {t('common.goBack')}
                            </button>
                            <a
                                href="/dashboard"
                                className={`pr-btn-secondary ${isDarkMode ? 'dark' : ''}`}
                            >
                                <svg className="pr-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {t('navigation.dashboard')}
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        // Show loading until we decide to show denied
        return (
            <div className={`pr-loading-wrapper ${isDarkMode ? 'dark' : ''}`}>
                <Loading type="dots" />
            </div>
        );
    }

    // Multi-role check
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        if (showAccessDenied) {
            return (
                <div className={`pr-denied-wrapper ${isDarkMode ? 'dark' : ''}`}>
                    <div className="pr-card">
                        <div className="pr-icon-circle">
                            <svg className="pr-icon" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    fillRule="evenodd"
                                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <h2 className="pr-heading">{t('auth.accessDenied')}</h2>
                        <p className="pr-message">
                            {t('auth.insufficientPermissions')}
                        </p>
                        <div className="pr-info">
                            <p className="pr-info-line">
                                {t('auth.requiredRoles')}: <span className="pr-info-value">{requiredRoles.join(', ')}</span>
                            </p>
                            <p className="pr-info-line">
                                {t('auth.yourRole')}: <span className="pr-info-value">{user.role}</span>
                            </p>
                        </div>
                        <div className="pr-actions">
                            <button
                                onClick={() => window.history.back()}
                                className="pr-btn-primary"
                            >
                                <svg className="pr-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                {t('common.goBack')}
                            </button>
                            <a
                                href="/dashboard"
                                className={`pr-btn-secondary ${isDarkMode ? 'dark' : ''}`}
                            >
                                <svg className="pr-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {t('navigation.dashboard')}
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        // Show loading until we decide to show denied
        return (
            <div className={`pr-loading-wrapper ${isDarkMode ? 'dark' : ''}`}>
                <Loading type="dots" />
            </div>
        );
    }

    // Authorized
    return children;
};

// Role-specific components
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
