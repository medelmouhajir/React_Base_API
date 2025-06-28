// src/components/ui/Modal.jsx
import { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
    const { isDarkMode } = useTheme();
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Handle clicks outside the modal content
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isDarkMode ? 'dark' : 'light'}`}>
            <div className={`modal-container size-${size}`} ref={modalRef}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;