/**
 * SearchBox Component - Map Search Functionality
 * Provides autocomplete search for businesses, events, and locations
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGeolocation } from '../Hooks/useGeolocation';
import { mapService } from '../Services/MapService';
import './searchbox.css';

const SearchBox = ({
    onSearch,
    onResultSelect,
    placeholder = "Search businesses, events, locations...",
    enableAutocomplete = true,
    enableGeocoding = true,
    maxResults = 8,
    debounceDelay = 300,
    className = '',
    theme = 'light',
    isLoading = false
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);

    // Refs
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const debounceRef = useRef(null);
    const searchControllerRef = useRef(null);

    // Hooks
    const { getCurrentPosition } = useGeolocation();

    // =============================================================================
    // SEARCH FUNCTIONALITY
    // =============================================================================

    /**
     * Perform search with debouncing
     */
    const performSearch = useCallback(async (searchQuery) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);

        try {
            // Cancel previous search
            if (searchControllerRef.current) {
                searchControllerRef.current.abort();
            }

            searchControllerRef.current = new AbortController();

            // Get user location for nearby search
            let userLocation = null;
            try {
                userLocation = await getCurrentPosition();
            } catch (error) {
                console.warn('[SearchBox] Could not get user location:', error);
            }

            // Prepare search promises
            const searchPromises = [];

            // Search businesses
            if (enableAutocomplete) {
                searchPromises.push(
                    mapService.getBusinessesInBounds({
                        bounds: userLocation ? {
                            north: userLocation.lat + 0.1,
                            south: userLocation.lat - 0.1,
                            east: userLocation.lng + 0.1,
                            west: userLocation.lng - 0.1
                        } : {
                            north: 34.1,
                            south: 34.0,
                            east: -6.7,
                            west: -6.8
                        },
                        filters: { search: searchQuery },
                        signal: searchControllerRef.current.signal
                    }).then(response => response.data || [])
                );

                // Search events
                searchPromises.push(
                    mapService.getEventsInBounds({
                        bounds: userLocation ? {
                            north: userLocation.lat + 0.1,
                            south: userLocation.lat - 0.1,
                            east: userLocation.lng + 0.1,
                            west: userLocation.lng - 0.1
                        } : {
                            north: 34.1,
                            south: 34.0,
                            east: -6.7,
                            west: -6.8
                        },
                        filters: { search: searchQuery },
                        signal: searchControllerRef.current.signal
                    }).then(response => response.data || [])
                );
            }

            // Execute searches
            const searchResults = await Promise.allSettled(searchPromises);

            // Process results
            const businesses = searchResults[0]?.status === 'fulfilled' ? searchResults[0].value : [];
            const events = searchResults[1]?.status === 'fulfilled' ? searchResults[1].value : [];

            // Combine and format results
            const combinedResults = [
                ...businesses.slice(0, Math.floor(maxResults / 2)).map(business => ({
                    id: `business-${business.id}`,
                    type: 'business',
                    title: business.name,
                    subtitle: business.address,
                    description: business.description,
                    coordinates: { lat: business.latitude, lng: business.longitude },
                    data: business,
                    icon: '🏢'
                })),
                ...events.slice(0, Math.floor(maxResults / 2)).map(event => ({
                    id: `event-${event.id}`,
                    type: 'event',
                    title: event.name,
                    subtitle: event.address,
                    description: event.description,
                    coordinates: { lat: event.latitude, lng: event.longitude },
                    data: event,
                    icon: '📅'
                }))
            ].slice(0, maxResults);

            // Add geocoding result if enabled and no exact matches
            if (enableGeocoding && combinedResults.length < maxResults) {
                try {
                    // TODO: Implement geocoding service call
                    // const geocodeResults = await geocodingService.search(searchQuery);
                    // Add geocoded locations to results
                } catch (error) {
                    console.warn('[SearchBox] Geocoding failed:', error);
                }
            }

            setResults(combinedResults);
            setShowResults(combinedResults.length > 0);
            setSelectedIndex(-1);

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('[SearchBox] Search failed:', error);
                setResults([]);
                setShowResults(false);
            }
        } finally {
            setIsSearching(false);
        }
    }, [enableAutocomplete, enableGeocoding, maxResults, getCurrentPosition]);

    /**
     * Handle input change with debouncing
     */
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setQuery(value);

        // Clear existing timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new timeout for debounced search
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, debounceDelay);

        // Call parent search handler immediately for other purposes
        if (onSearch) {
            onSearch(value);
        }
    }, [performSearch, debounceDelay, onSearch]);

    /**
     * Handle result selection
     */
    const handleResultSelect = useCallback((result) => {
        setQuery(result.title);
        setShowResults(false);
        setSelectedIndex(-1);

        // Add to search history
        setSearchHistory(prev => {
            const newHistory = [result, ...prev.filter(item => item.id !== result.id)];
            return newHistory.slice(0, 10); // Keep last 10 searches
        });

        // Call parent handler
        if (onResultSelect) {
            onResultSelect(result);
        }

        // Blur input
        if (inputRef.current) {
            inputRef.current.blur();
        }
    }, [onResultSelect]);

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback((e) => {
        e.preventDefault();

        if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultSelect(results[selectedIndex]);
        } else if (query.trim()) {
            // Trigger search with current query
            if (onSearch) {
                onSearch(query.trim());
            }
            setShowResults(false);
        }
    }, [selectedIndex, results, query, handleResultSelect, onSearch]);

    /**
     * Handle keyboard navigation
     */
    const handleKeyDown = useCallback((e) => {
        if (!showResults || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev <= 0 ? results.length - 1 : prev - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleResultSelect(results[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowResults(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    }, [showResults, results, selectedIndex, handleResultSelect]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        setQuery('');
        setResults([]);
        setShowResults(false);
        setSelectedIndex(-1);

        if (onSearch) {
            onSearch('');
        }

        inputRef.current?.focus();
    }, [onSearch]);

    // =============================================================================
    // EFFECTS
    // =============================================================================

    // Handle clicks outside to close results
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (resultsRef.current && !resultsRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowResults(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            if (searchControllerRef.current) {
                searchControllerRef.current.abort();
            }
        };
    }, []);

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================

    const renderResults = () => {
        if (!showResults || results.length === 0) return null;

        return (
            <div ref={resultsRef} className="search-box__results">
                {results.map((result, index) => (
                    <div
                        key={result.id}
                        className={`search-box__result ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleResultSelect(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className="search-box__result-icon">
                            {result.icon}
                        </div>
                        <div className="search-box__result-content">
                            <div className="search-box__result-title">
                                {result.title}
                            </div>
                            <div className="search-box__result-subtitle">
                                {result.subtitle}
                            </div>
                            {result.description && (
                                <div className="search-box__result-description">
                                    {result.description}
                                </div>
                            )}
                        </div>
                        <div className="search-box__result-type">
                            {result.type}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <div className={`search-box ${className} search-box--${theme}`}>
            <form onSubmit={handleSubmit} className="search-box__form">
                <div className="search-box__input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (results.length > 0) {
                                setShowResults(true);
                            }
                        }}
                        placeholder={placeholder}
                        className="search-box__input"
                        disabled={isLoading}
                        autoComplete="off"
                        spellCheck="false"
                        aria-label="Search"
                        aria-expanded={showResults}
                        aria-haspopup="listbox"
                        role="combobox"
                    />

                    {/* Clear button */}
                    {query && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="search-box__clear"
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}

                    {/* Search button / Loading indicator */}
                    <button
                        type="submit"
                        className="search-box__submit"
                        disabled={isLoading || isSearching}
                        aria-label="Search"
                    >
                        {isLoading || isSearching ? (
                            <div className="search-box__loading-spinner"></div>
                        ) : (
                            '🔍'
                        )}
                    </button>
                </div>
            </form>

            {/* Search results dropdown */}
            {renderResults()}

            {/* Search status */}
            {isSearching && (
                <div className="search-box__status">
                    Searching...
                </div>
            )}
        </div>
    );
};

export default SearchBox;