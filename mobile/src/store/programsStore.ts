import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Program, DayPlan, Task, TaskStatus, TaskMetadata } from '../types';
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
    syncQueue: Array<{ id: string; type: 'UPDATE' | 'COMPLETE' | 'SKIP' | 'START'; payload: any }>;

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
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    
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

                    if (program) {
                        await get().fetchTodayPlan(program.id);
                    }

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
                set({ isLoading: true, error: null });
                try {
                    const todayPlan = await programsService.getTodayPlan(programId);
                    
                    // Migrate tasks to new schema
                    if (todayPlan && todayPlan.tasks) {
                        let prevCompleted = true;
                        todayPlan.tasks = todayPlan.tasks.map((t, idx) => {
                            const task = migrateTask(t, idx, todayPlan.tasks!.length);
                            if (prevCompleted && task.status === TaskStatus.LOCKED) {
                                task.status = TaskStatus.PENDING;
                            }
                            prevCompleted = task.status === TaskStatus.COMPLETED || task.status === TaskStatus.SKIPPED;
                            return task;
                        });
                    }

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
                const { todayPlan } = get();
                if (!todayPlan || !todayPlan.tasks) return;

                const updatedTasks = todayPlan.tasks.map(t =>
                    t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                );
                set({ todayPlan: { ...todayPlan, tasks: updatedTasks } });

                const state = await NetInfo.fetch();
                if (state.isConnected) {
                    try {
                        await tasksService.update(taskId, updates);
                    } catch {
                        set(state => ({
                            syncQueue: [...state.syncQueue, { id: taskId, type: 'UPDATE', payload: updates }]
                        }));
                    }
                } else {
                    set(state => ({
                        syncQueue: [...state.syncQueue, { id: taskId, type: 'UPDATE', payload: updates }]
                    }));
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
                        const { journalService } = await import('../services/journalService');
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

                // Sync
                const state = await NetInfo.fetch();
                const payload = { status: TaskStatus.COMPLETED, metadata: finalMetadata };
                if (state.isConnected) {
                    try {
                        await tasksService.update(taskId, payload);
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

                // Sync
                const state = await NetInfo.fetch();
                const payload = { status: TaskStatus.SKIPPED };
                if (state.isConnected) {
                    try {
                        await tasksService.update(taskId, payload);
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
            reset: () => set({ currentProgram: null, todayPlan: null, syncQueue: [], error: null, isLoading: false }),

            deleteProgram: async (programId: string) => {
                set({ isLoading: true, error: null });
                try {
                    await programsService.deleteProgram(programId);
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
                currentProgram: state.currentProgram,
                todayPlan: state.todayPlan,
                syncQueue: state.syncQueue
            }),
        }
    )
);
