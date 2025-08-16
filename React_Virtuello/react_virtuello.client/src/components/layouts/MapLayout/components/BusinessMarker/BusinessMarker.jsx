import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { mapUtils } from '../../utils/mapUtils';
import PropTypes from 'prop-types';

const BusinessMarker = ({
    business,
    onMarkerClick = null,
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
                    <p>{business.description}</p>
                </div>
            )}

            {/* Contact Info */}
            <div className="popup-details">
                {business.address && (
                    <div className="popup-detail-item">
                        <span className="popup-detail-label">📍 Address:</span>
                        <span className="popup-detail-value">{business.address}</span>
                    </div>
                )}

                {business.phone && (
                    <div className="popup-detail-item">
                        <span className="popup-detail-label">📞 Phone:</span>
                        <span className="popup-detail-value">{business.phone}</span>
                    </div>
                )}

                {business.email && (
                    <div className="popup-detail-item">
                        <span className="popup-detail-label">📧 Email:</span>
                        <span className="popup-detail-value">{business.email}</span>
                    </div>
                )}

                {business.website && (
                    <div className="popup-detail-item">
                        <span className="popup-detail-label">🌐 Website:</span>
                        <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="popup-detail-link"
                        >
                            Visit Website
                        </a>
                    </div>
                )}

                {business.openingHours && (
                    <div className="popup-detail-item">
                        <span className="popup-detail-label">🕒 Hours:</span>
                        <span className="popup-detail-value">{business.openingHours}</span>
                    </div>
                )}
            </div>

            {/* Status */}
            {business.status !== undefined && (
                <div className="popup-status">
                    <span className={`popup-status-badge ${business.status === 1 ?
                            'popup-status-badge--active' : 'popup-status-badge--inactive'
                        }`}>
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

// REMOVED defaultProps - using default parameters instead

export default BusinessMarker;