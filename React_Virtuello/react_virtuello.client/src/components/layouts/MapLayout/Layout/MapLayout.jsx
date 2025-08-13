import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import MapSidebar from '../components/MapSidebar/MapSidebar';
import MapSearchInput from '../components/MapSearchInput/MapSearchInput';
import MapContainer from '../components/MapContainer/MapContainer';
import MapTags from '../components/MapTags/MapTags';
import ProfileDropdown from '../components/ProfileDropdown/ProfileDropdown';
import './MapLayout.css';

const MapLayout = ({
    children,
    sidebarContent = null,
    onLocationSelect,
    onSearchResult,
    defaultCenter = [35.1765, -5.2339], // Tangier, Morocco coordinates
    defaultZoom = 13,
    markers = [],
    routes = [],
    businesses = [],
    className = ''
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTagsPanelVisible, setIsTagsPanelVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(defaultZoom);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-hide tags panel on desktop, keep mobile behavior separate
    useEffect(() => {
        if (!isMobile) {
            setIsTagsPanelVisible(true); // Show tags by default on desktop
        } else {
            setIsTagsPanelVisible(false); // Hide tags by default on mobile
        }
    }, [isMobile]);

    // Event handlers
    const handleSearchResults = useCallback((results) => {
        setSearchResults(results);
        if (onSearchResult) {
            onSearchResult(results);
        }
        if (results.length > 0) {
            setIsSidebarOpen(true);
        }
    }, [onSearchResult]);

    const handleLocationSelect = useCallback((location) => {
        setSelectedLocation(location);
        if (location && location.coordinates) {
            setMapCenter(location.coordinates);
            setMapZoom(16);
        }
        if (onLocationSelect) {
            onLocationSelect(location);
        }
        setIsSidebarOpen(true);
    }, [onLocationSelect]);

    const handleMapClick = useCallback((event) => {
        const { lat, lng } = event.latlng;
        const clickedLocation = {
            id: 'clicked',
            name: t('map.selected_location'),
            coordinates: [lat, lng],
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        };
        handleLocationSelect(clickedLocation);
    }, [handleLocationSelect, t]);

    const handleSidebarToggle = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const handleTagsPanelToggle = useCallback(() => {
        setIsTagsPanelVisible(prev => !prev);
    }, []);

    const handleTagSelect = useCallback((tag) => {
        setSelectedTags(prev => [...prev, tag]);
    }, []);

    const handleTagDeselect = useCallback((tag) => {
        setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
    }, []);

    const handleCategorySelect = useCallback((category) => {
        setSelectedCategories(prev => [...prev, category]);
    }, []);

    const handleCategoryDeselect = useCallback((category) => {
        setSelectedCategories(prev => prev.filter(c => c.id !== category.id));
    }, []);

    // Generate sidebar content
    const generateSidebarContent = () => {
        if (sidebarContent) {
            return sidebarContent;
        }

        return (
            <div className="map-sidebar__default-content">
                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="search-results">
                        <h3 className="search-results__title">
                            {t('map.search_results')} ({searchResults.length})
                        </h3>
                        <div className="search-results__list">
                            {searchResults.map((result) => (
                                <div
                                    key={result.id}
                                    className="search-result-item"
                                    onClick={() => handleLocationSelect(result)}
                                >
                                    <div className="search-result-item__name">{result.name}</div>
                                    <div className="search-result-item__address">{result.address}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected Location Details */}
                {selectedLocation && (
                    <div className="selected-location">
                        <h3 className="selected-location__title">{selectedLocation.name}</h3>
                        <div className="selected-location__details">
                            {selectedLocation.description && (
                                <div className="selected-location__description">{selectedLocation.description}</div>
                            )}
                            {selectedLocation.address && (
                                <div className="selected-location__address">{selectedLocation.address}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Businesses List */}
                {businesses.length > 0 && (
                    <div className="businesses-list">
                        <h3 className="businesses-list__title">
                            {t('map.nearby_businesses')} ({businesses.length})
                        </h3>
                        <div className="businesses-list__items">
                            {businesses.map((business) => (
                                <div
                                    key={business.id}
                                    className="business-item"
                                    onClick={() => handleLocationSelect(business)}
                                >
                                    <div className="business-item__name">{business.name}</div>
                                    <div className="business-item__description">{business.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {searchResults.length === 0 && !selectedLocation && businesses.length === 0 && (
                    <div className="sidebar-empty-state">
                        <div className="sidebar-empty-state__icon">🗺️</div>
                        <h3 className="sidebar-empty-state__title">{t('map.explore_map')}</h3>
                        <p className="sidebar-empty-state__description">
                            {t('map.explore_description')}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`map-layout ${className} ${isMobile ? 'map-layout--mobile' : 'map-layout--desktop'}`}>
            {/* Desktop Layout - Search Input at top center, Profile top right, Tags floating */}
            {!isMobile && (
                <>
                    {/* Search Input - Floating at top center */}
                    <div className="map-layout__search-desktop">
                        <MapSearchInput
                            onResults={handleSearchResults}
                            onLocationSelect={handleLocationSelect}
                            onToggleSidebar={handleSidebarToggle}
                            isSidebarOpen={isSidebarOpen}
                            isMobile={false}
                            placeholder={t('map.search_placeholder')}
                            className="map-layout__search-input"
                        />
                    </div>

                    {/* Profile Dropdown - Top Right */}
                    <div className="map-layout__profile-desktop">
                        <ProfileDropdown user={user} />
                    </div>

                    {/* Tags Panel - Floating */}
                    <MapTags
                        isVisible={isTagsPanelVisible}
                        isMobile={false}
                        onToggleVisibility={handleTagsPanelToggle}
                        selectedTags={selectedTags}
                        selectedCategories={selectedCategories}
                        onTagSelect={handleTagSelect}
                        onTagDeselect={handleTagDeselect}
                        onCategorySelect={handleCategorySelect}
                        onCategoryDeselect={handleCategoryDeselect}
                        className="map-layout__tags-desktop"
                    />
                </>
            )}

            {/* Mobile Layout - Search and Profile at top, Tags toggle button */}
            {isMobile && (
                <>
                    {/* Mobile Header with Search and Profile */}
                    <div className="map-layout__mobile-header">
                        <div className="map-layout__search-mobile">
                            <MapSearchInput
                                onResults={handleSearchResults}
                                onLocationSelect={handleLocationSelect}
                                onToggleSidebar={handleSidebarToggle}
                                onToggleTags={handleTagsPanelToggle}
                                isSidebarOpen={isSidebarOpen}
                                isTagsPanelVisible={isTagsPanelVisible}
                                isMobile={true}
                                placeholder={t('map.search_placeholder')}
                                className="map-layout__search-input"
                            />
                        </div>

                        <div className="map-layout__profile-mobile">
                            <ProfileDropdown user={user} />
                        </div>
                    </div>

                    {/* Mobile Tags Toggle Button */}
                    <div className="map-layout__tags-toggle-mobile">
                        <button
                            className={`tags-toggle-btn ${isTagsPanelVisible ? 'tags-toggle-btn--active' : ''}`}
                            onClick={handleTagsPanelToggle}
                            aria-label={t('map.toggle_filters')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                            </svg>
                            <span>{t('map.filters')}</span>
                        </button>
                    </div>

                    {/* Mobile Tags Panel Overlay */}
                    <MapTags
                        isVisible={isTagsPanelVisible}
                        isMobile={true}
                        onToggleVisibility={handleTagsPanelToggle}
                        selectedTags={selectedTags}
                        selectedCategories={selectedCategories}
                        onTagSelect={handleTagSelect}
                        onTagDeselect={handleTagDeselect}
                        onCategorySelect={handleCategorySelect}
                        onCategoryDeselect={handleCategoryDeselect}
                        className="map-layout__tags-mobile"
                    />
                </>
            )}

            {/* Sidebar */}
            <MapSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onToggle={handleSidebarToggle}
                title={t('map.sidebar_title')}
                isMobile={isMobile}
                className="map-layout__sidebar"
            >
                {generateSidebarContent()}
            </MapSidebar>

            {/* Map Container */}
            <div className={`map-layout__map ${isSidebarOpen && !isMobile ? 'map-layout__map--sidebar-open' : ''}`}>
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    markers={markers}
                    routes={routes}
                    onMapClick={handleMapClick}
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                    className="map-layout__map-component"
                />
            </div>

            {/* Children (additional overlays) */}
            {children}
        </div>
    );
};

export default MapLayout;