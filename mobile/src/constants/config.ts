const ENV = process.env.EXPO_PUBLIC_ENV || 'local';
const LOCAL_URL = process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://localhost:3000/api';
const STAGING_URL = process.env.EXPO_PUBLIC_API_URL_STAGING || 'http://173.212.248.253:3005/api';

export const API_BASE_URL = ENV === 'staging' ? STAGING_URL : LOCAL_URL;

export const API_ENDPOINTS = {
    // Auth
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',

    // User
    ME: '/me',
    UPDATE_SETTINGS: '/me/settings',

    // Goals
    GOALS: '/goals',
    DELETE_GOAL: (id: string) => `/goals/${id}`,

    // Programs
    GENERATE_PROGRAM: '/programs/generate',
    ACTIVE_PROGRAM: '/programs/active',
    PREVIEW: '/programs/preview',
    PROGRAM: (id: string) => `/programs/${id}`,
    TODAY_PLAN: (id: string) => `/programs/${id}/today`,

    // Tasks
    UPDATE_TASK: (id: string) => `/tasks/${id}`,

    // Quizzes
    SUBMIT_QUIZ: (id: string) => `/quizzes/${id}/attempts`,

    // Progress
    CHECKIN: '/progress/checkin',

    // Audio Test
    AUDIO_PREVIEW: '/audio/preview',
    AUDIO_BINAURAL_PREVIEW: '/audio/preview-binaural',
    AUDIO_IMMERSIVE_TEST: '/audio/test-immersive',
};

export const BACKGROUND_AUDIO = {
    ambient: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3',
    focus: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045885/ease/backgrounds/focus.mp3',
    meditation: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045929/ease/backgrounds/meditation.mp3',
};

export const STATIC_BINAURAL_BEATS = {
    4: 'https://res.cloudinary.com/duooultxc/video/upload/v1774276955/ease/audio/static_binaural_4hz.mp3',
    6: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269228/ease/audio/static_binaural_6hz.mp3',
    10: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269306/ease/audio/static_binaural_10hz.mp3',
    15: 'https://res.cloudinary.com/duooultxc/video/upload/v1774277400/ease/audio/static_binaural_15hz.mp3',
    20: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269382/ease/audio/static_binaural_20hz.mp3',
};
