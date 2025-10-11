// src/pages/Gps/Home/components/MobileSheet/MobileDrawer.jsx
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';

const MobileDrawer = ({
    isOpen,
    onClose,
    position = 'left', // 'left', 'right', 'top', 'bottom'
    children,
    title,
    showBackdrop = true,
    closeOnBackdropClick = true,
    className = ''
}) => {
    const { t } = useTranslation();
    const drawerRef = useRef(null);
    const backdropRef = useRef(null);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (closeOnBackdropClick && e.target === backdropRef.current) {
            onClose();
        }
    };

    // Focus management
    useEffect(() => {
        if (isOpen && drawerRef.current) {
            const focusableElements = drawerRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const drawerContent = (
        <div
            ref={backdropRef}
            className={`mobile-drawer-backdrop ${showBackdrop ? 'with-backdrop' : ''}`}
            onClick={handleBackdropClick}
        >
            <div
                ref={drawerRef}
                className={`mobile-drawer mobile-drawer-${position} ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'drawer-title' : undefined}
            >
                {/* Header */}
                {title && (
                    <div className="mobile-drawer-header">
                        <h3 id="drawer-title" className="mobile-drawer-title">
                            {title}
                        </h3>
                        <button
                            className="mobile-drawer-close"
                            onClick={onClose}
                            aria-label={t('common.close', 'Close')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="mobile-drawer-content">
                    {children}
                </div>
            </div>
        </div>
    );

    // Render in portal
    return createPortal(drawerContent, document.body);
};

export default MobileDrawer;