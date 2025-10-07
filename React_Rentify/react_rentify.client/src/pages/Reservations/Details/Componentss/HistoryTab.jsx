// src/pages/Reservations/Details/components/HistoryTab.jsx
import { useTranslation } from 'react-i18next';

const HistoryTab = ({ reservation }) => {
    const { t } = useTranslation();

    // Generate timeline events from reservation data
    const generateTimeline = () => {
        const events = [];

        // Created event
        if (reservation.createdBy) {
            events.push({
                id: 'created',
                type: 'created',
                icon: '📋',
                title: t('reservation.history.created', 'Reservation Created'),
                description: t('reservation.history.createdDesc', 'Reservation was created by') + ' ' + reservation.createdBy.fullName,
                timestamp: reservation.createdAt,
                color: 'primary'
            });
        }

        // Delivered event
        if (reservation.status?.toLowerCase() !== 'reserved') {
            events.push({
                id: 'delivered',
                type: 'delivered',
                icon: '🚗',
                title: t('reservation.history.delivered', 'Car Delivered'),
                description: t('reservation.history.deliveredDesc', 'Car was delivered to customer by') + ' ' + reservation.delivredBy.fullName,
                timestamp: reservation.delivredAt || reservation.startDate,
                color: 'success',
                details: reservation.odometerStart ? [
                    { label: t('car.fields.odometer', 'Odometer'), value: `${reservation.odometerStart} km` },
                    { label: t('car.fields.fuelLevel', 'Fuel Level'), value: reservation.fuelLevelStart || 'N/A' }
                ] : null
            });
        }

        // Returned event
        if (reservation.status?.toLowerCase() === 'completed') {
            events.push({
                id: 'returned',
                type: 'returned',
                icon: '✓',
                title: t('reservation.history.returned', 'Car Returned'),
                description: t('reservation.history.returnedDesc', 'Car was returned by customer to') + ' ' + reservation.returnedBy.fullName,
                timestamp: reservation.returnedAt || reservation.endDate,
                color: 'info',
                details: reservation.odometerEnd ? [
                    { label: t('car.fields.odometer', 'Odometer'), value: `${reservation.odometerEnd} km` },
                    { label: t('car.fields.fuelLevel', 'Fuel Level'), value: reservation.fuelLevelEnd || 'N/A' },
                    { label: t('reservation.history.distanceDriven', 'Distance'), value: `${reservation.odometerEnd - (reservation.odometerStart || 0)} km` }
                ] : null
            });
        }

        // Cancelled event
        if (reservation.status?.toLowerCase() === 'cancelled') {
            events.push({
                id: 'cancelled',
                type: 'cancelled',
                icon: '❌',
                title: t('reservation.history.cancelled', 'Reservation Cancelled'),
                description: reservation.cancellationReason || t('reservation.history.cancelledDesc', 'Reservation was cancelled by') + ' ' + reservation.canceledBy.fullName,
                timestamp: reservation.canceledAt || reservation.updatedAt,
                color: 'danger'
            });
        }

        console.warn(events);

        // Sort events by timestamp (newest first)
        return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const timeline = generateTimeline();

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="history-tab">
            <div className="tab-header">
                <h2 className="tab-title">{t('reservation.tabs.history', 'History')}</h2>
            </div>

            {timeline.length > 0 ? (
                <div className="timeline">
                    {timeline.map((event, index) => (
                        <div key={event.id} className={`timeline-event ${event.color}`}>
                            <div className="event-connector">
                                {index < timeline.length - 1 && <div className="connector-line"></div>}
                            </div>

                            <div className="event-icon-wrapper">
                                <span className="event-icon">{event.icon}</span>
                            </div>

                            <div className="event-content">
                                <div className="event-header">
                                    <h3 className="event-title">{event.title}</h3>
                                    <span className="event-timestamp">{formatTimestamp(event.timestamp)}</span>
                                </div>

                                <p className="event-description">{event.description}</p>

                                {event.details && (
                                    <div className="event-details">
                                        {event.details.map((detail, idx) => (
                                            <div key={idx} className="event-detail-item">
                                                <span className="detail-label">{detail.label}:</span>
                                                <span className="detail-value">{detail.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <span className="empty-icon">📜</span>
                    <p>{t('reservation.history.noEvents', 'No history events available')}</p>
                </div>
            )}

            {/* Additional Information Section */}
            <div className="history-metadata">
                <h3 className="metadata-title">{t('reservation.history.metadata', 'Additional Information')}</h3>

                <div className="metadata-grid">
                    <div className="metadata-item">
                        <span className="metadata-label">{t('common.createdAt', 'Created At')}</span>
                        <span className="metadata-value">{formatTimestamp(reservation.createdAt)}</span>
                    </div>

                    <div className="metadata-item">
                        <span className="metadata-label">{t('common.updatedAt', 'Last Updated')}</span>
                        <span className="metadata-value">{formatTimestamp(reservation.updatedAt)}</span>
                    </div>

                    {reservation.createdBy && (
                        <div className="metadata-item">
                            <span className="metadata-label">{t('common.createdBy', 'Created By')}</span>
                            <span className="metadata-value">{reservation.createdBy.fullName}</span>
                        </div>
                    )}

                    <div className="metadata-item">
                        <span className="metadata-label">{t('reservation.fields.id', 'Reservation ID')}</span>
                        <span className="metadata-value">#{reservation.id}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryTab;