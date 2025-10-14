import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';


// Styles
import './VehicleSearch.css';


const VehicleSearch = ({
    value = '',
    onChange,
    placeholder = 'Search vehicles...',
    isMobile = false
}) => {
    const { t } = useTranslation();
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);
    const inputRef = useRef(null);

    useEffect(() => {
        setHasValue(!!value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setHasValue(!!newValue);
        onChange?.(newValue);
    };

    const handleClear = () => {
        onChange?.('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            inputRef.current?.blur();
            if (value) {
                handleClear();
            }
        }
    };

    return (
        <motion.div
            className={`vehicle-search ${isMobile ? 'mobile' : 'desktop'} ${isFocused ? 'focused' : ''} ${hasValue ? 'has-value' : ''}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="search-input-container">
                {/* Search Icon */}
                <motion.div
                    className="search-icon"
                    animate={{
                        scale: isFocused ? 1.1 : 1,
                        color: isFocused ? 'var(--modern-primary)' : 'rgba(255, 255, 255, 0.5)'
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </motion.div>

                {/* Input Field */}
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="search-input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />

                {/* Clear Button */}
                <AnimatePresence>
                    {hasValue && (
                        <motion.button
                            className="clear-btn"
                            onClick={handleClear}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            aria-label={t('common.clear', 'Clear')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Search Suggestions/Shortcuts */}
            <AnimatePresence>
                {isFocused && !hasValue && (
                    <motion.div
                        className="search-hints"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="hint-item">
                            <kbd>↑</kbd>
                            <span>Search by plate number</span>
                        </div>
                        <div className="hint-item">
                            <kbd>→</kbd>
                            <span>Search by driver name</span>
                        </div>
                        <div className="hint-item">
                            <kbd>Esc</kbd>
                            <span>Clear search</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default VehicleSearch;