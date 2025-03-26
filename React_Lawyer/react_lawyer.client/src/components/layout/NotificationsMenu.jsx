// src/components/layout/NotificationsMenu.jsx
import React, { useState, useEffect } from 'react';
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
    Badge
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Event as EventIcon,
    Gavel as GavelIcon,
    AttachMoney as MoneyIcon,
    Email as EmailIcon,
    Close as CloseIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotificationsMenu = ({ anchorEl, open, onClose }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would be fetched from your API
        const fetchNotifications = async () => {
            try {
                // Mock data for demonstration
                const mockNotifications = [
                    {
                        id: 1,
                        title: 'New case assignment',
                        message: 'You have been assigned to Smith vs. Anderson case',
                        type: 'case',
                        time: '10 min ago',
                        read: false,
                        actionUrl: '/cases/123'
                    },
                    {
                        id: 2,
                        title: 'Upcoming appointment',
                        message: 'Client meeting with Jane Doe at 2:00 PM',
                        type: 'appointment',
                        time: '1 hour ago',
                        read: false,
                        actionUrl: '/appointments/456'
                    },
                    {
                        id: 3,
                        title: 'Invoice paid',
                        message: 'Invoice #1234 has been paid by client',
                        type: 'invoice',
                        time: 'Yesterday',
                        read: true,
                        actionUrl: '/billing/invoices/789'
                    },
                    {
                        id: 4,
                        title: 'Document uploaded',
                        message: 'New document uploaded to Johnson case',
                        type: 'document',
                        time: '2 days ago',
                        read: true,
                        actionUrl: '/documents/101112'
                    }
                ];

                setNotifications(mockNotifications);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setLoading(false);
            }
        };

        if (open) {
            fetchNotifications();
        }
    }, [open]);

    const handleNotificationClick = (url) => {
        navigate(url);
        onClose();
    };

    const markAsRead = (id, event) => {
        event.stopPropagation();
        setNotifications(notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
        ));
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'appointment':
                return <EventIcon color="primary" />;
            case 'case':
                return <GavelIcon color="secondary" />;
            case 'invoice':
                return <MoneyIcon style={{ color: 'green' }} />;
            case 'document':
                return <EmailIcon style={{ color: 'orange' }} />;
            default:
                return <NotificationsIcon />;
        }
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notification => ({ ...notification, read: true })));
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
                <Typography variant="h6">Notifications</Typography>
                <Button
                    size="small"
                    onClick={markAllAsRead}
                    startIcon={<CheckIcon fontSize="small" />}
                >
                    Mark all as read
                </Button>
            </Box>

            <Divider />

            {loading ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2">Loading notifications...</Typography>
                </Box>
            ) : notifications.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2">No notifications</Typography>
                </Box>
            ) : (
                <List sx={{ p: 0 }}>
                    {notifications.map((notification) => (
                        <React.Fragment key={notification.id}>
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    }
                                }}
                                onClick={() => handleNotificationClick(notification.actionUrl)}
                                secondaryAction={
                                    !notification.read && (
                                        <IconButton
                                            edge="end"
                                            aria-label="mark as read"
                                            onClick={(e) => markAsRead(notification.id, e)}
                                            size="small"
                                        >
                                            <CheckIcon fontSize="small" />
                                        </IconButton>
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
                                            fontWeight={notification.read ? 'normal' : 'bold'}
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
                                                {notification.time}
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
                    View all notifications
                </Button>
            </Box>
        </Menu>
    );
};

export default NotificationsMenu;