import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023';
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach token and handle multipart form data
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle FormData content type automatically
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };

        // Log request details in development
        if (import.meta.env.DEV) {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
                data: config.data instanceof FormData ? 'FormData' : config.data,
                headers: config.headers
            });
        }

        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401, token refresh, and error formatting
apiClient.interceptors.response.use(
    (response) => {
        // Log response details in development
        if (import.meta.env.DEV) {
            const duration = new Date() - response.config.metadata?.startTime;
            console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                duration: `${duration}ms`,
                data: response.data
            });
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Log error details in development
        if (import.meta.env.DEV) {
            const duration = new Date() - originalRequest?.metadata?.startTime;
            console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
                status: error.response?.status,
                duration: `${duration}ms`,
                message: error.response?.data?.message || error.message,
                data: error.response?.data
            });
        }

        // Handle 401 Unauthorized - Attempt token refresh
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            localStorage.getItem('authToken')
        ) {
            originalRequest._retry = true;

            try {
                console.log('🔄 Attempting token refresh...');
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh-token`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                        },
                        timeout: API_TIMEOUT
                    }
                );

                const { token: newToken, expiresAt } = refreshResponse.data;
                localStorage.setItem('authToken', newToken);
                localStorage.setItem('tokenExpiry', expiresAt);
                
                // Update the authorization header for the failed request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                console.log('✅ Token refreshed successfully');
                return apiClient(originalRequest);
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);
                
                // Clear auth data and redirect to login
                localStorage.removeItem('authToken');
                localStorage.removeItem('tokenExpiry');
                
                // Only redirect if we're in a browser environment
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                
                return Promise.reject(refreshError);
            }
        }

        // Handle network errors
        if (!error.response) {
            const networkError = new Error('Network error. Please check your internet connection and ensure the API server is running.');
            networkError.isNetworkError = true;
            return Promise.reject(networkError);
        }

        // Handle server errors with enhanced error information
        const enhancedError = new Error(
            error.response.data?.message || 
            error.response.data?.title || 
            `HTTP ${error.response.status}: ${error.response.statusText}`
        );
        
        // Attach additional error details
        enhancedError.status = error.response.status;
        enhancedError.statusText = error.response.statusText;
        enhancedError.data = error.response.data;
        enhancedError.isServerError = true;
        
        // Handle validation errors
        if (error.response.data?.errors) {
            enhancedError.validationErrors = error.response.data.errors;
            enhancedError.message = Object.values(error.response.data.errors)
                .flat()
                .join(', ');
        }

        return Promise.reject(enhancedError);
    }
);

// Utility functions for common API operations
export const apiUtils = {
    // Check API connectivity
    async testConnection() {
        try {
            console.log('🔍 Testing API connection to:', `${API_BASE_URL}/api`);
            const response = await fetch(`${API_BASE_URL}/api/health`, {
                method: 'GET',
                timeout: 5000
            });
            console.log('✅ API connection test result:', response.status);
            return response.ok;
        } catch (error) {
            console.error('❌ API connection test failed:', error);
            return false;
        }
    },

    // Create FormData from object
    createFormData(data) {
        const formData = new FormData();
        
        Object.keys(data).forEach(key => {
            const value = data[key];
            
            if (value !== null && value !== undefined) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else if (typeof value === 'object' && !(value instanceof Date)) {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value.toString());
                }
            }
        });
        
        return formData;
    },

    // Format error for display
    formatError(error) {
        if (error.isNetworkError) {
            return 'Unable to connect to the server. Please check your internet connection.';
        }
        
        if (error.validationErrors) {
            return `Validation failed: ${error.message}`;
        }
        
        if (error.status >= 500) {
            return 'Server error occurred. Please try again later.';
        }
        
        if (error.status === 404) {
            return 'The requested resource was not found.';
        }
        
        if (error.status === 403) {
            return 'You do not have permission to perform this action.';
        }
        
        return error.message || 'An unexpected error occurred.';
    },

    // Check if token is expired
    isTokenExpired() {
        const token = localStorage.getItem('authToken');
        const expiry = localStorage.getItem('tokenExpiry');

        if (!token || !expiry) {
            return true;
        }

        const expiryDate = new Date(expiry);
        const now = new Date();

        return expiryDate <= now;
    },

    // Get API base URL
    getBaseUrl() {
        return API_BASE_URL;
    },

    // Get API URL with endpoint
    getUrl(endpoint) {
        return `${API_BASE_URL}/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }
};

// Enhanced request methods with better error handling
export const apiMethods = {
    // GET request with query parameters
    async get(url, params = {}, config = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return apiClient.get(fullUrl, config);
    },

    // POST request with automatic FormData handling
    async post(url, data = {}, config = {}) {
        return apiClient.post(url, data, config);
    },

    // PUT request with automatic FormData handling
    async put(url, data = {}, config = {}) {
        return apiClient.put(url, data, config);
    },

    // PATCH request
    async patch(url, data = {}, config = {}) {
        return apiClient.patch(url, data, config);
    },

    // DELETE request
    async delete(url, config = {}) {
        return apiClient.delete(url, config);
    },

    // Upload file with progress tracking
    async uploadFile(url, file, additionalData = {}, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        };

        if (onProgress) {
            config.onUploadProgress = (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted);
            };
        }

        return apiClient.post(url, formData, config);
    }
};

export default apiClient;