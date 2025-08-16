import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../contexts/AuthContext';
import './ProfileDropdown.css';

const ProfileDropdown = ({ user, className = '' }) => {
    const { t, i18n } = useTranslation();
    const { logout, isAdmin, isManager } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('virtuello-theme', newTheme);
    };

    const getCurrentTheme = () => {
        return document.documentElement.getAttribute('data-theme') || 'light';
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleColor = (role) => {
        const colors = {
            admin: '#ea4335',
            manager: '#fbbc04',
            user: '#34a853',
            premium: '#1a73e8'
        };
        return colors[role?.toLowerCase()] || colors.user;
    };

    const menuItems = [
        {
            id: 'profile',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            ),
            label: t('profile.view_profile'),
            onClick: () => {
                // Handle profile navigation
                setIsOpen(false);
            }
        },
        {
            id: 'settings',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
                </svg>
            ),
            label: t('profile.settings'),
            onClick: () => {
                // Handle settings navigation
                setIsOpen(false);
            }
        },
        {
            id: 'help',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C7.59,4 4,12A10,10 0 0,0 12,2Z" />
                </svg>
            ),
            label: t('profile.help_support'),
            onClick: () => {
                navigate('/myspace');
                // Handle help navigation
                setIsOpen(false);
            }
        }
    ];

    // Add admin/manager specific items
    if (isAdmin || isManager) {
        menuItems.splice(2, 0, {
            id: 'admin',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,1L21,5V11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1M12,7C10.9,7 10,7.9 10,9C10,10.1 10.9,11 12,11C13.1,11 14,10.1 14,9C14,7.9 13.1,7 12,7M17,20C17,16.69 14.31,14 11,14H13C16.31,14 17,16.69 17,20Z" />
                </svg>
            ),
            label: isAdmin ? t('profile.admin_panel') : t('profile.manager_panel'),
            onClick: () => {
                // Handle admin/manager navigation
                setIsOpen(false);
            }
        });
    }

    if (!user) {
        return null;
    }

    return (
        <div ref={dropdownRef} className={`gm-profile-dropdown ${className}`}>
            {/* Trigger Button */}
            <button
                className={`gm-profile-dropdown__trigger ${isOpen ? 'gm-profile-dropdown__trigger--active' : ''}`}
                onClick={toggleDropdown}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label={t('profile.open_menu')}
            >
                {/* Avatar */}
                <div className="gm-profile-dropdown__avatar">
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name || user.email}
                            className="gm-profile-dropdown__avatar-image"
                        />
                    ) : (
                        <div className="gm-profile-dropdown__avatar-initials">
                            {getInitials(user.name || user.email)}
                        </div>
                    )}
                    {user.isOnline && (
                        <div className="gm-profile-dropdown__status-indicator" />
                    )}
                </div>

                {/* User Info (Desktop Only) */}
                {!isMobile && (
                    <div className="gm-profile-dropdown__user-info">
                        <div className="gm-profile-dropdown__name">
                            {user.name || user.email?.split('@')[0] || t('profile.anonymous')}
                        </div>
                        {user.role && (
                            <div
                                className="gm-profile-dropdown__role"
                                style={{ color: getRoleColor(user.role) }}
                            >
                                {t(`roles.${user.role.toLowerCase()}`)}
                            </div>
                        )}
                    </div>
                )}

                {/* Dropdown Arrow */}
                <div className="gm-profile-dropdown__arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 10l5 5 5-5z" />
                    </svg>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    {isMobile && (
                        <div
                            className="gm-profile-dropdown__backdrop"
                            onClick={() => setIsOpen(false)}
                        />
                    )}

                    <div className={`gm-profile-dropdown__menu ${isMobile ? 'gm-profile-dropdown__menu--mobile' : ''}`}>
                        {/* Mobile Header */}
                        {isMobile && (
                            <div className="gm-profile-dropdown__mobile-header">
                                <div className="gm-profile-dropdown__mobile-avatar">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name || user.email}
                                            className="gm-profile-dropdown__avatar-image"
                                        />
                                    ) : (
                                        <div className="gm-profile-dropdown__avatar-initials">
                                            {getInitials(user.name || user.email)}
                                        </div>
                                    )}
                                </div>
                                <div className="gm-profile-dropdown__mobile-info">
                                    <div className="gm-profile-dropdown__mobile-name">
                                        {user.name || user.email?.split('@')[0] || t('profile.anonymous')}
                                    </div>
                                    <div className="gm-profile-dropdown__mobile-email">
                                        {user.email}
                                    </div>
                                    {user.role && (
                                        <div
                                            className="gm-profile-dropdown__mobile-role"
                                            style={{ backgroundColor: getRoleColor(user.role) }}
                                        >
                                            {t(`roles.${user.role.toLowerCase()}`)}
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="gm-profile-dropdown__close-btn"
                                    onClick={() => setIsOpen(false)}
                                    aria-label={t('common.close')}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Menu Items */}
                        <div className="gm-profile-dropdown__menu-items">
                            {/* Main Navigation */}
                            <div className="gm-profile-dropdown__section">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        className="gm-profile-dropdown__item"
                                        onClick={item.onClick}
                                    >
                                        <div className="gm-profile-dropdown__item-icon">
                                            {item.icon}
                                        </div>
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {/* Theme & Language */}
                            <div className="gm-profile-dropdown__section">
                                <div className="gm-profile-dropdown__section-header">
                                    {t('profile.preferences')}
                                </div>

                                {/* Theme Toggle */}
                                <button
                                    className="gm-profile-dropdown__item"
                                    onClick={toggleTheme}
                                >
                                    <div className="gm-profile-dropdown__item-icon">
                                        {getCurrentTheme() === 'light' ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,15.31L23.31,12L20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31Z" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z" />
                                            </svg>
                                        )}
                                    </div>
                                    {getCurrentTheme() === 'light' ? t('theme.dark_mode') : t('theme.light_mode')}
                                    <div className="gm-profile-dropdown__theme-indicator">
                                        {getCurrentTheme() === 'light' ? '🌙' : '☀️'}
                                    </div>
                                </button>

                                {/* Language Selector */}
                                <div className="gm-profile-dropdown__item gm-profile-dropdown__item--no-hover">
                                    <div className="gm-profile-dropdown__item-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12.87,15.07L11.54,13.74L8.38,16.9L9.71,18.23L12.87,15.07M12,2C17.52,2 22,6.48 22,12C22,17.52 17.52,22 12,22C6.48,22 2,17.52 2,12C2,6.48 6.48,2 12,2M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M16.18,7.76L15.06,8.88L14.82,8.64L13.7,9.76L14.82,10.88L16.18,9.52L17.3,10.64L18.42,9.52L16.18,7.76M7.82,12.24L9.18,10.88L10.3,12L9.18,13.12L7.82,12.24M12,8.5L13.5,10L12,11.5L10.5,10L12,8.5Z" />
                                        </svg>
                                    </div>
                                    {t('profile.language')}
                                    <div className="gm-profile-dropdown__language-buttons">
                                        <button
                                            className={`gm-profile-dropdown__lang-btn ${i18n.language === 'en' ? 'gm-profile-dropdown__lang-btn--active' : ''}`}
                                            onClick={() => changeLanguage('en')}
                                        >
                                            EN
                                        </button>
                                        <button
                                            className={`gm-profile-dropdown__lang-btn ${i18n.language === 'fr' ? 'gm-profile-dropdown__lang-btn--active' : ''}`}
                                            onClick={() => changeLanguage('fr')}
                                        >
                                            FR
                                        </button>
                                        <button
                                            className={`gm-profile-dropdown__lang-btn ${i18n.language === 'ar' ? 'gm-profile-dropdown__lang-btn--active' : ''}`}
                                            onClick={() => changeLanguage('ar')}
                                        >
                                            AR
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Logout */}
                            <div className="gm-profile-dropdown__section">
                                <button
                                    className="gm-profile-dropdown__item gm-profile-dropdown__item--logout"
                                    onClick={handleLogout}
                                >
                                    <div className="gm-profile-dropdown__item-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z" />
                                        </svg>
                                    </div>
                                    {t('auth.logout')}
                                </button>
                            </div>
                        </div>

                        {/* Footer (Mobile Only) */}
                        {isMobile && (
                            <div className="gm-profile-dropdown__footer">
                                <div className="gm-profile-dropdown__footer-text">
                                    Virtuello v1.0.0
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfileDropdown;