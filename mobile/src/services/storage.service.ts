import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Keys
const KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
    GOALS: 'goals',
    CURRENT_PROGRAM: 'current_program',
};

// Secure storage for tokens
export const secureStorage = {
    async setAccessToken(token: string) {
        await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
    },

    async getAccessToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    },

    async setRefreshToken(token: string) {
        await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
    },

    async getRefreshToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    },

    async clearTokens() {
        await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    },
};

// AsyncStorage for app data (compatible with Expo Go)
export const mmkvStorage = {
    async setUser(user: any) {
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    },

    getUser(): any | null {
        // Synchronous version for compatibility
        return null; // Will be loaded async
    },

    async getUserAsync(): Promise<any | null> {
        const user = await AsyncStorage.getItem(KEYS.USER);
        return user ? JSON.parse(user) : null;
    },

    async setGoals(goals: any[]) {
        await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    },

    async getGoals(): Promise<any[]> {
        const goals = await AsyncStorage.getItem(KEYS.GOALS);
        return goals ? JSON.parse(goals) : [];
    },

    async setCurrentProgram(program: any) {
        await AsyncStorage.setItem(KEYS.CURRENT_PROGRAM, JSON.stringify(program));
    },

    async getCurrentProgram(): Promise<any | null> {
        const program = await AsyncStorage.getItem(KEYS.CURRENT_PROGRAM);
        return program ? JSON.parse(program) : null;
    },

    async clearAll() {
        await AsyncStorage.clear();
    },
};
