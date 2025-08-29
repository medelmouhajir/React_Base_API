// subscriptionService.js - Frontend service for subscription management
import apiClient from '../utils/apiClient';

/**
 * Subscription Service
 * Handles all subscription-related API calls for the React Rentify application
 */
class SubscriptionService {
    constructor() {
        this.baseURL = '/api/subscriptions';
    }

    // ===== SUBSCRIPTION PLANS =====

    /**
     * Get all available subscription plans
     * @returns {Promise<Array>} List of available subscription plans
     */
    async getAvailablePlans() {
        try {
            const response = await apiClient.get(`${this.baseURL}/plans`);
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription plans:', error);
            throw this.handleError(error);
        }
    }

    // ===== AGENCY SUBSCRIPTIONS =====

    /**
     * Get current subscription for an agency
     * @param {string} agencyId - Agency ID (GUID)
     * @returns {Promise<Object>} Current subscription details
     */
    async getCurrentSubscription(agencyId) {
        try {
            const response = await apiClient.get(`${this.baseURL}/agency/${agencyId}/current`);
            return response.data;
        } catch (error) {
            console.error('Error fetching current subscription:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Create a new subscription for an agency
     * @param {string} agencyId - Agency ID (GUID)
     * @param {Object} subscriptionData - Subscription creation data
     * @param {string} subscriptionData.planId - Plan ID (GUID)
     * @param {boolean} subscriptionData.startTrial - Whether to start with trial (default: false)
     * @returns {Promise<Object>} Created subscription details
     */
    async createSubscription(agencyId, subscriptionData) {
        try {
            const payload = {
                planId: subscriptionData.planId,
                startTrial: subscriptionData.startTrial || false
            };

            const response = await apiClient.post(
                `${this.baseURL}/agency/${agencyId}/subscribe`,
                payload
            );
            return response.data;
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Upgrade an existing subscription
     * @param {string} agencyId - Agency ID (GUID)
     * @param {string} newPlanId - New plan ID (GUID)
     * @returns {Promise<Object>} Updated subscription details
     */
    async upgradeSubscription(agencyId, newPlanId) {
        try {
            const payload = {
                newPlanId: newPlanId
            };

            const response = await apiClient.put(
                `${this.baseURL}/agency/${agencyId}/upgrade`,
                payload
            );
            return response.data;
        } catch (error) {
            console.error('Error upgrading subscription:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Cancel an agency subscription
     * @param {string} agencyId - Agency ID (GUID)
     * @returns {Promise<Object>} Cancelled subscription details
     */
    async cancelSubscription(agencyId) {
        try {
            const response = await apiClient.delete(`${this.baseURL}/agency/${agencyId}/cancel`);
            return response.data;
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            throw this.handleError(error);
        }
    }

    // ===== SUBSCRIPTION UTILITIES =====

    /**
     * Check if subscription is active
     * @param {Object} subscription - Subscription object
     * @returns {boolean} Whether subscription is active
     */
    isSubscriptionActive(subscription) {
        if (!subscription) return false;
        return subscription.status === 0 || subscription.status === 1; // Trial or Active
    }

    /**
     * Check if subscription is in trial period
     * @param {Object} subscription - Subscription object
     * @returns {boolean} Whether subscription is in trial
     */
    isTrialPeriod(subscription) {
        if (!subscription) return false;
        return subscription.status === 0 || subscription.isTrialPeriod;
    }

    /**
     * Get subscription status text
     * @param {number} status - Subscription status enum value
     * @returns {string} Human-readable status
     */
    getSubscriptionStatusText(status) {
        const statusMap = {
            0: 'Trial',
            1: 'Active',
            2: 'Past Due',
            3: 'Cancelled',
            4: 'Suspended',
            5: 'Expired'
        };
        return statusMap[status] || 'Unknown';
    }

    /**
     * Get billing cycle text
     * @param {number} billingCycle - Billing cycle enum value
     * @returns {string} Human-readable billing cycle
     */
    getBillingCycleText(billingCycle) {
        const cycleMap = {
            1: 'Monthly',
            12: 'Yearly'
        };
        return cycleMap[billingCycle] || 'Unknown';
    }

    /**
     * Calculate days remaining in subscription
     * @param {Object} subscription - Subscription object
     * @returns {number} Days remaining (-1 if expired or cancelled)
     */
    getDaysRemaining(subscription) {
        if (!subscription || subscription.status === 3 || subscription.status === 5) {
            return -1; // Cancelled or Expired
        }

        const endDate = new Date(subscription.endDate);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    }

    /**
     * Calculate trial days remaining
     * @param {Object} subscription - Subscription object
     * @returns {number} Trial days remaining (-1 if not in trial)
     */
    getTrialDaysRemaining(subscription) {
        if (!subscription || !subscription.isTrialPeriod || !subscription.trialEndDate) {
            return -1;
        }

        const trialEndDate = new Date(subscription.trialEndDate);
        const today = new Date();
        const diffTime = trialEndDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    }

    /**
     * Format subscription price for display
     * @param {Object} plan - Subscription plan object
     * @returns {string} Formatted price string
     */
    formatPrice(plan) {
        if (!plan) return '$0.00';

        const price = parseFloat(plan.price || plan.currentPrice || 0);
        const billingCycle = plan.billingCycle;
        const cycleText = billingCycle === 1 ? '/month' : '/year';

        return `$${price.toFixed(2)}${cycleText}`;
    }

    /**
     * Check if plan upgrade is available
     * @param {Object} currentPlan - Current subscription plan
     * @param {Object} targetPlan - Target plan to upgrade to
     * @returns {boolean} Whether upgrade is available
     */
    canUpgradeToPlan(currentPlan, targetPlan) {
        if (!currentPlan || !targetPlan) return false;
        return targetPlan.price > currentPlan.price;
    }

    /**
     * Get feature availability from subscription plan
     * @param {Object} plan - Subscription plan object
     * @param {string} feature - Feature name
     * @returns {boolean} Whether feature is available
     */
    hasFeature(plan, feature) {
        if (!plan) return false;

        const featureMap = {
            'maintenance': plan.hasMaintenanceModule,
            'expenses': plan.hasExpenseTracking,
            'reporting': plan.hasAdvancedReporting,
            'api': plan.hasAPIAccess,
            'gps': plan.hasGPSTracking
        };

        return featureMap[feature.toLowerCase()] || false;
    }

    /**
     * Check if resource limit is exceeded
     * @param {Object} plan - Subscription plan object
     * @param {string} resourceType - Type of resource (cars, users, customers, reservations)
     * @param {number} currentCount - Current count of resource
     * @returns {boolean} Whether limit is exceeded
     */
    isResourceLimitExceeded(plan, resourceType, currentCount) {
        if (!plan) return true;

        const limitMap = {
            'cars': plan.maxCars,
            'users': plan.maxUsers,
            'customers': plan.maxCustomers,
            'reservations': plan.maxReservations
        };

        const limit = limitMap[resourceType.toLowerCase()];
        return limit > 0 && currentCount >= limit;
    }

    /**
     * Get resource usage percentage
     * @param {Object} plan - Subscription plan object
     * @param {string} resourceType - Type of resource
     * @param {number} currentCount - Current count of resource
     * @returns {number} Usage percentage (0-100)
     */
    getResourceUsagePercentage(plan, resourceType, currentCount) {
        if (!plan) return 100;

        const limitMap = {
            'cars': plan.maxCars,
            'users': plan.maxUsers,
            'customers': plan.maxCustomers,
            'reservations': plan.maxReservations
        };

        const limit = limitMap[resourceType.toLowerCase()];
        if (limit <= 0) return 0; // Unlimited

        return Math.min(100, Math.round((currentCount / limit) * 100));
    }

    // ===== ERROR HANDLING =====

    /**
     * Handle API errors and provide user-friendly messages
     * @param {Error} error - Error object
     * @returns {Error} Processed error with user-friendly message
     */
    handleError(error) {
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    return new Error(data?.message || 'Invalid subscription request');
                case 401:
                    return new Error('You are not authorized to perform this action');
                case 403:
                    return new Error('Access denied. Please check your permissions');
                case 404:
                    return new Error('Subscription or plan not found');
                case 409:
                    return new Error('Subscription conflict. Please refresh and try again');
                case 500:
                    return new Error('Server error. Please try again later');
                default:
                    return new Error(data?.message || 'An unexpected error occurred');
            }
        }

        return new Error('Network error. Please check your connection and try again');
    }

    // ===== VALIDATION HELPERS =====

    /**
     * Validate subscription creation data
     * @param {Object} data - Subscription data to validate
     * @returns {Array} Array of validation errors
     */
    validateSubscriptionData(data) {
        const errors = [];

        if (!data.planId) {
            errors.push('Plan ID is required');
        }

        // Validate GUID format
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (data.planId && !guidRegex.test(data.planId)) {
            errors.push('Invalid plan ID format');
        }

        return errors;
    }

    /**
     * Validate agency ID
     * @param {string} agencyId - Agency ID to validate
     * @returns {boolean} Whether agency ID is valid
     */
    validateAgencyId(agencyId) {
        if (!agencyId) return false;

        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return guidRegex.test(agencyId);
    }
}

// Export singleton instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;