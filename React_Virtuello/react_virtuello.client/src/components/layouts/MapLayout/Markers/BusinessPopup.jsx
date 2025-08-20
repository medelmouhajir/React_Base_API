/**
 * BusinessPopup Component - Business Information Popup
 * Rich popup content for business markers with full details and actions
 * 
 * @author WAN SOLUTIONS
 * @version 1.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { Popup } from 'react-leaflet';
import PropTypes from 'prop-types';

const BusinessPopup = ({
    business,
    isSelected = false,
    onClose = null,
    onViewDetails = null,
    onGetDirections = null,
    onCall = null,
    onEmail = null,
    onWebsite = null,
    showActions = true,
    maxWidth = 350,
    minWidth = 280,
    className = ''
}) => {
    // =============================================================================
    // BUSINESS DATA PROCESSING
    // =============================================================================

    /**
     * Process business opening hours
     */
    const openingHoursInfo = useMemo(() => {
        if (!business.openingHours) return null;

        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[currentDay];

        const todayHours = business.openingHours[currentDayName];

        if (!todayHours || todayHours.closed) {
            return {
                isOpen: false,
                status: 'Closed',
                nextOpen: null
            };
        }

        const openTime = parseInt(todayHours.open?.replace(':', '') || '0000');
        const closeTime = parseInt(todayHours.close?.replace(':', '') || '2359');

        const isOpen = currentTime >= openTime && currentTime <= closeTime;

        return {
            isOpen,
            status: isOpen ? 'Open' : 'Closed',
            todayHours: `${todayHours.open} - ${todayHours.close}`,
            openTime: todayHours.open,
            closeTime: todayHours.close
        };
    }, [business.openingHours]);

    /**
     * Format rating display
     */
    const ratingDisplay = useMemo(() => {
        if (!business.rating || business.rating === 0) return null;

        const fullStars = Math.floor(business.rating);
        const hasHalfStar = business.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return {
            stars: '⭐'.repeat(fullStars) + (hasHalfStar ? '⭐' : '') + '☆'.repeat(emptyStars),
            rating: business.rating.toFixed(1),
            reviewCount: business.reviewCount || 0
        };
    }, [business.rating, business.reviewCount]);

    /**
     * Format address for display
     */
    const formattedAddress = useMemo(() => {
        if (!business.address) return null;

        // Truncate very long addresses
        return business.address.length > 50
            ? `${business.address.substring(0, 50)}...`
            : business.address;
    }, [business.address]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    /**
     * Handle view details action
     */
    const handleViewDetails = useCallback((event) => {
        event.preventDefault();
        if (onViewDetails) {
            onViewDetails(business);
        }
    }, [business, onViewDetails]);

    /**
     * Handle get directions action
     */
    const handleGetDirections = useCallback((event) => {
        event.preventDefault();
        if (onGetDirections) {
            onGetDirections(business);
        } else {
            // Default to Google Maps directions
            const destination = `${business.latitude},${business.longitude}`;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
            window.open(url, '_blank');
        }
    }, [business, onGetDirections]);

    /**
     * Handle call action
     */
    const handleCall = useCallback((event) => {
        event.preventDefault();
        if (onCall) {
            onCall(business);
        } else if (business.phone) {
            window.location.href = `tel:${business.phone}`;
        }
    }, [business, onCall]);

    /**
     * Handle email action
     */
    const handleEmail = useCallback((event) => {
        event.preventDefault();
        if (onEmail) {
            onEmail(business);
        } else if (business.email) {
            window.location.href = `mailto:${business.email}`;
        }
    }, [business, onEmail]);

    /**
     * Handle website action
     */
    const handleWebsite = useCallback((event) => {
        event.preventDefault();
        if (onWebsite) {
            onWebsite(business);
        } else if (business.website) {
            window.open(business.website, '_blank', 'noopener,noreferrer');
        }
    }, [business, onWebsite]);

    // =============================================================================
    // POPUP CONTENT
    // =============================================================================

    const popupContent = useMemo(() => (
        <div className={`business-popup ${className}`}>
            {/* Header */}
            <div className="business-popup__header">
                <div className="business-popup__header-content">
                    {business.logoImage && (
                        <div className="business-popup__logo">
                            <img
                                src={business.logoImage}
                                alt={`${business.name} logo`}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    <div className="business-popup__title-section">
                        <h3 className="business-popup__name">{business.name}</h3>

                        <div className="business-popup__meta">
                            <span className={`business-popup__status status-${business.status?.toLowerCase() || 'unknown'}`}>
                                {business.status || 'Unknown'}
                            </span>

                            {openingHoursInfo && (
                                <span className={`business-popup__hours hours-${openingHoursInfo.isOpen ? 'open' : 'closed'}`}>
                                    {openingHoursInfo.status}
                                    {openingHoursInfo.todayHours && (
                                        <span className="hours-detail">
                                            {openingHoursInfo.todayHours}
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {business.coverImage && (
                    <div className="business-popup__cover">
                        <img
                            src={business.coverImage}
                            alt={business.name}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Rating */}
            {ratingDisplay && (
                <div className="business-popup__rating">
                    <span className="rating-stars">{ratingDisplay.stars}</span>
                    <span className="rating-value">{ratingDisplay.rating}</span>
                    {ratingDisplay.reviewCount > 0 && (
                        <span className="rating-count">
                            ({ratingDisplay.reviewCount} review{ratingDisplay.reviewCount !== 1 ? 's' : ''})
                        </span>
                    )}
                </div>
            )}

            {/* Description */}
            {business.description && (
                <div className="business-popup__description">
                    {business.description.length > 120
                        ? `${business.description.substring(0, 120)}...`
                        : business.description
                    }
                </div>
            )}

            {/* Contact Information */}
            <div className="business-popup__contact">
                {formattedAddress && (
                    <div className="contact-item contact-address">
                        <span className="contact-icon">📍</span>
                        <span className="contact-text">{formattedAddress}</span>
                    </div>
                )}

                {business.phone && (
                    <div className="contact-item contact-phone">
                        <span className="contact-icon">📞</span>
                        <span className="contact-text">{business.phone}</span>
                    </div>
                )}

                {business.email && (
                    <div className="contact-item contact-email">
                        <span className="contact-icon">✉️</span>
                        <span className="contact-text">{business.email}</span>
                    </div>
                )}

                {business.website && (
                    <div className="contact-item contact-website">
                        <span className="contact-icon">🌐</span>
                        <span className="contact-text">
                            {business.website.replace(/^https?:\/\//, '')}
                        </span>
                    </div>
                )}
            </div>

            {/* Tags */}
            {business.tags && business.tags.length > 0 && (
                <div className="business-popup__tags">
                    {business.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="business-tag">
                            {tag}
                        </span>
                    ))}
                    {business.tags.length > 3 && (
                        <span className="business-tag business-tag--more">
                            +{business.tags.length - 3} more
                        </span>
                    )}
                </div>
            )}

            {/* Actions */}
            {showActions && (
                <div className="business-popup__actions">
                    <button
                        className="action-btn action-btn--primary"
                        onClick={handleViewDetails}
                        title="View full details"
                    >
                        View Details
                    </button>

                    <button
                        className="action-btn action-btn--secondary"
                        onClick={handleGetDirections}
                        title="Get directions"
                    >
                        🧭 Directions
                    </button>

                    {business.phone && (
                        <button
                            className="action-btn action-btn--secondary"
                            onClick={handleCall}
                            title="Call business"
                        >
                            📞 Call
                        </button>
                    )}

                    {business.website && (
                        <button
                            className="action-btn action-btn--secondary"
                            onClick={handleWebsite}
                            title="Visit website"
                        >
                            🌐 Website
                        </button>
                    )}
                </div>
            )}
        </div>
    ), [
        business, className, ratingDisplay, formattedAddress, openingHoursInfo, showActions,
        handleViewDetails, handleGetDirections, handleCall, handleWebsite
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
            className="business-popup-container"
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

BusinessPopup.propTypes = {
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
    onClose: PropTypes.func,
    onViewDetails: PropTypes.func,
    onGetDirections: PropTypes.func,
    onCall: PropTypes.func,
    onEmail: PropTypes.func,
    onWebsite: PropTypes.func,
    showActions: PropTypes.bool,
    maxWidth: PropTypes.number,
    minWidth: PropTypes.number,
    className: PropTypes.string
};

export default BusinessPopup;