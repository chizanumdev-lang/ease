import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { secureStorage } from './storage.service';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await secureStorage.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await secureStorage.getRefreshToken();
                if (refreshToken) {
                    // TODO: Implement token refresh endpoint
                    // For now, just clear tokens and redirect to login
                    await secureStorage.clearTokens();
                }
            } catch (refreshError) {
                await secureStorage.clearTokens();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
