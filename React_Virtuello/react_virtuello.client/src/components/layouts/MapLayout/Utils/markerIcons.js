/**
 * Marker Icons for Virtuello Map
 * Custom icon creation and management for different marker types
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import L from 'leaflet';

// =============================================================================
// ICON CONFIGURATIONS
// =============================================================================

/**
 * Base icon configuration
 */
const BASE_ICON_CONFIG = {
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    tooltipAnchor: [0, -32],
    shadowSize: [41, 41],
    shadowAnchor: [13, 41]
};

/**
 * Icon size variations
 */
const ICON_SIZES = {
    small: {
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
        tooltipAnchor: [0, -24]
    },
    medium: {
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        tooltipAnchor: [0, -32]
    },
    large: {
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        tooltipAnchor: [0, -40]
    }
};

/**
 * Color schemes for different marker types
 */
const COLOR_SCHEMES = {
    business: {
        active: '#10b981',      // Green
        pending: '#f59e0b',     // Amber
        suspended: '#ef4444',   // Red
        default: '#3b82f6'      // Blue
    },
    event: {
        upcoming: '#8b5cf6',    // Purple
        ongoing: '#06b6d4',     // Cyan
        completed: '#6b7280',   // Gray
        cancelled: '#ef4444',   // Red
        default: '#8b5cf6'      // Purple
    },
    location: {
        user: '#ef4444',        // Red
        search: '#3b82f6',      // Blue
        poi: '#10b981',         // Green
        default: '#6b7280'      // Gray
    },
    route: {
        start: '#10b981',       // Green
        end: '#ef4444',         // Red
        waypoint: '#f59e0b',    // Amber
        default: '#3b82f6'      // Blue
    }
};

// =============================================================================
// SVG ICON TEMPLATES
// =============================================================================

/**
 * Create SVG icon for business markers
 * @param {Object} options - Icon options
 * @returns {string} SVG string
 */
const createBusinessSVG = (options = {}) => {
    const {
        color = COLOR_SCHEMES.business.default,
        size = 32,
        hasLogo = false,
        rating = 0
    } = options;

    const ratingStars = rating > 0 ? '★'.repeat(Math.min(Math.floor(rating), 5)) : '';

    return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow-${color.replace('#', '')}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.4"/>
                </filter>
            </defs>
            <!-- Main marker body -->
            <path d="M16 3C11.03 3 7 7.03 7 12c0 7.25 9 17 9 17s9-9.75 9-17c0-4.97-4.03-9-9-9z" 
                  fill="${color}" 
                  stroke="#fff" 
                  stroke-width="2" 
                  filter="url(#shadow-${color.replace('#', '')})"/>
            <!-- Business building icon -->
            <g transform="translate(11, 9)" fill="#fff">
                <rect x="0" y="0" width="10" height="8" rx="1"/>
                <rect x="1" y="1" width="2" height="2" fill="${color}"/>
                <rect x="4" y="1" width="2" height="2" fill="${color}"/>
                <rect x="7" y="1" width="2" height="2" fill="${color}"/>
                <rect x="1" y="4" width="2" height="2" fill="${color}"/>
                <rect x="4" y="4" width="2" height="2" fill="${color}"/>
                <rect x="7" y="4" width="2" height="2" fill="${color}"/>
                <rect x="3" y="6" width="4" height="2" fill="${color}"/>
            </g>
            <!-- Rating indicator -->
            ${rating > 0 ? `
                <circle cx="24" cy="10" r="6" fill="#fbbf24" stroke="#fff" stroke-width="1"/>
                <text x="24" y="14" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#fff">
                    ${rating.toFixed(1)}
                </text>
            ` : ''}
            <!-- Logo indicator -->
            ${hasLogo ? `
                <circle cx="8" cy="10" r="4" fill="#10b981" stroke="#fff" stroke-width="1"/>
                <text x="8" y="13" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="#fff">L</text>
            ` : ''}
        </svg>
    `;
};

/**
 * Create SVG icon for event markers
 * @param {Object} options - Icon options
 * @returns {string} SVG string
 */
const createEventSVG = (options = {}) => {
    const {
        color = COLOR_SCHEMES.event.default,
        size = 32,
        isUpcoming = true,
        eventType = 'public'
    } = options;

    const typeSymbol = eventType === 'private' ? '🔒' : eventType === 'online' ? '💻' : '📅';

    return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow-event-${color.replace('#', '')}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.4"/>
                </filter>
            </defs>
            <!-- Main marker body -->
            <path d="M16 3C11.03 3 7 7.03 7 12c0 7.25 9 17 9 17s9-9.75 9-17c0-4.97-4.03-9-9-9z" 
                  fill="${color}" 
                  stroke="#fff" 
                  stroke-width="2" 
                  filter="url(#shadow-event-${color.replace('#', '')})">
                  ${isUpcoming ? `
                    <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/>
                  ` : ''}
            </path>
            <!-- Calendar icon -->
            <g transform="translate(10, 8)" fill="#fff">
                <rect x="0" y="2" width="12" height="10" rx="1" stroke="${color}" stroke-width="0.5"/>
                <rect x="0" y="2" width="12" height="3" rx="1"/>
                <rect x="2" y="0" width="1" height="4"/>
                <rect x="9" y="0" width="1" height="4"/>
                <!-- Calendar dots -->
                <circle cx="3" cy="7" r="0.8"/>
                <circle cx="6" cy="7" r="0.8"/>
                <circle cx="9" cy="7" r="0.8"/>
                <circle cx="3" cy="9.5" r="0.8"/>
                <circle cx="6" cy="9.5" r="0.8"/>
            </g>
            <!-- Event type indicator -->
            ${eventType !== 'public' ? `
                <circle cx="24" cy="10" r="5" fill="#fff" stroke="${color}" stroke-width="2"/>
                <text x="24" y="13" text-anchor="middle" font-family="Arial" font-size="8">
                    ${eventType === 'private' ? '🔒' : '💻'}
                </text>
            ` : ''}
        </svg>
    `;
};

