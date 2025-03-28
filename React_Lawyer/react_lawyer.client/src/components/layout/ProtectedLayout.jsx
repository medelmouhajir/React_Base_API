// src/components/layout/ProtectedLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../features/auth/AuthContext';
import Navigation from './Navigation';
import SidebarMenu from './SidebarMenu';
import Footer from './Footer';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Define drawer width constant
const drawerWidth = 240;
const closedDrawerWidth = 64;

// Styled component for main content area
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        flexGrow: 1,
        padding: theme.spacing(3),
        width: '100%',
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: { xs: 0, sm: `${open ? drawerWidth : closedDrawerWidth}px` },
        [theme.breakpoints.up('sm')]: {
            width: `calc(100% - ${open ? drawerWidth : closedDrawerWidth}px)`,
        },
    }),
);

const ProtectedLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    
    // Initialize sidebar state from localStorage
    const [open, setOpen] = useState(() => {
        const savedState = localStorage.getItem('sidebarOpen');
        // Default to open on large screens, closed on small screens if no saved state
        return savedState !== null
            ? savedState === 'true'
            : window.innerWidth > 900;
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
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            {/* Top Navigation Bar */}
            <Navigation toggleDrawer={handleDrawerToggle} open={open} />

            {/* Sidebar Navigation Menu */}
            <SidebarMenu open={open} handleDrawerClose={handleDrawerToggle} />

            {/* Main Content Area */}
            <Main open={open}>
                {/* Toolbar spacer */}
                <Box sx={{ height: (theme) => theme.mixins.toolbar.minHeight, mb: 2 }} />

                {/* Page content */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 'calc(100vh - 120px)',
                    width: '100%'// Adjusted for toolbar and footer
                }}>
                    {/* Outlet renders the current route */}
                    <Box sx={{ flexGrow: 1 }}>
                        <Outlet />
                    </Box>

                    {/* Footer */}
                    <Footer />
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
                        You're currently offline. Some features may be unavailable.
                    </Alert>
                </Snackbar>
            </Main>
        </Box>
    );
};

export default ProtectedLayout;