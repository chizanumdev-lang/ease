import { supabase } from './supabase';
import api from './api';
import { API_ENDPOINTS } from '../constants/config';
import { secureStorage, mmkvStorage } from './storage.service';
import type { Session } from '@supabase/supabase-js';

/**
 * Extracts and stores tokens from a Supabase session.
 */
async function storeSession(session: Session): Promise<void> {
    await secureStorage.setAccessToken(session.access_token);
    await secureStorage.setRefreshToken(session.refresh_token);
}

export const authService = {
    /**
     * Sign up via Supabase Auth directly.
     * Supabase sends a confirmation email; user must confirm before they can log in.
     */
    async signup(email: string, password: string, name: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) {
            throw { response: { data: { message: error.message } } };
        }

        // If email confirmations are disabled, we get a session immediately
        if (data.session) {
            await storeSession(data.session);
        }

        return {
            user: {
                id: data.user?.id,
                email: data.user?.email,
                name: data.user?.user_metadata?.name ?? name,
                settings: {},
            },
            accessToken: data.session?.access_token ?? null,
            refreshToken: data.session?.refresh_token ?? null,
            requiresConfirmation: !data.session, // true if confirmation email was sent
        };
    },

    /**
     * Sign in with email + password via Supabase Auth.
     */
    async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw { response: { data: { message: error.message } } };
        }

        if (!data.session || !data.user) {
            throw { response: { data: { message: 'Login failed — no session returned' } } };
        }

        await storeSession(data.session);

        // Fetch public user profile from NestJS (includes settings, isAdmin, etc.)
        let userProfile: any = null;
        try {
            const resp = await api.get(API_ENDPOINTS.ME, {
                headers: { Authorization: `Bearer ${data.session.access_token}` },
            });
            userProfile = resp.data;
        } catch {
            // Fallback to Supabase user metadata if NestJS is unreachable
            userProfile = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name ?? email.split('@')[0],
                settings: {},
            };
        }

        mmkvStorage.setUser(userProfile);

        return {
            user: userProfile,
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
        };
    },

    /**
     * Refresh session using the stored Supabase refresh token.
     */
    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error || !data.session) {
            throw { response: { data: { message: 'Session refresh failed' } } };
        }

        await storeSession(data.session);

        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
        };
    },

    /**
     * Sign out — clears Supabase session and local storage.
     */
    async logout(): Promise<void> {
        await supabase.auth.signOut();
        await secureStorage.clearTokens();
        mmkvStorage.clearAll();
    },

    /**
     * Get current user profile from NestJS API.
     */
    async getCurrentUser() {
        const response = await api.get(API_ENDPOINTS.ME);
        return response.data;
    },

    /**
     * Update user settings via NestJS API.
     */
    async updateSettings(settings: any) {
        const response = await api.patch(API_ENDPOINTS.UPDATE_SETTINGS, { settings });
        return response.data;
    },

    /**
     * Resend Supabase signup confirmation email.
     */
    async resendVerificationCode(email: string): Promise<void> {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });
        if (error) {
            throw { response: { data: { message: error.message } } };
        }
    },
};
