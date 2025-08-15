import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({
    user,
    isOpen = true,
    isCollapsed = false,
    isMobile = false,
    onClose,
    className = ''
}) => {
    const { t } = useTranslation();
    const { isAdmin, isManager } = useAuth();
    const navigate = useNavigate();
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState(['main']);

    // Navigation items based on user role
    const getNavigationItems = () => {
        const baseItems = [
            {
                id: 'dashboard',
                group: 'main',
                label: t('sidebar.dashboard'),
                path: '/myspace',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager', 'Customer']
            },
            {
                id: 'map',
                group: 'main',
                label: t('sidebar.map'),
                path: '/map',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager', 'Customer']
            }
        ];

        const businessItems = [
            {
                id: 'businesses',
                group: 'content',
                label: t('sidebar.businesses'),
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager', 'Customer'],
                children: [
                    {
                        id: 'all-businesses',
                        label: t('sidebar.all_businesses'),
                        path: '/myspace/businesses',
                        roles: ['Admin', 'Manager', 'Customer']
                    },
                    {
                        id: 'add-business',
                        label: t('sidebar.add_business'),
                        path: '/myspace/businesses/add',
                        roles: ['Admin', 'Manager']
                    },
                    {
                        id: 'business-categories',
                        label: t('sidebar.categories'),
                        path: '/myspace/businesses/tags',
                        roles: ['Admin', 'Manager']
                    }
                ]
            },
            {
                id: 'events',
                group: 'content',
                label: t('sidebar.events'),
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager', 'Customer'],
                children: [
                    {
                        id: 'all-events',
                        label: t('sidebar.all_events'),
                        path: '/myspace/events',
                        roles: ['Admin', 'Manager', 'Customer']
                    },
                    {
                        id: 'add-event',
                        label: t('sidebar.add_event'),
                        path: '/myspace/events/add',
                        roles: ['Admin', 'Manager', 'Customer']
                    },
                    {
                        id: 'my-events',
                        label: t('sidebar.my_events'),
                        path: '/events/my',
                        roles: ['Admin', 'Manager', 'Customer']
                    },
                    {
                        id: 'event-categories',
                        label: t('sidebar.categories'),
                        path: '/events/categories',
                        roles: ['Admin', 'Manager']
                    }
                ]
            },
            {
                id: 'tours',
                group: 'content',
                label: t('sidebar.tours'),
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager', 'Customer'],
                children: [
                    {
                        id: 'all-tours',
                        label: t('sidebar.all_tours'),
                        path: '/myspace/tours',
                        roles: ['Admin', 'Manager', 'Customer']
                    },
                    {
                        id: 'create-tour',
                        label: t('sidebar.create_tour'),
                        path: '/myspace/tours/add',
                        roles: ['Admin', 'Manager', 'Customer']
                    },
                    {
                        id: 'my-tours',
                        label: t('sidebar.my_tours'),
                        path: '/tours/my',
                        roles: ['Admin', 'Manager', 'Customer']
                    }
                ]
            }
        ];

        const adminItems = [
            {
                id: 'users',
                group: 'admin',
                label: t('sidebar.users'),
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.999 2.999 0 0 0 17 7c-.8 0-1.54.37-2.01.97L14 9l-1-1.97A2.999 2.999 0 0 0 10 7c-1.66 0-3 1.34-3 3 0 .35.07.69.18 1H9c1.1 0 2 .9 2 2v10h2V12h2v11h4zm-11.5-9.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S7 9.67 7 11s.67 1.5 1.5 1.5zM7 22v-6H4.5L7.04 8.37C7.34 7.57 8.1 7 9 7c.9 0 1.66.57 1.96 1.37L13.5 16H11v6H7z" />
                    </svg>
                ),
                roles: ['Admin'],
                children: [
                    {
                        id: 'all-users',
                        label: t('sidebar.all_users'),
                        path: '/admin/users',
                        roles: ['Admin']
                    },
                    {
                        id: 'user-roles',
                        label: t('sidebar.user_roles'),
                        path: '/admin/users/roles',
                        roles: ['Admin']
                    },
                    {
                        id: 'user-permissions',
                        label: t('sidebar.permissions'),
                        path: '/admin/users/permissions',
                        roles: ['Admin']
                    }
                ]
            },
            {
                id: 'analytics',
                group: 'admin',
                label: t('sidebar.analytics'),
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager'],
                children: [
                    {
                        id: 'overview',
                        label: t('sidebar.overview'),
                        path: '/analytics/overview',
                        roles: ['Admin', 'Manager']
                    },
                    {
                        id: 'business-analytics',
                        label: t('sidebar.business_analytics'),
                        path: '/analytics/businesses',
                        roles: ['Admin', 'Manager']
                    },
                    {
                        id: 'event-analytics',
                        label: t('sidebar.event_analytics'),
                        path: '/analytics/events',
                        roles: ['Admin', 'Manager']
                    },
                    {
                        id: 'user-analytics',
                        label: t('sidebar.user_analytics'),
                        path: '/analytics/users',
                        roles: ['Admin']
                    }
                ]
            },
            {
                id: 'settings',
                group: 'admin',
                label: t('sidebar.settings'),
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                    </svg>
                ),
                roles: ['Admin'],
                children: [
                    {
                        id: 'general-settings',
                        label: t('sidebar.general_settings'),
                        path: '/admin/settings/general',
                        roles: ['Admin']
                    },
                    {
                        id: 'system-settings',
                        label: t('sidebar.system_settings'),
                        path: '/admin/settings/system',
                        roles: ['Admin']
                    },
                    {
                        id: 'security-settings',
                        label: t('sidebar.security_settings'),
                        path: '/admin/settings/security',
                        roles: ['Admin']
                    }
                ]
            }
        ];

        const accountItems = [
            {
                id: 'profile',
                group: 'account',
                label: t('sidebar.profile'),
                path: '/profile',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager', 'Customer']
            },
            {
                id: 'account-settings',
                group: 'account',
                label: t('sidebar.account_settings'),
                path: '/account/settings',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.35 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.35 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager', 'Customer']
            },
            {
                id: 'help',
                group: 'account',
                label: t('sidebar.help_support'),
                path: '/help',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z" />
                    </svg>
                ),
                roles: ['Admin', 'Manager', 'Customer']
            }
        ];

        // Filter items based on user role
        const filterByRole = (items) => {
            return items.filter(item => {
                if (!item.roles.includes(user?.role)) return false;
                if (item.children) {
                    item.children = item.children.filter(child => child.roles.includes(user?.role));
                }
                return true;
            });
        };

        let allItems = [...baseItems, ...businessItems];

        if (isAdmin || isManager) {
            allItems = [...allItems, ...adminItems];
        }

        allItems = [...allItems, ...accountItems];

        return filterByRole(allItems);
    };

    const navigationItems = getNavigationItems();

    // Handle submenu toggle
    const toggleSubmenu = (itemId) => {
        if (isCollapsed && !isMobile) return; // Don't toggle in collapsed desktop mode

        setActiveSubmenu(activeSubmenu === itemId ? null : itemId);
    };

    // Handle group expansion
    const toggleGroup = (groupId) => {
        if (expandedGroups.includes(groupId)) {
            setExpandedGroups(prev => prev.filter(id => id !== groupId));
        } else {
            setExpandedGroups(prev => [...prev, groupId]);
        }
    };

    // Get group title
    const getGroupTitle = (groupId) => {
        const titles = {
            main: t('sidebar.main'),
            content: t('sidebar.content_management'),
            admin: t('sidebar.administration'),
            account: t('sidebar.account')
        };
        return titles[groupId] || groupId;
    };

    // Group items
    const groupedItems = navigationItems.reduce((acc, item) => {
        const group = item.group || 'other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    // Handle item click
    const handleItemClick = (item) => {
        if (isMobile && onClose) {
            onClose();
        }

        navigate(item.path);
        // Add navigation logic here
        console.log('Navigating to:', item.path);
    };

    return (
        <aside
            className={`sidebar ${isMobile ? 'sidebar--mobile' : 'sidebar--desktop'} ${isCollapsed ? 'sidebar--collapsed' : ''} ${isOpen ? 'sidebar--open' : ''} ${className}`}
            aria-label={t('sidebar.navigation')}
        >
            {/* Mobile Header */}
            {isMobile && (
                <div className="sidebar__mobile-header">
                    <h2 className="sidebar__mobile-title">{t('sidebar.navigation')}</h2>
                    <button
                        className="sidebar__close-btn"
                        onClick={onClose}
                        aria-label={t('sidebar.close')}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar__nav">
                {Object.entries(groupedItems).map(([groupId, items]) => (
                    <div key={groupId} className="sidebar__group">
                        {/* Group Header */}
                        {!isCollapsed && (
                            <div className="sidebar__group-header">
                                <button
                                    className="sidebar__group-toggle"
                                    onClick={() => toggleGroup(groupId)}
                                    aria-expanded={expandedGroups.includes(groupId)}
                                >
                                    <span className="sidebar__group-title">
                                        {getGroupTitle(groupId)}
                                    </span>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className={`sidebar__group-arrow ${expandedGroups.includes(groupId) ? 'sidebar__group-arrow--expanded' : ''}`}
                                    >
                                        <path d="M7 10l5 5 5-5z" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Group Items */}
                        <div className={`sidebar__group-items ${expandedGroups.includes(groupId) ? 'sidebar__group-items--expanded' : ''}`}>
                            {items.map((item) => (
                                <div key={item.id} className="sidebar__item-container">
                                    {/* Main Item */}
                                    <div className="sidebar__item">
                                        {item.children ? (
                                            <button
                                                className="sidebar__item-btn sidebar__item-btn--expandable"
                                                onClick={() => toggleSubmenu(item.id)}
                                                aria-expanded={activeSubmenu === item.id}
                                                title={isCollapsed ? item.label : undefined}
                                            >
                                                <span className="sidebar__item-icon">
                                                    {item.icon}
                                                </span>
                                                {!isCollapsed && (
                                                    <>
                                                        <span className="sidebar__item-label">{item.label}</span>
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            className={`sidebar__item-arrow ${activeSubmenu === item.id ? 'sidebar__item-arrow--expanded' : ''}`}
                                                        >
                                                            <path d="M7 10l5 5 5-5z" />
                                                        </svg>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <a
                                                href={item.path}
                                                className="sidebar__item-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleItemClick(item);
                                                }}
                                                title={isCollapsed ? item.label : undefined}
                                            >
                                                <span className="sidebar__item-icon">
                                                    {item.icon}
                                                </span>
                                                {!isCollapsed && (
                                                    <span className="sidebar__item-label">{item.label}</span>
                                                )}
                                            </a>
                                        )}
                                    </div>

                                    {/* Submenu */}
                                    {item.children && !isCollapsed && (
                                        <div className={`sidebar__submenu ${activeSubmenu === item.id ? 'sidebar__submenu--open' : ''}`}>
                                            {item.children.map((child) => (
                                                <a
                                                    key={child.id}
                                                    href={child.path}
                                                    className="sidebar__submenu-item"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleItemClick(child);
                                                    }}
                                                >
                                                    <span className="sidebar__submenu-label">{child.label}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {/* Collapsed Submenu Tooltip */}
                                    {item.children && isCollapsed && !isMobile && (
                                        <div className="sidebar__tooltip">
                                            <div className="sidebar__tooltip-header">{item.label}</div>
                                            {item.children.map((child) => (
                                                <a
                                                    key={child.id}
                                                    href={child.path}
                                                    className="sidebar__tooltip-item"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleItemClick(child);
                                                    }}
                                                >
                                                    {child.label}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            {!isCollapsed && (
                <div className="sidebar__footer">
                    <div className="sidebar__footer-content">
                        <div className="sidebar__footer-brand">
                            <span className="sidebar__footer-logo">V</span>
                            <span className="sidebar__footer-name">Virtuello</span>
                        </div>
                        <div className="sidebar__footer-version">
                            v1.0.0
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;