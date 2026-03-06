export const API_BASE_URL = 'https://uninvective-scarcely-yessenia.ngrok-free.dev/api';

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
