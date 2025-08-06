import apiClient from './apiClient';



export const authService = {
    // Login user
    async login(email, password) {
        try {
            console.log('🔐 Attempting login for:', email);
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });
            console.log('✅ Login successful:', response.data);
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
                firstName: userData.firstName,
                lastName: userData.lastName,
                phoneNumber: userData.phoneNumber,
                role: userData.role || 'User',
            });
            console.log('✅ Registration successful:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Registration failed:', error);
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

    // Refresh token
    async refreshToken() {
        try {
            const response = await apiClient.post('/auth/refresh-token');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Logout user
    async logout() {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            // Don't throw error for logout, just log it
            console.error('❌ Logout API call failed:', error);
        }
    },

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await apiClient.put('/auth/profile', {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                phoneNumber: profileData.phoneNumber,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Change password
    async changePassword(passwordData) {
        try {
            const response = await apiClient.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // Helper method to handle and format errors
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.message ||
                error.response.data?.title ||
                `Server error: ${error.response.status}`;

            // Handle validation errors
            if (error.response.data?.errors) {
                const validationErrors = Object.values(error.response.data.errors)
                    .flat()
                    .join(', ');
                return new Error(validationErrors);
            }

            return new Error(message);
        } else if (error.request) {
            // Network error
            return new Error('Network error. Please check your connection and ensure the API server is running.');
        } else {
            // Other error
            return new Error(error.message || 'An unexpected error occurred.');
        }
    },

    // Utility method to check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const expiry = localStorage.getItem('tokenExpiry');

        if (!token || !expiry) {
            return false;
        }

        const expiryDate = new Date(expiry);
        const now = new Date();

        return expiryDate > now;
    },

    // Get stored token
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
    },

    // Test API connectivity
    async testConnection() {
        try {
            console.log('🔍 Testing API connection to:', `${API_BASE_URL}/api`);
            const response = await fetch(`${API_BASE_URL}/weatherforecast`);
            console.log('✅ API connection test result:', response.status);
            return response.ok;
        } catch (error) {
            console.error('❌ API connection test failed:', error);
            return false;
        }
    }
};

export default authService;