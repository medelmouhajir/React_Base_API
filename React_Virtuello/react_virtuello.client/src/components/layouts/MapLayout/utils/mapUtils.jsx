// =============================================================================
// MAP UTILITIES
// =============================================================================
import L from 'leaflet';

export const mapUtils = {
    // Default map configuration
    DEFAULT_CONFIG: {
        center: [34.0181, -5.0078], // Fes, Morocco
        zoom: 13,
        minZoom: 8,
        maxZoom: 18,
        scrollWheelZoom: true,
        zoomControl: true,
        attributionControl: true
    },

    // Tile layer configurations
    TILE_LAYERS: {
        openStreetMap: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        cartoDB: {
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
    },

    // Create custom icon for businesses
    createBusinessIcon(tag = null, color = '#0ea5e9', size = 'medium') {
        const sizes = {
            small: [20, 20],
            medium: [30, 30],
            large: [40, 40]
        };

        const iconSize = sizes[size] || sizes.medium;

        // If tag has an icon, use it
        if (tag?.iconPath) {
            return L.divIcon({
                html: `
                    <div class="map-marker business-marker" style="
                        width: ${iconSize[0]}px;
                        height: ${iconSize[1]}px;
                        background-color: ${color};
                        border: 2px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    ">
                        <img src="${tag.iconPath}" alt="${tag.name}" style="
                            width: 60%;
                            height: 60%;
                            object-fit: contain;
                        " />
                    </div>
                `,
                className: 'custom-div-icon',
                iconSize: iconSize,
                iconAnchor: [iconSize[0] / 2, iconSize[1]]
            });
        }

        // Default business icon
        return L.divIcon({
            html: `
                <div class="map-marker business-marker" style="
                    width: ${iconSize[0]}px;
                    height: ${iconSize[1]}px;
                    background-color: ${color};
                    border: 2px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                ">
                    <svg width="60%" height="60%" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                    </svg>
                </div>
            `,
            className: 'custom-div-icon',
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1]]
        });
    },

    // Create custom icon for events
    createEventIcon(category = null, color = '#f59e0b', size = 'medium') {
        const sizes = {
            small: [20, 20],
            medium: [30, 30],
            large: [40, 40]
        };

        const iconSize = sizes[size] || sizes.medium;

        return L.divIcon({
            html: `
                <div class="map-marker event-marker" style="
                    width: ${iconSize[0]}px;
                    height: ${iconSize[1]}px;
                    background-color: ${color};
                    border: 2px solid white;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                ">
                    <svg width="60%" height="60%" viewBox="0 0 24 24" fill="white">
                        <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                    </svg>
                </div>
            `,
            className: 'custom-div-icon',
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1]]
        });
    },

    // Create cluster icon
    createClusterIcon(cluster, type = 'mixed') {
        const count = cluster.getChildCount();
        let className = 'marker-cluster ';
        let size = 40;

        if (count < 10) {
            className += 'marker-cluster-small';
            size = 40;
        } else if (count < 100) {
            className += 'marker-cluster-medium';
            size = 50;
        } else {
            className += 'marker-cluster-large';
            size = 60;
        }

        const color = type === 'business' ? '#0ea5e9' :
            type === 'event' ? '#f59e0b' : '#8b5cf6';

        return L.divIcon({
            html: `
                <div style="
                    width: ${size}px;
                    height: ${size}px;
                    background-color: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    font-weight: bold;
                    color: white;
                    font-size: ${size < 50 ? '12px' : '14px'};
                ">
                    ${count}
                </div>
            `,
            className: className,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
        });
    },

    // Get color for business tag
    getTagColor(tagName) {
        const colors = {
            'restaurant': '#ef4444',
            'hotel': '#3b82f6',
            'shopping': '#8b5cf6',
            'entertainment': '#f59e0b',
            'healthcare': '#10b981',
            'education': '#6366f1',
            'automotive': '#374151',
            'beauty': '#ec4899',
            'sports': '#f97316',
            'professional': '#0ea5e9'
        };

        const normalizedName = tagName.toLowerCase().replace(/[^a-z]/g, '');
        return colors[normalizedName] || '#6b7280';
    },

    // Get color for event category
    getCategoryColor(categoryName) {
        const colors = {
            'conference': '#3b82f6',
            'workshop': '#8b5cf6',
            'exhibition': '#f59e0b',
            'concert': '#ef4444',
            'sports': '#10b981',
            'festival': '#ec4899',
            'networking': '#0ea5e9',
            'cultural': '#f97316',
            'business': '#374151',
            'educational': '#6366f1'
        };

        const normalizedName = categoryName.toLowerCase().replace(/[^a-z]/g, '');
        return colors[normalizedName] || '#6b7280';
    },

    // Validate coordinates
    isValidCoordinate(lat, lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        return !isNaN(latitude) &&
            !isNaN(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180;
    },

    // Calculate map bounds for given items
    calculateBounds(items) {
        if (!items || items.length === 0) return null;

        const validItems = items.filter(item =>
            this.isValidCoordinate(item.latitude, item.longitude)
        );

        if (validItems.length === 0) return null;

        const lats = validItems.map(item => parseFloat(item.latitude));
        const lngs = validItems.map(item => parseFloat(item.longitude));

        const bounds = {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lngs),
            west: Math.min(...lngs)
        };

        // Add some padding to the bounds
        const latPadding = (bounds.north - bounds.south) * 0.1 || 0.01;
        const lngPadding = (bounds.east - bounds.west) * 0.1 || 0.01;

        return {
            north: bounds.north + latPadding,
            south: bounds.south - latPadding,
            east: bounds.east + lngPadding,
            west: bounds.west - lngPadding
        };
    },

    // Convert bounds to Leaflet bounds
    boundsToLeafletBounds(bounds) {
        if (!bounds) return null;
        return L.latLngBounds(
            [bounds.south, bounds.west],
            [bounds.north, bounds.east]
        );
    },

    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    // Convert radians to degrees
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    },

    // Get center point of multiple coordinates
    getCenterPoint(coordinates) {
        if (!coordinates || coordinates.length === 0) return null;

        const validCoords = coordinates.filter(coord =>
            this.isValidCoordinate(coord.lat || coord.latitude, coord.lng || coord.longitude)
        );

        if (validCoords.length === 0) return null;

        const sum = validCoords.reduce((acc, coord) => ({
            lat: acc.lat + parseFloat(coord.lat || coord.latitude),
            lng: acc.lng + parseFloat(coord.lng || coord.longitude)
        }), { lat: 0, lng: 0 });

        return {
            lat: sum.lat / validCoords.length,
            lng: sum.lng / validCoords.length
        };
    },

    // Format coordinates for display
    formatCoordinates(lat, lng, precision = 4) {
        const latitude = parseFloat(lat).toFixed(precision);
        const longitude = parseFloat(lng).toFixed(precision);
        return `${latitude}, ${longitude}`;
    },

    // Get optimal zoom level for given bounds
    getOptimalZoom(bounds, mapSize = { width: 800, height: 600 }) {
        if (!bounds) return this.DEFAULT_CONFIG.zoom;

        const latDiff = bounds.north - bounds.south;
        const lngDiff = bounds.east - bounds.west;

        // Simple zoom calculation based on coordinate differences
        const latZoom = Math.log2(360 / latDiff);
        const lngZoom = Math.log2(360 / lngDiff);

        const zoom = Math.min(latZoom, lngZoom) - 1; // Subtract 1 for padding

        return Math.max(
            this.DEFAULT_CONFIG.minZoom,
            Math.min(this.DEFAULT_CONFIG.maxZoom, Math.floor(zoom))
        );
    },

    // Debounce function for map events
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for map events
    throttle(func, wait) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, wait);
            }
        };
    },

    // Check if point is within bounds
    isPointInBounds(point, bounds) {
        const lat = parseFloat(point.lat || point.latitude);
        const lng = parseFloat(point.lng || point.longitude);

        return lat >= bounds.south &&
            lat <= bounds.north &&
            lng >= bounds.west &&
            lng <= bounds.east;
    },

    // Create popup content for business
    createBusinessPopupContent(business, apiBaseUrl = '') {
        const tags = business.tags || [];
        const tagsHtml = tags.length > 0 ?
            `<div class="popup-tags">
                ${tags.map(tag => `<span class="popup-tag">${tag.name}</span>`).join('')}
            </div>` : '';

        return `
            <div class="map-popup business-popup">
                <div class="popup-header">
                    <h3 class="popup-title">${business.name}</h3>
                    ${tagsHtml}
                </div>
                ${business.description ? `<div class="popup-description">${business.description}</div>` : ''}
                <div class="popup-details">
                    ${business.phone ? `<div class="popup-detail"><strong>Phone:</strong> ${business.phone}</div>` : ''}
                    ${business.email ? `<div class="popup-detail"><strong>Email:</strong> ${business.email}</div>` : ''}
                    ${business.address ? `<div class="popup-detail"><strong>Address:</strong> ${business.address}</div>` : ''}
                    ${business.website ? `<div class="popup-detail"><strong>Website:</strong> <a href="${business.website}" target="_blank">${business.website}</a></div>` : ''}
                </div>
                <div class="popup-actions">
                    <button onclick="window.open('https://maps.google.com/?q=${business.latitude},${business.longitude}', '_blank')" class="popup-button">
                        Get Directions
                    </button>
                </div>
            </div>
        `;
    },

    // Create popup content for event
    createEventPopupContent(event, apiBaseUrl = '') {
        const category = event.category;
        const categoryHtml = category ?
            `<div class="popup-category">
                <span class="popup-category-tag">${category.name}</span>
            </div>` : '';

        const startDate = new Date(event.start).toLocaleString();
        const endDate = event.end ? new Date(event.end).toLocaleString() : null;

        return `
            <div class="map-popup event-popup">
                <div class="popup-header">
                    <h3 class="popup-title">${event.name}</h3>
                    ${categoryHtml}
                </div>
                ${event.description ? `<div class="popup-description">${event.description}</div>` : ''}
                <div class="popup-details">
                    <div class="popup-detail"><strong>Start:</strong> ${startDate}</div>
                    ${endDate ? `<div class="popup-detail"><strong>End:</strong> ${endDate}</div>` : ''}
                    ${event.address ? `<div class="popup-detail"><strong>Location:</strong> ${event.address}</div>` : ''}
                </div>
                <div class="popup-actions">
                    <button onclick="window.open('https://maps.google.com/?q=${event.latitude},${event.longitude}', '_blank')" class="popup-button">
                        Get Directions
                    </button>
                </div>
            </div>
        `;
    },

    // Generate CSS for map markers
    getMarkerCSS() {
        return `
            .custom-div-icon {
                background: none !important;
                border: none !important;
            }

            .map-marker {
                transition: transform 0.2s ease;
                cursor: pointer;
            }

            .map-marker:hover {
                transform: scale(1.1);
                z-index: 1000;
            }

            .marker-cluster {
                background-clip: padding-box;
                border-radius: 50%;
            }

            .marker-cluster div {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                text-align: center;
                line-height: 1;
            }

            .popup-tags {
                margin: 8px 0;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }

            .popup-tag {
                background: #e5e7eb;
                color: #374151;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
            }

            .popup-category {
                margin: 8px 0;
            }

            .popup-category-tag {
                background: #fef3c7;
                color: #92400e;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
            }

            .popup-description {
                margin: 8px 0;
                color: #6b7280;
                font-size: 13px;
            }

            .popup-details {
                margin: 8px 0;
                font-size: 12px;
            }

            .popup-detail {
                margin: 4px 0;
            }

            .popup-actions {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #e5e7eb;
            }

            .popup-button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .popup-button:hover {
                background: #2563eb;
            }
        `;
    },

    // Inject CSS into document
    injectMapCSS() {
        const styleId = 'map-utils-styles';

        // Remove existing styles
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        // Add new styles
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = this.getMarkerCSS();
        document.head.appendChild(style);
    },

    // Initialize map utilities
    init() {
        this.injectMapCSS();
    }
};

// Initialize when imported
if (typeof window !== 'undefined') {
    mapUtils.init();
}

export default mapUtils;