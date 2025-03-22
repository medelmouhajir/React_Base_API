import { useState, useEffect } from 'react';
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    Container,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Paper,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Folder as FolderIcon,
    EventNote as EventNoteIcon,
    Description as DescriptionIcon,
    Receipt as ReceiptIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import useOnlineStatus from './hooks/useOnlineStatus';
import OfflinePage from './components/Offline/OfflinePage';

// Create theme with primary and secondary colors appropriate for a law firm
const theme = createTheme({
    palette: {
        primary: {
            main: '#1a237e', // Deep blue
        },
        secondary: {
            main: '#6a1b9a', // Purple
        },
        background: {
            default: '#f5f5f5',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h5: {
            fontWeight: 500,
        },
        h6: {
            fontWeight: 500,
        },
    },
});

const drawerWidth = 240;

const AppBarStyled = styled(AppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const DrawerStyled = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        '& .MuiDrawer-paper': {
            position: 'relative',
            whiteSpace: 'nowrap',
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            boxSizing: 'border-box',
            ...(!open && {
                overflowX: 'hidden',
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
                width: theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                    width: theme.spacing(9),
                },
            }),
        },
    }),
);

function App() {
    const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [forecasts, setForecasts] = useState([]);
    const isOnline = useOnlineStatus();
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);

    // Show offline notification when going offline
    useEffect(() => {
        if (!isOnline) {
            setShowOfflineMessage(true);
        }
    }, [isOnline]);

    // Toggle drawer
    const toggleDrawer = () => {
        setOpen(!open);
    };

    // Fetch data on component mount
    useEffect(() => {
        populateWeatherData();
    }, []);

    async function populateWeatherData() {
        try {
            const response = await fetch('weatherforecast');
            if (response.ok) {
                const data = await response.json();
                setForecasts(data);
                // Store in local storage for offline access
                localStorage.setItem('weatherData', JSON.stringify(data));
            } else if (!isOnline) {
                // Try to load from cache if offline
                const cachedData = localStorage.getItem('weatherData');
                if (cachedData) {
                    setForecasts(JSON.parse(cachedData));
                }
            }
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
            // Try to load from cache if fetch fails
            const cachedData = localStorage.getItem('weatherData');
            if (cachedData) {
                setForecasts(JSON.parse(cachedData));
            }
        } finally {
            setLoading(false);
        }
    }

    // Menu items for navigation
    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Clients', icon: <PeopleIcon />, path: '/clients' },
        { text: 'Cases', icon: <FolderIcon />, path: '/cases' },
        { text: 'Appointments', icon: <EventNoteIcon />, path: '/appointments' },
        { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
        { text: 'Billing', icon: <ReceiptIcon />, path: '/billing' },
    ];

    const secondaryMenuItems = [
        { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
        { text: 'Logout', icon: <LogoutIcon />, path: '/logout' },
    ];

    // If completely offline and no cached data, show offline page
    if (!isOnline && forecasts.length === 0 && !loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <OfflinePage />
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />

                {/* Top navigation bar */}
                <AppBarStyled position="absolute" open={open}>
                    <Toolbar sx={{ pr: '24px' }}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={toggleDrawer}
                            sx={{
                                marginRight: '36px',
                                ...(open && { display: 'none' }),
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            component="h1"
                            variant="h6"
                            color="inherit"
                            noWrap
                            sx={{ flexGrow: 1 }}
                        >
                            React Lawyer Office Management
                        </Typography>
                        {!isOnline && (
                            <IconButton color="inherit">
                                <WifiOffIcon />
                            </IconButton>
                        )}
                        <IconButton color="inherit">
                            <NotificationsIcon />
                        </IconButton>
                    </Toolbar>
                </AppBarStyled>

                {/* Side navigation drawer */}
                <DrawerStyled variant="permanent" open={open}>
                    <Toolbar
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            px: [1],
                        }}
                    >
                        <IconButton onClick={toggleDrawer}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </Toolbar>
                    <Divider />
                    <List component="nav">
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton>
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                        <Divider sx={{ my: 1 }} />
                        {secondaryMenuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton>
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DrawerStyled>

                {/* Main content area */}
                <Box
                    component="main"
                    sx={{
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'light'
                                ? theme.palette.grey[100]
                                : theme.palette.grey[900],
                        flexGrow: 1,
                        height: '100vh',
                        overflow: 'auto',
                        pt: 8, // Added padding to account for AppBar
                    }}
                >
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h4" gutterBottom component="h2">
                                    Weather Forecast
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    This component demonstrates fetching data from the server.
                                </Typography>
                                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                                    {forecasts && forecasts.length > 0 ? (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Temp. (C)</th>
                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Temp. (F)</th>
                                                    <th style={{ textAlign: 'left', padding: '8px' }}>Summary</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {forecasts.map((forecast) => (
                                                    <tr key={forecast.date}>
                                                        <td style={{ padding: '8px' }}>{forecast.date}</td>
                                                        <td style={{ padding: '8px' }}>{forecast.temperatureC}</td>
                                                        <td style={{ padding: '8px' }}>{forecast.temperatureF}</td>
                                                        <td style={{ padding: '8px' }}>{forecast.summary}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <Typography>No data available</Typography>
                                    )}
                                </Paper>
                            </>
                        )}
                    </Container>
                </Box>
            </Box>

            {/* Offline notification */}
            <Snackbar
                open={showOfflineMessage}
                autoHideDuration={6000}
                onClose={() => setShowOfflineMessage(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowOfflineMessage(false)}
                    severity="warning"
                    sx={{ width: '100%' }}
                    icon={<WifiOffIcon />}
                >
                    You're offline. Some features may be unavailable.
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
}

export default App;