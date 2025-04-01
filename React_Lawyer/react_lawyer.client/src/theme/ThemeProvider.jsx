// src/theme/ThemeProvider.jsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';

// Create context for theme mode
const ThemeContext = createContext({
    mode: 'light',
    toggleMode: () => { },
    isMobile: false,
    isTablet: false,
    isDesktop: false
});

// Custom hook to use theme context
export const useThemeMode = () => useContext(ThemeContext);

// Define color palettes for light and dark modes
const getDesignTokens = (mode) => ({
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
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
            fontSize: '2.5rem',
            '@media (max-width:600px)': {
                fontSize: '2rem',
            },
        },
        h2: {
            fontWeight: 600,
            fontSize: '2rem',
            '@media (max-width:600px)': {
                fontSize: '1.75rem',
            },
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
            '@media (max-width:600px)': {
                fontSize: '1.5rem',
            },
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
            '@media (max-width:600px)': {
                fontSize: '1.25rem',
            },
        },
        h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
            '@media (max-width:600px)': {
                fontSize: '1.1rem',
            },
        },
        h6: {
            fontWeight: 500,
            fontSize: '1.1rem',
            '@media (max-width:600px)': {
                fontSize: '1rem',
            },
        },
        subtitle1: {
            fontWeight: 500,
        },
        button: {
            fontWeight: 500,
            textTransform: 'none',
        },
        body1: {
            '@media (max-width:600px)': {
                fontSize: '0.95rem',
            },
        },
        body2: {
            '@media (max-width:600px)': {
                fontSize: '0.875rem',
            },
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
                    '@media (max-width:600px)': {
                        padding: '6px 12px',
                        fontSize: '0.8125rem',
                    },
                },
                // Make buttons more compact on mobile
                sizeSmall: {
                    '@media (max-width:600px)': {
                        padding: '4px 8px',
                        fontSize: '0.75rem',
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
                root: {
                    '@media (max-width:600px)': {
                        padding: '12px',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    '@media (max-width:600px)': {
                        padding: '8px 6px',
                    },
                },
                head: {
                    fontWeight: 'bold',
                },
            },
        },
        MuiList: {
            styleOverrides: {
                root: {
                    '@media (max-width:600px)': {
                        padding: '4px 0',
                    },
                },
            },
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    '@media (max-width:600px)': {
                        paddingTop: '6px',
                        paddingBottom: '6px',
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    width: 240,
                    '@media (max-width:600px)': {
                        width: '80%',
                        maxWidth: 280,
                    },
                },
            },
        },
        MuiContainer: {
            styleOverrides: {
                root: {
                    '@media (max-width:600px)': {
                        padding: '0 12px',
                    },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    '@media (max-width:600px)': {
                        minWidth: 'auto',
                        padding: '6px 8px',
                        fontSize: '0.75rem',
                    },
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

    // Use media queries to detect device size
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(min-width:601px) and (max-width:959px)');
    const isDesktop = useMediaQuery('(min-width:960px)');

    // Toggle between light and dark mode
    const toggleMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    // Create theme object and make it responsive
    const theme = useMemo(() => {
        const baseTheme = createTheme(getDesignTokens(mode));
        return responsiveFontSizes(baseTheme);
    }, [mode]);

    // Context value including device size information
    const themeContextValue = useMemo(() => ({
        mode,
        toggleMode,
        isMobile,
        isTablet,
        isDesktop
    }), [mode, isMobile, isTablet, isDesktop]);

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