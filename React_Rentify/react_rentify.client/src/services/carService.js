import apiClient from './apiClient';

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

    async getByAgencyIdAndDates(agencyId, startDate, endDate) {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await apiClient.get(`/cars/agency/${agencyId}/available?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching available cars for agency ${agencyId} between ${startDate} and ${endDate}:`, error);
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
            const formData = new FormData();

            // Add car data as JSON string or individual fields
            formData.append('AgencyId', carData.AgencyId);
            formData.append('Car_ModelId', carData.Car_ModelId);
            formData.append('Car_YearId', carData.Car_YearId);
            formData.append('LicensePlate', carData.LicensePlate);
            formData.append('Color', carData.Color);
            formData.append('DailyRate', carData.DailyRate);
            if (carData.HourlyRate) {
                formData.append('HourlyRate', carData.HourlyRate);
            }
            formData.append('Gear_Type', carData.Gear_Type);
            formData.append('Engine_Type', carData.Engine_Type);

            const response = await apiClient.post('/cars', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error creating car with images:', error);
            throw error;
        }
    },

    async createWithImages(carData, images, mainImageIndex = 0) {
        try {
            const formData = new FormData();

            // Add car data as JSON string or individual fields
            formData.append('AgencyId', carData.AgencyId);
            formData.append('Car_ModelId', carData.Car_ModelId);
            formData.append('Car_YearId', carData.Car_YearId);
            formData.append('LicensePlate', carData.LicensePlate);
            formData.append('Color', carData.Color);
            formData.append('DailyRate', carData.DailyRate);
            if (carData.HourlyRate) {
                formData.append('HourlyRate', carData.HourlyRate);
            }
            formData.append('Gear_Type', carData.Gear_Type);
            formData.append('Engine_Type', carData.Engine_Type);

            // Add images
            images.forEach((image, index) => {
                formData.append(`Images[${index}].Image`, image);
                formData.append(`Images[${index}].IsMain`, index === mainImageIndex);
            });

            const response = await apiClient.post('/cars', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error creating car with images:', error);
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
    },
    async updateCarGps(carId, gpsData) {
        try {
            const response = await apiClient.put(`/gps/cars/${carId}`, gpsData);
            console.log(`✅ Successfully updated GPS settings for car ${carId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating GPS settings for car ${carId}:`, error);
            throw error;
        }
    },
};

export default carService;
