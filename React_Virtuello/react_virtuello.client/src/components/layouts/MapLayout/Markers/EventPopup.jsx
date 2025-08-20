/**
 * EventPopup Component - Event Information Popup
 * Rich popup content for event markers with schedules and actions
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { Popup } from 'react-leaflet';
import PropTypes from 'prop-types';

const EventPopup = ({
    event,
    eventTiming = 'unknown',
    daysUntilEvent = 0,
    isSelected = false,
    onClose = null,
    onViewDetails = null,
    onGetDirections = null,
    onAddToCalendar = null,
    onShare = null,
    onRegister = null,
    showActions = true,
    maxWidth = 350,
    minWidth = 280,
    className = ''
}) => {
    // =============================================================================
    // DATE AND TIME PROCESSING
    // =============================================================================

    /**
     * Format event dates for display
     */
    const eventDates = useMemo(() => {
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : null;

        const formatOptions = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        const shortFormatOptions = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        // Check if it's a multi-day event
        const isMultiDay = endDate && endDate.toDateString() !== startDate.toDateString();

        if (isMultiDay) {
            return {
                start: startDate.toLocaleDateString('en-US', formatOptions),
                end: endDate.toLocaleDateString('en-US', formatOptions),
                duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
                isMultiDay: true,
                formatted: `${startDate.toLocaleDateString('en-US', shortFormatOptions)} - ${endDate.toLocaleDateString('en-US', shortFormatOptions)}`
            };
        } else {
            const timeFormat = {
                hour: '2-digit',
                minute: '2-digit'
            };

            return {
                start: startDate.toLocaleDateString('en-US', formatOptions),
                end: endDate ? endDate.toLocaleTimeString('en-US', timeFormat) : null,
                duration: 0,
                isMultiDay: false,
                formatted: endDate
                    ? `${startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${startDate.toLocaleTimeString('en-US', timeFormat)} - ${endDate.toLocaleTimeString('en-US', timeFormat)}`
                    : startDate.toLocaleDateString('en-US', formatOptions)
            };
        }
    }, [event.startDate, event.endDate]);

    /**
     * Get event status display
     */
    const eventStatus = useMemo(() => {
        switch (eventTiming) {
            case 'upcoming':
                if (daysUntilEvent === 0) return { text: 'Today', class: 'today', icon: '🔥' };
                if (daysUntilEvent === 1) return { text: 'Tomorrow', class: 'tomorrow', icon: '📅' };
                if (daysUntilEvent <= 7) return { text: `In ${daysUntilEvent} days`, class: 'this-week', icon: '📅' };
                return { text: `In ${daysUntilEvent} days`, class: 'upcoming', icon: '📅' };
            case 'ongoing':
                return { text: 'Live Now', class: 'live', icon: '🔴' };
            case 'completed':
                return { text: 'Ended', class: 'ended', icon: '✅' };
            default:
                return { text: 'Unknown', class: 'unknown', icon: '❓' };
        }
    }, [eventTiming, daysUntilEvent]);

    /**
     * Format event type display
     */
    const eventTypeDisplay = useMemo(() => {
        const typeConfig = {
            'Public': { icon: '🌍', class: 'public' },
            'Private': { icon: '🔒', class: 'private' },
            'Online': { icon: '💻', class: 'online' }
        };

        return typeConfig[event.type] || { icon: '📋', class: 'default' };
    }, [event.type]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle view details action
     */
    const handleViewDetails = useCallback((event_obj) => {
        event_obj.preventDefault();
        if (onViewDetails) {
            onViewDetails(event);
        }
    }, [event, onViewDetails]);

    /**
     * Handle get directions action
     */
    const handleGetDirections = useCallback((event_obj) => {
        event_obj.preventDefault();
        if (onGetDirections) {
            onGetDirections(event);
        } else {
            // Default to Google Maps directions
            const destination = `${event.latitude},${event.longitude}`;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
            window.open(url, '_blank');
        }
    }, [event, onGetDirections]);

    /**
     * Handle add to calendar action
     */
    const handleAddToCalendar = useCallback((event_obj) => {
        event_obj.preventDefault();
        if (onAddToCalendar) {
            onAddToCalendar(event);
        } else {
            // Default to Google Calendar
            const startDate = new Date(event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const endDate = event.endDate
                ? new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
                : new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

            const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.address || '')}`;
            window.open(url, '_blank');
        }
    }, [event, onAddToCalendar]);

    /**
     * Handle share action
     */
    const handleShare = useCallback((event_obj) => {
        event_obj.preventDefault();
        if (onShare) {
            onShare(event);
        } else if (navigator.share) {
            navigator.share({
                title: event.name,
                text: event.description,
                url: window.location.href
            });
        }
    }, [event, onShare]);

    /**
     * Handle register action
     */
    const handleRegister = useCallback((event_obj) => {
        event_obj.preventDefault();
        if (onRegister) {
            onRegister(event);
        }
    }, [event, onRegister]);

    // =============================================================================
    // POPUP CONTENT
    // =============================================================================

    const popupContent = useMemo(() => (
        <div className={`event-popup ${className} timing-${eventTiming}`}>
            {/* Header */}
            <div className="event-popup__header">
                {event.coverImage && (
                    <div className="event-popup__cover">
                        <img
                            src={event.coverImage}
                            alt={event.name}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />

                        {/* Status overlay */}
                        <div className={`event-popup__status-overlay status-${eventStatus.class}`}>
                            <span className="status-icon">{eventStatus.icon}</span>
                            <span className="status-text">{eventStatus.text}</span>
                        </div>
                    </div>
                )}

                <div className="event-popup__header-content">
                    <h3 className="event-popup__name">{event.name}</h3>

                    <div className="event-popup__meta">
                        <span className={`event-popup__type type-${eventTypeDisplay.class}`}>
                            <span className="type-icon">{eventTypeDisplay.icon}</span>
                            {event.type || 'Event'}
                        </span>

                        {!event.coverImage && (
                            <span className={`event-popup__status status-${eventStatus.class}`}>
                                <span className="status-icon">{eventStatus.icon}</span>
                                {eventStatus.text}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Date and Time */}
            <div className="event-popup__datetime">
                <div className="datetime-item">
                    <span className="datetime-icon">📅</span>
                    <div className="datetime-content">
                        <div className="datetime-main">{eventDates.formatted}</div>
                        {eventDates.isMultiDay && (
                            <div className="datetime-duration">
                                {eventDates.duration} day{eventDates.duration !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            {event.description && (
                <div className="event-popup__description">
                    {event.description.length > 120
                        ? `${event.description.substring(0, 120)}...`
                        : event.description
                    }
                </div>
            )}

            {/* Location */}
            {event.address && (
                <div className="event-popup__location">
                    <span className="location-icon">📍</span>
                    <span className="location-text">{event.address}</span>
                </div>
            )}

            {/* Categories */}
            {event.categories && event.categories.length > 0 && (
                <div className="event-popup__categories">
                    {event.categories.slice(0, 3).map((category, index) => (
                        <span key={index} className="event-category">
                            {category}
                        </span>
                    ))}
                    {event.categories.length > 3 && (
                        <span className="event-category event-category--more">
                            +{event.categories.length - 3} more
                        </span>
                    )}
                </div>
            )}

            {/* Actions */}
            {showActions && (
                <div className="event-popup__actions">
                    <button
                        className="action-btn action-btn--primary"
                        onClick={handleViewDetails}
                        title="View full event details"
                    >
                        View Details
                    </button>

                    {eventTiming !== 'completed' && (
                        <button
                            className="action-btn action-btn--secondary"
                            onClick={handleAddToCalendar}
                            title="Add to calendar"
                        >
                            📅 Add to Calendar
                        </button>
                    )}

                    <button
                        className="action-btn action-btn--secondary"
                        onClick={handleGetDirections}
                        title="Get directions"
                    >
                        🧭 Directions
                    </button>

                    {eventTiming === 'upcoming' && onRegister && (
                        <button
                            className="action-btn action-btn--accent"
                            onClick={handleRegister}
                            title="Register for event"
                        >
                            📝 Register
                        </button>
                    )}

                    <button
                        className="action-btn action-btn--secondary"
                        onClick={handleShare}
                        title="Share event"
                    >
                        📤 Share
                    </button>
                </div>
            )}
        </div>
    ), [
        event, className, eventTiming, eventDates, eventStatus, eventTypeDisplay, showActions,
        handleViewDetails, handleAddToCalendar, handleGetDirections, handleRegister, handleShare
    ]);

    // =============================================================================
    // RENDER
    // =============================================================================

    return (
        <Popup
            closeButton={true}
            closeOnClick={false}
            maxWidth={maxWidth}
            minWidth={minWidth}
            className="event-popup-container"
            autoPan={true}
            keepInView={true}
            onClose={onClose}
        >
            {popupContent}
        </Popup>
    );
};

// =============================================================================
// PROP TYPES
// =============================================================================

EventPopup.propTypes = {
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
    eventTiming: PropTypes.oneOf(['upcoming', 'ongoing', 'completed', 'unknown']),
    daysUntilEvent: PropTypes.number,
    isSelected: PropTypes.bool,
    onClose: PropTypes.func,
    onViewDetails: PropTypes.func,
    onGetDirections: PropTypes.func,
    onAddToCalendar: PropTypes.func,
    onShare: PropTypes.func,
    onRegister: PropTypes.func,
    showActions: PropTypes.bool,
    maxWidth: PropTypes.number,
    minWidth: PropTypes.number,
    className: PropTypes.string
};

export default EventPopup;