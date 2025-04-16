// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Auth Provider
import { AuthProvider } from './features/auth/AuthContext';

import { I18nextProvider, useTranslation } from 'react-i18next';
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

    const { i18n } = useTranslation();

    // Effect to ensure correct direction on app load
    useEffect(() => {
        // Set the direction based on current language
        document.documentElement.dir = i18n.dir();
        document.documentElement.lang = i18n.language;

        // Add RTL class if needed
        if (i18n.dir() === 'rtl') {
            document.body.classList.add('rtl');
            document.body.classList.remove('ltr');
        } else {
            document.body.classList.add('ltr');
            document.body.classList.remove('rtl');
        }
    }, [i18n.language]);

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