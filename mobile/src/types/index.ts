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
    showFloatingBubble?: boolean;
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
    masteryScore?: number;
    competenceLevel?: string;
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
    masteryScore?: number;
    competenceLevel?: string;
    todayRings?: {
        morning: boolean;
        tasks: boolean;
        night: boolean;
    };
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
    
    // Orchestration Fields
    pattern?: string;      // 'vocal-test', 'spaced-recall', etc.
    targetScript?: string; // Script for vocal tests
    translation?: string;  // Translation for vocal tests
    cards?: { front: string; back: string }[]; // For spaced-recall
    
    // Audio task fields
    audioUrl?: string;    // URL to the generated TTS audio file
    subtype?: string;     // e.g. 'guided', 'binaural', 'ambient'
    script?: string;      // TTS script used to generate the audio
    mood?: string;        // Audio mood: 'focus' | 'meditation' | 'ambient'
    
    // Vocal Test specific
    vocalScore?: number;
    locale?: string;
    feedback?: string;
    mistakes?: {
        word: string;
        correctionLabel?: string;
        feedback: string;
    }[];
    
    // Pattern Specific
    stepsCompleted?: number;
    messagesCount?: number;
    durationSeconds?: number;
    persona?: string;
    selection?: string;
    correct?: boolean;

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
    artwork?: string;
    artist?: string;
    duration?: number;
    type?: string;
    dayPlanId?: string;
    localUri?: string; // Path to downloaded file
    metadata?: any;
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
    accessToken: string | null;
    refreshToken: string | null;
    requiresConfirmation?: boolean;
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
    VerifyEmail: { email: string };
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
    TaskLab: undefined;
    TaskPreview: { 
        pattern: string; 
        mobileType: string;
        title: string;
    };
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
    unlockedAtLevel: number;
}

export interface JourneyPhase extends PhaseInfo {
    unlocked: boolean;
    active: boolean;
}

export interface WeeklyAnalytics {
    completionRate: number;
    todayCompletionRate: number;
    weeklyCompletionRate: number;
    quizAverage: number;
    badges: Badge[];
    dailyCompletions: DailyCompletion[];
    streak?: { current: number; max: number; };
}
