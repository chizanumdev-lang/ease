import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { secureStorage, mmkvStorage } from './storage.service';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Global logout callback — set by the authStore once it's initialised.
 * This lets the API layer trigger a proper logout without importing the store
 * directly (which would create a circular dependency).
 */
let onUnauthorized: (() => void) | null = null;

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
            } else {
                console.warn(`[API] No token found for route: ${config.url} — user may need to re-login`);
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

        // 404 is an expected "empty state", not a real error
        if (status === 404) {
            console.warn(`[API] 404 Not Found: ${originalRequest?.url}`);
            return Promise.reject(error);
        }

        // For all other errors, log at error level
        console.error(`[API] Response Error: ${status} from ${originalRequest?.url}`);

        // Handle 401 — token expired or invalid
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await secureStorage.getRefreshToken();
                if (refreshToken) {
                    console.log('[API] Attempting to refresh token...');
                    
                    // Call refresh endpoint directly to avoid circular dependency with authService
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` }
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    
                    // Store new tokens
                    await secureStorage.setAccessToken(accessToken);
                    await secureStorage.setRefreshToken(newRefreshToken);

                    console.log('[API] Token refreshed successfully. Retrying original request.');

                    // Update the original request's auth header and retry
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('[API] Token refresh failed:', refreshError);
                
                // Only logout if refresh actually fails
                console.warn('[API] Refresh failed — clearing tokens and logging out.');
                await secureStorage.clearTokens();
                await mmkvStorage.clearAll();

                if (onUnauthorized) {
                    onUnauthorized();
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
