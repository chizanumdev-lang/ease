import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Program, DayPlan, Task, TaskStatus, TaskMetadata } from '../types';
import { programsService } from '../services/programs.service';
import { tasksService } from '../services/tasks.service';
import { mmkvStorage } from '../services/storage.service';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/notification.service';
import { journalService } from '../services/journalService';
import { useAnalyticsStore } from './analyticsStore';

interface ProgramsState {
    currentProgram: Program | null;
    todayPlan: DayPlan | null;
    isLoading: boolean;
    error: string | null;
    syncQueue: Array<{ id: string; type: 'UPDATE' | 'COMPLETE' | 'SKIP' | 'START'; payload: any }>;

    // Actions
    generateProgram: (
        goalId: string,
        duration?: number,
        options?: {
            minutesPerDay?: number;
            learningStyle?: string;
            constraints?: string[];
            metadata?: any;
        }
    ) => Promise<Program>;
    fetchActiveProgram: () => Promise<Program | void>;
    fetchProgram: (id: string) => Promise<void>;
    fetchTodayPlan: (programId: string) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    fetchPreviewMetadata: (goalId?: string, duration?: number, options?: any) => Promise<any>;
    
    // Task Chain Actions
    startTask: (taskId: string) => Promise<void>;
    completeTask: (taskId: string, metadata?: TaskMetadata) => Promise<void>;
    skipTask: (taskId: string) => Promise<void>;
    
    processSyncQueue: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
    deleteProgram: (programId: string) => Promise<void>;
    loadMockTaskChain: () => void;
}

/**
 * Heuristic to migrate legacy tasks to new schema
 */
const migrateTask = (task: any, index: number, total: number): Task => {
    if (task.status) return task as Task;
    
    let status = TaskStatus.LOCKED;
    if (task.completed) {
        status = TaskStatus.COMPLETED;
    } else if (index === 0) {
        status = TaskStatus.PENDING;
    } else {
        // Simple heuristic: if previous is completed, this is pending
        // But since we can't easily check previous in a map, we'll refine in the store
        status = TaskStatus.LOCKED;
    }

    return {
        ...task,
        status,
        metadata: task.metadata || {},
        order: task.order ?? index,
    } as Task;
};

export const useProgramsStore = create<ProgramsState>()(
    persist(
        (set, get) => ({
            currentProgram: null,
            todayPlan: null,
            isLoading: true,
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

            fetchPreviewMetadata: async (goalId, duration = 30, options) => {
                set({ isLoading: true, error: null });
                console.log('[Store] Fetching preview metadata:', { goalId, duration, ...options });
                try {
                    // Aligning arguments with the new backend DTO structure
                    const preview = await programsService.getProgramPreview(goalId, duration, options);
                    set({ isLoading: false });
                    return preview;
                } catch (error: any) {
                    console.error('[Store] Preview fetch failed:', error.response?.data || error.message);
                    set({
                        error: error.response?.data?.message?.[0] || error.response?.data?.message || 'Failed to fetch preview',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            fetchActiveProgram: async () => {
                set({ isLoading: true, error: null });
                try {
                    const program = await programsService.getActiveProgram();
                    
                    if (program) {
                        set({ currentProgram: program });
                        await get().fetchTodayPlan(program.id);
                    } else {
                        set({ currentProgram: null, todayPlan: null });
                    }
                    
                    set({ isLoading: false });
                    return program;
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        set({ currentProgram: null, isLoading: false });
                    } else {
                        set({
                            error: error.response?.data?.message || 'Failed to fetch active program',
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
                // Guard: skip if programId looks like a mock/seed ID
                if (!programId || programId.startsWith('mock-')) {
                    console.warn('[ProgramsStore] Skipping fetchTodayPlan for mock ID:', programId);
                    set({ currentProgram: null, todayPlan: null, isLoading: false });
                    return;
                }

                set({ isLoading: true, error: null });
                try {
                    const todayPlan = await programsService.getTodayPlan(programId);
                    
                    // Migrate tasks to new schema — but preserve any statuses already set
                    // locally (e.g. SKIPPED or COMPLETED) so polling doesn't re-lock tasks
                    // that the user has already interacted with.
                    if (todayPlan && todayPlan.tasks) {
                        const existingStatuses = new Map(
                            (get().todayPlan?.tasks ?? []).map(t => [t.id, t.status])
                        );
                        
                        // 1. Sort by order first so migrateTask logic (index-based) is consistent
                        const sortedTasks = [...todayPlan.tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                        
                        let prevCompleted = true;
                        todayPlan.tasks = sortedTasks.map((t, idx) => {
                            const task = migrateTask(t, idx, sortedTasks.length);
                            // If we already have a richer local status, keep it
                            const localStatus = existingStatuses.get(task.id);
                            if (localStatus && localStatus !== TaskStatus.LOCKED) {
                                task.status = localStatus;
                            } else if (prevCompleted && task.status === TaskStatus.LOCKED) {
                                task.status = TaskStatus.PENDING;
                            }
                            prevCompleted = task.status === TaskStatus.COMPLETED || task.status === TaskStatus.SKIPPED;
                            return task;
                        });
                    }

                    set({ todayPlan, isLoading: false });
                    
                    // Schedule notifications for the new plan
                    if (todayPlan) {
                        const { morningRitualTime, nightRitualTime } = (require('./audioStore').useAudioStore).getState();
                        notificationService.scheduleForDay(todayPlan, {
                            morning: morningRitualTime,
                            night: nightRitualTime
                        });
                    }
                } catch (error: any) {
                    const status = error.response?.status;
                    if (status === 404 || status === 500) {
                        // Plan doesn't exist or server error for this program — clear stale state
                        console.warn('[ProgramsStore] fetchTodayPlan failed with', status, '— clearing stale program');
                        set({ currentProgram: null, todayPlan: null, isLoading: false, error: null });
                    } else {
                        set({
                            error: error.response?.data?.message || "Failed to fetch today's plan",
                            isLoading: false,
                        });
                    }
                }
            },

            updateTask: async (taskId, updates) => {
                const { todayPlan } = get();
                if (!todayPlan || !todayPlan.tasks) return;

                const updatedTasks = todayPlan.tasks.map(t =>
                    t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                );
                set({ todayPlan: { ...todayPlan, tasks: updatedTasks } });

                // Strip frontend-only fields before syncing — backend DTO only accepts
                // completed, scheduledAt, content, watchedSeconds, totalDuration
                const { status: _s, metadata: _m, ...apiPayload } = updates as any;

                // Only call the API if there's something the backend cares about
                if (Object.keys(apiPayload).length > 0) {
                    const netState = await NetInfo.fetch();
                    if (netState.isConnected) {
                        try {
                            await tasksService.update(taskId, apiPayload);
                        } catch {
                            set(state => ({
                                syncQueue: [...state.syncQueue, { id: taskId, type: 'UPDATE', payload: apiPayload }]
                            }));
                        }
                    } else {
                        set(state => ({
                            syncQueue: [...state.syncQueue, { id: taskId, type: 'UPDATE', payload: apiPayload }]
                        }));
                    }
                }
            },

            startTask: async (taskId) => {
                const { todayPlan } = get();
                if (!todayPlan || !todayPlan.tasks) return;

                const task = todayPlan.tasks.find(t => t.id === taskId);
                if (!task || task.status === TaskStatus.LOCKED) return;

                await get().updateTask(taskId, { status: TaskStatus.IN_PROGRESS });
            },

            completeTask: async (taskId: string, metadata?: TaskMetadata) => {
                const { todayPlan, syncQueue } = get();
                if (!todayPlan || !todayPlan.tasks) return;

                // Encryption logic for Journal entries
                let finalMetadata = { ...metadata };
                if (metadata?.journalEntry) {
                    try {
                        const encrypted = await journalService.encrypt(metadata.journalEntry);
                        finalMetadata.journalEntry = encrypted;
                    } catch (e) {
                        console.error("Encryption failed in store", e);
                    }
                }

                const taskIndex = todayPlan.tasks.findIndex(t => t.id === taskId);
                if (taskIndex === -1) return;

                const task = todayPlan.tasks[taskIndex];
                const updatedTasks = [...todayPlan.tasks];
                
                // Mark current task completed
                updatedTasks[taskIndex] = {
                    ...task,
                    status: TaskStatus.COMPLETED,
                    metadata: { ...task.metadata, ...finalMetadata },
                    updatedAt: new Date().toISOString()
                };

                // Unlock next task if this was a dependency
                const nextTaskId = task.next_task_id || updatedTasks[taskIndex + 1]?.id;
                const nextTaskIndex = updatedTasks.findIndex(t => t.id === nextTaskId);
                
                if (nextTaskIndex !== -1 && updatedTasks[nextTaskIndex].status === TaskStatus.LOCKED) {
                    updatedTasks[nextTaskIndex] = {
                        ...updatedTasks[nextTaskIndex],
                        status: TaskStatus.PENDING
                    };
                }

                // Auto-start the next pending task for "Circuit Flow" feel
                const firstPendingIndex = updatedTasks.findIndex(t => t.status === TaskStatus.PENDING);
                if (firstPendingIndex !== -1) {
                    updatedTasks[firstPendingIndex].status = TaskStatus.IN_PROGRESS;
                }

                set({ todayPlan: { ...todayPlan, tasks: updatedTasks } });

                // Sync — translate frontend status to backend's completed boolean
                const state = await NetInfo.fetch();
                const payload = { completed: true };
                if (state.isConnected) {
                    try {
                        await tasksService.update(taskId, payload);
                        useAnalyticsStore.getState().fetchAnalytics();
                    } catch {
                        set(state => ({
                            syncQueue: [...state.syncQueue, { id: taskId, type: 'COMPLETE', payload }]
                        }));
                    }
                } else {
                    set(state => ({
                        syncQueue: [...state.syncQueue, { id: taskId, type: 'COMPLETE', payload }]
                    }));
                }
            },

            skipTask: async (taskId) => {
                const { todayPlan } = get();
                if (!todayPlan || !todayPlan.tasks) return;

                const taskIndex = todayPlan.tasks.findIndex(t => t.id === taskId);
                if (taskIndex === -1) return;

                const task = todayPlan.tasks[taskIndex];
                const updatedTasks = [...todayPlan.tasks];
                
                updatedTasks[taskIndex] = {
                    ...task,
                    status: TaskStatus.SKIPPED,
                    updatedAt: new Date().toISOString()
                };

                // Unlock next task
                const nextTaskId = task.next_task_id || updatedTasks[taskIndex + 1]?.id;
                const nextTaskIndex = updatedTasks.findIndex(t => t.id === nextTaskId);
                
                if (nextTaskIndex !== -1 && updatedTasks[nextTaskIndex].status === TaskStatus.LOCKED) {
                    updatedTasks[nextTaskIndex] = {
                        ...updatedTasks[nextTaskIndex],
                        status: TaskStatus.PENDING
                    };
                }

                // Auto-start the next pending
                const firstPendingIndex = updatedTasks.findIndex(t => t.status === TaskStatus.PENDING);
                if (firstPendingIndex !== -1) {
                    updatedTasks[firstPendingIndex].status = TaskStatus.IN_PROGRESS;
                }

                set({ todayPlan: { ...todayPlan, tasks: updatedTasks } });

                // Sync — send completed:true so skip is persisted (skip is dev-only,
                // treating it as a completion is intentional so it survives re-fetches)
                const state = await NetInfo.fetch();
                const payload = { completed: true };
                if (state.isConnected) {
                    try {
                        await tasksService.update(taskId, payload);
                        useAnalyticsStore.getState().fetchAnalytics();
                    } catch {
                        set(state => ({
                            syncQueue: [...state.syncQueue, { id: taskId, type: 'SKIP', payload }]
                        }));
                    }
                } else {
                    set(state => ({
                        syncQueue: [...state.syncQueue, { id: taskId, type: 'SKIP', payload }]
                    }));
                }
            },

            processSyncQueue: async () => {
                const { syncQueue } = get();
                if (syncQueue.length === 0) return;

                const remainingQueue: typeof syncQueue = [];
                for (const item of syncQueue) {
                    try {
                        await tasksService.update(item.id, item.payload);
                    } catch (e) {
                        remainingQueue.push(item);
                    }
                }
                set({ syncQueue: remainingQueue });
            },

            clearError: () => set({ error: null }),
            reset: () => {
                notificationService.cancelAll();
                set({ currentProgram: null, todayPlan: null, syncQueue: [], error: null, isLoading: false });
            },

            deleteProgram: async (programId: string) => {
                if (programId.startsWith('mock-')) {
                    get().reset();
                    return;
                }

                set({ isLoading: true, error: null });
                try {
                    await programsService.deleteProgram(programId);
                    notificationService.cancelAll();
                    set({ currentProgram: null, todayPlan: null, isLoading: false, error: null });
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Failed to delete program',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            loadMockTaskChain: () => {
                import('../mocks/taskChainMock').then(({ MOCK_CIRCUIT_PROGRAM, MOCK_CIRCUIT_DAY_PLAN }) => {
                    set({
                        currentProgram: MOCK_CIRCUIT_PROGRAM,
                        todayPlan: MOCK_CIRCUIT_DAY_PLAN,
                        isLoading: false,
                        error: null
                    });
                });
            },

        }),
        {
            name: 'programs-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Do NOT persist currentProgram or todayPlan — they are always fetched fresh from the
                // server on login. Persisting them causes stale/mock IDs to trigger real API calls.
                syncQueue: state.syncQueue
            }),
        }
    )
);
