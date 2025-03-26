// src/components/layout/SidebarMenu.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    Divider,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
    useTheme,
    IconButton
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Gavel as GavelIcon,
    People as PeopleIcon,
    Event as EventIcon,
    AttachMoney as MoneyIcon,
    Description as DocumentsIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    ChevronLeft as ChevronLeftIcon,
    Groups as FirmIcon,
    PersonOutline as ProfileIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            '& .MuiDrawer-paper': {
                width: drawerWidth,
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: 'hidden',
            },
        }),
        ...(!open && {
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
            width: theme.spacing(7),
            [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9),
            },
            '& .MuiDrawer-paper': {
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
                overflowX: 'hidden',
                width: theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                    width: theme.spacing(9),
                },
            },
        }),
    }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const SidebarMenu = ({ open, handleDrawerClose }) => {
    const { user, hasRole } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    // Menu items with access control
    const menuItems = [
        {
            text: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/',
            access: true // Everyone can access
        },
        {
            text: 'Cases',
            icon: <GavelIcon />,
            path: '/cases',
            access: hasRole(['Lawyer', 'Admin']) // Only lawyers and admins
        },
        {
            text: 'Clients',
            icon: <PeopleIcon />,
            path: '/clients',
            access: true // Everyone can access
        },
        {
            text: 'Appointments',
            icon: <EventIcon />,
            path: '/appointments',
            access: true // Everyone can access
        },
        {
            text: 'Billing',
            icon: <MoneyIcon />,
            path: '/billing',
            access: hasRole(['Lawyer', 'Admin', 'Secretary']) // Not for clients
        },
        {
            text: 'Documents',
            icon: <DocumentsIcon />,
            path: '/documents',
            access: true // Everyone can access
        },
        {
            text: 'Reports',
            icon: <ReportsIcon />,
            path: '/reports',
            access: hasRole(['Lawyer', 'Admin']) // Only lawyers and admins
        }
    ];

    // Administrative menu items
    const adminMenuItems = [
        {
            text: 'Firm Management',
            icon: <FirmIcon />,
            path: '/firm',
            access: hasRole('Admin') // Only for admins
        },
        {
            text: 'Settings',
            icon: <SettingsIcon />,
            path: '/settings',
            access: true // Everyone can access their settings
        },
        {
            text: 'Profile',
            icon: <ProfileIcon />,
            path: '/profile',
            access: true // Everyone can access their profile
        }
    ];

    const handleNavigate = (path) => {
        navigate(path);
        if (window.innerWidth < 600) { // Close drawer automatically on small screens
            handleDrawerClose();
        }
    };

    return (
        <StyledDrawer
            variant="permanent"
            open={open}
        >
            <DrawerHeader>
                {open && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, flexGrow: 1 }}>
                            <GavelIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" color="primary">React Lawyer</Typography>
                        </Box>
                        <IconButton onClick={handleDrawerClose}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </>
                )}
            </DrawerHeader>
            <Divider />

            <List>
                {menuItems.map((item) => (
                    item.access && (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    bgcolor: isActive(item.path) ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                                }}
                                onClick={() => handleNavigate(item.path)}
                            >
                                <Tooltip title={!open ? item.text : ""} placement="right">
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: open ? 3 : 'auto',
                                            justifyContent: 'center',
                                            color: isActive(item.path) ? 'primary.main' : 'inherit',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                </Tooltip>
                                <ListItemText
                                    primary={item.text}
                                    sx={{
                                        opacity: open ? 1 : 0,
                                        color: isActive(item.path) ? 'primary.main' : 'inherit',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    )
                ))}
            </List>

            <Divider />

            <List>
                {adminMenuItems.map((item) => (
                    item.access && (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    bgcolor: isActive(item.path) ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                                }}
                                onClick={() => handleNavigate(item.path)}
                            >
                                <Tooltip title={!open ? item.text : ""} placement="right">
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: open ? 3 : 'auto',
                                            justifyContent: 'center',
                                            color: isActive(item.path) ? 'primary.main' : 'inherit',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                </Tooltip>
                                <ListItemText
                                    primary={item.text}
                                    sx={{
                                        opacity: open ? 1 : 0,
                                        color: isActive(item.path) ? 'primary.main' : 'inherit',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    )
                ))}
            </List>

            {open && (
                <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        {user?.name || 'User'} • {user?.role || 'User'}
                    </Typography>
                </Box>
            )}
        </StyledDrawer>
    );
};

export default SidebarMenu;