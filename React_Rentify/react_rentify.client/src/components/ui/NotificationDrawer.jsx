import { useEffect, useRef } from 'react';
import { X, CheckCheck, Trash2, Clock, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import './NotificationDrawer.css';

const NotificationDrawer = () => {
    const {
        notifications,
        isDrawerOpen,
        setIsDrawerOpen,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loadMore,
        handleNotificationClick,
        loading
    } = useNotifications();

    const { isDarkMode } = useTheme();
    const drawerRef = useRef(null);

    const { t } = useTranslation();

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isDrawerOpen) {
                setIsDrawerOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isDrawerOpen, setIsDrawerOpen]);

    // Format relative time
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return t('notifications.times.justNow');
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ` + t('notifications.times.minAgo');
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}` + t('notifications.times.hoursAgo')
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}` + t('notifications.times.dayAgo');

        return date.toLocaleDateString();
    };

    console.warn(notifications);

    // Get severity icon
    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'Critical':
                return <AlertCircle className="severity-icon critical" size={18} />;
            case 'Warning':
                return <AlertTriangle className="severity-icon warning" size={18} />;
            default:
                return <Info className="severity-icon info" size={18} />;
        }
    };

    // Get type color
    const getTypeColor = (type) => {
        const colors = {
            'Reservation': 'blue',
            'GPS': 'purple',
            'Maintenance': 'orange',
            'System': 'gray',
            'Security': 'red'
        };
        return colors[type] || 'gray';
    };

    if (!isDrawerOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="notification-drawer-backdrop"
                onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`notification-drawer ${isDarkMode ? 'dark' : ''}`}
                role="dialog"
                aria-label="Notifications"
            >
                {/* Header */}
                <div className="notification-drawer-header">
                    <div className="header-title">
                        <h2>{t('notifications.title')}</h2>
                        {unreadCount > 0 && (
                            <span className="unread-badge">{unreadCount}</span>
                        )}
                    </div>

                    <div className="header-actions">
                        {unreadCount > 0 && (
                            <button
                                className="action-button"
                                onClick={markAllAsRead}
                                title={t('notifications.markAllAsRead')}
                            >
                                <CheckCheck size={18} />
                            </button>
                        )}
                        <button
                            className="action-button close-button"
                            onClick={() => setIsDrawerOpen(false)}
                            aria-label={t('common.close')}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Notification List */}
                <div className="notification-list">
                    {loading && notifications.length === 0 ? (
                        <div className="notification-loading">
                            <div className="loading-spinner" />
                            <p>{t('common.loading')}</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="notification-empty">
                            <Info size={48} />
                            <p>{t('notifications.emptyNotifications')}</p>
                            <span>{t('notifications.emptyNotificationsMessage')}</span>
                        </div>
                    ) : (
                        <>
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''} severity-${notification.severity}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-content">
                                        <div className="notification-header-row">
                                            {getSeverityIcon(notification.severity)}
                                            <span className={`notification-type type-${getTypeColor(notification.type)}`}>
                                                {notification.type}
                                            </span>
                                            <span className="notification-time">
                                                <Clock size={12} />
                                                {formatRelativeTime(notification.createdAt)}
                                            </span>
                                        </div>

                                        <h3 className="notification-title">{t('notifications.alerts.' + notification.title)}</h3>
                                        <p className="notification-message">{notification.message}</p>

                                        {!notification.isRead && (
                                            <div className="unread-indicator" />
                                        )}
                                    </div>

                                    <div className="notification-actions">
                                        {!notification.isRead && (
                                            <button
                                                className="notification-action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                title={t('notifications.markAsRead')}
                                            >
                                                <CheckCheck size={16} />
                                            </button>
                                        )}
                                        <button
                                            className="notification-action-btn delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            title={t('common.delete')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Load More Button */}
                            {notifications.length >= 20 && (
                                <button
                                    className="load-more-button"
                                    onClick={loadMore}
                                >
                                    {t('notifications.loadMore')}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDrawer;