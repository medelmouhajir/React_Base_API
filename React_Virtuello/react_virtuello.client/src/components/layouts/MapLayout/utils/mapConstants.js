// =============================================================================
// MAP CONSTANTS & CONFIGURATION
// =============================================================================

// Default map configuration
export const MAP_CONFIG = {
    // Default location (Casablanca, Morocco - WAN SOLUTIONS headquarters)
    DEFAULT_CENTER: {
        lat: 33.5731,
        lng: -7.5898
    },
    DEFAULT_ZOOM: 13,
    MIN_ZOOM: 3,
    MAX_ZOOM: 19,
    MIN_ZOOM_FOR_DATA: 10,

    // Zoom levels for different scenarios
    ZOOM_LEVELS: {
        COUNTRY: 6,
        CITY: 12,
        NEIGHBORHOOD: 15,
        STREET: 17,
        BUILDING: 19
    },

    // Map bounds for Morocco (for boundary checks)
    MOROCCO_BOUNDS: {
        north: 35.9224,
        south: 27.6627,
        east: -0.9988,
        west: -17.0201
    },

    // Tile layer configurations
    TILE_LAYERS: {
        openStreetMap: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '© Esri',
            maxZoom: 18
        },
        dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '© CartoDB',
            maxZoom: 19
        }
    }
};

// Geolocation settings
export const GEOLOCATION_CONFIG = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // 5 minutes

    // Fallback locations for major Moroccan cities
    FALLBACK_LOCATIONS: {
        casablanca: { lat: 33.5731, lng: -7.5898, name: 'Casablanca' },
        rabat: { lat: 34.0209, lng: -6.8416, name: 'Rabat' },
        marrakech: { lat: 31.6295, lng: -7.9811, name: 'Marrakech' },
        fes: { lat: 34.0181, lng: -5.0078, name: 'Fès' },
        tangier: { lat: 35.7595, lng: -5.8340, name: 'Tangier' },
        agadir: { lat: 30.4278, lng: -9.5981, name: 'Agadir' }
    }
};

// Marker configurations
export const MARKER_CONFIG = {
    // Business marker styles
    BUSINESS: {
        default: {
            color: '#3B82F6', // Blue
            size: 32,
            icon: 'building-storefront'
        },
        selected: {
            color: '#1D4ED8',
            size: 40,
            icon: 'building-storefront'
        },
        cluster: {
            color: '#3B82F6',
            textColor: '#FFFFFF'
        }
    },

    // Event marker styles  
    EVENT: {
        default: {
            color: '#EF4444', // Red
            size: 32,
            icon: 'calendar-days'
        },
        selected: {
            color: '#DC2626',
            size: 40,
            icon: 'calendar-days'
        },
        cluster: {
            color: '#EF4444',
            textColor: '#FFFFFF'
        }
    },

    // User location marker
    USER_LOCATION: {
        color: '#10B981', // Green
        size: 20,
        pulseColor: '#10B981',
        icon: 'location-dot'
    },

    // Clustering settings
    CLUSTER: {
        maxClusterRadius: 50,
        disableClusteringAtZoom: 17,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    }
};

// Animation settings
export const ANIMATION_CONFIG = {
    // Map transitions
    PAN_DURATION: 1000,
    ZOOM_DURATION: 800,

    // Marker animations
    MARKER_APPEAR_DELAY: 100,
    MARKER_STAGGER_DELAY: 50,

    // UI animations
    PANEL_SLIDE_DURATION: 300,
    FLOATING_UI_FADE_DURATION: 200,

    // Loading states
    SKELETON_PULSE_DURATION: 1500,
    SPINNER_ROTATION_DURATION: 1000
};

// Data fetching configuration
export const DATA_CONFIG = {
    // API endpoints
    ENDPOINTS: {
        BUSINESSES: '/api/businesses',
        EVENTS: '/api/events',
        TAGS: '/api/tags',
        EVENT_CATEGORIES: '/api/eventcategories',
        SEARCH: '/api/search',
        VIEWPORT_DATA: '/api/map/viewport' // For future viewport-based fetching
    },

    // Pagination settings
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 200,

    // Distance settings (in kilometers)
    DEFAULT_RADIUS: 10,
    MAX_RADIUS: 100,
    RADIUS_OPTIONS: [1, 2, 5, 10, 20, 50, 100],

    // Cache settings
    CACHE_DURATION: 300000, // 5 minutes
    MAX_CACHE_SIZE: 1000, // Max items in memory cache

    // Debounce settings
    SEARCH_DEBOUNCE: 300,
    MAP_MOVE_DEBOUNCE: 500,
    FILTER_DEBOUNCE: 200
};

