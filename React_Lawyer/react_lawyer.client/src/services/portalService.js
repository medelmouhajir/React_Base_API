// src/services/portalService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

class PortalService {
    // Get auth header with JWT token
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    // Get case details from Moroccan portal
    async getCaseDetails(caseNumber, juridiction) {
        try {
            const response = await fetch(`${API_URL}/api/portal/${encodeURIComponent(caseNumber)}/${encodeURIComponent(juridiction)}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch case details from portal');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching portal case details:', error);
            throw error;
        }
    }

    // Get case decisions from Moroccan portal
    async getCaseDecisions(caseNumber, affaire) {
        try {
            const response = await fetch(
                `${API_URL}/api/portal/decisions/${encodeURIComponent(caseNumber)}/${encodeURIComponent(affaire)}`,
                { headers: this.getAuthHeader() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch case decisions from portal');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching portal case decisions:', error);
            throw error;
        }
    }

    // Get case parties from Moroccan portal
    async getCaseParties(caseNumber, affaire) {
        try {
            const response = await fetch(
                `${API_URL}/api/portal/parties/${encodeURIComponent(caseNumber)}/${encodeURIComponent(affaire)}`,
                { headers: this.getAuthHeader() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch case parties from portal');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching portal case parties:', error);
            throw error;
        }
    }
}

export default new PortalService();