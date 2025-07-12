// src/services/ticketService.js

import apiClient from './apiClient';

export const ticketService = {
    async getAll() {
        try {
            const response = await apiClient.get('/tickets');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all tickets:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/tickets/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching ticket with ID ${id}:`, error);
            throw error;
        }
    },

    async create(ticketData) {
        try {
            const response = await apiClient.post('/tickets', ticketData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating ticket:', error);
            throw error;
        }
    },

    async update(id, ticketData) {
        try {
            if (id !== ticketData.id) {
                throw new Error("The ID in the URL does not match ticketData.id");
            }
            const response = await apiClient.put(`/tickets/${id}`, ticketData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating ticket with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/tickets/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting ticket with ID ${id}:`, error);
            throw error;
        }
    }
};

export default ticketService;
