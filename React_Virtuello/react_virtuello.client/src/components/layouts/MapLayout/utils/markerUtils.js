// =============================================================================
// MARKER UTILITIES
// =============================================================================
import { MARKER_CONFIG, STATUS_CONFIG, ANIMATION_CONFIG } from './mapConstants.js';

/**
 * Create business marker configuration
 * @param {Object} business - Business object
 * @param {boolean} isSelected - Whether marker is selected
 * @param {boolean} isHovered - Whether marker is hovered
 * @returns {Object} Marker configuration
 */
export const createBusinessMarker = (business, isSelected = false, isHovered = false) => {
    const config = isSelected ? MARKER_CONFIG.BUSINESS.selected : MARKER_CONFIG.BUSINESS.default;
    const status = STATUS_CONFIG.BUSINESS_STATUS[business.status] || STATUS_CONFIG.BUSINESS_STATUS[0];

    return {
        id: business.id,
        type: 'business',
        position: {
            lat: business.latitude,
            lng: business.longitude
        },
        data: business,
        style: {
            color: config.color,
            size: isHovered ? config.size + 4 : config.size,
            icon: config.icon,
            borderColor: status.color,
            borderWidth: isSelected ? 3 : 1,
            shadow: isSelected || isHovered,
            zIndex: isSelected ? 1000 : (isHovered ? 999 : 998)
        },
        animation: {
            appear: true,
            bounce: isSelected,
            pulse: isHovered
        },
        popup: {
            title: business.name,
            description: business.description,
            status: status.label,
            statusColor: status.color,
            address: business.address,
            phone: business.phone,
            website: business.website,
            rating: business.averageRating,
            reviewCount: business.commentCount
        }
    };
};

/**
 * Create event marker configuration
 * @param {Object} event - Event object
 * @param {boolean} isSelected - Whether marker is selected
 * @param {boolean} isHovered - Whether marker is hovered
 * @returns {Object} Marker configuration
 */
export const createEventMarker = (event, isSelected = false, isHovered = false) => {
    const config = isSelected ? MARKER_CONFIG.EVENT.selected : MARKER_CONFIG.EVENT.default;
    const status = STATUS_CONFIG.EVENT_STATUS[event.status] || STATUS_CONFIG.EVENT_STATUS[0];
    const type = STATUS_CONFIG.EVENT_TYPES[event.type] || STATUS_CONFIG.EVENT_TYPES[6];

    // Determine if event is happening now/soon
    const now = new Date();
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : null;
    const isLive = now >= startDate && (!endDate || now <= endDate);
    const isUpcoming = startDate > now && (startDate - now) < 24 * 60 * 60 * 1000; // Within 24 hours

    return {
        id: event.id,
        type: 'event',
        position: {
            lat: event.latitude,
            lng: event.longitude
        },
        data: event,
        style: {
            color: isLive ? '#DC2626' : (isUpcoming ? '#F59E0B' : config.color),
            size: isHovered ? config.size + 4 : config.size,
            icon: type.icon,
            borderColor: status.color,
            borderWidth: isSelected ? 3 : 1,
            shadow: isSelected || isHovered,
            zIndex: isSelected ? 1000 : (isHovered ? 999 : 998),
            pulse: isLive,
            glow: isUpcoming
        },
        animation: {
            appear: true,
            bounce: isSelected,
            pulse: isLive || isHovered
        },
        popup: {
            title: event.name,
            description: event.description,
            status: status.label,
            statusColor: status.color,
            type: type.label,
            typeColor: type.color,
            startDate: event.start,
            endDate: event.end,
            address: event.address,
            isLive,
            isUpcoming
        }
    };
};

/**
 * Create user location marker configuration
 * @param {Object} position - User position {lat, lng}
 * @param {number} accuracy - Position accuracy in meters
 * @returns {Object} Marker configuration
 */