/**
 * Create SVG icon for location markers
 * @param {Object} options - Icon options
 * @returns {string} SVG string
 */
const createLocationSVG = (options = {}) => {
    const {
        color = COLOR_SCHEMES.location.default,
        size = 32,
        locationType = 'default',
        isActive = false
    } = options;

    const iconPaths = {
        user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
        search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
        poi: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
    };

    return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow-location-${color.replace('#', '')}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.4"/>
                </filter>
            </defs>
            <!-- Pulse rings for active locations -->
            ${isActive ? `
                <circle cx="16" cy="16" fill="none" stroke="${color}" stroke-width="2" opacity="0.6" r="14">
                    <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="16" cy="16" fill="none" stroke="${color}" stroke-width="1" opacity="0.4" r="16">
                    <animate attributeName="r" values="16;24;16" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite"/>
                </circle>
            ` : ''}
            <!-- Main marker body -->
            <circle cx="16" cy="16" r="12" 
                    fill="${color}" 
                    stroke="#fff" 
                    stroke-width="2" 
                    filter="url(#shadow-location-${color.replace('#', '')})"/>
            <!-- Icon -->
            <g transform="translate(8, 8) scale(0.67)" fill="#fff">
                <path d="${iconPaths[locationType] || iconPaths.poi}"/>
            </g>
        </svg>
    `;
};

/**
 * Create SVG icon for route markers
 * @param {Object} options - Icon options
 * @returns {string} SVG string
 */
const createRouteSVG = (options = {}) => {
    const {
        color = COLOR_SCHEMES.route.default,
        size = 32,
        routeType = 'waypoint',
        number = null,
        letter = null
    } = options;

    const markerShape = routeType === 'start' ? 'circle' :
        routeType === 'end' ? 'square' : 'diamond';

    return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow-route-${color.replace('#', '')}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.4"/>
                </filter>
            </defs>
            <!-- Shape based on route type -->
            ${markerShape === 'circle' ? `
                <circle cx="16" cy="16" r="12" 
                        fill="${color}" 
                        stroke="#fff" 
                        stroke-width="2" 
                        filter="url(#shadow-route-${color.replace('#', '')})"/>
            ` : markerShape === 'square' ? `
                <rect x="4" y="4" width="24" height="24" rx="2"
                      fill="${color}" 
                      stroke="#fff" 
                      stroke-width="2" 
                      filter="url(#shadow-route-${color.replace('#', '')})"/>
            ` : `
                <path d="M16 4 L28 16 L16 28 L4 16 Z" 
                      fill="${color}" 
                      stroke="#fff" 
                      stroke-width="2" 
                      filter="url(#shadow-route-${color.replace('#', '')})"/>
            `}
            <!-- Number or letter label -->
            ${number || letter ? `
                <text x="16" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#fff">
                    ${number || letter}
                </text>
            ` : ''}
        </svg>
    `;
};

/**
 * Create SVG icon for cluster markers
 * @param {Object} options - Icon options
 * @returns {string} SVG string
 */
