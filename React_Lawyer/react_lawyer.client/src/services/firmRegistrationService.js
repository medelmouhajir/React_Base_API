// src/services/firmRegistrationService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling law firm registration and related API calls
 */
class FirmRegistrationService {
    /**
     * Register a new law firm with admin and optional staff
     * @param {Object} registrationData - Complete registration data including firm info, admin account, and optional staff
     * @returns {Promise<Object>} Promise resolving to the created law firm
     */
    async registerFirm(registrationData) {
        try {
            const response = await fetch(`${API_URL}/api/registration/firm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to register law firm');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in registerFirm:', error);
            throw error;
        }
    }

    /**
     * Validate if a username is available
     * @param {string} username - The username to check
     * @returns {Promise<boolean>} Promise resolving to true if username is available
     */
    async checkUsernameAvailability(username) {
        try {
            const response = await fetch(`${API_URL}/api/registration/checkUsername?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to check username availability');
            }

            const data = await response.json();
            return data.isAvailable;
        } catch (error) {
            console.error('Error checking username availability:', error);
            throw error;
        }
    }

    /**
     * Validate if an email is available
     * @param {string} email - The email to check
     * @returns {Promise<boolean>} Promise resolving to true if email is available
     */
    async checkEmailAvailability(email) {
        try {
            const response = await fetch(`${API_URL}/api/registration/checkEmail?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to check email availability');
            }

            const data = await response.json();
            return data.isAvailable;
        } catch (error) {
            console.error('Error checking email availability:', error);
            throw error;
        }
    }

    /**
     * Get available subscription plans
     * @returns {Promise<Array>} Promise resolving to an array of available plans
     */
    async getSubscriptionPlans() {
        try {
            const response = await fetch(`${API_URL}/api/registration/subscriptionPlans`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch subscription plans');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching subscription plans:', error);
            throw error;
        }
    }
}

export default new FirmRegistrationService();