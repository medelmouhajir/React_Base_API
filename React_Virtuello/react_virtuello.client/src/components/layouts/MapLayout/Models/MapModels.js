/**
 * Enhanced Map Models for Virtuello Project
 * Aligned with ASP.NET Core API DTOs and enhanced for map functionality
 * 
 * @author WAN SOLUTIONS
 * @version 2.0.0
 */

// =============================================================================
// BUSINESS MODELS
// =============================================================================

export const BusinessModel = {
    // Core properties matching API BusinessDto
    id: '',
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    address: '',
    phone: '',
    email: '',
    website: '',

    // Enhanced properties from API
    status: 'Active', // Active, Pending, Suspended, Closed
    ownerId: '',
    imagePath: '',
    logoPath: '',
    whatsApp: '',
    instagram: '',
    facebook: '',
    averageRating: 0,
    commentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),

    // Map-specific enhancements
    tags: [], // Array of tag objects
    isVisible: true,
    isSelected: false,
    markerColor: '#3B82F6',
    zIndex: 1,

    // UI state
    isLoading: false,
    isExpanded: false,

    // Location metadata
    distance: null, // Distance from user location in km
    bearing: null,  // Compass bearing from user location
    inBounds: true  // Whether marker is in current view bounds
};

// =============================================================================
// EVENT MODELS
// =============================================================================

export const EventModel = {
    // Core properties matching API EventDto
    id: '',
    name: '',
    description: '',
    picture: '',
    start: new Date(),
    end: null,
    status: 'Draft', // Draft, Published, Cancelled, Completed
    type: 'Public',  // Public, Private, Online
    organizerId: '',
    eventCategoryId: '',
    latitude: 0,
    longitude: 0,
    address: '',

    // Map-specific enhancements
    category: null, // Full category object
    isVisible: true,
    isSelected: false,
    markerColor: '#10B981',
    zIndex: 2,

    // UI state
    isLoading: false,
    isExpanded: false,

    // Location metadata
    distance: null,
    bearing: null,
    inBounds: true,

    // Event-specific metadata
    isUpcoming: false,
    isOngoing: false,
    isCompleted: false,
    daysUntilStart: null,
    duration: null // Duration in hours
};

// =============================================================================
// LOCATION MODELS
// =============================================================================

export const LocationModel = {
    lat: 0,
    lng: 0,
    address: '',
    name: '',

    // Enhanced location properties
    type: 'custom', // user, business, event, custom, geocoded
    accuracy: null,
    timestamp: new Date(),
    isCurrentUserLocation: false,

    // Geocoding metadata
    country: '',
    city: '',
    region: '',
    postalCode: '',

    // Display properties
    displayName: '',
    shortName: '',
    formattedAddress: ''
};

// =============================================================================
// MAP BOUNDS MODEL
// =============================================================================

export const MapBoundsModel = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,

    // Enhanced bounds properties
    center: { lat: 0, lng: 0 },
    zoom: 13,
    area: 0, // Area in square kilometers
    diagonal: 0, // Diagonal distance in kilometers

    // Validation
    isValid: false,

    // Helper methods
    contains: function (lat, lng) {
        return lat >= this.south && lat <= this.north &&
            lng >= this.west && lng <= this.east;
    },

    expand: function (factor = 1.1) {
        const latDiff = (this.north - this.south) * (factor - 1) / 2;
        const lngDiff = (this.east - this.west) * (factor - 1) / 2;

        return {
            ...this,
            north: this.north + latDiff,
            south: this.south - latDiff,
            east: this.east + lngDiff,
            west: this.west - lngDiff
        };
    }
};

// =============================================================================
// MARKER MODEL
// =============================================================================

export const MarkerModel = {
    id: '',
    type: 'business', // business, event, user, custom
    position: { lat: 0, lng: 0 },

    // Display properties
    title: '',
    description: '',
    icon: null,
    color: '#3B82F6',
    size: 'medium', // small, medium, large
    zIndex: 1,

    // State
    isVisible: true,
    isSelected: false,
    isHovered: false,
    isAnimating: false,

    // Data reference
    data: null, // Reference to business or event data

    // Interaction
    clickable: true,
    draggable: false,

    // Popup/tooltip
    showTooltip: false,
    tooltipContent: '',
    showPopup: false,
    popupContent: null
};

// =============================================================================
// FILTER MODEL
// =============================================================================

export const FilterModel = {
    // Business filters
    businessStatus: [], // Array of status values
    businessTags: [],   // Array of tag IDs

    // Event filters
    eventStatus: [],    // Array of status values
    eventTypes: [],     // Array of event types
    eventCategories: [], // Array of category IDs
    dateRange: {
        start: null,
        end: null
    },

    // Location filters
    maxDistance: null,  // Max distance from user location in km
    bounds: null,       // MapBoundsModel

    // Search
    searchQuery: '',
    searchFields: ['name', 'description', 'address'],

    // Display options
    showBusinesses: true,
    showEvents: true,
    showUserLocation: true,

    // Clustering
    enableClustering: true,
    clusterRadius: 50,

    // UI state
    isActive: false,
    hasActiveFilters: false
};

// =============================================================================
// MAP STATE MODEL
// =============================================================================

