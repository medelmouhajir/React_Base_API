// =============================================================================
// DETAILS PANEL COMPONENT - Detailed view for selected business/event
// =============================================================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../../contexts/AuthContext';
import { businessService } from '../../../../../services/businessService';
import { eventService } from '../../../../../services/eventService';
import './DetailsPanel.css';

const DetailsPanel = ({
    item = null,
    type = null, // 'business' | 'event'
    isVisible = false,
    position = 'right', // 'left', 'right', 'bottom'
    onClose = () => { },
    onDirections = () => { },
    onShare = () => { },
    onFavorite = () => { },
    onContact = () => { },
    onBookmark = () => { },
    showActions = true,
    showGallery = true,
    showReviews = true,
    showRelated = true,
    className = ''
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fullItem, setFullItem] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [relatedItems, setRelatedItems] = useState([]);

    const panelRef = useRef(null);
    const scrollRef = useRef(null);

    // Load full item details
    const loadItemDetails = useCallback(async (itemId, itemType) => {
        if (!itemId || !itemType) return;

        try {
            setLoading(true);
            setError(null);

            let details;
            if (itemType === 'business') {
                details = await businessService.getById(itemId);
            } else if (itemType === 'event') {
                details = await eventService.getById(itemId);
            }

            setFullItem(details);

            // Load additional data
            if (showReviews && itemType === 'business') {
                // Load reviews if needed
                // const businessReviews = await reviewService.getByBusinessId(itemId);
                // setReviews(businessReviews);
            }

            if (showRelated) {
                // Load related items
                // const related = await getRelatedItems(itemId, itemType);
                // setRelatedItems(related);
            }

        } catch (err) {
            console.error('Error loading item details:', err);
            setError(err.message || 'Failed to load details');
        } finally {
            setLoading(false);
        }
    }, [showReviews, showRelated]);

    // Load details when item changes
    useEffect(() => {
        if (item && type && isVisible) {
            loadItemDetails(item.id, type);
            setIsFavorited(item.isFavorited || false);
            setIsBookmarked(item.isBookmarked || false);
            setActiveTab('overview');
            setSelectedImageIndex(0);
            setShowFullDescription(false);
        }
    }, [item, type, isVisible, loadItemDetails]);

    // Reset scroll position when item changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [item]);

    // Handle favorite toggle
    const handleFavoriteToggle = useCallback(async () => {
        try {
            setIsFavorited(!isFavorited);
            await onFavorite(item, !isFavorited);
        } catch (err) {
            setIsFavorited(isFavorited); // Revert on error
        }
    }, [item, isFavorited, onFavorite]);

    // Handle bookmark toggle
    const handleBookmarkToggle = useCallback(async () => {
        try {
            setIsBookmarked(!isBookmarked);
            await onBookmark(item, !isBookmarked);
        } catch (err) {
            setIsBookmarked(isBookmarked); // Revert on error
        }
    }, [item, isBookmarked, onBookmark]);

    // Format opening hours
    const formatOpeningHours = useCallback((hours) => {
        if (!hours) return null;

        // Handle different formats of opening hours
        if (typeof hours === 'string') {
            return hours;
        }

        if (typeof hours === 'object') {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            return hours[today] || 'Hours not available';
        }

        return 'Hours not available';
    }, []);

    // Format event date/time
    const formatEventDateTime = useCallback((startDate, endDate) => {
        if (!startDate) return null;

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        const startFormatted = start.toLocaleDateString('en-US', options);

        if (end) {
            const endFormatted = end.toLocaleDateString('en-US', options);
            return `${startFormatted} - ${endFormatted}`;
        }

        return startFormatted;
    }, []);

    // Get display item (fallback to original item if full details not loaded)
    const displayItem = fullItem || item;

    // Gallery images
    const galleryImages = useMemo(() => {
        if (!displayItem) return [];

        const images = [];
        if (displayItem.pictureUrl) images.push(displayItem.pictureUrl);
        if (displayItem.logoUrl && type === 'business') images.push(displayItem.logoUrl);
        if (displayItem.gallery && Array.isArray(displayItem.gallery)) {
            images.push(...displayItem.gallery);
        }

        return images.filter(Boolean);
    }, [displayItem, type]);

    if (!isVisible || !item) {
        return null;
    }

    return (
        <div
            ref={panelRef}
            className={`details-panel details-panel--${position} ${className}`}
        >
            {/* Panel Header */}
            <div className="details-panel__header">
                <button
                    className="details-panel__close"
                    onClick={onClose}
                    aria-label={t('common.close')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </button>

                {showActions && (
                    <div className="details-panel__header-actions">
                        <button
                            className={`action-btn ${isFavorited ? 'action-btn--active' : ''}`}
                            onClick={handleFavoriteToggle}
                            aria-label={isFavorited ? t('common.unfavorite') : t('common.favorite')}
                            title={isFavorited ? t('common.unfavorite') : t('common.favorite')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
                            </svg>
                        </button>

                        <button
                            className={`action-btn ${isBookmarked ? 'action-btn--active' : ''}`}
                            onClick={handleBookmarkToggle}
                            aria-label={isBookmarked ? t('common.unbookmark') : t('common.bookmark')}
                            title={isBookmarked ? t('common.unbookmark') : t('common.bookmark')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z" />
                            </svg>
                        </button>

                        <button
                            className="action-btn"
                            onClick={() => onShare(item)}
                            aria-label={t('common.share')}
                            title={t('common.share')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Panel Content */}
            <div className="details-panel__content" ref={scrollRef}>
                {loading && (
                    <div className="details-panel__loading">
                        <div className="loading-spinner"></div>
                        <p>{t('common.loading', 'Loading details...')}</p>
                    </div>
                )}

                {error && (
                    <div className="details-panel__error">
                        <p>{error}</p>
                        <button onClick={() => loadItemDetails(item.id, type)}>
                            {t('common.retry', 'Retry')}
                        </button>
                    </div>
                )}

                {!loading && !error && displayItem && (
                    <>
                        {/* Main Content */}
                        <div className="details-panel__main">
                            {/* Gallery */}
                            {showGallery && galleryImages.length > 0 && (
                                <div className="details-panel__gallery">
                                    <div className="gallery-main">
                                        <img
                                            src={galleryImages[selectedImageIndex]}
                                            alt={displayItem.name}
                                            className="gallery-image"
                                        />
                                        {galleryImages.length > 1 && (
                                            <>
                                                <button
                                                    className="gallery-nav gallery-nav--prev"
                                                    onClick={() => setSelectedImageIndex(
                                                        selectedImageIndex === 0 ? galleryImages.length - 1 : selectedImageIndex - 1
                                                    )}
                                                    aria-label={t('gallery.previous', 'Previous image')}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="gallery-nav gallery-nav--next"
                                                    onClick={() => setSelectedImageIndex(
                                                        selectedImageIndex === galleryImages.length - 1 ? 0 : selectedImageIndex + 1
                                                    )}
                                                    aria-label={t('gallery.next', 'Next image')}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {galleryImages.length > 1 && (
                                        <div className="gallery-thumbnails">
                                            {galleryImages.map((image, index) => (
                                                <button
                                                    key={index}
                                                    className={`gallery-thumbnail ${index === selectedImageIndex ? 'gallery-thumbnail--active' : ''}`}
                                                    onClick={() => setSelectedImageIndex(index)}
                                                >
                                                    <img src={image} alt={`${displayItem.name} ${index + 1}`} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="details-panel__info">
                                <div className="info-header">
                                    <h1 className="info-title">{displayItem.name}</h1>

                                    {type === 'business' && displayItem.rating && (
                                        <div className="info-rating">
                                            <span className="rating-stars">★</span>
                                            <span className="rating-value">{displayItem.rating.toFixed(1)}</span>
                                            {displayItem.reviewCount && (
                                                <span className="rating-count">({displayItem.reviewCount})</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="info-meta">
                                    {type === 'business' && displayItem.category && (
                                        <span className="meta-category business-category">{displayItem.category}</span>
                                    )}

                                    {type === 'event' && displayItem.eventCategory && (
                                        <span className="meta-category event-category">{displayItem.eventCategory.name}</span>
                                    )}

                                    {displayItem.distance && (
                                        <span className="meta-distance">
                                            {displayItem.distance < 1
                                                ? `${Math.round(displayItem.distance * 1000)}m away`
                                                : `${displayItem.distance.toFixed(1)}km away`
                                            }
                                        </span>
                                    )}
                                </div>

                                {displayItem.description && (
                                    <div className="info-description">
                                        <p className={showFullDescription ? '' : 'description-truncated'}>
                                            {displayItem.description}
                                        </p>
                                        {displayItem.description.length > 200 && (
                                            <button
                                                className="description-toggle"
                                                onClick={() => setShowFullDescription(!showFullDescription)}
                                            >
                                                {showFullDescription ? t('common.showLess') : t('common.showMore')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="details-panel__quick-actions">
                                <button
                                    className="quick-action"
                                    onClick={() => onDirections(displayItem)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M21.71,11.29L12.71,2.29A1,1 0 0,0 11.29,2.29L2.29,11.29A1,1 0 0,0 2.29,12.71L11.29,21.71A1,1 0 0,0 12.71,21.71L21.71,12.71A1,1 0 0,0 21.71,11.29M14,14.5V12H8V10H14V7.5L18.5,11L14,14.5Z" />
                                    </svg>
                                    {t('actions.directions', 'Directions')}
                                </button>

                                {type === 'business' && displayItem.phone && (
                                    <button
                                        className="quick-action"
                                        onClick={() => window.open(`tel:${displayItem.phone}`)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5C21.25,15.5 22,14.75 22,13.5V20C22,21.25 21.25,22 20,22C10.61,22 3,14.39 3,5C3,3.75 3.75,3 5,3H11.5C12.75,3 13.5,3.75 13.5,5C13.5,6.25 13.3,7.45 12.93,8.57C12.82,8.92 12.9,9.31 13.18,9.59L15.38,11.79C15.94,10.38 17.62,6.62 10.79,6.62Z" />
                                        </svg>
                                        {t('actions.call', 'Call')}
                                    </button>
                                )}

                                {type === 'business' && displayItem.website && (
                                    <button
                                        className="quick-action"
                                        onClick={() => window.open(displayItem.website, '_blank')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                        </svg>
                                        {t('actions.website', 'Website')}
                                    </button>
                                )}

                                {type === 'event' && displayItem.registrationUrl && (
                                    <button
                                        className="quick-action quick-action--primary"
                                        onClick={() => window.open(displayItem.registrationUrl, '_blank')}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                                        </svg>
                                        {t('actions.register', 'Register')}
                                    </button>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className="details-panel__tabs">
                                <button
                                    className={`tab ${activeTab === 'overview' ? 'tab--active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    {t('tabs.overview', 'Overview')}
                                </button>

                                {type === 'business' && showReviews && (
                                    <button
                                        className={`tab ${activeTab === 'reviews' ? 'tab--active' : ''}`}
                                        onClick={() => setActiveTab('reviews')}
                                    >
                                        {t('tabs.reviews', 'Reviews')}
                                    </button>
                                )}

                                <button
                                    className={`tab ${activeTab === 'details' ? 'tab--active' : ''}`}
                                    onClick={() => setActiveTab('details')}
                                >
                                    {t('tabs.details', 'Details')}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="details-panel__tab-content">
                                {activeTab === 'overview' && (
                                    <div className="tab-content overview-content">
                                        {/* Address */}
                                        {displayItem.address && (
                                            <div className="detail-item">
                                                <div className="detail-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                    </svg>
                                                </div>
                                                <div className="detail-content">
                                                    <h4>{t('details.address', 'Address')}</h4>
                                                    <p>{displayItem.address}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Business Hours */}
                                        {type === 'business' && displayItem.openingHours && (
                                            <div className="detail-item">
                                                <div className="detail-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                                                    </svg>
                                                </div>
                                                <div className="detail-content">
                                                    <h4>{t('details.hours', 'Hours')}</h4>
                                                    <p>{formatOpeningHours(displayItem.openingHours)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Event Date/Time */}
                                        {type === 'event' && displayItem.startDate && (
                                            <div className="detail-item">
                                                <div className="detail-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1" />
                                                    </svg>
                                                </div>
                                                <div className="detail-content">
                                                    <h4>{t('details.dateTime', 'Date & Time')}</h4>
                                                    <p>{formatEventDateTime(displayItem.startDate, displayItem.endDate)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Event Price */}
                                        {type === 'event' && displayItem.price !== undefined && (
                                            <div className="detail-item">
                                                <div className="detail-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z" />
                                                    </svg>
                                                </div>
                                                <div className="detail-content">
                                                    <h4>{t('details.price', 'Price')}</h4>
                                                    <p>{displayItem.price > 0 ? `${displayItem.price}` : t('common.free', 'Free')}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Event Capacity */}
                                        {type === 'event' && displayItem.maxCapacity && (
                                            <div className="detail-item">
                                                <div className="detail-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M16,4C18.2,4 20,5.8 20,8C20,10.2 18.2,12 16,12C13.8,12 12,10.2 12,8C12,5.8 13.8,4 16,4M16,13C18.67,13 24,14.33 24,17V20H8V17C8,14.33 13.33,13 16,13M8,4C10.2,4 12,5.8 12,8C12,10.2 10.2,12 8,12C5.8,12 4,10.2 4,8C4,5.8 5.8,4 8,4M8,13C10.67,13 16,14.33 16,17V20H0V17C0,14.33 5.33,13 8,13Z" />
                                                    </svg>
                                                </div>
                                                <div className="detail-content">
                                                    <h4>{t('details.capacity', 'Capacity')}</h4>
                                                    <p>{displayItem.maxCapacity} {t('common.people', 'people')}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Contact Info */}
                                        {(displayItem.phone || displayItem.email || displayItem.contactEmail) && (
                                            <div className="detail-item">
                                                <div className="detail-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5C21.25,15.5 22,14.75 22,13.5V20C22,21.25 21.25,22 20,22C10.61,22 3,14.39 3,5C3,3.75 3.75,3 5,3H11.5C12.75,3 13.5,3.75 13.5,5C13.5,6.25 13.3,7.45 12.93,8.57C12.82,8.92 12.9,9.31 13.18,9.59L15.38,11.79C15.94,10.38 17.62,6.62 10.79,6.62Z" />
                                                    </svg>
                                                </div>
                                                <div className="detail-content">
                                                    <h4>{t('details.contact', 'Contact')}</h4>
                                                    {displayItem.phone && (
                                                        <p>
                                                            <a href={`tel:${displayItem.phone}`}>{displayItem.phone}</a>
                                                        </p>
                                                    )}
                                                    {(displayItem.email || displayItem.contactEmail) && (
                                                        <p>
                                                            <a href={`mailto:${displayItem.email || displayItem.contactEmail}`}>
                                                                {displayItem.email || displayItem.contactEmail}
                                                            </a>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tags */}
                                        {displayItem.tags && displayItem.tags.length > 0 && (
                                            <div className="detail-item">
                                                <div className="detail-icon">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.63,5.84C17.27,5.33 16.67,5 16,5L5,5.01C3.9,5.01 3,5.9 3,7V17C3,18.1 3.9,18.99 5,18.99L16,19C16.67,19 17.27,18.67 17.63,18.16L22,12L17.63,5.84Z" />
                                                    </svg>
                                                </div>
                                                <div className="detail-content">
                                                    <h4>{t('details.tags', 'Tags')}</h4>
                                                    <div className="tags-list">
                                                        {displayItem.tags.map(tag => (
                                                            <span key={tag.id} className="tag">
                                                                {tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && type === 'business' && (
                                    <div className="tab-content reviews-content">
                                        {reviews.length > 0 ? (
                                            <div className="reviews-list">
                                                {reviews.map(review => (
                                                    <div key={review.id} className="review-item">
                                                        <div className="review-header">
                                                            <div className="review-author">
                                                                <div className="author-avatar">
                                                                    {review.author.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="author-info">
                                                                    <h5>{review.author}</h5>
                                                                    <div className="review-rating">
                                                                        <span className="rating-stars">★</span>
                                                                        <span>{review.rating}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="review-date">
                                                                {new Date(review.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <div className="review-content">
                                                            <p>{review.comment}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-reviews">
                                                <p>{t('reviews.noReviews', 'No reviews yet')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'details' && (
                                    <div className="tab-content details-content">
                                        <div className="details-grid">
                                            {/* Additional business details */}
                                            {type === 'business' && (
                                                <>
                                                    {displayItem.yearEstablished && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">{t('details.established', 'Established')}</span>
                                                            <span className="detail-value">{displayItem.yearEstablished}</span>
                                                        </div>
                                                    )}
                                                    {displayItem.employeeCount && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">{t('details.employees', 'Employees')}</span>
                                                            <span className="detail-value">{displayItem.employeeCount}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Additional event details */}
                                            {type === 'event' && (
                                                <>
                                                    {displayItem.organizer && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">{t('details.organizer', 'Organizer')}</span>
                                                            <span className="detail-value">{displayItem.organizer}</span>
                                                        </div>
                                                    )}
                                                    {displayItem.eventType && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">{t('details.type', 'Type')}</span>
                                                            <span className="detail-value">{displayItem.eventType}</span>
                                                        </div>
                                                    )}
                                                    {displayItem.language && (
                                                        <div className="detail-row">
                                                            <span className="detail-label">{t('details.language', 'Language')}</span>
                                                            <span className="detail-value">{displayItem.language}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Common details */}
                                            <div className="detail-row">
                                                <span className="detail-label">{t('details.lastUpdated', 'Last Updated')}</span>
                                                <span className="detail-value">
                                                    {displayItem.updatedAt
                                                        ? new Date(displayItem.updatedAt).toLocaleDateString()
                                                        : t('common.unknown', 'Unknown')
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Related Items */}
                        {showRelated && relatedItems.length > 0 && (
                            <div className="details-panel__related">
                                <h3>{t('details.related', 'You might also like')}</h3>
                                <div className="related-items">
                                    {relatedItems.map(relatedItem => (
                                        <div key={relatedItem.id} className="related-item">
                                            <div className="related-item-image">
                                                {relatedItem.pictureUrl ? (
                                                    <img src={relatedItem.pictureUrl} alt={relatedItem.name} />
                                                ) : (
                                                    <div className="related-item-placeholder">
                                                        {relatedItem.type === 'business' ? '🏢' : '📅'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="related-item-info">
                                                <h4>{relatedItem.name}</h4>
                                                <p>{relatedItem.category || relatedItem.eventCategory?.name}</p>
                                                {relatedItem.distance && (
                                                    <span className="related-item-distance">
                                                        {relatedItem.distance < 1
                                                            ? `${Math.round(relatedItem.distance * 1000)}m`
                                                            : `${relatedItem.distance.toFixed(1)}km`
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DetailsPanel;