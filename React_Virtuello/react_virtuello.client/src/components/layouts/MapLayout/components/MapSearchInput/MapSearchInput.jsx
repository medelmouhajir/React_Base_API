import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './MapSearchInput.css';

const MapSearchInput = ({
    onResults,
    onLocationSelect,
    onToggleSidebar,
    onToggleTags,
    isSidebarOpen = false,
    isTagsPanelVisible = false,
    isMobile = false,
    placeholder,
    className = '',
    debounceMs = 300,
    minSearchLength = 2,
    maxResults = 10,
    showSuggestions = true,
    autoFocus = false
}) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Mock search function - replace with actual API call
    const searchLocations = useCallback(async (searchQuery) => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Mock API call - replace with your actual search API
            const mockResults = [
                {
                    id: 1,
                    name: `Restaurant ${searchQuery}`,
                    address: 'Tangier, Morocco',
                    type: 'restaurant',
                    coordinates: [35.1765, -5.2339]
                },
                {
                    id: 2,
                    name: `Hotel ${searchQuery}`,
                    address: 'Tangier, Morocco',
                    type: 'hotel',
                    coordinates: [35.1865, -5.2439]
                },
                {
                    id: 3,
                    name: `Café ${searchQuery}`,
                    address: 'Tangier, Morocco',
                    type: 'cafe',
                    coordinates: [35.1665, -5.2239]
                }
            ];

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 200));

            if (!controller.signal.aborted) {
                setSuggestions(mockResults.slice(0, maxResults));
                setIsLoading(false);
                setShowDropdown(true);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                console.error('Search failed:', error);
                setSuggestions([]);
                setIsLoading(false);
                setShowDropdown(false);
            }
        }
    }, [maxResults]);

    // Debounced search
    useEffect(() => {
        if (query.length >= minSearchLength) {
            setIsLoading(true);

            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                searchLocations(query);
            }, debounceMs);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
            setIsLoading(false);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, minSearchLength, debounceMs, searchLocations]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowDropdown(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (event) => {
        if (!showDropdown || suggestions.length === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                event.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSuggestionSelect(suggestions[selectedIndex]);
                } else if (query.trim()) {
                    handleSearch();
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
            default:
                break;
        }
    };

    const handleInputChange = (event) => {
        const value = event.target.value;
        setQuery(value);
        setSelectedIndex(-1);
    };

    const handleInputFocus = () => {
        setIsFocused(true);
        if (suggestions.length > 0 && query.length >= minSearchLength) {
            setShowDropdown(true);
        }
    };

    const handleInputBlur = () => {
        setIsFocused(false);
        // Delay hiding dropdown to allow for suggestion clicks
        setTimeout(() => {
            setShowDropdown(false);
            setSelectedIndex(-1);
        }, 150);
    };

    const handleSuggestionSelect = (suggestion) => {
        setQuery(suggestion.name);
        setShowDropdown(false);
        setSelectedIndex(-1);
        if (onLocationSelect) {
            onLocationSelect(suggestion);
        }
        inputRef.current?.blur();
    };

    const handleSearch = () => {
        if (query.trim() && onResults) {
            onResults(suggestions);
        }
        setShowDropdown(false);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    const getLocationIcon = (type) => {
        const icons = {
            restaurant: '🍽️',
            hotel: '🏨',
            cafe: '☕',
            shop: '🛍️',
            attraction: '🎭',
            default: '📍'
        };
        return icons[type] || icons.default;
    };

    return (
        <div className={`gm-search-input ${className} ${isMobile ? 'gm-search-input--mobile' : 'gm-search-input--desktop'}`}>
            {/* Search Input Container */}
            <div className={`gm-search-input__container ${isFocused ? 'gm-search-input__container--focused' : ''}`}>
                {/* Menu/Sidebar Toggle - Mobile Only */}
                {isMobile && (
                    <button
                        className="gm-search-input__menu-btn"
                        onClick={onToggleSidebar}
                        aria-label={t('map.toggle_sidebar')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                        </svg>
                    </button>
                )}

                {/* Search Icon */}
                <div className="gm-search-input__search-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                </div>

                {/* Input Field */}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || t('map.search_placeholder')}
                    className="gm-search-input__input"
                    autoComplete="off"
                    autoFocus={autoFocus}
                    aria-label={t('map.search_placeholder')}
                    aria-expanded={showDropdown}
                    aria-haspopup="listbox"
                    role="combobox"
                />

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="gm-search-input__loading">
                        <svg className="gm-search-input__spinner" width="20" height="20" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                                <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                            </circle>
                        </svg>
                    </div>
                )}

                {/* Clear Button */}
                {query && !isLoading && (
                    <button
                        className="gm-search-input__clear"
                        onClick={handleClear}
                        aria-label={t('common.clear')}
                        type="button"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                )}

                {/* Tags Toggle - Mobile Only */}
                {isMobile && onToggleTags && (
                    <button
                        className={`gm-search-input__tags-btn ${isTagsPanelVisible ? 'gm-search-input__tags-btn--active' : ''}`}
                        onClick={onToggleTags}
                        aria-label={t('map.toggle_filters')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && showSuggestions && suggestions.length > 0 && (
                <div ref={dropdownRef} className="gm-search-input__dropdown" role="listbox">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.id}
                            className={`gm-search-input__suggestion ${index === selectedIndex ? 'gm-search-input__suggestion--selected' : ''
                                }`}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            role="option"
                            aria-selected={index === selectedIndex}
                        >
                            <div className="gm-search-input__suggestion-icon">
                                {getLocationIcon(suggestion.type)}
                            </div>
                            <div className="gm-search-input__suggestion-content">
                                <div className="gm-search-input__suggestion-name">
                                    {suggestion.name}
                                </div>
                                <div className="gm-search-input__suggestion-address">
                                    {suggestion.address}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MapSearchInput;