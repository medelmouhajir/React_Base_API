// src/theme/ThemeProvider.jsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Create context for theme mode
const ThemeContext = createContext({
    mode: 'light',
    toggleMode: () => { },
});

// Custom hook to use theme context
export const useThemeMode = () => useContext(ThemeContext);

// Define color palettes for light and dark modes
const getDesignTokens = (mode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Light mode palette
                primary: {
                    main: '#1a237e', // Deep blue
                    light: '#534bae',
                    dark: '#000051',
                    contrastText: '#ffffff',
                },
                secondary: {
                    main: '#6a1b9a', // Purple
                    light: '#9c4dcc',
                    dark: '#38006b',
                    contrastText: '#ffffff',
                },
                background: {
                    default: '#f5f5f5',
                    paper: '#ffffff',
                },
                text: {
                    primary: '#212121',
                    secondary: '#757575',
                },
            }
            : {
                // Dark mode palette
                primary: {
                    main: '#5c6bc0', // Lighter indigo for dark mode
                    light: '#8e99f3',
                    dark: '#26418f',
                    contrastText: '#ffffff',
                },
                secondary: {
                    main: '#ba68c8', // Lighter purple for dark mode
                    light: '#ee98fb',
                    dark: '#883997',
                    contrastText: '#ffffff',
                },
                background: {
                    default: '#121212',
                    paper: '#1e1e1e',
                },
                text: {
                    primary: '#e0e0e0',
                    secondary: '#aaaaaa',
                },
            }),
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 600,
        },
        h3: {
            fontWeight: 600,
        },
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 500,
        },
        h6: {
            fontWeight: 500,
        },
        subtitle1: {
            fontWeight: 500,
        },
        button: {
            fontWeight: 500,
            textTransform: 'none',
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 8,
                },
            },
        },
    },
});

export const ThemeProvider = ({ children }) => {
    // Get mode from localStorage or default to light
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'light';
    });

    // Toggle between light and dark mode
    const toggleMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    // Create theme object
    const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

    // Context value
    const themeContextValue = useMemo(() => ({
        mode,
        toggleMode,
    }), [mode]);

    return (
        <ThemeContext.Provider value={themeContextValue}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;