const createClusterSVG = (options = {}) => {
    const {
        color = '#3b82f6',
        size = 40,
        count = 0,
        type = 'mixed'
    } = options;

    // Size scaling based on count
    const getClusterSize = (count) => {
        if (count < 10) return 30;
        if (count < 100) return 35;
        if (count < 1000) return 40;
        return 45;
    };

    const clusterSize = getClusterSize(count);
    const radius = clusterSize / 2 - 2;

    return `
        <svg width="${clusterSize}" height="${clusterSize}" viewBox="0 0 ${clusterSize} ${clusterSize}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow-cluster-${color.replace('#', '')}" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.5"/>
                </filter>
                <radialGradient id="clusterGradient-${color.replace('#', '')}" cx="30%" cy="30%">
                    <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
                </radialGradient>
            </defs>
            <!-- Outer ring -->
            <circle cx="${clusterSize / 2}" cy="${clusterSize / 2}" r="${radius + 2}" 
                    fill="${color}" 
                    opacity="0.3"
                    filter="url(#shadow-cluster-${color.replace('#', '')})"/>
            <!-- Main cluster body -->
            <circle cx="${clusterSize / 2}" cy="${clusterSize / 2}" r="${radius}" 
                    fill="url(#clusterGradient-${color.replace('#', '')})" 
                    stroke="#fff" 
                    stroke-width="2"/>
            <!-- Count text -->
            <text x="${clusterSize / 2}" y="${clusterSize / 2 + 4}" 
                  text-anchor="middle" 
                  font-family="Arial, sans-serif" 
                  font-size="${count > 999 ? '10' : count > 99 ? '12' : '14'}" 
                  font-weight="bold" 
                  fill="#fff">
                ${count > 999 ? '999+' : count}
            </text>
        </svg>
    `;
};

// =============================================================================
// ICON CREATION FUNCTIONS
// =============================================================================

/**
 * Create marker icon for businesses
 * @param {Object} options - Business marker options
 * @returns {L.DivIcon} Leaflet icon
 */
export const createBusinessIcon = (options = {}) => {
    const {
        status = 'active',
        size = 'medium',
        rating = 0,
        hasLogo = false,
        ...customOptions
    } = options;

    const color = COLOR_SCHEMES.business[status] || COLOR_SCHEMES.business.default;
    const sizeConfig = ICON_SIZES[size] || ICON_SIZES.medium;
    const iconSize = sizeConfig.iconSize[0];

    const svgString = createBusinessSVG({
        color,
        size: iconSize,
        rating,
        hasLogo,
        ...customOptions
    });

    return L.divIcon({
        html: svgString,
        className: `custom-marker business-marker business-${status}`,
        ...sizeConfig,
        ...customOptions
    });
};

/**
 * Create marker icon for events
 * @param {Object} options - Event marker options
 * @returns {L.DivIcon} Leaflet icon
 */
export const createEventIcon = (options = {}) => {
    const {
        status = 'upcoming',
        type = 'public',
        size = 'medium',
        startDate = null,
        ...customOptions
    } = options;

    const color = COLOR_SCHEMES.event[status] || COLOR_SCHEMES.event.default;
    const sizeConfig = ICON_SIZES[size] || ICON_SIZES.medium;
    const iconSize = sizeConfig.iconSize[0];

    const isUpcoming = startDate ? new Date(startDate) > new Date() : status === 'upcoming';

    const svgString = createEventSVG({
        color,
        size: iconSize,
        isUpcoming,
        eventType: type,
        ...customOptions
    });

    return L.divIcon({
        html: svgString,
        className: `custom-marker event-marker event-${status} event-${type}`,
        ...sizeConfig,
        ...customOptions
    });
};

/**
 * Create marker icon for locations
 * @param {Object} options - Location marker options
 * @returns {L.DivIcon} Leaflet icon
 */
export const createLocationIcon = (options = {}) => {
    const {
        locationType = 'default',
        size = 'medium',
        isActive = false,
        color = null,
        ...customOptions
    } = options;

    const iconColor = color || COLOR_SCHEMES.location[locationType] || COLOR_SCHEMES.location.default;
    const sizeConfig = ICON_SIZES[size] || ICON_SIZES.medium;
    const iconSize = sizeConfig.iconSize[0];

    const svgString = createLocationSVG({
        color: iconColor,
        size: iconSize,
        locationType,
        isActive,
        ...customOptions
    });

    return L.divIcon({
        html: svgString,
        className: `custom-marker location-marker location-${locationType} ${isActive ? 'active' : ''}`,
        ...sizeConfig,
        ...customOptions
    });
};

/**
 * Create marker icon for routes
 * @param {Object} options - Route marker options
 * @returns {L.DivIcon} Leaflet icon
 */
