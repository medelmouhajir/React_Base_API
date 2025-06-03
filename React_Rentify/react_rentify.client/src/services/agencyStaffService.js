import apiClient from './apiClient';

export const agencyStaffService = {
    async getStaffByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/agencystaff/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching staff for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async createStaff(staffData) {
        try {
            const response = await apiClient.post('/agencystaff', staffData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating staff:', error);
            throw error;
        }
    },

    async updateStaff(id, staffData) {
        try {
            if (id !== staffData.id) {
                throw new Error("The ID in the URL does not match the staffData.id");
            }

            const response = await apiClient.put(`/agencystaff/${id}`, staffData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating staff with ID ${id}:`, error);
            throw error;
        }
    },

    async deleteStaff(id) {
        try {
            const response = await apiClient.delete(`/agencystaff/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting staff with ID ${id}:`, error);
            throw error;
        }
    },

    async resetPassword(id, newPassword) {
        try {
            const payload = {
                userId: id,
                newPassword: newPassword
            };

            const response = await apiClient.post(`/agencystaff/${id}/reset-password`, payload);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error resetting password for staff ID ${id}:`, error);
            throw error;
        }
    }
};

export default agencyStaffService;
