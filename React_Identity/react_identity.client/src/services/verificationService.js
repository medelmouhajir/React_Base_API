
import { authService } from './authService';

class VerificationService {
    async submitSelfie(accountId, imageBase64, externalReference, metaData) {
        return authService.api.post('/verify/selfie', {
            accountId,
            imageBase64,
            externalReference,
            metaData
        });
    }

    async submitDocument(accountId, docType, imageBase64, externalReference, metaData) {
        return authService.api.post('/verify/document', {
            accountId,
            docType,
            imageBase64,
            externalReference,
            metaData
        });
    }

    async submitCombined(accountId, selfieImageBase64, docType, documentImageBase64, externalReference, metaData) {
        return authService.api.post('/verify/combined', {
            accountId,
            selfieImageBase64,
            docType,
            documentImageBase64,
            externalReference,
            metaData
        });
    }

    async getVerificationResult(requestId) {
        return authService.api.get(`/verify/${requestId}`);
    }

    async getAccountVerifications(accountId, page = 1, pageSize = 20, status = null) {
        const params = new URLSearchParams({ page, pageSize });
        if (status) params.append('status', status);

        return authService.api.get(`/verify/account/${accountId}?${params}`);
    }

    // Helper function to convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data URL prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    // Helper function to validate image file
    validateImageFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Only JPEG and PNG images are allowed');
        }

        if (file.size > maxSize) {
            throw new Error('Image size must be less than 10MB');
        }

        return true;
    }
}

export const verificationService = new VerificationService();