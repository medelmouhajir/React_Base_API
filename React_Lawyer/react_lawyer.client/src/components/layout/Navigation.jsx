// src/components/layout/Navigation.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    Badge,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    AccountCircle,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
    Dashboard as DashboardIcon,
    Gavel as CasesIcon,
    Person as ClientsIcon,
    CalendarToday as AppointmentsIcon,
    Receipt as BillingIcon,
    Description as DocumentsIcon,
    Assessment as ReportsIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import NotificationsMenu from './NotificationsMenu';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { styled } from '@mui/material/styles';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

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

const Navigation = ({ toggleDrawer, open, isMobile, isTablet }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isOnline = useOnlineStatus();
    const theme = useTheme();
    const { t } = useTranslation();

    // User profile menu
    const [anchorElUser, setAnchorElUser] = useState(null);
    // Notifications menu
    const [anchorElNotifications, setAnchorElNotifications] = useState(null);
    // Mobile menu
    const [anchorElMobile, setAnchorElMobile] = useState(null);
    // Mobile drawer for navigation
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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

    // Handle mobile menu open
    const handleOpenMobileMenu = (event) => {
        setAnchorElMobile(event.currentTarget);
    };

    // Handle mobile menu close
    const handleCloseMobileMenu = () => {
        setAnchorElMobile(null);
    };

    // Handle mobile drawer
    const toggleMobileDrawer = () => {
        setMobileDrawerOpen(!mobileDrawerOpen);
    };

    // Get page title based on current route
    const getPageTitle = () => {
        const path = location.pathname;

        if (path === '/') return t('app.dashboard', 'Dashboard');
        if (path.startsWith('/cases')) return t('cases.cases', 'Cases');
        if (path.startsWith('/clients')) return t('clients.clients', 'Clients');
        if (path.startsWith('/appointments')) return t('appointments.appointments', 'Appointments');
        if (path.startsWith('/billing')) return t('billing.billing', 'Billing & Invoices');
        if (path.startsWith('/documents')) return t('documents.documents', 'Documents');
        if (path.startsWith('/reports')) return t('reports.reports', 'Reports');
        if (path.startsWith('/settings')) return t('app.settings', 'Settings');
        if (path.startsWith('/profile')) return t('profile.profile', 'Profile');

        return t('app.title', 'Law Office Management');
    };

    // Main navigation items
    const navigationItems = [
        { text: t('app.dashboard', 'Dashboard'), icon: <DashboardIcon />, path: '/' },
        { text: t('cases.cases', 'Cases'), icon: <CasesIcon />, path: '/cases' },
        { text: t('clients.clients', 'Clients'), icon: <ClientsIcon />, path: '/clients' },
        { text: t('appointments.appointments', 'Appointments'), icon: <AppointmentsIcon />, path: '/appointments' },
        { text: t('billing.billing', 'Billing'), icon: <BillingIcon />, path: '/billing' },
        { text: t('documents.documents', 'Documents'), icon: <DocumentsIcon />, path: '/documents' },
        { text: t('reports.reports', 'Reports'), icon: <ReportsIcon />, path: '/reports' },
        { text: t('app.settings', 'Settings'), icon: <SettingsIcon />, path: '/settings' },
    ];

    return (
        <>
            <StyledAppBar position="fixed">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label={open ? "close drawer" : "open drawer"}
                        onClick={isMobile ? toggleMobileDrawer : toggleDrawer}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{
                        flexGrow: 1,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                        {getPageTitle()}
                    </Typography>

                    {/* Desktop view buttons */}
                    {!isMobile ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* Notifications */}
                            <Tooltip title={t('notifications.notifications', 'Notifications')}>
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

                            {/* Language Switcher - Full on desktop */}
                            {!isTablet && (
                                <Box sx={{ mx: 1 }}>
                                    <LanguageSwitcher />
                                </Box>
                            )}

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Online status indicator */}
                            {!isTablet && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
                                    {isOnline ? (
                                        <StyledBadge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                        >
                                            <Typography variant="body2" sx={{ ml: 1, mr: 1 }}>
                                                {t('common.online', 'Online')}
                                            </Typography>
                                        </StyledBadge>
                                    ) : (
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                            color="error"
                                        >
                                            <Typography variant="body2" sx={{ ml: 1, mr: 1 }}>
                                                {t('common.offline', 'Offline')}
                                            </Typography>
                                        </Badge>
                                    )}
                                </Box>
                            )}

                            {/* User profile menu */}
                            <Tooltip title={t('common.openSettings', 'Open settings')}>
                                <IconButton
                                    onClick={handleOpenUserMenu}
                                    sx={{ p: 0, ml: 1 }}
                                    aria-controls={Boolean(anchorElUser) ? 'user-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={Boolean(anchorElUser) ? 'true' : undefined}
                                >
                                    <Avatar
                                        alt={user?.name || 'User'}
                                        src="/static/images/avatar/2.jpg"
                                        sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
                                    />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    ) : (
                        // Mobile view - condensed actions
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* Only show notifications on mobile view */}
                            <IconButton
                                color="inherit"
                                onClick={handleOpenNotificationsMenu}
                                aria-controls={Boolean(anchorElNotifications) ? 'notifications-menu' : undefined}
                                aria-haspopup="true"
                            >
                                <Badge badgeContent={notificationCount} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>

                            {/* More menu for mobile */}
                            <IconButton
                                color="inherit"
                                onClick={handleOpenMobileMenu}
                                aria-controls={Boolean(anchorElMobile) ? 'mobile-menu' : undefined}
                                aria-haspopup="true"
                            >
                                <MoreIcon />
                            </IconButton>
                        </Box>
                    )}

                    {/* Notifications Menu */}
                    <NotificationsMenu
                        anchorEl={anchorElNotifications}
                        open={Boolean(anchorElNotifications)}
                        onClose={handleCloseNotificationsMenu}
                    />

                    {/* User Profile Menu */}
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
                            {t('profile.profile', 'Profile')}
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon sx={{ mr: 1 }} />
                            {t('auth.logout', 'Logout')}
                        </MenuItem>
                    </Menu>

                    {/* Mobile Menu */}
                    <Menu
                        id="mobile-menu"
                        anchorEl={anchorElMobile}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorElMobile)}
                        onClose={handleCloseMobileMenu}
                    >
                        <MenuItem onClick={handleNavigateToProfile}>
                            <ListItemIcon>
                                <AccountCircle fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t('profile.profile', 'Profile')} />
                        </MenuItem>

                        <MenuItem>
                            <ListItemIcon>
                                <ThemeToggle compact />
                            </ListItemIcon>
                            <ListItemText primary={t('common.theme', 'Theme')} />
                        </MenuItem>

                        <MenuItem>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <ListItemText primary={t('common.language', 'Language')} />
                                <LanguageSwitcher compact />
                            </Box>
                        </MenuItem>

                        <Divider />

                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText
                                primary={t('auth.logout', 'Logout')}
                                primaryTypographyProps={{ color: 'error' }}
                            />
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </StyledAppBar>

            {/* Mobile Navigation Drawer */}
            <Drawer
                variant="temporary"
                open={mobileDrawerOpen}
                onClose={toggleMobileDrawer}
                ModalProps={{
                    keepMounted: true, // Better mobile performance
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: '80%',
                        maxWidth: 280
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {navigationItems.map((item) => (
                            <ListItem
                                button
                                key={item.text}
                                onClick={() => {
                                    navigate(item.path);
                                    toggleMobileDrawer();
                                }}
                                selected={location.pathname === item.path}
                            >
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <ListItem button onClick={handleNavigateToProfile}>
                            <ListItemIcon>
                                <AccountCircle />
                            </ListItemIcon>
                            <ListItemText primary={t('profile.profile', 'Profile')} />
                        </ListItem>
                        <ListItem button onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('auth.logout', 'Logout')} />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default Navigation;