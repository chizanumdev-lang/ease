import { create } from 'zustand';
import { analyticsService } from '../services/analytics.service';
import { WeeklyAnalytics } from '../types';

interface AnalyticsState {
    analytics: WeeklyAnalytics | null;
    isLoading: boolean;
    error: string | null;
    fetchAnalytics: () => Promise<void>;
    clearAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
    analytics: null,
    isLoading: false,
    error: null,

    fetchAnalytics: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await analyticsService.getWeeklyAnalytics();
            set({ analytics: data, isLoading: false });
        } catch (error: any) {
            set({ 
                error: error.message || 'Failed to fetch analytics', 
                isLoading: false 
            });
        }
    },

    clearAnalytics: () => {
        set({ analytics: null, error: null, isLoading: false });
    },
}));
