import apiClient from './apiClient';

export const subscriptionService = {
    // Plan management
    async getAvailablePlans() {
        try {
            const response = await apiClient.get('/subscriptions/plans');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching available plans:', error);
            throw error;
        }
    },

    async getPlanById(planId) {
        try {
            const response = await apiClient.get(`/subscriptions/plans/${planId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching plan with ID ${planId}:`, error);
            throw error;
        }
    },

    // Agency subscription management
    async getCurrentSubscription(agencyId) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/current`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching current subscription for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async createSubscription(agencyId, subscriptionData) {
        try {
            const response = await apiClient.post(`/subscriptions/agency/${agencyId}/subscribe`, subscriptionData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error creating subscription for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async upgradeSubscription(agencyId, upgradeData) {
        try {
            const response = await apiClient.put(`/subscriptions/agency/${agencyId}/upgrade`, upgradeData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error upgrading subscription for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async cancelSubscription(agencyId, cancelData = {}) {
        try {
            const response = await apiClient.delete(`/subscriptions/agency/${agencyId}/cancel`, {
                data: cancelData
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Error cancelling subscription for agency ${agencyId}:`, error);
            throw error;
        }
    },

    // Feature access validation
    async checkFeatureAccess(agencyId, featureName) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/features/${featureName}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error checking feature access for ${featureName}:`, error);
            throw error;
        }
    },

    async checkResourceLimits(agencyId, resourceType, currentCount) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/limits/${resourceType}`, {
                params: { currentCount }
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Error checking resource limits for ${resourceType}:`, error);
            throw error;
        }
    },

    // Billing and invoices
    async getSubscriptionInvoices(agencyId) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/invoices`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoices for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async getInvoiceById(agencyId, invoiceId) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/invoices/${invoiceId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching invoice ${invoiceId}:`, error);
            throw error;
        }
    },

    async downloadInvoice(agencyId, invoiceId) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/invoices/${invoiceId}/download`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Error downloading invoice ${invoiceId}:`, error);
            throw error;
        }
    },

    // Usage tracking
    async getCurrentUsage(agencyId) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/usage`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching usage for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async getUsageHistory(agencyId, params = {}) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/usage/history`, {
                params
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching usage history for agency ${agencyId}:`, error);
            throw error;
        }
    },

    // Admin/System-wide methods
    async getAllSubscriptions(params = {}) {
        try {
            const response = await apiClient.get('/subscriptions', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all subscriptions:', error);
            throw error;
        }
    },

    async getSubscriptionById(subscriptionId) {
        try {
            const response = await apiClient.get(`/subscriptions/${subscriptionId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching subscription ${subscriptionId}:`, error);
            throw error;
        }
    },

    async updateSubscriptionStatus(subscriptionId, statusData) {
        try {
            const response = await apiClient.patch(`/subscriptions/${subscriptionId}/status`, statusData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating subscription status:`, error);
            throw error;
        }
    },

    // Plan management (admin)
    async createPlan(planData) {
        try {
            const response = await apiClient.post('/subscriptions/plans', planData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating subscription plan:', error);
            throw error;
        }
    },

    async updatePlan(planId, planData) {
        try {
            const response = await apiClient.put(`/subscriptions/plans/${planId}`, planData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating subscription plan:`, error);
            throw error;
        }
    },

    async deletePlan(planId) {
        try {
            const response = await apiClient.delete(`/subscriptions/plans/${planId}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting subscription plan:`, error);
            throw error;
        }
    },

    // Analytics and reporting
    async getSubscriptionAnalytics(params = {}) {
        try {
            const response = await apiClient.get('/subscriptions/analytics', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching subscription analytics:', error);
            throw error;
        }
    },

    async getRevenueReport(params = {}) {
        try {
            const response = await apiClient.get('/subscriptions/reports/revenue', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching revenue report:', error);
            throw error;
        }
    },

    async getChurnReport(params = {}) {
        try {
            const response = await apiClient.get('/subscriptions/reports/churn', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching churn report:', error);
            throw error;
        }
    }
};

export default subscriptionService;