// src/contexts/ThemeContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';

// Create context
export const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Initialize theme based on system preference
    useEffect(() => {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Try to get from localStorage if available, but handle errors gracefully
        try {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme) {
                setIsDarkMode(storedTheme === 'dark');
            } else {
                setIsDarkMode(prefersDark);
            }
        } catch (error) {
            // Fallback to system preference if localStorage fails
            console.warn('Could not access localStorage for theme preference', error);
            setIsDarkMode(prefersDark);
        }
    }, []);

    // Apply theme changes
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }

        // Try to save to localStorage, but don't fail if it's not available
        try {
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        } catch (error) {
            console.warn('Could not save theme preference to localStorage', error);
        }
    }, [isDarkMode]);

    // Toggle theme function
    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    // Context value
    const value = {
        isDarkMode,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook for using theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};