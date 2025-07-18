﻿import apiClient from './apiClient';

export const carService = {
    async getAll() {
        try {
            const response = await apiClient.get('/cars');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all cars:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/cars/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching car with ID ${id}:`, error);
            throw error;
        }
    },

    async getByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/cars/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching cars for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async checkCarReservationsByDate(carId, date) {
        try {
            const response = await apiClient.get(`/cars/${carId}/reservations/date/${date}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error checking car reservations for ${carId} on ${date}:`, error);
            throw error;
        }
    },

    async create(carData) {
        try {
            const response = await apiClient.post('/cars', carData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating car:', error);
            throw error;
        }
    },

    async update(id, carData) {
        try {
            if (id !== carData.id) {
                throw new Error("The ID in the URL does not match the carData.id");
            }

            const response = await apiClient.put(`/cars/${id}`, carData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating car with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/cars/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting car with ID ${id}:`, error);
            throw error;
        }
    },

    async addAttachment(carId, attachmentData) {
        try {
            const response = await apiClient.post(`/cars/${carId}/attachments`, attachmentData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error adding attachment to car ID ${carId}:`, error);
            throw error;
        }
    }
};

export default carService;
