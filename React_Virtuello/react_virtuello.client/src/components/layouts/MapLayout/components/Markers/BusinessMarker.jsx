import React, { useState, useCallback, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import './BusinessMarker.css';

const BusinessMarker = ({
    business,
    isSelected = false,
    isHovered = false,
    showPopup = false,
    onSelect,
    onHover,
    onPopupOpen,
    onPopupClose,
    apiBaseUrl = '',
    zoomLevel = 10
}) => {
    const { t } = useTranslation();
    const [popupOpen, setPopupOpen] = useState(showPopup);

    // Create custom icon based on business type and state
    const markerIcon = useMemo(() => {
        const size = zoomLevel > 15 ? [40, 40] : zoomLevel > 12 ? [32, 32] : [24, 24];
        const iconSize = isSelected ? [size[0] * 1.2, size[1] * 1.2] : size;

        // Business category color mapping
        const getCategoryColor = (business) => {
            const defaultColors = {
                restaurant: '#FF6B6B',
                hotel: '#4ECDC4',
                shopping: '#45B7D1',
                entertainment: '#96CEB4',
                services: '#FFEAA7',
                health: '#DDA0DD',
                education: '#98D8C8',
                default: '#6C5CE7'
            };

            // Try to match business category or tags
            const category = business.tags?.[0]?.toLowerCase() || 'default';
            return defaultColors[category] || defaultColors.default;
        };

        const color = getCategoryColor(business);
        const borderColor = isSelected ? '#FFFFFF' : color;
        const borderWidth = isSelected ? 3 : 2;

        // Create SVG icon
        const svgIcon = `
            <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
                    </linearGradient>
                </defs>
                
                <!-- Main circle -->
                <circle cx="20" cy="20" r="16" 
                        fill="url(#gradient)" 
                        stroke="${borderColor}" 
                        stroke-width="${borderWidth}" 
                        filter="url(#shadow)"
                        class="business-marker-circle"/>
                
                <!-- Business icon -->
                <g transform="translate(20, 20)">
                    <path d="M-6,-8 L6,-8 L6,8 L-6,8 Z M-4,-6 L4,-6 L4,6 L-4,6 Z" 
                          fill="white" 
                          stroke="none"/>
                    <circle cx="0" cy="-2" r="2" fill="${color}"/>
                    <rect x="-3" y="1" width="6" height="1" fill="${color}"/>
                    <rect x="-3" y="3" width="4" height="1" fill="${color}"/>
                </g>
                
                ${isHovered ? `
                    <circle cx="20" cy="20" r="18" 
                            fill="none" 
                            stroke="${color}" 
                            stroke-width="2" 
                            opacity="0.6">
                        <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                    </circle>
                ` : ''}
            </svg>
        `;

        return L.divIcon({
            html: svgIcon,
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
            popupAnchor: [0, -iconSize[1] / 2],
            className: `business-marker ${isSelected ? 'business-marker--selected' : ''} ${isHovered ? 'business-marker--hovered' : ''}`
        });
    }, [business, isSelected, isHovered, zoomLevel]);

    // Handle marker events
    const handleMarkerClick = useCallback((e) => {
        e.originalEvent?.stopPropagation();
        onSelect?.(business);
        setPopupOpen(true);
        onPopupOpen?.(business);
    }, [business, onSelect, onPopupOpen]);

    const handleMarkerMouseOver = useCallback(() => {
        onHover?.(business, true);
    }, [business, onHover]);

    const handleMarkerMouseOut = useCallback(() => {
        onHover?.(business, false);
    }, [business, onHover]);

    const handlePopupClose = useCallback(() => {
        setPopupOpen(false);
        onPopupClose?.(business);
    }, [business, onPopupClose]);

    // Format business hours
    const formatBusinessHours = (hours) => {
        if (!hours) return null;
        // Assuming hours format: "Mon-Fri: 9:00-17:00"
        return hours.split(',').map(h => h.trim()).join('\n');
    };

    // Get business status (Open/Closed)
    const getBusinessStatus = () => {
        if (!business.openingHours) return null;

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday

        // Simple logic - you can enhance this based on your business hours format
        const isWeekday = currentDay >= 1 && currentDay <= 5;
        const isBusinessHours = currentHour >= 9 && currentHour < 17;

        return isWeekday && isBusinessHours ? 'open' : 'closed';
    };

    const businessStatus = getBusinessStatus();

    return (
        <Marker
            position={[parseFloat(business.latitude), parseFloat(business.longitude)]}
            icon={markerIcon}
            eventHandlers={{
                click: handleMarkerClick,
                mouseover: handleMarkerMouseOver,
                mouseout: handleMarkerMouseOut
            }}
        >
            {(popupOpen || showPopup) && (
                <Popup
                    closeOnClick={false}
                    closeButton={true}
                    onClose={handlePopupClose}
                    className="business-popup"
                    maxWidth={300}
                    minWidth={250}
                >
                    <div className="business-popup__content">
                        {/* Header */}
                        <div className="business-popup__header">
                            <div className="business-popup__title-section">
                                <h3 className="business-popup__title">{business.name}</h3>
                                {businessStatus && (
                                    <span className={`business-popup__status business-popup__status--${businessStatus}`}>
                                        {t(`business.status.${businessStatus}`)}
                                    </span>
                                )}
                            </div>

                            {business.tags && business.tags.length > 0 && (
                                <div className="business-popup__tags">
                                    {business.tags.slice(0, 2).map((tag, index) => (
                                        <span key={index} className="business-popup__tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Image */}
                        {business.imageUrl && (
                            <div className="business-popup__image">
                                <img
                                    src={`${apiBaseUrl}${business.imageUrl}`}
                                    alt={business.name}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}

                        {/* Description */}
                        {business.description && (
                            <div className="business-popup__description">
                                <p>{business.description.substring(0, 120)}{business.description.length > 120 ? '...' : ''}</p>
                            </div>
                        )}

                        {/* Details */}
                        <div className="business-popup__details">
                            {business.address && (
                                <div className="business-popup__detail">
                                    <svg className="business-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5S13.38,11.5 12,11.5z" />
                                    </svg>
                                    <span>{business.address}</span>
                                </div>
                            )}

                            {business.phone && (
                                <div className="business-popup__detail">
                                    <svg className="business-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                                    </svg>
                                    <a href={`tel:${business.phone}`}>{business.phone}</a>
                                </div>
                            )}

                            {business.openingHours && (
                                <div className="business-popup__detail">
                                    <svg className="business-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z" />
                                    </svg>
                                    <span>{formatBusinessHours(business.openingHours)}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="business-popup__actions">
                            <button
                                className="business-popup__action business-popup__action--primary"
                                onClick={() => window.open(`https://maps.google.com/?q=${business.latitude},${business.longitude}`, '_blank')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21.71,11.29L12.71,2.29C12.32,1.9 11.69,1.9 11.3,2.29L2.29,11.29C1.9,11.68 1.9,12.32 2.29,12.71L11.3,21.71C11.69,22.1 12.32,22.1 12.71,21.71L21.71,12.71C22.1,12.32 22.1,11.68 21.71,11.29M7,14L12,9L17,14H7Z" />
                                </svg>
                                {t('business.directions')}
                            </button>

                            {business.website && (
                                <button
                                    className="business-popup__action"
                                    onClick={() => window.open(business.website, '_blank')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8Z" />
                                    </svg>
                                    {t('business.website')}
                                </button>
                            )}
                        </div>
                    </div>
                </Popup>
            )}
        </Marker>
    );
};

export default BusinessMarker;