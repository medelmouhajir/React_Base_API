// =============================================================================
// ENHANCED MAP FILTERS HOOK - Viewport-based filtering with location awareness
// =============================================================================
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { mapDataService } from '../services/mapDataService';

export const useMapFilters = (userLocation = null, bounds = null) => {
    // Filter states
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [radiusKm, setRadiusKm] = useState(10);
    const [showBusinesses, setShowBusinesses] = useState(true);
    const [showEvents, setShowEvents] = useState(true);

    // Quick filters
    const [quickFilters, setQuickFilters] = useState({
        openNow: false,
        nearMe: false,
        popular: false,
        recentlyAdded: false,
        hasImages: false,
        freeEvents: false,
        todayEvents: false
    });

    // Data states
    const [businesses, setBusinesses] = useState([]);
    const [events, setEvents] = useState([]);
    const [tags, setTags] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetchParams, setLastFetchParams] = useState(null);

    // Cache states
    const [dataCache, setDataCache] = useState(new Map());
    const [lastFetchTime, setLastFetchTime] = useState(null);

    const abortControllerRef = useRef(null);
    const cacheTimeoutRef = useRef(null);

    // Debounced search query
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Cache configuration
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const DEBOUNCE_MS = 300;

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Generate cache key for current parameters
    const getCacheKey = useCallback((params) => {
        const { bounds, filters, location, radius } = params;
        return JSON.stringify({
            bounds: bounds ? {
                north: Math.round(bounds.north * 1000) / 1000,
                south: Math.round(bounds.south * 1000) / 1000,
                east: Math.round(bounds.east * 1000) / 1000,
                west: Math.round(bounds.west * 1000) / 1000
            } : null,
            filters,
            location: location ? {
                lat: Math.round(location.lat * 1000) / 1000,
                lng: Math.round(location.lng * 1000) / 1000
            } : null,
            radius
        });
    }, []);

    // Check if we have cached data for current parameters
    const getCachedData = useCallback((cacheKey) => {
        const cached = dataCache.get(cacheKey);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
        if (isExpired) {
            dataCache.delete(cacheKey);
            return null;
        }

        return cached.data;
    }, [dataCache, CACHE_DURATION]);

    // Cache data for future use
    const setCachedData = useCallback((cacheKey, data) => {
        setDataCache(prev => {
            const newCache = new Map(prev);
            newCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            // Limit cache size to 50 entries
            if (newCache.size > 50) {
                const firstKey = newCache.keys().next().value;
                newCache.delete(firstKey);
            }

            return newCache;
        });
    }, []);

    // Load map data based on current filters and bounds
    const loadMapData = useCallback(async (forceRefresh = false) => {
        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const params = {
            bounds,
            filters: {
                selectedTags,
                selectedCategories,
                searchQuery: debouncedSearchQuery,
                showBusinesses,
                showEvents,
                quickFilters
            },
            location: userLocation,
            radius: radiusKm
        };

        const cacheKey = getCacheKey(params);

        // Check cache first unless forcing refresh
        if (!forceRefresh) {
            const cachedData = getCachedData(cacheKey);
            if (cachedData) {
                setBusinesses(cachedData.businesses || []);
                setEvents(cachedData.events || []);
                setTags(cachedData.tags || []);
                setCategories(cachedData.categories || []);
                setLastFetchParams(params);
                return { success: true, fromCache: true };
            }
        }

        try {
            setLoading(true);
            setError(null);

            abortControllerRef.current = new AbortController();

            const result = await mapDataService.getMapData({
                ...params,
                signal: abortControllerRef.current.signal
            });

            if (result.success) {
                const { businesses = [], events = [], tags = [], categories = [] } = result.data;

                setBusinesses(businesses);
                setEvents(events);
                setTags(tags);
                setCategories(categories);
                setLastFetchParams(params);
                setLastFetchTime(Date.now());

                // Cache the results
                setCachedData(cacheKey, {
                    businesses,
                    events,
                    tags,
                    categories
                });

                return { success: true, fromCache: false };
            } else {
                throw new Error(result.error || 'Failed to load map data');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error loading map data:', err);
                setError(err.message || 'Failed to load map data');
            }
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, [
        bounds,
        selectedTags,
        selectedCategories,
        debouncedSearchQuery,
        showBusinesses,
        showEvents,
        quickFilters,
        userLocation,
        radiusKm,
        getCacheKey,
        getCachedData,
        setCachedData
    ]);

    // Debounced load data function
    const debouncedLoadData = useMemo(
        () => debounce(loadMapData, 500),
        [loadMapData]
    );

    // Auto-load data when dependencies change
    useEffect(() => {
        if (bounds || userLocation) {
            debouncedLoadData();
        }

        return () => {
            debouncedLoadData.cancel();
        };
    }, [debouncedLoadData, bounds, userLocation]);

    // Filter businesses based on current criteria
    const filteredBusinesses = useMemo(() => {
        let filtered = businesses;

        // Apply quick filters
        if (quickFilters.nearMe && userLocation) {
            filtered = filtered.filter(business => {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    business.latitude,
                    business.longitude
                );
                return distance <= radiusKm;
            });
        }

        if (quickFilters.popular) {
            filtered = filtered.filter(business =>
                business.averageRating >= 4 || business.commentCount >= 10
            );
        }

        if (quickFilters.recentlyAdded) {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(business =>
                new Date(business.createdAt) >= thirtyDaysAgo
            );
        }

        if (quickFilters.hasImages) {
            filtered = filtered.filter(business =>
                business.imagePath || business.logoPath
            );
        }

        // Apply tag filters
        if (selectedTags.length > 0) {
            filtered = filtered.filter(business =>
                business.tags?.some(tag => selectedTags.includes(tag.id))
            );
        }

        return filtered;
    }, [
        businesses,
        quickFilters,
        userLocation,
        radiusKm,
        selectedTags
    ]);

    // Filter events based on current criteria
    const filteredEvents = useMemo(() => {
        let filtered = events;

        // Apply quick filters
        if (quickFilters.nearMe && userLocation) {
            filtered = filtered.filter(event => {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    event.latitude,
                    event.longitude
                );
                return distance <= radiusKm;
            });
        }

        if (quickFilters.freeEvents) {
            filtered = filtered.filter(event =>
                !event.price || event.price === 0
            );
        }

        if (quickFilters.todayEvents) {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

            filtered = filtered.filter(event => {
                const eventStart = new Date(event.start);
                return eventStart >= todayStart && eventStart < todayEnd;
            });
        }

        // Apply category filters
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(event =>
                selectedCategories.includes(event.eventCategoryId)
            );
        }

        return filtered;
    }, [
        events,
        quickFilters,
        userLocation,
        radiusKm,
        selectedCategories
    ]);

    // Get available tags from current businesses
    const availableTags = useMemo(() => {
        const businessTags = businesses.flatMap(b => b.tags || []);
        const uniqueTags = businessTags.filter((tag, index, self) =>
            self.findIndex(t => t.id === tag.id) === index
        );
        return uniqueTags;
    }, [businesses]);

    // Get available categories from current events
    const availableCategories = useMemo(() => {
        const eventCategories = events.map(e => e.eventCategory).filter(Boolean);
        const uniqueCategories = eventCategories.filter((cat, index, self) =>
            self.findIndex(c => c.id === cat.id) === index
        );
        return uniqueCategories;
    }, [events]);

    // Tag management
    const toggleTag = useCallback((tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    }, []);

    const clearSelectedTags = useCallback(() => {
        setSelectedTags([]);
    }, []);

    // Category management
    const toggleCategory = useCallback((categoryId) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    }, []);

    const clearSelectedCategories = useCallback(() => {
        setSelectedCategories([]);
    }, []);

    // Quick filter management
    const toggleQuickFilter = useCallback((filterKey) => {
        setQuickFilters(prev => ({
            ...prev,
            [filterKey]: !prev[filterKey]
        }));
    }, []);

    const clearQuickFilters = useCallback(() => {
        setQuickFilters({
            openNow: false,
            nearMe: false,
            popular: false,
            recentlyAdded: false,
            hasImages: false,
            freeEvents: false,
            todayEvents: false
        });
    }, []);

    // Search management
    const updateSearchQuery = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSelectedTags([]);
        setSelectedCategories([]);
        setSearchQuery('');
        clearQuickFilters();
    }, [clearQuickFilters]);

    // Refresh data
    const refreshData = useCallback(() => {
        return loadMapData(true);
    }, [loadMapData]);

    // Filter summary
    const filterSummary = useMemo(() => {
        const activeFilters = [];

        if (selectedTags.length > 0) {
            activeFilters.push(`${selectedTags.length} tag(s)`);
        }

        if (selectedCategories.length > 0) {
            activeFilters.push(`${selectedCategories.length} category(ies)`);
        }

        if (debouncedSearchQuery.trim()) {
            activeFilters.push('search');
        }

        const activeQuickFilters = Object.values(quickFilters).filter(Boolean).length;
        if (activeQuickFilters > 0) {
            activeFilters.push(`${activeQuickFilters} quick filter(s)`);
        }

        return {
            hasActiveFilters: activeFilters.length > 0,
            activeFiltersCount: activeFilters.length,
            activeFiltersText: activeFilters.join(', '),
            filteredBusinessesCount: filteredBusinesses.length,
            filteredEventsCount: filteredEvents.length,
            totalBusinessesCount: businesses.length,
            totalEventsCount: events.length
        };
    }, [
        selectedTags.length,
        selectedCategories.length,
        debouncedSearchQuery,
        quickFilters,
        filteredBusinesses.length,
        filteredEvents.length,
        businesses.length,
        events.length
    ]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (cacheTimeoutRef.current) {
                clearTimeout(cacheTimeoutRef.current);
            }
            debouncedLoadData.cancel();
        };
    }, [debouncedLoadData]);

    return {
        // Data
        businesses: filteredBusinesses,
        events: filteredEvents,
        allBusinesses: businesses,
        allEvents: events,
        tags: availableTags,
        categories: availableCategories,
        allTags: tags,
        allCategories: categories,

        // States
        loading,
        error,
        searchQuery,
        debouncedSearchQuery,
        selectedTags,
        selectedCategories,
        quickFilters,
        radiusKm,
        showBusinesses,
        showEvents,

        // Actions
        loadMapData,
        refreshData,

        // Tag actions
        toggleTag,
        clearSelectedTags,

        // Category actions
        toggleCategory,
        clearSelectedCategories,

        // Quick filter actions
        toggleQuickFilter,
        clearQuickFilters,

        // Search actions
        updateSearchQuery,
        clearSearch,

        // Layer toggles
        setShowBusinesses,
        setShowEvents,

        // Radius management
        setRadiusKm,

        // General actions
        clearAllFilters,

        // Summary
        filterSummary,

        // Cache info
        lastFetchTime,
        cacheSize: dataCache.size,

        // Status
        hasData: businesses.length > 0 || events.length > 0,
        isDataFresh: lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION,
        hasLocation: userLocation !== null,
        hasBounds: bounds !== null
    };
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};