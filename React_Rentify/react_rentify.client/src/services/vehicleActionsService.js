// src/services/vehicleActionsService.js
import apiClient from './apiClient';

const vehicleActionsService = {
    /**
     * Control vehicle ignition (turn on/off)
     * @param {string} deviceId - GPS device ID
     * @param {boolean} turnOn - true to turn on, false to turn off
     */
    async controlIgnition(deviceId, turnOn) {
        try {
            console.log(`🔧 ${turnOn ? 'Starting' : 'Stopping'} ignition for device ${deviceId}`);
            const response = await apiClient.post(`/IgnitionControl/${deviceId}/ignition`, {
                turnOn: turnOn
            });
            console.log(`✅ Ignition control successful:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ Error controlling ignition for device ${deviceId}:`, error);
            throw error;
        }
    },

    /**
     * Get device status
     * @param {string} deviceId - GPS device ID
     */
    async getDeviceStatus(deviceId) {
        try {
            console.log(`📊 Getting status for device ${deviceId}`);
            const response = await apiClient.get(`/IgnitionControl/${deviceId}/status`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error getting device status for ${deviceId}:`, error);
            throw error;
        }
    },

    /**
     * Lock vehicle (placeholder - implement based on your GPS system capabilities)
     * @param {string} deviceId - GPS device ID
     */
    async lockVehicle(deviceId) {
        try {
            console.log(`🔒 Locking vehicle with device ${deviceId}`);
            // Implement actual lock command based on your GPS system
            // This is a placeholder implementation
            return {
                success: true,
                message: 'Lock command sent successfully',
                commandSent: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`❌ Error locking vehicle ${deviceId}:`, error);
            throw error;
        }
    },

    /**
     * Unlock vehicle (placeholder - implement based on your GPS system capabilities)
     * @param {string} deviceId - GPS device ID
     */
    async unlockVehicle(deviceId) {
        try {
            console.log(`🔓 Unlocking vehicle with device ${deviceId}`);
            // Implement actual unlock command based on your GPS system
            // This is a placeholder implementation
            return {
                success: true,
                message: 'Unlock command sent successfully',
                commandSent: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`❌ Error unlocking vehicle ${deviceId}:`, error);
            throw error;
        }
    },

    /**
     * Locate vehicle (request current position update)
     * @param {string} vehicleId - Vehicle ID
     */
    async locateVehicle(vehicleId) {
        try {
            console.log(`📍 Requesting location update for vehicle ${vehicleId}`);
            // Use existing GPS service to get latest position
            const response = await apiClient.get(`/gps/vehicles/${vehicleId}/latest`);
            return {
                success: true,
                message: 'Location retrieved successfully',
                data: response.data,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`❌ Error locating vehicle ${vehicleId}:`, error);
            throw error;
        }
    },

    /**
     * Execute vehicle action based on action type
     * @param {Object} vehicle - Vehicle object
     * @param {string} actionType - Type of action (ignition_on, ignition_off, lock, unlock, locate)
     */
    async executeVehicleAction(vehicle, actionType) {
        if (!vehicle) {
            throw new Error('Vehicle is required');
        }

        const deviceId = vehicle.deviceSerialNumber || vehicle.id;
        const vehicleId = vehicle.id || vehicle.vehicleId;

        switch (actionType) {
            case 'ignition_on':
                return await this.controlIgnition(deviceId, true);

            case 'ignition_off':
                return await this.controlIgnition(deviceId, false);

            case 'lock':
                return await this.lockVehicle(deviceId);

            case 'unlock':
                return await this.unlockVehicle(deviceId);

            case 'locate':
                return await this.locateVehicle(vehicleId);

            default:
                throw new Error(`Unknown action type: ${actionType}`);
        }
    }
};

export default vehicleActionsService;