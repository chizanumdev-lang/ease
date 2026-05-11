import { create } from 'zustand';
import { User, AuthResponse } from '../types';
import { authService } from '../services/auth.service';
import { secureStorage, mmkvStorage } from '../services/storage.service';
import { useProgramsStore } from './programsStore';
import { useGoalsStore } from './goalsStore';
import { useAudioStore } from './audioStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from '../services/api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean; // For initial app load
    isSubmitting: boolean; // For auth actions
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: (forceRefresh?: boolean) => Promise<void>;
    updateSettings: (settings: any) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start in loading state for loadUser
    isSubmitting: false,
    error: null,

    login: async (email, password) => {
        set({ isSubmitting: true, error: null });
        try {
            const response = await authService.login(email, password);
            await secureStorage.setAccessToken(response.accessToken);
            await secureStorage.setRefreshToken(response.refreshToken);
            await mmkvStorage.setUser(response.user);
            set({
                user: response.user,
                isAuthenticated: true,
                isSubmitting: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Login failed',
                isSubmitting: false,
            });
            throw error;
        }
    },

    signup: async (email, password, name) => {
        set({ isSubmitting: true, error: null });
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
                isSubmitting: false,
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
                isSubmitting: false,
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

    loadUser: async (forceRefresh = false) => {
        console.log('[AUTH] loadUser start, forceRefresh:', forceRefresh);
        set({ isLoading: true });
        try {
            console.log('[AUTH] Checking for token...');
            const token = await secureStorage.getAccessToken();
            console.log('[AUTH] Has token:', !!token);
            if (token) {
                console.log('[AUTH] Token found, checking cache...');
                const cachedUser = forceRefresh ? null : await mmkvStorage.getUserAsync();
                console.log('[AUTH] Cached user found:', !!cachedUser);
                
                if (cachedUser) {
                    console.log('[AUTH] Using cached user');
                    set({
                        user: cachedUser,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    console.log('[AUTH] No cached user, fetching from API...');
                    const user = await authService.getCurrentUser();
                    console.log('[AUTH] API fetch success');
                    await mmkvStorage.setUser(user);
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                }
            } else {
                console.log('[AUTH] No token, setting authenticated: false');
                set({ isLoading: false, isAuthenticated: false });
            }
        } catch (error) {
            console.error('[AUTH] loadUser CRITICAL ERROR:', error);
            set({ isLoading: false, isAuthenticated: false });
        }
        console.log('[AUTH] loadUser complete');
    },

    updateSettings: async (settings) => {
        set({ isSubmitting: true, error: null });
        try {
            const updatedUser = await authService.updateSettings(settings);
            // Cache user after onboarding completion
            await mmkvStorage.setUser(updatedUser);
            set({
                user: updatedUser,
                isSubmitting: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to update settings',
                isSubmitting: false,
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));

// Register the global 401 handler so expired tokens trigger a proper logout
// from anywhere in the app without the API layer importing the store directly.
setUnauthorizedHandler(() => {
    const { logout } = useAuthStore.getState();
    logout();
});
