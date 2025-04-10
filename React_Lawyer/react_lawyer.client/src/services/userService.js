// src/services/userService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling user profile and account-related API calls
 */
class UserService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Get basic user profile information
     * @param {number} id - The user ID
     * @returns {Promise<Object>} Promise resolving to user profile object
     */
    async getUserProfile(id) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getUserProfile(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get lawyer profile information
     * @param {number} id - The lawyer ID
     * @returns {Promise<Object>} Promise resolving to lawyer profile object
     */
    async getLawyerProfile(id) {
        try {
            const response = await fetch(`${API_URL}/api/lawyers/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch lawyer profile');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getLawyerProfile(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get secretary profile information
     * @param {number} id - The secretary ID
     * @returns {Promise<Object>} Promise resolving to secretary profile object
     */
    async getSecretaryProfile(id) {
        try {
            const response = await fetch(`${API_URL}/api/secretaries/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch secretary profile');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getSecretaryProfile(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get admin profile information
     * @param {number} id - The admin ID
     * @returns {Promise<Object>} Promise resolving to admin profile object
     */
    async getAdminProfile(id) {
        try {
            const response = await fetch(`${API_URL}/api/admins/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch admin profile');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getAdminProfile(${id}):`, error);
            throw error;
        }
    }

    /**
     * Update user profile information
     * @param {number} id - The user ID
     * @param {Object} profileData - Updated profile data
     * @returns {Promise<boolean>} Promise resolving to true if update succeeded
     */
    async updateUserProfile(id, profileData) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error('Failed to update user profile');
            }

            return true;
        } catch (error) {
            console.error(`Error in updateUserProfile(${id}):`, error);
            throw error;
        }
    }

    /**
     * Change user password
     * @param {number} id - The user ID
     * @param {Object} passwordData - Password change data
     * @returns {Promise<boolean>} Promise resolving to true if change succeeded
     */
    async changePassword(id, passwordData) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}/changepassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(passwordData)
            });

            if (!response.ok) {
                // Try to get a better error message
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to change password');
                } catch (parseError) {
                    throw new Error('Failed to change password');
                }
            }

            return true;
        } catch (error) {
            console.error(`Error in changePassword(${id}):`, error);
            throw error;
        }
    }

    /**
     * Update notification preferences
     * @param {number} id - The user ID
     * @param {Object} preferencesData - Notification preferences data
     * @returns {Promise<boolean>} Promise resolving to true if update succeeded
     */
    async updateNotificationPreferences(id, preferencesData) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}/notifications/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(preferencesData)
            });

            if (!response.ok) {
                throw new Error('Failed to update notification preferences');
            }

            return true;
        } catch (error) {
            console.error(`Error in updateNotificationPreferences(${id}):`, error);
            throw error;
        }
    }

    /**
     * Deactivate user account
     * @param {number} id - The user ID
     * @returns {Promise<boolean>} Promise resolving to true if deactivation succeeded
     */
    async deactivateAccount(id) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}/deactivate`, {
                method: 'POST',
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to deactivate account');
            }

            return true;
        } catch (error) {
            console.error(`Error in deactivateAccount(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get user's activity history
     * @param {number} id - The user ID
     * @returns {Promise<Array>} Promise resolving to array of user activities
     */
    async getUserActivityHistory(id) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}/activity`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user activity history');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getUserActivityHistory(${id}):`, error);
            throw error;
        }
    }

    /**
     * Request account deletion
     * @param {number} id - The user ID
     * @param {string} reason - Reason for account deletion
     * @returns {Promise<boolean>} Promise resolving to true if request succeeded
     */
    async requestAccountDeletion(id, reason) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}/delete-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({ reason })
            });

            if (!response.ok) {
                throw new Error('Failed to request account deletion');
            }

            return true;
        } catch (error) {
            console.error(`Error in requestAccountDeletion(${id}):`, error);
            throw error;
        }
    }

    /**
     * Update user avatar
     * @param {number} id - The user ID
     * @param {FormData} formData - Form data with avatar image
     * @returns {Promise<string>} Promise resolving to avatar URL
     */
    async updateAvatar(id, formData) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}/avatar`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update avatar');
            }

            const data = await response.json();
            return data.avatarUrl;
        } catch (error) {
            console.error(`Error in updateAvatar(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get user's login history
     * @param {number} id - The user ID
     * @returns {Promise<Array>} Promise resolving to array of login events
     */
    async getLoginHistory(id) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}/login-history`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch login history');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in getLoginHistory(${id}):`, error);
            throw error;
        }
    }

    /**
     * Enable or disable two-factor authentication
     * @param {number} id - The user ID
     * @param {boolean} enabled - Whether to enable or disable 2FA
     * @returns {Promise<Object>} Promise resolving to 2FA setup data if enabled
     */
    async toggleTwoFactorAuth(id, enabled) {
        try {
            const response = await fetch(`${API_URL}/api/usersProfile/${id}/two-factor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({ enabled })
            });

            if (!response.ok) {
                throw new Error('Failed to update two-factor authentication settings');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error in toggleTwoFactorAuth(${id}):`, error);
            throw error;
        }
    }
}
export default new UserService();