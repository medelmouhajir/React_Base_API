// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Auth Provider
import { AuthProvider } from './features/auth/AuthContext';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';

import NotificationProvider from './features/notifications/NotificationContext';
// Theme Provider
import ThemeProvider from './theme/ThemeProvider';

// Routes
import AppRoutes from './routes/Routes';

// Service Worker Registration
import { registerServiceWorker } from './sw-register';

// Register service worker for PWA functionality
registerServiceWorker();

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <NotificationProvider>
                        <React.Suspense
                            fallback={
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                                     <CircularProgress />
                                </Box>
                            }
                        >
                            <AppRoutes />
                        </React.Suspense>
                    </NotificationProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;