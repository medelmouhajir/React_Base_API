import apiClient from './apiClient';

export const serieService = {
    async getAll() {
        try {
            const response = await apiClient.get('/serie');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching series:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/serie/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching serie with ID ${id}:`, error);
            throw error;
        }
    },

    async create(serieData) {
        try {
            const formData = new FormData();
            formData.append('title', serieData.title);
            formData.append('synopsis', serieData.synopsis || '');
            formData.append('status', serieData.status);
            if (serieData.coverImage) {
                formData.append('coverImage', serieData.coverImage);
            }
            console.log('Creating serie with data: HHHHHHHHHHHHHHHH');
            console.log(formData);

            const response = await apiClient.post('/serie', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error creating serie:', error);
            throw error;
        }
    },

    async update(id, serieData) {
        try {
            const formData = new FormData();
            formData.append('title', serieData.title);
            formData.append('synopsis', serieData.synopsis || '');
            formData.append('status', serieData.status);
            if (serieData.coverImage) {
                formData.append('coverImage', serieData.coverImage);
            }

            const response = await apiClient.put(`/serie/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error updating serie with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/serie/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting serie with ID ${id}:`, error);
            throw error;
        }
    }
};

export default serieService;
