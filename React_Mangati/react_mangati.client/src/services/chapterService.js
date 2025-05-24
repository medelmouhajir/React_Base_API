// src/services/chapterService.js
import apiClient from './apiClient';

const chapterService = {
    getAll: () => apiClient.get('/Chapters'),
    getById: (id) => apiClient.get(`/Chapters/${id}`),
    getBySerieId: (serieId) => apiClient.get(`/Chapters/BySerie/${serieId}`),
    create: (chapterData) => apiClient.post('/Chapters', chapterData),
    update: (id, chapterData) => apiClient.put(`/Chapters/${id}`, chapterData),
    delete: (id) => apiClient.delete(`/Chapters/${id}`),
};

export default chapterService;
