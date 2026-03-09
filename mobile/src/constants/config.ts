export const API_BASE_URL = 'https://ease-amber.vercel.app/api';

export const API_ENDPOINTS = {
    // Auth
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',

    // User
    ME: '/me',
    UPDATE_SETTINGS: '/me/settings',

    // Goals
    GOALS: '/goals',
    DELETE_GOAL: (id: string) => `/goals/${id}`,

    // Programs
    GENERATE_PROGRAM: '/programs/generate',
    ACTIVE_PROGRAM: '/programs/active',
    PROGRAM: (id: string) => `/programs/${id}`,
    TODAY_PLAN: (id: string) => `/programs/${id}/today`,

    // Tasks
    UPDATE_TASK: (id: string) => `/tasks/${id}`,

    // Quizzes
    SUBMIT_QUIZ: (id: string) => `/quizzes/${id}/attempts`,

    // Progress
    CHECKIN: '/progress/checkin',
};

export const BACKGROUND_AUDIO = {
    ambient: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3',
    focus: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045885/ease/backgrounds/focus.mp3',
    meditation: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045929/ease/backgrounds/meditation.mp3',
};
