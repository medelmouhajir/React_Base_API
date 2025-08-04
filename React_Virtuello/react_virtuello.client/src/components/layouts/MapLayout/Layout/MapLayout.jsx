import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MapSidebar from '../components/MapSidebar/MapSidebar';
import MapSearchInput from '../components/MapSearchInput/MapSearchInput';
import MapContainer from '../components/MapContainer/MapContainer';
import './MapLayout.css';

const MapLayout = ({
    children,
    sidebarContent = null,
    onLocationSelect,
    onSearchResult,
    defaultCenter = [34.0522, -6.7736], // Fes, Morocco coordinates
    defaultZoom = 13,
    markers = [],
    routes = [],
    businesses = [],
    className = ''
}) => {
    const { t } = useTranslation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(defaultZoom);

    const handleSidebarToggle = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
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

    return (
        <div className={`map-layout ${className}`}>
            {/* Map Search Input - Floating on top */}
            <MapSearchInput
                onResults={handleSearchResults}
                onLocationSelect={handleLocationSelect}
                onToggleSidebar={handleSidebarToggle}
                isSidebarOpen={isSidebarOpen}
                placeholder={t('map.search_placeholder')}
                className="map-layout__search"
            />

            {/* Sidebar */}
            <MapSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onToggle={handleSidebarToggle}
                title={t('map.sidebar_title')}
                className="map-layout__sidebar"
            >
                {sidebarContent || (
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
                                            key={index}
                                            className="search-result-item"
                                            onClick={() => handleLocationSelect(result)}
                                        >
                                            <div className="search-result-item__name">
                                                {result.name}
                                            </div>
                                            {result.address && (
                                                <div className="search-result-item__address">
                                                    {result.address}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selected Location */}
                        {selectedLocation && (
                            <div className="selected-location">
                                <h3 className="selected-location__title">
                                    {t('map.selected_location')}
                                </h3>
                                <div className="selected-location__details">
                                    <div className="selected-location__name">
                                        {selectedLocation.name}
                                    </div>
                                    <div className="selected-location__coordinates">
                                        {t('map.coordinates')}: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                    </div>
                                    {selectedLocation.address && (
                                        <div className="selected-location__address">
                                            {selectedLocation.address}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Businesses List */}
                        {businesses.length > 0 && (
                            <div className="businesses-list">
                                <h3 className="businesses-list__title">
                                    {t('map.nearby_businesses')}
                                </h3>
                                <div className="businesses-list__items">
                                    {businesses.map((business) => (
                                        <div
                                            key={business.id}
                                            className="business-item"
                                            onClick={() => handleLocationSelect({
                                                lat: business.latitude,
                                                lng: business.longitude,
                                                name: business.name,
                                                id: business.id
                                            })}
                                        >
                                            <div className="business-item__name">
                                                {business.name}
                                            </div>
                                            {business.description && (
                                                <div className="business-item__description">
                                                    {business.description}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {searchResults.length === 0 && !selectedLocation && businesses.length === 0 && (
                            <div className="sidebar-empty-state">
                                <div className="sidebar-empty-state__icon">
                                    🗺️
                                </div>
                                <div className="sidebar-empty-state__title">
                                    {t('map.explore_map')}
                                </div>
                                <div className="sidebar-empty-state__description">
                                    {t('map.explore_description')}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </MapSidebar>

            {/* Main Map Container */}
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                markers={markers}
                routes={routes}
                businesses={businesses}
                selectedLocation={selectedLocation}
                onMapClick={handleMapClick}
                onLocationSelect={handleLocationSelect}
                className={`map-layout__map ${isSidebarOpen ? 'map-layout__map--sidebar-open' : ''}`}
            />

            {/* Additional Content */}
            {children}
        </div>
    );
};

export default MapLayout;