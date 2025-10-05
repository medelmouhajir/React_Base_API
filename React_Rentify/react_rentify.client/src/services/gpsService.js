import apiClient from './apiClient';

export const gpsService = {
    // 📍 DEVICES

    async getAllDevices() {
        try {
            const response = await apiClient.get('/gps/devices');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching GPS devices:', error);
            throw error;
        }
    },

    async getDeviceBySerial(serialNumber) {
        try {
            const response = await apiClient.get(`/gps/devices/${serialNumber}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching GPS device with serial ${serialNumber}:`, error);
            throw error;
        }
    },

    async addDevice(deviceData) {
        try {
            const response = await apiClient.post('/gps/devices', deviceData);
            return response.data;
        } catch (error) {
            console.error('❌ Error adding GPS device:', error);
            throw error;
        }
    },

    // 📍 LOCATION RECORDS

    async getAllRecords() {
        try {
            const response = await apiClient.get('/gps/records');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching GPS records:', error);
            throw error;
        }
    },

    async getRecordsByDevice(serialNumber) {
        try {
            const response = await apiClient.get(`/gps/records/device/${serialNumber}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching records for device ${serialNumber}:`, error);
            throw error;
        }
    },

    async getLatestRecordBySerial(serialNumber) {
        try {
            const response = await apiClient.get(`/gps/records/latest/${serialNumber}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching latest record for device ${serialNumber}:`, error);
            throw error;
        }
    },

    async getCarsByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/cars/gps/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching cars for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async updateCarGps(carId, gpsData) {
        console.warn(gpsData);
        try {
            const response = await apiClient.put(`/gps/cars/${carId}`, gpsData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating GPS for car ${carId}:`, error);
            throw error;
        }
    },

    async getCarsByAgencyWithGps(agencyId) {
        try {
            const response = await apiClient.get(`/gps/cars/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching cars with GPS for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async getCarsWithGps() {
        try {
            const response = await apiClient.get(`/gps/cars/all`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching cars with GPS for all agencies:`, error);
            throw error;
        }
    },
};

export default gpsService;
