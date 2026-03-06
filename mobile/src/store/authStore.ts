import { create } from 'zustand';
import { User, AuthResponse } from '../types';
import { authService } from '../services/auth.service';
import { secureStorage, mmkvStorage } from '../services/storage.service';
import { useProgramsStore } from './programsStore';
import { useGoalsStore } from './goalsStore';
import { useAudioStore } from './audioStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => Promise<void>;
    updateSettings: (settings: any) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.login(email, password);
            await secureStorage.setAccessToken(response.accessToken);
            await secureStorage.setRefreshToken(response.refreshToken);
            await mmkvStorage.setUser(response.user);
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Login failed',
                isLoading: false,
            });
            throw error;
        }
    },

    signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
            console.log('[AUTH] Starting signup...');
            const response = await authService.signup(email, password, name);
            console.log('[AUTH] Signup response:', { user: response.user, hasSettings: !!response.user.settings });
            await secureStorage.setAccessToken(response.accessToken);
            await secureStorage.setRefreshToken(response.refreshToken);
            console.log('[AUTH] Tokens stored, NOT caching user yet');
            // Don't cache user yet - they need to complete onboarding first
            set({
                user: {
                    ...response.user,
                    settings: {
                        notifications: {
                            taskReminders: true,
                            nightAudio: true,
                            weeklySummary: true,
                        }
                    }
                },
                isAuthenticated: true,
                isLoading: false,
            });
            console.log('[AUTH] State updated - isAuthenticated: true, user has no cached data');
        } catch (error: any) {
            console.error('[AUTH] Signup failed:', error);
            let errorMessage = 'Signup failed';

            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.message || 'Signup failed';
            } else if (error.request) {
                // Request made but no response (Network error)
                errorMessage = 'Network error. Please check your connection and try again.';
            } else {
                errorMessage = error.message || 'Something went wrong';
            }

            set({
                error: errorMessage,
                isLoading: false,
            });
            throw error;
        }
    },

    logout: async () => {
        await authService.logout();
        // Reset in-memory stores immediately
        useProgramsStore.getState().reset();
        useGoalsStore.getState().reset();
        useAudioStore.getState().reset();
        // Wipe persisted Zustand caches so the next user starts fresh
        await AsyncStorage.multiRemove([
            'programs-storage',
            'goals-storage',
            'audio-storage',
        ]);
        set({
            user: null,
            isAuthenticated: false,
            error: null,
        });
    },

    loadUser: async () => {
        console.log('[AUTH] loadUser called');
        set({ isLoading: true });
        try {
            const token = await secureStorage.getAccessToken();
            console.log('[AUTH] Has token:', !!token);
            if (token) {
                const cachedUser = await mmkvStorage.getUserAsync();
                console.log('[AUTH] Cached user:', cachedUser ? 'found' : 'not found');
                if (cachedUser) {
                    console.log('[AUTH] Using cached user, onboardingCompleted:', cachedUser.settings?.onboardingCompleted);
                    set({
                        user: cachedUser,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    // No cached user but has token - fetch from API
                    console.log('[AUTH] Fetching user from API...');
                    const user = await authService.getCurrentUser();
                    console.log('[AUTH] Fetched user from API, onboardingCompleted:', user.settings?.onboardingCompleted);
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                }
            } else {
                console.log('[AUTH] No token, user not authenticated');
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('[AUTH] loadUser error:', error);
            set({ isLoading: false });
        }
    },

    updateSettings: async (settings) => {
        set({ isLoading: true, error: null });
        try {
            const updatedUser = await authService.updateSettings(settings);
            // Cache user after onboarding completion
            await mmkvStorage.setUser(updatedUser);
            set({
                user: updatedUser,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to update settings',
                isLoading: false,
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