export const createRouteIcon = (options = {}) => {
    const {
        routeType = 'waypoint',
        size = 'medium',
        number = null,
        letter = null,
        color = null,
        ...customOptions
    } = options;

    const iconColor = color || COLOR_SCHEMES.route[routeType] || COLOR_SCHEMES.route.default;
    const sizeConfig = ICON_SIZES[size] || ICON_SIZES.medium;
    const iconSize = sizeConfig.iconSize[0];

    const svgString = createRouteSVG({
        color: iconColor,
        size: iconSize,
        routeType,
        number,
        letter,
        ...customOptions
    });

    return L.divIcon({
        html: svgString,
        className: `custom-marker route-marker route-${routeType}`,
        ...sizeConfig,
        ...customOptions
    });
};

/**
 * Create cluster icon
 * @param {Object} cluster - Cluster object from MarkerClusterGroup
 * @param {string} type - Type of markers in cluster
 * @returns {L.DivIcon} Leaflet cluster icon
 */
export const createClusterIcon = (cluster, type = 'mixed') => {
    const count = cluster.getChildCount();

    // Determine cluster color based on type
    let color = '#3b82f6'; // Default blue

    if (type === 'business') {
        color = COLOR_SCHEMES.business.default;
    } else if (type === 'event') {
        color = COLOR_SCHEMES.event.default;
    } else if (type === 'location') {
        color = COLOR_SCHEMES.location.default;
    }

    // Get cluster size based on count
    const getClusterSize = (count) => {
        if (count < 10) return 30;
        if (count < 100) return 35;
        if (count < 1000) return 40;
        return 45;
    };

    const size = getClusterSize(count);
    const svgString = createClusterSVG({
        color,
        size,
        count,
        type
    });

    return L.divIcon({
        html: svgString,
        className: `custom-cluster cluster-${type}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
    });
};

/**
 * Generic marker icon creator
 * @param {string} markerType - Type of marker (business, event, location, route)
 * @param {Object} options - Marker options
 * @returns {L.DivIcon} Leaflet icon
 */
export const createMarkerIcon = (markerType, options = {}) => {
    switch (markerType) {
        case 'business':
            return createBusinessIcon(options);
        case 'event':
            return createEventIcon(options);
        case 'location':
            return createLocationIcon(options);
        case 'route':
            return createRouteIcon(options);
        default:
            return createLocationIcon({ ...options, locationType: 'default' });
    }
};

// =============================================================================
// SHADOW ICON
// =============================================================================

/**
 * Create shadow icon for markers
 * @param {string} size - Size variant
 * @returns {L.Icon} Shadow icon
 */
export const createShadowIcon = (size = 'medium') => {
    const sizeConfig = ICON_SIZES[size] || ICON_SIZES.medium;

    return L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="${sizeConfig.shadowSize[0]}" height="${sizeConfig.shadowSize[1]}" 
                 viewBox="0 0 41 41" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="20" cy="38" rx="18" ry="3" fill="#000" opacity="0.3"/>
            </svg>
        `),
        shadowUrl: null,
        iconSize: sizeConfig.iconSize,
        shadowSize: sizeConfig.shadowSize,
        iconAnchor: sizeConfig.iconAnchor,
        shadowAnchor: sizeConfig.shadowAnchor
    });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get color for marker type and status
 * @param {string} type - Marker type
 * @param {string} status - Status/state
 * @returns {string} Color hex code
 */
export const getMarkerColor = (type, status = 'default') => {
    return COLOR_SCHEMES[type]?.[status] || COLOR_SCHEMES[type]?.default || '#6b7280';
};

/**
 * Create custom icon from image URL
 * @param {string} imageUrl - Image URL
 * @param {Object} options - Icon options
 * @returns {L.Icon} Custom image icon
 */
export const createCustomImageIcon = (imageUrl, options = {}) => {
    const {
        size = 'medium',
        ...customOptions
    } = options;

    const sizeConfig = ICON_SIZES[size] || ICON_SIZES.medium;

    return L.icon({
        iconUrl: imageUrl,
        ...sizeConfig,
        ...customOptions
    });
};

/**
 * Create icon with custom SVG
 * @param {string} svgContent - SVG content
 * @param {Object} options - Icon options
 * @returns {L.DivIcon} Custom SVG icon
 */
export const createCustomSVGIcon = (svgContent, options = {}) => {
    const {
        size = 'medium',
        className = 'custom-svg-marker',
        ...customOptions
    } = options;

    const sizeConfig = ICON_SIZES[size] || ICON_SIZES.medium;

    return L.divIcon({
        html: svgContent,
        className,
        ...sizeConfig,
        ...customOptions
    });
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    // Main creators
    createMarkerIcon,
    createBusinessIcon,
    createEventIcon,
    createLocationIcon,
    createRouteIcon,
    createClusterIcon,

    // Utilities
    createShadowIcon,
    createCustomImageIcon,
    createCustomSVGIcon,
    getMarkerColor,

    // Constants
    COLOR_SCHEMES,
    ICON_SIZES,
    BASE_ICON_CONFIG
};