export const MapStateModel = {
    // View state
    center: { lat: 34.0622, lng: -6.7636 }, // Fes, Morocco default
    zoom: 13,
    bounds: null,

    // Data state
    businesses: [],
    events: [],
    markers: [],

    // User state
    userLocation: null,
    isLocationTracking: false,
    locationPermission: 'unknown', // granted, denied, prompt, unknown

    // Loading states
    isLoading: false,
    isLoadingBusinesses: false,
    isLoadingEvents: false,
    isLoadingLocation: false,

    // Error states
    error: null,
    locationError: null,

    // Filter state
    filters: { ...FilterModel },

    // Selection state
    selectedMarker: null,
    selectedBusiness: null,
    selectedEvent: null,

    // UI state
    showSidebar: false,
    showFilters: false,
    showSearch: true,
    mapStyle: 'default',

    // Performance
    lastUpdate: new Date(),
    updateCount: 0,
    cacheEnabled: true
};

// =============================================================================
// GEOCODING RESULT MODEL
// =============================================================================

export const GeocodingResultModel = {
    address: '',
    location: { lat: 0, lng: 0 },

    // Address components
    components: {
        streetNumber: '',
        route: '',
        locality: '',
        administrativeAreaLevel1: '',
        administrativeAreaLevel2: '',
        country: '',
        postalCode: ''
    },

    // Metadata
    accuracy: 'APPROXIMATE', // ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE
    types: [], // Array of result types
    placeId: '',
    formattedAddress: '',

    // Confidence
    confidence: 1.0,

    // Source
    source: 'google', // google, opencage, nominatim, etc.

    // Caching
    timestamp: new Date(),
    ttl: 3600000 // 1 hour in milliseconds
};

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export const ValidationHelpers = {
    /**
     * Validate coordinates
     */
    isValidCoordinates(lat, lng) {
        return typeof lat === 'number' && typeof lng === 'number' &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180;
    },

    /**
     * Validate business model
     */
    isValidBusiness(business) {
        return business &&
            typeof business.id === 'string' && business.id.length > 0 &&
            typeof business.name === 'string' && business.name.length > 0 &&
            this.isValidCoordinates(business.latitude, business.longitude);
    },

    /**
     * Validate event model
     */
    isValidEvent(event) {
        return event &&
            typeof event.id === 'string' && event.id.length > 0 &&
            typeof event.name === 'string' && event.name.length > 0 &&
            this.isValidCoordinates(event.latitude, event.longitude) &&
            event.start instanceof Date;
    },

    /**
     * Validate map bounds
     */
    isValidBounds(bounds) {
        return bounds &&
            this.isValidCoordinates(bounds.north, bounds.east) &&
            this.isValidCoordinates(bounds.south, bounds.west) &&
            bounds.north > bounds.south &&
            bounds.east > bounds.west;
    }
};

// =============================================================================
// MODEL FACTORIES
// =============================================================================

export const ModelFactories = {
    /**
     * Create business model from API response
     */
    createBusinessFromApi(apiData) {
        return {
            ...BusinessModel,
            ...apiData,
            tags: apiData.tags || [],
            markerColor: this.getBusinessColor(apiData.status),
            isVisible: apiData.status === 'Active',
            createdAt: new Date(apiData.createdAt),
            updatedAt: new Date(apiData.updatedAt)
        };
    },

    /**
     * Create event model from API response
     */
    createEventFromApi(apiData) {
        const startDate = new Date(apiData.start);
        const endDate = apiData.end ? new Date(apiData.end) : null;
        const now = new Date();

        return {
            ...EventModel,
            ...apiData,
            start: startDate,
            end: endDate,
            markerColor: this.getEventColor(apiData.status, startDate, endDate, now),
            isVisible: apiData.status === 'Published',
            isUpcoming: startDate > now,
            isOngoing: startDate <= now && (!endDate || endDate >= now),
            isCompleted: endDate && endDate < now,
            daysUntilStart: startDate > now ? Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)) : 0,
            duration: endDate ? (endDate - startDate) / (1000 * 60 * 60) : null
        };
    },

    /**
     * Create marker from business or event
     */
    createMarker(item, type = 'business') {
        return {
            ...MarkerModel,
            id: item.id,
            type,
            position: { lat: item.latitude, lng: item.longitude },
            title: item.name,
            description: item.description,
            color: item.markerColor,
            data: item,
            isVisible: item.isVisible
        };
    },

    /**
     * Get business marker color based on status
     */
    getBusinessColor(status) {
        const colors = {
            'Active': '#10B981',    // Green
            'Pending': '#F59E0B',   // Yellow
            'Suspended': '#EF4444', // Red
            'Closed': '#6B7280'     // Gray
        };
        return colors[status] || '#3B82F6'; // Default blue
    },

    /**
     * Get event marker color based on status and timing
     */
    getEventColor(status, startDate, endDate, now) {
        if (status !== 'Published') {
            return '#6B7280'; // Gray for non-published
        }

        if (startDate > now) {
            return '#3B82F6'; // Blue for upcoming
        } else if (startDate <= now && (!endDate || endDate >= now)) {
            return '#10B981'; // Green for ongoing
        } else {
            return '#8B5CF6'; // Purple for completed
        }
    }
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    BusinessModel,
    EventModel,
    LocationModel,
    MapBoundsModel,
    MarkerModel,
    FilterModel,
    MapStateModel,
    GeocodingResultModel,
    ValidationHelpers,
    ModelFactories
};

// Legacy export for backward compatibility
export const MapModels = {
    Business: BusinessModel,
    Event: EventModel,
    Location: LocationModel
};