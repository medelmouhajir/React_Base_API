// =============================================================================
// MAP FILTERS HOOK
// =============================================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import { mapDataManager } from '../services/mapDataManager';

export const useMapFilters = () => {
    // Filter states
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapBounds, setMapBounds] = useState(null);
    const [centerLocation, setCenterLocation] = useState(null);
    const [radiusKm, setRadiusKm] = useState(10);

    // Data states
    const [businesses, setBusinesses] = useState([]);
    const [events, setEvents] = useState([]);
    const [tags, setTags] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debounced search query
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load initial data
    useEffect(() => {
        loadAllData();
    }, []);

    // Load all map data
    const loadAllData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await mapDataManager.getAllMapData();

            setBusinesses(data.businesses);
            setEvents(data.events);
            setTags(data.tags);
            setCategories(data.categories);
        } catch (err) {
            console.error('Error loading map data:', err);
            setError(err.message || 'Failed to load map data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Refresh data
    const refreshData = useCallback(async (type = null) => {
        try {
            setLoading(true);

            if (type) {
                const refreshedData = await mapDataManager.refreshData(type);
                switch (type) {
                    case 'businesses':
                        setBusinesses(refreshedData);
                        break;
                    case 'events':
                        setEvents(refreshedData);
                        break;
                    case 'tags':
                        setTags(refreshedData);
                        break;
                    case 'categories':
                        setCategories(refreshedData);
                        break;
                }
            } else {
                await loadAllData();
            }
        } catch (err) {
            console.error('Error refreshing data:', err);
            setError(err.message || 'Failed to refresh data');
        } finally {
            setLoading(false);
        }
    }, [loadAllData]);

    // Filter businesses based on current filters
    const filteredBusinesses = useMemo(() => {
        let filtered = [...businesses];

        // Filter by selected tags
        if (selectedTags.length > 0) {
            filtered = mapDataManager.filterBusinessesByTags(filtered, selectedTags);
        }

        // Filter by search query
        if (debouncedSearchQuery.trim()) {
            filtered = mapDataManager.searchBusinesses(filtered, debouncedSearchQuery);
        }

        // Filter by map bounds
        if (mapBounds) {
            filtered = mapDataManager.getItemsInBounds(filtered, mapBounds);
        }

        // Filter by radius if center location is set
        if (centerLocation && radiusKm > 0) {
            filtered = mapDataManager.getNearbyItems(
                filtered,
                centerLocation.lat,
                centerLocation.lng,
                radiusKm
            );
        }

        return filtered;
    }, [businesses, selectedTags, debouncedSearchQuery, mapBounds, centerLocation, radiusKm]);

    // Filter events based on current filters
    const filteredEvents = useMemo(() => {
        let filtered = [...events];

        // Filter by selected categories
        if (selectedCategories.length > 0) {
            filtered = mapDataManager.filterEventsByCategories(filtered, selectedCategories);
        }

        // Filter by search query
        if (debouncedSearchQuery.trim()) {
            filtered = mapDataManager.searchEvents(filtered, debouncedSearchQuery);
        }

        // Filter by map bounds
        if (mapBounds) {
            filtered = mapDataManager.getItemsInBounds(filtered, mapBounds);
        }

        // Filter by radius if center location is set
        if (centerLocation && radiusKm > 0) {
            filtered = mapDataManager.getNearbyItems(
                filtered,
                centerLocation.lat,
                centerLocation.lng,
                radiusKm
            );
        }

        return filtered;
    }, [events, selectedCategories, debouncedSearchQuery, mapBounds, centerLocation, radiusKm]);

    // Get available tags (only tags that have businesses)
    const availableTags = useMemo(() => {
        return tags.filter(tag => tag.businessCount > 0);
    }, [tags]);

    // Get available categories (only categories that have events)
    const availableCategories = useMemo(() => {
        return categories.filter(category => category.eventCount > 0);
    }, [categories]);

    // Tag selection handlers
    const selectTag = useCallback((tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev : [...prev, tagId]
        );
    }, []);

    const deselectTag = useCallback((tagId) => {
        setSelectedTags(prev => prev.filter(id => id !== tagId));
    }, []);

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

    // Category selection handlers
    const selectCategory = useCallback((categoryId) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId) ? prev : [...prev, categoryId]
        );
    }, []);

    const deselectCategory = useCallback((categoryId) => {
        setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }, []);

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

    // Search handlers
    const updateSearchQuery = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Map bounds handlers
    const updateMapBounds = useCallback((bounds) => {
        setMapBounds(bounds);
    }, []);

    const clearMapBounds = useCallback(() => {
        setMapBounds(null);
    }, []);

    // Location and radius handlers
    const updateCenterLocation = useCallback((location) => {
        setCenterLocation(location);
    }, []);

    const updateRadius = useCallback((radius) => {
        setRadiusKm(radius);
    }, []);

    const clearLocationFilter = useCallback(() => {
        setCenterLocation(null);
        setRadiusKm(10);
    }, []);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setSelectedTags([]);
        setSelectedCategories([]);
        setSearchQuery('');
        setMapBounds(null);
        setCenterLocation(null);
        setRadiusKm(10);
    }, []);

    // Get filter summary
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

        if (mapBounds) {
            activeFilters.push('map bounds');
        }

        if (centerLocation) {
            activeFilters.push(`radius (${radiusKm}km)`);
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
        mapBounds,
        centerLocation,
        radiusKm,
        filteredBusinesses.length,
        filteredEvents.length,
        businesses.length,
        events.length
    ]);

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
        mapBounds,
        centerLocation,
        radiusKm,

        // Actions
        loadAllData,
        refreshData,

        // Tag actions
        selectTag,
        deselectTag,
        toggleTag,
        clearSelectedTags,

        // Category actions
        selectCategory,
        deselectCategory,
        toggleCategory,
        clearSelectedCategories,

        // Search actions
        updateSearchQuery,
        clearSearch,

        // Map actions
        updateMapBounds,
        clearMapBounds,
        updateCenterLocation,
        updateRadius,
        clearLocationFilter,

        // General actions
        clearAllFilters,

        // Summary
        filterSummary
    };
};

export default useMapFilters;