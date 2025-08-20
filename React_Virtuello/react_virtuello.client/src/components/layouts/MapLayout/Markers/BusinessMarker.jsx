/**
 * BusinessMarker Component - Business Marker for Map
 * Renders business markers with status-based styling and interactive features
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useCallback, useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { createBusinessIcon } from '../Utils/markerIcons';
import BusinessPopup from './BusinessPopup';
import PropTypes from 'prop-types';

const BusinessMarker = ({
    business,
    isSelected = false,
    isHovered = false,
    onClick = null,
    onMouseOver = null,
    onMouseOut = null,
    showTooltip = true,
    showPopup = true,
    zIndexOffset = 0,
    className = '',
    markerRef = null
}) => {
    // =============================================================================
    // MARKER CONFIGURATION
    // =============================================================================

    /**
     * Create marker icon based on business data
     */
    const markerIcon = useMemo(() => {
        return createBusinessIcon({
            status: business.status?.toLowerCase() || 'active',
            rating: business.rating || 0,
            hasLogo: !!business.logoImage,
            size: isSelected ? 'large' : 'medium',
            isActive: isSelected || isHovered
        });
    }, [business.status, business.rating, business.logoImage, isSelected, isHovered]);

    /**
     * Marker position
     */
    const position = useMemo(() => {
        return [business.latitude, business.longitude];
    }, [business.latitude, business.longitude]);

    /**
     * Calculate z-index based on business priority
     */
    const zIndex = useMemo(() => {
        let baseZIndex = 100 + zIndexOffset;

        // Higher z-index for selected/hovered markers
        if (isSelected) baseZIndex += 1000;
        else if (isHovered) baseZIndex += 500;

        // Higher z-index for higher rated businesses
        if (business.rating >= 4.5) baseZIndex += 50;
        else if (business.rating >= 4.0) baseZIndex += 30;
        else if (business.rating >= 3.5) baseZIndex += 10;

        // Higher z-index for active businesses
        if (business.status === 'Active') baseZIndex += 20;

        return baseZIndex;
    }, [business.rating, business.status, isSelected, isHovered, zIndexOffset]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle marker click
     */
    const handleClick = useCallback((event) => {
        event.originalEvent.stopPropagation();

        if (onClick) {
            onClick(business, event);
        }
    }, [business, onClick]);

    /**
     * Handle marker mouse over
     */
    const handleMouseOver = useCallback((event) => {
        if (onMouseOver) {
            onMouseOver(business, event);
        }
    }, [business, onMouseOver]);

    /**
     * Handle marker mouse out
     */
    const handleMouseOut = useCallback((event) => {
        if (onMouseOut) {
            onMouseOut(business, event);
        }
    }, [business, onMouseOut]);

    // =============================================================================
    // TOOLTIP CONTENT
    // =============================================================================

    /**
     * Generate tooltip content
     */
    const tooltipContent = useMemo(() => {
        if (!showTooltip) return null;

        return (
            <div className="business-marker-tooltip">
                <div className="tooltip-header">
                    <strong className="tooltip-name">{business.name}</strong>
                    {business.rating > 0 && (
                        <span className="tooltip-rating">
                            ⭐ {business.rating.toFixed(1)}
                            {business.reviewCount > 0 && (
                                <span className="tooltip-reviews">
                                    ({business.reviewCount})
                                </span>
                            )}
                        </span>
                    )}
                </div>

                {business.description && (
                    <div className="tooltip-description">
                        {business.description.length > 80
                            ? `${business.description.substring(0, 80)}...`
                            : business.description
                        }
                    </div>
                )}

                {business.address && (
                    <div className="tooltip-address">
                        📍 {business.address}
                    </div>
                )}

                <div className="tooltip-status">
                    <span className={`status-badge status-${business.status?.toLowerCase() || 'unknown'}`}>
                        {business.status || 'Unknown'}
                    </span>
                </div>
            </div>
        );
    }, [business, showTooltip]);

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={markerIcon}
            zIndexOffset={zIndex}
            eventHandlers={{
                click: handleClick,
                mouseover: handleMouseOver,
                mouseout: handleMouseOut
            }}
            className={`business-marker ${className} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
            data-business-id={business.id}
            data-business-status={business.status}
            title={business.name}
        >
            {/* Tooltip */}
            {showTooltip && tooltipContent && (
                <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={0.95}
                    className="business-marker-tooltip-container"
                    permanent={false}
                    sticky={true}
                >
                    {tooltipContent}
                </Tooltip>
            )}

            {/* Popup */}
            {showPopup && (
                <BusinessPopup
                    business={business}
                    isSelected={isSelected}
                />
            )}
        </Marker>
    );
};

// =============================================================================
// PROP TYPES
// =============================================================================

BusinessMarker.propTypes = {
    business: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired,
        address: PropTypes.string,
        phone: PropTypes.string,
        email: PropTypes.string,
        website: PropTypes.string,
        status: PropTypes.string,
        tags: PropTypes.array,
        coverImage: PropTypes.string,
        logoImage: PropTypes.string,
        rating: PropTypes.number,
        reviewCount: PropTypes.number,
        openingHours: PropTypes.object
    }).isRequired,
    isSelected: PropTypes.bool,
    isHovered: PropTypes.bool,
    onClick: PropTypes.func,
    onMouseOver: PropTypes.func,
    onMouseOut: PropTypes.func,
    showTooltip: PropTypes.bool,
    showPopup: PropTypes.bool,
    zIndexOffset: PropTypes.number,
    className: PropTypes.string,
    markerRef: PropTypes.object
};

export default BusinessMarker;