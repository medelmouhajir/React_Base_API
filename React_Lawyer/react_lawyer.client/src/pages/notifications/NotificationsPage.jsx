// src/pages/notifications/NotificationsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    ListItemSecondaryAction,
    Divider,
    Chip,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Event as EventIcon,
    Gavel as GavelIcon,
    AttachMoney as MoneyIcon,
    Email as EmailIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Check as CheckIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    DeleteSweep as DeleteSweepIcon,
    Assignment as TaskIcon,
    Description as DocumentIcon,
    ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import notificationsService from '../../services/notificationService';
import { useAuth } from '../../features/auth/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const NotificationsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isOnline = useOnlineStatus();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Unread
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState(null);

    // Fetch notifications based on active tab
    const fetchNotifications = useCallback(async () => {
        if (!user || !isOnline) {
            setLoading(false);
            if (!isOnline) setError(t('common.offlineMode'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            let data;
            if (activeTab === 0) {
                // Fetch all notifications
                data = await notificationsService.getUserNotifications(user.id);
            } else {
                // Fetch only unread notifications
                data = await notificationsService.getUserUnreadNotifications(user.id);
            }

            setNotifications(data || []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(t('notifications.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [user, isOnline, activeTab, t]);

    // Fetch notifications on mount and when tab changes
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'AppointmentReminder':
                return <EventIcon sx={{ color: theme.palette.primary.main }} />;
            case 'CaseUpdate':
                return <GavelIcon sx={{ color: theme.palette.secondary.main }} />;
            case 'InvoiceCreated':
            case 'PaymentReceived':
                return <MoneyIcon sx={{ color: 'green' }} />;
            case 'DocumentShared':
                return <DocumentIcon sx={{ color: 'purple' }} />;
            case 'SystemNotification':
                return <NotificationsIcon sx={{ color: theme.palette.info.main }} />;
            case 'TaskAssigned':
                return <TaskIcon sx={{ color: theme.palette.warning.main }} />;
            case 'MessageReceived':
                return <EmailIcon sx={{ color: 'orange' }} />;
            default:
                return <NotificationsIcon />;
        }
    };

    // Format notification time
    const formatNotificationTime = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        return new Intl.DateTimeFormat(navigator.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Handle marking a notification as read
    const handleMarkAsRead = async (id) => {
        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        setIsMarkingRead(true);
        try {
            await notificationsService.markAsRead(id);

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.notificationId === id
                        ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                        : notification
                )
            );
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError(t('notifications.markAsReadError'));
        } finally {
            setIsMarkingRead(false);
        }
    };

    // Handle marking all notifications as read
    const handleMarkAllAsRead = async () => {
        if (!isOnline) {
            setError(t('common.offlineError'));
            return;
        }

        setIsMarkingRead(true);
        try {
            await notificationsService.markAllAsRead(user.id);

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({
                    ...notification,
                    isRead: true,
                    readAt: new Date().toISOString()
                }))
            );
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            setError(t('notifications.markAllAsReadError'));
        } finally {
            setIsMarkingRead(false);
        }
    };

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (notification) => {
        setNotificationToDelete(notification);
        setDeleteDialogOpen(true);
    };

    // Open delete all confirmation dialog
    const handleOpenDeleteAllDialog = () => {
        setDeleteAllDialogOpen(true);
    };

    // Handle notification deletion
    const handleDeleteNotification = async () => {
        if (!notificationToDelete || !isOnline) {
            setDeleteDialogOpen(false);
            return;
        }

        setIsDeleting(true);
        try {
            await notificationsService.deleteNotification(notificationToDelete.notificationId);

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.filter(notification =>
                    notification.notificationId !== notificationToDelete.notificationId
                )
            );

            setDeleteDialogOpen(false);
        } catch (err) {
            console.error('Error deleting notification:', err);
            setError(t('notifications.deleteError'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle deleting all notifications
    const handleDeleteAllNotifications = async () => {
        if (!isOnline) {
            setDeleteAllDialogOpen(false);
            return;
        }

        setIsDeleting(true);
        try {
            await notificationsService.deleteAllNotifications(user.id);

            // Update local state
            setNotifications([]);

            setDeleteAllDialogOpen(false);
        } catch (err) {
            console.error('Error deleting all notifications:', err);
            setError(t('notifications.deleteAllError'));
        } finally {
            setIsDeleting(false);
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
                    // If no specific action, do nothing
                    break;
            }
        }

        // Mark as read if not already read
        if (!notification.isRead) {
            handleMarkAsRead(notification.notificationId);
        }
    };

    // Clear error message
    const handleClearError = () => {
        setError('');
    };

    // Count unread notifications
    const unreadCount = notifications.filter(notification => !notification.isRead).length;

    return (
        <Container maxWidth="md">
            <PageHeader
                title={t('notifications.title')}
                subtitle={t('notifications.subtitle', { count: notifications.length })}
                breadcrumbs={[
                    { text: t('app.dashboard'), link: '/' },
                    { text: t('notifications.notifications') }
                ]}
            />

            {/* Error message */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={handleClearError}
                >
                    {error}
                </Alert>
            )}

            {/* Offline warning */}
            {!isOnline && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {t('common.offlineWarning')}
                </Alert>
            )}

            {/* Notification filters and actions */}
            <Paper sx={{ mb: 3 }}>
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: 2
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label="notification tabs"
                        sx={{ mb: isMobile ? 1 : 0 }}
                    >
                        <Tab
                            label={t('notifications.all')}
                            id="notifications-tab-0"
                            aria-controls="notifications-tabpanel-0"
                        />
                        <Tab
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {t('notifications.unread')}
                                    {unreadCount > 0 && (
                                        <Chip
                                            label={unreadCount}
                                            size="small"
                                            color="primary"
                                            sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                                        />
                                    )}
                                </Box>
                            }
                            id="notifications-tab-1"
                            aria-controls="notifications-tabpanel-1"
                        />
                    </Tabs>

                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        flexDirection: isMobile ? 'column' : 'row',
                        width: isMobile ? '100%' : 'auto'
                    }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={handleMarkAllAsRead}
                            disabled={!isOnline || isMarkingRead || unreadCount === 0}
                            fullWidth={isMobile}
                        >
                            {isMarkingRead ? t('common.processing') : t('notifications.markAllAsRead')}
                        </Button>

                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteSweepIcon />}
                            onClick={handleOpenDeleteAllDialog}
                            disabled={!isOnline || isDeleting || notifications.length === 0}
                            fullWidth={isMobile}
                        >
                            {isDeleting ? t('common.processing') : t('notifications.deleteAll')}
                        </Button>

                        <IconButton
                            color="primary"
                            onClick={fetchNotifications}
                            disabled={!isOnline || loading}
                            size="small"
                            sx={{ display: isMobile ? 'none' : 'flex' }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {/* Notifications list */}
            <Paper>
                {loading ? (
                    <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            {t('notifications.loading')}
                        </Typography>
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                            {activeTab === 0
                                ? t('notifications.noNotifications')
                                : t('notifications.noUnreadNotifications')
                            }
                        </Typography>
                        {activeTab === 1 && (
                            <Button
                                variant="text"
                                sx={{ mt: 2 }}
                                onClick={() => setActiveTab(0)}
                            >
                                {t('notifications.viewAllNotifications')}
                            </Button>
                        )}
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notification) => (
                            <React.Fragment key={notification.notificationId}>
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{
                                        px: 2,
                                        py: 2,
                                        backgroundColor: notification.isRead
                                            ? 'transparent'
                                            : 'rgba(25, 118, 210, 0.08)',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                        },
                                        '& .delete-button': {
                                            visibility: 'hidden'
                                        },
                                        '&:hover .delete-button': {
                                            visibility: 'visible'
                                        }
                                    }}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <ListItemAvatar>
                                        <Avatar>{getNotificationIcon(notification.type)}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                pr: isMobile ? 4 : 0
                                            }}>
                                                <Typography
                                                    variant="subtitle1"
                                                    color="text.primary"
                                                    fontWeight={notification.isRead ? 'normal' : 'medium'}
                                                >
                                                    {notification.title}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ flexShrink: 0, ml: 2, display: { xs: 'none', sm: 'block' } }}
                                                >
                                                    {formatNotificationTime(notification.createdAt)}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography
                                                    variant="body2"
                                                    color="text.primary"
                                                    component="span"
                                                >
                                                    {notification.message}
                                                </Typography>
                                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {!notification.isRead ? (
                                                        <Chip
                                                            label={t('notifications.unread')}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.notificationId);
                                                            }}
                                                            icon={<CheckIcon />}
                                                        />
                                                    ) : (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {notification.readAt ?
                                                                t('notifications.readAt', {
                                                                    time: formatNotificationTime(notification.readAt)
                                                                }) :
                                                                t('notifications.read')
                                                            }
                                                        </Typography>
                                                    )}

                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ display: { xs: 'block', sm: 'none' } }}
                                                    >
                                                        {formatNotificationTime(notification.createdAt)}
                                                    </Typography>
                                                </Box>
                                            </>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title={t('notifications.delete')}>
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDeleteDialog(notification);
                                                }}
                                                color="error"
                                                size="small"
                                                className="delete-button"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    {t('notifications.deleteConfirmTitle')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        {t('notifications.deleteConfirmMessage')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={isDeleting}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteNotification}
                        color="error"
                        disabled={isDeleting}
                        startIcon={isDeleting ? <CircularProgress size={20} /> : null}
                    >
                        {isDeleting ? t('common.deleting') : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete all confirmation dialog */}
            <Dialog
                open={deleteAllDialogOpen}
                onClose={() => setDeleteAllDialogOpen(false)}
                aria-labelledby="delete-all-dialog-title"
                aria-describedby="delete-all-dialog-description"
            >
                <DialogTitle id="delete-all-dialog-title">
                    {t('notifications.deleteAllConfirmTitle')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-all-dialog-description">
                        {t('notifications.deleteAllConfirmMessage')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteAllDialogOpen(false)}
                        disabled={isDeleting}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteAllNotifications}
                        color="error"
                        disabled={isDeleting}
                        startIcon={isDeleting ? <CircularProgress size={20} /> : null}
                    >
                        {isDeleting ? t('common.deleting') : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default NotificationsPage;   