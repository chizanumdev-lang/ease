import api from './api';
import { API_ENDPOINTS } from '../constants/config';
import { AuthResponse } from '../types';
import { secureStorage, mmkvStorage } from './storage.service';

export const authService = {
    async signup(email: string, password: string, name: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>(API_ENDPOINTS.SIGNUP, {
            email,
            password,
            name,
        });

        // Store tokens and user
        await secureStorage.setAccessToken(response.data.accessToken);
        await secureStorage.setRefreshToken(response.data.refreshToken);
        mmkvStorage.setUser(response.data.user);

        return response.data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>(API_ENDPOINTS.LOGIN, {
            email,
            password,
        });

        // Store tokens and user
        await secureStorage.setAccessToken(response.data.accessToken);
        await secureStorage.setRefreshToken(response.data.refreshToken);
        mmkvStorage.setUser(response.data.user);

        return response.data;
    },

    async logout(): Promise<void> {
        await secureStorage.clearTokens();
        mmkvStorage.clearAll();
    },

    async getCurrentUser() {
        const response = await api.get(API_ENDPOINTS.ME);
        return response.data;
    },

    async updateSettings(settings: any) {
        const response = await api.patch(API_ENDPOINTS.UPDATE_SETTINGS, { settings });
        return response.data;
    },
};
