import apiClient from './apiClient';

export const blacklistService = {
    /**
     * Fetches all blacklist entries.
     */
    async getAll() {
        try {
            const response = await apiClient.get('/blacklist');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all blacklist entries:', error);
            throw error;
        }
    },

    /**
     * Fetches a single blacklist entry by its ID.
     * @param {string} id – GUID of the blacklist entry.
     */
    async getById(id) {
        try {
            const response = await apiClient.get(`/blacklist/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching blacklist entry with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Searches blacklist entries by nationalId, passportId, or licenseNumber.
     * At least one parameter should be provided.
     *
     * @param {Object} params
     * @param {string} [params.nationalId]
     * @param {string} [params.passportId]
     * @param {string} [params.licenseNumber]
     */
    async search({ nationalId = '', passportId = '', licenseNumber = '' } = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (nationalId) {
                queryParams.append('nationalId', nationalId);
            }
            if (passportId) {
                queryParams.append('passportId', passportId);
            }
            if (licenseNumber) {
                queryParams.append('licenseNumber', licenseNumber);
            }

            const response = await apiClient.get(`/blacklist/search?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error(
                `❌ Error searching blacklist entries (nationalId=${nationalId}, passportId=${passportId}, licenseNumber=${licenseNumber}):`,
                error
            );
            throw error;
        }
    },

    /**
     * Creates a new blacklist entry.
     * @param {Object} entryData – Payload matching CreateBlacklistEntryDto.
     *   { 
     *     nationalId?: string,
     *     passportId?: string,
     *     licenseNumber?: string,
     *     fullName: string,
     *     reason: string,
     *     reportedByAgencyId: string (GUID)
     *   }
     */
    async create(entryData) {
        try {
            const response = await apiClient.post('/blacklist', entryData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating blacklist entry:', error);
            throw error;
        }
    },

    /**
     * Updates an existing blacklist entry.
     * @param {string} id – GUID of the blacklist entry.
     * @param {Object} entryData – Payload matching UpdateBlacklistEntryDto.
     *   Must include entryData.id === id.
     */
    async update(id, entryData) {
        try {
            if (id !== entryData.id) {
                throw new Error("The ID in the URL does not match entryData.id");
            }
            const response = await apiClient.put(`/blacklist/${id}`, entryData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating blacklist entry with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Deletes a blacklist entry by its ID.
     * @param {string} id – GUID of the blacklist entry.
     * @returns {boolean} – True if deletion succeeded (204 status), otherwise throws.
     */
    async delete(id) {
        try {
            const response = await apiClient.delete(`/blacklist/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting blacklist entry with ID ${id}:`, error);
            throw error;
        }
    }
};

export default blacklistService;
