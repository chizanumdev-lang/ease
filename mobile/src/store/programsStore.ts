import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Program, DayPlan } from '../types';
import { programsService } from '../services/programs.service';
import { tasksService } from '../services/tasks.service';
import { mmkvStorage } from '../services/storage.service';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/notification.service';

interface ProgramsState {
    currentProgram: Program | null;
    todayPlan: DayPlan | null;
    isLoading: boolean;
    error: string | null;
    syncQueue: Array<{ id: string; type: 'UPDATE'; payload: any }>;

    // Actions
    generateProgram: (
        goalId: string,
        duration?: number,
        options?: {
            minutesPerDay?: number;
            learningStyle?: string;
            constraints?: string[];
        }
    ) => Promise<Program>;
    fetchActiveProgram: () => Promise<Program | void>;
    fetchProgram: (id: string) => Promise<void>;
    fetchTodayPlan: (programId: string) => Promise<void>;
    updateTask: (taskId: string, updates: any) => Promise<void>;
    processSyncQueue: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
    deleteProgram: (programId: string) => Promise<void>;
}

export const useProgramsStore = create<ProgramsState>()(
    persist(
        (set, get) => ({
            currentProgram: null,
            todayPlan: null,
            isLoading: false,
            error: null,
            syncQueue: [],

            generateProgram: async (goalId, duration = 30, options) => {
                set({ isLoading: true, error: null });
                try {
                    const program = await programsService.generateProgram(goalId, duration, options);
                    set({
                        currentProgram: program,
                        isLoading: false,
                    });
                    return program;
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Failed to generate program',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            fetchActiveProgram: async () => {
                set({ isLoading: true, error: null });
                try {
                    const program = await programsService.getActiveProgram();
                    set({
                        currentProgram: program,
                        isLoading: false,
                    });

                    // Also immediately fetch today's plan so tasks are populated
                    try {
                        const todayPlan = await programsService.getTodayPlan(program.id);
                        set({ todayPlan });
                    } catch {
                        // Silently ignore – HomeScreen will show the loading state
                    }

                    // Schedule notifications for today's plan if available
                    if (program && program.dayPlans && program.dayPlans.length > 0) {
                        const currentDayPlan = program.dayPlans[0];
                        if (currentDayPlan) {
                            notificationService.scheduleForDay(currentDayPlan);
                        }
                    }

                    return program;
                } catch (error: any) {
                    // Start of Selection
                    const message = error.response?.data?.message || 'Failed to fetch active program';
                    // If 404, it might mean no active program, which is fine (just clear currentProgram)
                    if (error.response?.status === 404) {
                        set({ currentProgram: null, isLoading: false });
                    } else {
                        set({
                            error: message,
                            isLoading: false,
                        });
                    }
                }
            },

            fetchProgram: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    const program = await programsService.getProgram(id);
                    set({
                        currentProgram: program,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Failed to fetch program',
                        isLoading: false,
                    });
                }
            },

            fetchTodayPlan: async (programId) => {
                set({ isLoading: true, error: null });
                try {
                    const todayPlan = await programsService.getTodayPlan(programId);
                    set({
                        todayPlan,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Failed to fetch today\'s plan',
                        isLoading: false,
                    });
                }
            },

            updateTask: async (taskId, updates) => {
                // Optimistic update
                const { todayPlan, syncQueue } = get();
                if (todayPlan && todayPlan.tasks) {
                    const updatedTasks = todayPlan.tasks.map(t =>
                        t.id === taskId ? { ...t, ...updates } : t
                    );
                    set({ todayPlan: { ...todayPlan, tasks: updatedTasks } });
                }

                const state = await NetInfo.fetch();
                if (state.isConnected) {
                    try {
                        await tasksService.update(taskId, updates);
                    } catch (error) {
                        // If API fails, fallback to queue
                        set(state => ({
                            syncQueue: [...state.syncQueue, { id: taskId, type: 'UPDATE', payload: updates }]
                        }));
                    }
                } else {
                    // Offline: Add to queue
                    set(state => ({
                        syncQueue: [...state.syncQueue, { id: taskId, type: 'UPDATE', payload: updates }]
                    }));
                }
            },

            processSyncQueue: async () => {
                const { syncQueue } = get();
                if (syncQueue.length === 0) return;

                const newQueue = [...syncQueue];
                // Process queue items one by one (or batch if API supported)
                // For simplicity, processed items are removed. Failed ones might stay or retry logic needed.
                // Here we try to clear the queue.

                const remainingQueue: typeof syncQueue = [];

                for (const item of newQueue) {
                    try {
                        if (item.type === 'UPDATE') {
                            await tasksService.update(item.id, item.payload);
                        }
                    } catch (e) {
                        remainingQueue.push(item);
                    }
                }

                set({ syncQueue: remainingQueue });
            },

            clearError: () => set({ error: null }),
            reset: () => set({ currentProgram: null, todayPlan: null, syncQueue: [], error: null, isLoading: false }),

            deleteProgram: async (programId: string) => {
                set({ isLoading: true, error: null });
                try {
                    await programsService.deleteProgram(programId);
                    set({
                        currentProgram: null,
                        todayPlan: null,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Failed to delete program',
                        isLoading: false,
                    });
                    throw error;
                }
            },
        }),
        {
            name: 'programs-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentProgram: state.currentProgram,
                todayPlan: state.todayPlan,
                syncQueue: state.syncQueue
            }),
        }
    )
);
