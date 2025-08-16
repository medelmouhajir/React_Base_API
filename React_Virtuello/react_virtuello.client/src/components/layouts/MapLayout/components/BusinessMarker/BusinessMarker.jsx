import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { mapUtils } from '../../utils/mapUtils';
import PropTypes from 'prop-types';

const BusinessMarker = ({
    business,
    onMarkerClick,
    isSelected = false,
    size = 'medium',
    showPopup = true,
    apiBaseUrl = ''
}) => {
    // Get primary tag for icon styling
    const primaryTag = useMemo(() => {
        if (!business.tags || business.tags.length === 0) return null;
        return business.tags[0]; // Use first tag as primary
    }, [business.tags]);

    // Get marker color based on tag
    const markerColor = useMemo(() => {
        if (primaryTag) {
            return mapUtils.getTagColor(primaryTag.name);
        }
        return '#0ea5e9'; // Default business color
    }, [primaryTag]);

    // Create custom icon
    const icon = useMemo(() => {
        return mapUtils.createBusinessIcon(primaryTag, markerColor, size);
    }, [primaryTag, markerColor, size]);

    // Handle marker click
    const handleMarkerClick = (e) => {
        if (onMarkerClick) {
            onMarkerClick(business, e);
        }
    };

    // Validate coordinates
    if (!mapUtils.isValidCoordinate(business.latitude, business.longitude)) {
        console.warn(`Invalid coordinates for business ${business.id}: ${business.latitude}, ${business.longitude}`);
        return null;
    }

    const position = [parseFloat(business.latitude), parseFloat(business.longitude)];

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
                    maxWidth={300}
                    minWidth={250}
                    closeButton={true}
                    autoClose={false}
                    closeOnEscapeKey={true}
                    className="business-popup"
                >
                    <BusinessPopupContent
                        business={business}
                        apiBaseUrl={apiBaseUrl}
                    />
                </Popup>
            )}
        </Marker>
    );
};

