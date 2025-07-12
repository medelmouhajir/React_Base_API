import apiClient from './apiClient';

export const identityService = {
    /**
     * Extract identity fields from 1–6 uploaded images.
     * @param {File[]} files – Array of File objects (length 1–6)
     * @returns {Promise<Customer>} – Parsed Customer JSON
     */
    async extract(files) {
        try {
            if (!files || files.length < 1 || files.length > 6) {
                throw new Error('You must provide between 1 and 6 image files.');
            }

            const formData = new FormData();
            files.forEach((file) => {
                formData.append('images', file);
            });

            const response = await apiClient.post(
                '/identity/extract',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Error extracting identity:', error);
            throw error;
        }
    }
};

export default identityService;
