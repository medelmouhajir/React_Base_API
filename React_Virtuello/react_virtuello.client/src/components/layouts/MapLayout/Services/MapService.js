/**
 * MapService - Core map operations and management
 * Handles map initialization, configuration, and primary operations
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

class MapService {
    constructor() {
        this.mapInstance = null;
        this.mapContainer = null;
        this.isInitialized = false;
        this.config = {
            defaultCenter: [34.0522, -6.7736], // Fes, Morocco
            defaultZoom: 13,
            minZoom: 3,
            maxZoom: 19,
            attributionControl: true,
            zoomControl: false, // We'll use custom controls
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true,
            touchZoom: true,
            boxZoom: true,
            keyboard: true,
            tap: true,
            zoomSnap: 1,
            zoomDelta: 1,
            wheelPxPerZoomLevel: 60,
            maxBounds: null,
            preferCanvas: false
        };
        this.eventHandlers = new Map();
        this.layers = new Map();
        this.controls = new Map();
    }

    /**
     * Initialize the map with Leaflet
     * @param {string|HTMLElement} containerId - Map container ID or element
     * @param {Object} options - Map configuration options
     * @returns {Promise<L.Map>} Initialized map instance
     */
    async initializeMap(containerId, options = {}) {
        try {
            // Dynamically import Leaflet
            const L = await this._loadLeaflet();

            // Merge config with provided options
            const mapConfig = { ...this.config, ...options };

            // Get container element
            this.mapContainer = typeof containerId === 'string'
                ? document.getElementById(containerId)
                : containerId;

            if (!this.mapContainer) {
                throw new Error(`Map container not found: ${containerId}`);
            }

            // Initialize map
            this.mapInstance = L.map(this.mapContainer, mapConfig);

            // Add default tile layer
            await this._addDefaultTileLayer(L);

            // Set initial view
            this.mapInstance.setView(mapConfig.defaultCenter, mapConfig.defaultZoom);

            // Setup default event handlers
            this._setupDefaultEventHandlers();

            this.isInitialized = true;

            console.log('[MapService] Map initialized successfully');
            return this.mapInstance;

        } catch (error) {
            console.error('[MapService] Failed to initialize map:', error);
            throw new Error(`Map initialization failed: ${error.message}`);
        }
    }

    /**
     * Dynamically load Leaflet library
     * @private
     * @returns {Promise<Object>} Leaflet library
     */
    async _loadLeaflet() {
        if (window.L) {
            return window.L;
        }

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);
        }

        // Load Leaflet JS
        return new Promise((resolve, reject) => {
            if (window.L) {
                resolve(window.L);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = () => resolve(window.L);
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            document.head.appendChild(script);
        });
    }

    /**
     * Add default tile layer (OpenStreetMap)
     * @private
     * @param {Object} L - Leaflet instance
     */
    async _addDefaultTileLayer(L) {
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            detectRetina: true
        });

        tileLayer.addTo(this.mapInstance);
        this.layers.set('default', tileLayer);
    }

    /**
     * Setup default event handlers
     * @private
     */
    _setupDefaultEventHandlers() {
        if (!this.mapInstance) return;

        // Map ready event
        this.mapInstance.whenReady(() => {
            this._emit('map:ready', { map: this.mapInstance });
        });

        // View change events
        this.mapInstance.on('moveend', (e) => {
            this._emit('map:moveend', {
                center: this.mapInstance.getCenter(),
                zoom: this.mapInstance.getZoom(),
                bounds: this.mapInstance.getBounds()
            });
        });

        this.mapInstance.on('zoomend', (e) => {
            this._emit('map:zoomend', {
                zoom: this.mapInstance.getZoom(),
                center: this.mapInstance.getCenter()
            });
        });

        // Click events
        this.mapInstance.on('click', (e) => {
            this._emit('map:click', {
                latlng: e.latlng,
                layerPoint: e.layerPoint,
                containerPoint: e.containerPoint
            });
        });

        // Load events
        this.mapInstance.on('load', () => {
            this._emit('map:load');
        });

        this.mapInstance.on('resize', () => {
            this._emit('map:resize');
        });
    }

    /**
     * Get map instance
     * @returns {L.Map|null} Map instance
     */
    getMapInstance() {
        return this.mapInstance;
    }

    /**
     * Check if map is initialized
     * @returns {boolean} Initialization status
     */
    isMapInitialized() {
        return this.isInitialized && this.mapInstance !== null;
    }

    /**
     * Set map view
     * @param {Array} center - [lat, lng]
     * @param {number} zoom - Zoom level
     * @param {Object} options - Pan/zoom options
     */
    setView(center, zoom, options = {}) {
        if (!this.mapInstance) {
            throw new Error('Map not initialized');
        }
        this.mapInstance.setView(center, zoom, options);
    }

    /**
     * Pan to location
     * @param {Array} latlng - [lat, lng]
     * @param {Object} options - Pan options
     */
    panTo(latlng, options = {}) {
        if (!this.mapInstance) {
            throw new Error('Map not initialized');
        }
        this.mapInstance.panTo(latlng, options);
    }

    /**
     * Fit bounds
     * @param {L.LatLngBounds} bounds - Bounds to fit
     * @param {Object} options - Fit options
     */
    fitBounds(bounds, options = {}) {
        if (!this.mapInstance) {
            throw new Error('Map not initialized');
        }
        this.mapInstance.fitBounds(bounds, options);
    }

    /**
     * Zoom to specific level
     * @param {number} zoom - Zoom level
     * @param {Object} options - Zoom options
     */
    setZoom(zoom, options = {}) {
        if (!this.mapInstance) {
            throw new Error('Map not initialized');
        }
        this.mapInstance.setZoom(zoom, options);
    }

    /**
     * Zoom in
     * @param {number} delta - Zoom delta (default: 1)
     * @param {Object} options - Zoom options
     */
    zoomIn(delta = 1, options = {}) {
        if (!this.mapInstance) {
            throw new Error('Map not initialized');
        }
        this.mapInstance.zoomIn(delta, options);
    }

    /**
     * Zoom out
     * @param {number} delta - Zoom delta (default: 1)
     * @param {Object} options - Zoom options
     */
    zoomOut(delta = 1, options = {}) {
        if (!this.mapInstance) {
            throw new Error('Map not initialized');
        }
        this.mapInstance.zoomOut(delta, options);
    }

    /**
     * Get current center
     * @returns {L.LatLng} Current center
     */
    getCenter() {
        if (!this.mapInstance) return null;
        return this.mapInstance.getCenter();
    }

    /**
     * Get current zoom
     * @returns {number} Current zoom level
     */
    getZoom() {
        if (!this.mapInstance) return null;
        return this.mapInstance.getZoom();
    }

    /**
     * Get current bounds
     * @returns {L.LatLngBounds} Current bounds
     */
    getBounds() {
        if (!this.mapInstance) return null;
        return this.mapInstance.getBounds();
    }

    /**
     * Add layer to map
     * @param {string} key - Layer key
     * @param {L.Layer} layer - Leaflet layer
     */
    addLayer(key, layer) {
        if (!this.mapInstance) {
            throw new Error('Map not initialized');
        }

        // Remove existing layer with same key
        if (this.layers.has(key)) {
            this.removeLayer(key);
        }

        layer.addTo(this.mapInstance);
        this.layers.set(key, layer);
    }

    /**
     * Remove layer from map
     * @param {string} key - Layer key
     */
    removeLayer(key) {
        if (!this.mapInstance || !this.layers.has(key)) return;

        const layer = this.layers.get(key);
        this.mapInstance.removeLayer(layer);
        this.layers.delete(key);
    }

    /**
     * Get layer by key
     * @param {string} key - Layer key
     * @returns {L.Layer|null} Layer or null
     */
    getLayer(key) {
        return this.layers.get(key) || null;
    }

    /**
     * Add control to map
     * @param {string} key - Control key
     * @param {L.Control} control - Leaflet control
     */
    addControl(key, control) {
        if (!this.mapInstance) {
            throw new Error('Map not initialized');
        }

        // Remove existing control with same key
        if (this.controls.has(key)) {
            this.removeControl(key);
        }

        control.addTo(this.mapInstance);
        this.controls.set(key, control);
    }

    /**
     * Remove control from map
     * @param {string} key - Control key
     */
    removeControl(key) {
        if (!this.mapInstance || !this.controls.has(key)) return;

        const control = this.controls.get(key);
        this.mapInstance.removeControl(control);
        this.controls.delete(key);
    }

    /**
     * Invalidate map size (call after container resize)
     */
    invalidateSize() {
        if (!this.mapInstance) return;
        this.mapInstance.invalidateSize();
    }

    /**
     * Enter fullscreen mode
     */
    enterFullscreen() {
        if (!this.mapContainer) return;

        const requestFullscreen = this.mapContainer.requestFullscreen ||
            this.mapContainer.mozRequestFullScreen ||
            this.mapContainer.webkitRequestFullscreen ||
            this.mapContainer.msRequestFullscreen;

        if (requestFullscreen) {
            requestFullscreen.call(this.mapContainer);
            this._emit('map:fullscreen:enter');
        }
    }

    /**
     * Exit fullscreen mode
     */
    exitFullscreen() {
        const exitFullscreen = document.exitFullscreen ||
            document.mozCancelFullScreen ||
            document.webkitExitFullscreen ||
            document.msExitFullscreen;

        if (exitFullscreen) {
            exitFullscreen.call(document);
            this._emit('map:fullscreen:exit');
        }
    }

    /**
     * Check if in fullscreen mode
     * @returns {boolean} Fullscreen status
     */
    isFullscreen() {
        return !!(document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement);
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler to remove
     */
    off(event, handler) {
        if (!this.eventHandlers.has(event)) return;

        const handlers = this.eventHandlers.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Emit event
     * @private
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    _emit(event, data = null) {
        if (!this.eventHandlers.has(event)) return;

        const handlers = this.eventHandlers.get(event);
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`[MapService] Error in event handler for '${event}':`, error);
            }
        });
    }

    /**
     * Destroy map instance
     */
    destroy() {
        if (this.mapInstance) {
            this.mapInstance.remove();
            this.mapInstance = null;
        }

        this.layers.clear();
        this.controls.clear();
        this.eventHandlers.clear();
        this.mapContainer = null;
        this.isInitialized = false;

        console.log('[MapService] Map destroyed successfully');
    }

    /**
     * Reset map to initial state
     */
    reset() {
        if (!this.mapInstance) return;

        this.setView(this.config.defaultCenter, this.config.defaultZoom);
        this._emit('map:reset');
    }

    /**
     * Update map configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        if (this.mapInstance && newConfig.maxBounds) {
            this.mapInstance.setMaxBounds(newConfig.maxBounds);
        }
    }

    /**
     * Get map configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

// Create singleton instance
const mapService = new MapService();

export default mapService;