// Business popup content component
const BusinessPopupContent = ({ business, apiBaseUrl }) => {
    const tags = business.tags || [];

    return (
        <div className="map-popup business-popup">
            {/* Header */}
            <div className="popup-header">
                <h3 className="popup-title">{business.name}</h3>
                {tags.length > 0 && (
                    <div className="popup-tags">
                        {tags.map(tag => (
                            <span
                                key={tag.id}
                                className="popup-tag"
                                style={{
                                    backgroundColor: `${mapUtils.getTagColor(tag.name)}20`,
                                    color: mapUtils.getTagColor(tag.name)
                                }}
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Description */}
            {business.description && (
                <div className="popup-description">
                    {business.description}
                </div>
            )}

            {/* Details */}
            <div className="popup-details">
                {business.phone && (
                    <div className="popup-detail">
                        <span className="popup-detail-label">
                            <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.67 20,16.02C20.18,16.07 20.35,16.18 20.43,16.35C20.5,16.53 20.5,16.73 20.43,16.9L18.9,20.62C18.75,20.94 18.46,21.17 18.12,21.21C17.94,21.22 17.76,21.22 17.58,21.22C9.03,21.22 2.06,14.25 2.06,5.7C2.06,5.52 2.06,5.34 2.07,5.16C2.11,4.82 2.34,4.53 2.66,4.38L6.38,2.85C6.55,2.78 6.75,2.78 6.92,2.85C7.09,2.93 7.2,3.1 7.25,3.28C7.6,4.53 7.97,5.73 8.34,6.85C8.45,7.2 8.37,7.59 8.09,7.87L5.89,10.07Z" />
                            </svg>
                            Phone:
                        </span>
                        <a href={`tel:${business.phone}`} className="popup-detail-value">
                            {business.phone}
                        </a>
                    </div>
                )}

                {business.email && (
                    <div className="popup-detail">
                        <span className="popup-detail-label">
                            <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                            </svg>
                            Email:
                        </span>
                        <a href={`mailto:${business.email}`} className="popup-detail-value">
                            {business.email}
                        </a>
                    </div>
                )}

                {business.whatsApp && (
                    <div className="popup-detail">
                        <span className="popup-detail-label">
                            <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472,14.382c-0.297-0.149-1.758-0.867-2.03-0.967c-0.273-0.099-0.471-0.148-0.67,0.15c-0.197,0.297-0.767,0.966-0.94,1.164c-0.173,0.199-0.347,0.223-0.644,0.075c-0.297-0.15-1.255-0.463-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059c-0.173-0.297-0.018-0.458,0.13-0.606c0.134-0.133,0.298-0.347,0.446-0.52c0.149-0.173,0.198-0.297,0.297-0.497c0.099-0.198,0.05-0.371-0.025-0.52C10.612,9.420,9.53,7.14,9.285,6.351C9.018,5.543,8.724,5.695,8.543,5.695c-0.198,0-0.497-0.025-0.744-0.025c-0.297,0-0.693,0.099-1.014,0.371c-0.321,0.297-1.237,1.016-1.237,2.688s1.287,3.117,1.436,3.315c0.149,0.198,2.131,3.256,5.166,4.566c3.035,1.311,3.035,0.874,3.58,0.819c0.544-0.055,1.758-0.719,2.006-1.413c0.248-0.694,0.248-1.289,0.173-1.413C17.819,14.605,17.769,14.531,17.472,14.382z M12.012,2.25c-5.385,0-9.75,4.365-9.75,9.75c0,1.905,0.545,3.676,1.485,5.18L2.258,21.75l4.627-1.455C8.377,21.205,10.154,21.75,12.012,21.75c5.385,0,9.75-4.365,9.75-9.75S17.397,2.25,12.012,2.25z" />
                            </svg>
                            WhatsApp:
                        </span>
                        <a href={`https://wa.me/${business.whatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="popup-detail-value">
                            {business.whatsApp}
                        </a>
                    </div>
                )}

                {business.website && (
                    <div className="popup-detail">
                        <span className="popup-detail-label">
                            <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                            </svg>
                            Website:
                        </span>
                        <a href={business.website} target="_blank" rel="noopener noreferrer" className="popup-detail-value">
                            {business.website.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                )}

                {business.address && (
                    <div className="popup-detail">
                        <span className="popup-detail-label">
                            <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
                            </svg>
                            Address:
                        </span>
                        <span className="popup-detail-value">{business.address}</span>
                    </div>
                )}

                {/* Business Hours */}
                {business.openingHours && (
                    <div className="popup-detail">
                        <span className="popup-detail-label">
                            <svg className="popup-detail-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z" />
                            </svg>
                            Hours:
                        </span>
                        <span className="popup-detail-value">{business.openingHours}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="popup-actions">
                <button
                    onClick={() => window.open(`https://maps.google.com/?q=${business.latitude},${business.longitude}`, '_blank')}
                    className="popup-button popup-button--primary"
                >
                    <svg className="popup-button-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2M9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5A2.5,2.5 0 0,1 9.5,9Z" />
                    </svg>
                    Get Directions
                </button>

                {business.phone && (
                    <button
                        onClick={() => window.open(`tel:${business.phone}`, '_self')}
                        className="popup-button popup-button--secondary"
                    >
                        <svg className="popup-button-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.67 20,16.02C20.18,16.07 20.35,16.18 20.43,16.35C20.5,16.53 20.5,16.73 20.43,16.9L18.9,20.62C18.75,20.94 18.46,21.17 18.12,21.21C17.94,21.22 17.76,21.22 17.58,21.22C9.03,21.22 2.06,14.25 2.06,5.7C2.06,5.52 2.06,5.34 2.07,5.16C2.11,4.82 2.34,4.53 2.66,4.38L6.38,2.85C6.55,2.78 6.75,2.78 6.92,2.85C7.09,2.93 7.2,3.1 7.25,3.28C7.6,4.53 7.97,5.73 8.34,6.85C8.45,7.2 8.37,7.59 8.09,7.87L5.89,10.07Z" />
                        </svg>
                        Call
                    </button>
                )}

                {business.website && (
                    <button
                        onClick={() => window.open(business.website, '_blank')}
                        className="popup-button popup-button--secondary"
                    >
                        <svg className="popup-button-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                        Visit Website
                    </button>
                )}
            </div>

            {/* Business Status */}
            {business.status !== undefined && (
                <div className="popup-status">
                    <span className={`popup-status-badge ${business.status === 1 ? 'popup-status-badge--active' : 'popup-status-badge--inactive'}`}>
                        {business.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                </div>
            )}
        </div>
    );
};

BusinessMarker.propTypes = {
    business: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        description: PropTypes.string,
        phone: PropTypes.string,
        email: PropTypes.string,
        whatsApp: PropTypes.string,
        website: PropTypes.string,
        address: PropTypes.string,
        openingHours: PropTypes.string,
        status: PropTypes.number,
        tags: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            name: PropTypes.string.isRequired,
            iconPath: PropTypes.string
        }))
    }).isRequired,
    onMarkerClick: PropTypes.func,
    isSelected: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    showPopup: PropTypes.bool,
    apiBaseUrl: PropTypes.string
};

BusinessMarker.defaultProps = {
    onMarkerClick: null,
    isSelected: false,
    size: 'medium',
    showPopup: true,
    apiBaseUrl: ''
};

export default BusinessMarker;