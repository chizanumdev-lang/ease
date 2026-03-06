import { create } from 'zustand';
import { Goal } from '../types';
import { goalsService } from '../services/goals.service';
import { mmkvStorage } from '../services/storage.service';

interface GoalsState {
    goals: Goal[];
    selectedGoal: Goal | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchGoals: () => Promise<void>;
    createGoal: (data: {
        title: string;
        description?: string;
        category?: string;
        targetDate?: string;
    }) => Promise<Goal>;
    deleteGoal: (id: string) => Promise<void>;
    selectGoal: (goal: Goal | null) => void;
    clearError: () => void;
    reset: () => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
    goals: [],
    selectedGoal: null,
    isLoading: false,
    error: null,

    fetchGoals: async () => {
        set({ isLoading: true, error: null });
        try {
            const goals = await goalsService.getGoals();
            set({ goals, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch goals',
                isLoading: false,
            });
        }
    },

    createGoal: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const goal = await goalsService.createGoal(data);
            set((state) => ({
                goals: [...state.goals, goal],
                isLoading: false,
            }));
            return goal;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to create goal',
                isLoading: false,
            });
            throw error;
        }
    },

    deleteGoal: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await goalsService.deleteGoal(id);
            set((state) => ({
                goals: state.goals.filter((g) => g.id !== id),
                selectedGoal: state.selectedGoal?.id === id ? null : state.selectedGoal,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to delete goal',
                isLoading: false,
            });
            throw error;
        }
    },

    selectGoal: (goal) => set({ selectedGoal: goal }),

    clearError: () => set({ error: null }),

    reset: () => set({ goals: [], selectedGoal: null, isLoading: false, error: null }),
}));
