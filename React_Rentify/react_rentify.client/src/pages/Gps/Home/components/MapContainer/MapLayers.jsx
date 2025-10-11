// src/pages/Gps/Home/components/MapContainer/MapLayers.jsx
import React, { useState, useEffect } from 'react';
import { TileLayer, LayersControl } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { BaseLayer, Overlay } = LayersControl;

const MapLayers = ({
    showTrafficLayer = false,
    onTrafficToggle,
    showWeatherLayer = false,
    onWeatherToggle
}) => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const [activeBaseLayer, setActiveBaseLayer] = useState('openstreetmap');

    // Base layer configurations
    const baseLayers = {
        openstreetmap: {
            name: t('gps.map.layers.openStreetMap', 'OpenStreetMap'),
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        cartodb_light: {
            name: t('gps.map.layers.lightMode', 'Light Mode'),
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        cartodb_dark: {
            name: t('gps.map.layers.darkMode', 'Dark Mode'),
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        satellite: {
            name: t('gps.map.layers.satellite', 'Satellite'),
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        },
        terrain: {
            name: t('gps.map.layers.terrain', 'Terrain'),
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
        }
    };

    // Overlay layer configurations
    const overlayLayers = {
        traffic: {
            name: t('gps.map.layers.traffic', 'Traffic'),
            url: 'https://traffic-{s}.tiles.mapbox.com/traffic-v1/{z}/{x}/{y}.png?access_token=pk.your_mapbox_token',
            attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
        },
        weather: {
            name: t('gps.map.layers.weather', 'Weather'),
            url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=your_openweather_api_key',
            attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
        }
    };

    // Auto-switch to dark/light mode based on theme
    useEffect(() => {
        if (isDarkMode && activeBaseLayer !== 'cartodb_dark') {
            setActiveBaseLayer('cartodb_dark');
        } else if (!isDarkMode && activeBaseLayer === 'cartodb_dark') {
            setActiveBaseLayer('cartodb_light');
        }
    }, [isDarkMode, activeBaseLayer]);

    return (
        <LayersControl position="topright">
            {/* Base Layers */}
            {Object.entries(baseLayers).map(([key, layer]) => (
                <BaseLayer
                    key={key}
                    checked={key === activeBaseLayer}
                    name={layer.name}
                >
                    <TileLayer
                        url={layer.url}
                        attribution={layer.attribution}
                        maxZoom={19}
                    />
                </BaseLayer>
            ))}

            {/* Overlay Layers */}
            {overlayLayers.traffic && (
                <Overlay
                    checked={showTrafficLayer}
                    name={overlayLayers.traffic.name}
                >
                    <TileLayer
                        url={overlayLayers.traffic.url}
                        attribution={overlayLayers.traffic.attribution}
                        opacity={0.6}
                    />
                </Overlay>
            )}

            {overlayLayers.weather && (
                <Overlay
                    checked={showWeatherLayer}
                    name={overlayLayers.weather.name}
                >
                    <TileLayer
                        url={overlayLayers.weather.url}
                        attribution={overlayLayers.weather.attribution}
                        opacity={0.5}
                    />
                </Overlay>
            )}
        </LayersControl>
    );
};

export default MapLayers;