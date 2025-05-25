// src/services/filtersService.js
import apiClient from './apiClient';

const filtersService = {
    /**
     * Fetch all available languages
     * GET /api/filters/languages
     */
    getLanguages: () => apiClient.get('/filters/languages'),

    /**
     * Fetch all available tags
     * GET /api/filters/tags
     */
    getTags: () => apiClient.get('/filters/tags'),
};

export default filtersService;
