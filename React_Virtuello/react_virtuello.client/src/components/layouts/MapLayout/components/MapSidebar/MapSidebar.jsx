import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './MapSidebar.css';

const MapSidebar = ({
    isOpen = false,
    onClose = () => { },
    onToggle = () => { },
    title = '',
    children,
    className = '',
    isMobile = false,
    showBackdrop = true,
    position = 'left', // 'left' | 'right'
    width = 360,
    maxWidth = 400,
    resizable = false
}) => {
    const { t } = useTranslation();
    const sidebarRef = useRef(null);
    const backdropRef = useRef(null);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when sidebar is open on mobile
            if (isMobile) {
                document.body.style.overflow = 'hidden';
            }
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (isMobile) {
                document.body.style.overflow = '';
            }
        };
    }, [isOpen, onClose, isMobile]);

    // Handle click outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobile && isOpen && sidebarRef.current &&
                !sidebarRef.current.contains(event.target) &&
                backdropRef.current && backdropRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen && isMobile) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose, isMobile]);

    // Focus management
    useEffect(() => {
        if (isOpen && sidebarRef.current) {
            // Focus the first focusable element when sidebar opens
            const firstFocusable = sidebarRef.current.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }, [isOpen]);

    const sidebarStyle = {
        width: isMobile ? '100%' : `${width}px`,
        maxWidth: isMobile ? '100%' : `${maxWidth}px`,
        [position]: isOpen ? 0 : `-${width}px`
    };

    if (!isOpen && !isMobile) {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            {isOpen && showBackdrop && (isMobile || position === 'right') && (
                <div
                    ref={backdropRef}
                    className="gm-sidebar__backdrop"
                    onClick={onClose}
                    aria-label={t('common.close')}
                />
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`gm-sidebar ${className} ${isOpen ? 'gm-sidebar--open' : ''} ${isMobile ? 'gm-sidebar--mobile' : 'gm-sidebar--desktop'
                    } gm-sidebar--${position}`}
                style={sidebarStyle}
                role="complementary"
                aria-label={title || t('map.sidebar')}
                aria-hidden={!isOpen}
            >
                {/* Sidebar Header */}
                <div className="gm-sidebar__header">
                    <div className="gm-sidebar__header-content">
                        {title && (
                            <h2 className="gm-sidebar__title">
                                {title}
                            </h2>
                        )}
                    </div>

                    <div className="gm-sidebar__header-actions">
                        {/* Toggle Button (Desktop) */}
                        {!isMobile && (
                            <button
                                className="gm-sidebar__toggle-btn"
                                onClick={onToggle}
                                aria-label={isOpen ? t('map.collapse_sidebar') : t('map.expand_sidebar')}
                                title={isOpen ? t('map.collapse_sidebar') : t('map.expand_sidebar')}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className={`gm-sidebar__toggle-icon ${isOpen ? 'gm-sidebar__toggle-icon--open' : ''}`}
                                >
                                    {position === 'left' ? (
                                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                                    ) : (
                                        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                                    )}
                                </svg>
                            </button>
                        )}

                        {/* Close Button */}
                        <button
                            className="gm-sidebar__close-btn"
                            onClick={onClose}
                            aria-label={t('common.close')}
                            title={t('common.close')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="gm-sidebar__content">
                    {children}
                </div>

                {/* Resize Handle (if resizable) */}
                {resizable && !isMobile && (
                    <div
                        className={`gm-sidebar__resize-handle gm-sidebar__resize-handle--${position}`}
                        onMouseDown={(e) => {
                            // Implement resize logic here if needed
                            e.preventDefault();
                        }}
                    />
                )}
            </aside>
        </>
    );
};

export default MapSidebar;