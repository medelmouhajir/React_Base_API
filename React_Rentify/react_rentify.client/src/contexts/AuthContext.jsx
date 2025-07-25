import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on app start
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Add a small delay to ensure all components are loaded
                await new Promise(resolve => setTimeout(resolve, 100));

                // Check for normal token
                const token = localStorage.getItem('authToken');
                if (token) {
                    // Verify token and get user info
                    const userData = await authService.getCurrentUser();
                    setUser(userData);
                }

                // Check URL for tokens from Google auth redirect
                const urlParams = new URLSearchParams(window.location.search);
                const googleToken = urlParams.get('token');
                const expiresAt = urlParams.get('expiresAt');

                if (googleToken && expiresAt) {
                    // Decode the token if it was URL encoded
                    const decodedToken = decodeURIComponent(googleToken);

                    // Store the token
                    localStorage.setItem('authToken', decodedToken);
                    localStorage.setItem('tokenExpiry', expiresAt);

                    // Clean the URL
                    window.history.replaceState({}, document.title, window.location.pathname);

                    // Get user info using the token
                    const userData = await authService.getCurrentUser();
                    setUser(userData);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Clear invalid tokens
                localStorage.removeItem('authToken');
                localStorage.removeItem('tokenExpiry');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);


    // Add a method for Google authentication
    const loginWithGoogle = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5229';
        const redirectUri = encodeURIComponent(window.location.origin);

        // Redirect to backend endpoint that starts Google OAuth flow
        window.location.href = `${apiUrl}/api/GoogleAuth/signin?returnUrl=${redirectUri}`;
    };


    // Auto-refresh token when it's about to expire
    useEffect(() => {
        if (!user) return;

        const checkTokenExpiry = () => {
            const tokenExpiry = localStorage.getItem('tokenExpiry');
            if (tokenExpiry) {
                const expiryTime = new Date(tokenExpiry);
                const now = new Date();
                const timeUntilExpiry = expiryTime.getTime() - now.getTime();

                // Refresh token 5 minutes before expiry
                if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
                    refreshToken();
                }
            }
        };

        const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [user]);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);

            const response = await authService.login(email, password);

            // Store token and user data
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('tokenExpiry', response.expiresAt);
            setUser(response.user);

            return { success: true, user: response.user };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await authService.register(userData);

            // Store token and user data
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('tokenExpiry', response.expiresAt);
            setUser(response.user);

            return { success: true, user: response.user };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and state regardless of API call success
            localStorage.removeItem('authToken');
            localStorage.removeItem('tokenExpiry');
            setUser(null);
            setError(null);
        }
    };

    const refreshToken = async () => {
        try {
            const response = await authService.refreshToken();
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('tokenExpiry', response.expiresAt);
            setUser(response.user);
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            await logout();
            return false;
        }
    };

    const updateProfile = async (profileData) => {
        try {
            setLoading(true);
            setError(null);
            console.log(profileData);
            const updatedUser = await authService.updateProfile(profileData);
            setUser(updatedUser);

            return { success: true, user: updatedUser };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (passwordData) => {
        try {
            setLoading(true);
            setError(null);

            await authService.changePassword(passwordData);

            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for role checking
    const hasRole = (role) => {
        return user?.role === role;
    };

    const hasAnyRole = (roles) => {
        return user && roles.includes(user.role);
    };

    const isAdmin = () => hasRole('Admin');
    const isManager = () => hasRole('Manager');
    const isUser = () => hasRole('User');
    const isManagerOrAdmin = () => hasAnyRole(['Manager', 'Admin']);

    const value = {
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshToken,
        updateProfile,
        changePassword,
        hasRole,
        hasAnyRole,
        isAdmin,
        isManager,
        isUser,
        isManagerOrAdmin,
        clearError: () => setError(null)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};