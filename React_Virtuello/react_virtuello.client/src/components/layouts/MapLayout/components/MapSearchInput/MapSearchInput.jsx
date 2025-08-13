import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './MapSearchInput.css';

const MapSearchInput = ({
    onLocationSelect,
    onResults,
    onToggleSidebar,
    onToggleTags,
    isSidebarOpen = false,
    isTagsPanelVisible = false,
    placeholder,
    autoFocus = false,
    minSearchLength = 2,
    debounceDelay = 300,
    className = '',
    isMobile = false
}) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Mock suggestions for demo (replace with actual API call)
    const mockSuggestions = [
        { id: 1, name: 'Restaurant Le Saveur', address: 'Boulevard Mohammed V, Casablanca', type: 'restaurant', coordinates: [33.5731, -7.5898] },
        { id: 2, name: 'Hotel Hyatt Regency', address: 'Place des Nations Unies, Casablanca', type: 'hotel', coordinates: [33.5890, -7.6114] },
        { id: 3, name: 'Café Central', address: 'Rue Prince Moulay Abdellah, Casablanca', type: 'cafe', coordinates: [33.5928, -7.6187] },
        { id: 4, name: 'Morocco Mall', address: 'Boulevard de la Corniche, Casablanca', type: 'shop', coordinates: [33.5423, -7.6700] },
        { id: 5, name: 'Hassan II Mosque', address: 'Boulevard Sidi Mohammed Ben Abdellah, Casablanca', type: 'attraction', coordinates: [33.6080, -7.6333] }
    ];

    // Search function with debouncing
    useEffect(() => {
        if (query.length >= minSearchLength) {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                performSearch(query);
            }, debounceDelay);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, minSearchLength, debounceDelay]);

    const performSearch = async (searchQuery) => {
        setIsLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Filter mock suggestions based on query
            const filtered = mockSuggestions.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.address.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setSuggestions(filtered);
            setShowDropdown(filtered.length > 0 && isFocused);
        } catch (error) {
            console.error('Search error:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (!showDropdown) return;

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
            restaurant: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
                </svg>
            ),
            hotel: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V6H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
                </svg>
            ),
            cafe: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM2 21h18v-2H2v2z" />
                </svg>
            ),
            shop: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 7h-1V6a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM8 6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1H8V6zm10 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                </svg>
            ),
            attraction: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ),
            default: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
            )
        };
        return icons[type] || icons.default;
    };

    return (
        <div className={`virtuello-search-input ${className} ${isMobile ? 'virtuello-search-input--mobile' : 'virtuello-search-input--desktop'}`}>
            {/* Search Input Container */}
            <div className={`virtuello-search-input__container ${isFocused ? 'virtuello-search-input__container--focused' : ''}`}>
                {/* Sidebar Toggle Button */}
                <button
                    className={`virtuello-search-input__sidebar-btn ${isSidebarOpen ? 'virtuello-search-input__sidebar-btn--active' : ''}`}
                    onClick={onToggleSidebar}
                    aria-label={t('map.toggle_sidebar')}
                    title={isSidebarOpen ? t('map.close_sidebar') : t('map.open_sidebar')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                    </svg>
                </button>

                {/* Search Icon */}
                <div className="virtuello-search-input__search-icon">
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
                    placeholder={placeholder || t('map.search_places')}
                    className="virtuello-search-input__input"
                    autoComplete="off"
                    autoFocus={autoFocus}
                    aria-label={t('map.search_places')}
                    aria-expanded={showDropdown}
                    aria-haspopup="listbox"
                    role="combobox"
                />

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="virtuello-search-input__loading">
                        <svg className="virtuello-search-input__spinner" width="20" height="20" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                                <animate attributeName="strokeDashoffset" dur="1s" values="32;0" repeatCount="indefinite" />
                            </circle>
                        </svg>
                    </div>
                )}

                {/* Clear Button */}
                {query && !isLoading && (
                    <button
                        className="virtuello-search-input__clear"
                        onClick={handleClear}
                        aria-label={t('common.clear')}
                        title={t('common.clear')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                )}

                {/* Map Tags Toggle Button */}
                <button
                    className={`virtuello-search-input__tags-btn ${isTagsPanelVisible ? 'virtuello-search-input__tags-btn--active' : ''}`}
                    onClick={onToggleTags}
                    aria-label={t('map.toggle_tags')}
                    title={isTagsPanelVisible ? t('map.hide_tags') : t('map.show_tags')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" />
                    </svg>
                    {!isMobile && (
                        <span className="virtuello-search-input__tags-text">
                            {t('map.tags')}
                        </span>
                    )}
                </button>
            </div>

            {/* Search Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
                <div className="virtuello-search-input__dropdown" role="listbox">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.id}
                            className={`virtuello-search-input__suggestion ${index === selectedIndex ? 'virtuello-search-input__suggestion--selected' : ''
                                }`}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            role="option"
                            aria-selected={index === selectedIndex}
                        >
                            <div className="virtuello-search-input__suggestion-icon">
                                {getLocationIcon(suggestion.type)}
                            </div>
                            <div className="virtuello-search-input__suggestion-content">
                                <div className="virtuello-search-input__suggestion-name">
                                    {suggestion.name}
                                </div>
                                <div className="virtuello-search-input__suggestion-address">
                                    {suggestion.address}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results Message */}
            {showDropdown && suggestions.length === 0 && query.length >= minSearchLength && !isLoading && (
                <div className="virtuello-search-input__dropdown">
                    <div className="virtuello-search-input__no-results">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginBottom: '8px', opacity: 0.5 }}>
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <div>{t('map.no_results_found')}</div>
                        <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px', opacity: 0.7 }}>
                            {t('map.try_different_search')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapSearchInput;