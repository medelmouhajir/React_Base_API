import React, { useState, useCallback, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import './EventMarker.css';

const EventMarker = ({
    event,
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

    // Create custom icon based on event type and state
    const markerIcon = useMemo(() => {
        const size = zoomLevel > 15 ? [40, 40] : zoomLevel > 12 ? [32, 32] : [24, 24];
        const iconSize = isSelected ? [size[0] * 1.2, size[1] * 1.2] : size;

        // Event category color mapping
        const getCategoryColor = (event) => {
            const defaultColors = {
                music: '#E17055',
                sports: '#00B894',
                food: '#FDCB6E',
                arts: '#6C5CE7',
                business: '#0984E3',
                education: '#00CEC9',
                technology: '#2D3436',
                health: '#FD79A8',
                community: '#55A3FF',
                default: '#A29BFE'
            };

            const categoryName = event.eventCategory?.name?.toLowerCase() || 'default';
            return defaultColors[categoryName] || defaultColors.default;
        };

        // Check if event is happening now or upcoming
        const getEventStatus = () => {
            const now = new Date();
            const startDate = event.startDate ? new Date(event.startDate) : null;
            const endDate = event.endDate ? new Date(event.endDate) : null;

            if (!startDate) return 'upcoming';

            if (endDate && now >= startDate && now <= endDate) return 'live';
            if (now < startDate) return 'upcoming';
            return 'past';
        };

        const color = getCategoryColor(event);
        const eventStatus = getEventStatus();
        const borderColor = isSelected ? '#FFFFFF' : eventStatus === 'live' ? '#00E676' : color;
        const borderWidth = isSelected ? 3 : eventStatus === 'live' ? 3 : 2;

        // Create SVG icon
        const svgIcon = `
            <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow-event" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
                    </filter>
                    <linearGradient id="gradient-event" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
                    </linearGradient>
                    ${eventStatus === 'live' ? `
                        <radialGradient id="live-gradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" style="stop-color:#00E676;stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:#00E676;stop-opacity:0" />
                        </radialGradient>
                    ` : ''}
                </defs>
                
                ${eventStatus === 'live' ? `
                    <circle cx="20" cy="20" r="19" fill="url(#live-gradient)">
                        <animate attributeName="r" values="15;25;15" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
                    </circle>
                ` : ''}
                
                <!-- Main shape - diamond for events -->
                <path d="M20,4 L32,20 L20,36 L8,20 Z" 
                      fill="url(#gradient-event)" 
                      stroke="${borderColor}" 
                      stroke-width="${borderWidth}" 
                      filter="url(#shadow-event)"
                      class="event-marker-diamond"/>
                
                <!-- Event icon -->
                <g transform="translate(20, 20)">
                    <!-- Calendar icon -->
                    <rect x="-8" y="-8" width="16" height="14" rx="2" 
                          fill="white" stroke="none"/>
                    <rect x="-8" y="-8" width="16" height="4" rx="2" 
                          fill="${color}"/>
                    <rect x="-6" y="-6" width="2" height="8" fill="${color}"/>
                    <rect x="-2" y="-6" width="2" height="8" fill="${color}"/>
                    <rect x="2" y="-6" width="2" height="8" fill="${color}"/>
                    
                    <!-- Date indicator -->
                    <text x="0" y="2" text-anchor="middle" 
                          font-size="6" font-weight="bold" fill="${color}">
                        ${event.startDate ? new Date(event.startDate).getDate() : '?'}
                    </text>
                </g>
                
                ${eventStatus === 'live' ? `
                    <!-- Live indicator -->
                    <circle cx="30" cy="10" r="4" fill="#00E676">
                        <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
                    </circle>
                    <text x="30" y="12" text-anchor="middle" font-size="6" font-weight="bold" fill="white">●</text>
                ` : ''}
                
                ${isHovered ? `
                    <path d="M20,2 L34,20 L20,38 L6,20 Z" 
                          fill="none" 
                          stroke="${color}" 
                          stroke-width="2" 
                          opacity="0.6">
                        <animateTransform attributeName="transform" 
                                        type="scale" 
                                        values="1;1.1;1" 
                                        dur="2s" 
                                        repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                    </path>
                ` : ''}
            </svg>
        `;

        return L.divIcon({
            html: svgIcon,
            iconSize: iconSize,
            iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
            popupAnchor: [0, -iconSize[1] / 2],
            className: `event-marker ${isSelected ? 'event-marker--selected' : ''} ${isHovered ? 'event-marker--hovered' : ''} event-marker--${eventStatus}`
        });
    }, [event, isSelected, isHovered, zoomLevel]);

    // Handle marker events
    const handleMarkerClick = useCallback((e) => {
        e.originalEvent?.stopPropagation();
        onSelect?.(event);
        setPopupOpen(true);
        onPopupOpen?.(event);
    }, [event, onSelect, onPopupOpen]);

    const handleMarkerMouseOver = useCallback(() => {
        onHover?.(event, true);
    }, [event, onHover]);

    const handleMarkerMouseOut = useCallback(() => {
        onHover?.(event, false);
    }, [event, onHover]);

    const handlePopupClose = useCallback(() => {
        setPopupOpen(false);
        onPopupClose?.(event);
    }, [event, onPopupClose]);

    // Format date and time
    const formatEventDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get event status info
    const getEventStatusInfo = () => {
        const now = new Date();
        const startDate = event.startDate ? new Date(event.startDate) : null;
        const endDate = event.endDate ? new Date(event.endDate) : null;

        if (!startDate) return { status: 'unknown', text: t('event.status.unknown') };

        if (endDate && now >= startDate && now <= endDate) {
            return { status: 'live', text: t('event.status.happening_now') };
        }

        if (now < startDate) {
            const timeUntil = startDate - now;
            const days = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (days > 0) {
                return { status: 'upcoming', text: t('event.status.in_days', { days }) };
            } else if (hours > 0) {
                return { status: 'upcoming', text: t('event.status.in_hours', { hours }) };
            } else {
                return { status: 'upcoming', text: t('event.status.starting_soon') };
            }
        }

        return { status: 'past', text: t('event.status.ended') };
    };

    const statusInfo = getEventStatusInfo();

    // Calculate capacity info
    const getCapacityInfo = () => {
        if (!event.maxCapacity) return null;

        const registered = event.registeredCount || 0;
        const percentage = (registered / event.maxCapacity) * 100;

        return {
            registered,
            total: event.maxCapacity,
            percentage: Math.round(percentage),
            available: event.maxCapacity - registered,
            isFull: percentage >= 100
        };
    };

    const capacityInfo = getCapacityInfo();

    return (
        <Marker
            position={[parseFloat(event.latitude), parseFloat(event.longitude)]}
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
                    className="event-popup"
                    maxWidth={320}
                    minWidth={280}
                >
                    <div className="event-popup__content">
                        {/* Header */}
                        <div className="event-popup__header">
                            <div className="event-popup__title-section">
                                <h3 className="event-popup__title">{event.name}</h3>
                                <div className="event-popup__meta">
                                    <span className={`event-popup__status event-popup__status--${statusInfo.status}`}>
                                        {statusInfo.text}
                                    </span>
                                    {event.eventCategory && (
                                        <span className="event-popup__category">
                                            {event.eventCategory.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Image */}
                        {event.pictureUrl && (
                            <div className="event-popup__image">
                                <img
                                    src={`${apiBaseUrl}${event.pictureUrl}`}
                                    alt={event.name}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                {statusInfo.status === 'live' && (
                                    <div className="event-popup__live-badge">
                                        <span className="event-popup__live-dot"></span>
                                        LIVE
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {event.description && (
                            <div className="event-popup__description">
                                <p>{event.description.substring(0, 150)}{event.description.length > 150 ? '...' : ''}</p>
                            </div>
                        )}

                        {/* Event Details */}
                        <div className="event-popup__details">
                            {/* Date & Time */}
                            <div className="event-popup__detail">
                                <svg className="event-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                                </svg>
                                <div className="event-popup__detail-content">
                                    <div><strong>{t('event.start')}:</strong> {formatEventDateTime(event.startDate)}</div>
                                    {event.endDate && (
                                        <div><strong>{t('event.end')}:</strong> {formatEventDateTime(event.endDate)}</div>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            {event.address && (
                                <div className="event-popup__detail">
                                    <svg className="event-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5S13.38,11.5 12,11.5z" />
                                    </svg>
                                    <span>{event.address}</span>
                                </div>
                            )}

                            {/* Capacity */}
                            {capacityInfo && (
                                <div className="event-popup__detail">
                                    <svg className="event-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16,4C18.21,4 20,5.79 20,8C20,10.21 18.21,12 16,12C13.79,12 12,10.21 12,8C12,5.79 13.79,4 16,4M16,14C20.42,14 24,15.79 24,18V20H8V18C8,15.79 11.58,14 16,14Z" />
                                    </svg>
                                    <div className="event-popup__capacity">
                                        <span className={capacityInfo.isFull ? 'capacity-full' : 'capacity-available'}>
                                            {capacityInfo.registered}/{capacityInfo.total} {t('event.attendees')}
                                        </span>
                                        {capacityInfo.isFull ? (
                                            <span className="capacity-status">{t('event.full')}</span>
                                        ) : (
                                            <span className="capacity-status">
                                                {capacityInfo.available} {t('event.spots_left')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Price */}
                            {event.price !== undefined && event.price !== null && (
                                <div className="event-popup__detail">
                                    <svg className="event-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z" />
                                    </svg>
                                    <span>
                                        {event.price === 0 ? t('event.free') : `${event.price} MAD`}
                                    </span>
                                </div>
                            )}

                            {/* Contact Info */}
                            {(event.contactEmail || event.contactPhone) && (
                                <div className="event-popup__contact">
                                    {event.contactEmail && (
                                        <div className="event-popup__detail">
                                            <svg className="event-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                                            </svg>
                                            <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
                                        </div>
                                    )}

                                    {event.contactPhone && (
                                        <div className="event-popup__detail">
                                            <svg className="event-popup__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                                            </svg>
                                            <a href={`tel:${event.contactPhone}`}>{event.contactPhone}</a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="event-popup__actions">
                            <button
                                className="event-popup__action event-popup__action--primary"
                                onClick={() => window.open(`https://maps.google.com/?q=${event.latitude},${event.longitude}`, '_blank')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21.71,11.29L12.71,2.29C12.32,1.9 11.69,1.9 11.3,2.29L2.29,11.29C1.9,11.68 1.9,12.32 2.29,12.71L11.3,21.71C11.69,22.1 12.32,22.1 12.71,21.71L21.71,12.71C22.1,12.32 22.1,11.68 21.71,11.29M7,14L12,9L17,14H7Z" />
                                </svg>
                                {t('event.directions')}
                            </button>

                            {event.registrationUrl && !capacityInfo?.isFull && statusInfo.status !== 'past' && (
                                <button
                                    className="event-popup__action event-popup__action--register"
                                    onClick={() => window.open(event.registrationUrl, '_blank')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17,12C17,14.42 15.28,16.44 13,16.9V21H11V16.9C8.72,16.44 7,14.42 7,12C7,9.58 8.72,7.56 11,7.1V2H13V7.1C15.28,7.56 17,9.58 17,12M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
                                    </svg>
                                    {t('event.register')}
                                </button>
                            )}

                            {event.website && (
                                <button
                                    className="event-popup__action"
                                    onClick={() => window.open(event.website, '_blank')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8Z" />
                                    </svg>
                                    {t('event.learn_more')}
                                </button>
                            )}
                        </div>
                    </div>
                </Popup>
            )}
        </Marker>
    );
};

export default EventMarker;