// src/components/layout/NotificationsMenu.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Menu,
    MenuItem,
    Typography,
    Box,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Divider,
    Button,
    IconButton,
    Badge,
    CircularProgress,
    Tooltip,
    Alert
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Event as EventIcon,
    Gavel as GavelIcon,
    AttachMoney as MoneyIcon,
    Email as EmailIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    Assignment as TaskIcon,
    Description as DocumentIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import notificationsService from '../../services/notificationService';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const NotificationsMenu = ({ anchorEl, open, onClose }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [markingAsRead, setMarkingAsRead] = useState(false);

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'AppointmentReminder':
                return <EventIcon color="primary" />;
            case 'CaseUpdate':
                return <GavelIcon color="secondary" />;
            case 'InvoiceCreated':
            case 'PaymentReceived':
                return <MoneyIcon style={{ color: 'green' }} />;
            case 'DocumentShared':
                return <DocumentIcon style={{ color: 'purple' }} />;
            case 'SystemNotification':
                return <NotificationsIcon color="info" />;
            case 'TaskAssigned':
                return <TaskIcon color="warning" />;
            case 'MessageReceived':
                return <EmailIcon style={{ color: 'orange' }} />;
            default:
                return <NotificationsIcon />;
        }
    };

    // Format notification time
    const formatNotificationTime = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMin < 1) {
            return t('notifications.justNow');
        } else if (diffMin < 60) {
            return t('notifications.minutesAgo', { count: diffMin });
        } else if (diffHours < 24) {
            return t('notifications.hoursAgo', { count: diffHours });
        } else if (diffDays < 7) {
            return t('notifications.daysAgo', { count: diffDays });
        } else {
            return date.toLocaleDateString();
        }
    };

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!user || !isOnline) return;

        setLoading(true);
        setError('');

        try {
            // Get notification summary (with recent notifications and unread count)
            const summary = await notificationsService.getNotificationSummary(user.id);
            setNotifications(summary.recentNotifications || []);
            setUnreadCount(summary.unreadCount || 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(t('notifications.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [user, isOnline, t]);

    // Fetch notifications when menu is opened
    useEffect(() => {
        if (open && user) {
            fetchNotifications();
        }
    }, [open, user, fetchNotifications]);

    // Handle marking a notification as read
    const handleMarkAsRead = async (id, event) => {
        event.stopPropagation();
        if (!isOnline) return;

        setMarkingAsRead(true);
        try {
            await notificationsService.markAsRead(id);

            // Update local state to reflect the change
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.notificationId === id
                        ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                        : notification
                )
            );

            // Decrement unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        } finally {
            setMarkingAsRead(false);
        }
    };

    // Handle marking all notifications as read
    const handleMarkAllAsRead = async () => {
        if (!isOnline || !user) return;

        setMarkingAsRead(true);
        try {
            await notificationsService.markAllAsRead(user.id);

            // Update local state to reflect the change
            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({
                    ...notification,
                    isRead: true,
                    readAt: new Date().toISOString()
                }))
            );

            // Set unread count to zero
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        } finally {
            setMarkingAsRead(false);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        // If notification has an action URL, navigate to it
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        } else {
            // Default fallback based on type
            switch (notification.type) {
                case 'AppointmentReminder':
                    if (notification.appointmentId) {
                        navigate(`/appointments/${notification.appointmentId}`);
                    } else {
                        navigate('/appointments');
                    }
                    break;
                case 'CaseUpdate':
                    if (notification.caseId) {
                        navigate(`/cases/${notification.caseId}`);
                    } else {
                        navigate('/cases');
                    }
                    break;
                case 'InvoiceCreated':
                    if (notification.invoiceId) {
                        navigate(`/billing/invoices/${notification.invoiceId}`);
                    } else {
                        navigate('/billing/invoices');
                    }
                    break;
                default:
                    navigate('/notifications');
                    break;
            }
        }

        // Close the menu
        onClose();

        // Mark as read if not already read
        if (!notification.isRead) {
            notificationsService.markAsRead(notification.notificationId)
                .catch(err => console.error('Error marking notification as read:', err));
        }
    };

    return (
        <Menu
            id="notifications-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            PaperProps={{
                elevation: 3,
                sx: {
                    width: 350,
                    maxHeight: 500,
                    overflow: 'auto',
                    mt: 1.5,
                    '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        my: 0.5
                    },
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
            <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{t('notifications.notifications')}</Typography>
                <Button
                    size="small"
                    onClick={handleMarkAllAsRead}
                    disabled={markingAsRead || unreadCount === 0 || !isOnline}
                    startIcon={markingAsRead ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                >
                    {t('notifications.markAllAsRead')}
                </Button>
            </Box>

            <Divider />

            {loading ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {t('notifications.loading')}
                    </Typography>
                </Box>
            ) : error ? (
                <Box sx={{ p: 2 }}>
                    <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 1 }}>
                        {error}
                    </Alert>
                    <Button
                        size="small"
                        fullWidth
                        onClick={fetchNotifications}
                        disabled={!isOnline}
                    >
                        {t('common.retry')}
                    </Button>
                </Box>
            ) : notifications.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('notifications.empty')}
                    </Typography>
                </Box>
            ) : (
                <List sx={{ p: 0 }}>
                    {notifications.map((notification) => (
                        <React.Fragment key={notification.notificationId}>
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    }
                                }}
                                onClick={() => handleNotificationClick(notification)}
                                secondaryAction={
                                    !notification.isRead && (
                                        <Tooltip title={t('notifications.markAsRead')}>
                                            <IconButton
                                                edge="end"
                                                aria-label="mark as read"
                                                onClick={(e) => handleMarkAsRead(notification.notificationId, e)}
                                                size="small"
                                                disabled={markingAsRead}
                                            >
                                                {markingAsRead ?
                                                    <CircularProgress size={16} /> :
                                                    <CheckIcon fontSize="small" />
                                                }
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>{getNotificationIcon(notification.type)}</Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="subtitle2"
                                            color="text.primary"
                                            fontWeight={notification.isRead ? 'normal' : 'bold'}
                                        >
                                            {notification.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <>
                                            <Typography
                                                variant="body2"
                                                color="text.primary"
                                                sx={{ display: 'inline', mb: 0.5 }}
                                            >
                                                {notification.message}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                                sx={{ mt: 0.5 }}
                                            >
                                                {formatNotificationTime(notification.createdAt)}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    ))}
                </List>
            )}

            <Box sx={{ p: 1.5, textAlign: 'center' }}>
                <Button
                    size="small"
                    onClick={() => {
                        navigate('/notifications');
                        onClose();
                    }}
                >
                    {t('notifications.viewAll')}
                </Button>
            </Box>
        </Menu>
    );
};

export default NotificationsMenu;