// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Auth Provider
import { AuthProvider } from './features/auth/AuthContext';

// Theme Provider
import ThemeProvider from './theme/ThemeProvider';

// Routes
import AppRoutes from './routes/Routes';

// Service Worker Registration
//import { registerServiceWorker } from './sw-register';

// Register service worker for PWA functionality
//registerServiceWorker();

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <React.Suspense
                        fallback={
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                                <CircularProgress />
                            </Box>
                        }
                    >
                        <AppRoutes />
                    </React.Suspense>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;