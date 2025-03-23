// src/services/authService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling authentication-related API calls
 */
class AuthService {
    /**
     * Attempts to log in a user
     * @param {string} username - The user's username
     * @param {string} password - The user's password
     * @returns {Promise} Promise object with auth response or error
     */
    async login(username, password) {
        try {
            console.log(`${API_URL}/api/auth/Login`);
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include', // Important for cookies
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();

            // Store user data in localStorage
            if (data.token) {
                localStorage.setItem('user', JSON.stringify({
                    id: data.userId,
                    username: data.username,
                    name: data.firstName + ' ' + data.lastName,
                    email: data.email,
                    role: data.role,
                    lawFirmId: data.lawFirmId,
                    token: data.token,
                    refreshToken: data.refreshToken,
                    tokenExpiration: new Date(new Date().getTime() + data.expiresIn * 1000).getTime()
                }));
            }

            return data;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    /**
     * Logs out the current user by removing auth data
     */
    logout() {
        localStorage.removeItem('user');
        // Call logout endpoint to invalidate the refresh token
        return fetch(`${API_URL}/api/users/logout`, {
            method: 'POST',
            headers: this.authHeader(),
            credentials: 'include'
        }).catch(error => {
            console.error("Logout error:", error);
        });
    }

    /**
     * Registers a new user
     * @param {Object} userData - User registration data
     * @returns {Promise} Promise object with registration response
     */
    async register(userData) {
        try {
            const response = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    }

    /**
     * Gets the current authenticated user from local storage
     * @returns {Object|null} Current user object or null if not logged in
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        const user = JSON.parse(userStr);

        // Check if token is expired
        if (user.tokenExpiration && user.tokenExpiration < new Date().getTime()) {
            // Token expired, attempt to refresh
            this.refreshToken().catch(() => {
                // If refresh fails, log the user out
                this.logout();
                return null;
            });
        }

        return user;
    }

    /**
     * Checks if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        const user = this.getCurrentUser();
        return !!user && !!user.token;
    }

    /**
     * Gets authentication header with JWT token
     * @returns {Object} Header object with Authorization if user is logged in
     */
    authHeader() {
        const user = this.getCurrentUser();
        if (user && user.token) {
            return { 'Authorization': 'Bearer ' + user.token };
        } else {
            return {};
        }
    }

    /**
     * Refreshes the access token using refresh token
     * @returns {Promise} Promise with the new token response
     */
    async refreshToken() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.refreshToken) {
            return Promise.reject('No refresh token available');
        }

        try {
            const response = await fetch(`${API_URL}/api/users/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: user.refreshToken }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();

            // Update stored user data with new tokens
            localStorage.setItem('user', JSON.stringify({
                ...user,
                token: data.token,
                refreshToken: data.refreshToken,
                tokenExpiration: new Date(new Date().getTime() + data.expiresIn * 1000).getTime()
            }));

            return data;
        } catch (error) {
            console.error("Token refresh error:", error);
            throw error;
        }
    }

    /**
     * Checks if the current user has the required role
     * @param {string|Array} requiredRole - Role(s) to check
     * @returns {boolean} True if user has the required role
     */
    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;

        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(user.role);
        }

        return user.role === requiredRole;
    }
}

export default new AuthService();