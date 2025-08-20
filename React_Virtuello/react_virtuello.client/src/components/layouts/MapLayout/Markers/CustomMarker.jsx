/**
 * CustomMarker Component - Generic Custom Marker for Map
 * Flexible marker component for user locations, waypoints, and custom markers
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useCallback, useMemo } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import { createLocationIcon, createRouteIcon, createCustomImageIcon, createCustomSVGIcon } from '../Utils/markerIcons';
import PropTypes from 'prop-types';

const CustomMarker = ({
    // Core properties
    position,
    markerType = 'location', // 'location', 'route', 'custom', 'user'

    // Marker data
    data = {},
    title = '',
    description = '',

    // Appearance
    icon = null,
    iconType = 'default', // For location: 'default', 'user', 'search', 'target'
    color = null,
    size = 'medium',
    number = null, // For route markers
    letter = null, // For route markers

    // States
    isSelected = false,
    isHovered = false,
    isActive = false,
    isDraggable = false,

    // Content
    showTooltip = true,
    showPopup = false,
    tooltipContent = null,
    popupContent = null,

    // Events
    onClick = null,
    onMouseOver = null,
    onMouseOut = null,
    onDragEnd = null,

    // Styling
    zIndexOffset = 0,
    className = '',
    markerRef = null
}) => {
    // =============================================================================
    // MARKER ICON CREATION
    // =============================================================================

    /**
     * Create marker icon based on type and configuration
     */
    const markerIcon = useMemo(() => {
        // Use custom icon if provided
        if (icon) {
            if (typeof icon === 'string') {
                // URL or SVG string
                if (icon.startsWith('<svg') || icon.includes('svg')) {
                    return createCustomSVGIcon(icon, { size, color });
                } else {
                    return createCustomImageIcon(icon, { size });
                }
            } else {
                // Leaflet icon object
                return icon;
            }
        }

        // Create icon based on marker type
        switch (markerType) {
            case 'location':
            case 'user':
                return createLocationIcon({
                    locationType: iconType,
                    size: isSelected ? 'large' : size,
                    isActive: isSelected || isHovered || isActive,
                    color
                });

            case 'route':
            case 'waypoint':
                return createRouteIcon({
                    routeType: iconType,
                    size: isSelected ? 'large' : size,
                    number,
                    letter,
                    color
                });

            case 'custom':
            default:
                return createLocationIcon({
                    locationType: 'custom',
                    size: isSelected ? 'large' : size,
                    isActive: isSelected || isHovered || isActive,
                    color: color || '#6366f1'
                });
        }
    }, [
        icon, markerType, iconType, size, isSelected, isHovered, isActive,
        color, number, letter
    ]);

    /**
     * Calculate z-index based on marker importance
     */
    const zIndex = useMemo(() => {
        let baseZIndex = 300 + zIndexOffset;

        // Higher z-index for selected/hovered markers
        if (isSelected) baseZIndex += 1000;
        else if (isHovered) baseZIndex += 500;
        else if (isActive) baseZIndex += 200;

        // Higher z-index for user location
        if (markerType === 'user') baseZIndex += 100;
        else if (markerType === 'route') baseZIndex += 50;

        return baseZIndex;
    }, [markerType, isSelected, isHovered, isActive, zIndexOffset]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle marker click
     */
    const handleClick = useCallback((event) => {
        event.originalEvent.stopPropagation();

        if (onClick) {
            onClick({
                type: markerType,
                position,
                data,
                title
            }, event);
        }
    }, [markerType, position, data, title, onClick]);

    /**
     * Handle marker mouse over
     */
    const handleMouseOver = useCallback((event) => {
        if (onMouseOver) {
            onMouseOver({
                type: markerType,
                position,
                data,
                title
            }, event);
        }
    }, [markerType, position, data, title, onMouseOver]);

    /**
     * Handle marker mouse out
     */
    const handleMouseOut = useCallback((event) => {
        if (onMouseOut) {
            onMouseOut({
                type: markerType,
                position,
                data,
                title
            }, event);
        }
    }, [markerType, position, data, title, onMouseOut]);

    /**
     * Handle marker drag end
     */
    const handleDragEnd = useCallback((event) => {
        const newPosition = event.target.getLatLng();

        if (onDragEnd) {
            onDragEnd({
                type: markerType,
                position: [newPosition.lat, newPosition.lng],
                data,
                title,
                originalPosition: position
            }, event);
        }
    }, [markerType, position, data, title, onDragEnd]);

    // =============================================================================
    // CONTENT GENERATION
    // =============================================================================

    /**
     * Generate default tooltip content
     */
    const defaultTooltipContent = useMemo(() => {
        if (tooltipContent) return tooltipContent;
        if (!showTooltip) return null;

        return (
            <div className="custom-marker-tooltip">
                {title && (
                    <div className="tooltip-title">
                        <strong>{title}</strong>
                    </div>
                )}

                {description && (
                    <div className="tooltip-description">
                        {description.length > 60
                            ? `${description.substring(0, 60)}...`
                            : description
                        }
                    </div>
                )}

                {data.address && (
                    <div className="tooltip-address">
                        📍 {data.address}
                    </div>
                )}

                {markerType === 'route' && (number || letter) && (
                    <div className="tooltip-route-info">
                        {number && <span>Stop #{number}</span>}
                        {letter && <span>Point {letter}</span>}
                    </div>
                )}

                {data.accuracy && markerType === 'user' && (
                    <div className="tooltip-accuracy">
                        Accuracy: ±{Math.round(data.accuracy)}m
                    </div>
                )}
            </div>
        );
    }, [tooltipContent, showTooltip, title, description, data, markerType, number, letter]);

    /**
     * Generate default popup content
     */
    const defaultPopupContent = useMemo(() => {
        if (popupContent) return popupContent;
        if (!showPopup) return null;

        return (
            <div className="custom-marker-popup">
                <div className="popup-header">
                    {title && <h3 className="popup-title">{title}</h3>}
                    <span className={`popup-type type-${markerType}`}>
                        {markerType.charAt(0).toUpperCase() + markerType.slice(1)}
                    </span>
                </div>

                {description && (
                    <div className="popup-description">
                        {description}
                    </div>
                )}

                <div className="popup-details">
                    <div className="popup-coordinates">
                        <strong>Coordinates:</strong><br />
                        {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </div>

                    {data.address && (
                        <div className="popup-address">
                            <strong>Address:</strong><br />
                            {data.address}
                        </div>
                    )}

                    {data.accuracy && markerType === 'user' && (
                        <div className="popup-accuracy">
                            <strong>GPS Accuracy:</strong> ±{Math.round(data.accuracy)}m
                        </div>
                    )}

                    {data.timestamp && (
                        <div className="popup-timestamp">
                            <strong>Created:</strong><br />
                            {new Date(data.timestamp).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        );
    }, [popupContent, showPopup, title, description, position, data, markerType]);

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={markerIcon}
            zIndexOffset={zIndex}
            draggable={isDraggable}
            eventHandlers={{
                click: handleClick,
                mouseover: handleMouseOver,
                mouseout: handleMouseOut,
                ...(isDraggable && { dragend: handleDragEnd })
            }}
            className={`custom-marker ${className} marker-${markerType} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''}`}
            data-marker-type={markerType}
            data-marker-id={data.id}
            title={title}
        >
            {/* Tooltip */}
            {showTooltip && defaultTooltipContent && (
                <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={0.95}
                    className="custom-marker-tooltip-container"
                    permanent={false}
                    sticky={true}
                >
                    {defaultTooltipContent}
                </Tooltip>
            )}

            {/* Popup */}
            {showPopup && defaultPopupContent && (
                <Popup
                    closeButton={true}
                    closeOnClick={false}
                    className="custom-marker-popup-container"
                    maxWidth={300}
                    minWidth={200}
                >
                    {defaultPopupContent}
                </Popup>
            )}
        </Marker>
    );
};

// =============================================================================
// PROP TYPES
// =============================================================================

CustomMarker.propTypes = {
    // Core properties
    position: PropTypes.arrayOf(PropTypes.number).isRequired,
    markerType: PropTypes.oneOf(['location', 'route', 'custom', 'user']),

    // Marker data
    data: PropTypes.object,
    title: PropTypes.string,
    description: PropTypes.string,

    // Appearance
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    iconType: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    number: PropTypes.number,
    letter: PropTypes.string,

    // States
    isSelected: PropTypes.bool,
    isHovered: PropTypes.bool,
    isActive: PropTypes.bool,
    isDraggable: PropTypes.bool,

    // Content
    showTooltip: PropTypes.bool,
    showPopup: PropTypes.bool,
    tooltipContent: PropTypes.node,
    popupContent: PropTypes.node,

    // Events
    onClick: PropTypes.func,
    onMouseOver: PropTypes.func,
    onMouseOut: PropTypes.func,
    onDragEnd: PropTypes.func,

    // Styling
    zIndexOffset: PropTypes.number,
    className: PropTypes.string,
    markerRef: PropTypes.object
};

export default CustomMarker;