// src/features/auth/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../../services/authService';

// Create auth context
const AuthContext = createContext(null);

/**
 * Auth context provider component that wraps the app
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user is already logged in from localStorage
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    /**
     * Login method to authenticate user
     */
    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.login(username, password);
            setUser({
                id: response.userId,
                username: response.username,
                name: response.firstName + ' ' + response.lastName,
                email: response.email,
                role: response.role,
                lawFirmId: response.lawFirmId,
                token: response.token
            });
            return response;
        } catch (err) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout method to clear auth state
     */
    const logout = () => {
        authService.logout();
        setUser(null);
    };

    /**
     * Check if user has specified role
     */
    const hasRole = (role) => {
        return authService.hasRole(role);
    };

    /**
     * Check if user is authenticated (has valid token)
     */
    const isAuthenticated = () => {
        return authService.isAuthenticated();
    };

    // Define the context value
    const value = {
        user,
        loading,
        error,
        login,
        logout,
        hasRole,
        isAuthenticated
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook for using auth context
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;