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
    metadata?: any;
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

export enum TaskStatus {
    LOCKED = 'locked',           // Dependency not met
    PENDING = 'pending',         // Ready to start
    IN_PROGRESS = 'in_progress', // User engaged
    COMPLETED = 'completed',     // Successfully finished
    FAILED = 'failed',           // Did not meet criteria
    SKIPPED = 'skipped',         // User moved past it
}

export type TaskType = 
    | 'video' 
    | 'quiz' 
    | 'audio' 
    | 'micro-app' 
    | 'reflection' 
    | 'journal' 
    | 'consistency';

export interface TaskMetadata {
    videoTimestamp?: number;
    quizScore?: number;
    quizAttempts?: number;
    audioPosition?: number;
    reflectionAnswers?: Record<string, string>;
    journalEntry?: string; // Encrypted content
    microAppResult?: string;
    reflectionRating?: number;
    reflectionMood?: string;
    consistencyConfirmed?: boolean;
    timerDuration?: number;
    externalLink?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    completed: boolean; // Keeping for legacy/compatibility
    completedAt?: string;
    type: TaskType;
    duration?: number;
    watchedSeconds?: number;
    totalDuration?: number;
    content?: string;
    scheduledAt?: string;
    videoUrl?: string;
    quizId?: string;
    dayPlanId: string;
    metadata?: TaskMetadata;
    dependency_task_id?: string;
    next_task_id?: string;
    order: number;
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
    Welcome: undefined;
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
    Settings: undefined;
};

export type TabParamList = {
    Home: undefined;
    Progress: undefined;
    Coach: undefined;
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

export interface PhaseInfo {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    levelRange: string;
}

export interface JourneyPhase extends PhaseInfo {
    unlocked: boolean;
    active: boolean;
}

export interface ProgressionData {
    level: number;
    totalXp: number;
    currentLevelXp: number;
    nextLevelXp: number;
    progressPercentage: number;
    currentPhase: PhaseInfo;
    journey: JourneyPhase[];
}

export interface WeeklyAnalytics {
    currentStreak: number;
    completionRate: number;
    weeklyCompletionRate: number;
    quizAverage: number;
    pointsEarned: number;
    badges: Badge[];
    dailyCompletions: DailyCompletion[];
    progression: ProgressionData;
}
