import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({
    isOpen = false,
    isMobileOpen = false,
    onClose,
    onToggle
}) => {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [expandedMenus, setExpandedMenus] = useState([]);
    const { user } = useAuth();

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && (isOpen || isMobileOpen)) {
                if (onClose) onClose();
                if (onToggle) onToggle();
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

    const menuItems = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9"></rect>
                    <rect x="14" y="3" width="7" height="5"></rect>
                    <rect x="14" y="12" width="7" height="9"></rect>
                    <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
            ),
            href: '/dashboard',
        },
        {
            id: 'projects',
            title: 'Projects',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
            ),
            submenu: [
                {
                    id: 'all-projects',
                    title: 'All Projects',
                    href: '/projects',
                    count: 24
                },
                {
                    id: 'active-projects',
                    title: 'Active Projects',
                    href: '/projects/active',
                    count: 12,
                    status: 'success'
                },
                {
                    id: 'pending-projects',
                    title: 'Pending Review',
                    href: '/projects/pending',
                    count: 5,
                    status: 'warning'
                },
                {
                    id: 'completed-projects',
                    title: 'Completed',
                    href: '/projects/completed',
                    count: 7,
                    status: 'info'
                },
            ]
        },
        {
            id: 'tasks',
            title: 'Tasks',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
            ),
            submenu: [
                {
                    id: 'my-tasks',
                    title: 'My Tasks',
                    href: '/tasks/my',
                    count: 8,
                    priority: true
                },
                {
                    id: 'assigned-tasks',
                    title: 'Assigned to Me',
                    href: '/tasks/assigned',
                    count: 15
                },
                {
                    id: 'due-today',
                    title: 'Due Today',
                    href: '/tasks/due-today',
                    count: 3,
                    status: 'danger'
                },
                {
                    id: 'overdue',
                    title: 'Overdue',
                    href: '/tasks/overdue',
                    count: 2,
                    status: 'danger'
                },
            ]
        },
        {
            id: 'team',
            title: 'Team',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            ),
            submenu: [
                {
                    id: 'team-members',
                    title: 'All Members',
                    href: '/team',
                    count: 28
                },
                {
                    id: 'departments',
                    title: 'Departments',
                    href: '/team/departments'
                },
                {
                    id: 'roles',
                    title: 'Roles & Permissions',
                    href: '/team/roles'
                },
                {
                    id: 'team-performance',
                    title: 'Performance',
                    href: '/team/performance'
                },
            ]
        },
        {
            id: 'calendar',
            title: 'Calendar',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            ),
            href: '/calendar',
            badge: { text: '3', type: 'info' }
        },
        {
            id: 'reports',
            title: 'Reports & Analytics',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            ),
            submenu: [
                {
                    id: 'analytics',
                    title: 'Project Analytics',
                    href: '/reports/analytics'
                },
                {
                    id: 'time-tracking',
                    title: 'Time Reports',
                    href: '/reports/time'
                },
                {
                    id: 'performance',
                    title: 'Team Performance',
                    href: '/reports/performance'
                },
                {
                    id: 'export',
                    title: 'Export Data',
                    href: '/reports/export'
                },
            ]
        },
        {
            id: 'settings',
            title: 'Settings',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            ),
            submenu: [
                {
                    id: 'general-settings',
                    title: 'General',
                    href: '/settings/general'
                },
                {
                    id: 'profile-settings',
                    title: 'Profile Settings',
                    href: '/settings/profile'
                },
                {
                    id: 'security',
                    title: 'Security',
                    href: '/settings/security'
                },
                {
                    id: 'notifications',
                    title: 'Notifications',
                    href: '/settings/notifications'
                },
                {
                    id: 'integrations',
                    title: 'Integrations',
                    href: '/settings/integrations'
                },
            ]
        },
    ];

    const handleMenuClick = (item) => {
        if (item.submenu) {
            // Toggle submenu expansion
            setExpandedMenus(prev =>
                prev.includes(item.id)
                    ? prev.filter(id => id !== item.id)
                    : [...prev, item.id]
            );
        } else {
            // Navigate to single menu item
            setActiveMenu(item.id);
            handleNavigation(item.href);
        }
    };

    const handleSubmenuClick = (submenuItem, parentId) => {
        setActiveMenu(submenuItem.id);
        handleNavigation(submenuItem.href);

        // Close mobile sidebar after navigation
        if (isMobileOpen && onClose) {
            onClose();
        }
    };

    const handleNavigation = (href) => {
        if (href) {
            // For now, just log the navigation
            // In a real app, you'd use React Router
            console.log('Navigate to:', href);
            // Example: navigate(href);
        }
    };

    const renderBadge = (badge) => {
        if (!badge) return null;
        return (
            <span className={`sidebar__badge sidebar__badge--${badge.type || 'default'}`}>
                {badge.text}
            </span>
        );
    };

    const renderCount = (count, status) => {
        if (!count) return null;
        return (
            <span className={`sidebar__count ${status ? `sidebar__count--${status}` : ''}`}>
                {count}
            </span>
        );
    };

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
                            <span className="sidebar__subtitle">Project Hub</span>
                        </div>
                    </div>

                    {/* Close button for mobile */}
                    {isMobileOpen && (
                        <button
                            className="sidebar__close-btn"
                            onClick={onClose}
                            aria-label="Close sidebar"
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
                                <span>Main Navigation</span>
                            </div>
                        )}

                        <ul className="sidebar__menu" role="menubar">
                            {menuItems.map((item) => {
                                const isMenuActive = activeMenu === item.id ||
                                    (item.submenu && item.submenu.some(sub => activeMenu === sub.id));
                                const isExpanded = expandedMenus.includes(item.id);

                                return (
                                    <li key={item.id} className="sidebar__menu-item" role="none">
                                        <button
                                            className={`sidebar__menu-button ${isMenuActive ? 'sidebar__menu-button--active' : ''}`}
                                            onClick={() => handleMenuClick(item)}
                                            title={!isOpen ? item.title : ''}
                                            aria-expanded={item.submenu ? isExpanded : undefined}
                                            role="menuitem"
                                        >
                                            <span className="sidebar__menu-icon" aria-hidden="true">
                                                {item.icon}
                                            </span>

                                            <span className={`sidebar__menu-label ${!isOpen ? 'sidebar__menu-label--hidden' : ''}`}>
                                                {item.title}
                                            </span>

                                            <div className={`sidebar__menu-meta ${!isOpen ? 'sidebar__menu-meta--hidden' : ''}`}>
                                                {item.badge && renderBadge(item.badge)}

                                                {item.submenu && (
                                                    <svg
                                                        className={`sidebar__chevron ${isExpanded ? 'sidebar__chevron--expanded' : ''}`}
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        aria-hidden="true"
                                                    >
                                                        <polyline points="6,9 12,15 18,9"></polyline>
                                                    </svg>
                                                )}
                                            </div>
                                        </button>

                                        {/* Submenu - only show when sidebar is open */}
                                        {item.submenu && isOpen && (
                                            <ul
                                                className={`sidebar__submenu ${isExpanded ? 'sidebar__submenu--expanded' : ''}`}
                                                role="menu"
                                                aria-label={`${item.title} submenu`}
                                            >
                                                {item.submenu.map((subItem) => (
                                                    <li key={subItem.id} className="sidebar__submenu-item" role="none">
                                                        <button
                                                            className={`sidebar__submenu-button ${activeMenu === subItem.id ? 'sidebar__submenu-button--active' : ''}`}
                                                            onClick={() => handleSubmenuClick(subItem, item.id)}
                                                            role="menuitem"
                                                        >
                                                            <span className="sidebar__submenu-dot" aria-hidden="true"></span>
                                                            <span className="sidebar__submenu-label">{subItem.title}</span>

                                                            <div className="sidebar__submenu-meta">
                                                                {subItem.count && renderCount(subItem.count, subItem.status)}
                                                                {subItem.priority && (
                                                                    <span
                                                                        className="sidebar__priority-indicator"
                                                                        aria-label="High priority"
                                                                    ></span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Tooltip for collapsed state */}
                                        {item.submenu && !isOpen && (
                                            <div className="sidebar__tooltip-submenu" role="tooltip">
                                                <div className="sidebar__tooltip-header">{item.title}</div>
                                                <ul className="sidebar__tooltip-list">
                                                    {item.submenu.map((subItem) => (
                                                        <li key={subItem.id}>
                                                            <button
                                                                className="sidebar__tooltip-item"
                                                                onClick={() => handleSubmenuClick(subItem, item.id)}
                                                            >
                                                                {subItem.title}
                                                                {subItem.count && renderCount(subItem.count, subItem.status)}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
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
                                <div className="sidebar__status-indicator" aria-label="Online"></div>
                            </div>

                            <div className={`sidebar__user-info ${!isOpen ? 'sidebar__user-info--hidden' : ''}`}>
                                <div className="sidebar__user-name">
                                    {user.firstName} {user.lastName}
                                </div>
                                <div className="sidebar__user-role">{user.role}</div>
                            </div>

                            {isOpen && (
                                <button
                                    className="sidebar__user-menu"
                                    aria-label="User menu"
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