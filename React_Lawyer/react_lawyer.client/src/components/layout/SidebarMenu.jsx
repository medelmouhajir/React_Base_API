// src/components/layout/SidebarMenu.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Drawer,
    Toolbar,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Tooltip,
    IconButton,
    Collapse,
    Typography,
    useTheme
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Dashboard as DashboardIcon,
    Gavel as CasesIcon,
    Person as ClientsIcon,
    CalendarToday as AppointmentsIcon,
    Receipt as BillingIcon,
    Description as DocumentsIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    ExpandLess,
    ExpandMore
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/AuthContext';
import { styled } from '@mui/material/styles';

// Drawer width constants
const drawerWidth = 240;
const miniDrawerWidth = 64;

const OpenedDrawer = styled(Drawer)(({ theme, direction }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
        overflowX: 'hidden',
        // Adjust for RTL
        ...(direction === 'rtl' && {
            borderLeft: `1px solid ${theme.palette.divider}`,
            borderRight: 'none',
        }),
    },
}));

const ClosedDrawer = styled(Drawer)(({ theme, direction }) => ({
    width: miniDrawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
        width: miniDrawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        overflowX: 'hidden',
        // Adjust for RTL
        ...(direction === 'rtl' && {
            borderLeft: `1px solid ${theme.palette.divider}`,
            borderRight: 'none',
        }),
    },
}));

