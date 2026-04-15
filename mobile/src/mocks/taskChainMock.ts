import { DayPlan, Program, Task, TaskStatus, TaskType } from '../types';

const MOCK_PROGRAM_ID = 'mock-focus-program-001';
const MOCK_DAY_PLAN_ID = 'mock-day-1-plan';

export const MOCK_CIRCUIT_TASKS: Task[] = [
    {
        id: 'task-1-video',
        title: 'The Science of High-Flow Focus',
        description: 'Understand the neurochemistry of deep work and how to trigger flow states on demand.',
        status: TaskStatus.PENDING,
        completed: false,
        type: 'video' as TaskType,
        videoUrl: 'https://www.youtube.com/watch?v=yovLbeG69j0', // Using a valid Cal Newport video on Focus
        order: 0,
        duration: 12,
        dayPlanId: MOCK_DAY_PLAN_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        next_task_id: 'task-2-audio'
    },
    {
        id: 'task-2-audio',
        title: 'Binaural Focus Frequency',
        description: 'A 40Hz Gamma wave session designed to sharpen your cognitive clarity.',
        status: TaskStatus.LOCKED,
        completed: false,
        type: 'audio' as TaskType,
        metadata: {
            externalLink: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Placeholder manageable audio
            audioPosition: 0
        },
        order: 1,
        duration: 8,
        dayPlanId: MOCK_DAY_PLAN_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dependency_task_id: 'task-1-video',
        next_task_id: 'task-3-consistency'
    },
    {
        id: 'task-3-consistency',
        title: 'Tomorrow\'s Focus Commitment',
        description: 'Consistency is the bedrock of habit. Lock in your session for tomorrow morning.',
        status: TaskStatus.LOCKED,
        completed: false,
        type: 'consistency' as TaskType,
        order: 2,
        duration: 2,
        dayPlanId: MOCK_DAY_PLAN_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dependency_task_id: 'task-2-audio',
        next_task_id: 'task-4-journal'
    },
    {
        id: 'task-4-journal',
        title: 'Morning Mental Clear-out',
        description: 'Externalize your distractions and set clear intentions for your deep work block.',
        status: TaskStatus.LOCKED,
        completed: false,
        type: 'journal' as TaskType,
        order: 3,
        duration: 5,
        dayPlanId: MOCK_DAY_PLAN_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dependency_task_id: 'task-3-consistency',
        next_task_id: 'task-5-reflection'
    },
    {
        id: 'task-5-reflection',
        title: 'Post-Session Flow Audit',
        description: 'Quick check-in on your focus levels and perceived cognitive load.',
        status: TaskStatus.LOCKED,
        completed: false,
        type: 'reflection' as TaskType,
        order: 4,
        duration: 3,
        dayPlanId: MOCK_DAY_PLAN_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dependency_task_id: 'task-4-journal'
    }
];

export const MOCK_CIRCUIT_DAY_PLAN: DayPlan = {
    id: MOCK_DAY_PLAN_ID,
    dayNumber: 1,
    theme: 'Foundational Clarity',
    focusAreas: ['Deep Work', 'Neuroplasticity', 'Habit Stacking'],
    programId: MOCK_PROGRAM_ID,
    status: 'active',
    tasks: MOCK_CIRCUIT_TASKS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const MOCK_CIRCUIT_PROGRAM: Program = {
    id: MOCK_PROGRAM_ID,
    title: 'Advanced Focus Architecture',
    description: 'A 30-day masterclass in cognitive optimization and distraction-free living.',
    duration: 30,
    goalId: 'goal-focus-001',
    userId: 'user-001',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};
