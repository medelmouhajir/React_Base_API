import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './MapSidebar.css';

const MapSidebar = ({
    isOpen = false,
    onClose,
    onToggle,
    children,
    title,
    className = '',
    showBackdrop = true,
    closeOnBackdropClick = true
}) => {
    const { t } = useTranslation();
    const sidebarRef = useRef(null);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen && onClose) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when sidebar is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Focus management
    useEffect(() => {
        if (isOpen && sidebarRef.current) {
            const firstFocusable = sidebarRef.current.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }, [isOpen]);

    const handleBackdropClick = (event) => {
        if (closeOnBackdropClick && event.target === event.currentTarget && onClose) {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop */}
            {showBackdrop && isOpen && (
                <div
                    className="map-sidebar__backdrop"
                    onClick={handleBackdropClick}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`map-sidebar ${isOpen ? 'map-sidebar--open' : ''} ${className}`}
                role="complementary"
                aria-label={title || t('map.sidebar_aria_label')}
                aria-hidden={!isOpen}
            >
                {/* Sidebar Header */}
                <div className="map-sidebar__header">
                    <div className="map-sidebar__header-content">
                        {title && (
                            <h2 className="map-sidebar__title">
                                {title}
                            </h2>
                        )}
                    </div>

                    <div className="map-sidebar__header-actions">
                        {/* Toggle Button (for desktop) */}
                        {onToggle && (
                            <button
                                type="button"
                                onClick={onToggle}
                                className="map-sidebar__toggle-btn desktop-only"
                                aria-label={isOpen ? t('map.collapse_sidebar') : t('map.expand_sidebar')}
                                title={isOpen ? t('map.collapse_sidebar') : t('map.expand_sidebar')}
                            >
                                <svg
                                    className="map-sidebar__toggle-icon"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d={isOpen ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        )}

                        {/* Close Button (for mobile) */}
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="map-sidebar__close-btn mobile-only"
                                aria-label={t('common.close')}
                                title={t('common.close')}
                            >
                                <svg
                                    className="map-sidebar__close-icon"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M18 6L6 18M6 6L18 18"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="map-sidebar__content">
                    {children}
                </div>

                {/* Resize Handle */}
                <div
                    className="map-sidebar__resize-handle"
                    role="separator"
                    aria-label={t('map.resize_sidebar')}
                    tabIndex="0"
                />
            </aside>
        </>
    );
};

export default MapSidebar;