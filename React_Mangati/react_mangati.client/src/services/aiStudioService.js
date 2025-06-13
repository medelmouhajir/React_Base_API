// src/services/aiStudioService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5229';

// Create axios instance with auth interceptor
const apiClient = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// AI Studio Service
const aiStudioService = {
    // AI Providers enum
    AIProvider: {
        Gemini: 'Gemini',
        ChatGPT: 'ChatGPT',
        Sora: 'Sora'
    },

    // Get available AI providers
    async getProviders() {
        try {
            const response = await apiClient.get('/AIStudio/providers');
            return response.data;
        } catch (error) {
            console.error('Error fetching AI providers:', error);
            throw error;
        }
    },

    // Generate image from text prompt
    async generateImage(prompt, options = {}) {
        try {
            const response = await apiClient.post('/AIStudio/generate-image', {
                prompt,
                provider: options.provider || this.AIProvider.ChatGPT,
                width: options.width || 1024,
                height: options.height || 1024,
                style: options.style,
                quality: options.quality || 'standard',
                count: options.count || 1
            });
            return response.data;
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    },

    // Generate image with reference images
    async generateImageWithReferences(prompt, referenceImages, options = {}) {
        try {
            const payload = {
                prompt,
                referenceImages,
                provider: options.provider || this.AIProvider.Gemini,
                width: options.width || 1024,
                height: options.height || 1024,
                style: options.style || 'anime',
                quality: options.quality || 'standard',
                count: options.count || 1
            };
            const response = await apiClient.post('/AIStudio/generate-image-with-references',payload);
            return response.data;
        } catch (error) {
            console.error('Error generating image with references:', error);
            console.error(
                'Error generating image with references:',
                error.response?.data || error
            );
            throw error;
        }
    },

    // Character Management
    async getCharacters(serieId) {
        try {
            const response = await apiClient.get(`/Characters/by-serie/${serieId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching characters:', error);
            throw error;
        }
    },

    async createCharacter(characterData) {
        try {
            const response = await apiClient.post('/Characters', characterData);
            return response.data;
        } catch (error) {
            console.error('Error creating character:', error);
            throw error;
        }
    },

    async updateCharacter(id, characterData) {
        try {
            const response = await apiClient.put(`/Characters/${id}`, characterData);
            return response.data;
        } catch (error) {
            console.error('Error updating character:', error);
            throw error;
        }
    },

    async deleteCharacter(id) {
        try {
            await apiClient.delete(`/Characters/${id}`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting character:', error);
            throw error;
        }
    },

    // Character Groups Management
    async getCharacterGroups(serieId) {
        try {
            const response = await apiClient.get(`/CharacterGroups/by-serie/${serieId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching character groups:', error);
            throw error;
        }
    },

    async createCharacterGroup(groupData) {
        try {
            const response = await apiClient.post('/CharacterGroups', groupData);
            return response.data;
        } catch (error) {
            console.error('Error creating character group:', error);
            throw error;
        }
    },

    // Place/Scene Management
    async getPlaceScenes(serieId) {
        try {
            const response = await apiClient.get(`/PlaceScenes/by-serie/${serieId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching place scenes:', error);
            throw error;
        }
    },

    async createPlaceScene(placeData) {
        try {
            const response = await apiClient.post('/PlaceScenes', placeData);
            return response.data;
        } catch (error) {
            console.error('Error creating place scene:', error);
            throw error;
        }
    },

    async updatePlaceScene(id, placeData) {
        try {
            const response = await apiClient.put(`/PlaceScenes/${id}`, placeData);
            return response.data;
        } catch (error) {
            console.error('Error updating place scene:', error);
            throw error;
        }
    },

    async deletePlaceScene(id) {
        try {
            await apiClient.delete(`/PlaceScenes/${id}`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting place scene:', error);
            throw error;
        }
    },

    // Place Groups Management
    async getPlaceGroups(serieId) {
        try {
            const response = await apiClient.get(`/PlaceGroups/by-serie/${serieId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching place groups:', error);
            throw error;
        }
    },

    async createPlaceGroup(groupData) {
        try {
            const response = await apiClient.post('/PlaceGroups', groupData);
            return response.data;
        } catch (error) {
            console.error('Error creating place group:', error);
            throw error;
        }
    },

    // Upload character image
    async uploadCharacterImage(characterId, imageFile, isMain = false) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('isMain', isMain);

            const response = await apiClient.post(`/Characters/${characterId}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading character image:', error);
            throw error;
        }
    },

    // Upload place scene image
    async uploadPlaceSceneImage(placeSceneId, imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await apiClient.post(`/PlaceScenes/${placeSceneId}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading place scene image:', error);
            throw error;
        }
    },

    // Get studio series (series with Is_For_Studio = true)
    async getStudioSeries() {
        try {
            const response = await apiClient.get('/Serie?isForStudio=true');
            return response.data;
        } catch (error) {
            console.error('Error fetching studio series:', error);
            throw error;
        }
    },

    // Helper function to convert base64 to blob
    base64ToBlob(base64, contentType = '') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    },

    // Save AI generated image to server
    async saveGeneratedImage(base64Image, metadata) {
        try {
            const blob = this.base64ToBlob(base64Image.split(',')[1], 'image/png');
            const formData = new FormData();
            formData.append('image', blob, 'ai-generated.png');
            formData.append('metadata', JSON.stringify(metadata));

            const response = await apiClient.post('/AIStudio/save-generated-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error saving generated image:', error);
            throw error;
        }
    }
};

export default aiStudioService;