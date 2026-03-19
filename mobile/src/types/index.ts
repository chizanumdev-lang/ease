export interface User {
    id: string;
    email: string;
    name: string;
    settings?: UserSettings;
    createdAt: string;
}

export interface UserSettings {
    onboardingCompleted?: boolean;
    notifications?: NotificationSettings;
    [key: string]: any;
}

export interface NotificationSettings {
    taskReminders: boolean;
    nightAudio: boolean;
    weeklySummary: boolean;
}

export interface Goal {
    id: string;
    title: string;
    description?: string;
    category?: string;
    targetDate?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Program {
    id: string;
    title: string;
    description?: string;
    duration: number;
    goalId: string;
    userId: string;
    status: string;
    goal?: Goal;
    dayPlans?: DayPlan[];
    createdAt: string;
    updatedAt: string;
}

export interface DayPlan {
    id: string;
    dayNumber: number;
    theme?: string;
    focusAreas?: string[];
    programId: string;
    status: string;
    tasks?: Task[];
    audioTracks?: AudioTrack[];
    quizzes?: Quiz[];
    createdAt: string;
    updatedAt: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    completedAt?: string;
    type?: string;
    duration?: number;
    scheduledAt?: string;
    videoUrl?: string;
    quizId?: string;
    dayPlanId: string;
    createdAt: string;
    updatedAt: string;
}

export interface AudioTrack {
    id: string;
    title: string;
    url: string;
    duration?: number;
    type?: string;
    dayPlanId?: string;
    localUri?: string; // Path to downloaded file
}

export interface Quiz {
    id: string;
    title: string;
    questions: QuizQuestion[];
    dayPlanId: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export interface QuizAttempt {
    id: string;
    answers: number[];
    score: number;
    passed: boolean;
    quizId: string;
    userId: string;
    createdAt: string;
}

export interface Progress {
    id: string;
    checkinDate: string;
    mood?: string;
    notes?: string;
    metrics?: Record<string, any>;
    userId: string;
    createdAt: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

// Navigation types
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};

export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    Onboarding: undefined;
    OnboardingFlow: undefined;
};

export type MainStackParamList = {
    Tabs: undefined;
    GoalWizard: undefined;
    ProgramPreview: { programId: string };
    Task: { task: Task };
    VideoLesson: { task: Task };
    Quiz: { quizId: string; taskId: string };
    AudioPlayer: { track: AudioTrack };
    AudioPreview: undefined;
};

export type TabParamList = {
    Home: undefined;
    Progress: undefined;
    Coach: undefined;
    Settings: undefined;
};

// Analytics types
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: string;
}

export interface DailyCompletion {
    date: string;
    completionRate: number;
}

export interface WeeklyAnalytics {
    currentStreak: number;
    completionRate: number;
    weeklyCompletionRate: number;
    quizAverage: number;
    pointsEarned: number;
    badges: Badge[];
    dailyCompletions: DailyCompletion[];
}
