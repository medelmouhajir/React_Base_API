// src/components/Layout/Sidebar/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({
    isOpen = false,
    isMobileOpen = false,
    onClose,
    onToggle
}) => {
    const { t } = useTranslation();
    const [activeMenu, setActiveMenu] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    // Set active menu based on current path
    useEffect(() => {
        const path = window.location.pathname;
        if (path.includes('/series')) {
            setActiveMenu('series');
        } else if (path.includes('/myseries')) {
            setActiveMenu('myseries');
        } else if (path.includes('/search')) {
            setActiveMenu('search');
        } else if (path.includes('/create-serie')) {
            setActiveMenu('create-serie');
        } else if (path.includes('/favorites')) {
            setActiveMenu('favorites');
        }
    }, []);

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && (isOpen || isMobileOpen)) {
                if (onClose) onClose();
                if (onToggle && !isMobileOpen) onToggle();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, isMobileOpen, onClose, onToggle]);

    // Close mobile sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isMobileOpen && !e.target.closest('.sidebar')) {
                if (onClose) onClose();
            }
        };

        if (isMobileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isMobileOpen, onClose]);

    // Navigation menu items
    const menuItems = [
        {
            id: 'series',
            title: t('sidebar.series'),
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
            ),
            href: '/series',
        },
        {
            id: 'myseries',
            title: t('sidebar.mySeries'),
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            ),
            href: '/myseries',
        },
        {
            id: 'search',
            title: t('sidebar.search'),
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            ),
            href: '/search',
        },
        {
            id: 'create-serie',
            title: t('sidebar.createSerie'),
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            ),
            href: '/series/create',
            badge: { text: 'New', type: 'info' }
        },
        {
            id: 'favorites',
            title: t('sidebar.favorites'),
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            ),
            href: '/favorites',
        },
    ];

    // Handle navigation
    const handleNavigation = (href) => {
        if (href) {
            navigate(href);

            // Close mobile sidebar after navigation
            if (isMobileOpen && onClose) {
                onClose();
            }
        }
    };

    // Render badge if present
    const renderBadge = (badge) => {
        if (!badge) return null;
        return (
            <span className={`sidebar__badge sidebar__badge--${badge.type || 'default'}`}>
                {badge.text}
            </span>
        );
    };

    // Define CSS classes for the sidebar
    const sidebarClasses = [
        'sidebar',
        isOpen ? 'sidebar--open' : 'sidebar--closed',
        isMobileOpen ? 'sidebar--mobile-open' : ''
    ].filter(Boolean).join(' ');

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="sidebar__overlay"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside className={sidebarClasses} role="navigation" aria-label="Main navigation">
                {/* Sidebar Header */}
                <div className="sidebar__header">
                    <div className="sidebar__brand">
                        <div className="sidebar__logo">
                            <svg viewBox="0 0 24 24" className="sidebar__logo-icon" aria-hidden="true">
                                <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>

                        <div className={`sidebar__brand-text ${!isOpen ? 'sidebar__brand-text--hidden' : ''}`}>
                            <h2 className="sidebar__title">Mangati</h2>
                            <span className="sidebar__subtitle">{t('sidebar.subtitle')}</span>
                        </div>
                    </div>

                    {/* Close button for mobile */}
                    {isMobileOpen && (
                        <button
                            className="sidebar__close-btn"
                            onClick={onClose}
                            aria-label={t('sidebar.close')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="sidebar__nav">
                    <div className="sidebar__nav-section">
                        {isOpen && (
                            <div className="sidebar__section-title">
                                <span>{t('sidebar.mainNavigation')}</span>
                            </div>
                        )}

                        <ul className="sidebar__menu" role="menubar">
                            {menuItems.map((item) => (
                                <li key={item.id} className="sidebar__menu-item" role="none">
                                    <button
                                        className={`sidebar__menu-button ${activeMenu === item.id ? 'sidebar__menu-button--active' : ''}`}
                                        onClick={() => handleNavigation(item.href)}
                                        title={!isOpen ? item.title : ''}
                                        role="menuitem"
                                    >
                                        <span className="sidebar__menu-icon" aria-hidden="true">
                                            {item.icon}
                                        </span>

                                        <span className={`sidebar__menu-label ${!isOpen && !isMobileOpen ? 'sidebar__menu-label--hidden' : ''}`}>
                                            {item.title}
                                        </span>

                                        <div className={`sidebar__menu-meta ${!isOpen && !isMobileOpen ? 'sidebar__menu-meta--hidden' : ''}`}>
                                            {item.badge && renderBadge(item.badge)}
                                        </div>
                                    </button>

                                    {/* Tooltip for collapsed state */}
                                    {!isOpen && !isMobileOpen && (
                                        <div className="sidebar__tooltip">
                                            <span className="sidebar__tooltip-text">{item.title}</span>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* User Profile Section */}
                {user && (
                    <div className="sidebar__footer">
                        <div className="sidebar__user">
                            <div className="sidebar__user-avatar">
                                <img
                                    src={user.profilePictureUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format"}
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="sidebar__avatar-image"
                                />
                                <div className="sidebar__status-indicator" aria-label={t('sidebar.statusOnline')}></div>
                            </div>

                            <div className={`sidebar__user-info ${!isOpen && !isMobileOpen ? 'sidebar__user-info--hidden' : ''}`}>
                                <div className="sidebar__user-name">
                                    {user.firstName} {user.lastName}
                                </div>
                                <div className="sidebar__user-role">{user.role}</div>
                            </div>

                            {(isOpen || isMobileOpen) && (
                                <button
                                    className="sidebar__user-menu"
                                    onClick={() => handleNavigation('/account')}
                                    aria-label={t('sidebar.userMenu')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="1"></circle>
                                        <circle cx="12" cy="5" r="1"></circle>
                                        <circle cx="12" cy="19" r="1"></circle>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;