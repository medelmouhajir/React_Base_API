// src/services/searchService.js
import apiClient from './apiClient';

const searchService = {
    /**
     * Search for series with optional filters
     * @param {Object} params - Search parameters
     * @param {string} params.q - Search query text
     * @param {number} params.languageId - Language ID filter
     * @param {Array<number>} params.tagIds - Tag IDs filter
     * @returns {Promise} Promise object representing the search results
     */
    search: (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.q) queryParams.append('q', params.q);
        if (params.languageId) queryParams.append('languageId', params.languageId);
        if (params.tagIds && params.tagIds.length > 0) {
            queryParams.append('tagIds', params.tagIds.join(','));
        }

        return apiClient.get(`/search?${queryParams.toString()}`);
    },

    /**
     * Get trending series
     * @param {number} limit - Maximum number of results to return
     * @returns {Promise} Promise object representing trending series
     */
    getTrending: (limit = 5) => {
        return apiClient.get(`/search/trending?limit=${limit}`);
    },

    /**
     * Get recently updated series
     * @param {number} limit - Maximum number of results to return
     * @returns {Promise} Promise object representing recently updated series
     */
    getRecent: (limit = 5) => {
        return apiClient.get(`/search/recent?limit=${limit}`);
    }
};

export default searchService;