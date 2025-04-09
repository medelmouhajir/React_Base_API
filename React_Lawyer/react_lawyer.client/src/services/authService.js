// src/services/authService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling authentication-related API calls with enhanced token refresh
 */
class AuthService {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
        this.refreshSubscribers = [];
    }

    /**
     * Process requests in failed queue after token refresh
     * @param {string} token - New access token
     */
    processQueue(token) {
        this.refreshSubscribers.forEach(callback => callback(token));
        this.refreshSubscribers = [];
    }

    /**
     * Add failed request to queue
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function 
     */
    addToQueue(resolve, reject) {
        this.refreshSubscribers.push(token => {
            resolve(token);
        });
    }

    /**
     * Attempts to log in a user
     * @param {string} username - The user's username
     * @param {string} password - The user's password
     * @returns {Promise} Promise object with auth response or error
     */
    async login(username, password) {
        try {
            console.log(`${API_URL}/api/auth/login`);
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
                const userData = {
                    id: data.userId,
                    username: data.username,
                    name: data.firstName + ' ' + data.lastName,
                    email: data.email,
                    role: data.role,
                    roleId: data.roleId,
                    lawFirmId: data.lawFirmId,
                    token: data.token,
                    refreshToken: data.refreshToken,
                    tokenExpiration: new Date(new Date().getTime() + data.expiresIn * 1000).getTime()
                };
                localStorage.setItem('user', JSON.stringify(userData));

                // Setup token refresh timer
                this.setupRefreshTimer(userData);
            }

            return data;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    /**
     * Setup timer to refresh token before it expires
     * @param {Object} userData - User data including token expiration time
     */
    setupRefreshTimer(userData) {
        if (!userData || !userData.tokenExpiration) return;

        // Clear any existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const currentTime = new Date().getTime();
        const timeUntilExpiry = userData.tokenExpiration - currentTime;

        // Refresh 1 minute before expiration
        const refreshTime = Math.max(timeUntilExpiry - 60000, 0);

        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(() => {
                this.refreshToken()
                    .catch(error => {
                        console.error("Auto token refresh failed:", error);
                        // Consider handling this failure (maybe redirect to login)
                    });
            }, refreshTime);
        }
    }

    /**
     * Logs out the current user by removing auth data
     */
    logout() {
        localStorage.removeItem('user');

        // Clear refresh timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        // Call logout endpoint to invalidate the refresh token
        return fetch(`${API_URL}/api/auth/logout`, {
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
            console.log(userData);

            const response = await fetch(`${API_URL}/api/auth/register`, {
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

        // If already refreshing, wait for the current refresh to complete
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.addToQueue(resolve, reject);
            });
        }

        this.isRefreshing = true;

        try {
            const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
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
            const updatedUser = {
                ...user,
                token: data.token,
                refreshToken: data.refreshToken,
                tokenExpiration: new Date(new Date().getTime() + data.expiresIn * 1000).getTime()
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Setup new refresh timer
            this.setupRefreshTimer(updatedUser);

            // Process any requests that were waiting for the refresh
            this.processQueue(data.token);

            this.isRefreshing = false;
            return data;
        } catch (error) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            console.error("Token refresh error:", error);
            throw error;
        }
    }

    /**
     * Performs an authenticated API fetch with automatic token refresh
     * @param {string} url - API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise} Response promise
     */
    async fetchWithAuth(url, options = {}) {
        const user = this.getCurrentUser();

        // If no user or no token, proceed without auth
        if (!user || !user.token) {
            return fetch(url, options);
        }

        // Check if token is expired or close to expiration (less than 30 seconds)
        const isExpired = user.tokenExpiration < new Date().getTime();
        const isCloseToExpiry = user.tokenExpiration - new Date().getTime() < 30000;

        // If token is expired or close to expiry, refresh it first
        if (isExpired || isCloseToExpiry) {
            try {
                await this.refreshToken();
                // Get updated user after refresh
                const updatedUser = this.getCurrentUser();
                if (!updatedUser) throw new Error('User not authenticated after token refresh');

                // Update Authorization header with new token
                const headers = options.headers || {};
                return fetch(url, {
                    ...options,
                    headers: {
                        ...headers,
                        'Authorization': 'Bearer ' + updatedUser.token
                    }
                });
            } catch (error) {
                // If refresh fails and the original request requires auth, throw error
                if (url.includes('/api/')) {
                    throw error;
                }
                // Otherwise proceed with the original request
                return fetch(url, options);
            }
        }

        // If token is valid, proceed with the original request
        const headers = options.headers || {};
        return fetch(url, {
            ...options,
            headers: {
                ...headers,
                'Authorization': 'Bearer ' + user.token
            }
        });
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