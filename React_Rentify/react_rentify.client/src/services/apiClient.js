import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5249';

const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000,
});

// Request Interceptor: Attach token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 + token refresh logic if needed
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            localStorage.getItem('authToken')
        ) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh-token`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                        },
                    }
                );

                const { token: newToken, expiresAt } = refreshResponse.data;
                localStorage.setItem('authToken', newToken);
                localStorage.setItem('tokenExpiry', expiresAt);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('tokenExpiry');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
