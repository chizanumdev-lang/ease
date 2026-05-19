import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { secureStorage, mmkvStorage } from './storage.service';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 180000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Global logout callback — set by the authStore once it's initialised.
 * This lets the API layer trigger a proper logout without importing the store
 * directly (which would create a circular dependency).
 */
// Global logout callback
let onUnauthorized: (() => void) | null = null;

// Queue for multiple 401s
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

export const setUnauthorizedHandler = (handler: () => void) => {
    onUnauthorized = handler;
};

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        // Don't add token for auth routes
        const isAuthRoute = config.url?.includes('/auth/signup') || config.url?.includes('/auth/login');

        if (!isAuthRoute) {
            const token = await secureStorage.getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        console.error('[API] Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (status === 404) return Promise.reject(error);

        // Handle 401 — token expired or invalid
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = await secureStorage.getRefreshToken();
                if (refreshToken) {
                    console.log(`[API] Refreshing token for ${originalRequest.url}...`);
                    
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` }
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    
                    await secureStorage.setAccessToken(accessToken);
                    await secureStorage.setRefreshToken(newRefreshToken);

                    console.log(`[API] Refresh success. Retrying ${originalRequest.url}`);
                    
                    isRefreshing = false;
                    onRefreshed(accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                isRefreshing = false;
                console.error('[API] Refresh failed — logging out.');
                await secureStorage.clearTokens();
                await mmkvStorage.clearAll();
                if (onUnauthorized) onUnauthorized();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
