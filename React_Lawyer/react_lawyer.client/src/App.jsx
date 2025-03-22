// src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    CircularProgress,
    Box,
    Snackbar,
    Alert
} from '@mui/material';
import {
    WifiOff as WifiOffIcon
} from '@mui/icons-material';

// Hooks
import useOnlineStatus from './hooks/useOnlineStatus';

// Auth
import { useAuth } from './features/auth/AuthContext';
import ProtectedRoute from './features/auth/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';
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

function App() {
    const { isAuthenticated, loading, user } = useAuth();
    const isOnline = useOnlineStatus();
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Show offline notification when going offline
    useEffect(() => {
        if (!isOnline) {
            setShowOfflineMessage(true);
        }
    }, [isOnline]);

    // Check if user is authenticated and redirect accordingly
    useEffect(() => {
        // Skip during initial loading
        if (loading) return;

        // If on login page and already authenticated, redirect to dashboard
        if (location.pathname === '/login' && isAuthenticated()) {
            navigate('/');
        }
    }, [loading, isAuthenticated, navigate, location.pathname]);

    // If completely offline and not authenticated, show offline page
    if (!isOnline && !isAuthenticated() && !loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <OfflinePage />
            </ThemeProvider>
        );
    }

    // Show loading spinner during auth initialization
    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected routes that require authentication */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<DashboardPage />} />

                    {/* Routes requiring Admin role */}
                    <Route element={<ProtectedRoute requiredRole="Admin" />}>
                        <Route path="/admin/*" element={<div>Admin Section</div>} />
                    </Route>

                    {/* Routes requiring Lawyer role */}
                    <Route element={<ProtectedRoute requiredRole={["Lawyer", "Admin"]} />}>
                        <Route path="/cases/*" element={<div>Cases Section</div>} />
                    </Route>

                    {/* Add more routes as needed */}
                </Route>

                {/* Fallback route for 404 */}
                <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>

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