export const createUserLocationMarker = (position, accuracy = null) => {
    const config = MARKER_CONFIG.USER_LOCATION;

    return {
        id: 'user-location',
        type: 'user-location',
        position,
        style: {
            color: config.color,
            size: config.size,
            icon: config.icon,
            pulseColor: config.pulseColor,
            zIndex: 1001,
            pulse: true
        },
        accuracy: accuracy ? {
            radius: accuracy,
            color: config.pulseColor,
            opacity: 0.2
        } : null,
        animation: {
            appear: true,
            pulse: true
        }
    };
};

/**
 * Create cluster marker configuration
 * @param {Array} markers - Array of markers in cluster
 * @param {string} type - Type of cluster ('business' or 'event' or 'mixed')
 * @returns {Object} Cluster marker configuration
 */
export const createClusterMarker = (markers, type = 'mixed') => {
    const count = markers.length;
    let config;

    if (type === 'business') {
        config = MARKER_CONFIG.BUSINESS.cluster;
    } else if (type === 'event') {
        config = MARKER_CONFIG.EVENT.cluster;
    } else {
        // Mixed cluster - use dominant type's color
        const businessCount = markers.filter(m => m.type === 'business').length;
        const eventCount = markers.filter(m => m.type === 'event').length;
        config = businessCount >= eventCount ?
            MARKER_CONFIG.BUSINESS.cluster :
            MARKER_CONFIG.EVENT.cluster;
    }

    return {
        id: `cluster-${markers.map(m => m.id).join('-')}`,
        type: 'cluster',
        count,
        markers,
        style: {
            color: config.color,
            textColor: config.textColor,
            size: Math.min(60, 30 + Math.log(count) * 8),
            borderWidth: 2,
            borderColor: '#FFFFFF',
            shadow: true,
            zIndex: 997
        },
        animation: {
            appear: true,
            scale: true
        }
    };
};

/**
 * Generate marker styles for different states
 * @param {Object} baseStyle - Base marker style
 * @param {Object} state - Marker state {selected, hovered, focused}
 * @returns {Object} Complete marker style
 */
export const generateMarkerStyle = (baseStyle, state = {}) => {
    const { selected, hovered, focused } = state;

    return {
        ...baseStyle,
        size: baseStyle.size + (selected ? 8 : 0) + (hovered ? 4 : 0),
        borderWidth: selected ? 3 : (hovered ? 2 : baseStyle.borderWidth || 1),
        shadow: selected || hovered || focused,
        zIndex: selected ? 1000 : (hovered ? 999 : (focused ? 998 : baseStyle.zIndex || 997)),
        opacity: focused === false ? 0.5 : 1,
        transform: selected ? 'scale(1.1)' : (hovered ? 'scale(1.05)' : 'scale(1)'),
        transition: 'all 0.2s ease-in-out'
    };
};

/**
 * Create marker popup content
 * @param {Object} markerData - Marker data object
 * @returns {string} HTML content for popup
 */
export const createPopupContent = (markerData) => {
    const { type, data, popup } = markerData;

    if (type === 'business') {
        return createBusinessPopupContent(data, popup);
    } else if (type === 'event') {
        return createEventPopupContent(data, popup);
    } else if (type === 'cluster') {
        return createClusterPopupContent(markerData);
    }

    return '<div>No information available</div>';
};

/**
 * Create business popup content
 * @param {Object} business - Business data
 * @param {Object} popup - Popup configuration
 * @returns {string} HTML content
 */
