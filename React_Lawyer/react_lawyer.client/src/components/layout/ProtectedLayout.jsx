// src/components/layout/ProtectedLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useAuth } from '../../features/auth/AuthContext';
import Navigation from './Navigation';
import SidebarMenu from './SidebarMenu';
import Footer from './Footer';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ProtectedLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const [open, setOpen] = useState(
        localStorage.getItem('sidebarOpen') === 'true' || window.innerWidth > 900
    );
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
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Top Navigation Bar */}
            <Navigation toggleDrawer={handleDrawerToggle} open={open} />

            {/* Sidebar Navigation Menu */}
            <SidebarMenu open={open} handleDrawerClose={handleDrawerToggle} />

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${open ? 240 : 64}px)` },
                    ml: { sm: `${open ? 240 : 64}px` },
                    transition: (theme) => theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                {/* Toolbar spacer */}
                <Box sx={{ height: (theme) => theme.mixins.toolbar.minHeight, mb: 2 }} />

                {/* Page content */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 'calc(100vh - 120px)' // Adjusted for toolbar and footer
                }}>
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
            </Box>
        </Box>
    );
};

export default ProtectedLayout;