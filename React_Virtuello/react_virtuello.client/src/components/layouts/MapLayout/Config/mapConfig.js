/**
 * Map Configuration for Virtuello React Client
 * Central configuration for all map-related settings and options
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

// =============================================================================
// DEFAULT MAP SETTINGS
// =============================================================================

export const DEFAULT_MAP_CONFIG = {
    // Default center coordinates (Fes, Morocco)
    center: [34.0522, -6.7736],
    zoom: 13,
    minZoom: 3,
    maxZoom: 19,

    // Map bounds for Morocco region
    maxBounds: [
        [20.0, -18.0], // Southwest
        [37.0, 2.0]    // Northeast
    ],

    // Map behavior
    zoomControl: false, // We'll add custom zoom controls
    scrollWheelZoom: true,
    doubleClickZoom: true,
    dragging: true,
    touchZoom: true,
    boxZoom: true,
    keyboard: true,

    // Attribution
    attribution: '© WAN SOLUTIONS | © OpenStreetMap contributors'
};

// =============================================================================
// TILE LAYER CONFIGURATIONS
// =============================================================================

export const TILE_LAYERS = {
    openStreetMap: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
    },

    cartoDB: {
        light: {
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            attribution: '© OpenStreetMap, © CartoDB',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c', 'd']
        },
        dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '© OpenStreetMap, © CartoDB',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c', 'd']
        }
    },

    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles © Esri',
        maxZoom: 19
    }
};

// =============================================================================
// MARKER CLUSTERING SETTINGS
// =============================================================================

export const CLUSTER_CONFIG = {
    // Clustering options
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true,
    animate: true,
    animateAddingMarkers: false,

    // Cluster size thresholds
    maxClusterRadius: 50,
    disableClusteringAtZoom: 16,

    // Cluster icon function will be defined in markerIcons.js
    iconCreateFunction: null // Will be set dynamically
};

// =============================================================================
// SEARCH CONFIGURATION
// =============================================================================

export const SEARCH_CONFIG = {
    // Search behavior
    debounceDelay: 300,
    minSearchLength: 2,
    maxResults: 10,

    // Search bounds (Morocco region)
    searchBounds: [
        [20.0, -18.0], // Southwest
        [37.0, 2.0]    // Northeast
    ],

    // Geocoding provider settings
    provider: 'nominatim',
    providerOptions: {
        searchUrl: 'https://nominatim.openstreetmap.org/search',
        reverseUrl: 'https://nominatim.openstreetmap.org/reverse',
        params: {
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'ma' // Restrict to Morocco
        }
    }
};

// =============================================================================
// GEOLOCATION SETTINGS
// =============================================================================

export const GEOLOCATION_CONFIG = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes

    // Default fallback location (Fes, Morocco)
    defaultLocation: {
        lat: 34.0522,
        lng: -6.7736,
        city: 'Fes',
        country: 'Morocco'
    },

    // Location accuracy circle
    showAccuracyCircle: true,
    accuracyCircleOptions: {
        color: '#136ACD',
        fillColor: '#136ACD',
        fillOpacity: 0.15,
        weight: 2
    }
};

// =============================================================================
// FILTER CONFIGURATIONS
// =============================================================================

export const FILTER_CONFIG = {
    // Business filters
    businessFilters: {
        status: ['Active', 'Pending', 'Suspended'],
        sortOptions: [
            { value: 'distance', label: 'Distance' },
            { value: 'name', label: 'Name' },
            { value: 'rating', label: 'Rating' },
            { value: 'reviews', label: 'Reviews' }
        ]
    },

    // Event filters
    eventFilters: {
        status: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
        type: ['Public', 'Private', 'Online'],
        sortOptions: [
            { value: 'date', label: 'Date' },
            { value: 'distance', label: 'Distance' },
            { value: 'name', label: 'Name' },
            { value: 'popularity', label: 'Popularity' }
        ]
    },

    // Distance filter options (in kilometers)
    distanceOptions: [1, 2, 5, 10, 25, 50, 100],
    defaultDistance: 10
};

// =============================================================================
// LAYER CONFIGURATIONS
// =============================================================================

export const LAYER_CONFIG = {
    businesses: {
        enabled: true,
        name: 'Businesses',
        zIndex: 1000,
        minZoom: 10
    },

    events: {
        enabled: true,
        name: 'Events',
        zIndex: 1100,
        minZoom: 10
    },

    routes: {
        enabled: false,
        name: 'Routes',
        zIndex: 900,
        minZoom: 8
    },

    userLocation: {
        enabled: true,
        name: 'My Location',
        zIndex: 2000,
        autoCenter: false
    }
};

// =============================================================================
// PERFORMANCE SETTINGS
// =============================================================================

export const PERFORMANCE_CONFIG = {
    // Data loading thresholds
    maxMarkersPerLayer: 1000,
    clusterThreshold: 50,

    // Update intervals
    boundsUpdateDelay: 500,
    filterUpdateDelay: 300,
    locationUpdateInterval: 30000, // 30 seconds

    // Memory management
    maxCacheSize: 100,
    cacheExpiration: 300000, // 5 minutes

    // Network optimization
    requestTimeout: 10000,
    maxConcurrentRequests: 5,
    retryAttempts: 3,
    retryDelay: 1000
};

// =============================================================================
// RESPONSIVE BREAKPOINTS
// =============================================================================

export const RESPONSIVE_CONFIG = {
    breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
    },

    mobile: {
        zoom: 12,
        zoomControl: true,
        clusterRadius: 40,
        popupMaxWidth: 250
    },

    tablet: {
        zoom: 13,
        zoomControl: false,
        clusterRadius: 45,
        popupMaxWidth: 300
    },

    desktop: {
        zoom: 13,
        zoomControl: false,
        clusterRadius: 50,
        popupMaxWidth: 350
    }
};

// =============================================================================
// THEME CONFIGURATIONS
// =============================================================================

export const THEME_CONFIG = {
    light: {
        tileLayer: TILE_LAYERS.cartoDB.light,
        colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            background: '#ffffff',
            surface: '#f8fafc'
        }
    },

    dark: {
        tileLayer: TILE_LAYERS.cartoDB.dark,
        colors: {
            primary: '#3b82f6',
            secondary: '#94a3b8',
            success: '#22c55e',
            warning: '#fbbf24',
            error: '#f87171',
            background: '#0f172a',
            surface: '#1e293b'
        }
    }
};

// =============================================================================
// ANIMATION SETTINGS
// =============================================================================

export const ANIMATION_CONFIG = {
    // Map transitions
    flyToDuration: 1.5,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true,

    // Marker animations
    markerBounce: {
        duration: 1000,
        height: 20
    },

    // Popup animations
    popupAnimation: {
        duration: 300,
        easing: 'ease-out'
    },

    // Cluster animations
    clusterAnimation: {
        spiderfyDistanceMultiplier: 1,
        spiderfyDistanceSurplus: 25
    }
};

// =============================================================================
// ROUTING CONFIGURATION
// =============================================================================

export const ROUTING_CONFIG = {
    provider: 'osrm',
    serviceUrl: 'https://router.project-osrm.org/route/v1',

    options: {
        profile: 'driving', // driving, walking, cycling
        alternatives: true,
        steps: true,
        geometries: 'geojson',
        overview: 'full'
    },

    routeStyles: {
        color: '#2563eb',
        weight: 5,
        opacity: 0.8,
        dashArray: null
    },

    alternativeStyles: {
        color: '#64748b',
        weight: 3,
        opacity: 0.5,
        dashArray: '10, 10'
    }
};

// =============================================================================
// EXPORT CONFIGURATION GETTER
// =============================================================================

/**
 * Get complete map configuration based on current settings
 * @param {Object} overrides - Configuration overrides
 * @param {string} theme - Theme name ('light' | 'dark')
 * @param {string} device - Device type ('mobile' | 'tablet' | 'desktop')
 * @returns {Object} Complete map configuration
 */
export const getMapConfig = (overrides = {}, theme = 'light', device = 'desktop') => {
    const baseConfig = {
        ...DEFAULT_MAP_CONFIG,
        ...RESPONSIVE_CONFIG[device],
        ...THEME_CONFIG[theme]
    };

    return {
        ...baseConfig,
        ...overrides,
        tileLayer: overrides.tileLayer || THEME_CONFIG[theme].tileLayer
    };
};

// Default export
export default {
    DEFAULT_MAP_CONFIG,
    TILE_LAYERS,
    CLUSTER_CONFIG,
    SEARCH_CONFIG,
    GEOLOCATION_CONFIG,
    FILTER_CONFIG,
    LAYER_CONFIG,
    PERFORMANCE_CONFIG,
    RESPONSIVE_CONFIG,
    THEME_CONFIG,
    ANIMATION_CONFIG,
    ROUTING_CONFIG,
    getMapConfig
};