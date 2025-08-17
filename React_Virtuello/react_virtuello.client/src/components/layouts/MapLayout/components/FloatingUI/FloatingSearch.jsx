// =============================================================================
// FLOATING SEARCH COMPONENT - Modern floating search with autocomplete
// =============================================================================
import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import { mapDataService } from '../../services/mapDataService';
import { locationService } from '../../services/locationService';
import { MAP_CONFIG } from '../../utils/mapConstants';
import './FloatingSearch.css';

const FloatingSearch = forwardRef(({
    value = '',
    onChange = () => { },
    onLocationSelect = () => { },
    onBusinessSelect = () => { },
    onEventSelect = () => { },
    onFocus = () => { },
    onBlur = () => { },
    placeholder,
    className = '',
    position = 'top-left', // 'top-left', 'top-center', 'top-right'
    showVoiceSearch = true,
    showLocationButton = true,
    autoFocus = false,
    maxSuggestions = 8,
    includeRecentSearches = true,
    disabled = false
}, ref) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [voiceListening, setVoiceListening] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const recognitionRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Load recent searches from localStorage
    useEffect(() => {
        if (includeRecentSearches) {
            const saved = localStorage.getItem('map-recent-searches');
            if (saved) {
                try {
                    setRecentSearches(JSON.parse(saved));
                } catch (e) {
                    console.warn('Failed to parse recent searches:', e);
                }
            }
        }
    }, [includeRecentSearches]);

    // Auto focus if requested
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [autoFocus]);

    // Debounced search function
    const debouncedSearch = useMemo(
        () => debounce(async (searchQuery) => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSuggestions([]);
                setShowDropdown(false);
                return;
            }

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new abort controller
            abortControllerRef.current = new AbortController();

            try {
                setIsLoading(true);

                // Search for businesses and events
                const results = await mapDataService.searchSuggestions({
                    query: searchQuery,
                    maxResults: maxSuggestions - 2, // Leave space for recent searches
                    signal: abortControllerRef.current.signal
                });

                const formattedSuggestions = [
                    // Recent searches matching query
                    ...recentSearches
                        .filter(recent =>
                            recent.toLowerCase().includes(searchQuery.toLowerCase()) &&
                            recent.toLowerCase() !== searchQuery.toLowerCase()
                        )
                        .slice(0, 2)
                        .map(recent => ({
                            id: `recent-${recent}`,
                            type: 'recent',
                            text: recent,
                            icon: 'clock'
                        })),

                    // Business suggestions
                    ...results.businesses.map(business => ({
                        id: `business-${business.id}`,
                        type: 'business',
                        text: business.name,
                        subtitle: business.address,
                        icon: 'store',
                        data: business
                    })),

                    // Event suggestions
                    ...results.events.map(event => ({
                        id: `event-${event.id}`,
                        type: 'event',
                        text: event.name,
                        subtitle: formatEventDate(event.startDate),
                        icon: 'calendar',
                        data: event
                    })),

                    // Location suggestions
                    ...results.locations?.map(location => ({
                        id: `location-${location.id}`,
                        type: 'location',
                        text: location.name,
                        subtitle: location.address,
                        icon: 'map-pin',
                        data: location
                    })) || []
                ];

                setSuggestions(formattedSuggestions.slice(0, maxSuggestions));
                setShowDropdown(formattedSuggestions.length > 0);
                setSelectedIndex(-1);

            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Search error:', error);
                    setSuggestions([]);
                    setShowDropdown(false);
                }
            } finally {
                setIsLoading(false);
            }
        }, 300),
        [maxSuggestions, recentSearches]
    );

    // Handle input change
    const handleInputChange = useCallback((e) => {
        const newValue = e.target.value;
        onChange(newValue);
        debouncedSearch(newValue);
    }, [onChange, debouncedSearch]);

    // Handle input focus
    const handleInputFocus = useCallback(() => {
        setIsFocused(true);
        onFocus();

        // Show recent searches if no value
        if (!value.trim() && recentSearches.length > 0) {
            const recentSuggestions = recentSearches.slice(0, 5).map(recent => ({
                id: `recent-${recent}`,
                type: 'recent',
                text: recent,
                icon: 'clock'
            }));
            setSuggestions(recentSuggestions);
            setShowDropdown(true);
        }
    }, [value, recentSearches, onFocus]);

    // Handle input blur
    const handleInputBlur = useCallback(() => {
        // Delay blur to allow suggestion click
        setTimeout(() => {
            setIsFocused(false);
            setShowDropdown(false);
            setSelectedIndex(-1);
            onBlur();
        }, 200);
    }, [onBlur]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (!showDropdown || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSuggestionSelect(suggestions[selectedIndex]);
                } else if (value.trim()) {
                    handleSearchSubmit(value);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    }, [showDropdown, suggestions, selectedIndex, value]);

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback((suggestion) => {
        onChange(suggestion.text);
        setShowDropdown(false);
        setSelectedIndex(-1);

        // Add to recent searches
        if (suggestion.type !== 'recent' && includeRecentSearches) {
            const newRecent = [
                suggestion.text,
                ...recentSearches.filter(r => r !== suggestion.text)
            ].slice(0, 10);
            setRecentSearches(newRecent);
            localStorage.setItem('map-recent-searches', JSON.stringify(newRecent));
        }

        // Handle different suggestion types
        switch (suggestion.type) {
            case 'business':
                onBusinessSelect(suggestion.data);
                break;
            case 'event':
                onEventSelect(suggestion.data);
                break;
            case 'location':
                onLocationSelect(suggestion.data);
                break;
            case 'recent':
                debouncedSearch(suggestion.text);
                break;
        }
    }, [onChange, includeRecentSearches, recentSearches, onBusinessSelect, onEventSelect, onLocationSelect, debouncedSearch]);

    // Handle search submit
    const handleSearchSubmit = useCallback((query) => {
        if (!query.trim()) return;

        // Add to recent searches
        if (includeRecentSearches) {
            const newRecent = [
                query,
                ...recentSearches.filter(r => r !== query)
            ].slice(0, 10);
            setRecentSearches(newRecent);
            localStorage.setItem('map-recent-searches', JSON.stringify(newRecent));
        }

        // Trigger search
        onChange(query);
    }, [includeRecentSearches, recentSearches, onChange]);

    // Handle voice search
    const handleVoiceSearch = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert(t('search.voiceNotSupported', 'Voice search is not supported in this browser'));
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setVoiceListening(true);
        };

        recognitionRef.current.onresult = (event) => {
            const result = event.results[0][0].transcript;
            onChange(result);
            debouncedSearch(result);
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setVoiceListening(false);
        };

        recognitionRef.current.onend = () => {
            setVoiceListening(false);
        };

        recognitionRef.current.start();
    }, [onChange, debouncedSearch, t]);

    // Handle current location
    const handleCurrentLocation = useCallback(async () => {
        try {
            setGettingLocation(true);
            const result = await locationService.getCurrentLocation();

            if (result.success) {
                const { lat, lng } = result.location;

                // Reverse geocode to get address
                const address = await locationService.reverseGeocode(lat, lng);
                if (address.success) {
                    onChange(address.address);
                    onLocationSelect({
                        lat,
                        lng,
                        address: address.address,
                        isCurrentLocation: true
                    });
                }
            } else {
                console.error('Failed to get location:', result.error);
            }
        } catch (error) {
            console.error('Location error:', error);
        } finally {
            setGettingLocation(false);
        }
    }, [onChange, onLocationSelect]);

    // Clear search
    const handleClear = useCallback(() => {
        onChange('');
        setSuggestions([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        inputRef.current?.focus();
    }, [onChange]);

    // Format event date for suggestions
    const formatEventDate = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

        if (isToday) return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        if (isTomorrow) return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    // Get icon for suggestion type
    const getIcon = useCallback((iconType) => {
        const icons = {
            store: '🏪',
            calendar: '📅',
            'map-pin': '📍',
            clock: '🕒',
            search: '🔍'
        };
        return icons[iconType] || icons.search;
    }, []);

    // Click outside handler
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

    return (
        <div ref={ref} className={`floating-search ${className} floating-search--${position} ${isFocused ? 'floating-search--focused' : ''}`}>
            <div className="floating-search__container">
                {/* Main search input */}
                <div className="floating-search__input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || t('search.placeholder', 'Search businesses, events, places...')}
                        className="floating-search__input"
                        disabled={disabled}
                        autoComplete="off"
                        spellCheck="false"
                    />

                    {/* Search icon */}
                    <div className="floating-search__icon">
                        {isLoading ? (
                            <div className="floating-search__spinner">
                                <div className="spinner-ring"></div>
                            </div>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M21 21L16.514 16.506M19 10.5A8.5 8.5 0 1110.5 2a8.5 8.5 0 018.5 8.5z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </div>

                    {/* Clear button */}
                    {value && !isLoading && (
                        <button
                            type="button"
                            className="floating-search__clear"
                            onClick={handleClear}
                            aria-label={t('common.clear', 'Clear')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M18 6L6 18M6 6l12 12"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}

                    {/* Voice search button */}
                    {showVoiceSearch && (
                        <button
                            type="button"
                            className={`floating-search__voice ${voiceListening ? 'floating-search__voice--listening' : ''}`}
                            onClick={handleVoiceSearch}
                            disabled={voiceListening}
                            aria-label={t('search.voiceSearch', 'Voice search')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                                    fill="currentColor"
                                />
                                <path
                                    d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}

                    {/* Current location button */}
                    {showLocationButton && (
                        <button
                            type="button"
                            className={`floating-search__location ${gettingLocation ? 'floating-search__location--loading' : ''}`}
                            onClick={handleCurrentLocation}
                            disabled={gettingLocation}
                            aria-label={t('search.currentLocation', 'Current location')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                <path
                                    d="M12 1v6m0 6v6m11-7h-6m-6 0H1"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Suggestions dropdown */}
                {showDropdown && suggestions.length > 0 && (
                    <div ref={dropdownRef} className="floating-search__dropdown">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={suggestion.id}
                                className={`floating-search__suggestion ${index === selectedIndex ? 'floating-search__suggestion--selected' : ''}`}
                                onClick={() => handleSuggestionSelect(suggestion)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="floating-search__suggestion-icon">
                                    {getIcon(suggestion.icon)}
                                </div>
                                <div className="floating-search__suggestion-content">
                                    <div className="floating-search__suggestion-text">
                                        {suggestion.text}
                                    </div>
                                    {suggestion.subtitle && (
                                        <div className="floating-search__suggestion-subtitle">
                                            {suggestion.subtitle}
                                        </div>
                                    )}
                                </div>
                                {suggestion.type === 'recent' && (
                                    <div className="floating-search__suggestion-label">
                                        {t('search.recent', 'Recent')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

FloatingSearch.displayName = 'FloatingSearch';

export default FloatingSearch;