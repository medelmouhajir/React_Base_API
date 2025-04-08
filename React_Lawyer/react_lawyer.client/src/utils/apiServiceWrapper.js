// src/utils/apiServiceWrapper.js
import authService from '../services/authService';

/**
 * Wraps API service fetch calls with authentication and token refresh handling
 * @param {Function} fetchFunction - Original fetch function from service
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @returns {Promise} Wrapped promise with token refresh handling
 */
export const wrapApiCall = async (fetchFunction, url, options = {}) => {
    try {
        // First attempt with current token
        const response = await fetchFunction(url, options);

        // Check if response indicates authentication error
        if (response.status === 401) {
            // Try to refresh the token
            try {
                await authService.refreshToken();

                // Retry the original request with new token
                const retryOptions = { ...options };
                if (retryOptions.headers) {
                    const user = authService.getCurrentUser();
                    if (user && user.token) {
                        retryOptions.headers['Authorization'] = `Bearer ${user.token}`;
                    }
                }

                return await fetchFunction(url, retryOptions);
            } catch (refreshError) {
                // If refresh fails, throw authentication error
                console.error('Token refresh failed:', refreshError);

                // If the refresh failed due to invalid refresh token, logout user
                authService.logout();

                // Propagate the original 401 error
                throw new Error('Authentication failed. Please login again.');
            }
        }

        return response;
    } catch (error) {
        // For network errors or other issues
        console.error(`API call error: ${url}`, error);
        throw error;
    }
};

/**
 * Creates a wrapped version of an API service that automatically handles token refresh
 * @param {Object} service - Original API service
 * @returns {Object} Wrapped service with token refresh handling
 */
export const createAuthWrappedService = (service) => {
    const wrappedService = {};

    // Get all methods from the original service
    Object.getOwnPropertyNames(Object.getPrototypeOf(service))
        .filter(method => method !== 'constructor')
        .forEach(methodName => {
            const originalMethod = service[methodName];

            // If it's a function and likely an API call (not a utility method)
            if (typeof originalMethod === 'function' && !methodName.startsWith('get') && !methodName.toLowerCase().includes('header')) {
                wrappedService[methodName] = async (...args) => {
                    // Use the authService.fetchWithAuth for API calls
                    return authService.fetchWithAuth(...args)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`API error: ${response.status}`);
                            }
                            return response.json();
                        });
                };
            } else {
                // For utility methods, just pass through
                wrappedService[methodName] = originalMethod.bind(service);
            }
        });

    return wrappedService;
};

export default {
    wrapApiCall,
    createAuthWrappedService
};