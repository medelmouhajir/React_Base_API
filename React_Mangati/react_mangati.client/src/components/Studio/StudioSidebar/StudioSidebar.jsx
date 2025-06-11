// src/components/Studio/StudioSidebar/StudioSidebar.jsx
import { useState, useEffect } from 'react';
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
    const image_base_url = import.meta.env.VITE_API_URL;

    // Update active menu based on current path
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/studio/characters')) {
            setActiveMenu('characters');
        } else if (path.includes('/studio/places')) {
            setActiveMenu('places');
        } else if (path.includes('/studio/ai-generate')) {
            setActiveMenu('ai-generate');
        } else if (path.includes('/studio/text-to-image')) {
            setActiveMenu('text-to-image');
        } else if (path.includes('/studio/image-enhancement')) {
            setActiveMenu('image-enhancement');
        } else if (path.includes('/studio/dashboard')) {
            setActiveMenu('dashboard');
        } else if (path.includes('/studio/settings')) {
            setActiveMenu('settings');
        }
    }, [location]);

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
                    id: 'ai-generate',
                    title: t('studio.sidebar.aiGenerate'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    ),
                    href: '/studio/ai-generate',
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
                    id: 'templates',
                    title: t('studio.sidebar.templates'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="3" x2="9" y2="21"></line>
                            <line x1="9" y1="9" x2="21" y2="9"></line>
                        </svg>
                    ),
                    href: '/studio/templates'
                },
                {
                    id: 'gallery',
                    title: t('studio.sidebar.gallery'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"></path>
                        </svg>
                    ),
                    href: '/studio/gallery'
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
                            <path d="M12 1v6m0 6v6m0-6l5.2 3m-10.4 0L12 13m0 0l-5.2 3m10.4 0L12 13"></path>
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

    // Define sidebar classes
    const sidebarClasses = [
        'studio-sidebar',
        isOpen ? 'studio-sidebar--open' : 'studio-sidebar--closed',
        isMobileOpen ? 'studio-sidebar--mobile-open' : ''
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
            <aside className={sidebarClasses} role="navigation" aria-label="Studio navigation">
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
                            {isOpen && (
                                <div 
                                    className="studio-sidebar__section-header"
                                    onClick={() => section.expandable && toggleSection(section.id)}
                                >
                                    <span className="studio-sidebar__section-title">{section.title}</span>
                                    {section.expandable && (
                                        <svg 
                                            className={`studio-sidebar__section-arrow ${expandedSections.includes(section.id) ? 'studio-sidebar__section-arrow--expanded' : ''}`}
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
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
                                                title={!isOpen ? item.title : ''}
                                                disabled={!selectedSerie && ['characters', 'places'].includes(item.id)}
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
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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