import React, { useState, useCallback, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../../contexts/AuthContext';
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
    const { user } = useContext(AuthContext);
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
            setIsTagsPanelVisible(true);
        } else {
            setIsTagsPanelVisible(false);
        }
    }, [isMobile]);

    const handleSidebarToggle = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const handleTagsPanelToggle = useCallback(() => {
        setIsTagsPanelVisible(prev => !prev);
    }, []);

    const handleSearchResults = useCallback((results) => {
        setSearchResults(results);
        if (onSearchResult) {
            onSearchResult(results);
        }

        // Auto-open sidebar if there are results and content to show
        if (results.length > 0 && sidebarContent) {
            setIsSidebarOpen(true);
        }
    }, [onSearchResult, sidebarContent]);

    const handleLocationSelect = useCallback((location) => {
        setSelectedLocation(location);
        setMapCenter([location.lat, location.lng]);
        setMapZoom(16);

        if (onLocationSelect) {
            onLocationSelect(location);
        }
    }, [onLocationSelect]);

    const handleMapClick = useCallback((event) => {
        const { lat, lng } = event.latlng;
        const clickedLocation = { lat, lng, name: t('map.selected_location') };
        handleLocationSelect(clickedLocation);
    }, [handleLocationSelect, t]);

    // Tag management handlers
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

    // Generate sidebar content based on current state
    const generateSidebarContent = () => {
        if (sidebarContent) return sidebarContent;

        return (
            <div className="map-sidebar__default-content">
                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="search-results">
                        <h3 className="search-results__title">
                            {t('map.search_results')} ({searchResults.length})
                        </h3>
                        <div className="search-results__list">
                            {searchResults.map((result, index) => (
                                <div
                                    key={result.id || index}
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

                {/* Selected Location */}
                {selectedLocation && (
                    <div className="selected-location">
                        <h3 className="selected-location__title">{t('map.selected_location')}</h3>
                        <div className="selected-location__details">
                            <div className="selected-location__name">{selectedLocation.name}</div>
                            <div className="selected-location__coordinates">
                                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                            </div>
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
            {/* Profile Dropdown - Top Right */}
            <div className="map-layout__profile">
                <ProfileDropdown user={user} />
            </div>

            {/* Map Search Input - Floating on top */}
            <div className="map-layout__search">
                <MapSearchInput
                    onResults={handleSearchResults}
                    onLocationSelect={handleLocationSelect}
                    onToggleSidebar={handleSidebarToggle}
                    onToggleTags={isMobile ? handleTagsPanelToggle : undefined}
                    isSidebarOpen={isSidebarOpen}
                    isTagsPanelVisible={isTagsPanelVisible}
                    isMobile={isMobile}
                    placeholder={t('map.search_placeholder')}
                    className="map-layout__search-input"
                />
            </div>

            {/* Map Tags Panel */}
            <MapTags
                isVisible={isTagsPanelVisible}
                isMobile={isMobile}
                onToggleVisibility={handleTagsPanelToggle}
                selectedTags={selectedTags}
                selectedCategories={selectedCategories}
                onTagSelect={handleTagSelect}
                onTagDeselect={handleTagDeselect}
                onCategorySelect={handleCategorySelect}
                onCategoryDeselect={handleCategoryDeselect}
                className="map-layout__tags"
            />

            {/* Sidebar */}
            <div className="map-layout__sidebar">
                <MapSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onToggle={handleSidebarToggle}
                    title={t('map.sidebar_title')}
                    className="map-layout__sidebar-component"
                >
                    {generateSidebarContent()}
                </MapSidebar>
            </div>

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