const SidebarMenu = ({ open, handleDrawerClose, isMobile, isTablet }) => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const theme = useTheme();

    // Determine if we're using RTL layout
    const isRtl = i18n.dir() === 'rtl';

    // Adjust drawer close icon based on language direction
    const closeIcon = isRtl ? <ChevronRightIcon /> : <ChevronLeftIcon />;

    // Collapsible menu states
    const [billingOpen, setBillingOpen] = React.useState(false);
    const [documentsOpen, setDocumentsOpen] = React.useState(false);

    const handleBillingClick = () => {
        setBillingOpen(!billingOpen);
    };

    const handleDocumentsClick = () => {
        setDocumentsOpen(!documentsOpen);
    };

    // Navigate and handle collapsible logic
    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) {
            handleDrawerClose();
        }
    };

    // Navigation items
    const mainItems = [
        {
            text: t('app.dashboard', 'Dashboard'),
            icon: <DashboardIcon />,
            path: '/',
            roles: ['Admin', 'Lawyer', 'Secretary', 'Client']
        },
        {
            text: t('cases.cases', 'Cases'),
            icon: <CasesIcon />,
            path: '/cases',
            roles: ['Admin', 'Lawyer', 'Secretary', 'Client']
        },
        {
            text: t('clients.clients', 'Clients'),
            icon: <ClientsIcon />,
            path: '/clients',
            roles: ['Admin', 'Lawyer', 'Secretary']
        },
        {
            text: t('appointments.calendar', 'Calendar'),
            icon: <AppointmentsIcon />,
            path: '/appointments/calendar',
            roles: ['Admin', 'Lawyer', 'Secretary']
        },
        {
            text: t('appointments.appointments', 'Appointments'),
            icon: <AppointmentsIcon />,
            path: '/appointments',
            roles: ['Admin', 'Lawyer', 'Secretary', 'Client']
        },
    ];

    const billingItems = [
        {
            text: t('billing.invoices', 'Invoices'),
            path: '/billing/invoices',
            roles: ['Admin', 'Lawyer', 'Secretary', 'Client']
        },
        {
            text: t('billing.payments', 'Payments'),
            path: '/billing/payments',
            roles: ['Admin', 'Lawyer', 'Secretary']
        },
        {
            text: t('billing.timeEntries.title', 'Time Entries'),
            path: '/billing/time-entries',
            roles: ['Admin', 'Lawyer', 'Secretary']
        },
    ];

    const documentItems = [
        {
            text: t('documents.all', 'All Documents'),
            path: '/documents',
            roles: ['Admin', 'Lawyer', 'Secretary', 'Client']
        },
        {
            text: t('documents.templates', 'Templates'),
            path: '/documents/templates',
            roles: ['Admin', 'Lawyer', 'Secretary']
        },
    ];

    const bottomItems = [
        {
            text: t('reports.reports', 'Reports'),
            icon: <ReportsIcon />,
            path: '/reports',
            roles: ['Admin', 'Lawyer']
        },
        {
            text: t('app.settings', 'Settings'),
            icon: <SettingsIcon />,
            path: '/settings',
            roles: ['Admin', 'Lawyer', 'Secretary', 'Client']
        },
    ];

    // Don't render the sidebar on mobile - it's handled by Navigation.jsx
    if (isMobile) {
        return null;
    }

    const drawerContent = (
        <>
            <Toolbar sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isRtl ? 'flex-start' : 'flex-end', // Adjust for RTL
                px: [1],
                minHeight: theme => theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                    minHeight: theme => theme.spacing(8),
                },
            }}>
                {open && (
                    <IconButton onClick={handleDrawerClose}>
                        {closeIcon}
                    </IconButton>
                )}
            </Toolbar>
            <Divider />

            {/* Main Navigation Items */}
            <List>
                {mainItems.map((item) => (
                    // Check if user has required role
                    (item.roles && user?.role && item.roles.includes(user.role)) &&
                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? (isRtl ? 'flex-end' : 'initial') : 'center',
                                px: 2.5,
                                bgcolor: location.pathname === item.path ?
                                    `rgba(25, 118, 210, 0.08)` : 'transparent',
                            }}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <Tooltip title={open ? '' : item.text} placement={isRtl ? "left" : "right"}>
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? (isRtl ? 0 : 3) : 'auto',
                                        ml: open ? (isRtl ? 3 : 0) : 'auto',
                                        justifyContent: 'center',
                                        color: location.pathname === item.path ?
                                            'primary.main' : 'inherit',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                            </Tooltip>
                            <ListItemText
                                primary={item.text}
                                sx={{
                                    opacity: open ? 1 : 0,
                                    color: location.pathname === item.path ?
                                        'primary.main' : 'inherit',
                                    // For RTL, align text right
                                    textAlign: isRtl ? 'right' : 'left',
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Divider />

            {/* Billing Section with Collapsible Menu */}
            <List>
                <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                        sx={{
                            minHeight: 48,
                            justifyContent: open ? (isRtl ? 'flex-end' : 'initial') : 'center',
                            px: 2.5,
                            bgcolor: location.pathname.startsWith('/billing') ?
                                `rgba(25, 118, 210, 0.08)` : 'transparent',
                        }}
                        onClick={open ? handleBillingClick : () => handleNavigate('/billing')}
                    >
                        <Tooltip title={open ? '' : t('billing.billing', 'Billing')} placement={isRtl ? "left" : "right"}>
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? (isRtl ? 0 : 3) : 'auto',
                                    ml: open ? (isRtl ? 3 : 0) : 'auto',
                                    justifyContent: 'center',
                                    color: location.pathname.startsWith('/billing') ?
                                        'primary.main' : 'inherit',
                                }}
                            >
                                <BillingIcon />
                            </ListItemIcon>
                        </Tooltip>
                        <ListItemText
                            primary={t('billing.billing', 'Billing')}
                            sx={{
                                opacity: open ? 1 : 0,
                                color: location.pathname.startsWith('/billing') ?
                                    'primary.main' : 'inherit',
                                textAlign: isRtl ? 'right' : 'left',
                            }}
                        />
                        {open && (billingOpen ? <ExpandLess /> : <ExpandMore />)}
                    </ListItemButton>

                    {/* Collapsible Billing Submenu */}
                    {open && (
                        <Collapse in={billingOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {billingItems.map((item) => (
                                    // Check if user has required role
                                    (item.roles && user?.role && item.roles.includes(user.role)) &&
                                    <ListItemButton
                                        key={item.text}
                                        sx={{
                                            pl: isRtl ? 2 : 4,
                                            pr: isRtl ? 4 : 2,
                                            paddingInlineStart: isRtl ? '16px' : '32px',
                                            paddingInlineEnd: isRtl ? '32px' : '16px',
                                        }}
                                        onClick={() => handleNavigate(item.path)}
                                        selected={location.pathname === item.path}
                                    >
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                fontSize: '0.875rem',
                                                fontWeight: location.pathname === item.path ?
                                                    'medium' : 'normal',
                                                textAlign: isRtl ? 'right' : 'left',
                                            }}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>
                    )}
                </ListItem>

                {/* Documents Section with Collapsible Menu */}
                <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                        sx={{
                            minHeight: 48,
                            justifyContent: open ? (isRtl ? 'flex-end' : 'initial') : 'center',
                            px: 2.5,
                            bgcolor: location.pathname.startsWith('/documents') ?
                                `rgba(25, 118, 210, 0.08)` : 'transparent',
                        }}
                        onClick={open ? handleDocumentsClick : () => handleNavigate('/documents')}
                    >
                        <Tooltip title={open ? '' : t('documents.documents', 'Documents')} placement={isRtl ? "left" : "right"}>
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? (isRtl ? 0 : 3) : 'auto',
                                    ml: open ? (isRtl ? 3 : 0) : 'auto',
                                    justifyContent: 'center',
                                    color: location.pathname.startsWith('/documents') ?
                                        'primary.main' : 'inherit',
                                }}
                            >
                                <DocumentsIcon />
                            </ListItemIcon>
                        </Tooltip>
                        <ListItemText
                            primary={t('documents.documents', 'Documents')}
                            sx={{
                                opacity: open ? 1 : 0,
                                color: location.pathname.startsWith('/documents') ?
                                    'primary.main' : 'inherit',
                                textAlign: isRtl ? 'right' : 'left',
                            }}
                        />
                        {open && (documentsOpen ? <ExpandLess /> : <ExpandMore />)}
                    </ListItemButton>

                    {/* Collapsible Documents Submenu */}
                    {open && (
                        <Collapse in={documentsOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {documentItems.map((item) => (
                                    // Check if user has required role
                                    (item.roles && user?.role && item.roles.includes(user.role)) &&
                                    <ListItemButton
                                        key={item.text}
                                        sx={{
                                            pl: isRtl ? 2 : 4,
                                            pr: isRtl ? 4 : 2,
                                            paddingInlineStart: isRtl ? '16px' : '32px',
                                            paddingInlineEnd: isRtl ? '32px' : '16px',
                                        }}
                                        onClick={() => handleNavigate(item.path)}
                                        selected={location.pathname === item.path}
                                    >
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                fontSize: '0.875rem',
                                                fontWeight: location.pathname === item.path ?
                                                    'medium' : 'normal',
                                                textAlign: isRtl ? 'right' : 'left',
                                            }}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>
                    )}
                </ListItem>
            </List>

            <Divider />

            {/* Bottom Navigation Items */}
            <List>
                {bottomItems.map((item) => (
                    // Check if user has required role
                    (item.roles && user?.role && item.roles.includes(user.role)) &&
                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? (isRtl ? 'flex-end' : 'initial') : 'center',
                                px: 2.5,
                                bgcolor: location.pathname === item.path ?
                                    `rgba(25, 118, 210, 0.08)` : 'transparent',
                            }}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <Tooltip title={open ? '' : item.text} placement={isRtl ? "left" : "right"}>
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? (isRtl ? 0 : 3) : 'auto',
                                        ml: open ? (isRtl ? 3 : 0) : 'auto',
                                        justifyContent: 'center',
                                        color: location.pathname === item.path ?
                                            'primary.main' : 'inherit',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                            </Tooltip>
                            <ListItemText
                                primary={item.text}
                                sx={{
                                    opacity: open ? 1 : 0,
                                    color: location.pathname === item.path ?
                                        'primary.main' : 'inherit',
                                    textAlign: isRtl ? 'right' : 'left',
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            {/* App version and branding */}
            {open && (
                <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        {t('app.title', 'Law Office Management')}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                        v1.0.0
                    </Typography>
                </Box>
            )}
        </>
    );

    // Set appropriate anchor for RTL/LTR
    const anchor = isRtl ? 'right' : 'left';
    const drawerProps = {
        variant: "permanent",
        direction: isRtl ? 'rtl' : 'ltr',
        anchor: anchor
    };

    // Choose between open and closed drawer
    return isTablet ? (
        <ClosedDrawer {...drawerProps}>
            {drawerContent}
        </ClosedDrawer>
    ) : (
        open ? (
            <OpenedDrawer {...drawerProps}>
                {drawerContent}
            </OpenedDrawer>
        ) : (
            <ClosedDrawer {...drawerProps}>
                {drawerContent}
            </ClosedDrawer>
        )
    );
};

export default SidebarMenu;