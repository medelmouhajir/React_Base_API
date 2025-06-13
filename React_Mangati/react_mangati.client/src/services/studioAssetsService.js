// src/services/studioAssetsService.js
import apiClient from './apiClient';

const studioAssetsService = {
  /**
   * Fetch all characters for a given series
   * GET /api/studio/series/{serieId}/characters
   */
  async getCharacters(serieId) {
      const response = await apiClient.get('/studio/assets/characters', {
          params: { serieId }
          });
          return response.data;
    },

  async getUploads(serieId) {
      const response = await apiClient.get('/studio/assets/uploads', {
          params: { serieId }
          });
          return response.data;
      },

  async getCharacter(characterId) {
      const response = await apiClient.get('/studio/assets/character', {
          params: { characterId }
          });
          return response.data;
      },

  async createCharacter(serieId , formData) {
      const response = await apiClient.post('/studio/assets/characters/create/' + serieId, formData);
          return response.data;
      },

    async createUpload(serieId, formData) {
        // formData must be the FormData you built in your component,
        // *not* wrapped inside another object.
        const response = await apiClient.post(
            `/studio/assets/uploads/create/${serieId}`,  // matches [HttpPost("uploads/create/{serieId}")]
            formData,                                      // <-- raw FormData
            {
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );
        return response.data;
    },

  /**
   * Fetch all scenes for a given series
   * GET /api/studio/series/{serieId}/scenes
   */
  async getScenes(serieId) {
    const response = await apiClient.get(`/studio/series/${serieId}/scenes`);
    return response.data;
  },
  /**
   * Fetch all images for a character
   * GET /api/studio/assets/characters/{characterId}
   */
  async getCharacterImages(characterId) {
    try {
      const response = await apiClient.get(`/studio/assets/characters/${characterId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching character images for ${characterId}:`, error);
      throw error;
    }
  },

  /**
   * Upload a new image for a character
   * POST /api/studio/assets/characters/{characterId}
   */
  async createCharacterImage(characterId, file, title = '', isMain = false) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('isMain', isMain);

      const response = await apiClient.post(
        `/studio/assets/characters/${characterId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error creating character image for ${characterId}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing character image (metadata and/or file)
   * PUT /api/studio/assets/characters/{imageId}
   */
  async editCharacterImage(imageId, file = null, title = null, isMain = null) {
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (title !== null) formData.append('title', title);
      if (isMain !== null) formData.append('isMain', isMain);

      await apiClient.put(
        `/studio/assets/characters/${imageId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return true;
    } catch (error) {
      console.error(`❌ Error editing character image ${imageId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a character image
   * DELETE /api/studio/assets/characters/{imageId}
   */
  async removeCharacterImage(imageId) {
    try {
      const response = await apiClient.delete(`/studio/assets/characters/${imageId}`);
      return response.status === 204;
    } catch (error) {
      console.error(`❌ Error deleting character image ${imageId}:`, error);
      throw error;
    }
  },

  /**
   * Fetch all images for a scene
   * GET /api/studio/assets/scenes/{sceneId}
   */
  async getSceneImages(sceneId) {
    try {
      const response = await apiClient.get(`/studio/assets/scenes/${sceneId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching scene images for ${sceneId}:`, error);
      throw error;
    }
  },

  /**
   * Upload a new image for a scene
   * POST /api/studio/assets/scenes/{sceneId}
   */
  async createSceneImage(sceneId, file, title = '', description = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);

      const response = await apiClient.post(
        `/studio/assets/scenes/${sceneId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error creating scene image for ${sceneId}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing scene image (metadata and/or file)
   * PUT /api/studio/assets/scenes/{imageId}
   */
  async editSceneImage(imageId, file = null, title = null, description = null) {
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (title !== null) formData.append('title', title);
      if (description !== null) formData.append('description', description);

      await apiClient.put(
        `/studio/assets/scenes/${imageId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return true;
    } catch (error) {
      console.error(`❌ Error editing scene image ${imageId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a scene image
   * DELETE /api/studio/assets/scenes/{imageId}
   */
  async removeSceneImage(imageId) {
    try {
      const response = await apiClient.delete(`/studio/assets/scenes/${imageId}`);
      return response.status === 204;
    } catch (error) {
      console.error(`❌ Error deleting scene image ${imageId}:`, error);
      throw error;
    }
  }
};

export default studioAssetsService;
