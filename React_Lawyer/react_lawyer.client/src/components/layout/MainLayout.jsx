// src/components/layout/MainLayout.jsx
import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Navigation from './Navigation';
import SidebarMenu from './SidebarMenu';
import Footer from './Footer';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: `-${drawerWidth}px`,
        ...(open && {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        }),
        [theme.breakpoints.down('sm')]: {
            marginLeft: 0,
            padding: theme.spacing(2),
        },
    }),
);

const MainLayout = () => {
    const [open, setOpen] = useState(
        localStorage.getItem('sidebarOpen') === 'true' || window.innerWidth > 900
    );

    const handleDrawerToggle = () => {
        const newState = !open;
        setOpen(newState);
        localStorage.setItem('sidebarOpen', newState.toString());
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />

            {/* Top Navigation Bar */}
            <Navigation toggleDrawer={handleDrawerToggle} open={open} />

            {/* Sidebar Navigation Menu */}
            <SidebarMenu open={open} handleDrawerClose={handleDrawerToggle} />

            {/* Main Content Area */}
            <Main open={open}>
                <Toolbar /> {/* This adds spacing below the app bar */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 'calc(100vh - 112px)' // 64px for toolbar, 48px for footer
                }}>
                    {/* Page content will be rendered here */}
                    <Box sx={{ flexGrow: 1 }}>
                        <Outlet />
                    </Box>

                    {/* Footer */}
                    <Footer />
                </Box>
            </Main>
        </Box>
    );
};

export default MainLayout;