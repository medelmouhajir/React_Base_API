/**
 * CustomMarker Component - Enhanced Leaflet Marker with Validation
 * Handles custom markers with coordinate validation and proper error handling
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.1 - Added coordinate validation
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';

const CustomMarker = ({
    marker,
    isSelected = false,
    isHovered = false,
    isDraggable = false,
    showTooltip = true,
    showPopup = false,
    tooltipContent = null,
    popupContent = null,
    onClick = null,
    onHover = null,
    onDragEnd = null,
    className = '',
    zIndexOffset = 0
}) => {
    const map = useMap();
    const markerRef = useRef(null);

    // Extract marker data with proper validation
    const {
        id,
        latitude,
        longitude,
        lat, // fallback for old format
        lng, // fallback for old format
        name: title,
        description,
        type: markerType = 'custom',
        data = {},
        number,
        letter,
        icon,
        color = '#6366f1'
    } = marker || {};

    // =============================================================================
    // COORDINATE VALIDATION
    // =============================================================================

    /**
     * Validate and extract coordinates from marker data
     */
    const position = useMemo(() => {
        // Priority: latitude/longitude -> lat/lng -> null
        let lat_val = latitude || lat;
        let lng_val = longitude || lng;

        // Validate coordinates
        if (lat_val === undefined || lng_val === undefined) {
            console.error(`[CustomMarker] Invalid coordinates for marker ${id}:`, {
                latitude: lat_val,
                longitude: lng_val,
                marker
            });
            return null;
        }

        // Convert to numbers and validate range
        lat_val = Number(lat_val);
        lng_val = Number(lng_val);

        if (isNaN(lat_val) || isNaN(lng_val)) {
            console.error(`[CustomMarker] NaN coordinates for marker ${id}:`, {
                latitude: lat_val,
                longitude: lng_val
            });
            return null;
        }

        // Validate coordinate ranges
        if (lat_val < -90 || lat_val > 90 || lng_val < -180 || lng_val > 180) {
            console.error(`[CustomMarker] Coordinates out of range for marker ${id}:`, {
                latitude: lat_val,
                longitude: lng_val
            });
            return null;
        }

        return [lat_val, lng_val];
    }, [latitude, longitude, lat, lng, id, marker]);

    // Don't render if coordinates are invalid
    if (!position) {
        return null;
    }

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle marker click events
     */
    const handleClick = useCallback((event) => {
        if (onClick) {
            onClick({
                marker,
                position,
                data,
                title,
                type: markerType
            }, event);
        }
    }, [marker, position, data, title, markerType, onClick]);

    /**
     * Handle marker hover events
     */
    const handleMouseOver = useCallback((event) => {
        if (onHover) {
            onHover({
                marker,
                position,
                data,
                title,
                type: markerType,
                hovered: true
            }, event);
        }
    }, [marker, position, data, title, markerType, onHover]);

    const handleMouseOut = useCallback((event) => {
        if (onHover) {
            onHover({
                marker,
                position,
                data,
                title,
                type: markerType,
                hovered: false
            }, event);
        }
    }, [marker, position, data, title, markerType, onHover]);

    /**
     * Handle marker drag end events
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
                    <h3>{title || 'Custom Location'}</h3>
                    {markerType && (
                        <span className={`marker-type type-${markerType}`}>
                            {markerType.charAt(0).toUpperCase() + markerType.slice(1)}
                        </span>
                    )}
                </div>

                {description && (
                    <div className="popup-description">
                        <p>{description}</p>
                    </div>
                )}

                <div className="popup-details">
                    <div className="coordinates">
                        📍 {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </div>

                    {data.address && (
                        <div className="address">
                            🏠 {data.address}
                        </div>
                    )}

                    {data.timestamp && (
                        <div className="timestamp">
                            🕒 {new Date(data.timestamp).toLocaleString()}
                        </div>
                    )}
                </div>

                {markerType === 'user' && data.accuracy && (
                    <div className="accuracy-info">
                        <small>GPS Accuracy: ±{Math.round(data.accuracy)}m</small>
                    </div>
                )}
            </div>
        );
    }, [popupContent, showPopup, title, markerType, description, position, data]);

    // =============================================================================
    // MARKER STYLING
    // =============================================================================

    /**
     * Generate marker styling classes
     */
    const markerClasses = useMemo(() => {
        const classes = ['custom-marker'];

        if (className) classes.push(className);
        if (markerType) classes.push(`marker-${markerType}`);
        if (isSelected) classes.push('selected');
        if (isHovered) classes.push('hovered');
        if (isDraggable) classes.push('draggable');

        return classes.join(' ');
    }, [className, markerType, isSelected, isHovered, isDraggable]);

    /**
     * Calculate z-index based on state and priority
     */
    const calculatedZIndexOffset = useMemo(() => {
        let offset = zIndexOffset;

        if (isSelected) offset += 1000;
        if (isHovered) offset += 500;
        if (markerType === 'user') offset += 100;

        return offset;
    }, [zIndexOffset, isSelected, isHovered, markerType]);

    // =============================================================================
    // EFFECTS
    // =============================================================================

    /**
     * Update marker reference for external access
     */
    useEffect(() => {
        if (markerRef.current && map) {
            // Store marker reference for potential external access
            const leafletMarker = markerRef.current;

            // Add custom properties for debugging
            leafletMarker._customData = {
                id,
                type: markerType,
                data
            };
        }
    }, [map, id, markerType, data]);

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={icon}
            draggable={isDraggable}
            zIndexOffset={calculatedZIndexOffset}
            eventHandlers={{
                click: handleClick,
                mouseover: handleMouseOver,
                mouseout: handleMouseOut,
                dragend: handleDragEnd
            }}
            className={markerClasses}
        >
            {/* Tooltip */}
            {defaultTooltipContent && (
                <Tooltip
                    permanent={false}
                    direction="top"
                    className="custom-tooltip"
                >
                    {defaultTooltipContent}
                </Tooltip>
            )}

            {/* Popup */}
            {defaultPopupContent && (
                <Popup
                    maxWidth={300}
                    className="custom-popup"
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
    marker: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        lat: PropTypes.number, // fallback
        lng: PropTypes.number, // fallback
        name: PropTypes.string,
        description: PropTypes.string,
        type: PropTypes.string,
        data: PropTypes.object,
        number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        letter: PropTypes.string,
        icon: PropTypes.object,
        color: PropTypes.string
    }).isRequired,
    isSelected: PropTypes.bool,
    isHovered: PropTypes.bool,
    isDraggable: PropTypes.bool,
    showTooltip: PropTypes.bool,
    showPopup: PropTypes.bool,
    tooltipContent: PropTypes.node,
    popupContent: PropTypes.node,
    onClick: PropTypes.func,
    onHover: PropTypes.func,
    onDragEnd: PropTypes.func,
    className: PropTypes.string,
    zIndexOffset: PropTypes.number
};

export default CustomMarker;