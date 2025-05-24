// src/services/pageService.js
import apiClient from './apiClient';

const pageService = {
    getByChapterId: (chapterId) => apiClient.get(`/Pages/ByChapter/${chapterId}`),
    upload: (chapterId, formData) =>
        apiClient.post(`/Pages/Upload/${chapterId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    reorder: (pages) => apiClient.post('/Pages/Reorder', pages),
    delete: (id) => apiClient.delete(`/Pages/${id}`),
};

export default pageService;
