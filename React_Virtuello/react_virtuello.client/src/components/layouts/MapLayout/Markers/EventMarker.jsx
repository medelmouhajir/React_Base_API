/**
 * EventMarker Component - Event Marker for Map
 * Renders event markers with date-based styling and status indicators
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useCallback, useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { createEventIcon } from '../Utils/markerIcons';
import EventPopup from './EventPopup';
import PropTypes from 'prop-types';

const EventMarker = ({
    event,
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
    // EVENT STATUS UTILITIES
    // =============================================================================

    /**
     * Determine event timing status
     */
    const eventTiming = useMemo(() => {
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : null;

        if (startDate > now) {
            return 'upcoming';
        } else if (endDate && endDate < now) {
            return 'completed';
        } else if (!endDate && startDate < now) {
            return 'ongoing';
        } else if (endDate && startDate <= now && now <= endDate) {
            return 'ongoing';
        }

        return 'unknown';
    }, [event.startDate, event.endDate]);

    /**
     * Calculate days until event
     */
    const daysUntilEvent = useMemo(() => {
        const now = new Date();
        const startDate = new Date(event.startDate);
        const diffTime = startDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }, [event.startDate]);

    /**
     * Format event date for display
     */
    const formattedDate = useMemo(() => {
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : null;

        const formatOptions = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        if (endDate && endDate.toDateString() !== startDate.toDateString()) {
            // Multi-day event
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else {
            // Single day event
            return startDate.toLocaleDateString('en-US', formatOptions);
        }
    }, [event.startDate, event.endDate]);

    // =============================================================================
    // MARKER CONFIGURATION
    // =============================================================================

    /**
     * Create marker icon based on event data
     */
    const markerIcon = useMemo(() => {
        return createEventIcon({
            status: event.status?.toLowerCase() || eventTiming,
            type: event.type?.toLowerCase() || 'public',
            startDate: event.startDate,
            endDate: event.endDate,
            size: isSelected ? 'large' : 'medium',
            isActive: isSelected || isHovered,
            daysUntil: daysUntilEvent
        });
    }, [event.status, event.type, event.startDate, event.endDate, eventTiming, daysUntilEvent, isSelected, isHovered]);

    /**
     * Marker position
     */
    const position = useMemo(() => {
        return [event.latitude, event.longitude];
    }, [event.latitude, event.longitude]);

    /**
     * Calculate z-index based on event priority
     */
    const zIndex = useMemo(() => {
        let baseZIndex = 200 + zIndexOffset; // Events higher than businesses by default

        // Higher z-index for selected/hovered markers
        if (isSelected) baseZIndex += 1000;
        else if (isHovered) baseZIndex += 500;

        // Higher z-index for upcoming events
        if (eventTiming === 'upcoming') {
            if (daysUntilEvent <= 1) baseZIndex += 100; // Today/tomorrow
            else if (daysUntilEvent <= 7) baseZIndex += 50; // This week
            else if (daysUntilEvent <= 30) baseZIndex += 20; // This month
        } else if (eventTiming === 'ongoing') {
            baseZIndex += 150; // Ongoing events get highest priority
        }

        // Higher z-index for public events
        if (event.type === 'Public') baseZIndex += 30;

        return baseZIndex;
    }, [event.type, eventTiming, daysUntilEvent, isSelected, isHovered, zIndexOffset]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle marker click
     */
    const handleClick = useCallback((leafletEvent) => {
        leafletEvent.originalEvent.stopPropagation();

        if (onClick) {
            onClick(event, leafletEvent);
        }
    }, [event, onClick]);

    /**
     * Handle marker mouse over
     */
    const handleMouseOver = useCallback((leafletEvent) => {
        if (onMouseOver) {
            onMouseOver(event, leafletEvent);
        }
    }, [event, onMouseOver]);

    /**
     * Handle marker mouse out
     */
    const handleMouseOut = useCallback((leafletEvent) => {
        if (onMouseOut) {
            onMouseOut(event, leafletEvent);
        }
    }, [event, onMouseOut]);

    // =============================================================================
    // TOOLTIP CONTENT
    // =============================================================================

    /**
     * Generate tooltip content
     */
    const tooltipContent = useMemo(() => {
        if (!showTooltip) return null;

        return (
            <div className="event-marker-tooltip">
                <div className="tooltip-header">
                    <strong className="tooltip-name">{event.name}</strong>
                    <span className={`tooltip-timing timing-${eventTiming}`}>
                        {eventTiming === 'upcoming' && daysUntilEvent > 0 && (
                            <span>In {daysUntilEvent} day{daysUntilEvent !== 1 ? 's' : ''}</span>
                        )}
                        {eventTiming === 'upcoming' && daysUntilEvent === 0 && (
                            <span>Today</span>
                        )}
                        {eventTiming === 'ongoing' && <span>🔴 Live</span>}
                        {eventTiming === 'completed' && <span>Ended</span>}
                    </span>
                </div>

                <div className="tooltip-date">
                    📅 {formattedDate}
                </div>

                {event.description && (
                    <div className="tooltip-description">
                        {event.description.length > 80
                            ? `${event.description.substring(0, 80)}...`
                            : event.description
                        }
                    </div>
                )}

                {event.address && (
                    <div className="tooltip-address">
                        📍 {event.address}
                    </div>
                )}

                <div className="tooltip-meta">
                    <span className={`type-badge type-${event.type?.toLowerCase() || 'unknown'}`}>
                        {event.type || 'Event'}
                    </span>
                    {event.categories && event.categories.length > 0 && (
                        <span className="category-badge">
                            {event.categories[0]}
                        </span>
                    )}
                </div>
            </div>
        );
    }, [event, showTooltip, eventTiming, daysUntilEvent, formattedDate]);

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
            className={`event-marker ${className} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} timing-${eventTiming}`}
            data-event-id={event.id}
            data-event-status={event.status}
            data-event-timing={eventTiming}
            title={event.name}
        >
            {/* Tooltip */}
            {showTooltip && tooltipContent && (
                <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={0.95}
                    className="event-marker-tooltip-container"
                    permanent={false}
                    sticky={true}
                >
                    {tooltipContent}
                </Tooltip>
            )}

            {/* Popup */}
            {showPopup && (
                <EventPopup
                    event={event}
                    isSelected={isSelected}
                    eventTiming={eventTiming}
                    daysUntilEvent={daysUntilEvent}
                />
            )}
        </Marker>
    );
};

// =============================================================================
// PROP TYPES
// =============================================================================

EventMarker.propTypes = {
    event: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired,
        address: PropTypes.string,
        startDate: PropTypes.string.isRequired,
        endDate: PropTypes.string,
        status: PropTypes.string,
        type: PropTypes.string,
        categories: PropTypes.array,
        coverImage: PropTypes.string,
        organizerId: PropTypes.string
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

export default EventMarker;