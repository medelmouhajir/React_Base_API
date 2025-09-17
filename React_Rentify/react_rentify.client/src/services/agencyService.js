// src/services/agencyService.js with attachment handling
import apiClient from './apiClient';

export const agencyService = {
    async getAll() {
        try {
            const response = await apiClient.get('/agencies');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching agencies:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/agencies/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching agency with ID ${id}:`, error);
            throw error;
        }
    },

    async getStatsById(id) {
        try {
            const response = await apiClient.get(`/agencies/${id}/stats`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching agency with ID ${id}:`, error);
            throw error;
        }
    },

    async create(agencyData) {
        try {
            const response = await apiClient.post('/agencies', agencyData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating agency:', error);
            throw error;
        }
    },

    async update(id, agencyData) {
        try {
            if (id !== agencyData.id) {
                throw new Error("The ID in the URL does not match the agencyData.id");
            }

            const response = await apiClient.put(`/agencies/${id}`, agencyData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating agency with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/agencies/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting agency with ID ${id}:`, error);
            throw error;
        }
    },

    // New attachment functions
    async uploadLogo(id, fileData) {
        try {
            const formData = new FormData();
            formData.append('file', fileData);

            const response = await apiClient.post(`/agencies/${id}/logo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error(`❌ Error uploading logo for agency with ID ${id}:`, error);
            throw error;
        }
    },

    async uploadLogoAssociation(id, fileData) {
        try {
            const formData = new FormData();
            formData.append('file', fileData);

            const response = await apiClient.post(`/agencies/${id}/logo-association`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error(`❌ Error uploading logo association for agency with ID ${id}:`, error);
            throw error;
        }
    },
    async addAttachment(id, fileName, fileData) {
        try {
            const formData = new FormData();
            formData.append('file', fileData);
            formData.append('fileName', fileName);

            const response = await apiClient.post(`/agencies/${id}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error(`❌ Error adding attachment to agency with ID ${id}:`, error);
            throw error;
        }
    },

    async removeAttachment(agencyId, attachmentId) {
        try {
            const response = await apiClient.delete(`/agencies/${agencyId}/attachments/${attachmentId}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error removing attachment ${attachmentId} from agency ${agencyId}:`, error);
            throw error;
        }
    },

    async getAttachments(agencyId) {
        try {
            const response = await apiClient.get(`/agencies/${agencyId}/attachments`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching attachments for agency with ID ${agencyId}:`, error);
            throw error;
        }
    }
};

export default agencyService;