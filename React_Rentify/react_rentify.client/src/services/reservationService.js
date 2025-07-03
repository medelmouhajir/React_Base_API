import apiClient from './apiClient';

export const reservationService = {
    async getAll() {
        try {
            const response = await apiClient.get('/reservations');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all reservations:', error);
            throw error;
        }
    },

    async getById(id) {
        try {
            const response = await apiClient.get(`/reservations/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching reservation with ID ${id}:`, error);
            throw error;
        }
    },

    async getAvailableCars(startDate, endDate, currentCarId) {
        try {
            const dataSend = {
                start: startDate,
                end: endDate,
                carId: currentCarId
            };
            const response = await apiClient.get(
                '/reservations/getAvailableCars',
                { params: dataSend }         // ← send your data here
            );
            return response.data;
        } catch (error) {
            console.error(
                `❌ Error fetching getAvailableCars with car ID ${currentCarId}:`,
                error
            );
            throw error;
        }
    },

    async updateReservationCar(reservationId, carId) {
        try {
            const response = await apiClient.patch(`/reservations/${reservationId}/car`, { carId });
            console.log(`✅ Successfully updated car for reservation ${reservationId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating car for reservation ${reservationId}:`, error);
            throw error;
        }
    },

    // Method to update only the dates of a reservation
    async updateReservationDates(reservationId, datesData) {
        try {
            const response = await apiClient.patch(`/reservations/${reservationId}/dates`, datesData);
            console.log(`✅ Successfully updated dates for reservation ${reservationId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating dates for reservation ${reservationId}:`, error);
            throw error;
        }
    },

    // Method to deliver a car (existing method - for reference)
    async deliverCar(reservationId, deliveryData) {
        try {
            const response = await apiClient.post(`/reservations/${reservationId}/deliver`, deliveryData);
            console.log(`✅ Successfully delivered car for reservation ${reservationId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error delivering car for reservation ${reservationId}:`, error);
            throw error;
        }
    },

    // Method to return a car (existing method - for reference)
    async returnCar(reservationId, returnData) {
        try {
            console.log(returnData);
            const response = await apiClient.post(`/reservations/${reservationId}/return`, returnData);
            console.log(`✅ Successfully returned car for reservation ${reservationId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error returning car for reservation ${reservationId}:`, error);
            throw error;
        }
    },

    async getByAgencyId(agencyId) {
        try {
            const response = await apiClient.get(`/reservations/agency/${agencyId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching reservations for agency ${agencyId}:`, error);
            throw error;
        }
    },

    async getByCustomerId(customerId) {
        try {
            const response = await apiClient.get(`/reservations/customer/${customerId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching reservations for customer ${customerId}:`, error);
            throw error;
        }
    },

    async addCustomerToReservation(reservationId, customerId) {
        try {
            console.log(customerId);
            const response = await apiClient.post(`/reservations/${reservationId}/customers/${customerId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error adding customer to reservation ${reservationId}:`, error);
            throw error;
        }
    },

    async removeCustomerFromReservation(reservationId, customerId) {
        try {
            const response = await apiClient.delete(`/reservations/${reservationId}/customers/${customerId}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error removing customer from reservation ${reservationId}:`, error);
            throw error;
        }
    },

    async create(reservationData) {
        try {
            const response = await apiClient.post('/reservations', reservationData);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating reservation:', error);
            throw error;
        }
    },

    async update(id, reservationData) {
        try {
            if (id !== reservationData.id) {
                throw new Error('The ID in the URL does not match the reservationData.id');
            }

            const response = await apiClient.put(`/reservations/${id}`, reservationData);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating reservation with ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await apiClient.delete(`/reservations/${id}`);
            return response.status === 204;
        } catch (error) {
            console.error(`❌ Error deleting reservation with ID ${id}:`, error);
            throw error;
        }
    },
};

export default reservationService;
