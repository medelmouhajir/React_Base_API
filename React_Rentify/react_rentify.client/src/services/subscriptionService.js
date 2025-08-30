import apiClient from './apiClient';

class SubscriptionService {

    // Plans management
    async getAvailablePlans() {
        try {
            const response = await apiClient.get(`/subscriptions/plans`);
            return response.data;
        } catch (error) {
            console.error('Error fetching available plans:', error);
            throw error;
        }
    }

    async getPlanById(planId) {
        try {
            const response = await apiClient.get(`/subscriptions/plans/${planId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching plan ${planId}:`, error);
            throw error;
        }
    }

    async createPlan(planData) {
        try {
            const response = await apiClient.post(`/subscriptions/plans`, planData);
            return response.data;
        } catch (error) {
            console.error('Error creating plan:', error);
            throw error;
        }
    }

    async updatePlan(planId, planData) {
        try {
            const response = await apiClient.put(`/subscriptions/plans/${planId}`, planData);
            return response.data;
        } catch (error) {
            console.error(`Error updating plan ${planId}:`, error);
            throw error;
        }
    }

    async deletePlan(planId) {
        try {
            const response = await apiClient.delete(`/subscriptions/plans/${planId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting plan ${planId}:`, error);
            throw error;
        }
    }

    // Agency subscription management
    async getCurrentSubscription(agencyId) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/current`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching current subscription for agency ${agencyId}:`, error);
            throw error;
        }
    }

    async createSubscription(agencyId, subscriptionData) {
        try {
            const response = await apiClient.post(`/subscriptions/agency/${agencyId}/subscribe`, subscriptionData);
            return response.data;
        } catch (error) {
            console.error(`Error creating subscription for agency ${agencyId}:`, error);
            throw error;
        }
    }

    async upgradeSubscription(agencyId, upgradeData) {
        try {
            const response = await apiClient.put(`/subscriptions/agency/${agencyId}/upgrade`, upgradeData);
            return response.data;
        } catch (error) {
            console.error(`Error upgrading subscription for agency ${agencyId}:`, error);
            throw error;
        }
    }

    async cancelSubscription(agencyId) {
        try {
            const response = await apiClient.delete(`/subscriptions/agency/${agencyId}/cancel`);
            return response.data;
        } catch (error) {
            console.error(`Error cancelling subscription for agency ${agencyId}:`, error);
            throw error;
        }
    }

    async resumeSubscription(agencyId) {
        try {
            const response = await apiClient.post(`/subscriptions/agency/${agencyId}/resume`);
            return response.data;
        } catch (error) {
            console.error(`Error resuming subscription for agency ${agencyId}:`, error);
            throw error;
        }
    }

    async suspendSubscription(agencyId, suspendData) {
        try {
            const response = await apiClient.post(`/subscriptions/agency/${agencyId}/suspend`, suspendData);
            return response.data;
        } catch (error) {
            console.error(`Error suspending subscription for agency ${agencyId}:`, error);
            throw error;
        }
    }

    async changeBillingCycle(agencyId, billingCycleData) {
        try {
            const response = await apiClient.post(`/subscriptions/agency/${agencyId}/change-billing-cycle`, billingCycleData);
            return response.data;
        } catch (error) {
            console.error(`Error changing billing cycle for agency ${agencyId}:`, error);
            throw error;
        }
    }

    // Usage and limits
    async getCurrentUsage(agencyId) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/usage`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching current usage for agency ${agencyId}:`, error);
            throw error;
        }
    }

    async checkFeatureAccess(agencyId, featureName) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/feature-access/${featureName}`);
            return response.data;
        } catch (error) {
            console.error(`Error checking feature access for agency ${agencyId}, feature ${featureName}:`, error);
            throw error;
        }
    }

    async checkResourceLimits(agencyId, resourceType, currentCount) {
        try {
            const response = await apiClient.get(`/subscriptions/agency/${agencyId}/limits/${resourceType}`, {
                params: { currentCount }
            });
            return response.data;
        } catch (error) {
            console.error(`Error checking resource limits for agency ${agencyId}, resource ${resourceType}:`, error);
            throw error;
        }
    }

    // Billing operations (Admin only)
    async processAllBilling() {
        try {
            const response = await apiClient.post(`/subscriptions/billing/process`);
            return response.data;
        } catch (error) {
            console.error('Error processing all billing:', error);
            throw error;
        }
    }

    async processSubscriptionBilling(subscriptionId) {
        try {
            const response = await apiClient.post(`/subscriptions/billing/process/${subscriptionId}`);
            return response.data;
        } catch (error) {
            console.error(`Error processing billing for subscription ${subscriptionId}:`, error);
            throw error;
        }
    }

    // Utility methods for common operations
    async subscribeToTrial(agencyId, planId) {
        return this.createSubscription(agencyId, {
            planId: planId,
            startTrial: true
        });
    }

    async subscribeToRegularPlan(agencyId, planId) {
        return this.createSubscription(agencyId, {
            planId: planId,
            startTrial: false
        });
    }

    async isFeatureEnabled(agencyId, featureName) {
        try {
            const result = await this.checkFeatureAccess(agencyId, featureName);
            return result.hasAccess;
        } catch (error) {
            console.error(`Error checking if feature ${featureName} is enabled:`, error);
            return false;
        }
    }

    async canAddResource(agencyId, resourceType, currentCount) {
        try {
            const result = await this.checkResourceLimits(agencyId, resourceType, currentCount);
            return result.isWithinLimits;
        } catch (error) {
            console.error(`Error checking if resource ${resourceType} can be added:`, error);
            return false;
        }
    }

    // Helper method to get subscription status
    async getSubscriptionStatus(agencyId) {
        try {
            const subscription = await this.getCurrentSubscription(agencyId);
            return {
                isActive: subscription?.status === 'Active',
                isTrial: subscription?.isInTrialPeriod || false,
                planName: subscription?.plan?.name || 'Unknown',
                expiresAt: subscription?.nextBillingDate || null,
                status: subscription?.status || 'Unknown'
            };
        } catch (error) {
            console.error(`Error getting subscription status for agency ${agencyId}:`, error);
            return {
                isActive: false,
                isTrial: false,
                planName: 'Unknown',
                expiresAt: null,
                status: 'Unknown'
            };
        }
    }

    // Batch operations
    async getAgencyLimitsAndUsage(agencyId) {
        try {
            const [subscription, usage] = await Promise.all([
                this.getCurrentSubscription(agencyId),
                this.getCurrentUsage(agencyId)
            ]);

            return {
                subscription,
                usage,
                limits: subscription?.plan || {}
            };
        } catch (error) {
            console.error(`Error fetching limits and usage for agency ${agencyId}:`, error);
            throw error;
        }
    }

    // Feature checking helper
    async hasFeatures(agencyId, features) {
        try {
            const checks = await Promise.all(
                features.map(feature => this.checkFeatureAccess(agencyId, feature))
            );

            return features.reduce((acc, feature, index) => {
                acc[feature] = checks[index].hasAccess;
                return acc;
            }, {});
        } catch (error) {
            console.error(`Error checking multiple features for agency ${agencyId}:`, error);
            throw error;
        }
    }
}

export default new SubscriptionService();