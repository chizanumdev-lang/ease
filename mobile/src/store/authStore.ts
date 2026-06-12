import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth.service';
import { secureStorage, mmkvStorage } from '../services/storage.service';
import { supabase } from '../services/supabase';
import { useProgramsStore } from './programsStore';
import { useGoalsStore } from './goalsStore';
import { useAudioStore } from './audioStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from '../services/api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;    // For initial app load
    isSubmitting: boolean; // For auth actions
    error: string | null;
    requiresConfirmation: boolean; // True if user signed up but hasn't confirmed email

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
    isLoading: true,
    isSubmitting: false,
    error: null,
    requiresConfirmation: false,

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
                requiresConfirmation: false,
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

            if (response.requiresConfirmation) {
                // Email confirmation required — don't set isAuthenticated yet
                set({
                    isSubmitting: false,
                    requiresConfirmation: true,
                    user: {
                        id: response.user?.id ?? '',
                        email: response.user?.email ?? email,
                        name: response.user?.name ?? name,
                        settings: {},
                        createdAt: new Date().toISOString(),
                    },
                });
                console.log('[AUTH] Confirmation email sent — awaiting verification');
                return;
            }

            // No confirmation required (dev/local with disable_signup_confirmation)
            if (response.accessToken) {
                await secureStorage.setAccessToken(response.accessToken);
                await secureStorage.setRefreshToken(response.refreshToken!);
            }

            set({
                user: {
                    id: (response.user as any)?.id ?? '',
                    email: (response.user as any)?.email ?? email,
                    name: (response.user as any)?.name ?? name,
                    createdAt: (response.user as any)?.createdAt ?? new Date().toISOString(),
                    settings: {
                        notifications: {
                            taskReminders: true,
                            nightAudio: true,
                            weeklySummary: true,
                        },
                    },
                },
                isAuthenticated: !!response.accessToken,
                isSubmitting: false,
                requiresConfirmation: false,
            });
        } catch (error: any) {
            console.error('[AUTH] Signup failed:', error);
            let errorMessage = 'Signup failed';

            if (error.response) {
                errorMessage = error.response.data?.message || 'Signup failed';
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else {
                errorMessage = error.message || 'Something went wrong';
            }

            set({ error: errorMessage, isSubmitting: false });
            throw error;
        }
    },

    logout: async () => {
        await authService.logout();
        useProgramsStore.getState().reset();
        useGoalsStore.getState().reset();
        useAudioStore.getState().reset();
        await AsyncStorage.multiRemove([
            'programs-storage',
            'goals-storage',
            'audio-storage',
        ]);
        set({
            user: null,
            isAuthenticated: false,
            error: null,
            requiresConfirmation: false,
        });
    },

    loadUser: async (forceRefresh = false) => {
        console.log('[AUTH] loadUser start, forceRefresh:', forceRefresh);
        set({ isLoading: true });
        try {
            // First check Supabase session (auto-refreshes if needed)
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                console.log('[AUTH] Supabase session found, syncing tokens...');
                await secureStorage.setAccessToken(session.access_token);
                await secureStorage.setRefreshToken(session.refresh_token);

                const cachedUser = forceRefresh ? null : await mmkvStorage.getUserAsync();
                if (cachedUser) {
                    console.log('[AUTH] Using cached user');
                    set({ user: cachedUser, isAuthenticated: true, isLoading: false });
                } else {
                    console.log('[AUTH] Fetching user from API...');
                    const user = await authService.getCurrentUser();
                    await mmkvStorage.setUser(user);
                    set({ user, isAuthenticated: true, isLoading: false });
                }
            } else {
                // Fallback: check our own stored token (in case Supabase client lost state)
                const token = await secureStorage.getAccessToken();
                if (token) {
                    const cachedUser = forceRefresh ? null : await mmkvStorage.getUserAsync();
                    if (cachedUser) {
                        set({ user: cachedUser, isAuthenticated: true, isLoading: false });
                    } else {
                        const user = await authService.getCurrentUser();
                        await mmkvStorage.setUser(user);
                        set({ user, isAuthenticated: true, isLoading: false });
                    }
                } else {
                    console.log('[AUTH] No session, setting authenticated: false');
                    set({ isLoading: false, isAuthenticated: false });
                }
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
            await mmkvStorage.setUser(updatedUser);
            set({ user: updatedUser, isSubmitting: false });
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

// Register the global 401 handler
setUnauthorizedHandler(() => {
    const { logout } = useAuthStore.getState();
    logout();
});
