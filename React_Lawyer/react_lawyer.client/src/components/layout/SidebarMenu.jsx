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

const OpenedDrawer = styled(Drawer)(({ theme }) => ({
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
    },
}));

const ClosedDrawer = styled(Drawer)(({ theme }) => ({
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
    },
}));

const SidebarMenu = ({ open, handleDrawerClose, isMobile, isTablet }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const theme = useTheme();

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
            text: t('billing.timeEntries', 'Time Entries'),
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
                justifyContent: 'flex-end',
                px: [1],
                minHeight: theme => theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                    minHeight: theme => theme.spacing(8),
                },
            }}>
                {open && (
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
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
                                justifyContent: open ? 'initial' : 'center',
                                px: 2.5,
                                bgcolor: location.pathname === item.path ?
                                    `rgba(25, 118, 210, 0.08)` : 'transparent',
                            }}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <Tooltip title={open ? '' : item.text} placement="right">
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
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
                            justifyContent: open ? 'initial' : 'center',
                            px: 2.5,
                            bgcolor: location.pathname.startsWith('/billing') ?
                                `rgba(25, 118, 210, 0.08)` : 'transparent',
                        }}
                        onClick={open ? handleBillingClick : () => handleNavigate('/billing')}
                    >
                        <Tooltip title={open ? '' : t('billing.billing', 'Billing')} placement="right">
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 3 : 'auto',
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
                                        sx={{ pl: 4 }}
                                        onClick={() => handleNavigate(item.path)}
                                        selected={location.pathname === item.path}
                                    >
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                fontSize: '0.875rem',
                                                fontWeight: location.pathname === item.path ?
                                                    'medium' : 'normal'
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
                            justifyContent: open ? 'initial' : 'center',
                            px: 2.5,
                            bgcolor: location.pathname.startsWith('/documents') ?
                                `rgba(25, 118, 210, 0.08)` : 'transparent',
                        }}
                        onClick={open ? handleDocumentsClick : () => handleNavigate('/documents')}
                    >
                        <Tooltip title={open ? '' : t('documents.documents', 'Documents')} placement="right">
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 3 : 'auto',
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
                                        sx={{ pl: 4 }}
                                        onClick={() => handleNavigate(item.path)}
                                        selected={location.pathname === item.path}
                                    >
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                fontSize: '0.875rem',
                                                fontWeight: location.pathname === item.path ?
                                                    'medium' : 'normal'
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
                                justifyContent: open ? 'initial' : 'center',
                                px: 2.5,
                                bgcolor: location.pathname === item.path ?
                                    `rgba(25, 118, 210, 0.08)` : 'transparent',
                            }}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <Tooltip title={open ? '' : item.text} placement="right">
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
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

    // Choose between open and closed drawer
    return isTablet ? (
        <ClosedDrawer variant="permanent">
            {drawerContent}
        </ClosedDrawer>
    ) : (
        open ? (
            <OpenedDrawer variant="permanent">
                {drawerContent}
            </OpenedDrawer>
        ) : (
            <ClosedDrawer variant="permanent">
                {drawerContent}
            </ClosedDrawer>
        )
    );
};

export default SidebarMenu;