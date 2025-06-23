// src/components/Studio/StudioSidebar/StudioSidebar.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import './StudioSidebar.css';

const StudioSidebar = ({
    isOpen = false,
    isMobileOpen = false,
    onClose,
    onToggle,
    selectedSerie
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [expandedSections, setExpandedSections] = useState(['ai-tools']);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);
    const sidebarRef = useRef(null);
    const image_base_url = import.meta.env.VITE_API_URL;

    // Track window size changes
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Update active menu based on current path
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/studio/characters')) {
            setActiveMenu('characters');
        } else if (path.includes('/studio/places')) {
            setActiveMenu('places');
        } else if (path.includes('/studio/ai-generate-character')) {
            setActiveMenu('ai-generate-character');
        } else if (path.includes('/studio/text-to-image')) {
            setActiveMenu('text-to-image');
        } else if (path.includes('/studio/image-enhancement')) {
            setActiveMenu('image-enhancement');
        } else if (path.includes('/studio/dashboard')) {
            setActiveMenu('dashboard');
        } else if (path.includes('/studio/settings')) {
            setActiveMenu('settings');
        } else if (path.includes('/studio/uploads')) {
            setActiveMenu('uploads');
        } else if (path.includes('/studio/scenes')) {
            setActiveMenu('scenes');
        } else if (path.includes('/studio/ai/character')) {
            setActiveMenu('ai-generate-character');
        } else if (path.includes('/studio/generations')) {
            setActiveMenu('image-generations');
        }
    }, [location]);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        function handleClickOutside(event) {
            if (isMobileOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                onClose && onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileOpen, onClose]);

    // Handle touch gestures for swipe to close/open
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50; // Minimum swipe distance
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && (isOpen || isMobileOpen)) {
            // Swipe left to close
            onClose && onClose();
        } else if (isRightSwipe && !isOpen && !isMobileOpen) {
            // Swipe right to open
            onToggle && onToggle();
        }

        // Reset touch coordinates
        setTouchStart(null);
        setTouchEnd(null);
    };

    // Toggle section expansion
    const toggleSection = (sectionId) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    // Handle navigation
    const handleNavigation = (href) => {
        if (href) {
            navigate(href);
            if (isMobileOpen && onClose) {
                onClose();
            }
        }
    };

    // Menu structure
    const menuSections = [
        {
            id: 'ai-tools',
            title: t('studio.sidebar.aiTools'),
            expandable: true,
            items: [
                {
                    id: 'ai-generate-character',
                    title: t('studio.sidebar.ai.character'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    ),
                    href: '/studio/ai/character',
                    badge: { text: 'AI', type: 'ai' }
                },
                {
                    id: 'text-to-image',
                    title: t('studio.sidebar.textToImage'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    ),
                    href: '/studio/text-to-image'
                },
                {
                    id: 'image-enhancement',
                    title: t('studio.sidebar.imageEnhancement'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                    ),
                    href: '/studio/image-enhancement'
                }
            ]
        },
        {
            id: 'resources',
            title: t('studio.sidebar.resources'),
            items: [
                {
                    id: 'characters',
                    title: t('studio.sidebar.characters'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    ),
                    href: '/studio/characters'
                },
                {
                    id: 'scenes',
                    title: t('studio.sidebar.scenes'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    ),
                    href: '/studio/scenes'
                },
                {
                    id: 'uploads',
                    title: t('studio.sidebar.uploads'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    ),
                    href: '/studio/uploads'
                },
                {
                    id: 'generations',
                    title: t('studio.sidebar.generations'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <path d="M21 15l-5-5L5 21"></path>
                            <path d="M16 2l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3L12 5h3z"></path>
                        </svg>

                    ),
                    href: '/studio/generations'
                }
            ]
        },
        {
            id: 'studio-settings',
            title: t('studio.sidebar.studioSettings'),
            items: [
                {
                    id: 'settings',
                    title: t('studio.sidebar.settings'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    ),
                    href: '/studio/settings'
                }
            ]
        }
    ];

    // Render badge
    const renderBadge = (badge) => {
        if (!badge) return null;
        return (
            <span className={`studio-sidebar__badge studio-sidebar__badge--${badge.type || 'default'}`}>
                {badge.text}
            </span>
        );
    };

    // Define sidebar classes based on screen size and states
    const sidebarClasses = [
        'studio-sidebar',
        // In mobile view, only apply --mobile-open when needed
        isMobileView
            ? (isMobileOpen ? 'studio-sidebar--mobile-open' : '')
            : (isOpen ? 'studio-sidebar--open' : 'studio-sidebar--closed')
    ].filter(Boolean).join(' ');

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="studio-sidebar__overlay"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={sidebarClasses}
                role="navigation"
                aria-label="Studio navigation"
                ref={sidebarRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Sidebar Header */}
                <div className="studio-sidebar__header">
                    {selectedSerie && (
                        <div className="studio-sidebar__serie-info">
                            {selectedSerie.coverImageUrl && (
                                <img
                                    src={image_base_url + selectedSerie.coverImageUrl}
                                    alt={selectedSerie.title}
                                    className="studio-sidebar__serie-image"
                                />
                            )}
                            <div className={`studio-sidebar__serie-details ${!isOpen && !isMobileOpen ? 'studio-sidebar__serie-details--hidden' : ''}`}>
                                <h3 className="studio-sidebar__serie-title">{selectedSerie.title}</h3>
                                <span className="studio-sidebar__serie-status">{selectedSerie.status}</span>
                            </div>
                        </div>
                    )}

                    {/* Close button for mobile */}
                    {isMobileOpen && (
                        <button
                            className="studio-sidebar__close-btn"
                            onClick={onClose}
                            aria-label={t('sidebar.close')}
                            type="button"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="studio-sidebar__nav">
                    {menuSections.map((section) => (
                        <div key={section.id} className="studio-sidebar__section">
                            {(isOpen || isMobileOpen) && (
                                <div
                                    className="studio-sidebar__section-header"
                                    onClick={() => section.expandable && toggleSection(section.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            section.expandable && toggleSection(section.id);
                                        }
                                    }}
                                    aria-expanded={expandedSections.includes(section.id)}
                                >
                                    <span className="studio-sidebar__section-title">{section.title}</span>
                                    {section.expandable && (
                                        <svg
                                            className={`studio-sidebar__section-arrow ${expandedSections.includes(section.id) ? 'studio-sidebar__section-arrow--expanded' : ''}`}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            aria-hidden="true"
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    )}
                                </div>
                            )}

                            {(!section.expandable || expandedSections.includes(section.id) || !isOpen) && (
                                <ul className="studio-sidebar__menu">
                                    {section.items.map((item) => (
                                        <li key={item.id} className="studio-sidebar__menu-item">
                                            <button
                                                className={`studio-sidebar__menu-button ${activeMenu === item.id ? 'studio-sidebar__menu-button--active' : ''}`}
                                                onClick={() => handleNavigation(item.href)}
                                                title={!isOpen && !isMobileOpen ? item.title : undefined}
                                                disabled={!selectedSerie && ['characters', 'places', 'scenes', 'uploads'].includes(item.id)}
                                                type="button"
                                            >
                                                <span className="studio-sidebar__menu-icon">
                                                    {item.icon}
                                                </span>

                                                <span className={`studio-sidebar__menu-label ${!isOpen && !isMobileOpen ? 'studio-sidebar__menu-label--hidden' : ''}`}>
                                                    {item.title}
                                                </span>

                                                <div className={`studio-sidebar__menu-meta ${!isOpen && !isMobileOpen ? 'studio-sidebar__menu-meta--hidden' : ''}`}>
                                                    {item.badge && renderBadge(item.badge)}
                                                </div>
                                            </button>

                                            {/* Tooltip for collapsed state */}
                                            {!isOpen && !isMobileOpen && (
                                                <div className="studio-sidebar__tooltip">
                                                    <span className="studio-sidebar__tooltip-text">{item.title}</span>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="studio-sidebar__footer">
                    <div className="studio-sidebar__ai-credit">
                        <div className="studio-sidebar__ai-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M12 8V16M8 12H16"></path>
                                <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                        </div>
                        <div className={`studio-sidebar__ai-info ${!isOpen && !isMobileOpen ? 'studio-sidebar__ai-info--hidden' : ''}`}>
                            <span className="studio-sidebar__ai-label">{t('studio.sidebar.aiCredits')}</span>
                            <span className="studio-sidebar__ai-value">1,000</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default StudioSidebar;