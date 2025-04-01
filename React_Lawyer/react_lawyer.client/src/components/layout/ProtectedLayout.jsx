// src/components/layout/ProtectedLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Snackbar, Alert, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../features/auth/AuthContext';
import Navigation from './Navigation';
import SidebarMenu from './SidebarMenu';
import Footer from './Footer';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { useThemeMode } from '../../theme/ThemeProvider';

// Define drawer width constant
const drawerWidth = 240;
const mobileDrawerWidth = 0; // Collapsed on mobile
const tabletDrawerWidth = 64; // Minimized on tablet
const openDrawerWidth = 240;

// Styled component for main content area
const Main = styled('main')(({ theme, drawerOpen, mobileView, tabletView }) => {
    let marginLeft = mobileView ? 0 : tabletView ? tabletDrawerWidth : (drawerOpen ? openDrawerWidth : tabletDrawerWidth);
    let width = mobileView ? '100%' : `calc(100% - ${marginLeft}px)`;

    return {
        flexGrow: 1,
        padding: theme.spacing(mobileView ? 2 : 3),
        width: width,
        marginLeft: marginLeft,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(2, 1),
        }
    };
});

const ProtectedLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const { t } = useTranslation();
    const theme = useTheme();
    const { isMobile, isTablet } = useThemeMode();

    // Initialize sidebar state based on screen size
    const [open, setOpen] = useState(() => {
        const savedState = localStorage.getItem('sidebarOpen');
        // Default to open on desktop, closed on tablet/mobile
        return savedState !== null
            ? savedState === 'true'
            : !isMobile && !isTablet;
    });

    const [showOfflineAlert, setShowOfflineAlert] = useState(false);

    // Check for authentication
    useEffect(() => {
        if (!loading && !isAuthenticated()) {
            navigate('/login');
        }
    }, [loading, isAuthenticated, navigate]);

    // Monitor online status changes
    useEffect(() => {
        if (!isOnline) {
            setShowOfflineAlert(true);
        }
    }, [isOnline]);

    // Close sidebar automatically on mobile when navigating
    useEffect(() => {
        if (isMobile && open) {
            setOpen(false);
        }
    }, [isMobile, navigate]);

    const handleDrawerToggle = () => {
        const newState = !open;
        setOpen(newState);
        // Save state to localStorage
        localStorage.setItem('sidebarOpen', newState.toString());
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
            {/* Top Navigation Bar */}
            <Navigation
                toggleDrawer={handleDrawerToggle}
                open={open}
                isMobile={isMobile}
                isTablet={isTablet}
            />

            {/* Sidebar Navigation Menu */}
            <SidebarMenu
                open={open}
                handleDrawerClose={handleDrawerToggle}
                isMobile={isMobile}
                isTablet={isTablet}
            />

            {/* Main Content Area */}
            <Main
                drawerOpen={open}
                mobileView={isMobile}
                tabletView={isTablet}
            >
                {/* Toolbar spacer */}
                <Box sx={{
                    height: (theme) => theme.mixins.toolbar.minHeight,
                    mb: { xs: 1, sm: 2 }
                }} />

                {/* Page content */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 'calc(100vh - 120px)',
                    width: '100%'
                }}>
                    {/* Outlet renders the current route */}
                    <Box sx={{ flexGrow: 1 }}>
                        <Outlet />
                    </Box>

                    {/* Footer */}
                    <Footer isMobile={isMobile} />
                </Box>

                {/* Offline notification */}
                <Snackbar
                    open={showOfflineAlert}
                    autoHideDuration={6000}
                    onClose={() => setShowOfflineAlert(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setShowOfflineAlert(false)}
                        severity="warning"
                        sx={{ width: '100%' }}
                    >
                        {t('common.offlineWarning', 'You\'re currently offline. Some features may be unavailable.')}
                    </Alert>
                </Snackbar>
            </Main>
        </Box>
    );
};

export default ProtectedLayout;