// src/components/Modals/Modal.jsx
import { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext'; // Assuming you have a theme context
import './Modal.css';

const Modal = ({
    title,
    children,
    onClose,
    size = 'medium',
    showCloseButton = true,
    fullHeight = false,
    closeOnOutsideClick = true
}) => {
    const { isDarkMode } = useTheme?.() || { isDarkMode: false };
    const modalRef = useRef(null);

    // Close on ESC key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Focus trap
        const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements?.length) {
            focusableElements[0].focus();
        }

        // Lock scroll on body
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    // Handle outside click
    const handleOverlayClick = (e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    // Determine size class
    const sizeClass = `size-${size}`;

    return (
        <div
            className={`modal-overlay ${isDarkMode ? 'dark' : ''}`}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`modal-container ${sizeClass} ${fullHeight ? 'full-height' : ''}`}
                ref={modalRef}
            >
                <div className="modal-header">
                    <h2 id="modal-title" className="modal-title">{title}</h2>
                    {showCloseButton && (
                        <button
                            type="button"
                            className="modal-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;