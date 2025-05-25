// src/services/userDataService.js
import apiClient from './apiClient';

/**
 * Service for managing user data including favorites, reading progress, and settings
 */
const userDataService = {
    // Favorites
    /**
     * Get user's favorite series
     * @returns {Promise} Promise object representing the user's favorites
     */
    getFavorites: () => apiClient.get('/UserData/favorites'),

    /**
     * Add a series to user's favorites
     * @param {number} serieId - The ID of the serie to add to favorites
     * @returns {Promise} Promise object representing the result of the operation
     */
    addFavorite: (serieId) => apiClient.post(`/UserData/favorites/${serieId}`),

    /**
     * Remove a series from user's favorites
     * @param {number} serieId - The ID of the serie to remove from favorites
     * @returns {Promise} Promise object representing the result of the operation
     */
    removeFavorite: (serieId) => apiClient.delete(`/UserData/favorites/${serieId}`),

    /**
     * Check if a series is in user's favorites
     * @param {number} serieId - The ID of the serie to check
     * @returns {Promise} Promise object with boolean indicating if serie is favorited
     */
    checkFavorite: (serieId) => apiClient.get(`/UserData/favorites/check/${serieId}`),

    // Reading Progress
    /**
     * Get reading progress for a specific chapter
     * @param {number} chapterId - The ID of the chapter
     * @returns {Promise} Promise object representing the reading progress
     */
    getReadingProgress: (chapterId) => apiClient.get(`/UserData/progress/${chapterId}`),

    /**
     * Get all reading progress entries for a serie
     * @param {number} serieId - The ID of the serie
     * @returns {Promise} Promise object representing all reading progress for the serie
     */
    getReadingProgressBySerie: (serieId) => apiClient.get(`/UserData/progress/by-serie/${serieId}`),

    /**
     * Save reading progress for a chapter
     * @param {Object} progressData - Object containing chapterId and lastReadPage
     * @returns {Promise} Promise object representing the saved reading progress
     */
    saveReadingProgress: (progressData) => apiClient.post('/UserData/progress', progressData),

    // Reading Settings
    /**
     * Get reading settings for a serie
     * @param {number} serieId - The ID of the serie
     * @returns {Promise} Promise object representing the reading settings
     */
    getReadingSettings: (serieId) => apiClient.get(`/UserData/settings/${serieId}`),

    /**
     * Save reading settings for a serie
     * @param {Object} settingsData - Object containing serieId, theme, readingMode, and fitToWidth
     * @returns {Promise} Promise object representing the saved reading settings
     */
    saveReadingSettings: (settingsData) => apiClient.post('/UserData/settings', settingsData),

    // Theme mode and reading mode constants
    themeMode: {
        LIGHT: 0,
        DARK: 1
    },

    readingMode: {
        PAGE_FLIP: 0,
        VERTICAL_SCROLL: 1,
        HORIZONTAL_SCROLL: 2
    }
};

export default userDataService;