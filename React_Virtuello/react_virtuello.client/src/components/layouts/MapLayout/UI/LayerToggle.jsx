/**
 * LayerToggle Component - Map Layer Visibility Control
 * Provides toggle controls for different map layers (businesses, events, routes)
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import './layertoggle.css';

const LayerToggle = ({
    layers = {},
    onLayerToggle,
    onLayerOpacityChange,
    visibleLayers = {},
    layerOpacity = {},
    showMarkerCounts = true,
    showOpacitySliders = true,
    compactMode = false,
    className = '',
    theme = 'light'
}) => {
    // =============================================================================
    // STATE MANAGEMENT
    // =============================================================================

    const [expandedLayer, setExpandedLayer] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(compactMode);

    // =============================================================================
    // LAYER CONFIGURATION
    // =============================================================================

    const layerConfig = useMemo(() => ({
        businesses: {
            label: 'Businesses',
            icon: '🏢',
            color: '#10b981',
            description: 'Business locations and establishments',
            defaultOpacity: 1.0
        },
        events: {
            label: 'Events',
            icon: '📅',
            color: '#8b5cf6',
            description: 'Upcoming and ongoing events',
            defaultOpacity: 1.0
        },
        routes: {
            label: 'Routes',
            icon: '🛣️',
            color: '#3b82f6',
            description: 'Navigation routes and paths',
            defaultOpacity: 0.8
        },
        heatmap: {
            label: 'Heatmap',
            icon: '🔥',
            color: '#ef4444',
            description: 'Activity density visualization',
            defaultOpacity: 0.6
        },
        custom: {
            label: 'Custom',
            icon: '📍',
            color: '#6b7280',
            description: 'Custom markers and annotations',
            defaultOpacity: 1.0
        }
    }), []);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle layer visibility toggle
     */
    const handleLayerToggle = useCallback((layerType) => {
        if (onLayerToggle) {
            onLayerToggle(layerType, !visibleLayers[layerType]);
        }
    }, [onLayerToggle, visibleLayers]);

    /**
     * Handle layer opacity change
     */
    const handleOpacityChange = useCallback((layerType, opacity) => {
        if (onLayerOpacityChange) {
            onLayerOpacityChange(layerType, opacity);
        }
    }, [onLayerOpacityChange]);

    /**
     * Toggle layer details expansion
     */
    const toggleLayerExpansion = useCallback((layerType) => {
        setExpandedLayer(expandedLayer === layerType ? null : layerType);
    }, [expandedLayer]);

    /**
     * Toggle component collapsed state
     */
    const toggleCollapsed = useCallback(() => {
        setIsCollapsed(!isCollapsed);
    }, [isCollapsed]);

    // =============================================================================
    // HELPER FUNCTIONS
    // =============================================================================

    /**
     * Get layer marker count
     */
    const getLayerCount = useCallback((layerType) => {
        return layers[layerType]?.length || 0;
    }, [layers]);

    /**
     * Get current opacity value
     */
    const getCurrentOpacity = useCallback((layerType) => {
        return layerOpacity[layerType] ?? layerConfig[layerType]?.defaultOpacity ?? 1.0;
    }, [layerOpacity, layerConfig]);

    /**
     * Format layer count for display
     */
    const formatCount = useCallback((count) => {
        if (count >= 1000) {
            return `${Math.floor(count / 1000)}k+`;
        }
        return count.toString();
    }, []);

    // =============================================================================
    // RENDER FUNCTIONS
    // =============================================================================

    /**
     * Render layer item
     */
    const renderLayerItem = useCallback((layerType) => {
        const config = layerConfig[layerType];
        const isVisible = visibleLayers[layerType] || false;
        const isExpanded = expandedLayer === layerType;
        const count = getLayerCount(layerType);
        const opacity = getCurrentOpacity(layerType);

        if (!config) return null;

        return (
            <div
                key={layerType}
                className={`layer-toggle__item ${isVisible ? 'visible' : 'hidden'} ${isExpanded ? 'expanded' : ''}`}
            >
                {/* Main Layer Control */}
                <div className="layer-toggle__main">
                    <button
                        className="layer-toggle__button"
                        onClick={() => handleLayerToggle(layerType)}
                        style={{ '--layer-color': config.color }}
                        aria-label={`Toggle ${config.label} layer`}
                        title={config.description}
                    >
                        <span className="layer-toggle__icon">{config.icon}</span>

                        <div className="layer-toggle__info">
                            <span className="layer-toggle__label">{config.label}</span>
                            {showMarkerCounts && count > 0 && (
                                <span className="layer-toggle__count">
                                    {formatCount(count)}
                                </span>
                            )}
                        </div>

                        <div className="layer-toggle__indicators">
                            {/* Visibility Indicator */}
                            <div className={`layer-toggle__visibility ${isVisible ? 'on' : 'off'}`}>
                                {isVisible ? '👁️' : '🚫'}
                            </div>

                            {/* Opacity Indicator */}
                            {isVisible && opacity < 1 && (
                                <div className="layer-toggle__opacity-indicator">
                                    {Math.round(opacity * 100)}%
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Expand/Settings Button */}
                    {showOpacitySliders && (
                        <button
                            className={`layer-toggle__expand ${isExpanded ? 'active' : ''}`}
                            onClick={() => toggleLayerExpansion(layerType)}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} layer settings`}
                        >
                            ⚙️
                        </button>
                    )}
                </div>

                {/* Layer Settings Panel */}
                {isExpanded && showOpacitySliders && (
                    <div className="layer-toggle__settings">
                        <div className="layer-toggle__setting">
                            <label className="layer-toggle__setting-label">
                                Opacity
                            </label>
                            <div className="layer-toggle__opacity-control">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={opacity}
                                    onChange={(e) => handleOpacityChange(layerType, parseFloat(e.target.value))}
                                    className="layer-toggle__opacity-slider"
                                    style={{ '--layer-color': config.color }}
                                />
                                <span className="layer-toggle__opacity-value">
                                    {Math.round(opacity * 100)}%
                                </span>
                            </div>
                        </div>

                        {/* Layer Description */}
                        <div className="layer-toggle__description">
                            {config.description}
                        </div>
                    </div>
                )}
            </div>
        );
    }, [
        layerConfig, visibleLayers, expandedLayer, showMarkerCounts, showOpacitySliders,
        getLayerCount, getCurrentOpacity, formatCount, handleLayerToggle,
        toggleLayerExpansion, handleOpacityChange
    ]);

    /**
     * Render quick toggle buttons (compact mode)
     */
    const renderQuickToggles = useCallback(() => {
        return Object.keys(layerConfig).map(layerType => {
            const config = layerConfig[layerType];
            const isVisible = visibleLayers[layerType] || false;
            const count = getLayerCount(layerType);

            return (
                <button
                    key={layerType}
                    className={`layer-toggle__quick-btn ${isVisible ? 'active' : ''}`}
                    onClick={() => handleLayerToggle(layerType)}
                    style={{ '--layer-color': config.color }}
                    title={`${config.label} (${count})`}
                >
                    <span className="layer-toggle__quick-icon">{config.icon}</span>
                    {showMarkerCounts && count > 0 && (
                        <span className="layer-toggle__quick-count">{formatCount(count)}</span>
                    )}
                </button>
            );
        });
    }, [layerConfig, visibleLayers, getLayerCount, formatCount, handleLayerToggle, showMarkerCounts]);

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    const availableLayers = Object.keys(layerConfig).filter(type =>
        layers[type] !== undefined
    );

    if (availableLayers.length === 0) {
        return null;
    }

    return (
        <div className={`layer-toggle ${className} theme-${theme} ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            {/* Header */}
            <div className="layer-toggle__header">
                <h3 className="layer-toggle__title">
                    🗺️ Map Layers
                </h3>
                <button
                    className="layer-toggle__collapse"
                    onClick={toggleCollapsed}
                    aria-label={isCollapsed ? 'Expand layers' : 'Collapse layers'}
                >
                    {isCollapsed ? '⬇️' : '⬆️'}
                </button>
            </div>

            {/* Content */}
            <div className="layer-toggle__content">
                {isCollapsed ? (
                    /* Compact Mode - Quick Toggles */
                    <div className="layer-toggle__quick-toggles">
                        {renderQuickToggles()}
                    </div>
                ) : (
                    /* Expanded Mode - Full Layer Controls */
                    <div className="layer-toggle__layers">
                        {availableLayers.map(renderLayerItem)}
                    </div>
                )}
            </div>

            {/* Footer - Layer Summary */}
            {!isCollapsed && (
                <div className="layer-toggle__footer">
                    <div className="layer-toggle__summary">
                        Total: {availableLayers.reduce((sum, type) => sum + getLayerCount(type), 0)} markers
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayerToggle;