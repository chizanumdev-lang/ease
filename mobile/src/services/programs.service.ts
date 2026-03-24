import api from './api';
import { API_ENDPOINTS } from '../constants/config';
import { Program, DayPlan } from '../types';
import { mmkvStorage } from './storage.service';

export const programsService = {
    async generateProgram(
        goalId: string,
        duration: number = 30,
        options?: {
            minutesPerDay?: number;
            learningStyle?: string;
            constraints?: string[];
        }
    ): Promise<Program> {
        const response = await api.post<Program>(API_ENDPOINTS.GENERATE_PROGRAM, {
            goalId,
            duration,
            ...options
        });
        mmkvStorage.setCurrentProgram(response.data);
        return response.data;
    },

    async getActiveProgram(): Promise<Program> {
        const response = await api.get<Program>(API_ENDPOINTS.ACTIVE_PROGRAM);
        mmkvStorage.setCurrentProgram(response.data);
        return response.data;
    },

    async getProgram(id: string): Promise<Program> {
        const response = await api.get<Program>(API_ENDPOINTS.PROGRAM(id));
        return response.data;
    },

    async getTodayPlan(programId: string): Promise<DayPlan> {
        const response = await api.get<DayPlan>(API_ENDPOINTS.TODAY_PLAN(programId));
        return response.data;
    },

    async deleteProgram(id: string): Promise<void> {
        await api.delete(API_ENDPOINTS.PROGRAM(id));
        mmkvStorage.setCurrentProgram(null);
    },

    async generateAudioPreview(theme: string, mood: string): Promise<{ url: string }> {
        const response = await api.post<{ url: string }>(API_ENDPOINTS.AUDIO_PREVIEW, {
            theme,
            mood
        });
        return response.data;
    },

    async generateBinauralPreview(frequency: number): Promise<{ url: string }> {
        const response = await api.post<{ url: string }>(API_ENDPOINTS.AUDIO_BINAURAL_PREVIEW, {
            frequency
        });
        return response.data;
    },
};