// UI Layout constants
export const UI_CONFIG = {
    // Floating components positioning
    FLOATING_SEARCH: {
        top: 20,
        left: 20,
        right: 20,
        maxWidth: 600,
        zIndex: 1000
    },

    FLOATING_PROFILE: {
        top: 20,
        right: 20,
        zIndex: 1001
    },

    FLOATING_CONTROLS: {
        bottom: 20,
        right: 20,
        zIndex: 999
    },

    FLOATING_FILTERS: {
        top: 80,
        left: 20,
        zIndex: 998
    },

    // Panel configurations
    RESULTS_PANEL: {
        width: 400,
        maxWidth: '90vw',
        minHeight: 200,
        maxHeight: '80vh'
    },

    DETAILS_PANEL: {
        width: 480,
        maxWidth: '95vw',
        minHeight: 300,
        maxHeight: '90vh'
    },

    // Breakpoints
    BREAKPOINTS: {
        mobile: 768,
        tablet: 1024,
        desktop: 1280
    }
};

// Status and type mappings
export const STATUS_CONFIG = {
    BUSINESS_STATUS: {
        0: { key: 'DRAFT', label: 'Draft', color: '#6B7280', bgColor: '#F3F4F6' },
        1: { key: 'ACTIVE', label: 'Active', color: '#059669', bgColor: '#D1FAE5' },
        2: { key: 'SUSPENDED', label: 'Suspended', color: '#DC2626', bgColor: '#FEE2E2' },
        3: { key: 'CLOSED', label: 'Closed', color: '#7C2D12', bgColor: '#FED7AA' },
        4: { key: 'UNDER_REVIEW', label: 'Under Review', color: '#7C3AED', bgColor: '#EDE9FE' }
    },

    EVENT_STATUS: {
        0: { key: 'DRAFT', label: 'Draft', color: '#6B7280', bgColor: '#F3F4F6' },
        1: { key: 'PUBLISHED', label: 'Published', color: '#059669', bgColor: '#D1FAE5' },
        2: { key: 'IN_PROGRESS', label: 'In Progress', color: '#F59E0B', bgColor: '#FEF3C7' },
        3: { key: 'COMPLETED', label: 'Completed', color: '#6366F1', bgColor: '#E0E7FF' },
        4: { key: 'CANCELLED', label: 'Cancelled', color: '#DC2626', bgColor: '#FEE2E2' }
    },

    EVENT_TYPES: {
        0: { key: 'CONFERENCE', label: 'Conference', icon: 'users', color: '#3B82F6' },
        1: { key: 'WORKSHOP', label: 'Workshop', icon: 'wrench-screwdriver', color: '#8B5CF6' },
        2: { key: 'EXHIBITION', label: 'Exhibition', icon: 'photo', color: '#06B6D4' },
        3: { key: 'CONCERT', label: 'Concert', icon: 'musical-note', color: '#F59E0B' },
        4: { key: 'SPORTS', label: 'Sports', icon: 'trophy', color: '#10B981' },
        5: { key: 'FESTIVAL', label: 'Festival', icon: 'star', color: '#F97316' },
        6: { key: 'OTHER', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' }
    }
};

// Error messages
export const ERROR_MESSAGES = {
    GEOLOCATION: {
        PERMISSION_DENIED: 'Location access denied. Using default location.',
        POSITION_UNAVAILABLE: 'Location unavailable. Using default location.',
        TIMEOUT: 'Location request timed out. Using default location.',
        NOT_SUPPORTED: 'Geolocation not supported by this browser.',
        GENERIC: 'Unable to get your location. Using default location.'
    },

    DATA_LOADING: {
        BUSINESSES_FAILED: 'Failed to load businesses. Please try again.',
        EVENTS_FAILED: 'Failed to load events. Please try again.',
        SEARCH_FAILED: 'Search request failed. Please try again.',
        NETWORK_ERROR: 'Network error. Please check your connection.',
        SERVER_ERROR: 'Server error. Please try again later.'
    },

    MAP: {
        LOAD_FAILED: 'Failed to load map. Please refresh the page.',
        MARKERS_FAILED: 'Failed to load map markers.',
        BOUNDS_ERROR: 'Unable to calculate map bounds.'
    }
};

// Success messages
export const SUCCESS_MESSAGES = {
    LOCATION_FOUND: 'Location found successfully',
    DATA_LOADED: 'Data loaded successfully',
    SEARCH_COMPLETED: 'Search completed'
};

// Feature flags
export const FEATURES = {
    CLUSTERING_ENABLED: true,
    GEOLOCATION_ENABLED: true,
    VOICE_SEARCH_ENABLED: false,
    OFFLINE_SUPPORT_ENABLED: false,
    REAL_TIME_UPDATES_ENABLED: false,
    ANALYTICS_ENABLED: true,
    DARK_MODE_ENABLED: true
};

export default {
    MAP_CONFIG,
    GEOLOCATION_CONFIG,
    MARKER_CONFIG,
    ANIMATION_CONFIG,
    DATA_CONFIG,
    UI_CONFIG,
    STATUS_CONFIG,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    FEATURES
};