// =============================================================================
// FLOATING PROFILE COMPONENT - User profile dropdown with modern design
// =============================================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './FloatingProfile.css';

const FloatingProfile = ({
    position = 'top-right', // 'top-left', 'top-right'
    className = '',
    showNotifications = true,
    showSettings = true,
    showThemeToggle = true,
    onNotificationClick = () => { },
    onSettingsClick = () => { },
    onThemeToggle = () => { },
    theme = 'light' // 'light', 'dark'
}) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    // Mock notifications - replace with real data
    useEffect(() => {
        // This would be replaced with actual notification fetching
        const mockNotifications = [
            {
                id: 1,
                type: 'event',
                title: 'New Event Near You',
                message: 'Jazz Night at Blue Note Cafe starts in 2 hours',
                time: new Date(Date.now() - 30 * 60 * 1000),
                read: false,
                icon: '🎵'
            },
            {
                id: 2,
                type: 'business',
                title: 'Business Update',
                message: 'Favorite restaurant updated their menu',
                time: new Date(Date.now() - 2 * 60 * 60 * 1000),
                read: false,
                icon: '🍽️'
            },
            {
                id: 3,
                type: 'system',
                title: 'Profile Updated',
                message: 'Your profile information has been updated successfully',
                time: new Date(Date.now() - 24 * 60 * 60 * 1000),
                read: true,
                icon: '✅'
            }
        ];

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
    }, []);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    // Toggle dropdown
    const toggleDropdown = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            await logout();
            setIsOpen(false);
            navigate('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [logout, navigate]);

    // Handle navigation
    const handleNavigation = useCallback((path) => {
        navigate(path);
        setIsOpen(false);
    }, [navigate]);

    // Handle notification click
    const handleNotificationClick = useCallback((notification) => {
        // Mark as read
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        onNotificationClick(notification);
        setIsOpen(false);
    }, [onNotificationClick]);

    // Format time
    const formatTime = useCallback((date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t('time.justNow', 'Just now');
        if (minutes < 60) return t('time.minutesAgo', `${minutes}m ago`);
        if (hours < 24) return t('time.hoursAgo', `${hours}h ago`);
        return t('time.daysAgo', `${days}d ago`);
    }, [t]);

    // Get user initials
    const getUserInitials = useCallback(() => {
        if (!user?.fullName) return '?';
        return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }, [user?.fullName]);

    // If not authenticated, show login button
    if (!user) {
        return (
            <div className={`floating-profile ${className} floating-profile--${position}`}>
                <button
                    className="floating-profile__login-btn"
                    onClick={() => navigate('/auth/login')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M21 12H9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span>{t('auth.login', 'Login')}</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`floating-profile ${className} floating-profile--${position}`}>
            {/* Profile button */}
            <button
                ref={buttonRef}
                className={`floating-profile__button ${isOpen ? 'floating-profile__button--active' : ''}`}
                onClick={toggleDropdown}
                aria-label={t('profile.openMenu', 'Open profile menu')}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {/* User avatar */}
                <div className="floating-profile__avatar">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.fullName || t('profile.user', 'User')}
                            className="floating-profile__avatar-image"
                        />
                    ) : (
                        <div className="floating-profile__avatar-initials">
                            {getUserInitials()}
                        </div>
                    )}
                </div>

                {/* Notification badge */}
                {showNotifications && unreadCount > 0 && (
                    <div className="floating-profile__badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}

                {/* Dropdown arrow */}
                <div className={`floating-profile__arrow ${isOpen ? 'floating-profile__arrow--open' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div ref={dropdownRef} className="floating-profile__dropdown">
                    {/* User info section */}
                    <div className="floating-profile__user-info">
                        <div className="floating-profile__user-avatar">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.fullName || t('profile.user', 'User')}
                                    className="floating-profile__user-avatar-image"
                                />
                            ) : (
                                <div className="floating-profile__user-avatar-initials">
                                    {getUserInitials()}
                                </div>
                            )}
                        </div>
                        <div className="floating-profile__user-details">
                            <div className="floating-profile__user-name">
                                {user?.fullName || t('profile.user', 'User')}
                            </div>
                            <div className="floating-profile__user-email">
                                {user?.email}
                            </div>
                        </div>
                    </div>

                    {/* Menu items */}
                    <div className="floating-profile__menu">
                        {/* Profile link */}
                        <button
                            className="floating-profile__menu-item"
                            onClick={() => handleNavigation('/profile')}
                        >
                            <div className="floating-profile__menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <span>{t('profile.viewProfile', 'View Profile')}</span>
                        </button>

                        {/* Favorites */}
                        <button
                            className="floating-profile__menu-item"
                            onClick={() => handleNavigation('/favorites')}
                        >
                            <div className="floating-profile__menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <span>{t('profile.favorites', 'Favorites')}</span>
                        </button>

                        {/* My Businesses */}
                        <button
                            className="floating-profile__menu-item"
                            onClick={() => handleNavigation('/my-businesses')}
                        >
                            <div className="floating-profile__menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <span>{t('profile.myBusinesses', 'My Businesses')}</span>
                        </button>

                        {/* My Events */}
                        <button
                            className="floating-profile__menu-item"
                            onClick={() => handleNavigation('/my-events')}
                        >
                            <div className="floating-profile__menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </div>
                            <span>{t('profile.myEvents', 'My Events')}</span>
                        </button>

                        {/* Divider */}
                        <div className="floating-profile__menu-divider"></div>

                        {/* Notifications */}
                        {showNotifications && (
                            <div className="floating-profile__notifications">
                                <div className="floating-profile__notifications-header">
                                    <span>{t('profile.notifications', 'Notifications')}</span>
                                    {unreadCount > 0 && (
                                        <span className="floating-profile__notifications-count">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="floating-profile__notifications-list">
                                    {notifications.slice(0, 3).map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`floating-profile__notification ${!notification.read ? 'floating-profile__notification--unread' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="floating-profile__notification-icon">
                                                {notification.icon}
                                            </div>
                                            <div className="floating-profile__notification-content">
                                                <div className="floating-profile__notification-title">
                                                    {notification.title}
                                                </div>
                                                <div className="floating-profile__notification-message">
                                                    {notification.message}
                                                </div>
                                                <div className="floating-profile__notification-time">
                                                    {formatTime(notification.time)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {notifications.length > 3 && (
                                        <button
                                            className="floating-profile__view-all-notifications"
                                            onClick={() => handleNavigation('/notifications')}
                                        >
                                            {t('profile.viewAllNotifications', 'View all notifications')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="floating-profile__menu-divider"></div>

                        {/* Settings */}
                        {showSettings && (
                            <button
                                className="floating-profile__menu-item"
                                onClick={() => {
                                    onSettingsClick();
                                    handleNavigation('/settings');
                                }}
                            >
                                <div className="floating-profile__menu-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                        <path
                                            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
                                <span>{t('profile.settings', 'Settings')}</span>
                            </button>
                        )}

                        {/* Theme toggle */}
                        {showThemeToggle && (
                            <button
                                className="floating-profile__menu-item"
                                onClick={() => {
                                    onThemeToggle();
                                    setIsOpen(false);
                                }}
                            >
                                <div className="floating-profile__menu-icon">
                                    {theme === 'light' ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                                            <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
                                            <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" />
                                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" />
                                            <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" />
                                            <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" />
                                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" />
                                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <span>
                                    {theme === 'light'
                                        ? t('profile.darkMode', 'Dark Mode')
                                        : t('profile.lightMode', 'Light Mode')
                                    }
                                </span>
                            </button>
                        )}

                        {/* Divider */}
                        <div className="floating-profile__menu-divider"></div>

                        {/* Logout */}
                        <button
                            className="floating-profile__menu-item floating-profile__menu-item--danger"
                            onClick={handleLogout}
                        >
                            <div className="floating-profile__menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <span>{t('auth.logout', 'Logout')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingProfile;