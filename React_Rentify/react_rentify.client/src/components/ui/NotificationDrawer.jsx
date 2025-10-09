import { useEffect, useRef, useState } from 'react';
import { X, CheckCheck, Trash2, Clock, AlertTriangle, AlertCircle, Info, Search, Settings, Check, MoreVertical, Bell, RefreshCw } from 'lucide-react';
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
    const listRef = useRef(null);
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [selectedNotifications, setSelectedNotifications] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [swipedItem, setSwipedItem] = useState(null);

    // Handle scroll for header shrinking
    useEffect(() => {
        const listElement = listRef.current;
        if (!listElement) return;

        const handleScroll = () => {
            setIsScrolled(listElement.scrollTop > 20);
        };

        listElement.addEventListener('scroll', handleScroll);
        return () => listElement.removeEventListener('scroll', handleScroll);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isDrawerOpen) {
                setIsDrawerOpen(false);
                setSelectionMode(false);
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
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        return date.toLocaleDateString();
    };

    const getsStringFromSeverity = (severity) => {
        switch (severity) {
            case 1: return 'info';
            case 2: return 'warning';
            case 3: return 'critical';
            default: return '';
        }
    }

    // Group notifications by time
    const groupNotificationsByTime = (notifications) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            earlier: []
        };

        notifications.forEach(notification => {
            const notifDate = new Date(notification.createdAt);
            if (notifDate >= today) {
                groups.today.push(notification);
            } else if (notifDate >= yesterday) {
                groups.yesterday.push(notification);
            } else if (notifDate >= weekAgo) {
                groups.thisWeek.push(notification);
            } else {
                groups.earlier.push(notification);
            }
        });

        return groups;
    };

    // Filter notifications
    const filterNotifications = () => {
        let filtered = notifications;

        // Filter by tab
        if (activeTab === 'unread') {
            filtered = filtered.filter(n => !n.isRead);
        } else if (activeTab !== 'all') {
            filtered = filtered.filter(n => n.type === activeTab);
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.message.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const filteredNotifications = filterNotifications();
    const groupedNotifications = groupNotificationsByTime(filteredNotifications);

    // Get severity icon
    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'Critical':
                return <AlertCircle className="severity-icon critical" size={20} />;
            case 'Warning':
                return <AlertTriangle className="severity-icon warning" size={20} />;
            default:
                return <Info className="severity-icon info" size={20} />;
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

    // Handle swipe gestures
    const handleTouchStart = (e, notificationId) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setSwipedItem(notificationId);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (notification) => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            // Swipe left to delete
            deleteNotification(notification.id);
        } else if (isRightSwipe) {
            // Swipe right to mark as read
            if (!notification.isRead) {
                markAsRead(notification.id);
            }
        }

        setSwipedItem(null);
    };

    // Handle pull to refresh
    const handlePullToRefresh = async () => {
        if (listRef.current?.scrollTop === 0 && !refreshing) {
            setRefreshing(true);
            await loadMore();
            setTimeout(() => setRefreshing(false), 1000);
        }
    };

    // Toggle selection mode
    const toggleSelection = (id) => {
        const newSelected = new Set(selectedNotifications);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedNotifications(newSelected);
    };

    // Handle bulk actions
    const handleBulkDelete = () => {
        selectedNotifications.forEach(id => deleteNotification(id));
        setSelectedNotifications(new Set());
        setSelectionMode(false);
    };

    const handleBulkMarkAsRead = () => {
        selectedNotifications.forEach(id => markAsRead(id));
        setSelectedNotifications(new Set());
        setSelectionMode(false);
    };

    // Render notification group
    const renderNotificationGroup = (groupName, groupNotifications) => {
        if (groupNotifications.length === 0) return null;

        const groupLabels = {
            today: t('notifications.groups.today'),
            yesterday: t('notifications.groups.yesterday'),
            thisWeek: t('notifications.groups.thisWeek'),
            earlier: t('notifications.groups.earlier')
        };

        return (
            <div key={groupName} className="notification-group">
                <div className="group-header">
                    <span className="group-title">{groupLabels[groupName]}</span>
                    <span className="group-count">{groupNotifications.length}</span>
                </div>
                {groupNotifications.map((notification, index) => (
                    <div
                        key={notification.id}
                        className={`notification-card ${!notification.isRead ? 'unread' : ''} ${swipedItem === notification.id ? 'swiping' : ''
                            }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => !selectionMode && handleNotificationClick(notification)}
                        onTouchStart={(e) => handleTouchStart(e, notification.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => handleTouchEnd(notification)}
                    >
                        {/* Priority Indicator */}
                        <div className={`priority-bar priority-${ getsStringFromSeverity(notification.severity) || 'info'}`} />

                        {/* Selection Checkbox */}
                        {selectionMode && (
                            <div className="selection-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.has(notification.id)}
                                    onChange={() => toggleSelection(notification.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}

                        {/* Icon/Avatar */}
                        <div className="notification-icon">
                            {getSeverityIcon(notification.severity)}
                        </div>

                        {/* Content */}
                        <div className="notification-content-area">
                            <div className="notification-meta">
                                <span className={`notification-badge type-${getTypeColor(notification.type)}`}>
                                    {notification.type}
                                </span>
                                <div className="notification-time-display">
                                    <Clock size={12} />
                                    <span>{formatRelativeTime(notification.createdAt)}</span>
                                </div>
                            </div>

                            <h3 className="notification-title-text">{t('notifications.alerts.' + notification.title)}</h3>
                            <p className="notification-message-text">{notification.message}</p>

                            {/* Primary Action */}
                            {notification.actionUrl && (
                                <button
                                    className="notification-primary-action"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNotificationClick(notification);
                                    }}
                                >
                                    View Details
                                </button>
                            )}
                        </div>

                        {/* Quick Actions */}
                        {!selectionMode && (
                            <div className="notification-quick-actions">
                                {!notification.isRead && (
                                    <button
                                        className="quick-notifications-action-btn mark-read"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                        title="Mark as read"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                                <button
                                    className="quick-notifications-action-btn delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}

                        {/* Unread Dot */}
                        {!notification.isRead && <div className="unread-dot" />}
                    </div>
                ))}
            </div>
        );
    };

    if (!isDrawerOpen) return null;

    const tabs = [
        { id: 'all', label: t('notifications.tabs.all') },
        { id: 'unread', label: t('notifications.tabs.unread') },
        { id: 'Reservation', label: t('notifications.tabs.reservation') },
        { id: 'GPS', label: t('notifications.tabs.gps') },
        { id: 'Maintenance', label: t('notifications.tabs.maintenance') }
    ];

    return (
        <>
            {/* Backdrop with gradient */}
            <div
                className="notification-drawer-backdrop-modern"
                onClick={() => {
                    setIsDrawerOpen(false);
                    setSelectionMode(false);
                }}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`notification-drawer-modern ${isDarkMode ? 'dark' : ''}`}
                role="dialog"
                aria-label="Notifications"
            >
                {/* Frosted Header */}
                <div className={`notification-header-modern ${isScrolled ? 'scrolled' : ''}`}>
                    <div className="header-top">
                        <div className="header-title-section">
                            <Bell className="header-icon" size={24} />
                            <h2>{t('notifications.title')}</h2>
                            {unreadCount > 0 && (
                                <span className="unread-badge-modern">{unreadCount}</span>
                            )}
                        </div>

                        <div className="header-actions-modern">
                            {selectionMode ? (
                                <>
                                    <button
                                        className="action-btn-modern"
                                        onClick={handleBulkMarkAsRead}
                                        disabled={selectedNotifications.size === 0}
                                        title="Mark selected as read"
                                    >
                                        <CheckCheck size={18} />
                                    </button>
                                    <button
                                        className="action-btn-modern delete"
                                        onClick={handleBulkDelete}
                                        disabled={selectedNotifications.size === 0}
                                        title="Delete selected"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        className="action-btn-modern"
                                        onClick={() => {
                                            setSelectionMode(false);
                                            setSelectedNotifications(new Set());
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    {unreadCount > 0 && (
                                        <button
                                            className="action-btn-modern"
                                            onClick={markAllAsRead}
                                            title={t('notifications.markAllAsRead')}
                                        >
                                            <CheckCheck size={18} />
                                        </button>
                                    )}
                                    <button
                                        className="action-btn-modern"
                                        onClick={() => setSelectionMode(true)}
                                        title="Select multiple"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    <button
                                        className="action-btn-modern"
                                        title="Settings"
                                    >
                                        <Settings size={18} />
                                    </button>
                                </>
                            )}
                            <button
                                className="action-btn-modern close-btn"
                                onClick={() => {
                                    setIsDrawerOpen(false);
                                    setSelectionMode(false);
                                }}
                                aria-label={t('common.close')}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="search-notifications-container-modern">
                        <Search className="search-notifications-icon" size={18} />
                        <input
                            type="text"
                            placeholder={t('notifications.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-notifications-input-modern"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="tabs-container-modern">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-button-modern ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pull to Refresh Indicator */}
                {refreshing && (
                    <div className="refresh-indicator">
                        <RefreshCw className="spinning" size={20} />
                        <span>Refreshing...</span>
                    </div>
                )}

                {/* Notification List */}
                <div
                    className="notification-list-modern"
                    ref={listRef}
                    onScroll={handlePullToRefresh}
                >
                    {loading && notifications.length === 0 ? (
                        <div className="notification-loading-modern">
                            <div className="loading-spinner-modern" />
                            <p>{t('common.loading')}</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="notification-empty-modern">
                            <Bell size={64} className="empty-icon" />
                            <p className="empty-title">{t('notifications.emptyNotifications')}</p>
                            <span className="empty-subtitle">{t('notifications.emptyNotificationsMessage')}</span>
                        </div>
                    ) : (
                        <>
                            {renderNotificationGroup('today', groupedNotifications.today)}
                            {renderNotificationGroup('yesterday', groupedNotifications.yesterday)}
                            {renderNotificationGroup('thisWeek', groupedNotifications.thisWeek)}
                            {renderNotificationGroup('earlier', groupedNotifications.earlier)}

                            {!loading && (
                                <button className="load-more-button-modern" onClick={loadMore}>
                                    Load More
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Floating Action Button (Mobile) */}
                {unreadCount > 0 && !selectionMode && (
                    <button
                        className="fab-modern"
                        onClick={markAllAsRead}
                        title="Mark all as read"
                    >
                        <CheckCheck size={20} />
                    </button>
                )}
            </div>
        </>
    );
};

export default NotificationDrawer;