// src/contexts/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

// Create the theme context
const ThemeContext = createContext(null);

// Theme options
export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

// Custom hook to use the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Get saved theme preference or default to system
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || THEMES.SYSTEM;
    });

    // Track if dark mode is active (used for conditional styling)
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Apply theme changes to HTML element and localStorage
    useEffect(() => {
        const html = document.documentElement;

        // Save theme preference
        localStorage.setItem('theme', theme);

        // Remove any previous theme classes
        html.classList.remove('light', 'dark');

        // Apply appropriate theme
        if (theme === THEMES.SYSTEM) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.classList.add(prefersDark ? 'dark' : 'light');
            setIsDarkMode(prefersDark);
        } else {
            html.classList.add(theme);
            setIsDarkMode(theme === THEMES.DARK);
        }
    }, [theme]);

    // Listen for system theme changes if using system theme
    useEffect(() => {
        if (theme !== THEMES.SYSTEM) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(e.matches ? 'dark' : 'light');
            setIsDarkMode(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Toggle between light and dark
    const toggleTheme = () => {
        setTheme(prevTheme => {
            if (prevTheme === THEMES.LIGHT) return THEMES.DARK;
            if (prevTheme === THEMES.DARK) return THEMES.LIGHT;
            return prevTheme === THEMES.SYSTEM
                ? (isDarkMode ? THEMES.LIGHT : THEMES.DARK)
                : prevTheme;
        });
    };

    // Set a specific theme
    const setThemeMode = (newTheme) => {
        if (Object.values(THEMES).includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;