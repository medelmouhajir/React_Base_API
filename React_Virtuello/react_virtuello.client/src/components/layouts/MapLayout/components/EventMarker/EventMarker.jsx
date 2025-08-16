import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { mapUtils } from '../../utils/mapUtils';
import PropTypes from 'prop-types';

const EventMarker = ({
    event,
    onMarkerClick = null,
    isSelected = false,
    size = 'medium',
    showPopup = true,
    apiBaseUrl = ''
}) => {
    // Get primary category for icon styling
    const primaryCategory = useMemo(() => {
        if (!event.eventCategory) return null;
        return event.eventCategory;
    }, [event.eventCategory]);

    // Get marker color based on category
    const markerColor = useMemo(() => {
        if (primaryCategory) {
            return mapUtils.getCategoryColor(primaryCategory.name);
        }
        return '#f59e0b'; // Default event color (amber)
    }, [primaryCategory]);

    // Create custom icon
    const icon = useMemo(() => {
        return mapUtils.createEventIcon(primaryCategory, markerColor, size);
    }, [primaryCategory, markerColor, size]);

    // Handle marker click
    const handleMarkerClick = (e) => {
        if (onMarkerClick) {
            onMarkerClick(event, e);
        }
    };

    // Validate coordinates
    if (!mapUtils.isValidCoordinate(event.latitude, event.longitude)) {
        console.warn(`Invalid coordinates for event ${event.id}: ${event.latitude}, ${event.longitude}`);
        return null;
    }

    // Format dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    const position = [parseFloat(event.latitude), parseFloat(event.longitude)];

    return (
        <Marker
            position={position}
            icon={icon}
            eventHandlers={{
                click: handleMarkerClick
            }}
            opacity={isSelected ? 1 : 0.8}
            zIndexOffset={isSelected ? 1000 : 0}
        >
            {showPopup && (
                <Popup
                    maxWidth={320}
                    minWidth={280}
                    closeButton={true}
                    autoClose={false}
                    closeOnEscapeKey={true}
                    className="event-marker-popup"
                >
                    <EventPopupContent
                        event={event}
                        formatDate={formatDate}
                        primaryCategory={primaryCategory}
                        apiBaseUrl={apiBaseUrl}
                    />
                </Popup>
            )}
        </Marker>
    );
};

// Event popup content component
const EventPopupContent = ({ event, formatDate, primaryCategory, apiBaseUrl }) => {
    return (
        <div className="event-popup">
            {/* Header */}
            <div className="popup-header">
                <h3 className="popup-title">{event.name}</h3>

                {/* Category badge */}
                {primaryCategory && (
                    <div className="popup-category">
                        <span className="popup-category-tag">
                            {primaryCategory.name}
                        </span>
                    </div>
                )}
            </div>

            {/* Description */}
            {event.description && (
                <div className="popup-description">
                    <p>{event.description}</p>
                </div>
            )}

            {/* Event Details */}
            <div className="popup-details">
                {/* Event dates */}
                {(event.startDate || event.endDate) && (
                    <div className="popup-detail-section">
                        <h4 className="popup-detail-title">📅 Event Schedule</h4>
                        {event.startDate && (
                            <div className="popup-detail-item">
                                <span className="popup-detail-label">Start:</span>
                                <span className="popup-detail-value">{formatDate(event.startDate)}</span>
                            </div>
                        )}
                        {event.endDate && (
                            <div className="popup-detail-item">
                                <span className="popup-detail-label">End:</span>
                                <span className="popup-detail-value">{formatDate(event.endDate)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Location */}
                {event.address && (
                    <div className="popup-detail-item">
                        <span className="popup-detail-label">📍 Location:</span>
                        <span className="popup-detail-value">{event.address}</span>
                    </div>
                )}

                {/* Capacity and Price */}
                {(event.maxCapacity || event.price !== undefined) && (
                    <div className="popup-detail-section">
                        {event.maxCapacity && (
                            <div className="popup-detail-item">
                                <span className="popup-detail-label">👥 Capacity:</span>
                                <span className="popup-detail-value">{event.maxCapacity} people</span>
                            </div>
                        )}
                        {event.price !== undefined && (
                            <div className="popup-detail-item">
                                <span className="popup-detail-label">💰 Price:</span>
                                <span className="popup-detail-value">
                                    {event.price === 0 ? 'Free' : `$${event.price}`}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Contact Information */}
                {(event.contactEmail || event.contactPhone) && (
                    <div className="popup-detail-section">
                        <h4 className="popup-detail-title">📞 Contact</h4>
                        {event.contactEmail && (
                            <div className="popup-detail-item">
                                <span className="popup-detail-label">Email:</span>
                                <a
                                    href={`mailto:${event.contactEmail}`}
                                    className="popup-detail-link"
                                >
                                    {event.contactEmail}
                                </a>
                            </div>
                        )}
                        {event.contactPhone && (
                            <div className="popup-detail-item">
                                <span className="popup-detail-label">Phone:</span>
                                <a
                                    href={`tel:${event.contactPhone}`}
                                    className="popup-detail-link"
                                >
                                    {event.contactPhone}
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Links */}
                {(event.website || event.registrationUrl) && (
                    <div className="popup-detail-section">
                        {event.website && (
                            <div className="popup-detail-item">
                                <a
                                    href={event.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="popup-detail-link popup-detail-link--primary"
                                >
                                    🌐 Visit Website
                                </a>
                            </div>
                        )}
                        {event.registrationUrl && (
                            <div className="popup-detail-item">
                                <a
                                    href={event.registrationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="popup-detail-link popup-detail-link--cta"
                                >
                                    🎟️ Register Now
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Status */}
            {event.status !== undefined && (
                <div className="popup-status">
                    <span className={`popup-status-badge ${event.status === 1 ?
                            'popup-status-badge--active' : 'popup-status-badge--inactive'
                        }`}>
                        {event.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                </div>
            )}
        </div>
    );
};

EventMarker.propTypes = {
    event: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        description: PropTypes.string,
        startDate: PropTypes.string,
        endDate: PropTypes.string,
        address: PropTypes.string,
        maxCapacity: PropTypes.number,
        price: PropTypes.number,
        contactEmail: PropTypes.string,
        contactPhone: PropTypes.string,
        registrationUrl: PropTypes.string,
        website: PropTypes.string,
        status: PropTypes.number,
        eventCategory: PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            name: PropTypes.string.isRequired,
            iconPath: PropTypes.string
        })
    }).isRequired,
    onMarkerClick: PropTypes.func,
    isSelected: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    showPopup: PropTypes.bool,
    apiBaseUrl: PropTypes.string
};

// REMOVED defaultProps - using default parameters instead

export default EventMarker;