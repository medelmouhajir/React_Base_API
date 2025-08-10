import apiClient, { apiUtils } from './apiClient';

// Auth service for Virtuello application
export const authService = {
    // =============================================================================
    // AUTHENTICATION METHODS
    // =============================================================================

    // Login user
    async login(email, password) {
        try {
            console.log('🔐 Attempting login for:', email);
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });
            
            console.log('✅ Login successful:', response.data);
            
            // Store authentication data
            if (response.data.token) {
                this.storeAuthData(response.data);
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Login failed:', error);
            throw this.handleError(error);
        }
    },

    // Register new user
    async register(userData) {
        try {
            console.log('📝 Attempting registration for:', userData.email);
            const response = await apiClient.post('/auth/register', {
                email: userData.email,
                password: userData.password,
                fullName: userData.fullName,
                phoneNumber: userData.phoneNumber,
                role: userData.role || 'User',
            });
            
            console.log('✅ Registration successful:', response.data);
            
            // Store authentication data
            if (response.data.token) {
                this.storeAuthData(response.data);
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Registration failed:', error);
            throw this.handleError(error);
        }
    },

    // Login with Google (OAuth)
    async loginWithGoogle(googleToken) {
        try {
            console.log('🔐 Attempting Google login');
            const response = await apiClient.post('/auth/google-login', {
                token: googleToken,
            });
            
            console.log('✅ Google login successful:', response.data);
            
            // Store authentication data
            if (response.data.token) {
                this.storeAuthData(response.data);
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Google login failed:', error);
            throw this.handleError(error);
        }
    },

    // Get current user info
    async getCurrentUser() {
        try {
            const response = await apiClient.get('/auth/me');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Refresh authentication token
    async refreshToken() {
        try {
            console.log('🔄 Refreshing authentication token');
            const response = await apiClient.post('/auth/refresh-token');
            
            if (response.data.token) {
                this.storeAuthData(response.data);
                console.log('✅ Token refresh successful');
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            this.clearAuth();
            throw this.handleError(error);
        }
    },

    // Logout user
    async logout() {
        try {
            console.log('👋 Logging out user');
            await apiClient.post('/auth/logout');
        } catch (error) {
            // Don't throw error for logout API call failure, just log it
            console.error('❌ Logout API call failed:', error);
        } finally {
            // Always clear local auth data regardless of API call result
            this.clearAuth();
            console.log('✅ Local auth data cleared');
        }
    },

    // =============================================================================
    // PROFILE MANAGEMENT
    // =============================================================================

    // Update user profile
    async updateProfile(profileData) {
        try {
            console.log('👤 Updating user profile');
            const response = await apiClient.put('/auth/profile', {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                phoneNumber: profileData.phoneNumber,
            });
            
            console.log('✅ Profile update successful');
            return response.data;
        } catch (error) {
            console.error('❌ Profile update failed:', error);
            throw this.handleError(error);
        }
    },

    // Change user password
    async changePassword(passwordData) {
        try {
            console.log('🔒 Changing user password');
            const response = await apiClient.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            
            console.log('✅ Password change successful');
            return response.data;
        } catch (error) {
            console.error('❌ Password change failed:', error);
            throw this.handleError(error);
        }
    },

    // =============================================================================
    // PASSWORD RESET (if implemented in API)
    // =============================================================================

    // Request password reset
    async requestPasswordReset(email) {
        try {
            console.log('📧 Requesting password reset for:', email);
            const response = await apiClient.post('/auth/forgot-password', {
                email,
            });
            
            console.log('✅ Password reset request sent');
            return response.data;
        } catch (error) {
            console.error('❌ Password reset request failed:', error);
            throw this.handleError(error);
        }
    },

    // Reset password with token
    async resetPassword(token, newPassword) {
        try {
            console.log('🔑 Resetting password with token');
            const response = await apiClient.post('/auth/reset-password', {
                token,
                newPassword,
            });
            
            console.log('✅ Password reset successful');
            return response.data;
        } catch (error) {
            console.error('❌ Password reset failed:', error);
            throw this.handleError(error);
        }
    },

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    // Store authentication data in localStorage
    storeAuthData(authData) {
        if (authData.token) {
            localStorage.setItem('authToken', authData.token);
        }
        if (authData.expiresAt) {
            localStorage.setItem('tokenExpiry', authData.expiresAt);
        }
        if (authData.user) {
            localStorage.setItem('currentUser', JSON.stringify(authData.user));
        }
    },

    // Clear authentication data from localStorage
    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('currentUser');
    },

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const expiry = localStorage.getItem('tokenExpiry');

        if (!token || !expiry) {
            return false;
        }

        const expiryDate = new Date(expiry);
        const now = new Date();

        // Add 5-minute buffer for token refresh
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        return expiryDate.getTime() - now.getTime() > bufferTime;
    },

    // Check if token is expired (without buffer)
    isTokenExpired() {
        return apiUtils.isTokenExpired();
    },

    // Get stored authentication token
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Get stored user data
    getCurrentUserFromStorage() {
        try {
            const userJson = localStorage.getItem('currentUser');
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error('❌ Error parsing stored user data:', error);
            return null;
        }
    },

    // =============================================================================
    // ROLE-BASED ACCESS CONTROL
    // =============================================================================

    // Check if user has specific role
    hasRole(role) {
        const user = this.getCurrentUserFromStorage();
        return user?.role === role;
    },

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        const user = this.getCurrentUserFromStorage();
        return user && roles.includes(user.role);
    },

    // Role-specific checks
    isAdmin() {
        return this.hasRole('Admin');
    },

    isManager() {
        return this.hasRole('Manager');
    },

    isUser() {
        return this.hasRole('User');
    },

    isManagerOrAdmin() {
        return this.hasAnyRole(['Manager', 'Admin']);
    },

    // Check if user can perform action (basic permission check)
    canPerformAction(action, resource) {
        const user = this.getCurrentUserFromStorage();
        
        if (!user) return false;
        
        // Admin can do everything
        if (user.role === 'Admin') return true;
        
        // Manager can do most things except system-level actions
        if (user.role === 'Manager') {
            const adminOnlyActions = ['manage-users', 'system-settings'];
            return !adminOnlyActions.includes(action);
        }
        
        // Regular users can only perform basic actions on their own resources
        if (user.role === 'User') {
            const userActions = ['view', 'create-own', 'edit-own', 'delete-own'];
            return userActions.includes(action);
        }
        
        return false;
    },

    // =============================================================================
    // ERROR HANDLING
    // =============================================================================

    // Enhanced error handling method
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const statusCode = error.response.status;
            const errorData = error.response.data;
            
            let message = errorData?.message || 
                         errorData?.title || 
                         `Server error: ${statusCode}`;

            // Handle specific status codes
            switch (statusCode) {
                case 400:
                    message = errorData?.message || 'Invalid request data';
                    break;
                case 401:
                    message = 'Invalid credentials or session expired';
                    this.clearAuth(); // Clear invalid auth data
                    break;
                case 403:
                    message = 'You do not have permission to perform this action';
                    break;
                case 404:
                    message = 'The requested resource was not found';
                    break;
                case 422:
                    message = 'Validation failed';
                    break;
                case 429:
                    message = 'Too many requests. Please try again later';
                    break;
                case 500:
                    message = 'Internal server error. Please try again later';
                    break;
            }

            // Handle validation errors
            if (errorData?.errors && typeof errorData.errors === 'object') {
                const validationErrors = Object.values(errorData.errors)
                    .flat()
                    .join(', ');
                message = validationErrors || message;
            }

            const authError = new Error(message);
            authError.status = statusCode;
            authError.data = errorData;
            return authError;
            
        } else if (error.request) {
            // Network error
            return new Error('Network error. Please check your connection and ensure the API server is running.');
        } else {
            // Other error
            return new Error(error.message || 'An unexpected error occurred.');
        }
    },

    // =============================================================================
    // DIAGNOSTICS AND TESTING
    // =============================================================================

    // Test API connectivity
    async testConnection() {
        return apiUtils.testConnection();
    },

    // Get authentication status summary
    getAuthStatus() {
        const token = this.getToken();
        const user = this.getCurrentUserFromStorage();
        const isAuthenticated = this.isAuthenticated();
        const isExpired = this.isTokenExpired();
        
        return {
            hasToken: !!token,
            hasUser: !!user,
            isAuthenticated,
            isExpired,
            user: user ? {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            } : null,
            tokenExpiry: localStorage.getItem('tokenExpiry')
        };
    },

    // Log current auth status (for debugging)
    logAuthStatus() {
        const status = this.getAuthStatus();
        console.log('🔍 Authentication Status:', status);
        return status;
    }
};

export default authService;