import mapDataManager from '../../../../services/mapDataManager';

class MapService {
    constructor() {
        this.mapInstance = null;
        this.markers = new Map();
        this.currentBounds = null;
    }

    // Set the map instance
    setMapInstance(map) {
        this.mapInstance = map;
        this.setupMapEventListeners();
    }

    // Get current map instance
    getMapInstance() {
        return this.mapInstance;
    }

    // Setup event listeners for the map
    setupMapEventListeners() {
        if (!this.mapInstance) return;

        this.mapInstance.on('moveend', () => {
            this.currentBounds = this.mapInstance.getBounds();
            this.onBoundsChanged();
        });

        this.mapInstance.on('zoomend', () => {
            this.onZoomChanged();
        });
    }

    // Handle bounds change events
    onBoundsChanged() {
        if (this.currentBounds && this.boundsChangeCallback) {
            const bounds = {
                north: this.currentBounds.getNorth(),
                south: this.currentBounds.getSouth(),
                east: this.currentBounds.getEast(),
                west: this.currentBounds.getWest()
            };
            this.boundsChangeCallback(bounds);
        }
    }

    // Handle zoom change events
    onZoomChanged() {
        if (this.zoomChangeCallback) {
            this.zoomChangeCallback(this.mapInstance.getZoom());
        }
    }

    // Set bounds change callback
    onBoundsChange(callback) {
        this.boundsChangeCallback = callback;
    }

    // Set zoom change callback
    onZoomChange(callback) {
        this.zoomChangeCallback = callback;
    }

    // Get current map bounds
    getCurrentBounds() {
        if (!this.mapInstance) return null;

        const bounds = this.mapInstance.getBounds();
        return {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        };
    }

    // Fly to specific location
    flyTo(lat, lng, zoom = 16, options = {}) {
        if (!this.mapInstance) return;

        const defaultOptions = {
            animate: true,
            duration: 1.5
        };

        this.mapInstance.flyTo([lat, lng], zoom, { ...defaultOptions, ...options });
    }

    // Fit bounds to show all markers
    fitBounds(bounds, options = {}) {
        if (!this.mapInstance || !bounds) return;

        const defaultOptions = {
            padding: [20, 20]
        };

        this.mapInstance.fitBounds(bounds, { ...defaultOptions, ...options });
    }

    // Add marker to tracking
    addMarker(id, marker) {
        this.markers.set(id, marker);
    }

    // Remove marker from tracking
    removeMarker(id) {
        this.markers.delete(id);
    }

    // Get all tracked markers
    getMarkers() {
        return Array.from(this.markers.values());
    }

    // Clear all markers
    clearMarkers() {
        this.markers.clear();
    }

    // Get businesses in current bounds
    async getBusinessesInBounds(filters = {}) {
        const bounds = this.getCurrentBounds();
        if (!bounds) return [];

        try {
            const params = new URLSearchParams({
                north: bounds.north.toString(),
                south: bounds.south.toString(),
                east: bounds.east.toString(),
                west: bounds.west.toString(),
                ...filters
            });

            const response = await fetch(`/api/map/businesses/bounds?${params}`);
            if (!response.ok) throw new Error('Failed to fetch businesses');

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching businesses in bounds:', error);
            return [];
        }
    }

    // Get events in current bounds
    async getEventsInBounds(filters = {}) {
        const bounds = this.getCurrentBounds();
        if (!bounds) return [];

        try {
            const params = new URLSearchParams({
                north: bounds.north.toString(),
                south: bounds.south.toString(),
                east: bounds.east.toString(),
                west: bounds.west.toString(),
                ...filters
            });

            const response = await fetch(`/api/map/events/bounds?${params}`);
            if (!response.ok) throw new Error('Failed to fetch events');

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching events in bounds:', error);
            return [];
        }
    }

    // Utility methods
    calculateDistance(lat1, lng1, lat2, lng2) {
        return mapDataManager.calculateDistance(lat1, lng1, lat2, lng2);
    }

    isPointInBounds(lat, lng, bounds = null) {
        const targetBounds = bounds || this.getCurrentBounds();
        if (!targetBounds) return false;

        return lat >= targetBounds.south &&
            lat <= targetBounds.north &&
            lng >= targetBounds.west &&
            lng <= targetBounds.east;
    }

    // Get current zoom level
    getZoom() {
        return this.mapInstance?.getZoom() || 13;
    }

    // Get current center
    getCenter() {
        if (!this.mapInstance) return null;

        const center = this.mapInstance.getCenter();
        return {
            lat: center.lat,
            lng: center.lng
        };
    }
}

// Export singleton instance
export default new MapService();