import apiClient from './apiClient'; // Or replace with the axios instance used in authService

export const accountService = {
    async getUserProfile(userId) {
        try {
            const response = await apiClient.get(`/account/${userId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error getting user profile:', error);
            throw error;
        }
    },

    async updateProfile(formData) {
        try {
            const response = await apiClient.put('/auth/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            throw error;
        }
    },

    async changePassword(data) {
        try {
            const response = await apiClient.post('/auth/change-password', data);
            return response.data;
        } catch (error) {
            console.error('❌ Error changing password:', error);
            throw error;
        }
    }
};
