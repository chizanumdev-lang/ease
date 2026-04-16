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
        // Don't add token for auth routes
        const isAuthRoute = config.url?.includes('/auth/signup') || config.url?.includes('/auth/login');
        
        console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`);

        if (!isAuthRoute) {
            const token = await secureStorage.getAccessToken();
            console.log(`[API] Token from storage: ${token ? (token.substring(0, 10) + '...') : 'NULL'}`);
            
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.warn(`[API] No token found for authenticated route: ${config.url}`);
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
        
        // 404 is an expected state (e.g. no active program), not a real error — log as warn
        if (error.response?.status === 404) {
            console.warn(`[API] 404 Not Found: ${originalRequest?.url}`);
            return Promise.reject(error);
        }

        console.error(`[API] Response Error: ${error.response?.status} from ${originalRequest?.url}`);

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.warn('[API] 401 Unauthorized - Attempting to handle...');

            try {
                const refreshToken = await secureStorage.getRefreshToken();
                if (refreshToken) {
                    console.log('[API] Refresh token found, but refresh logic is NOT implemented yet.');
                    // TODO: Implement token refresh endpoint
                    // For now, just clear tokens and redirect to login
                    console.error('[API] Clearing tokens and forcing re-auth.');
                    await secureStorage.clearTokens();
                } else {
                    console.error('[API] No refresh token available. Clearing session.');
                    await secureStorage.clearTokens();
                }
            } catch (refreshError) {
                console.error('[API] Error during refresh token handling:', refreshError);
                await secureStorage.clearTokens();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
