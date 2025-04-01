// src/services/appointmentService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5267';

/**
 * Service for handling appointment-related API calls
 */
class AppointmentService {
    /**
     * Get auth header with JWT token
     */
    getAuthHeader() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    }

    /**
     * Helper method to handle API responses and provide detailed error information
     */
    async handleResponse(response, url) {
        console.log(`API Response [${response.status}]:`, url);

        if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `Server error: ${response.status}`;

            try {
                const contentType = response.headers.get('content-type');

                // Check if response is JSON
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    console.error('Error response:', errorData);

                    // Extract error message from different possible formats
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.errors) {
                        // Handle validation errors
                        const validationErrors = Object.values(errorData.errors).flat();
                        errorMessage = validationErrors.join(', ');
                    } else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    }
                } else {
                    // If not JSON, try to get text content
                    const text = await response.text();
                    if (text) {
                        console.error('Non-JSON error response:', text.substring(0, 500));

                        // Try to extract error from HTML response
                        const titleMatch = text.match(/<title>(.*?)<\/title>/);
                        if (titleMatch && titleMatch[1]) {
                            errorMessage = titleMatch[1];
                        }
                    }
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    }

    /**
     * Get all appointments or appointments by firm
     */
    async getAppointments() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const url = user?.lawFirmId ?
                `${API_URL}/api/appointments/byfirm/${user.lawFirmId}` :
                `${API_URL}/api/appointments`;

            console.log('Fetching appointments from URL:', url);
            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in getAppointments:', error);
            throw error;
        }
    }

    /**
     * Get appointment by ID
     */
    async getAppointmentById(id) {
        try {
            const url = `${API_URL}/api/appointments/${id}`;
            console.log(`Fetching appointment details for ID ${id} from URL:`, url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getAppointmentById(${id}):`, error);
            throw error;
        }
    }

    /**
     * Get upcoming appointments
     */
    async getUpcomingAppointments() {
        try {
            const url = `${API_URL}/api/appointments/upcoming`;
            console.log('Fetching upcoming appointments from URL:', url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in getUpcomingAppointments:', error);
            throw error;
        }
    }

    /**
     * Get appointments by lawyer
     */
    async getAppointmentsByLawyer(lawyerId) {
        try {
            const url = `${API_URL}/api/appointments/bylawyer/${lawyerId}`;
            console.log(`Fetching appointments for lawyer ID ${lawyerId} from URL:`, url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getAppointmentsByLawyer(${lawyerId}):`, error);
            throw error;
        }
    }

    /**
     * Get appointments by client
     */
    async getAppointmentsByClient(clientId) {
        try {
            const url = `${API_URL}/api/appointments/byclient/${clientId}`;
            console.log(`Fetching appointments for client ID ${clientId} from URL:`, url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getAppointmentsByClient(${clientId}):`, error);
            throw error;
        }
    }

    /**
     * Get appointments by case
     */
    async getAppointmentsByCase(caseId) {
        try {
            const url = `${API_URL}/api/appointments/bycase/${caseId}`;
            console.log(`Fetching appointments for case ID ${caseId} from URL:`, url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getAppointmentsByCase(${caseId}):`, error);
            throw error;
        }
    }

    /**
     * Get appointments by date
     */
    async getAppointmentsByDate(date) {
        try {
            const formattedDate = date instanceof Date ? date.toISOString().split('T')[0] : date;
            const url = `${API_URL}/api/appointments/date/${formattedDate}`;
            console.log(`Fetching appointments for date ${formattedDate} from URL:`, url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in getAppointmentsByDate(${date}):`, error);
            throw error;
        }
    }

    /**
     * Create a new appointment
     */
    async createAppointment(appointmentData) {


        const appointmentTypeMap = {
            'Consultation': 0,
            'ClientMeeting': 1,
            'CourtHearing': 2,
            'Deposition': 3,
            'Mediation': 4,
            'InternalMeeting': 5,
            'PhoneCall': 6,
            'Other': 10
        };
        const sanitizedData = {
            ...appointmentData,
            // Convert string type to numeric enum
            type: appointmentTypeMap[appointmentData.type] !== undefined ? appointmentTypeMap[appointmentData.type] : 0,
            startTime: appointmentData.startTime
                ? new Date(appointmentData.startTime).toISOString()
                : null,
            endTime: appointmentData.endTime
                ? new Date(appointmentData.endTime).toISOString()
                : null,
        };


        try {
            const url = `${API_URL}/api/appointments`;
            console.log('Creating new appointment with data:', appointmentData);
            console.log('Creating new appointment with sanitized data:', sanitizedData);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(sanitizedData)
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in createAppointment:', error);
            throw error;
        }
    }

    /**
     * Update an existing appointment
     */
    async updateAppointment(id, appointmentData) {
        try {
            const url = `${API_URL}/api/appointments/${id}`;
            console.log(`Updating appointment with ID ${id} with data:`, appointmentData);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(appointmentData)
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in updateAppointment(${id}):`, error);
            throw error;
        }
    }

    /**
     * Update appointment status
     */
    async updateAppointmentStatus(id, newStatus) {
        try {
            const url = `${API_URL}/api/appointments/${id}/status`;
            console.log(`Updating status for appointment ID ${id} to "${newStatus}"`);

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify({
                    newStatus
                })
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in updateAppointmentStatus(${id}, "${newStatus}"):`, error);
            throw error;
        }
    }

    /**
     * Delete an appointment
     */
    async deleteAppointment(id) {
        try {
            const url = `${API_URL}/api/appointments/${id}`;
            console.log(`Deleting appointment with ID ${id}`);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error(`Error in deleteAppointment(${id}):`, error);
            throw error;
        }
    }

    /**
     * Check if a lawyer is available at a specific time
     */
    async checkLawyerAvailability(lawyerId, startTime, endTime, excludeAppointmentId = null) {
        try {
            let url = `${API_URL}/api/appointments/checkAvailability?lawyerId=${lawyerId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;

            if (excludeAppointmentId) {
                url += `&excludeAppointmentId=${excludeAppointmentId}`;
            }

            console.log(`Checking lawyer availability from URL:`, url);

            const response = await fetch(url, {
                headers: this.getAuthHeader()
            });

            return await this.handleResponse(response, url);
        } catch (error) {
            console.error('Error in checkLawyerAvailability:', error);
            throw error;
        }
    }
}

export default new AppointmentService();