import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { mapUtils } from '../../utils/mapUtils';
import PropTypes from 'prop-types';

const EventMarker = ({
    event,
    onMarkerClick,
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
                    closeButton={true}
                    closeOnClick={false}
                    autoClose={false}
                    autoPan={true}
                    className="event-marker-popup"
                >
                    <EventPopupContent
                        event={event}
                        formatDate={formatDate}
                        apiBaseUrl={apiBaseUrl}
                    />
                </Popup>
            )}
        </Marker>
    );
};

// Separate component for popup content
const EventPopupContent = ({ event, formatDate, apiBaseUrl }) => {
    const startDate = formatDate(event.startDate);
    const endDate = formatDate(event.endDate);

    return (
        <div className="event-popup">
            <div className="popup-header">
                <h3 className="popup-title">{event.name}</h3>
                {event.eventCategory && (
                    <div className="popup-category">
                        <span className="popup-category-tag">
                            {event.eventCategory.name}
                        </span>
                    </div>
                )}
            </div>

            {event.description && (
                <div className="popup-description">
                    {event.description}
                </div>
            )}

            <div className="popup-details">
                <div className="popup-detail">
                    <strong>Start:</strong> {startDate}
                </div>
                {endDate && endDate !== startDate && (
                    <div className="popup-detail">
                        <strong>End:</strong> {endDate}
                    </div>
                )}
                {event.address && (
                    <div className="popup-detail">
                        <strong>Location:</strong> {event.address}
                    </div>
                )}
                {event.maxCapacity && (
                    <div className="popup-detail">
                        <strong>Capacity:</strong> {event.maxCapacity} people
                    </div>
                )}
                {event.price && event.price > 0 && (
                    <div className="popup-detail">
                        <strong>Price:</strong> ${event.price}
                    </div>
                )}
            </div>

            {(event.contactEmail || event.contactPhone || event.registrationUrl) && (
                <div className="popup-contact">
                    {event.contactEmail && (
                        <div className="popup-contact-item">
                            <strong>Email:</strong>
                            <a href={`mailto:${event.contactEmail}`}>
                                {event.contactEmail}
                            </a>
                        </div>
                    )}
                    {event.contactPhone && (
                        <div className="popup-contact-item">
                            <strong>Phone:</strong>
                            <a href={`tel:${event.contactPhone}`}>
                                {event.contactPhone}
                            </a>
                        </div>
                    )}
                    {event.registrationUrl && (
                        <div className="popup-contact-item">
                            <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                                Register for Event
                            </a>
                        </div>
                    )}
                </div>
            )}

            <div className="popup-actions">
                <button
                    onClick={() => window.open(
                        `https://maps.google.com/?q=${event.latitude},${event.longitude}`,
                        '_blank'
                    )}
                    className="popup-button"
                >
                    Get Directions
                </button>
                {event.website && (
                    <button
                        onClick={() => window.open(event.website, '_blank')}
                        className="popup-button popup-button--secondary"
                    >
                        Visit Website
                    </button>
                )}
            </div>

            {event.status !== undefined && (
                <div className="popup-status">
                    <span className={`popup-status-badge ${event.status === 1 ? 'popup-status-badge--active' : 'popup-status-badge--inactive'
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

EventMarker.defaultProps = {
    onMarkerClick: null,
    isSelected: false,
    size: 'medium',
    showPopup: true,
    apiBaseUrl: ''
};

export default EventMarker;