import api from './api';
import { API_ENDPOINTS } from '../constants/config';
import { Goal } from '../types';
import { mmkvStorage } from './storage.service';

export const goalsService = {
    async createGoal(data: {
        title: string;
        description?: string;
        category?: string;
        targetDate?: string;
    }): Promise<Goal> {
        const response = await api.post<Goal>(API_ENDPOINTS.GOALS, data);
        return response.data;
    },

    async getGoals(): Promise<Goal[]> {
        const response = await api.get<Goal[]>(API_ENDPOINTS.GOALS);
        mmkvStorage.setGoals(response.data);
        return response.data;
    },

    async deleteGoal(id: string): Promise<void> {
        await api.delete(API_ENDPOINTS.DELETE_GOAL(id));
    },
};
