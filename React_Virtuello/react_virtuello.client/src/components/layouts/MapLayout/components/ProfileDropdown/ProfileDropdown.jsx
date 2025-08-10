import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../../contexts/AuthContext';
import './ProfileDropdown.css';

const ProfileDropdown = ({ user, className = '' }) => {
    const { t, i18n } = useTranslation();
    const { logout, isAdmin, isManager } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const dropdownRef = useRef(null);

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
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
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = async () => {
        try {
            await logout();
            setIsOpen(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const changeLanguage = (language) => {
        i18n.changeLanguage(language);
        localStorage.setItem('virtuello-language', language);

        // Update document direction for RTL languages
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;

        setIsOpen(false);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('virtuello-theme', newTheme);

        setIsOpen(false);
    };

    // Generate user initials for avatar
    const getUserInitials = (user) => {
        if (!user?.fullName) return 'U';

        const names = user.fullName.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return user.fullName.substring(0, 2).toUpperCase();
    };

    // Generate role badge color
    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return 'var(--error)';
            case 'manager':
                return 'var(--warning)';
            case 'user':
            default:
                return 'var(--primary-600)';
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div
            className={`profile-dropdown ${className} ${isMobile ? 'profile-dropdown--mobile' : ''}`}
            ref={dropdownRef}
        >
            {/* Profile Button */}
            <button
                className={`profile-dropdown__trigger ${isOpen ? 'profile-dropdown__trigger--active' : ''}`}
                onClick={toggleDropdown}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label={t('profile.menu_aria_label', 'Open profile menu')}
            >
                {/* User Avatar */}
                <div className="profile-dropdown__avatar">
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.fullName || user.email}
                            className="profile-dropdown__avatar-image"
                        />
                    ) : (
                        <span className="profile-dropdown__avatar-initials">
                            {getUserInitials(user)}
                        </span>
                    )}

                    {/* Online status indicator */}
                    <div className="profile-dropdown__status-indicator" />
                </div>

                {/* User Info (Hidden on mobile) */}
                {!isMobile && (
                    <div className="profile-dropdown__user-info">
                        <div className="profile-dropdown__name">
                            {user.fullName || user.email}
                        </div>
                        <div className="profile-dropdown__role">
                            {t(`roles.${user.role?.toLowerCase()}`, user.role || 'User')}
                        </div>
                    </div>
                )}

                {/* Dropdown Arrow */}
                <svg
                    className="profile-dropdown__arrow"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`profile-dropdown__menu ${isMobile ? 'profile-dropdown__menu--mobile' : ''}`}>
                    {/* Mobile Header */}
                    {isMobile && (
                        <div className="profile-dropdown__mobile-header">
                            <div className="profile-dropdown__mobile-avatar">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.fullName || user.email}
                                        className="profile-dropdown__avatar-image"
                                    />
                                ) : (
                                    <span className="profile-dropdown__avatar-initials">
                                        {getUserInitials(user)}
                                    </span>
                                )}
                            </div>

                            <div className="profile-dropdown__mobile-info">
                                <div className="profile-dropdown__mobile-name">
                                    {user.fullName || user.email}
                                </div>
                                <div className="profile-dropdown__mobile-email">
                                    {user.email}
                                </div>
                                <div
                                    className="profile-dropdown__mobile-role"
                                    style={{ backgroundColor: getRoleColor(user.role) }}
                                >
                                    {t(`roles.${user.role?.toLowerCase()}`, user.role || 'User')}
                                </div>
                            </div>

                            <button
                                className="profile-dropdown__close-btn"
                                onClick={() => setIsOpen(false)}
                                aria-label={t('common.close', 'Close')}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Menu Items */}
                    <div className="profile-dropdown__menu-items">
                        {/* Profile Section */}
                        <div className="profile-dropdown__section">
                            <div className="profile-dropdown__section-header">
                                {t('profile.account', 'Account')}
                            </div>

                            <button className="profile-dropdown__item">
                                <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{t('profile.view_profile', 'View Profile')}</span>
                            </button>

                            <button className="profile-dropdown__item">
                                <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" fill="none" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                                <span>{t('profile.account_settings', 'Account Settings')}</span>
                            </button>

                            {(isAdmin() || isManager()) && (
                                <button className="profile-dropdown__item">
                                    <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>{t('profile.dashboard', 'Dashboard')}</span>
                                </button>
                            )}
                        </div>

                        {/* Preferences Section */}
                        <div className="profile-dropdown__section">
                            <div className="profile-dropdown__section-header">
                                {t('profile.preferences', 'Preferences')}
                            </div>

                            {/* Language Selector */}
                            <div className="profile-dropdown__item profile-dropdown__item--no-hover">
                                <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
                                </svg>
                                <span>{t('profile.language', 'Language')}</span>

                                <div className="profile-dropdown__language-buttons">
                                    {['en', 'fr', 'ar'].map((lang) => (
                                        <button
                                            key={lang}
                                            className={`profile-dropdown__lang-btn ${i18n.language === lang ? 'profile-dropdown__lang-btn--active' : ''}`}
                                            onClick={() => changeLanguage(lang)}
                                            aria-label={t(`languages.${lang}`, lang.toUpperCase())}
                                        >
                                            {lang.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Theme Toggle */}
                            <button className="profile-dropdown__item" onClick={toggleTheme}>
                                <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{t('profile.theme', 'Theme')}</span>
                                <span className="profile-dropdown__theme-indicator">
                                    {document.documentElement.getAttribute('data-theme') === 'dark' ? '🌙' : '☀️'}
                                </span>
                            </button>

                            {/* Notifications (Future feature) */}
                            <button className="profile-dropdown__item">
                                <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{t('profile.notifications', 'Notifications')}</span>
                            </button>
                        </div>

                        {/* Help & Support Section */}
                        <div className="profile-dropdown__section">
                            <div className="profile-dropdown__section-header">
                                {t('profile.help_support', 'Help & Support')}
                            </div>

                            <button className="profile-dropdown__item">
                                <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                                <span>{t('profile.help_center', 'Help Center')}</span>
                            </button>

                            <button className="profile-dropdown__item">
                                <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 9V5a3 3 0 0 0-6 0v4M3 9h18l-2 9H5l-2-9z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{t('profile.feedback', 'Send Feedback')}</span>
                            </button>
                        </div>

                        {/* Logout Section */}
                        <div className="profile-dropdown__section profile-dropdown__section--logout">
                            <button
                                className="profile-dropdown__item profile-dropdown__item--logout"
                                onClick={handleLogout}
                            >
                                <svg className="profile-dropdown__item-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{t('profile.logout', 'Logout')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer (Mobile only) */}
                    {isMobile && (
                        <div className="profile-dropdown__footer">
                            <div className="profile-dropdown__footer-text">
                                © 2024 WAN Solutions - Virtuello
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile Backdrop */}
            {isMobile && isOpen && (
                <div
                    className="profile-dropdown__backdrop"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default ProfileDropdown;