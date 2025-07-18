import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5080';

class AuthService {
    constructor() {
        this.api = axios.create({
            baseURL: `${API_BASE_URL}/api`,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Request interceptor to add auth token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('identity_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle auth errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.removeAuthToken();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    async login(email, password) {
        return this.api.post('/accounts/login', { email, password });
    }

    async register(email, password, fullName, companyName) {
        return this.api.post('/accounts', {
            email,
            password,
            fullName,
            companyName
        });
    }

    async getProfile(accountId) {
        return this.api.get(`/accounts/${accountId}`);
    }

    async updateProfile(accountId, data) {
        return this.api.patch(`/accounts/${accountId}`, data);
    }

    setAuthToken(token) {
        if (token) {
            this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }

    removeAuthToken() {
        delete this.api.defaults.headers.common['Authorization'];
        localStorage.removeItem('identity_token');
        localStorage.removeItem('identity_user');
    }
}

export const authService = new AuthService();