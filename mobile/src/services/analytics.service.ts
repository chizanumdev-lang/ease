import api from './api';
import { WeeklyAnalytics } from '../types';

export const analyticsService = {
    async getWeeklyAnalytics(): Promise<WeeklyAnalytics> {
        const response = await api.get<WeeklyAnalytics>('/analytics/weekly');
        return response.data;
    },
};