export const createBusinessPopupContent = (business, popup) => {
    const ratingStars = popup.rating ? generateStarRating(popup.rating) : '';

    return `
        <div class="marker-popup business-popup">
            <div class="popup-header">
                <h3 class="popup-title">${popup.title}</h3>
                <span class="popup-status" style="color: ${popup.statusColor}">
                    ${popup.status}
                </span>
            </div>
            ${popup.description ? `
                <p class="popup-description">${truncateText(popup.description, 100)}</p>
            ` : ''}
            <div class="popup-details">
                ${popup.address ? `
                    <div class="popup-detail">
                        <i class="icon-location"></i>
                        <span>${popup.address}</span>
                    </div>
                ` : ''}
                ${popup.phone ? `
                    <div class="popup-detail">
                        <i class="icon-phone"></i>
                        <a href="tel:${popup.phone}">${popup.phone}</a>
                    </div>
                ` : ''}
                ${popup.rating ? `
                    <div class="popup-detail">
                        <div class="rating">
                            ${ratingStars}
                            <span class="rating-text">${popup.rating.toFixed(1)} (${popup.reviewCount} reviews)</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="popup-actions">
                <button class="popup-btn primary" onclick="viewBusiness('${business.id}')">
                    View Details
                </button>
                ${popup.website ? `
                    <button class="popup-btn secondary" onclick="window.open('${popup.website}', '_blank')">
                        Visit Website
                    </button>
                ` : ''}
            </div>
        </div>
    `;
};

/**
 * Create event popup content
 * @param {Object} event - Event data
 * @param {Object} popup - Popup configuration
 * @returns {string} HTML content
 */
export const createEventPopupContent = (event, popup) => {
    const startDate = new Date(popup.startDate);
    const endDate = popup.endDate ? new Date(popup.endDate) : null;

    return `
        <div class="marker-popup event-popup">
            <div class="popup-header">
                <h3 class="popup-title">${popup.title}</h3>
                <div class="popup-badges">
                    <span class="popup-status" style="color: ${popup.statusColor}">
                        ${popup.status}
                    </span>
                    <span class="popup-type" style="color: ${popup.typeColor}">
                        ${popup.type}
                    </span>
                </div>
            </div>
            ${popup.isLive ? `
                <div class="live-indicator">
                    <span class="live-dot"></span>
                    LIVE NOW
                </div>
            ` : popup.isUpcoming ? `
                <div class="upcoming-indicator">
                    Starting Soon
                </div>
            ` : ''}
            ${popup.description ? `
                <p class="popup-description">${truncateText(popup.description, 100)}</p>
            ` : ''}
            <div class="popup-details">
                <div class="popup-detail">
                    <i class="icon-calendar"></i>
                    <div class="date-info">
                        <div class="start-date">
                            <strong>Starts:</strong> ${formatEventDate(startDate)}
                        </div>
                        ${endDate ? `
                            <div class="end-date">
                                <strong>Ends:</strong> ${formatEventDate(endDate)}
                            </div>
                        ` : ''}
                    </div>
                </div>
                ${popup.address ? `
                    <div class="popup-detail">
                        <i class="icon-location"></i>
                        <span>${popup.address}</span>
                    </div>
                ` : ''}
            </div>
            <div class="popup-actions">
                <button class="popup-btn primary" onclick="viewEvent('${event.id}')">
                    View Details
                </button>
                <button class="popup-btn secondary" onclick="addToCalendar('${event.id}')">
                    Add to Calendar
                </button>
            </div>
        </div>
    `;
};

/**
 * Create cluster popup content
 * @param {Object} clusterData - Cluster marker data
 * @returns {string} HTML content
 */
export const createClusterPopupContent = (clusterData) => {
    const { count, markers } = clusterData;
    const businessCount = markers.filter(m => m.type === 'business').length;
    const eventCount = markers.filter(m => m.type === 'event').length;

    return `
        <div class="marker-popup cluster-popup">
            <div class="popup-header">
                <h3 class="popup-title">${count} Items in this area</h3>
            </div>
            <div class="cluster-breakdown">
                ${businessCount > 0 ? `
                    <div class="cluster-item">
                        <i class="icon-business"></i>
                        <span>${businessCount} Business${businessCount !== 1 ? 'es' : ''}</span>
                    </div>
                ` : ''}
                ${eventCount > 0 ? `
                    <div class="cluster-item">
                        <i class="icon-event"></i>
                        <span>${eventCount} Event${eventCount !== 1 ? 's' : ''}</span>
                    </div>
                ` : ''}
            </div>
            <div class="popup-actions">
                <button class="popup-btn primary" onclick="zoomToCluster('${clusterData.id}')">
                    Zoom In
                </button>
                <button class="popup-btn secondary" onclick="showClusterList('${clusterData.id}')">
                    View List
                </button>
            </div>
        </div>
    `;
};

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @returns {string} Star rating HTML
 */
export const generateStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="star star-full"></i>';
    }

    // Half star
    if (hasHalfStar) {
        stars += '<i class="star star-half"></i>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="star star-empty"></i>';
    }

    return stars;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format event date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export const formatEventDate = (date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

    if (isToday) {
        return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
        return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

/**
 * Calculate marker priority for rendering order
 * @param {Object} marker - Marker object
 * @param {Object} currentState - Current map state
 * @returns {number} Priority value (higher = render on top)
 */
export const calculateMarkerPriority = (marker, currentState = {}) => {
    let priority = 0;

    // Base priority by type
    if (marker.type === 'user-location') priority += 1000;
    else if (marker.type === 'cluster') priority += 900;
    else if (marker.type === 'event') priority += 800;
    else if (marker.type === 'business') priority += 700;

    // State modifiers
    if (currentState.selectedMarkerId === marker.id) priority += 200;
    if (currentState.hoveredMarkerId === marker.id) priority += 100;

    // Event-specific modifiers
    if (marker.type === 'event' && marker.popup) {
        if (marker.popup.isLive) priority += 50;
        else if (marker.popup.isUpcoming) priority += 25;
    }

    return priority;
};

/**
 * Optimize markers for current zoom level
 * @param {Array} markers - Array of markers
 * @param {number} zoom - Current zoom level
 * @param {Object} bounds - Current viewport bounds
 * @returns {Array} Optimized markers array
 */
export const optimizeMarkersForZoom = (markers, zoom, bounds) => {
    if (!markers || !bounds) return markers || [];

    // Filter markers within viewport
    const visibleMarkers = markers.filter(marker =>
        marker.position.lat >= bounds.south &&
        marker.position.lat <= bounds.north &&
        marker.position.lng >= bounds.west &&
        marker.position.lng <= bounds.east
    );

    // At low zoom levels, show only high priority markers
    if (zoom < 10) {
        return visibleMarkers.filter(marker =>
            marker.type === 'user-location' ||
            marker.type === 'cluster' ||
            (marker.type === 'event' && marker.popup && marker.popup.isLive)
        );
    }

    return visibleMarkers;
};

/**
 * Create marker animation configuration
 * @param {string} animationType - Type of animation
 * @param {number} delay - Animation delay in ms
 * @returns {Object} Animation configuration
 */
export const createMarkerAnimation = (animationType, delay = 0) => {
    const animations = {
        appear: {
            keyframes: [
                { opacity: 0, transform: 'scale(0)' },
                { opacity: 1, transform: 'scale(1.1)' },
                { opacity: 1, transform: 'scale(1)' }
            ],
            duration: ANIMATION_CONFIG.MARKER_APPEAR_DELAY,
            delay,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        },
        bounce: {
            keyframes: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-10px)' },
                { transform: 'translateY(0)' }
            ],
            duration: 600,
            delay,
            easing: 'ease-in-out'
        },
        pulse: {
            keyframes: [
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(1.1)', opacity: 0.8 },
                { transform: 'scale(1)', opacity: 1 }
            ],
            duration: 1000,
            delay,
            easing: 'ease-in-out',
            iterations: 'infinite'
        },
        scale: {
            keyframes: [
                { transform: 'scale(0)' },
                { transform: 'scale(1.2)' },
                { transform: 'scale(1)' }
            ],
            duration: 400,
            delay,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }
    };

    return animations[animationType] || animations.appear;
};

export default {
    createBusinessMarker,
    createEventMarker,
    createUserLocationMarker,
    createClusterMarker,
    generateMarkerStyle,
    createPopupContent,
    createBusinessPopupContent,
    createEventPopupContent,
    createClusterPopupContent,
    generateStarRating,
    truncateText,
    formatEventDate,
    calculateMarkerPriority,
    optimizeMarkersForZoom,
    createMarkerAnimation
};