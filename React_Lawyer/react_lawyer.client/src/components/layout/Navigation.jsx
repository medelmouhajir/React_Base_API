// src/components/layout/Navigation.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    MenuItem,
    Avatar,
    Button,
    Tooltip,
    Badge
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    AccountCircle,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import NotificationsMenu from './NotificationsMenu';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': {
            transform: 'scale(.8)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
        },
    },
}));

const Navigation = ({ toggleDrawer, open }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isOnline = useOnlineStatus();

    // User profile menu
    const [anchorElUser, setAnchorElUser] = useState(null);
    // Notifications menu
    const [anchorElNotifications, setAnchorElNotifications] = useState(null);

    // Mock notification count
    const [notificationCount, setNotificationCount] = useState(3);

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Handle profile menu open
    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    // Handle profile menu close
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    // Handle navigation to profile
    const handleNavigateToProfile = () => {
        navigate('/profile');
        handleCloseUserMenu();
    };

    // Handle opening notifications menu
    const handleOpenNotificationsMenu = (event) => {
        setAnchorElNotifications(event.currentTarget);
    };

    // Handle closing notifications menu
    const handleCloseNotificationsMenu = () => {
        setAnchorElNotifications(null);
    };

    // Get page title based on current route
    const getPageTitle = () => {
        const path = location.pathname;

        if (path === '/') return 'Dashboard';
        if (path.startsWith('/cases')) return 'Cases';
        if (path.startsWith('/clients')) return 'Clients';
        if (path.startsWith('/appointments')) return 'Appointments';
        if (path.startsWith('/billing')) return 'Billing & Invoices';
        if (path.startsWith('/documents')) return 'Documents';
        if (path.startsWith('/reports')) return 'Reports';
        if (path.startsWith('/settings')) return 'Settings';
        if (path.startsWith('/profile')) return 'Profile';

        return 'Law Office Management';
    };

    return (
        <StyledAppBar position="fixed">
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={toggleDrawer}
                    edge="start"
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {getPageTitle()}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Notifications */}
                    <Tooltip title="Notifications">
                        <IconButton
                            color="inherit"
                            onClick={handleOpenNotificationsMenu}
                            aria-controls={Boolean(anchorElNotifications) ? 'notifications-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={Boolean(anchorElNotifications) ? 'true' : undefined}
                        >
                            <Badge badgeContent={notificationCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* Notifications Menu */}
                    <NotificationsMenu
                        anchorEl={anchorElNotifications}
                        open={Boolean(anchorElNotifications)}
                        onClose={handleCloseNotificationsMenu}
                    />

                    {/* Online status indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {isOnline ? (
                            <StyledBadge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                            >
                                <Typography variant="body2" sx={{ ml: 1, mr: 1 }}>Online</Typography>
                            </StyledBadge>
                        ) : (
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                                color="error"
                            >
                                <Typography variant="body2" sx={{ ml: 1, mr: 1 }}>Offline</Typography>
                            </Badge>
                        )}
                    </Box>

                    {/* User profile menu */}
                    <Tooltip title="Open settings">
                        <IconButton
                            onClick={handleOpenUserMenu}
                            sx={{ p: 0 }}
                            aria-controls={Boolean(anchorElUser) ? 'user-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={Boolean(anchorElUser) ? 'true' : undefined}
                        >
                            <Avatar alt={user?.name || 'User'} src="/static/images/avatar/2.jpg" />
                        </IconButton>
                    </Tooltip>

                    <Menu
                        id="user-menu"
                        anchorEl={anchorElUser}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorElUser)}
                        onClose={handleCloseUserMenu}
                    >
                        <MenuItem onClick={handleNavigateToProfile}>
                            <AccountCircle sx={{ mr: 1 }} />
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon sx={{ mr: 1 }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </StyledAppBar>
    );
};

export default Navigation;