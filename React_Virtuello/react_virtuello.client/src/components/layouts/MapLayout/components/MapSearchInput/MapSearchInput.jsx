import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './MapSearchInput.css';

const MapSearchInput = ({
    onResults,
    onLocationSelect,
    onToggleSidebar,
    isSidebarOpen = false,
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
                    address: 'Fes, Morocco',
                    lat: 34.0522 + Math.random() * 0.01,
                    lng: -6.7736 + Math.random() * 0.01,
                    type: 'restaurant'
                },
                {
                    id: 2,
                    name: `Hotel ${searchQuery}`,
                    address: 'Medina, Fes',
                    lat: 34.0622 + Math.random() * 0.01,
                    lng: -6.7636 + Math.random() * 0.01,
                    type: 'hotel'
                },
                {
                    id: 3,
                    name: `Cafe ${searchQuery}`,
                    address: 'Ville Nouvelle, Fes',
                    lat: 34.0422 + Math.random() * 0.01,
                    lng: -6.7836 + Math.random() * 0.01,
                    type: 'cafe'
                }
            ].slice(0, maxResults);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 200));

            if (!controller.signal.aborted) {
                return mockResults;
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Search error:', error);
            }
        }
        return [];
    }, [maxResults]);

    // Debounced search
    const performSearch = useCallback(async (searchQuery) => {
        if (searchQuery.length < minSearchLength) {
            setSuggestions([]);
            setShowDropdown(false);
            if (onResults) onResults([]);
            return;
        }

        setIsLoading(true);

        try {
            const results = await searchLocations(searchQuery);
            setSuggestions(results || []);
            setShowDropdown(showSuggestions && (results?.length > 0));
            if (onResults) onResults(results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setSuggestions([]);
            setShowDropdown(false);
        } finally {
            setIsLoading(false);
        }
    }, [searchLocations, minSearchLength, showSuggestions, onResults]);

    // Handle input change with debouncing
    const handleInputChange = useCallback((event) => {
        const value = event.target.value;
        setQuery(value);
        setSelectedIndex(-1);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new debounce
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, debounceMs);
    }, [performSearch, debounceMs]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event) => {
        if (!showDropdown || suggestions.length === 0) {
            if (event.key === 'Enter' && query.trim()) {
                performSearch(query);
            }
            return;
        }

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
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSuggestionSelect(suggestions[selectedIndex]);
                } else if (query.trim()) {
                    performSearch(query);
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
    }, [showDropdown, suggestions, selectedIndex, query, performSearch]);

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback((suggestion) => {
        setQuery(suggestion.name);
        setShowDropdown(false);
        setSelectedIndex(-1);

        if (onLocationSelect) {
            onLocationSelect({
                lat: suggestion.lat,
                lng: suggestion.lng,
                name: suggestion.name,
                address: suggestion.address,
                id: suggestion.id,
                type: suggestion.type
            });
        }

        inputRef.current?.blur();
    }, [onLocationSelect]);

    // Handle clear
    const handleClear = useCallback(() => {
        setQuery('');
        setSuggestions([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        if (onResults) onResults([]);
        inputRef.current?.focus();
    }, [onResults]);

    // Handle focus
    const handleFocus = useCallback(() => {
        setIsFocused(true);
        if (suggestions.length > 0 && showSuggestions) {
            setShowDropdown(true);
        }
    }, [suggestions.length, showSuggestions]);

    // Handle blur
    const handleBlur = useCallback(() => {
        setIsFocused(false);
        // Delay hiding dropdown to allow click on suggestions
        setTimeout(() => {
            setShowDropdown(false);
            setSelectedIndex(-1);
        }, 150);
    }, []);

    // Close dropdown on outside click
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

    // Auto focus
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const getLocationIcon = (type) => {
        switch (type) {
            case 'restaurant':
                return '🍽️';
            case 'hotel':
                return '🏨';
            case 'cafe':
                return '☕';
            default:
                return '📍';
        }
    };

    return (
        <div className={`map-search-input ${className}`}>
            <div className="map-search-input__container">
                {/* Sidebar Toggle Button */}
                {onToggleSidebar && (
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className={`map-search-input__sidebar-toggle ${isSidebarOpen ? 'active' : ''}`}
                        aria-label={isSidebarOpen ? t('map.close_sidebar') : t('map.open_sidebar')}
                        title={isSidebarOpen ? t('map.close_sidebar') : t('map.open_sidebar')}
                    >
                        <svg
                            className="map-search-input__sidebar-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <rect x="3" y="4" width="18" height="4" rx="1" fill="currentColor" />
                            <rect x="3" y="10" width="18" height="4" rx="1" fill="currentColor" />
                            <rect x="3" y="16" width="18" height="4" rx="1" fill="currentColor" />
                        </svg>
                    </button>
                )}

                {/* Search Input */}
                <div className="map-search-input__input-wrapper">
                    <div className="map-search-input__input-container">
                        <svg
                            className="map-search-input__search-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>

                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder={placeholder || t('map.search_placeholder')}
                            className="map-search-input__input"
                            aria-label={t('map.search_aria_label')}
                            aria-expanded={showDropdown}
                            aria-haspopup="listbox"
                            aria-autocomplete="list"
                            role="combobox"
                        />

                        {/* Loading Spinner */}
                        {isLoading && (
                            <div className="map-search-input__loading">
                                <div className="spinner" aria-label={t('common.loading')}></div>
                            </div>
                        )}

                        {/* Clear Button */}
                        {query && !isLoading && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="map-search-input__clear"
                                aria-label={t('common.clear')}
                                title={t('common.clear')}
                            >
                                <svg
                                    width="16"
                                    height="16"
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

                    {/* Suggestions Dropdown */}
                    {showDropdown && suggestions.length > 0 && (
                        <div
                            ref={dropdownRef}
                            className="map-search-input__dropdown"
                            role="listbox"
                            aria-label={t('map.search_suggestions')}
                        >
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={suggestion.id}
                                    className={`map-search-input__suggestion ${index === selectedIndex ? 'selected' : ''
                                        }`}
                                    role="option"
                                    aria-selected={index === selectedIndex}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className="map-search-input__suggestion-icon">
                                        {getLocationIcon(suggestion.type)}
                                    </div>
                                    <div className="map-search-input__suggestion-content">
                                        <div className="map-search-input__suggestion-name">
                                            {suggestion.name}
                                        </div>
                                        {suggestion.address && (
                                            <div className="map-search-input__suggestion-address">
                                                {suggestion.address}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapSearchInput;