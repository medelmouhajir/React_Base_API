import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import './Navbar.css';

const Navbar = ({
    user,
    onMenuToggle,
    showMenuButton = true,
    isMobile = false,
    pageTitle = '',
    breadcrumbs = [],
    className = ''
}) => {
    const { t, i18n } = useTranslation();
    const { logout, isAdmin, isManager } = useAuth();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const profileRef = useRef(null);
    const notificationsRef = useRef(null);
    const languageRef = useRef(null);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (languageRef.current && !languageRef.current.contains(event.target)) {
                setShowLanguageMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            setShowProfileDropdown(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const changeLanguage = (language) => {
        i18n.changeLanguage(language);
        localStorage.setItem('virtuello-language', language);
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
        setShowLanguageMenu(false);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('virtuello-theme', newTheme);
    };

    const getBreadcrumbPath = () => {
        if (!breadcrumbs || breadcrumbs.length === 0) return null;

        return breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path || index}>
                {index > 0 && <span className="navbar__breadcrumb-separator">/</span>}
                {crumb.path ? (
                    <a href={crumb.path} className="navbar__breadcrumb-link">
                        {crumb.label}
                    </a>
                ) : (
                    <span className="navbar__breadcrumb-current">{crumb.label}</span>
                )}
            </React.Fragment>
        ));
    };

    const getNotificationCount = () => {
        // Mock notification count - replace with real data
        return 3;
    };

    const getUserInitials = () => {
        if (!user?.fullName) return 'U';
        return user.fullName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getUserRole = () => {
        if (!user?.role) return '';
        return t(`roles.${user.role.toLowerCase()}`);
    };

    return (
        <nav className={`navbar ${isMobile ? 'navbar--mobile' : 'navbar--desktop'} ${className}`}>
            <div className="navbar__container">
                {/* Left Section */}
                <div className="navbar__left">
                    {/* Menu Button */}
                    {showMenuButton && (
                        <button
                            className="navbar__menu-btn"
                            onClick={onMenuToggle}
                            aria-label={t('navbar.toggle_menu')}
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                            </svg>
                        </button>
                    )}

                    {/* Logo */}
                    <div className="navbar__logo">
                        <a href="/" className="navbar__logo-link">
                            <img
                                src="/logo.svg"
                                alt={t('app.name')}
                                className="navbar__logo-image"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'inline';
                                }}
                            />
                            <span className="navbar__logo-text">{t('app.name')}</span>
                        </a>
                    </div>

                    {/* Page Title & Breadcrumbs */}
                    {!isMobile && (
                        <div className="navbar__title-section">
                            {pageTitle && (
                                <h1 className="navbar__page-title">{pageTitle}</h1>
                            )}
                            {breadcrumbs.length > 0 && (
                                <nav className="navbar__breadcrumbs" aria-label={t('navbar.breadcrumbs')}>
                                    {getBreadcrumbPath()}
                                </nav>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Section */}
                <div className="navbar__right">
                    {/* Search (Desktop only) */}
                    {!isMobile && (
                        <div className="navbar__search">
                            <div className="navbar__search-input">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="navbar__search-icon">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={t('navbar.search_placeholder')}
                                    className="navbar__search-field"
                                />
                            </div>
                        </div>
                    )}

                    {/* Language Selector */}
                    <div className="navbar__language" ref={languageRef}>
                        <button
                            className="navbar__language-btn"
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            aria-label={t('navbar.change_language')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
                            </svg>
                            <span className="navbar__language-current">{i18n.language.toUpperCase()}</span>
                        </button>

                        {showLanguageMenu && (
                            <div className="navbar__language-dropdown">
                                <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>
                                    English
                                </button>
                                <button onClick={() => changeLanguage('fr')} className={i18n.language === 'fr' ? 'active' : ''}>
                                    Français
                                </button>
                                <button onClick={() => changeLanguage('ar')} className={i18n.language === 'ar' ? 'active' : ''}>
                                    العربية
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Theme Toggle */}
                    <button
                        className="navbar__theme-btn"
                        onClick={toggleTheme}
                        aria-label={t('navbar.toggle_theme')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="navbar__theme-icon-light">
                            <path d="M12 2.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0V3a.5.5 0 01.5-.5zM7.5 6.5a.5.5 0 000 1h1a.5.5 0 000-1h-1zm8 0a.5.5 0 000 1h1a.5.5 0 000-1h-1zM12 7a5 5 0 100 10 5 5 0 000-10z" />
                        </svg>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="navbar__theme-icon-dark">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg>
                    </button>

                    {/* Notifications */}
                    <div className="navbar__notifications" ref={notificationsRef}>
                        <button
                            className="navbar__notifications-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                            aria-label={t('navbar.notifications')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                            </svg>
                            {getNotificationCount() > 0 && (
                                <span className="navbar__notifications-badge">{getNotificationCount()}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="navbar__notifications-dropdown">
                                <div className="navbar__notifications-header">
                                    <h3>{t('navbar.notifications')}</h3>
                                    <button className="navbar__notifications-mark-read">
                                        {t('navbar.mark_all_read')}
                                    </button>
                                </div>
                                <div className="navbar__notifications-list">
                                    {/* Mock notifications - replace with real data */}
                                    <div className="navbar__notification-item">
                                        <div className="navbar__notification-content">
                                            <p>{t('notifications.new_event_created')}</p>
                                            <span className="navbar__notification-time">5 min ago</span>
                                        </div>
                                    </div>
                                    <div className="navbar__notification-item">
                                        <div className="navbar__notification-content">
                                            <p>{t('notifications.user_registered')}</p>
                                            <span className="navbar__notification-time">1 hour ago</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="navbar__profile" ref={profileRef}>
                        <button
                            className="navbar__profile-btn"
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            aria-label={t('navbar.profile_menu')}
                        >
                            <div className="navbar__profile-avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.fullName} />
                                ) : (
                                    <span>{getUserInitials()}</span>
                                )}
                            </div>
                            {!isMobile && (
                                <div className="navbar__profile-info">
                                    <span className="navbar__profile-name">{user?.fullName || t('navbar.guest')}</span>
                                    <span className="navbar__profile-role">{getUserRole()}</span>
                                </div>
                            )}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="navbar__profile-arrow">
                                <path d="M7 10l5 5 5-5z" />
                            </svg>
                        </button>

                        {showProfileDropdown && (
                            <div className="navbar__profile-dropdown">
                                <div className="navbar__profile-dropdown-header">
                                    <div className="navbar__profile-dropdown-avatar">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.fullName} />
                                        ) : (
                                            <span>{getUserInitials()}</span>
                                        )}
                                    </div>
                                    <div className="navbar__profile-dropdown-info">
                                        <span className="navbar__profile-dropdown-name">{user?.fullName}</span>
                                        <span className="navbar__profile-dropdown-email">{user?.email}</span>
                                        <span className="navbar__profile-dropdown-role">{getUserRole()}</span>
                                    </div>
                                </div>

                                <div className="navbar__profile-dropdown-menu">
                                    <a href="/profile" className="navbar__profile-dropdown-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        </svg>
                                        {t('navbar.profile')}
                                    </a>

                                    <a href="/settings" className="navbar__profile-dropdown-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                                        </svg>
                                        {t('navbar.settings')}
                                    </a>

                                    {(isAdmin || isManager) && (
                                        <a href="/admin" className="navbar__profile-dropdown-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12,1L21,5V11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1M12,7C10.9,7 10,7.9 10,9C10,10.1 10.9,11 12,11C13.1,11 14,10.1 14,9C14,7.9 13.1,7 12,7M17,20C17,16.69 14.31,14 11,14H13C16.31,14 17,16.69 17,20Z" />
                                            </svg>
                                            {isAdmin ? t('navbar.admin_panel') : t('navbar.manager_panel')}
                                        </a>
                                    )}

                                    <hr className="navbar__profile-dropdown-divider" />

                                    <button
                                        onClick={handleLogout}
                                        className="navbar__profile-dropdown-item navbar__profile-dropdown-item--logout"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                                        </svg>
                                        {t('navbar.logout')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;