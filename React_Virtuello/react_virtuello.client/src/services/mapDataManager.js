// =============================================================================
// MAP DATA MANAGER SERVICE
// =============================================================================
import { businessService } from './businessService';
import { eventService } from './eventService';
import { tagService } from './tagService';
import { eventCategoriesService } from './eventCategoriesService';

export const mapDataManager = {
    // Cache for performance
    cache: {
        businesses: null,
        events: null,
        tags: null,
        categories: null,
        lastFetch: {
            businesses: null,
            events: null,
            tags: null,
            categories: null
        }
    },

    // Cache duration in milliseconds (5 minutes)
    CACHE_DURATION: 5 * 60 * 1000,

    // Check if cache is valid
    isCacheValid(type) {
        const lastFetch = this.cache.lastFetch[type];
        if (!lastFetch) return false;
        return Date.now() - lastFetch < this.CACHE_DURATION;
    },

    // Get all businesses with their tags
    async getBusinessesWithTags() {
        try {
            if (this.isCacheValid('businesses') && this.cache.businesses) {
                return this.cache.businesses;
            }

            const [businessesResponse, tagsResponse] = await Promise.all([
                businessService.getAll(1, 1000), // Get all businesses
                tagService.getAll()
            ]);

            if (!businessesResponse.success || !tagsResponse.success) {
                throw new Error('Failed to fetch businesses or tags');
            }

            // Map businesses with their tags
            const businessesWithTags = businessesResponse.data.map(business => ({
                ...business,
                tags: business.tagIds ?
                    business.tagIds.map(tagId =>
                        tagsResponse.data.find(tag => tag.id === tagId)
                    ).filter(Boolean) : []
            }));

            // Cache the result
            this.cache.businesses = businessesWithTags;
            this.cache.lastFetch.businesses = Date.now();

            return businessesWithTags;
        } catch (error) {
            console.error('Error fetching businesses with tags:', error);
            throw error;
        }
    },

    // Get all events with their categories
    async getEventsWithCategories() {
        try {
            if (this.isCacheValid('events') && this.cache.events) {
                return this.cache.events;
            }

            const [eventsResponse, categoriesResponse] = await Promise.all([
                eventService.getAll(1, 1000), // Get all events
                eventCategoriesService.getAll()
            ]);

            if (!eventsResponse.success || !categoriesResponse.success) {
                throw new Error('Failed to fetch events or categories');
            }

            // Map events with their categories
            const eventsWithCategories = eventsResponse.data.map(event => ({
                ...event,
                category: categoriesResponse.data.find(cat => cat.id === event.eventCategoryId)
            }));

            // Cache the result
            this.cache.events = eventsWithCategories;
            this.cache.lastFetch.events = Date.now();

            return eventsWithCategories;
        } catch (error) {
            console.error('Error fetching events with categories:', error);
            throw error;
        }
    },

    // Get tags with business counts
    async getTagsWithCounts() {
        try {
            if (this.isCacheValid('tags') && this.cache.tags) {
                return this.cache.tags;
            }

            const [tagsResponse, businessesResponse] = await Promise.all([
                tagService.getAll(),
                businessService.getAll(1, 1000)
            ]);

            if (!tagsResponse.success || !businessesResponse.success) {
                throw new Error('Failed to fetch tags or businesses');
            }

            // Calculate business counts for each tag
            const tagsWithCounts = tagsResponse.data.map(tag => {
                const businessCount = businessesResponse.data.filter(business =>
                    business.tagIds && business.tagIds.includes(tag.id)
                ).length;

                return {
                    ...tag,
                    businessCount
                };
            });

            // Cache the result
            this.cache.tags = tagsWithCounts;
            this.cache.lastFetch.tags = Date.now();

            return tagsWithCounts;
        } catch (error) {
            console.error('Error fetching tags with counts:', error);
            throw error;
        }
    },

    // Get categories with event counts
    async getCategoriesWithCounts() {
        try {
            if (this.isCacheValid('categories') && this.cache.categories) {
                return this.cache.categories;
            }

            const categoriesResponse = await eventCategoriesService.getAllWithEventCounts();

            if (!categoriesResponse.success) {
                throw new Error('Failed to fetch categories with counts');
            }

            // Cache the result
            this.cache.categories = categoriesResponse.data;
            this.cache.lastFetch.categories = Date.now();

            return categoriesResponse.data;
        } catch (error) {
            console.error('Error fetching categories with counts:', error);
            throw error;
        }
    },

    // Filter businesses by selected tags
    filterBusinessesByTags(businesses, selectedTagIds = []) {
        if (!selectedTagIds.length) return businesses;

        return businesses.filter(business =>
            business.tagIds &&
            selectedTagIds.some(tagId => business.tagIds.includes(tagId))
        );
    },

    // Filter events by selected categories
    filterEventsByCategories(events, selectedCategoryIds = []) {
        if (!selectedCategoryIds.length) return events;

        return events.filter(event =>
            selectedCategoryIds.includes(event.eventCategoryId)
        );
    },

    // Search businesses by query
    searchBusinesses(businesses, query) {
        if (!query.trim()) return businesses;

        const searchTerm = query.toLowerCase();
        return businesses.filter(business =>
            business.name.toLowerCase().includes(searchTerm) ||
            (business.description && business.description.toLowerCase().includes(searchTerm)) ||
            (business.address && business.address.toLowerCase().includes(searchTerm))
        );
    },

    // Search events by query
    searchEvents(events, query) {
        if (!query.trim()) return events;

        const searchTerm = query.toLowerCase();
        return events.filter(event =>
            event.name.toLowerCase().includes(searchTerm) ||
            (event.description && event.description.toLowerCase().includes(searchTerm)) ||
            (event.address && event.address.toLowerCase().includes(searchTerm))
        );
    },

    // Get items within geographic bounds
    getItemsInBounds(items, bounds) {
        if (!bounds || !items.length) return items;

        const { north, south, east, west } = bounds;

        return items.filter(item => {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);

            return lat >= south && lat <= north && lng >= west && lng <= east;
        });
    },

    // Calculate distance between two points (in kilometers)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    // Get nearby items within radius (in kilometers)
    getNearbyItems(items, centerLat, centerLng, radiusKm = 10) {
        return items.filter(item => {
            const distance = this.calculateDistance(
                centerLat, centerLng,
                parseFloat(item.latitude), parseFloat(item.longitude)
            );
            return distance <= radiusKm;
        });
    },

    // Clear cache (useful for refresh)
    clearCache() {
        this.cache = {
            businesses: null,
            events: null,
            tags: null,
            categories: null,
            lastFetch: {
                businesses: null,
                events: null,
                tags: null,
                categories: null
            }
        };
    },

    // Refresh specific data type
    async refreshData(type) {
        this.cache[type] = null;
        this.cache.lastFetch[type] = null;

        switch (type) {
            case 'businesses':
                return await this.getBusinessesWithTags();
            case 'events':
                return await this.getEventsWithCategories();
            case 'tags':
                return await this.getTagsWithCounts();
            case 'categories':
                return await this.getCategoriesWithCounts();
            default:
                throw new Error(`Unknown data type: ${type}`);
        }
    },

    // Get combined map data
    async getAllMapData() {
        try {
            const [businesses, events, tags, categories] = await Promise.all([
                this.getBusinessesWithTags(),
                this.getEventsWithCategories(),
                this.getTagsWithCounts(),
                this.getCategoriesWithCounts()
            ]);

            return {
                businesses,
                events,
                tags,
                categories
            };
        } catch (error) {
            console.error('Error fetching all map data:', error);
            throw error;
        }
    }
};

export default mapDataManager;