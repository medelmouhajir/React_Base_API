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
            console.warn(carData);

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


            formData.append('CurrentKM', carData.CurrentKM);

            // Add the legal document fields if they exist
            if (carData.AssuranceName) {
                formData.append('AssuranceName', carData.AssuranceName);
            }
            if (carData.AssuranceStartDate) {
                formData.append('AssuranceStartDate', carData.AssuranceStartDate);
            }
            if (carData.AssuranceEndDate) {
                formData.append('AssuranceEndDate', carData.AssuranceEndDate);
            }
            if (carData.TechnicalVisitStartDate) {
                formData.append('TechnicalVisitStartDate', carData.TechnicalVisitStartDate);
            }
            if (carData.TechnicalVisitEndDate) {
                formData.append('TechnicalVisitEndDate', carData.TechnicalVisitEndDate);
            }

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
            console.warn(carData);
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

            formData.append('CurrentKM', carData.CurrentKM);

            // Add the legal document fields if they exist
            if (carData.AssuranceName) {
                formData.append('AssuranceName', carData.AssuranceName);
            }
            if (carData.AssuranceStartDate) {
                formData.append('AssuranceStartDate', carData.AssuranceStartDate);
            }
            if (carData.AssuranceEndDate) {
                formData.append('AssuranceEndDate', carData.AssuranceEndDate);
            }
            if (carData.TechnicalVisitStartDate) {
                formData.append('TechnicalVisitStartDate', carData.TechnicalVisitStartDate);
            }
            if (carData.TechnicalVisitEndDate) {
                formData.append('TechnicalVisitEndDate', carData.TechnicalVisitEndDate);
            }

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

    /**
     * Update insurance information for a specific car
     * @param {string} carId - The ID of the car
     * @param {Object} insuranceData - The insurance data to update
     * @param {string} insuranceData.assuranceName - Insurance company name
     * @param {string} insuranceData.assuranceStartDate - Insurance start date (YYYY-MM-DD)
     * @param {string} insuranceData.assuranceEndDate - Insurance end date (YYYY-MM-DD)
     * @returns {Promise<Object>} - The response data
     */
    async updateInsurance(carId, insuranceData) {
        try {
            console.log(`🔄 Updating insurance information for car ${carId}...`);

            // Prepare the data payload
            const payload = {
                assuranceName: insuranceData.assuranceName || null,
                assuranceStartDate: insuranceData.assuranceStartDate || null,
                assuranceEndDate: insuranceData.assuranceEndDate || null
            };

            const response = await apiClient.put(`/cars/${carId}/insurance`, payload);

            console.log(`✅ Successfully updated insurance information for car ${carId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating insurance information for car ${carId}:`, error);

            // Enhanced error handling
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Unknown error';

                switch (status) {
                    case 400:
                        throw new Error(`Validation error: ${message}`);
                    case 401:
                        throw new Error('You are not authorized to update this car\'s insurance information');
                    case 404:
                        throw new Error('Car not found');
                    case 500:
                        throw new Error('Server error occurred while updating insurance information');
                    default:
                        throw new Error(`Failed to update insurance information: ${message}`);
                }
            }

            throw new Error('Network error occurred while updating insurance information');
        }
    },

    /**
     * Update technical visit information for a specific car
     * @param {string} carId - The ID of the car
     * @param {Object} technicalVisitData - The technical visit data to update
     * @param {string} technicalVisitData.technicalVisitStartDate - Technical visit start date (YYYY-MM-DD)
     * @param {string} technicalVisitData.technicalVisitEndDate - Technical visit end date (YYYY-MM-DD)
     * @returns {Promise<Object>} - The response data
     */
    async updateTechnicalVisit(carId, technicalVisitData) {
        try {
            console.log(`🔄 Updating technical visit information for car ${carId}...`);

            // Prepare the data payload
            const payload = {
                technicalVisitStartDate: technicalVisitData.technicalVisitStartDate || null,
                technicalVisitEndDate: technicalVisitData.technicalVisitEndDate || null
            };

            const response = await apiClient.put(`/cars/${carId}/technical-visit`, payload);

            console.log(`✅ Successfully updated technical visit information for car ${carId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error updating technical visit information for car ${carId}:`, error);

            // Enhanced error handling
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Unknown error';

                switch (status) {
                    case 400:
                        throw new Error(`Validation error: ${message}`);
                    case 401:
                        throw new Error('You are not authorized to update this car\'s technical visit information');
                    case 404:
                        throw new Error('Car not found');
                    case 500:
                        throw new Error('Server error occurred while updating technical visit information');
                    default:
                        throw new Error(`Failed to update technical visit information: ${message}`);
                }
            }

            throw new Error('Network error occurred while updating technical visit information');
        }
    },

    /**
     * Get insurance expiry status for a car
     * @param {Object} car - The car object with insurance dates
     * @returns {Object} - Insurance status information
     */
    getInsuranceStatus(car) {
        if (!car.assuranceEndDate) {
            return { status: 'not_set', message: 'Insurance end date not set' };
        }

        const today = new Date();
        const endDate = new Date(car.assuranceEndDate);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                status: 'expired',
                message: 'Insurance has expired',
                daysOverdue: Math.abs(diffDays)
            };
        } else if (diffDays <= 30) {
            return {
                status: 'expiring_soon',
                message: 'Insurance expires soon',
                daysLeft: diffDays
            };
        } else {
            return {
                status: 'valid',
                message: 'Insurance is valid',
                daysLeft: diffDays
            };
        }
    },

    /**
     * Get technical visit expiry status for a car
     * @param {Object} car - The car object with technical visit dates
     * @returns {Object} - Technical visit status information
     */
    getTechnicalVisitStatus(car) {
        if (!car.technicalVisitEndDate) {
            return { status: 'not_set', message: 'Technical visit end date not set' };
        }

        const today = new Date();
        const endDate = new Date(car.technicalVisitEndDate);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                status: 'expired',
                message: 'Technical visit has expired',
                daysOverdue: Math.abs(diffDays)
            };
        } else if (diffDays <= 30) {
            return {
                status: 'expiring_soon',
                message: 'Technical visit expires soon',
                daysLeft: diffDays
            };
        } else {
            return {
                status: 'valid',
                message: 'Technical visit is valid',
                daysLeft: diffDays
            };
        }
    },

    /**
     * Get all cars with expired or expiring documents
     * @param {string} agencyId - The agency ID
     * @returns {Promise<Object>} - Cars with document expiry information
     */
    async getCarsWithExpiringDocuments(agencyId) {
        try {
            console.log(`🔄 Fetching cars with expiring documents for agency ${agencyId}...`);

            const cars = await this.getByAgencyId(agencyId);
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);

            const expiringCars = cars.filter(car => {
                const insuranceStatus = this.getInsuranceStatus(car);
                const technicalVisitStatus = this.getTechnicalVisitStatus(car);

                return insuranceStatus.status === 'expired' ||
                    insuranceStatus.status === 'expiring_soon' ||
                    technicalVisitStatus.status === 'expired' ||
                    technicalVisitStatus.status === 'expiring_soon';
            }).map(car => ({
                ...car,
                insuranceStatus: this.getInsuranceStatus(car),
                technicalVisitStatus: this.getTechnicalVisitStatus(car)
            }));

            console.log(`✅ Found ${expiringCars.length} cars with expiring documents`);
            return {
                cars: expiringCars,
                totalCount: expiringCars.length,
                expiredCount: expiringCars.filter(car =>
                    car.insuranceStatus.status === 'expired' ||
                    car.technicalVisitStatus.status === 'expired'
                ).length,
                expiringSoonCount: expiringCars.filter(car =>
                    car.insuranceStatus.status === 'expiring_soon' ||
                    car.technicalVisitStatus.status === 'expiring_soon'
                ).length
            };
        } catch (error) {
            console.error(`❌ Error fetching cars with expiring documents for agency ${agencyId}:`, error);
            throw error;
        }
    },
};

export default carService;
